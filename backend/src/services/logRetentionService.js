import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const RETENTION_DAYS = 30;
const CYCLE_SECONDS = RETENTION_DAYS * 86400; // 30 days

/**
 * Get setting value from system_settings
 */
export function getSystemSetting(key, fallback = null) {
  try {
    const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
    return row ? row.value : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Upsert setting into system_settings
 */
export function setSystemSetting(key, value) {
  try {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, String(value), now);
  } catch (e) {
    console.error(`[LogRetention] Error setting '${key}':`, e.message);
  }
}

/**
 * Get or initialize user's individual 30-day retention cycle start
 */
export function getUserCycleStart(userId) {
  const now = Math.floor(Date.now() / 1000);
  try {
    const account = db.prepare('SELECT id, created_at, log_cycle_start FROM accounts WHERE id = ?').get(userId);
    if (!account) return now;

    if (!account.log_cycle_start || account.log_cycle_start <= 0) {
      // New user starts today (Day 1 of 30)
      db.prepare('UPDATE accounts SET log_cycle_start = ? WHERE id = ?').run(now, userId);
      return now;
    }
    return account.log_cycle_start;
  } catch (e) {
    return now;
  }
}

/**
 * Compute user-specific retention status (Individual 30-day timeline)
 */
export function getUserRetentionStatus(userId) {
  const now = Math.floor(Date.now() / 1000);
  const account = db.prepare('SELECT id, username, role, created_at, log_cycle_start FROM accounts WHERE id = ?').get(userId);
  if (!account) {
    return getRetentionStatus();
  }

  let cycleStart = account.log_cycle_start;
  if (!cycleStart || cycleStart <= 0) {
    cycleStart = now;
    db.prepare('UPDATE accounts SET log_cycle_start = ? WHERE id = ?').run(now, userId);
  }

  const elapsed = Math.max(0, now - cycleStart);
  const rawDay = Math.floor(elapsed / 86400) + 1;
  const currentDay = Math.min(RETENTION_DAYS, rawDay);
  const daysRemaining = Math.max(0, RETENTION_DAYS - currentDay);
  const nextPurgeAt = cycleStart + CYCLE_SECONDS;

  // Warning conditions (Day 28: 2 days left, Day 29: 1 day left)
  const isWarning = currentDay === 28 || currentDay === 29 || daysRemaining <= 2;
  let warningBadge = null;

  if (currentDay === 28 || daysRemaining === 2) {
    warningBadge = '2'; // User requirement: "28 din hobar shomoy 2 likha ashbe"
  } else if (currentDay === 29 || daysRemaining === 1) {
    warningBadge = '1'; // User requirement: "29 din hobar shomoy 1 likha ashbe"
  } else if (currentDay >= 30 || daysRemaining === 0) {
    warningBadge = '!';
  }

  let totalLogs = 0;
  let eligibleForPurge = 0;
  try {
    if (account.role === 'admin') {
      totalLogs = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get()?.c || 0;
      eligibleForPurge = db.prepare('SELECT COUNT(*) as c FROM audit_logs WHERE created_at < ?').get(now - CYCLE_SECONDS)?.c || 0;
    } else {
      totalLogs = db.prepare(`
        SELECT COUNT(*) as c FROM audit_logs 
        WHERE user_id = ? OR app_id IN (SELECT id FROM applications WHERE user_id = ?)
      `).get(userId, userId)?.c || 0;
      eligibleForPurge = db.prepare(`
        SELECT COUNT(*) as c FROM audit_logs 
        WHERE (user_id = ? OR app_id IN (SELECT id FROM applications WHERE user_id = ?)) 
          AND created_at < ?
      `).get(userId, userId, now - CYCLE_SECONDS)?.c || 0;
    }
  } catch (e) {}

  return {
    user_id: account.id,
    username: account.username,
    retention_days: RETENTION_DAYS,
    cycle_start: cycleStart,
    current_day: currentDay,
    days_remaining: daysRemaining,
    next_purge_at: nextPurgeAt,
    is_warning: isWarning,
    warning_badge: warningBadge,
    total_logs: totalLogs,
    eligible_for_purge: eligibleForPurge
  };
}

/**
 * Fallback global retention status
 */
export function getRetentionStatus() {
  const now = Math.floor(Date.now() / 1000);
  const firstAcc = db.prepare('SELECT id FROM accounts LIMIT 1').get();
  if (firstAcc) {
    return getUserRetentionStatus(firstAcc.id);
  }
  return {
    retention_days: RETENTION_DAYS,
    cycle_start: now,
    current_day: 1,
    days_remaining: 29,
    next_purge_at: now + CYCLE_SECONDS,
    is_warning: false,
    warning_badge: null,
    total_logs: 0,
    eligible_for_purge: 0
  };
}

/**
 * Dispatch notification for a user (Discord Webhooks + in-app notification)
 */
export async function dispatchUserPurgeNotification(userId, type, data = {}) {
  const { currentDay = 28, daysRemaining = 2, totalLogs = 0, deletedCount = 0 } = data;
  const now = Math.floor(Date.now() / 1000);

  let title = '';
  let description = '';
  let color = 0xf59e0b;

  if (type === 'day_28') {
    title = '⚠️ Habit Auth — 30-Day Audit Log Maintenance Alert (2 Days Remaining)';
    description = `Your 30-day database audit log cleanup is scheduled in **2 days**. To keep your application records high-performance and lightweight, logs will be cleared. Please export a backup from the dashboard if needed.`;
    color = 0xf59e0b;
  } else if (type === 'day_29') {
    title = '🚨 Habit Auth — Final Audit Log Purge Warning (1 Day Remaining)';
    description = `Automated 30-day audit log purge will execute for your account **tomorrow (within 24 hours)**. Please export your audit log backup now to retain historical activity records.`;
    color = 0xef4444;
  } else if (type === 'purged') {
    title = '🧹 Habit Auth — 30-Day Audit Log Maintenance Completed';
    description = `Automated 30-day audit log purge successfully executed for your account. ${deletedCount} expired log records cleared and SQLite database storage optimized.`;
    color = 0x10b981;
  }

  // 1. In-app notification for this specific user
  try {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run('notif_' + uuidv4().slice(0, 10), userId, title, description, type === 'purged' ? 'info' : 'warning', now);
  } catch (err) {
    console.error('[LogRetention] In-app notification error:', err.message);
  }

  // 2. Broadcast to this user's active Webhooks (or all active if admin)
  try {
    const userWebhooks = db.prepare(`
      SELECT DISTINCT w.url, w.name FROM webhooks w
      JOIN applications a ON a.id = w.app_id
      WHERE a.user_id = ? AND w.is_active = 1
    `).all(userId);

    if (userWebhooks.length > 0) {
      const embedPayload = {
        embeds: [{
          title,
          description,
          color,
          fields: [
            { name: 'Cycle Status', value: `Day ${currentDay} of ${RETENTION_DAYS}`, inline: true },
            { name: 'Days Left', value: `${daysRemaining} Day(s)`, inline: true },
            { name: 'Total Records', value: `${totalLogs}`, inline: true },
            { name: 'Action Required', value: type === 'purged' ? 'No action needed (Optimized)' : 'Export Backup (JSON/CSV) from Dashboard', inline: false }
          ],
          footer: { text: 'Habit Auth Per-User Database Health Broker' },
          timestamp: new Date().toISOString()
        }]
      };

      for (const hook of userWebhooks) {
        try {
          await fetch(hook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(embedPayload)
          });
        } catch (hookErr) {}
      }
    }
  } catch (err) {}
}

/**
 * Periodic Checker: Scans every account's individual 30-day retention timeline
 */
export async function checkAndRunLogRetention() {
  try {
    const accounts = db.prepare('SELECT id, username, log_cycle_start FROM accounts').all();
    const now = Math.floor(Date.now() / 1000);

    for (const acc of accounts) {
      const status = getUserRetentionStatus(acc.id);
      const { current_day, days_remaining, cycle_start, total_logs } = status;

      // Day 28 Notification
      if (current_day === 28) {
        const sentKey = `purge_notif_sent_28_${acc.id}_${cycle_start}`;
        if (!getSystemSetting(sentKey)) {
          console.log(`📢 [LogRetention] Dispatching Day 28 Warning for ${acc.username} (2 days left)...`);
          await dispatchUserPurgeNotification(acc.id, 'day_28', {
            currentDay: 28,
            daysRemaining: 2,
            totalLogs: total_logs
          });
          setSystemSetting(sentKey, '1');
        }
      }

      // Day 29 Notification
      if (current_day === 29) {
        const sentKey = `purge_notif_sent_29_${acc.id}_${cycle_start}`;
        if (!getSystemSetting(sentKey)) {
          console.log(`🚨 [LogRetention] Dispatching Day 29 Urgent Alert for ${acc.username} (1 day left)...`);
          await dispatchUserPurgeNotification(acc.id, 'day_29', {
            currentDay: 29,
            daysRemaining: 1,
            totalLogs: total_logs
          });
          setSystemSetting(sentKey, '1');
        }
      }

      // Day 30 Purge Execution for this user
      if (current_day >= 30) {
        console.log(`🧹 [LogRetention] Day 30 reached for ${acc.username}. Purging logs...`);
        await executeUserLogPurge(acc.id, false);
      }
    }

    // Auto-clean noisy/useless logs, dead sessions & truncate WAL to keep DB tiny
    cleanUnnecessaryLogsAndOptimizeDb();
  } catch (e) {
    console.error('[LogRetention] Error in periodic check:', e);
  }
}

/**
 * Automatically clean useless/noisy logs, dead sessions, old notifications,
 * truncate SQLite WAL and vacuum to keep database storage footprint at absolute minimum.
 */
export function cleanUnnecessaryLogsAndOptimizeDb() {
  try {
    const now = Math.floor(Date.now() / 1000);

    // 1. Delete noisy / useless audit logs
    const noisyResult = db.prepare(`
      DELETE FROM audit_logs 
      WHERE event_type IN (
        'LOGIN_SUCCESS', 
        'LOGOUT', 
        'LOGOUT_SESSION', 
        'LOGOUT_ALL_OTHER_SESSIONS', 
        'LOGOUT_ALL_SESSIONS', 
        'REMOTE_SESSION_KILLED'
      )
    `).run();

    // 2. Delete revoked sessions and stale inactive sessions (> 14 days)
    const sessionResult = db.prepare(`
      DELETE FROM sessions 
      WHERE is_revoked = 1 OR last_active < ?
    `).run(now - 14 * 86400);

    // 3. Delete old read notifications (> 14 days old) to avoid table bloat
    const notifResult = db.prepare(`
      DELETE FROM notifications 
      WHERE is_read = 1 AND created_at < ?
    `).run(now - 14 * 86400);

    // 4. Cap logs per user to maximum 500 records
    const accounts = db.prepare('SELECT id FROM accounts').all();
    for (const acc of accounts) {
      const countRow = db.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?').get(acc.id);
      if (countRow && countRow.count > 500) {
        db.prepare(`
          DELETE FROM audit_logs WHERE id IN (
            SELECT id FROM audit_logs WHERE user_id = ? ORDER BY created_at ASC LIMIT ?
          )
        `).run(acc.id, countRow.count - 450);
      }
    }

    // 5. Truncate WAL and execute incremental vacuum to free disk space immediately
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      db.exec('PRAGMA incremental_vacuum(100);');
    } catch (e) {}

    if (noisyResult.changes > 0 || sessionResult.changes > 0 || notifResult.changes > 0) {
      console.log(`🧹 [DB Optimizer] Cleaned ${noisyResult.changes} noisy logs, ${sessionResult.changes} dead sessions, ${notifResult.changes} old notifications.`);
    }
  } catch (err) {
    console.error('[DB Optimizer] Error during optimization:', err.message);
  }
}

/**
 * Execute log purge for a specific user
 */
export async function executeUserLogPurge(userId, isManual = false) {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - (isManual ? (7 * 86400) : CYCLE_SECONDS);

  let deletedCount = 0;
  try {
    const account = db.prepare('SELECT id, role FROM accounts WHERE id = ?').get(userId);
    if (!account) return { success: false, deletedCount: 0 };

    if (account.role === 'admin' && isManual) {
      // Super admin manual wipe of older logs
      const result = db.prepare('DELETE FROM audit_logs WHERE created_at < ?').run(cutoff);
      deletedCount = result.changes;
    } else {
      const result = db.prepare(`
        DELETE FROM audit_logs 
        WHERE (user_id = ? OR app_id IN (SELECT id FROM applications WHERE user_id = ?))
          AND created_at < ?
      `).run(userId, userId, cutoff);
      deletedCount = result.changes;
    }

    // SQLite incremental vacuum & WAL checkpoint
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      db.exec('PRAGMA incremental_vacuum(100);');
    } catch (vErr) {}

    // Reset user's cycle start to now if scheduled cycle completed
    if (!isManual) {
      db.prepare('UPDATE accounts SET log_cycle_start = ? WHERE id = ?').run(now, userId);
    }

    await dispatchUserPurgeNotification(userId, 'purged', {
      currentDay: 30,
      daysRemaining: 0,
      deletedCount
    });

    console.log(`✅ [LogRetention] Purged ${deletedCount} audit logs for user ${userId}.`);
  } catch (err) {
    console.error('[LogRetention] Error executing purge for user:', err);
  }

  return { success: true, deletedCount };
}

/**
 * Simulate target cycle day for a specific user (Day 28: badge 2, Day 29: badge 1, reset: Day 1 or Day 29)
 */
export function simulateUserCycleDay(userId, targetDay) {
  const now = Math.floor(Date.now() / 1000);

  if (targetDay === null || targetDay === undefined || targetDay === 'reset') {
    // Reset to Day 29 for existing accounts or Day 1 for new
    const day29CycleStart = now - (28 * 86400 + 43200);
    db.prepare('UPDATE accounts SET log_cycle_start = ? WHERE id = ?').run(day29CycleStart, userId);
    return getUserRetentionStatus(userId);
  }

  const dayNum = parseInt(targetDay, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
    throw new Error('Target day must be an integer between 1 and 31');
  }

  // Set cycle start so that (now - cycleStart) is (dayNum - 1) days + 2 hours
  const targetElapsed = ((dayNum - 1) * 86400) + 7200;
  const newCycleStart = now - targetElapsed;

  db.prepare('UPDATE accounts SET log_cycle_start = ? WHERE id = ?').run(newCycleStart, userId);
  return getUserRetentionStatus(userId);
}
