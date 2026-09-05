import crypto from 'crypto';
import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { recordAuditLog, triggerDiscordWebhook } from '../middleware/helpers.js';
import { isBlacklisted } from './blacklistController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'habit_auth_super_secret_jwt_key_2026_billion_scale';

/**
 * Cryptographically signs client response payload with dual layers:
 * 1. Asymmetric Ed25519 digital signature using application's private key (Zero-Trust Anti-Tamper).
 * 2. Deterministic HMAC-SHA256 using application's secret.
 * Enforces timestamp validation for replay attack prevention.
 */
export function sendSignedResponse(res, status, payload, appOrSecret = null, nonce = null) {
  const timestamp = Math.floor(Date.now() / 1000);
  const responseData = {
    ...payload,
    timestamp,
    server_time: timestamp,
    ...(nonce ? { nonce } : {})
  };

  const bodyStr = JSON.stringify(responseData);

  let appSecret = appOrSecret;
  let privateKeyPem = null;
  let publicKeyHex = null;

  if (appOrSecret && typeof appOrSecret === 'object') {
    appSecret = appOrSecret.app_secret;
    privateKeyPem = appOrSecret.private_key;
    publicKeyHex = appOrSecret.public_key;
  }

  // 1. HMAC-SHA256 Signature
  if (appSecret) {
    const signatureData = `${timestamp}.${bodyStr}`;
    const signature = crypto.createHmac('sha256', appSecret).update(signatureData).digest('hex');
    res.setHeader('X-Signature', signature);
    res.setHeader('X-Timestamp', timestamp.toString());
  }

  // 2. Ed25519 Asymmetric Signature (Sign with Server Private Key)
  if (privateKeyPem) {
    try {
      const edSigData = Buffer.from(`${timestamp}.${bodyStr}`);
      const edSig = crypto.sign(null, edSigData, privateKeyPem);
      res.setHeader('X-Signature-Ed25519', edSig.toString('hex'));
      if (publicKeyHex) {
        res.setHeader('X-Public-Key', publicKeyHex);
      }
    } catch (err) {
      console.error('Ed25519 signing failure:', err);
    }
  }

  res.setHeader('Content-Type', 'application/json');
  return res.status(status).send(bodyStr);
}

/**
 * Strict Suspension (পদ্ধতি ক): Checks if the application developer's subscription is active.
 * If developer's 1-month / 3-month / 1-year subscription has expired, software client authentication is suspended.
 */
export function checkDeveloperSubscription(app) {
  if (!app || !app.user_id) return { ok: true };

  const sub = db.prepare('SELECT plan, status, expires_at FROM subscriptions WHERE user_id = ?').get(app.user_id);
  if (!sub) return { ok: true };

  const now = Math.floor(Date.now() / 1000);
  const isExpired = (sub.expires_at > 0 && sub.expires_at < now) || sub.status === 'expired';

  if (isExpired) {
    if (sub.status !== 'expired') {
      try {
        db.prepare("UPDATE subscriptions SET status = 'expired' WHERE user_id = ?").run(app.user_id);
      } catch (e) {}
    }
    return {
      ok: false,
      code: 'DEVELOPER_SUBSCRIPTION_EXPIRED',
      message: 'Developer subscription expired. Software authentication is temporarily suspended. Please contact the software owner.'
    };
  }

  return { ok: true };
}

// 0. Client Handshake / Initialization (Session Nonce Generation, Anti-Tamper Handshake & Token Validation)
export function clientInit(req, res) {
  const app_id = req.body.app_id || req.body.appId;
  const nonce = req.body.nonce;
  const client_version = req.body.client_version || req.body.clientVersion || req.body.version;
  const token = req.body.token;
  if (!app_id) {
    return res.status(400).json({ success: false, message: 'app_id is required' });
  }

  let app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
  if (!app && app_id === 'EXAMPLEC_a77325d54311') {
    try {
      let owner = db.prepare("SELECT id FROM accounts LIMIT 1").get();
      const ownerId = owner ? owner.id : 'usr_default_admin';
      if (!owner) {
        db.prepare(`
          INSERT OR IGNORE INTO accounts (id, discord_id, username, email, role, created_at, updated_at)
          VALUES (?, '100000000000000001', 'AdminOwner', 'admin@habitauth.dev', 'admin', strftime('%s','now'), strftime('%s','now'))
        `).run(ownerId);
      }
      db.prepare(`
        INSERT OR REPLACE INTO applications (id, user_id, app_name, app_secret, public_key, version, status, created_at, updated_at)
        VALUES (?, ?, 'Example C#', 'sec_25d40b5305284ae4b210744f271aba6604e3c32d923749e2b18264a9b0a5b645', 'cc49061ce6bd0bfa132ce0c0ba5a32bcb7945163e9f21d6f2d9030fc99a2a40f', '1.0', 'active', strftime('%s','now'), strftime('%s','now'))
      `).run(app_id, ownerId);
      app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
    } catch (e) {
      console.error('Error auto-provisioning Example C# app:', e);
    }
  }

  if (!app) {
    return res.status(404).json({ success: false, message: `Application '${app_id}' not found. Please verify the App ID in your dashboard.` });
  }

  const sessionNonce = nonce || uuidv4();

  // Check Developer Subscription Expiration (Strict Suspension)
  const subCheck = checkDeveloperSubscription(app);
  if (!subCheck.ok) {
    return sendSignedResponse(res, 403, {
      success: false,
      code: subCheck.code,
      message: subCheck.message
    }, app, sessionNonce);
  }

  // Check Maintenance
  const sysConfig = db.prepare("SELECT value FROM system_settings WHERE key = 'maintenance_mode'").get();
  const isMaintenance = sysConfig && sysConfig.value === 'true';

  // Secondary Token Validation (Required before client can start or log in)
  if (app.token_validation_enabled) {
    if (!token || !token.trim()) {
      return sendSignedResponse(res, 403, {
        success: false,
        code: 'TOKEN_REQUIRED',
        message: 'Token validation is enabled for this application. A valid startup token is required to start the software.'
      }, app, sessionNonce);
    }

    const cleanToken = token.trim();
    const userWithToken = db.prepare('SELECT id, status FROM application_users WHERE app_id = ? AND token = ?').get(app_id, cleanToken);
    const licenseWithToken = db.prepare('SELECT id, status FROM licenses WHERE app_id = ? AND token = ?').get(app_id, cleanToken);

    if (!userWithToken && !licenseWithToken) {
      return sendSignedResponse(res, 403, {
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Token validation failed. The provided startup token does not exist or is invalid.'
      }, app, sessionNonce);
    }

    if (userWithToken && userWithToken.status === 'banned') {
      return sendSignedResponse(res, 403, {
        success: false,
        code: 'TOKEN_BANNED',
        message: 'Startup token is bound to a suspended user account.'
      }, app, sessionNonce);
    }

    if (licenseWithToken && licenseWithToken.status === 'revoked') {
      return sendSignedResponse(res, 403, {
        success: false,
        code: 'TOKEN_REVOKED',
        message: 'Startup token is bound to a revoked license key.'
      }, app, sessionNonce);
    }
  }

  // Application Version Check & Update Enforcement
  const clientVersionRaw = client_version ? String(client_version).trim() : '';
  const appVersionRaw = (app.latest_version || app.version || '').trim();
  const clientVersionClean = clientVersionRaw.replace(/^v/i, '');
  const appVersionClean = appVersionRaw.replace(/^v/i, '');

  if (appVersionClean && clientVersionClean && clientVersionClean !== appVersionClean) {
    recordAuditLog(null, app.id, 'CLIENT_VERSION_MISMATCH', `Client version mismatch: running v${clientVersionRaw} while app requires v${appVersionRaw}`, extractClientIp(req));
    return sendSignedResponse(res, 426, {
      success: false,
      code: 'UPDATE_REQUIRED',
      message: `A mandatory update is required! You are running version ${clientVersionRaw || '1.0.0'}, but the current version is ${appVersionRaw}. Please update your client to continue.`,
      latest_version: appVersionRaw,
      download_url: app.update_download_url || ''
    }, app, sessionNonce);
  }

  return sendSignedResponse(res, 200, {
    success: true,
    message: 'Handshake initialized successfully.',
    session_nonce: sessionNonce,
    public_key: app.public_key || '',
    app: {
      name: app.app_name,
      version: app.version,
      status: app.status
    },
    maintenance: isMaintenance,
    token_validated: !!app.token_validation_enabled,
    force_update: !!app.force_update_enabled,
    latest_version: app.latest_version || app.version,
    download_url: app.update_download_url || ''
  }, app, sessionNonce);
}


function extractClientIp(req) {
  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || '127.0.0.1';
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
}

// 1. Client User Authentication (End-user login via C# SDK / App)
export async function clientLogin(req, res) {
  const app_id = req.body.app_id || req.body.appId;
  const username = req.body.username;
  const password = req.body.password;
  const hwid = req.body.hwid;
  const sid = req.body.sid;
  const nonce = req.body.nonce;
  const ip = extractClientIp(req);

  if (!app_id || !username || !password) {
    return res.status(400).json({ success: false, message: 'app_id, username, and password are required.' });
  }

  // 0. Check IP or HWID Blacklist
  const blacklistHit = isBlacklisted(app_id, ip, hwid);
  if (blacklistHit) {
    recordAuditLog(null, app_id, 'BLACKLIST_BLOCK', `Blocked login attempt from blacklisted ${blacklistHit.type.toUpperCase()}: ${blacklistHit.value} (User: ${username})`, ip);
    return res.status(403).json({
      success: false,
      code: 'DEVICE_OR_IP_BLACKLISTED',
      message: `Access denied. Your ${blacklistHit.type.toUpperCase()} has been permanently blacklisted: ${blacklistHit.reason}`
    });
  }

  // Verify Application
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
  if (!app) {
    return res.status(404).json({ success: false, message: 'Invalid Application ID.' });
  }

  // Check Developer Subscription Expiration (Strict Suspension)
  const subCheck = checkDeveloperSubscription(app);
  if (!subCheck.ok) {
    return sendSignedResponse(res, 403, {
      success: false,
      code: subCheck.code,
      message: subCheck.message
    }, app, nonce);
  }

  if (app.status !== 'active') {
    return sendSignedResponse(res, 403, { success: false, message: 'Application is currently paused for maintenance.' }, app, nonce);
  }

  // 1. Check Maintenance / Frozen Subscriptions
  if (app.subscriptions_frozen) {
    return sendSignedResponse(res, 503, {
      success: false,
      code: 'SUBSCRIPTIONS_FROZEN',
      message: 'Software is currently paused for updates/maintenance. License time is frozen and will not be lost.'
    }, app, nonce);
  }

  // 2. Check Version Match & Force Auto-Update
  const clientVersionRaw = (req.body.client_version || req.body.version || '').trim();
  const appVersionRaw = (app.latest_version || app.version || '').trim();
  const clientVersionClean = clientVersionRaw.replace(/^v/i, '');
  const appVersionClean = appVersionRaw.replace(/^v/i, '');

  if (appVersionClean && clientVersionClean && clientVersionClean !== appVersionClean) {
    return sendSignedResponse(res, 426, {
      success: false,
      code: 'UPDATE_REQUIRED',
      message: `A mandatory update (v${appVersionRaw}) is required to log in. You are currently running v${clientVersionRaw || '1.0.0'}.`,
      latest_version: appVersionRaw,
      download_url: app.update_download_url || ''
    }, app, nonce);
  }

  // 3. Check Anti-Patch File Integrity Hash (MD5 / SHA-256)
  const fileHash = req.body.file_hash || req.body.hash;
  if (app.enforce_hash_check && app.expected_hash) {
    if (!fileHash || fileHash.trim().toLowerCase() !== app.expected_hash.trim().toLowerCase()) {
      let autoBanned = false;
      const shouldAutoBan = app.auto_ban_on_hash_mismatch !== 0;

      if (shouldAutoBan) {
        // Auto-ban user account
        const existingUser = db.prepare('SELECT id, username FROM application_users WHERE app_id = ? AND username = ?').get(app_id, username.trim());
        if (existingUser) {
          db.prepare("UPDATE application_users SET status = 'banned' WHERE id = ?").run(existingUser.id);
          autoBanned = true;
        }

        // Auto-blacklist HWID
        if (hwid) {
          const cleanHwid = hwid.trim();
          const blkExisting = db.prepare('SELECT id FROM blacklists WHERE type = ? AND value = ? AND (app_id IS ? OR app_id = ?)').get('hwid', cleanHwid, app_id, app_id);
          if (!blkExisting) {
            const blkId = `blk_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
            db.prepare('INSERT INTO blacklists (id, app_id, user_id, type, value, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
              .run(blkId, app_id, app.user_id, 'hwid', cleanHwid, 'Auto-banned: Executable integrity hash mismatch (Tampering / Crack attempt)', Math.floor(Date.now() / 1000));
            autoBanned = true;
          }
        }
      }

      recordAuditLog(
        app.user_id,
        app_id,
        autoBanned ? 'SECURITY_TAMPER_AUTOBAN' : 'INTEGRITY_VIOLATION',
        `Integrity violation for '${username}' (Received: ${fileHash || 'None'}, Expected: ${app.expected_hash})${autoBanned ? ' - USER & HWID AUTO-BANNED' : ''}`,
        ip
      );

      triggerDiscordWebhook(app_id, 'security_alert', '🚨 Critical Binary Tampering Detected!', `User **${username}** attempted login with a modified/cracked binary.\n**Expected:** \`${app.expected_hash}\`\n**Received:** \`${fileHash || 'None'}\`${autoBanned ? '\n⚠️ **Action:** User and HWID permanently auto-banned.' : ''}`, [
        { name: 'Username', value: username },
        { name: 'IP Address', value: ip },
        { name: 'HWID', value: hwid || 'N/A' }
      ]);

      return sendSignedResponse(res, 403, {
        success: false,
        code: 'HASH_MISMATCH',
        message: 'File integrity violation detected. Client executable has been modified or tampered with.' + (autoBanned ? ' Your account and HWID have been permanently banned.' : '')
      }, app, nonce);
    }
  }

  const now = Math.floor(Date.now() / 1000);

  // Look up user
  const user = db.prepare('SELECT * FROM application_users WHERE app_id = ? AND username = ?').get(app_id, username.trim());
  if (!user) {
    // Return generic error to prevent username enumeration
    return sendSignedResponse(res, 401, { success: false, message: 'Invalid username or password.' }, app, nonce);
  }

  // ── BRUTE FORCE & 24-HOUR LOCKOUT LOGIC ───────────────────────
  // A. Check if currently locked
  if (user.locked_until > now) {
    const remainingSeconds = user.locked_until - now;
    const remainingHours = Math.ceil(remainingSeconds / 3600);
    return sendSignedResponse(res, 423, {
      success: false,
      code: 'ACCOUNT_TEMPORARILY_LOCKED',
      message: 'Account temporarily locked due to too many failed login attempts.',
      locked_until: user.locked_until,
      remaining_hours: remainingHours
    }, app, nonce);
  }

  // B. Check if 24 hours have passed and auto-unlock
  if (user.locked_until > 0 && now >= user.locked_until) {
    db.prepare("UPDATE application_users SET status = 'active', failed_attempts = 0, locked_until = 0 WHERE id = ?").run(user.id);
    recordAuditLog(app.user_id, app_id, 'ACCOUNT_AUTO_UNLOCKED', `User '${username}' automatically unlocked after 24-hour lockout expired.`, ip);
    user.status = 'active';
    user.failed_attempts = 0;
    user.locked_until = 0;
  }

  // C. Verify Password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const newFailedCount = (user.failed_attempts || 0) + 1;

    // 5 failed attempts -> 24-hour lockout!
    if (newFailedCount >= 5) {
      const lockUntil = now + 86400; // 24 hours from now
      db.prepare("UPDATE application_users SET status = 'locked', failed_attempts = ?, locked_until = ? WHERE id = ?")
        .run(newFailedCount, lockUntil, user.id);

      recordAuditLog(app.user_id, app_id, 'ACCOUNT_TEMPORARILY_LOCKED', `User '${username}' locked for 24 hours (5 consecutive failed login attempts).`, ip);
      triggerDiscordWebhook(app_id, 'account_locked', 'Account Security Lockout', `User **${username}** was locked for 24 hours after **5 failed password attempts**.`, [
        { name: 'Username', value: username },
        { name: 'App', value: app.app_name },
        { name: 'IP Address', value: ip }
      ]);

      return sendSignedResponse(res, 423, {
        success: false,
        code: 'ACCOUNT_TEMPORARILY_LOCKED',
        message: 'Account temporarily locked due to too many failed login attempts.',
        locked_until: lockUntil,
        remaining_hours: 24
      }, app, nonce);
    }

    db.prepare('UPDATE application_users SET failed_attempts = ? WHERE id = ?').run(newFailedCount, user.id);
    return sendSignedResponse(res, 401, { success: false, message: 'Invalid username or password.' }, app, nonce);
  }

  // D. Check Banned state
  if (user.status === 'banned') {
    return sendSignedResponse(res, 403, { success: false, message: 'Your account has been suspended by the administrator.' }, app, nonce);
  }

  // D2. Check if Session was Terminated/Killed by Administrator
  if (user.session_killed) {
    recordAuditLog(app.user_id, app_id, 'REMOTE_SESSION_KILLED', `Client login rejected: Session was terminated by administrator for user '${username}'`, ip);
    return sendSignedResponse(res, 403, {
      success: false,
      killed: true,
      code: 'SESSION_KILLED',
      message: 'Access Denied: Your session was terminated by an administrator. Application will exit immediately.'
    }, app, nonce);
  }

  // E. Check Subscription Expiry
  if (user.expires_at > 0 && user.expires_at < now) {
    return sendSignedResponse(res, 403, {
      success: false,
      code: 'SUBSCRIPTION_EXPIRED',
      message: 'Your account subscription has expired. Please redeem a new license key.'
    }, app, nonce);
  }

  // F. Check Hardware ID (HWID) Binding
  let cleanHwid = hwid ? hwid.trim() : null;
  let cleanSid = sid ? sid.trim() : null;

  if (cleanHwid) {
    if (!user.hwid) {
      // First machine: Bind HWID automatically!
      db.prepare('UPDATE application_users SET hwid = ?, sid = ? WHERE id = ?').run(cleanHwid, cleanSid, user.id);
      // Register Device
      const devId = 'dev_' + uuidv4().slice(0, 10);
      db.prepare(`
        INSERT INTO devices (id, app_id, user_id, hwid, device_name, os, status, first_seen, last_seen)
        VALUES (?, ?, ?, ?, 'Client Workstation', 'Windows', 'bound', ?, ?)
      `).run(devId, app_id, user.id, cleanHwid, now, now);
      user.hwid = cleanHwid;
    } else if (user.hwid !== cleanHwid) {
      recordAuditLog(app.user_id, app_id, 'HWID_MISMATCH', `User '${username}' rejected: HWID mismatch (expected ${user.hwid.slice(0, 10)}..., received ${cleanHwid.slice(0, 10)}...)`, ip);
      return sendSignedResponse(res, 403, {
        success: false,
        code: 'HWID_MISMATCH',
        message: 'Hardware mismatch detected. This account is locked to another machine. Contact your administrator for an HWID reset.'
      }, app, nonce);
    }
  }

  // Login successful: reset failed counters
  db.prepare('UPDATE application_users SET failed_attempts = 0, locked_until = 0, last_login = ?, last_ip = ?, is_online = 1, last_heartbeat = ?, hwid = COALESCE(?, hwid) WHERE id = ?')
    .run(now, ip, now, cleanHwid, user.id);

  recordAuditLog(app.user_id, app_id, 'LOGIN_SUCCESS', `Client user '${username}' logged in successfully`, ip);

  triggerDiscordWebhook(app_id, 'login', 'User Login Successful', `User **${username}** logged into **${app.app_name}**.`, [
    { name: 'Username', value: username },
    { name: 'IP Address', value: ip },
    { name: 'HWID', value: cleanHwid || user.hwid || 'Not bound' }
  ]);

  // Generate short-lived client handshake token (4 hours)
  const clientToken = jwt.sign({ appId: app.id, userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '4h' });

  return sendSignedResponse(res, 200, {
    success: true,
    message: `Welcome back, ${user.username}! Access granted.`,
    token: clientToken,
    user: {
      id: user.id,
      username: user.username,
      license: user.license_key || 'Manual',
      hwid: user.hwid,
      expires_at: user.expires_at === 0 ? 'Lifetime' : new Date(user.expires_at * 1000).toISOString()
    }
  }, app, nonce);
}

// 2. License Validation API
export function validateLicense(req, res) {
  const app_id = req.body.app_id || req.body.appId;
  const license_key = req.body.license_key || req.body.licenseKey;
  const hwid = req.body.hwid;
  const nonce = req.body.nonce;

  if (!app_id || !license_key) {
    return res.status(400).json({ success: false, message: 'app_id and license_key are required.' });
  }

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
  if (!app) {
    return sendSignedResponse(res, 404, { success: false, message: 'Invalid Application ID.' }, null, nonce);
  }

  // Check Developer Subscription Expiration (Strict Suspension)
  const subCheck = checkDeveloperSubscription(app);
  if (!subCheck.ok) {
    return sendSignedResponse(res, 403, {
      success: false,
      code: subCheck.code,
      message: subCheck.message
    }, app, nonce);
  }

  const appSecret = app?.app_secret || null;

  const lic = db.prepare('SELECT * FROM licenses WHERE app_id = ? AND license_key = ?').get(app_id, license_key.trim());
  if (!lic) {
    return sendSignedResponse(res, 404, { success: false, message: 'License key not found.' }, app, nonce);
  }

  const now = Math.floor(Date.now() / 1000);

  if (lic.status === 'revoked') {
    return sendSignedResponse(res, 403, { success: false, message: 'License has been revoked by the administrator.' }, app, nonce);
  }

  if (lic.expires_at > 0 && lic.expires_at < now) {
    return sendSignedResponse(res, 403, { success: false, message: 'License is expired.' }, app, nonce);
  }

  if (lic.bound_hwid && hwid && lic.bound_hwid !== hwid.trim()) {
    return sendSignedResponse(res, 403, { success: false, message: 'License is bound to another hardware profile.' }, app, nonce);
  }

  return sendSignedResponse(res, 200, {
    success: true,
    message: 'License validated successfully',
    license: {
      key: lic.license_key,
      status: lic.status,
      duration_days: lic.duration_days,
      bound_user: lic.bound_username,
      activations: lic.activations_count,
      expires_at: lic.expires_at === 0 ? 'Lifetime' : new Date(lic.expires_at * 1000).toISOString()
    }
  }, app, nonce);
}

// 3. License Activation API
export function activateLicense(req, res) {
  const app_id = req.body.app_id || req.body.appId;
  const license_key = req.body.license_key || req.body.licenseKey;
  const hwid = req.body.hwid;
  const username = req.body.username;
  const nonce = req.body.nonce;

  if (!app_id || !license_key) {
    return res.status(400).json({ success: false, message: 'app_id and license_key are required.' });
  }

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
  if (!app) {
    return sendSignedResponse(res, 404, { success: false, message: 'Invalid Application ID.' }, null, nonce);
  }

  // Check Developer Subscription Expiration (Strict Suspension)
  const subCheck = checkDeveloperSubscription(app);
  if (!subCheck.ok) {
    return sendSignedResponse(res, 403, {
      success: false,
      code: subCheck.code,
      message: subCheck.message
    }, app, nonce);
  }

  const appSecret = app?.app_secret || null;

  const lic = db.prepare('SELECT * FROM licenses WHERE app_id = ? AND license_key = ?').get(app_id, license_key.trim());
  if (!lic) return sendSignedResponse(res, 404, { success: false, message: 'License key not found.' }, app, nonce);
  if (lic.status === 'revoked') return sendSignedResponse(res, 403, { success: false, message: 'License has been revoked.' }, app, nonce);

  const now = Math.floor(Date.now() / 1000);
  let expiresAt = lic.expires_at;
  if (lic.status === 'unused' && lic.duration_days > 0) {
    expiresAt = now + (lic.duration_days * 86400);
  }

  db.prepare(`
    UPDATE licenses 
    SET status = 'active', bound_hwid = ?, bound_username = ?, activations_count = activations_count + 1, expires_at = ?
    WHERE id = ?
  `).run(hwid ? hwid.trim() : lic.bound_hwid, username ? username.trim() : lic.bound_username, expiresAt, lic.id);

  return sendSignedResponse(res, 200, {
    success: true,
    message: 'License activated successfully',
    license: {
      key: lic.license_key,
      status: 'active',
      activations: lic.activations_count + 1,
      expires_at: expiresAt === 0 ? 'Lifetime' : new Date(expiresAt * 1000).toISOString()
    }
  }, app, nonce);
}

// 4. License Deactivation API
export function deactivateLicense(req, res) {
  const app_id = req.body.app_id || req.body.appId;
  const license_key = req.body.license_key || req.body.licenseKey;
  const nonce = req.body.nonce;

  // SECURITY: validate required fields before processing
  if (!app_id || !license_key) {
    return res.status(400).json({ success: false, message: 'app_id and license_key are required.' });
  }

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  const appSecret = app?.app_secret || null;

  const lic = db.prepare('SELECT * FROM licenses WHERE app_id = ? AND license_key = ?').get(app_id, license_key.trim());
  if (!lic) return sendSignedResponse(res, 404, { success: false, message: 'License not found.' }, app, nonce);

  db.prepare('UPDATE licenses SET bound_hwid = NULL WHERE id = ?').run(lic.id);
  return sendSignedResponse(res, 200, { success: true, message: 'License hardware unbound successfully.' }, app, nonce);
}

// 5. Application Info API
export function getPublicAppInfo(req, res) {
  const { appId } = req.params;
  const app = db.prepare('SELECT id, app_name, version, status FROM applications WHERE id = ?').get(appId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
  res.json({ success: true, application: app });
}

// 6. Client User Registration (with License Key)
export async function clientRegister(req, res) {
  const app_id = req.body.app_id || req.body.appId;
  const username = req.body.username;
  const password = req.body.password;
  const license_key = req.body.license_key || req.body.licenseKey;
  const hwid = req.body.hwid;
  const nonce = req.body.nonce;
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';

  if (!app_id || !username || !password || !license_key) {
    return res.status(400).json({ success: false, message: 'app_id, username, password, and license_key are required.' });
  }

  // Check IP or HWID Blacklist
  const blacklistHit = isBlacklisted(app_id, ip, hwid);
  if (blacklistHit) {
    recordAuditLog(null, app_id, 'BLACKLIST_BLOCK', `Blocked registration attempt from blacklisted ${blacklistHit.type.toUpperCase()}: ${blacklistHit.value}`, ip);
    return res.status(403).json({
      success: false,
      code: 'DEVICE_OR_IP_BLACKLISTED',
      message: `Access denied. Your ${blacklistHit.type.toUpperCase()} has been permanently blacklisted: ${blacklistHit.reason}`
    });
  }

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
  if (!app || app.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Application is invalid or disabled.' });
  }

  // Check Developer Subscription Expiration (Strict Suspension)
  const subCheck = checkDeveloperSubscription(app);
  if (!subCheck.ok) {
    return sendSignedResponse(res, 403, {
      success: false,
      code: subCheck.code,
      message: subCheck.message
    }, app, nonce);
  }

  // Application Version Check & Update Enforcement
  const clientVersionRaw = (req.body.client_version || req.body.clientVersion || req.body.version || '').trim();
  const appVersionRaw = (app.latest_version || app.version || '').trim();
  const clientVersionClean = clientVersionRaw.replace(/^v/i, '');
  const appVersionClean = appVersionRaw.replace(/^v/i, '');

  if (appVersionClean && clientVersionClean && clientVersionClean !== appVersionClean) {
    recordAuditLog(null, app.id, 'CLIENT_VERSION_MISMATCH', `Client version mismatch: running v${clientVersionRaw} while app requires v${appVersionRaw}`, ip);
    return sendSignedResponse(res, 426, {
      success: false,
      code: 'UPDATE_REQUIRED',
      message: `A mandatory update (v${appVersionRaw}) is required to continue. You are currently running v${clientVersionRaw || '1.0.0'}. Please update your client.`,
      latest_version: appVersionRaw,
      download_url: app.update_download_url || ''
    }, app, nonce);
  }

  const existingUser = db.prepare('SELECT id FROM application_users WHERE app_id = ? AND username = ?').get(app_id, username.trim());
  if (existingUser) {
    return sendSignedResponse(res, 409, { success: false, message: 'Username already registered.' }, app, nonce);
  }

  const lic = db.prepare('SELECT * FROM licenses WHERE app_id = ? AND license_key = ?').get(app_id, license_key.trim());
  if (!lic) {
    return sendSignedResponse(res, 404, { success: false, message: 'Invalid license key.' }, app, nonce);
  }
  if (lic.status === 'revoked') {
    return sendSignedResponse(res, 403, { success: false, message: 'License key has been revoked.' }, app, nonce);
  }
  if (lic.status === 'active' && lic.bound_username) {
    return sendSignedResponse(res, 409, { success: false, message: 'License key is already in use by another user.' }, app, nonce);
  }

  const now = Math.floor(Date.now() / 1000);
  let expiresAt = lic.expires_at;
  if (lic.duration_days > 0) {
    expiresAt = now + (lic.duration_days * 86400);
  }

  const cleanHwid = hwid ? hwid.trim() : null;
  const newUserId = 'appusr_' + uuidv4().slice(0, 12);
  const userToken = 'tok_' + uuidv4().replace(/-/g, '').slice(0, 24);
  const passwordHash = await bcrypt.hash(password, 10);

  db.prepare(`
    INSERT INTO application_users (id, app_id, username, password_hash, token, license_key, hwid, status, expires_at, created_at, is_online, last_heartbeat, last_ip, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 1, ?, ?, ?)
  `).run(newUserId, app_id, username.trim(), passwordHash, userToken, lic.license_key, cleanHwid, expiresAt, now, now);

  db.prepare(`
    UPDATE licenses 
    SET status = 'active', bound_user_id = ?, bound_username = ?, bound_hwid = ?, activations_count = activations_count + 1, expires_at = ?
    WHERE id = ?
  `).run(newUserId, username.trim(), cleanHwid, expiresAt, lic.id);

  if (cleanHwid) {
    db.prepare(`
      INSERT INTO devices (id, app_id, user_id, hwid, device_name, os, status, first_seen, last_seen)
      VALUES (?, ?, ?, ?, 'Client Workstation', 'Windows', 'bound', ?, ?)
    `).run('dev_' + uuidv4().slice(0, 10), app_id, newUserId, cleanHwid, now, now);
  }

  recordAuditLog(app.user_id, app_id, 'CLIENT_USER_REGISTERED', `User '${username}' registered with license key '${lic.license_key}'`, ip);

  triggerDiscordWebhook(app_id, 'register', 'New User Registered', `User **${username}** registered with license key \`${lic.license_key}\`.`, [
    { name: 'Username', value: username },
    { name: 'License', value: lic.license_key },
    { name: 'HWID', value: cleanHwid || 'None' },
    { name: 'IP Address', value: ip }
  ]);

  const clientToken = jwt.sign({ appId: app.id, userId: newUserId, username: username.trim() }, JWT_SECRET, { expiresIn: '4h' });

  return sendSignedResponse(res, 201, {
    success: true,
    message: 'User registered successfully!',
    token: clientToken,
    user: {
      id: newUserId,
      username: username.trim(),
      license: lic.license_key,
      hwid: cleanHwid,
      token: userToken,
      expires_at: expiresAt === 0 ? 'Lifetime' : new Date(expiresAt * 1000).toISOString()
    }
  }, app, nonce);
}

// 7. License-Only Authentication (Instant Key Login)
export async function clientLicenseOnlyLogin(req, res) {
  const app_id = req.body.app_id || req.body.appId;
  const license_key = req.body.license_key || req.body.licenseKey;
  const hwid = req.body.hwid;
  const nonce = req.body.nonce;
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';

  if (!app_id || !license_key) {
    return res.status(400).json({ success: false, message: 'app_id and license_key are required.' });
  }

  // Check IP or HWID Blacklist
  const blacklistHit = isBlacklisted(app_id, ip, hwid);
  if (blacklistHit) {
    recordAuditLog(null, app_id, 'BLACKLIST_BLOCK', `Blocked license login from blacklisted ${blacklistHit.type.toUpperCase()}: ${blacklistHit.value}`, ip);
    return res.status(403).json({
      success: false,
      code: 'DEVICE_OR_IP_BLACKLISTED',
      message: `Access denied. Your ${blacklistHit.type.toUpperCase()} has been permanently blacklisted: ${blacklistHit.reason}`
    });
  }

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
  if (!app || app.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Application is invalid or disabled.' });
  }

  // Check Developer Subscription Expiration (Strict Suspension)
  const subCheck = checkDeveloperSubscription(app);
  if (!subCheck.ok) {
    return sendSignedResponse(res, 403, {
      success: false,
      code: subCheck.code,
      message: subCheck.message
    }, app, nonce);
  }

  // Application Version Check & Update Enforcement
  const clientVersionRaw = (req.body.client_version || req.body.clientVersion || req.body.version || '').trim();
  const appVersionRaw = (app.latest_version || app.version || '').trim();
  const clientVersionClean = clientVersionRaw.replace(/^v/i, '');
  const appVersionClean = appVersionRaw.replace(/^v/i, '');

  if (appVersionClean && clientVersionClean && clientVersionClean !== appVersionClean) {
    recordAuditLog(null, app.id, 'CLIENT_VERSION_MISMATCH', `Client version mismatch: running v${clientVersionRaw} while app requires v${appVersionRaw}`, ip);
    return sendSignedResponse(res, 426, {
      success: false,
      code: 'UPDATE_REQUIRED',
      message: `A mandatory update (v${appVersionRaw}) is required to continue. You are currently running v${clientVersionRaw || '1.0.0'}. Please update your client.`,
      latest_version: appVersionRaw,
      download_url: app.update_download_url || ''
    }, app, nonce);
  }

  const lic = db.prepare('SELECT * FROM licenses WHERE app_id = ? AND license_key = ?').get(app_id, license_key.trim());
  if (!lic) {
    return sendSignedResponse(res, 404, { success: false, message: 'Invalid license key.' }, app, nonce);
  }
  if (lic.status === 'revoked') {
    return sendSignedResponse(res, 403, { success: false, message: 'License key has been revoked.' }, app, nonce);
  }

  const now = Math.floor(Date.now() / 1000);
  if (lic.expires_at > 0 && lic.expires_at < now) {
    return sendSignedResponse(res, 403, { success: false, message: 'License key has expired.' }, app, nonce);
  }

  const cleanHwid = hwid ? hwid.trim() : null;
  if (cleanHwid) {
    if (!lic.bound_hwid) {
      db.prepare('UPDATE licenses SET bound_hwid = ? WHERE id = ?').run(cleanHwid, lic.id);
      lic.bound_hwid = cleanHwid;
    } else if (lic.bound_hwid !== cleanHwid) {
      return sendSignedResponse(res, 403, {
        success: false,
        code: 'HWID_MISMATCH',
        message: 'Hardware mismatch. This license is locked to another machine.'
      }, app, nonce);
    }
  }

  let expiresAt = lic.expires_at;
  if (lic.status === 'unused') {
    if (lic.duration_days > 0) expiresAt = now + (lic.duration_days * 86400);
    db.prepare("UPDATE licenses SET status = 'active', activations_count = activations_count + 1, expires_at = ? WHERE id = ?")
      .run(expiresAt, lic.id);

    triggerDiscordWebhook(app_id, 'license_activated', 'License Key Activated', `License \`${lic.license_key}\` was activated for ${lic.duration_days === 0 ? 'Lifetime' : lic.duration_days + ' Days'}.`, [
      { name: 'License', value: lic.license_key },
      { name: 'HWID', value: cleanHwid || 'None' },
      { name: 'IP Address', value: ip }
    ]);
  }

  triggerDiscordWebhook(app_id, 'login', 'License Key Login Successful', `User authenticated using license \`${lic.license_key}\`.`, [
    { name: 'License', value: lic.license_key },
    { name: 'HWID', value: cleanHwid || lic.bound_hwid || 'None' },
    { name: 'IP Address', value: ip }
  ]);

  const clientToken = jwt.sign({ appId: app.id, license: lic.license_key }, JWT_SECRET, { expiresIn: '4h' });

  return sendSignedResponse(res, 200, {
    success: true,
    message: 'License authentication successful.',
    token: clientToken,
    license: {
      key: lic.license_key,
      status: 'active',
      duration_days: lic.duration_days,
      hwid: lic.bound_hwid,
      expires_at: expiresAt === 0 ? 'Lifetime' : new Date(expiresAt * 1000).toISOString()
    }
  }, app, nonce);
}

// 8. Client Heartbeat Ping (Every 30-60s from SDK with Remote Killswitch)
export function clientHeartbeat(req, res) {
  const app_id = req.body.app_id || req.body.appId;
  const username = req.body.username;
  const hwid = req.body.hwid;
  const nonce = req.body.nonce;
  if (!app_id || !username) {
    return res.status(400).json({ success: false, message: 'app_id and username are required.' });
  }

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
  if (!app) {
    return sendSignedResponse(res, 404, { success: false, message: 'Application not found.' }, null, nonce);
  }

  // Check Developer Subscription Expiration (Strict Suspension)
  const subCheck = checkDeveloperSubscription(app);
  if (!subCheck.ok) {
    return sendSignedResponse(res, 403, {
      success: false,
      code: subCheck.code,
      message: subCheck.message,
      kill: true
    }, app, nonce);
  }

  const appSecret = app?.app_secret || null;

  const now = Math.floor(Date.now() / 1000);
  const user = db.prepare('SELECT id, session_killed, status FROM application_users WHERE app_id = ? AND username = ?').get(app_id, username.trim());
  if (!user) {
    return sendSignedResponse(res, 404, { success: false, message: 'User not found.' }, app, nonce);
  }

  if (user.session_killed) {
    db.prepare('UPDATE application_users SET is_online = 0 WHERE id = ?').run(user.id);
    return sendSignedResponse(res, 403, {
      success: false,
      killed: true,
      code: 'SESSION_KILLED',
      message: 'Session remotely terminated by administrator.'
    }, app, nonce);
  }

  if (user.status === 'banned') {
    return sendSignedResponse(res, 403, {
      success: false,
      killed: true,
      message: 'Your account has been suspended.'
    }, app, nonce);
  }

  const ip = extractClientIp(req);
  db.prepare('UPDATE application_users SET is_online = 1, last_heartbeat = ?, last_ip = COALESCE(?, last_ip) WHERE id = ?').run(now, ip, user.id);
  return sendSignedResponse(res, 200, { success: true, message: 'Heartbeat acknowledged' }, app, nonce);
}

// 9. Client Self-Service HWID Reset with Cooldown
export function clientResetHwid(req, res) {
  const app_id = req.body.app_id || req.body.appId;
  const username = req.body.username;
  const license_key = req.body.license_key || req.body.licenseKey;
  const nonce = req.body.nonce;
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const now = Math.floor(Date.now() / 1000);

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(app_id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

  if (!app.hwid_self_reset_enabled) {
    return sendSignedResponse(res, 403, { success: false, message: 'Self-service HWID reset is disabled for this application.' }, app, nonce);
  }

  let user = null;
  if (username) {
    user = db.prepare('SELECT * FROM application_users WHERE app_id = ? AND username = ?').get(app_id, username.trim());
  } else if (license_key) {
    user = db.prepare('SELECT * FROM application_users WHERE app_id = ? AND license_key = ?').get(app_id, license_key.trim());
  }

  if (!user) {
    return sendSignedResponse(res, 404, { success: false, message: 'User account not found.' }, app, nonce);
  }

  const cooldownSeconds = (app.hwid_cooldown_days || 7) * 86400;
  const elapsed = now - (user.last_hwid_reset || 0);

  if (user.last_hwid_reset > 0 && elapsed < cooldownSeconds) {
    const daysRemaining = Math.ceil((cooldownSeconds - elapsed) / 86400);
    return sendSignedResponse(res, 429, {
      success: false,
      code: 'HWID_COOLDOWN_ACTIVE',
      message: `HWID reset cooldown is active. You can reset your HWID again in ${daysRemaining} day(s).`,
      days_remaining: daysRemaining
    }, app, nonce);
  }

  // Reset HWID
  db.prepare('UPDATE application_users SET hwid = NULL, sid = NULL, last_hwid_reset = ? WHERE id = ?').run(now, user.id);
  if (user.license_key) {
    db.prepare('UPDATE licenses SET bound_hwid = NULL WHERE license_key = ?').run(user.license_key);
  }

  recordAuditLog(app.user_id, app_id, 'HWID_SELF_RESET', `User '${user.username}' performed self-service HWID reset.`, ip);

  triggerDiscordWebhook(app_id, 'hwid_reset', 'Self-Service HWID Reset', `User **${user.username}** reset their bound hardware ID.`, [
    { name: 'Username', value: user.username },
    { name: 'Previous HWID', value: user.hwid || 'None' },
    { name: 'IP Address', value: ip }
  ]);

  return sendSignedResponse(res, 200, {
    success: true,
    message: 'Hardware profile successfully reset! You can now log in from your new machine.'
  }, app, nonce);
}
