import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    console.warn('[SECURITY WARNING] JWT_SECRET is not set in environment variables! Using insecure default.');
  }
  return process.env.JWT_SECRET || 'habit_auth_super_secret_jwt_key_2026_billion_scale';
};


export function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No bearer token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    
    // Check if session exists and is not revoked
    const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND is_revoked = 0').get(token);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Session expired or revoked.' });
    }

    // Update last_active
    const now = Math.floor(Date.now() / 1000);
    db.prepare('UPDATE sessions SET last_active = ? WHERE id = ?').run(now, session.id);

    // Fetch user account & subscription
    const user = db.prepare(`
      SELECT a.*, s.plan, s.status as sub_status, s.expires_at as sub_expires_at, s.started_at as sub_started_at 
      FROM accounts a 
      LEFT JOIN subscriptions s ON s.user_id = a.id 
      WHERE a.id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    if ((user.plan === 'developer' || user.plan === 'pro') && user.sub_expires_at > 0 && user.sub_expires_at < now) {
      if (user.sub_status !== 'expired') {
        db.prepare("UPDATE subscriptions SET status = 'expired' WHERE user_id = ?").run(user.id);
      }
      user.sub_status = 'expired';
    }

    if (user.status === 'banned') {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_BANNED',
        message: 'Your developer account has been suspended by the system administrator.',
        ban_reason: user.ban_reason || 'Terms of Service violation'
      });
    }

    req.user = user;
    req.session = session;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
}

export function checkMaintenanceMode(req, res, next) {
  // Allow all read-only inspection operations (view dashboard, apps, users, analytics)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Super Admins are exempt to manage or fix systems
  if (req.user?.role === 'admin') {
    return next();
  }

  // Check maintenance_mode in database
  const setting = db.prepare("SELECT value FROM system_settings WHERE key = 'maintenance_mode'").get();
  if (setting && setting.value === 'true') {
    const msg = db.prepare("SELECT value FROM system_settings WHERE key = 'maintenance_message'").get();
    return res.status(503).json({
      success: false,
      maintenance_mode: true,
      message: msg?.value || 'System is under scheduled maintenance. Modifications (creating apps, generating licenses, deleting records) are temporarily locked.'
    });
  }

  next();
}

