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
    
    // Check if session was explicitly revoked
    let currentSession = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    if (currentSession && currentSession.is_revoked) {
      return res.status(401).json({ success: false, message: 'Session has been revoked.' });
    }

    const now = Math.floor(Date.now() / 1000);

    // If session row is missing (e.g. wiped during database cleanup or server reboot), rehydrate it
    if (!currentSession) {
      const sessionId = 'ses_' + (decoded.sessionKey ? String(decoded.sessionKey).slice(0, 12) : Math.random().toString(36).substring(2, 12));
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      try {
        db.prepare(`
          INSERT OR REPLACE INTO sessions (id, user_id, token, ip_address, user_agent, created_at, last_active, is_revoked)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        `).run(sessionId, decoded.userId, token, ip, userAgent, now, now);
        currentSession = { id: sessionId, user_id: decoded.userId, token, ip_address: ip, user_agent: userAgent, created_at: now, last_active: now, is_revoked: 0 };
      } catch (e) {
        currentSession = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
      }
    } else {
      // Update last_active
      db.prepare('UPDATE sessions SET last_active = ? WHERE id = ?').run(now, currentSession.id);
    }

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
    req.session = currentSession || { id: 'ses_active', user_id: user.id, token };
    next();
  } catch (err) {
    console.error('[AUTH ERROR in authenticateUser]:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
}

export function checkMaintenanceMode(req, res, next) {
  // Allow all read-only inspection operations (view dashboard, apps, users, analytics)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Super Admins and Owners are exempt to manage or fix systems
  if (req.user?.role === 'admin' || req.user?.role === 'owner') {
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

