import { getUserRetentionStatus, executeUserLogPurge, simulateUserCycleDay } from '../services/logRetentionService.js';
import db from '../config/db.js';
import { recordAuditLog, sendInAppNotification } from '../middleware/helpers.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

// 1. Admin System Stats
export function getAdminStats(req, res) {
  const totalAccounts = db.prepare('SELECT COUNT(*) as c FROM accounts').get().c;
  const totalApps = db.prepare('SELECT COUNT(*) as c FROM applications').get().c;
  const totalLicenses = db.prepare('SELECT COUNT(*) as c FROM licenses').get().c;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM application_users').get().c;
  const now = Math.floor(Date.now() / 1000);
  const lockedUsers = db.prepare("SELECT COUNT(*) as c FROM application_users WHERE status = 'locked' OR locked_until > ?").get(now).c;
  const bannedUsers = db.prepare("SELECT COUNT(*) as c FROM application_users WHERE status = 'banned'").get().c;

  res.json({
    success: true,
    stats: {
      totalAccounts,
      totalApps,
      totalLicenses,
      totalUsers,
      lockedUsers,
      bannedUsers
    }
  });
}

// 2. Manage Accounts / Users
export function getAccounts(req, res) {
  const { query = '' } = req.query;
  const searchPattern = `%${query.trim()}%`;
  const now = Math.floor(Date.now() / 1000);

  const accounts = db.prepare(`
    SELECT 
      a.id, a.discord_id, a.username, a.email, a.avatar, a.role, a.status, a.ban_reason, a.created_at,
      s.plan, s.status as sub_status, s.expires_at, s.started_at,
      (SELECT COUNT(*) FROM applications WHERE user_id = a.id) as total_apps
    FROM accounts a
    LEFT JOIN subscriptions s ON s.user_id = a.id
    WHERE a.username LIKE ? OR a.discord_id LIKE ? OR a.email LIKE ?
    ORDER BY a.created_at DESC
  `).all(searchPattern, searchPattern, searchPattern);

  // Process and sync any expired subscriptions
  const processedAccounts = accounts.map(acc => {
    let subStatus = acc.sub_status || 'active';
    let plan = acc.plan || 'free';
    const expiresAt = acc.expires_at || 0;

    if ((plan === 'developer' || plan === 'pro') && expiresAt > 0 && expiresAt < now) {
      subStatus = 'expired';
      // Sync in DB if not already expired
      if (acc.sub_status !== 'expired') {
        db.prepare("UPDATE subscriptions SET status = 'expired' WHERE user_id = ?").run(acc.id);
      }
    }

    return {
      ...acc,
      plan,
      sub_status: subStatus,
      expires_at: expiresAt
    };
  });

  res.json({ success: true, accounts: processedAccounts });
}

// 3. Update Plan (Free <-> Developer <-> Pro with Duration options)
export function updateAccountPlan(req, res) {
  const { accountId } = req.params;
  const { plan, duration } = req.body;

  if (!['free', 'developer', 'pro'].includes(plan)) {
    return res.status(400).json({ success: false, message: 'Invalid plan. Allowed plans: free, developer, pro' });
  }

  const account = db.prepare('SELECT username FROM accounts WHERE id = ?').get(accountId);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

  const now = Math.floor(Date.now() / 1000);
  let expiresAt = 0;
  let durationLabel = 'Lifetime';

  if (plan === 'developer' || plan === 'pro') {
    if (duration === '1month' || duration === '30' || duration === 30) {
      expiresAt = now + 30 * 86400;
      durationLabel = '1 Month (30 Days)';
    } else if (duration === '3months' || duration === '90' || duration === 90) {
      expiresAt = now + 90 * 86400;
      durationLabel = '3 Months (90 Days)';
    } else if (duration === '1year' || duration === '365' || duration === 365) {
      expiresAt = now + 365 * 86400;
      durationLabel = '1 Year (365 Days)';
    } else if (duration === 'lifetime' || duration === '0' || duration === 0) {
      expiresAt = 0;
      durationLabel = 'Lifetime';
    } else if (typeof duration === 'number' && duration > 0) {
      expiresAt = now + Math.floor(duration * 86400);
      durationLabel = `${duration} Days`;
    } else if (typeof duration === 'string' && !isNaN(parseInt(duration, 10)) && parseInt(duration, 10) > 0) {
      const days = parseInt(duration, 10);
      expiresAt = now + days * 86400;
      durationLabel = `${days} Days`;
    } else {
      // Default to 1 Month if not specified
      expiresAt = now + 30 * 86400;
      durationLabel = '1 Month (30 Days)';
    }
  }

  const existingSub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(accountId);
  if (existingSub) {
    db.prepare(`
      UPDATE subscriptions 
      SET plan = ?, status = 'active', started_at = ?, expires_at = ? 
      WHERE user_id = ?
    `).run(plan, now, expiresAt, accountId);
  } else {
    const subId = `sub_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan, status, started_at, expires_at, provider, created_at)
      VALUES (?, ?, ?, 'active', ?, ?, 'admin', ?)
    `).run(subId, accountId, plan, now, expiresAt, now);
  }

  // Update team capacity if owner has a team
  const targetCapacity = (account.role === 'admin' || plan === 'pro') ? 500 : 25;
  try {
    db.prepare('UPDATE teams SET max_members = ? WHERE owner_id = ?').run(targetCapacity, accountId);
  } catch (e) {}

  const expiryMsg = expiresAt > 0 
    ? `Expires: ${new Date(expiresAt * 1000).toLocaleDateString()} (${durationLabel})`
    : 'Lifetime Access';

  recordAuditLog(
    req.user.id, 
    null, 
    'SUBSCRIPTION_UPDATED', 
    `Admin updated plan for '${account.username}' to '${plan.toUpperCase()}' [${expiryMsg}]`, 
    req.ip
  );

  sendInAppNotification(
    accountId,
    'Subscription Updated',
    `Your account plan has been updated to ${plan.toUpperCase()} [${expiryMsg}].`,
    'success'
  );

  res.json({ 
    success: true, 
    message: `Account plan updated to ${plan.toUpperCase()} (${expiryMsg}).`,
    plan,
    expires_at: expiresAt,
    sub_status: 'active'
  });
}

// 4. View Locked Users (Brute Force Security Center)
export function getLockedUsers(req, res) {
  const now = Math.floor(Date.now() / 1000);

  const lockedUsers = db.prepare(`
    SELECT 
      u.id, u.username, u.app_id, a.app_name, u.failed_attempts, u.locked_until, 
      u.last_ip, u.created_at
    FROM application_users u
    JOIN applications a ON a.id = u.app_id
    WHERE u.status = 'locked' OR u.locked_until > ?
    ORDER BY u.locked_until DESC
  `).all(now);

  const enriched = lockedUsers.map(u => ({
    ...u,
    remaining_seconds: Math.max(u.locked_until - now, 0),
    remaining_hours: Math.ceil(Math.max(u.locked_until - now, 0) / 3600)
  }));

  res.json({ success: true, lockedUsers: enriched });
}

// 5. Admin Manual Unlock (Before 24h timeout)
export function adminUnlockUser(req, res) {
  const { userId } = req.params;

  const targetUser = db.prepare('SELECT id, username, app_id FROM application_users WHERE id = ?').get(userId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

  db.prepare("UPDATE application_users SET status = 'active', failed_attempts = 0, locked_until = 0 WHERE id = ?").run(userId);

  recordAuditLog(req.user.id, targetUser.app_id, 'ACCOUNT_MANUALLY_UNLOCKED', `Admin manually unlocked user '${targetUser.username}' before 24-hour timeout.`, req.ip);

  res.json({
    success: true,
    message: `User '${targetUser.username}' has been unlocked successfully by Administrator.`
  });
}

// 6. Audit Logs
export function getAuditLogs(req, res) {
  const { event_type, query = '', limit = 100 } = req.query;
  const searchPattern = `%${query.trim()}%`;

  const user = req.user;
  let sql = `
    SELECT 
      l.id, l.user_id, l.app_id, l.event_type, l.description, l.ip_address, l.created_at,
      a.username as actor_name,
      app.app_name
    FROM audit_logs l
    LEFT JOIN accounts a ON a.id = l.user_id
    LEFT JOIN applications app ON app.id = l.app_id
    WHERE (l.description LIKE ? OR l.event_type LIKE ? OR a.username LIKE ?)
  `;
  const params = [searchPattern, searchPattern, searchPattern];

  // If developer (not super admin), only show their own logs or their apps' logs
  if (user && user.role !== 'admin') {
    sql += ` AND (l.user_id = ? OR l.app_id IN (SELECT id FROM applications WHERE user_id = ?))`;
    params.push(user.id, user.id);
  }

  if (event_type && event_type !== 'all') {
    sql += ' AND l.event_type = ?';
    params.push(event_type);
  }

  sql += ' ORDER BY l.created_at DESC LIMIT ?';
  params.push(parseInt(limit) || 150);

  const logs = db.prepare(sql).all(...params);
  res.json({ success: true, logs });
}

// 7. System Health Status (Public endpoint — no sensitive info!)
export function getSystemHealth(req, res) {
  res.json({
    success: true,
    status: 'Operational',
    services: {
      api: { status: 'Operational' },
      database: { status: 'Operational' },
      authentication: { status: 'Operational' },
      licenseEngine: { status: 'Operational' }
    }
  });
}

// 8. Super Admin: Toggle Ban / Unban Account
export function toggleBanAccount(req, res) {
  const { accountId } = req.params;
  const { reason = '' } = req.body || {};
  const target = db.prepare('SELECT id, username, role, status, ban_reason FROM accounts WHERE id = ?').get(accountId);
  if (!target) return res.status(404).json({ success: false, message: 'Account not found.' });

  if (target.id === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot ban your own super admin account.' });
  }

  const newStatus = target.status === 'banned' ? 'active' : 'banned';
  const effectiveReason = newStatus === 'banned' ? (reason?.trim() || 'Administrative Action: Violation of Terms') : null;

  db.prepare('UPDATE accounts SET status = ?, ban_reason = ? WHERE id = ?').run(newStatus, effectiveReason, accountId);

  // If banned, revoke all active sessions immediately
  if (newStatus === 'banned') {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(accountId);
  }

  recordAuditLog(
    req.user.id, 
    null, 
    'ACCOUNT_BAN_TOGGLED', 
    `Admin changed account '${target.username}' status to ${newStatus}${effectiveReason ? ` [Reason: ${effectiveReason}]` : ''}`, 
    req.ip
  );

  res.json({
    success: true,
    message: `Account '${target.username}' is now ${newStatus.toUpperCase()}.${effectiveReason ? ` Reason: ${effectiveReason}` : ''}`,
    status: newStatus,
    ban_reason: effectiveReason
  });
}

// 9. Super Admin: Permanently Delete Account
export function deleteAccount(req, res) {
  const { accountId } = req.params;
  const target = db.prepare('SELECT id, username FROM accounts WHERE id = ?').get(accountId);
  if (!target) return res.status(404).json({ success: false, message: 'Account not found.' });

  if (target.id === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }

  db.prepare('DELETE FROM accounts WHERE id = ?').run(accountId);
  recordAuditLog(req.user.id, null, 'ACCOUNT_DELETED', `Admin permanently deleted account '${target.username}'`, req.ip);

  res.json({ success: true, message: `Account '${target.username}' and all associated data permanently deleted.` });
}

// 10. Super Admin: Get All Applications Across All Accounts
export function getAllApplications(req, res) {
  const apps = db.prepare(`
    SELECT 
      a.id, a.app_name, a.app_secret, a.version, a.status, a.created_at,
      acc.username as owner_username, acc.discord_id as owner_discord_id, acc.avatar as owner_avatar,
      (SELECT COUNT(*) FROM application_users WHERE app_id = a.id) as total_users,
      (SELECT COUNT(*) FROM licenses WHERE app_id = a.id) as total_licenses
    FROM applications a
    JOIN accounts acc ON acc.id = a.user_id
    ORDER BY a.created_at DESC
  `).all();

  res.json({ success: true, applications: apps });
}

// 11. Super Admin: Delete Any Application
export function adminDeleteApp(req, res) {
  const { appId } = req.params;
  const app = db.prepare('SELECT id, app_name FROM applications WHERE id = ?').get(appId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  db.prepare('DELETE FROM applications WHERE id = ?').run(appId);
  recordAuditLog(req.user.id, appId, 'APPLICATION_DELETED_BY_ADMIN', `Admin permanently deleted app '${app.app_name}'`, req.ip);

  res.json({ success: true, message: `Application '${app.app_name}' permanently deleted.` });
}

// 12. Super Admin: Get All End-Users Across All Apps
export function getAllApplicationUsers(req, res) {
  const { query = '' } = req.query;
  const search = `%${query.trim()}%`;

  const users = db.prepare(`
    SELECT 
      u.id, u.username, u.hwid, u.sid, u.status, u.ban_reason, u.expires_at, u.last_login, u.created_at,
      a.id as app_id, a.app_name, acc.username as app_owner, acc.username as owner_username
    FROM application_users u
    JOIN applications a ON a.id = u.app_id
    JOIN accounts acc ON acc.id = a.user_id
    WHERE u.username LIKE ? OR u.hwid LIKE ? OR a.app_name LIKE ?
    ORDER BY u.created_at DESC
    LIMIT 200
  `).all(search, search, search);

  res.json({ success: true, users });
}

// 13. Super Admin: Toggle Ban / Delete Application User
export function adminToggleBanAppUser(req, res) {
  const { userId } = req.params;
  const { reason = '' } = req.body || {};
  const user = db.prepare('SELECT id, username, app_id, status, ban_reason FROM application_users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const newStatus = user.status === 'banned' ? 'active' : 'banned';
  const effectiveReason = newStatus === 'banned' ? (reason?.trim() || 'Administrative Action') : null;

  db.prepare('UPDATE application_users SET status = ?, ban_reason = ? WHERE id = ?').run(newStatus, effectiveReason, userId);
  recordAuditLog(
    req.user.id, 
    user.app_id, 
    'USER_STATUS_TOGGLED_BY_ADMIN', 
    `Admin changed user '${user.username}' status to ${newStatus}${effectiveReason ? ` [Reason: ${effectiveReason}]` : ''}`, 
    req.ip
  );

  res.json({ 
    success: true, 
    message: `User '${user.username}' is now ${newStatus.toUpperCase()}.${effectiveReason ? ` Reason: ${effectiveReason}` : ''}`, 
    status: newStatus,
    ban_reason: effectiveReason
  });
}

export function adminDeleteAppUser(req, res) {
  const { userId } = req.params;
  const user = db.prepare('SELECT id, username, app_id FROM application_users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  db.prepare('DELETE FROM application_users WHERE id = ?').run(userId);
  recordAuditLog(req.user.id, user.app_id, 'USER_DELETED_BY_ADMIN', `Admin permanently deleted user '${user.username}'`, req.ip);

  res.json({ success: true, message: `User '${user.username}' permanently deleted.` });
}

// 14. Super Admin: Get All Licenses in System
export function getAllLicenses(req, res) {
  const { query = '' } = req.query;
  const search = `%${query.trim()}%`;

  const licenses = db.prepare(`
    SELECT 
      l.id, l.license_key, l.duration_days, l.status, l.bound_username, l.expires_at, l.created_at,
      a.app_name, acc.username as app_owner
    FROM licenses l
    JOIN applications a ON a.id = l.app_id
    JOIN accounts acc ON acc.id = a.user_id
    WHERE l.license_key LIKE ? OR (l.bound_username IS NOT NULL AND l.bound_username LIKE ?) OR a.app_name LIKE ?
    ORDER BY l.created_at DESC
    LIMIT 200
  `).all(search, search, search);

  res.json({ success: true, licenses });
}

export function adminDeleteLicense(req, res) {
  const { licenseId } = req.params;
  db.prepare('DELETE FROM licenses WHERE id = ?').run(licenseId);
  res.json({ success: true, message: 'License deleted successfully.' });
}

// 15. Super Admin: Get All Teams in System
export function getAllTeams(req, res) {
  const teams = db.prepare(`
    SELECT 
      t.id, t.name, t.invite_code, t.max_members, t.created_at, t.owner_id,
      acc.username as owner_username, acc.discord_id as owner_discord_id, acc.avatar as owner_avatar,
      (SELECT COUNT(*) FROM team_members WHERE team_id = t.id AND status = 'active') as active_members,
      (SELECT COUNT(*) FROM team_members WHERE team_id = t.id AND status = 'pending') as pending_requests
    FROM teams t
    JOIN accounts acc ON acc.id = t.owner_id
    ORDER BY t.created_at DESC
  `).all();

  // Attach members for each team so super admin can expand, view, kick, or ban
  const teamsWithMembers = teams.map(t => {
    const members = db.prepare(`
      SELECT tm.id as member_id, tm.role, tm.status, tm.joined_at, tm.permissions,
             a.id as user_id, a.username, a.discord_id, a.avatar
      FROM team_members tm
      JOIN accounts a ON a.id = tm.user_id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at ASC
    `).all(t.id);
    return { ...t, members };
  });

  res.json({ success: true, teams: teamsWithMembers });
}

export function adminDisbandTeam(req, res) {
  const { teamId } = req.params;
  const team = db.prepare('SELECT name FROM teams WHERE id = ?').get(teamId);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

  db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
  recordAuditLog(req.user.id, null, 'TEAM_DISBANDED_BY_ADMIN', `Admin disbanded team '${team.name}'`, req.ip);

  res.json({ success: true, message: `Team '${team.name}' disbanded successfully.` });
}


// 16. Audit Log 30-Day Retention Status
export function getAuditLogRetention(req, res) {
  try {
    const status = getUserRetentionStatus(req.user.id);
    res.json({ success: true, retention: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 17. Manual Audit Log Purge (Clean DB)
export async function purgeAuditLogs(req, res) {
  try {
    const result = await executeUserLogPurge(req.user.id, true);
    recordAuditLog(req.user.id, null, 'AUDIT_LOGS_PURGED', `User triggered audit log purge (${result.deletedCount} logs purged, database vacuumed)`, req.ip);
    const updatedStatus = getUserRetentionStatus(req.user.id);
    res.json({ 
      success: true, 
      message: `Database cleaned! Successfully purged ${result.deletedCount} audit log records and reclaimed storage space.`,
      retention: updatedStatus,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 18. Simulate Day in Cycle (For Testing Day 28 & 29 Badges)
export function simulateRetentionDay(req, res) {
  try {
    const { targetDay } = req.body;
    const updatedStatus = simulateUserCycleDay(req.user.id, targetDay);
    res.json({ 
      success: true, 
      message: targetDay === 'reset' ? 'Simulation reset to live cycle.' : `Simulating Day ${targetDay} of 30-day retention cycle.`,
      retention: updatedStatus
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// 19. Export Complete Audit Logs Backup (JSON or CSV)
export function exportAuditLogsBackup(req, res) {
  try {
    const { format = 'json' } = req.query;
    const user = req.user;

    let sql = `
      SELECT 
        l.id, l.user_id, l.app_id, l.event_type, l.description, l.ip_address, l.created_at,
        a.username as actor_name,
        app.app_name
      FROM audit_logs l
      LEFT JOIN accounts a ON a.id = l.user_id
      LEFT JOIN applications app ON app.id = l.app_id
      WHERE 1=1
    `;
    const params = [];

    if (user && user.role !== 'admin') {
      sql += ` AND (l.user_id = ? OR l.app_id IN (SELECT id FROM applications WHERE user_id = ?))`;
      params.push(user.id, user.id);
    }

    sql += ' ORDER BY l.created_at DESC';
    const logs = db.prepare(sql).all(...params);

    if (format === 'csv') {
      const headers = ['ID', 'Event Type', 'Description', 'Actor', 'App Name', 'IP Address', 'Timestamp', 'ISO Date'];
      const csvRows = [headers.join(',')];

      for (const log of logs) {
        const row = [
          `"${log.id || ''}"`,
          `"${(log.event_type || '').replace(/"/g, '""')}"`,
          `"${(log.description || '').replace(/"/g, '""')}"`,
          `"${(log.actor_name || 'System').replace(/"/g, '""')}"`,
          `"${(log.app_name || 'Global / Master').replace(/"/g, '""')}"`,
          `"${log.ip_address || ''}"`,
          log.created_at,
          `"${new Date((log.created_at || 0) * 1000).toISOString()}"`
        ];
        csvRows.push(row.join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="HabitAuth_Audit_Logs_Backup_${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csvRows.join('\r\n'));
    }

    // Default JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="HabitAuth_Audit_Logs_Backup_${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({
      success: true,
      exported_at: new Date().toISOString(),
      total_count: logs.length,
      logs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed: ' + err.message });
  }
}

// 20. Super Admin: Upload Image for System Notices & Notifications
export function adminUploadImage(req, res) {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image base64 data is required.' });
    }

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    let ext = 'png';
    let base64Data = image;

    if (matches && matches.length === 3) {
      ext = matches[1].toLowerCase();
      base64Data = matches[2];
    } else {
      base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    }

    // SECURITY: Whitelist safe image extensions only — block SVG/PHP/JS etc.
    const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid image type '${ext}'. Allowed: PNG, JPG, JPEG, GIF, WEBP only.` 
      });
    }

    const uniqueName = `notif_${Date.now()}_${uuidv4().slice(0, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const publicUrl = `/uploads/${uniqueName}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully.',
      url: publicUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Image upload failed: ' + err.message });
  }
}

// 21. Super Admin: Send Targeted Broadcast Notification (Category: info, security, warning, danger)
export function broadcastNotification(req, res) {
  try {
    const { title, message, type = 'info', link_url = '', image_url = '', target_plans = ['free', 'developer', 'pro'] } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Notification title is required.' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Notification message body is required.' });
    }

    if (!Array.isArray(target_plans) || target_plans.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one target plan (Free, Developer, or Pro).' });
    }

    const allowedTypes = ['info', 'security', 'warning', 'danger'];
    const notifType = allowedTypes.includes(type) ? type : 'info';

    const includeFree = target_plans.includes('free');
    const includeDeveloper = target_plans.includes('developer');
    const includePro = target_plans.includes('pro');

    let targetAccounts = [];

    if (includeFree && includeDeveloper && includePro) {
      targetAccounts = db.prepare('SELECT id FROM accounts').all();
    } else {
      const planConditions = [];
      if (includeFree) planConditions.push("(s.plan = 'free' OR s.plan IS NULL)");
      if (includeDeveloper) planConditions.push("s.plan = 'developer'");
      if (includePro) planConditions.push("s.plan = 'pro'");

      if (planConditions.length > 0) {
        targetAccounts = db.prepare(`
          SELECT DISTINCT a.id FROM accounts a
          LEFT JOIN subscriptions s ON s.user_id = a.id
          WHERE ${planConditions.join(' OR ')}
        `).all();
      }
    }

    if (targetAccounts.length === 0) {
      return res.status(400).json({ success: false, message: 'No active accounts found matching the selected target plan.' });
    }

    const now = Math.floor(Date.now() / 1000);
    const insertStmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link_url, image_url, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    let sentCount = 0;
    for (const acc of targetAccounts) {
      const notifId = 'notif_' + uuidv4().slice(0, 12);
      insertStmt.run(
        notifId,
        acc.id,
        title.trim(),
        message.trim(),
        notifType,
        link_url ? link_url.trim() : '',
        image_url ? image_url.trim() : '',
        now
      );
      sentCount++;
    }

    recordAuditLog(
      req.user.id,
      null,
      'BROADCAST_NOTIFICATION_SENT',
      `Admin broadcasted notification '${title.trim()}' to ${sentCount} account(s) (Targets: ${target_plans.join(', ')})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Broadcast notification successfully sent to ${sentCount} account(s)!`,
      sent_count: sentCount,
      target_plans
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send broadcast notification: ' + err.message });
  }
}
