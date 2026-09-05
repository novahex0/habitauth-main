import db, { generateEd25519Keypair } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { recordAuditLog, triggerDiscordWebhook } from '../middleware/helpers.js';

// 1. Get all applications for the authenticated user
export function getApplications(req, res) {
  const userId = req.user.id;

  const apps = db.prepare(`
    SELECT 
      a.id, a.app_name, a.version, a.status, a.created_at, a.updated_at,
      (SELECT COUNT(*) FROM application_users WHERE app_id = a.id) as total_users,
      (SELECT COUNT(*) FROM licenses WHERE app_id = a.id) as total_licenses,
      (SELECT COUNT(*) FROM licenses WHERE app_id = a.id AND status = 'active') as active_licenses,
      (SELECT COUNT(*) FROM webhook_deliveries wd JOIN webhooks w ON w.id = wd.webhook_id WHERE w.app_id = a.id) as api_requests
    FROM applications a
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `).all(userId);

  res.json({ success: true, applications: apps });
}

// 2. Get single application details & credentials
export function getApplicationById(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;

  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(appId, userId);
  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });
  }

  // Aggregate stats
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM application_users WHERE app_id = ?').get(appId).count;
  const totalLicenses = db.prepare('SELECT COUNT(*) as count FROM licenses WHERE app_id = ?').get(appId).count;
  const activeLicenses = db.prepare("SELECT COUNT(*) as count FROM licenses WHERE app_id = ? AND status = 'active'").get(appId).count;
  const boundDevices = db.prepare('SELECT COUNT(*) as count FROM devices WHERE app_id = ?').get(appId).count;

  res.json({
    success: true,
    application: {
      id: app.id,
      app_name: app.app_name,
      app_secret: app.app_secret,
      public_key: app.public_key || '',
      version: app.version,
      status: app.status,
      created_at: app.created_at,
      updated_at: app.updated_at,
      force_update_enabled: !!app.force_update_enabled,
      latest_version: app.latest_version || app.version || '1.0.0',
      update_download_url: app.update_download_url || '',
      enforce_hash_check: !!app.enforce_hash_check,
      expected_hash: app.expected_hash || '',
      auto_ban_on_hash_mismatch: app.auto_ban_on_hash_mismatch !== 0,
      custom_key_mask: app.custom_key_mask || '',
      hwid_cooldown_days: app.hwid_cooldown_days || 7,
      hwid_self_reset_enabled: app.hwid_self_reset_enabled !== 0,
      custom_webhook_username: app.custom_webhook_username || '',
      custom_webhook_avatar: app.custom_webhook_avatar || '',
      custom_webhook_color: app.custom_webhook_color || '',
      subscriptions_frozen: !!app.subscriptions_frozen,
      frozen_at: app.frozen_at || 0,
      token_validation_enabled: !!app.token_validation_enabled,
      stats: {
        totalUsers,
        totalLicenses,
        activeLicenses,
        boundDevices
      }
    }
  });
}

// 3. Create New Application (App Name is REQUIRED, App ID formatted as APPNAME_xxxxxxxx)
export function createApplication(req, res) {
  const { app_name, version = '1.0.0' } = req.body;
  const userId = req.user.id;

  if (!app_name || !app_name.trim()) {
    return res.status(400).json({ success: false, message: 'App Name is required.' });
  }

  // Plan Limit Enforcement (Free: 1, Developer: 100, Pro Developer: 1000)
  const userPlan = req.user.plan || 'free';
  const isSuperAdmin = req.user.role === 'admin';
  const existingAppsCount = db.prepare('SELECT COUNT(*) as c FROM applications WHERE user_id = ?').get(userId).c;

  let maxAllowed = 1;
  if (isSuperAdmin) {
    maxAllowed = 999999;
  } else if (userPlan === 'pro') {
    maxAllowed = 1000;
  } else if (userPlan === 'developer') {
    maxAllowed = 100;
  } else {
    maxAllowed = 1;
  }

  if (existingAppsCount >= maxAllowed) {
    return res.status(403).json({
      success: false,
      code: 'APP_LIMIT_EXCEEDED',
      message: `You have reached the maximum application limit (${maxAllowed} App${maxAllowed > 1 ? 's' : ''}) for the ${userPlan.toUpperCase()} Plan. Please upgrade to create more applications.`
    });
  }

  const cleanName = app_name.trim();
  const sanitizedPrefix = cleanName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'APP';
  const appId = `${sanitizedPrefix}_` + uuidv4().replace(/-/g, '').slice(0, 12);
  // Cryptographically secure 64-char App Secret
  const appSecret = 'sec_' + uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  // Cryptographic Asymmetric Ed25519 Keypair
  const edKeys = generateEd25519Keypair();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO applications (id, user_id, app_name, app_secret, public_key, private_key, version, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(appId, userId, cleanName, appSecret, edKeys.publicKeyHex, edKeys.privateKeyPem, version.trim() || '1.0.0', now, now);

  recordAuditLog(userId, appId, 'APPLICATION_CREATED', `Application '${cleanName}' created with Ed25519 security (ID: ${appId})`, req.ip);

  // Send initial notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
    VALUES (?, ?, ?, ?, 'info', 0, ?)
  `).run('notif_' + uuidv4().slice(0, 10), userId, 'Application Created', `Application '${cleanName}' is ready with Ed25519 protection.`, now);

  res.status(201).json({
    success: true,
    message: 'Application created successfully with Ed25519 security keys.',
    application: {
      id: appId,
      app_id: appId,
      app_name: cleanName,
      app_secret: appSecret,
      public_key: edKeys.publicKeyHex,
      version: version.trim() || '1.0.0',
      status: 'active'
    }
  });
}

// 4. Regenerate App Secret & Ed25519 Keypair
export function regenerateSecret(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;

  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(appId, userId);
  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });
  }

  const newSecret = 'sec_' + uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  const newEdKeys = generateEd25519Keypair();
  const now = Math.floor(Date.now() / 1000);

  db.prepare('UPDATE applications SET app_secret = ?, public_key = ?, private_key = ?, updated_at = ? WHERE id = ?')
    .run(newSecret, newEdKeys.publicKeyHex, newEdKeys.privateKeyPem, now, appId);

  recordAuditLog(userId, appId, 'APP_SECRET_REGENERATED', `App secret and Ed25519 keypair regenerated for '${app.app_name}'.`, req.ip);

  res.json({
    success: true,
    message: 'App Secret and Ed25519 keypair regenerated successfully.',
    app_secret: newSecret,
    public_key: newEdKeys.publicKeyHex
  });
}

// 5. Update Application Settings
export function updateApplication(req, res) {
  const { appId } = req.params;
  const { app_name, version, status } = req.body;
  const userId = req.user.id;

  let app;
  if (req.user.role === 'admin' || req.user.role === 'owner') {
    app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  } else {
    app = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(appId, userId);
  }
  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });
  }

  const now = Math.floor(Date.now() / 1000);
  const updatedName = app_name ? app_name.trim() : app.app_name;
  const updatedVersion = version ? version.trim() : app.version;
  const updatedStatus = status || app.status;

  db.prepare('UPDATE applications SET app_name = ?, version = ?, latest_version = ?, status = ?, updated_at = ? WHERE id = ?')
    .run(updatedName, updatedVersion, updatedVersion, updatedStatus, now, appId);

  recordAuditLog(userId, appId, 'APPLICATION_UPDATED', `Application '${updatedName}' version updated to ${updatedVersion}`, req.ip);

  res.json({ success: true, message: 'Application updated successfully.' });
}

// 6. Delete Application
export function deleteApplication(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;

  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(appId, userId);
  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });
  }

  db.prepare('DELETE FROM applications WHERE id = ?').run(appId);
  recordAuditLog(userId, appId, 'APPLICATION_DELETED', `Application '${app.app_name}' deleted.`, req.ip);

  res.json({ success: true, message: `Application '${app.app_name}' deleted successfully.` });
}

// 6. Update App Security, Anti-Cheat, and White-Label Settings
export function updateAppSecurityConfig(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;
  const {
    force_update_enabled,
    latest_version,
    update_download_url,
    enforce_hash_check,
    expected_hash,
    auto_ban_on_hash_mismatch,
    custom_key_mask,
    hwid_cooldown_days,
    hwid_self_reset_enabled,
    custom_webhook_username,
    custom_webhook_avatar,
    custom_webhook_color,
    token_validation_enabled
  } = req.body;

  const app = db.prepare('SELECT id, app_name FROM applications WHERE id = ? AND user_id = ?').get(appId, userId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    UPDATE applications SET
      force_update_enabled = ?,
      latest_version = ?,
      update_download_url = ?,
      enforce_hash_check = ?,
      expected_hash = ?,
      auto_ban_on_hash_mismatch = ?,
      custom_key_mask = ?,
      hwid_cooldown_days = ?,
      hwid_self_reset_enabled = ?,
      custom_webhook_username = ?,
      custom_webhook_avatar = ?,
      custom_webhook_color = ?,
      token_validation_enabled = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    force_update_enabled ? 1 : 0,
    (latest_version || '1.0.0').trim(),
    (update_download_url || '').trim(),
    enforce_hash_check ? 1 : 0,
    (expected_hash || '').trim().toLowerCase(),
    auto_ban_on_hash_mismatch === false || auto_ban_on_hash_mismatch === 0 ? 0 : 1,
    (custom_key_mask || '').trim().toUpperCase(),
    parseInt(hwid_cooldown_days) || 7,
    hwid_self_reset_enabled ? 1 : 0,
    (custom_webhook_username || '').trim(),
    (custom_webhook_avatar || '').trim(),
    (custom_webhook_color || '').trim(),
    token_validation_enabled ? 1 : 0,
    now,
    appId
  );

  recordAuditLog(userId, appId, 'SECURITY_CONFIG_UPDATED', `Updated security & white-label settings for application '${app.app_name}'`, req.ip);

  res.json({
    success: true,
    message: 'Application security and white-label settings updated successfully!'
  });
}

// 7. Get Live Online Users (Live Radar Telemetry)
export function getLiveOnlineUsers(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const now = Math.floor(Date.now() / 1000);
  const activeWindow = now - 120; // Active within last 2 minutes

  let liveUsers = [];

  if (appId && appId !== 'all') {
    let app = null;
    if (isAdmin) {
      app = db.prepare('SELECT id, app_name FROM applications WHERE id = ?').get(appId);
    } else {
      app = db.prepare('SELECT id, app_name FROM applications WHERE id = ? AND user_id = ?').get(appId, userId);
    }
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    liveUsers = db.prepare(`
      SELECT 
        u.id, u.username, u.hwid, u.last_ip, u.last_heartbeat, u.last_login, u.status, 
        u.session_killed, u.license_key, u.app_id, a.app_name, a.version as app_version
      FROM application_users u
      JOIN applications a ON a.id = u.app_id
      WHERE u.app_id = ? 
        AND (u.last_heartbeat >= ? OR (u.last_login >= ? AND u.is_online = 1) OR u.session_killed = 1)
        AND u.status != 'banned'
      ORDER BY u.session_killed ASC, u.last_heartbeat DESC
    `).all(appId, activeWindow, activeWindow);
  } else {
    // Global / All apps for this developer
    if (isAdmin) {
      liveUsers = db.prepare(`
        SELECT 
          u.id, u.username, u.hwid, u.last_ip, u.last_heartbeat, u.last_login, u.status, 
          u.session_killed, u.license_key, u.app_id, a.app_name, a.version as app_version
        FROM application_users u
        JOIN applications a ON a.id = u.app_id
        WHERE (u.last_heartbeat >= ? OR (u.last_login >= ? AND u.is_online = 1) OR u.session_killed = 1)
          AND u.status != 'banned'
        ORDER BY u.session_killed ASC, u.last_heartbeat DESC
      `).all(activeWindow, activeWindow);
    } else {
      liveUsers = db.prepare(`
        SELECT 
          u.id, u.username, u.hwid, u.last_ip, u.last_heartbeat, u.last_login, u.status, 
          u.session_killed, u.license_key, u.app_id, a.app_name, a.version as app_version
        FROM application_users u
        JOIN applications a ON a.id = u.app_id
        WHERE a.user_id = ? 
          AND (u.last_heartbeat >= ? OR (u.last_login >= ? AND u.is_online = 1) OR u.session_killed = 1)
          AND u.status != 'banned'
        ORDER BY u.session_killed ASC, u.last_heartbeat DESC
      `).all(userId, activeWindow, activeWindow);
    }
  }

  // Calculate live metadata
  const enrichedUsers = liveUsers.map(u => ({
    ...u,
    application_id: u.app_id,
    is_killed: Boolean(u.session_killed),
    seconds_since_ping: u.last_heartbeat > 0 ? Math.max(0, now - u.last_heartbeat) : (u.last_login > 0 ? Math.max(0, now - u.last_login) : 0),
    is_recent: (now - (u.last_heartbeat || u.last_login || 0)) <= 35
  }));

  const activeCount = enrichedUsers.filter(u => !u.is_killed).length;
  const killedCount = enrichedUsers.filter(u => u.is_killed).length;

  res.json({
    success: true,
    online_count: activeCount,
    killed_count: killedCount,
    total_tracked: enrichedUsers.length,
    users: enrichedUsers
  });
}

// 8. Remote Session Kill Switch (Instant termination)
export function killUserSession(req, res) {
  const { appId, userId: targetUserId } = req.params;
  const adminId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  let app = null;
  if (isAdmin) {
    app = db.prepare('SELECT id, app_name, user_id FROM applications WHERE id = ?').get(appId);
  } else {
    app = db.prepare('SELECT id, app_name, user_id FROM applications WHERE id = ? AND user_id = ?').get(appId, adminId);
  }
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const user = db.prepare('SELECT id, username, hwid FROM application_users WHERE id = ? AND app_id = ?').get(targetUserId, appId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found in this application.' });

  // Mark session killed and offline - persistent until revived or reset
  db.prepare('UPDATE application_users SET session_killed = 1, is_online = 0 WHERE id = ?').run(user.id);

  recordAuditLog(adminId, appId, 'REMOTE_SESSION_KILLED', `Admin remotely terminated session for user '${user.username}' (HWID: ${user.hwid || 'N/A'})`, req.ip);
  triggerDiscordWebhook(appId, 'session_killed', 'Remote Session Terminated', `Admin remotely terminated active session for user **${user.username}** in **${app.app_name}**. Immediate kill signal dispatched.`, [
    { name: 'User', value: user.username },
    { name: 'HWID', value: user.hwid || 'Not bound' },
    { name: 'Action', value: 'Remote Kill (Persistent Lock)' }
  ]);

  res.json({
    success: true,
    message: `Remote kill signal activated for '@${user.username}'! Active client will terminate immediately, and any new login attempts will be killed.`
  });
}

// 8b. Revive User Session (Re-enable access after kill)
export function reviveUserSession(req, res) {
  const { appId, userId: targetUserId } = req.params;
  const adminId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  let app = null;
  if (isAdmin) {
    app = db.prepare('SELECT id, app_name FROM applications WHERE id = ?').get(appId);
  } else {
    app = db.prepare('SELECT id, app_name FROM applications WHERE id = ? AND user_id = ?').get(appId, adminId);
  }
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const user = db.prepare('SELECT id, username FROM application_users WHERE id = ? AND app_id = ?').get(targetUserId, appId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found in this application.' });

  db.prepare('UPDATE application_users SET session_killed = 0 WHERE id = ?').run(user.id);

  recordAuditLog(adminId, appId, 'SESSION_REVIVED', `Admin revoked kill lock and re-enabled session access for user '${user.username}'`, req.ip);

  res.json({
    success: true,
    message: `Session access re-enabled for '@${user.username}'. The user can now connect and login normally.`
  });
}

// 8c. Emergency Kill All Active Sessions for Application
export function killAllAppSessions(req, res) {
  const { appId } = req.params;
  const adminId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  let app = null;
  if (isAdmin) {
    app = db.prepare('SELECT id, app_name FROM applications WHERE id = ?').get(appId);
  } else {
    app = db.prepare('SELECT id, app_name FROM applications WHERE id = ? AND user_id = ?').get(appId, adminId);
  }
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const now = Math.floor(Date.now() / 1000);
  const activeWindow = now - 300;

  const result = db.prepare(`
    UPDATE application_users 
    SET session_killed = 1, is_online = 0 
    WHERE app_id = ? AND (is_online = 1 OR last_heartbeat >= ? OR last_login >= ?)
  `).run(appId, activeWindow, activeWindow);

  recordAuditLog(adminId, appId, 'ALL_SESSIONS_KILLED', `Emergency killswitch triggered: terminated all active sessions for '${app.app_name}' (${result.changes} sessions)`, req.ip);
  triggerDiscordWebhook(appId, 'session_killed', 'Emergency Killswitch Engaged', `Administrator engaged emergency killswitch: terminated **${result.changes}** active sessions across **${app.app_name}**.`, [
    { name: 'Application', value: app.app_name },
    { name: 'Terminated Sessions', value: `${result.changes}` }
  ]);

  res.json({
    success: true,
    killed_count: result.changes,
    message: `Emergency Kill Activated! Terminated ${result.changes} active sessions across '${app.app_name}'.`
  });
}
