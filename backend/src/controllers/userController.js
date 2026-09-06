import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { recordAuditLog, triggerDiscordWebhook, sendInAppNotification } from '../middleware/helpers.js';

// 1. Get Application Users
export function getAppUsers(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;

  // Verify app ownership
  const app = db.prepare('SELECT id FROM applications WHERE id = ? AND user_id = ?').get(appId, userId);
  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });
  }

  const now = Math.floor(Date.now() / 1000);

  const users = db.prepare(`
    SELECT 
      id, app_id, username, token, license_key, hwid, sid, status, ban_reason,
      failed_attempts, locked_until, expires_at, is_online, last_heartbeat, session_killed, last_hwid_reset, hwid_lock,
      last_ip, last_login, created_at
    FROM application_users
    WHERE app_id = ?
    ORDER BY created_at DESC
  `).all(appId);

  // Check and auto-unlock expired locks on the fly
  const sanitizedUsers = users.map(u => {
    let effectiveStatus = u.status;
    let isLocked = false;
    let remainingLockSeconds = 0;

    if (u.locked_until > now) {
      effectiveStatus = 'locked';
      isLocked = true;
      remainingLockSeconds = u.locked_until - now;
    } else if (u.locked_until > 0 && u.locked_until <= now && u.status === 'locked') {
      // 24 hours passed! Automatically unlock
      db.prepare("UPDATE application_users SET status = 'active', failed_attempts = 0, locked_until = 0 WHERE id = ?").run(u.id);
      recordAuditLog(userId, appId, 'ACCOUNT_AUTO_UNLOCKED', `User '${u.username}' automatically unlocked after 24-hour lockout expired.`, '127.0.0.1');
      effectiveStatus = 'active';
    }

    return {
      ...u,
      status: effectiveStatus,
      is_locked: isLocked,
      remaining_lock_seconds: remainingLockSeconds
    };
  });

  res.json({ success: true, users: sanitizedUsers });
}

// 2. Manually Add User
export async function createAppUser(req, res) {
  const { appId } = req.params;
  const { username, password, license_key, expiry_date, hwid_lock = false } = req.body;
  const isHwidLock = (hwid_lock === true || hwid_lock === 1 || hwid_lock === 'true') ? 1 : 0;
  const userId = req.user.id;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const app = db.prepare('SELECT id, app_name FROM applications WHERE id = ? AND user_id = ?').get(appId, userId);
  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });
  }

  // Plan User Limit Enforcement (Free: 10, Developer: 10,000, Pro Developer: 100,000)
  const userPlan = req.user.plan || 'free';
  const isSuperAdmin = req.user.role === 'admin';
  const totalUsersInApp = db.prepare('SELECT COUNT(*) as c FROM application_users WHERE app_id = ?').get(appId).c;

  let maxUsers = 10;
  if (isSuperAdmin) {
    maxUsers = 9999999;
  } else if (userPlan === 'pro') {
    maxUsers = 100000;
  } else if (userPlan === 'developer') {
    maxUsers = 10000;
  } else {
    maxUsers = 10;
  }

  if (totalUsersInApp >= maxUsers) {
    return res.status(403).json({
      success: false,
      code: 'USER_LIMIT_EXCEEDED',
      message: `You have reached the maximum user limit (${maxUsers.toLocaleString()} Users) for the ${userPlan.toUpperCase()} Plan on this application.`
    });
  }

  // Check unique username for this app
  const existing = db.prepare('SELECT id FROM application_users WHERE app_id = ? AND username = ?').get(appId, username.trim());
  if (existing) {
    return res.status(409).json({ success: false, message: `Username '${username}' is already taken in this application.` });
  }

  const newUserId = 'u_' + uuidv4().slice(0, 10);
  const passHash = await bcrypt.hash(password, 10);
  const now = Math.floor(Date.now() / 1000);

  let expiresAt = 0;
  if (expiry_date) {
    expiresAt = Math.floor(new Date(expiry_date).getTime() / 1000);
  }

  let boundLicense = license_key && license_key !== 'MANUAL_BYPASS' ? license_key.trim() : null;

  // If a license was provided, validate and link it
  if (boundLicense) {
    const lic = db.prepare('SELECT * FROM licenses WHERE app_id = ? AND license_key = ?').get(appId, boundLicense);
    if (lic) {
      if (lic.duration_days > 0) {
        expiresAt = now + (lic.duration_days * 86400);
      }
      db.prepare(`
        UPDATE licenses 
        SET status = 'active', bound_user_id = ?, bound_username = ?, activations_count = activations_count + 1 
        WHERE id = ?
      `).run(newUserId, username.trim(), lic.id);
    }
  }

  const userToken = 'tok_' + uuidv4().replace(/-/g, '').slice(0, 24);

  db.prepare(`
    INSERT INTO application_users (
      id, app_id, username, password_hash, token, license_key, hwid, sid, status, 
      failed_attempts, locked_until, expires_at, is_online, last_heartbeat, session_killed, last_hwid_reset, hwid_lock,
      last_ip, last_login, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 'active', 0, 0, ?, 0, 0, 0, 0, ?, NULL, 0, ?)
  `).run(newUserId, appId, username.trim(), passHash, userToken, boundLicense, expiresAt, isHwidLock, now);

  recordAuditLog(userId, appId, 'USER_CREATED', `Manually created client user '${username.trim()}'`, req.ip);
  triggerDiscordWebhook(appId, 'new_user', 'New User Registered', `User **${username.trim()}** was added to application **${app.app_name}**.`, [
    { name: 'Username', value: username.trim() },
    { name: 'License', value: boundLicense || 'Manual Expiry' },
    { name: 'Expires At', value: expiresAt === 0 ? 'Lifetime' : new Date(expiresAt * 1000).toLocaleDateString() }
  ]);

  res.status(201).json({
    success: true,
    message: `User '${username.trim()}' created successfully!`,
    user_id: newUserId
  });
}

// 3. Reset HWID
export function resetHwid(req, res) {
  const { appId, userId: targetUserId } = req.params;
  const ownerId = req.user.id;

  const app = db.prepare('SELECT id FROM applications WHERE id = ? AND user_id = ?').get(appId, ownerId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const targetUser = db.prepare('SELECT * FROM application_users WHERE id = ? AND app_id = ?').get(targetUserId, appId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

  db.prepare('UPDATE application_users SET hwid = NULL WHERE id = ?').run(targetUserId);
  db.prepare('DELETE FROM devices WHERE app_id = ? AND user_id = ?').run(appId, targetUserId);

  if (targetUser.license_key) {
    db.prepare('UPDATE licenses SET bound_hwid = NULL WHERE app_id = ? AND license_key = ?').run(appId, targetUser.license_key);
  }

  recordAuditLog(ownerId, appId, 'HWID_RESET', `Reset HWID for user '${targetUser.username}'`, req.ip);
  triggerDiscordWebhook(appId, 'hwid_reset', 'User HWID Reset by Admin', `Administrator reset bound HWID for user **${targetUser.username}**.`, [
    { name: 'Username', value: targetUser.username },
    { name: 'Old HWID', value: targetUser.hwid || 'None' }
  ]);
  sendInAppNotification(
    ownerId,
    'HWID Reset Successful',
    `Hardware lock was reset for client user '${targetUser.username}' in app '${app.app_name}'.`,
    'security'
  );
  res.json({ success: true, message: `HWID reset for user '${targetUser.username}'.` });
}

// 4. Reset SID
export function resetSid(req, res) {
  const { appId, userId: targetUserId } = req.params;
  const ownerId = req.user.id;

  const app = db.prepare('SELECT id FROM applications WHERE id = ? AND user_id = ?').get(appId, ownerId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const targetUser = db.prepare('SELECT username FROM application_users WHERE id = ? AND app_id = ?').get(targetUserId, appId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

  db.prepare('UPDATE application_users SET sid = NULL WHERE id = ?').run(targetUserId);
  recordAuditLog(ownerId, appId, 'SID_RESET', `Reset SID for user '${targetUser.username}'`, req.ip);

  res.json({ success: true, message: `SID reset for user '${targetUser.username}'.` });
}

// 5. Toggle Ban/Unban
export function toggleBan(req, res) {
  const { appId, userId: targetUserId } = req.params;
  const ownerId = req.user.id;

  const app = db.prepare('SELECT id FROM applications WHERE id = ? AND user_id = ?').get(appId, ownerId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const targetUser = db.prepare('SELECT * FROM application_users WHERE id = ? AND app_id = ?').get(targetUserId, appId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

  const { reason = '' } = req.body || {};
  const newStatus = targetUser.status === 'banned' ? 'active' : 'banned';
  const effectiveReason = newStatus === 'banned' ? (reason?.trim() || 'Policy violation') : null;

  db.prepare('UPDATE application_users SET status = ?, ban_reason = ? WHERE id = ?').run(newStatus, effectiveReason, targetUserId);

  recordAuditLog(ownerId, appId, newStatus === 'banned' ? 'USER_BANNED' : 'USER_UNBANNED', `User '${targetUser.username}' marked as ${newStatus}${effectiveReason ? ` [Reason: ${effectiveReason}]` : ''}`, req.ip);

  if (newStatus === 'banned') {
    triggerDiscordWebhook(appId, 'user_banned', 'User Banned', `User **${targetUser.username}** has been banned from the application.${effectiveReason ? `\n**Reason:** ${effectiveReason}` : ''}`, [
      { name: 'Username', value: targetUser.username },
      { name: 'Reason', value: effectiveReason || 'None' },
      { name: 'HWID', value: targetUser.hwid || 'None' },
      { name: 'Last IP', value: targetUser.last_ip || 'None' }
    ]);
  }

  sendInAppNotification(
    ownerId,
    `Client User ${newStatus === 'banned' ? 'Banned' : 'Unbanned'}`,
    `User '${targetUser.username}' in app '${app.app_name}' was ${newStatus}.${effectiveReason ? ` Reason: ${effectiveReason}` : ''}`,
    newStatus === 'banned' ? 'warning' : 'info'
  );

  res.json({ 
    success: true, 
    message: `User status changed to ${newStatus}.${effectiveReason ? ` Reason: ${effectiveReason}` : ''}`,
    status: newStatus,
    ban_reason: effectiveReason
  });
}

// 6. Manual Unlock (For users locked out by 5 failed attempts)
export function unlockUser(req, res) {
  const { appId, userId: targetUserId } = req.params;
  const ownerId = req.user.id;

  const app = db.prepare('SELECT id FROM applications WHERE id = ? AND user_id = ?').get(appId, ownerId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const targetUser = db.prepare('SELECT * FROM application_users WHERE id = ? AND app_id = ?').get(targetUserId, appId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

  db.prepare("UPDATE application_users SET status = 'active', failed_attempts = 0, locked_until = 0 WHERE id = ?").run(targetUserId);
  recordAuditLog(ownerId, appId, 'ACCOUNT_MANUALLY_UNLOCKED', `Manually unlocked user '${targetUser.username}' before 24-hour timeout.`, req.ip);

  res.json({ success: true, message: `User '${targetUser.username}' has been unlocked successfully.` });
}

// 7. Edit / Update User
export async function updateAppUser(req, res) {
  const { appId, userId: targetUserId } = req.params;
  const { username, password, expiry_date, status } = req.body;
  const ownerId = req.user.id;

  const app = db.prepare('SELECT id FROM applications WHERE id = ? AND user_id = ?').get(appId, ownerId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const targetUser = db.prepare('SELECT * FROM application_users WHERE id = ? AND app_id = ?').get(targetUserId, appId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

  let updatedUsername = targetUser.username;
  if (username && username.trim()) {
    updatedUsername = username.trim();
  }

  let passHash = targetUser.password_hash;
  if (password && password.trim()) {
    passHash = await bcrypt.hash(password.trim(), 10);
  }

  let expiresAt = targetUser.expires_at;
  if (expiry_date !== undefined) {
    expiresAt = expiry_date ? Math.floor(new Date(expiry_date).getTime() / 1000) : 0;
  }

  let newStatus = status || targetUser.status;

  db.prepare(`
    UPDATE application_users 
    SET username = ?, password_hash = ?, expires_at = ?, status = ?
    WHERE id = ?
  `).run(updatedUsername, passHash, expiresAt, newStatus, targetUserId);

  recordAuditLog(ownerId, appId, 'USER_UPDATED', `Updated details for client user '${updatedUsername}'`, req.ip);

  res.json({
    success: true,
    message: `User '${updatedUsername}' updated successfully!`
  });
}

// 8. Delete User
export function deleteAppUser(req, res) {
  const { appId, userId: targetUserId } = req.params;
  const ownerId = req.user.id;

  if (targetUserId === 'all') {
    return deleteAllAppUsers(req, res);
  }

  const app = (req.user.role === 'admin')
    ? db.prepare('SELECT id, app_name FROM applications WHERE id = ?').get(appId)
    : db.prepare('SELECT id, app_name FROM applications WHERE id = ? AND user_id = ?').get(appId, ownerId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const targetUser = db.prepare('SELECT username FROM application_users WHERE id = ? AND app_id = ?').get(targetUserId, appId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

  db.prepare('DELETE FROM application_users WHERE id = ?').run(targetUserId);
  db.prepare('DELETE FROM devices WHERE app_id = ? AND user_id = ?').run(appId, targetUserId);

  recordAuditLog(ownerId, appId, 'USER_DELETED', `Deleted user '${targetUser.username}'`, req.ip);
  res.json({ success: true, message: `User '${targetUser.username}' deleted.` });
}

// 9. Delete All Users for an Application
export function deleteAllAppUsers(req, res) {
  const { appId } = req.params;
  const ownerId = req.user.id;

  const app = (req.user.role === 'admin')
    ? db.prepare('SELECT id, app_name FROM applications WHERE id = ?').get(appId)
    : db.prepare('SELECT id, app_name FROM applications WHERE id = ? AND user_id = ?').get(appId, ownerId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const countResult = db.prepare('SELECT COUNT(*) as count FROM application_users WHERE app_id = ?').get(appId);
  const totalCount = countResult ? countResult.count : 0;

  db.prepare('DELETE FROM devices WHERE app_id = ?').run(appId);
  db.prepare('DELETE FROM application_users WHERE app_id = ?').run(appId);

  recordAuditLog(ownerId, appId, 'USER_DELETED', `Deleted all ${totalCount} users for application '${app.app_name}'`, req.ip);
  res.json({ success: true, message: `All ${totalCount} users deleted successfully.`, count: totalCount });
}
