import db from '../config/db.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { recordAuditLog, triggerDiscordWebhook, sendInAppNotification, verifyAppAccess } from '../middleware/helpers.js';

function generateRandomSegment(length = 4) {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

// 1. Get Licenses for Application
export function getLicenses(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;
  const isSuperAdmin = req.user.role === 'admin';

  const app = verifyAppAccess(appId, userId, 'manage_licenses', isSuperAdmin);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });

  const licenses = db.prepare(`
    SELECT * FROM licenses WHERE app_id = ? OR app_id = ? ORDER BY created_at DESC
  `).all(app.id, app.app_name);

  res.json({ success: true, licenses });
}

// 2. Generate Cryptographically Secure Unpredictable Licenses
export function generateLicenses(req, res) {
  const { appId } = req.params;
  const { count = 1, duration_days = 0, prefix = 'HABIT', note = '' } = req.body;
  const userId = req.user.id;
  const isSuperAdmin = req.user.role === 'admin';

  const app = verifyAppAccess(appId, userId, 'manage_licenses', isSuperAdmin);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });

  const parsedCount = Math.min(Math.max(parseInt(count) || 1, 1), 100);
  const now = Math.floor(Date.now() / 1000);
  const cleanPrefix = (prefix.trim() || 'HABIT').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Plan License Limits based on Application Owner's Plan
  const effectivePlan = isSuperAdmin ? 'pro' : (app.effectivePlan || 'free');
  const existingLicCount = db.prepare('SELECT COUNT(*) as c FROM licenses WHERE app_id = ? OR app_id = ?').get(app.id, app.app_name).c;

  let maxLicenses = 10;
  if (isSuperAdmin) {
    maxLicenses = 9999999;
  } else if (effectivePlan === 'pro') {
    maxLicenses = 100000;
  } else if (effectivePlan === 'developer') {
    maxLicenses = 10000;
  } else {
    maxLicenses = 10;
  }

  if (existingLicCount + parsedCount > maxLicenses) {
    return res.status(403).json({
      success: false,
      code: 'LICENSE_LIMIT_EXCEEDED',
      message: `Generating ${parsedCount} licenses would exceed your ${effectivePlan.toUpperCase()} Plan limit (${maxLicenses.toLocaleString()} licenses). Current: ${existingLicCount}.`
    });
  }

  // Custom License Key Prefix is exclusive to Pro Developer & Admin
  let effectivePrefix = 'HABIT';
  if (isSuperAdmin || effectivePlan === 'pro') {
    effectivePrefix = cleanPrefix || 'HABIT';
  }

  const createdKeys = [];
  const stmt = db.prepare(`
    INSERT INTO licenses (
      id, app_id, license_key, token, status, duration_days, bound_user_id, 
      bound_username, bound_hwid, activations_count, note, expires_at, created_at
    )
    VALUES (?, ?, ?, ?, 'unused', ?, NULL, NULL, NULL, 0, ?, ?, ?)
  `);

  for (let i = 0; i < parsedCount; i++) {
    const licId = 'lic_' + uuidv4().slice(0, 10);
    const key = `${effectivePrefix}-${generateRandomSegment(4)}-${generateRandomSegment(4)}-${generateRandomSegment(4)}-${generateRandomSegment(4)}`;
    const licToken = 'tok_' + uuidv4().replace(/-/g, '').slice(0, 24);
    
    let expiresAt = 0;
    if (duration_days > 0) {
      expiresAt = now + (duration_days * 86400);
    }

    stmt.run(licId, app.id, key, licToken, duration_days, note.trim(), expiresAt, now);
    createdKeys.push(key);
  }

  recordAuditLog(userId, app.id, 'LICENSE_CREATED', `Generated ${parsedCount} license key(s) with prefix '${effectivePrefix}' (by @${req.user.username})`, req.ip);
  triggerDiscordWebhook(app.id, 'license_created', 'Licenses Generated', `Generated **${parsedCount}** license key(s) for application **${app.app_name}** by **@${req.user.username}**.`, [
    { name: 'Quantity', value: parsedCount },
    { name: 'Duration', value: duration_days === 0 ? 'Lifetime' : `${duration_days} Days` },
    { name: 'Prefix', value: cleanPrefix }
  ]);

  sendInAppNotification(
    app.ownerId,
    'Licenses Generated',
    `Generated ${parsedCount} license key(s) for '${app.app_name}' (Prefix: ${effectivePrefix}) by @${req.user.username}.`,
    'info'
  );

  res.status(201).json({
    success: true,
    message: `Generated ${parsedCount} license key(s) successfully!`,
    keys: createdKeys
  });
}

// 3. Revoke License
export function revokeLicense(req, res) {
  const { appId, licenseId } = req.params;
  const userId = req.user.id;
  const isSuperAdmin = req.user.role === 'admin';

  const app = verifyAppAccess(appId, userId, 'manage_licenses', isSuperAdmin);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });

  const lic = db.prepare('SELECT * FROM licenses WHERE id = ? AND (app_id = ? OR app_id = ?)').get(licenseId, app.id, app.app_name);
  if (!lic) return res.status(404).json({ success: false, message: 'License not found.' });

  const newStatus = lic.status === 'revoked' ? 'unused' : 'revoked';
  db.prepare('UPDATE licenses SET status = ? WHERE id = ?').run(newStatus, licenseId);

  recordAuditLog(userId, app.id, newStatus === 'revoked' ? 'LICENSE_REVOKED' : 'LICENSE_RESTORED', `License '${lic.license_key}' marked as ${newStatus} by @${req.user.username}`, req.ip);
  res.json({ success: true, message: `License '${lic.license_key}' status updated to ${newStatus}.` });
}

// 4. Reset License HWID
export function resetLicenseHwid(req, res) {
  const { appId, licenseId } = req.params;
  const userId = req.user.id;
  const isSuperAdmin = req.user.role === 'admin';

  const app = verifyAppAccess(appId, userId, 'manage_licenses', isSuperAdmin);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });

  const lic = db.prepare('SELECT * FROM licenses WHERE id = ? AND (app_id = ? OR app_id = ?)').get(licenseId, app.id, app.app_name);
  if (!lic) return res.status(404).json({ success: false, message: 'License not found.' });

  db.prepare('UPDATE licenses SET bound_hwid = NULL WHERE id = ?').run(licenseId);
  recordAuditLog(userId, app.id, 'HWID_RESET', `Reset bound HWID on license '${lic.license_key}' by @${req.user.username}`, req.ip);

  res.json({ success: true, message: `Hardware profile reset on license '${lic.license_key}'.` });
}

// 5. Delete License
export function deleteLicense(req, res) {
  const { appId, licenseId } = req.params;
  const userId = req.user.id;
  const isSuperAdmin = req.user.role === 'admin';

  if (licenseId === 'all') {
    return deleteAllAppLicenses(req, res);
  }

  const app = verifyAppAccess(appId, userId, 'manage_licenses', isSuperAdmin);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });

  const lic = db.prepare('SELECT license_key FROM licenses WHERE id = ? AND (app_id = ? OR app_id = ?)').get(licenseId, app.id, app.app_name);
  if (!lic) return res.status(404).json({ success: false, message: 'License not found.' });

  db.prepare('DELETE FROM licenses WHERE id = ?').run(licenseId);
  recordAuditLog(userId, app.id, 'LICENSE_DELETED', `Deleted license key '${lic.license_key}' by @${req.user.username}`, req.ip);

  res.json({ success: true, message: `License '${lic.license_key}' deleted.` });
}

// 6. Bulk Generate Licenses (Developer & Pro Exclusive)
export function bulkGenerateLicenses(req, res) {
  const { appId } = req.params;
  const { count = 100, duration_days = 0, prefix = '', mask = '', note = '' } = req.body;
  const userId = req.user.id;
  const isSuperAdmin = req.user.role === 'admin';

  const app = verifyAppAccess(appId, userId, 'manage_licenses', isSuperAdmin);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });

  const effectivePlan = isSuperAdmin ? 'pro' : (app.effectivePlan || 'free');
  const parsedCount = Math.min(Math.max(parseInt(count) || 10, 1), 1000);

  if (effectivePlan === 'free' && !isSuperAdmin && parsedCount > 5) {
    return res.status(403).json({
      success: false,
      code: 'PREMIUM_FEATURE_REQUIRED',
      message: 'Bulk License Generation (> 5 keys) is exclusive to Developer ($1.20/mo) and Pro ($3.20/mo) plans.'
    });
  }

  let effectiveMask = (mask || app.custom_key_mask || '').trim();
  if (effectiveMask) {
    const asteriskCount = (effectiveMask.match(/\*/g) || []).length;
    if (asteriskCount < 3) {
      effectiveMask = `${effectiveMask}-****-****-****`;
    }
  }
  const cleanPrefix = (prefix.trim() || 'HABIT').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const now = Math.floor(Date.now() / 1000);

  const createdKeys = [];
  const stmt = db.prepare(`
    INSERT INTO licenses (
      id, app_id, license_key, token, status, duration_days, bound_user_id, 
      bound_username, bound_hwid, activations_count, note, expires_at, created_at
    )
    VALUES (?, ?, ?, ?, 'unused', ?, NULL, NULL, NULL, 0, ?, ?, ?)
  `);

  const generateKey = () => {
    if (effectiveMask) {
      return effectiveMask.replace(/\*/g, () => crypto.randomBytes(1).toString('hex').slice(0, 1).toUpperCase());
    }
    return `${cleanPrefix}-${generateRandomSegment(4)}-${generateRandomSegment(4)}-${generateRandomSegment(4)}-${generateRandomSegment(4)}`;
  };

  db.exec('BEGIN TRANSACTION;');
  try {
    for (let i = 0; i < parsedCount; i++) {
      const licId = 'lic_' + uuidv4().slice(0, 10);
      let key = generateKey();
      let attempts = 0;
      while (db.prepare('SELECT 1 FROM licenses WHERE license_key = ?').get(key) && attempts < 10) {
        key = generateKey();
        attempts++;
      }
      const licToken = 'tok_' + uuidv4().replace(/-/g, '').slice(0, 24);
      let expiresAt = 0;
      if (duration_days > 0) {
        expiresAt = now + (duration_days * 86400);
      }
      stmt.run(licId, app.id, key, licToken, duration_days, (note || '').trim(), expiresAt, now);
      createdKeys.push(key);
    }
    db.exec('COMMIT;');
  } catch (e) {
    db.exec('ROLLBACK;');
    console.error('Bulk generate error:', e);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate bulk licenses: ' + (e.message || 'database error')
    });
  }

  recordAuditLog(userId, app.id, 'BULK_LICENSES_CREATED', `Bulk generated ${parsedCount} license key(s) with format '${effectiveMask || cleanPrefix}' (by @${req.user.username})`, req.ip);
  triggerDiscordWebhook(app.id, 'license_created', 'Bulk Licenses Generated', `Bulk created **${parsedCount}** license keys for **${app.app_name}** by **@${req.user.username}**.`, [
    { name: 'Count', value: parsedCount },
    { name: 'Duration', value: duration_days === 0 ? 'Lifetime' : `${duration_days} Days` },
    { name: 'Format', value: effectiveMask || `${cleanPrefix}-XXXX-XXXX` }
  ]);

  res.status(201).json({
    success: true,
    message: `Bulk generated ${parsedCount} license keys successfully!`,
    count: parsedCount,
    keys: createdKeys
  });
}

// 7. Export Licenses as TXT or CSV (for Shoppy, Sellix, Discord)
export function exportLicenses(req, res) {
  const { appId } = req.params;
  const { format = 'txt', status = 'all' } = req.query;
  const userId = req.user.id;
  const isSuperAdmin = req.user.role === 'admin';

  const app = verifyAppAccess(appId, userId, 'manage_licenses', isSuperAdmin);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });

  let query = 'SELECT * FROM licenses WHERE app_id = ? OR app_id = ?';
  const params = [app.id, app.app_name];
  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';

  const licenses = db.prepare(query).all(...params);

  const cleanAppName = app.app_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanAppName}_licenses_${Date.now()}.${format === 'csv' ? 'csv' : 'txt'}`;

  if (format === 'csv') {
    const csvRows = ['"License Key","Status","Duration Days","Bound User","Bound HWID","Note","Created At","Expires At"'];
    for (const lic of licenses) {
      csvRows.push([
        `"${lic.license_key}"`,
        `"${lic.status}"`,
        lic.duration_days,
        `"${lic.bound_username || ''}"`,
        `"${lic.bound_hwid || ''}"`,
        `"${(lic.note || '').replace(/"/g, '""')}"`,
        `"${new Date(lic.created_at * 1000).toISOString()}"`,
        lic.expires_at ? `"${new Date(lic.expires_at * 1000).toISOString()}"` : '"Lifetime"'
      ].join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvRows.join('\r\n'));
  }

  // Plain Text (One key per line)
  const txtContent = licenses.map(l => l.license_key).join('\r\n');
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(txtContent);
}

// 8. Freeze / Pause Subscriptions (Maintenance Mode)
export function toggleFreezeLicenses(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;
  const isSuperAdmin = req.user.role === 'admin';

  const app = verifyAppAccess(appId, userId, 'manage_licenses', isSuperAdmin);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });

  const now = Math.floor(Date.now() / 1000);
  const currentlyFrozen = !!app.subscriptions_frozen;

  if (!currentlyFrozen) {
    // FREEZE NOW
    db.prepare('UPDATE applications SET subscriptions_frozen = 1, frozen_at = ? WHERE id = ?').run(now, app.id);
    db.prepare("UPDATE licenses SET is_frozen = 1, frozen_at = ? WHERE (app_id = ? OR app_id = ?) AND status = 'active'").run(now, app.id, app.app_name);

    recordAuditLog(userId, app.id, 'SUBSCRIPTIONS_FROZEN', `Froze all active subscriptions and licenses for maintenance.`, req.ip);
    triggerDiscordWebhook(app.id, 'maintenance_frozen', 'Subscriptions Frozen', `All active subscriptions for **${app.app_name}** have been frozen for maintenance. Time is paused.`, []);

    return res.json({
      success: true,
      frozen: true,
      message: 'All active subscriptions and licenses are now FROZEN. Client expiration timers are paused.'
    });
  } else {
    // UNFREEZE & EXTEND EXPIRATION
    const frozenDuration = Math.max(now - (app.frozen_at || now), 0);
    const frozenHours = (frozenDuration / 3600).toFixed(1);

    db.prepare(`
      UPDATE licenses 
      SET is_frozen = 0, frozen_at = 0, expires_at = expires_at + ? 
      WHERE (app_id = ? OR app_id = ?) AND status = 'active' AND expires_at > 0
    `).run(frozenDuration, app.id, app.app_name);

    db.prepare(`
      UPDATE application_users 
      SET expires_at = expires_at + ? 
      WHERE (app_id = ? OR app_id = ?) AND status = 'active' AND expires_at > 0
    `).run(frozenDuration, app.id, app.app_name);

    db.prepare('UPDATE applications SET subscriptions_frozen = 0, frozen_at = 0 WHERE id = ?').run(app.id);

    recordAuditLog(userId, app.id, 'SUBSCRIPTIONS_RESUMED', `Resumed subscriptions. Extended all active user validity by ${frozenHours} hour(s).`, req.ip);
    triggerDiscordWebhook(app.id, 'maintenance_resumed', 'Subscriptions Resumed', `Subscriptions for **${app.app_name}** resumed! Expirations automatically extended by **${frozenHours} hours**.`, []);

    return res.json({
      success: true,
      frozen: false,
      extended_seconds: frozenDuration,
      message: `Subscriptions RESUMED! All active licenses extended by ${frozenHours} hour(s) for maintenance downtime.`
    });
  }
}

// 9. Delete All Licenses for an Application
export function deleteAllAppLicenses(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;
  const isSuperAdmin = req.user.role === 'admin';

  const app = verifyAppAccess(appId, userId, 'manage_licenses', isSuperAdmin);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });

  const countResult = db.prepare('SELECT COUNT(*) as count FROM licenses WHERE app_id = ? OR app_id = ?').get(app.id, app.app_name);
  const totalCount = countResult ? countResult.count : 0;

  db.prepare('DELETE FROM licenses WHERE app_id = ? OR app_id = ?').run(app.id, app.app_name);
  recordAuditLog(userId, app.id, 'LICENSE_DELETED', `Deleted all ${totalCount} licenses for application '${app.app_name}' by @${req.user.username}`, req.ip);

  res.json({ success: true, message: `All ${totalCount} licenses deleted successfully.`, count: totalCount });
}
