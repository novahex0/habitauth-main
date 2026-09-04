import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { recordAuditLog } from '../middleware/helpers.js';

// Helper to check if an incoming IP or HWID is blacklisted
export function isBlacklisted(appId, ip, hwid) {
  if (!ip && !hwid) return null;

  // 1. Check HWID Blacklist (matches specific app or global)
  if (hwid) {
    const hwidMatch = db.prepare(`
      SELECT * FROM blacklists 
      WHERE type = 'hwid' AND LOWER(value) = LOWER(?) 
        AND (app_id IS NULL OR app_id = 'global' OR app_id = ?)
      LIMIT 1
    `).get(hwid.trim(), appId || '');

    if (hwidMatch) {
      return { type: 'hwid', value: hwid, reason: hwidMatch.reason || 'Hardware ID has been blacklisted.' };
    }
  }

  // 2. Check IP Blacklist (matches specific app or global)
  if (ip) {
    const cleanIp = ip.replace('::ffff:', '').trim();
    const ipMatch = db.prepare(`
      SELECT * FROM blacklists 
      WHERE type = 'ip' AND value = ? 
        AND (app_id IS NULL OR app_id = 'global' OR app_id = ?)
      LIMIT 1
    `).get(cleanIp, appId || '');

    if (ipMatch) {
      return { type: 'ip', value: cleanIp, reason: ipMatch.reason || 'IP address has been blacklisted.' };
    }
  }

  return null;
}

// 1. GET all blacklists (Scoped to user apps or admin)
export function getBlacklists(req, res) {
  const { appId, type, search = '' } = req.query;
  const user = req.user;

  let query = `
    SELECT b.*, a.app_name, u.username as creator_username
    FROM blacklists b
    LEFT JOIN applications a ON a.id = b.app_id
    LEFT JOIN accounts u ON u.id = b.user_id
    WHERE 1=1
  `;
  const params = [];

  // If not super admin, restrict to user's apps or blacklists created by them
  if (user.role !== 'admin') {
    query += ` AND (b.user_id = ? OR b.app_id IN (SELECT id FROM applications WHERE user_id = ?))`;
    params.push(user.id, user.id);
  }

  if (appId && appId !== 'all') {
    query += ` AND b.app_id = ?`;
    params.push(appId);
  }

  if (type && type !== 'all') {
    query += ` AND b.type = ?`;
    params.push(type);
  }

  if (search.trim()) {
    query += ` AND (b.value LIKE ? OR b.reason LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  query += ` ORDER BY b.created_at DESC LIMIT 150`;

  const blacklists = db.prepare(query).all(...params);
  res.json({ success: true, blacklists });
}

// 2. ADD entry to blacklist
export function addBlacklist(req, res) {
  const { type, value, reason = 'Administrative ban / security policy violation', appId } = req.body;
  const user = req.user;

  if (!type || !value) {
    return res.status(400).json({ success: false, message: 'Type (ip or hwid) and Value are required.' });
  }

  const normalizedType = type.toLowerCase() === 'ip' ? 'ip' : 'hwid';
  let cleanValue = value.trim();
  if (normalizedType === 'ip') {
    cleanValue = cleanValue.replace('::ffff:', '');
  }

  // Check duplicate
  const targetAppId = (appId && appId !== 'global') ? appId : null;
  const existing = db.prepare(`
    SELECT id FROM blacklists 
    WHERE type = ? AND LOWER(value) = LOWER(?) AND (app_id IS ? OR app_id = ?)
  `).get(normalizedType, cleanValue, targetAppId, targetAppId || '');

  if (existing) {
    return res.status(400).json({ success: false, message: `This ${normalizedType.toUpperCase()} is already blacklisted.` });
  }

  const id = `blk_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO blacklists (id, app_id, user_id, type, value, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, targetAppId, user.id, normalizedType, cleanValue, reason.trim(), now);

  recordAuditLog(
    user.id,
    targetAppId,
    'BLACKLIST_ADDED',
    `Added ${normalizedType.toUpperCase()} '${cleanValue}' to blacklist. Reason: ${reason}`,
    req.ip
  );

  res.json({
    success: true,
    message: `${normalizedType.toUpperCase()} '${cleanValue}' has been added to the blacklist.`,
    blacklist: { id, app_id: targetAppId, type: normalizedType, value: cleanValue, reason, created_at: now }
  });
}

// 3. REMOVE entry from blacklist
export function removeBlacklist(req, res) {
  const { blacklistId } = req.params;
  const user = req.user;

  const item = db.prepare('SELECT * FROM blacklists WHERE id = ?').get(blacklistId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Blacklist entry not found.' });
  }

  // Permission check: admin or owner
  if (user.role !== 'admin' && item.user_id !== user.id) {
    const app = item.app_id ? db.prepare('SELECT user_id FROM applications WHERE id = ?').get(item.app_id) : null;
    if (!app || app.user_id !== user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to remove this blacklist entry.' });
    }
  }

  db.prepare('DELETE FROM blacklists WHERE id = ?').run(blacklistId);

  recordAuditLog(
    user.id,
    item.app_id,
    'BLACKLIST_REMOVED',
    `Removed ${item.type.toUpperCase()} '${item.value}' from blacklist.`,
    req.ip
  );

  res.json({ success: true, message: `${item.type.toUpperCase()} '${item.value}' unblocked successfully.` });
}
