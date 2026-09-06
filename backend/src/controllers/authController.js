import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { recordAuditLog, sendInAppNotification } from '../middleware/helpers.js';
import { getJwtSecret } from '../middleware/authMiddleware.js';

// Helper to create a session
function createSession(userId, req) {
  const token = jwt.sign({ userId, sessionKey: uuidv4() }, getJwtSecret(), { expiresIn: '30d' });
  const sessionId = 'ses_' + uuidv4().slice(0, 12);
  const now = Math.floor(Date.now() / 1000);
  
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';

  let browser = 'Chrome';
  let os = 'Windows 11';
  let device = 'Desktop PC';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) { os = 'Android'; device = 'Mobile'; }
  else if (userAgent.includes('iPhone')) { os = 'iOS'; device = 'iPhone'; }

  db.prepare(`
    INSERT INTO sessions (id, user_id, token, device, browser, os, ip_address, created_at, last_active, is_revoked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(sessionId, userId, token, device, browser, os, ip, now, now);

  return { token, sessionId };
}

// 1. Discord OAuth2 Flow URL & Direct Redirect
export function getDiscordAuthUrl(req, res) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI || 'https://habitauth.com/api/v1/auth/discord/callback');
  const state = uuidv4();

  if (!clientId || clientId === 'your_discord_client_id_here') {
    return res.json({
      success: false,
      devMode: true,
      message: 'Discord credentials not configured yet in .env. Use Dev Instant Login for instant localhost access.'
    });
  }

  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email&state=${state}`;
  res.json({ success: true, url });
}

export function redirectToDiscord(req, res) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI || 'https://habitauth.com/api/v1/auth/discord/callback');
  const state = uuidv4();

  if (!clientId || clientId === 'your_discord_client_id_here') {
    return res.redirect('/?error=discord_not_configured');
  }

  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email&state=${state}`;
  res.redirect(url);
}

// 2. Discord Callback
export async function discordCallback(req, res) {
  const { code, error, error_description } = req.query;
  if (error || !code) {
    console.warn('[DISCORD OAUTH] User canceled or error:', error, error_description);
    const msg = encodeURIComponent(error_description || error || 'Discord authentication canceled');
    return res.redirect(`/?error=discord_auth_canceled&msg=${msg}`);
  }

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('[DISCORD OAUTH] Token response error:', tokenData);
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to retrieve Discord access token');
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const discordUser = await userResponse.json();
    if (!discordUser.id) {
      console.error('[DISCORD OAUTH] User profile response error:', discordUser);
      throw new Error('Failed to retrieve Discord user profile');
    }

    // RULE: Same Discord ID ALWAYS maps to the exact same Habit Auth account!
    let account = db.prepare('SELECT * FROM accounts WHERE discord_id = ?').get(discordUser.id);
    const now = Math.floor(Date.now() / 1000);
    const avatar = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    const adminIds = (process.env.ADMIN_DISCORD_IDS || '100000000000000001').split(',').map(s => s.trim()).filter(Boolean);
    const isOwner = discordUser.id === '1281266486601715834' || discordUser.username === 'meherab009';
    const isAdmin = isOwner || adminIds.includes(discordUser.id);
    const role = isOwner ? 'owner' : (isAdmin ? 'admin' : 'user');

    if (!account) {
      const newId = isOwner ? 'usr_c0049143710d4e5c' : ('usr_' + uuidv4().replace(/-/g, '').slice(0, 16));
      db.prepare(`
        INSERT INTO accounts (id, discord_id, username, email, avatar, role, log_cycle_start, created_at, updated_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(newId, discordUser.id, discordUser.username, discordUser.email || null, avatar, role, now, now, now);

      // Initialize Subscription: Pro Plan for Owner/Admin, Free for User
      const initPlan = (isOwner || isAdmin) ? 'pro' : 'free';
      db.prepare(`
        INSERT INTO subscriptions (id, user_id, plan, status, started_at, expires_at, provider, created_at)
        VALUES (?, ?, ?, 'active', ?, 0, 'discord', ?)
      `).run('sub_' + uuidv4().slice(0, 12), newId, initPlan, now, now);

      account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(newId);
      recordAuditLog(newId, null, 'USER_REGISTERED', `New account created via Discord OAuth (${discordUser.username})`, req.ip);
    } else {
      let targetRole = account.role;
      if (isOwner) {
        targetRole = 'owner';
      } else if (isAdmin && account.role !== 'owner') {
        targetRole = 'admin';
      }
      db.prepare('UPDATE accounts SET username = ?, avatar = ?, role = ?, updated_at = ? WHERE id = ?')
        .run(discordUser.username, avatar, targetRole, now, account.id);
      account.role = targetRole;

      if (isOwner || isAdmin) {
        db.prepare("UPDATE subscriptions SET plan = 'pro', status = 'active' WHERE user_id = ?").run(account.id);
      }
    }

    if (account.status === 'banned') {
      const reasonParam = encodeURIComponent(account.ban_reason || 'Administrative Action: Violation of Terms');
      return res.redirect(`/?error=account_banned&reason=${reasonParam}`);
    }

    const { token } = createSession(account.id, req);
    recordAuditLog(account.id, null, 'LOGIN_SUCCESS', `Dashboard login via Discord OAuth`, req.ip);

    res.redirect(`/?step=auth_success&token=${token}`);
  } catch (err) {
    console.error('Discord OAuth error:', err);
    const msg = encodeURIComponent(err.message || 'OAuth authentication failed');
    res.redirect(`/?error=oauth_failed&msg=${msg}`);
  }
}

// 3. Dev Instant Quick Login (Zero-friction local development)
export function devQuickLogin(req, res) {
  const { username = 'AdminOwner', discord_id = '100000000000000001' } = req.body;
  const now = Math.floor(Date.now() / 1000);

  let account = db.prepare('SELECT * FROM accounts WHERE discord_id = ? OR username = ?').get(discord_id, username);
  if (!account) {
    const newId = 'usr_' + uuidv4().replace(/-/g, '').slice(0, 16);
    const role = (discord_id === '100000000000000001' || username === 'AdminOwner') ? 'admin' : 'user';
    const avatar = 'https://cdn.discordapp.com/embed/avatars/0.png';

    db.prepare(`
      INSERT INTO accounts (id, discord_id, username, email, avatar, role, log_cycle_start, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, discord_id, username, `${username.toLowerCase()}@habitauth.dev`, avatar, role, now, now, now);

    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan, status, started_at, expires_at, provider, created_at)
      VALUES (?, ?, 'pro', 'active', ?, 0, 'discord', ?)
    `).run('sub_' + uuidv4().slice(0, 12), newId, now, now);

    account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(newId);
  } else if (discord_id === '100000000000000001' || username === 'AdminOwner') {
    db.prepare("UPDATE accounts SET role = 'admin' WHERE id = ?").run(account.id);
    account.role = 'admin';
  }

  if (account.status === 'banned') {
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_BANNED',
      message: 'Your developer account has been suspended by the administrator.',
      ban_reason: account.ban_reason || 'Terms of Service violation'
    });
  }

  const { token, sessionId } = createSession(account.id, req);
  recordAuditLog(account.id, null, 'LOGIN_SUCCESS', `Dashboard login via Dev Instant Auth (${username})`, req.ip);

  const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(account.id);

  res.json({
    success: true,
    token,
    user: {
      id: account.id,
      username: account.id === 'usr_admin_demo' ? 'AdminOwner' : account.username,
      discord_id: account.discord_id,
      email: account.email,
      avatar: account.avatar,
      role: account.role,
      plan: sub?.plan || 'free'
    }
  });
}

// 4. Get Current User Profile & Subscription
export function getProfile(req, res) {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      discord_id: user.discord_id,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      plan: user.plan || 'free',
      sub_status: user.sub_status || 'active',
      sub_started_at: user.sub_started_at || 0,
      sub_expires_at: user.sub_expires_at || 0,
      has_password: !!user.password_hash
    }
  });
}

// 5. Active Sessions Management
export function getActiveSessions(req, res) {
  const userId = req.user.id;
  const currentToken = req.session.token;

  const sessions = db.prepare(`
    SELECT id, device, browser, os, ip_address, created_at, last_active, token 
    FROM sessions 
    WHERE user_id = ? AND is_revoked = 0 
    ORDER BY last_active DESC
  `).all(userId);

  const sanitized = sessions.map(s => ({
    id: s.id,
    device: s.device,
    browser: s.browser,
    os: s.os,
    ip_address: s.ip_address,
    created_at: s.created_at,
    last_active: s.last_active,
    is_current: s.token === currentToken
  }));

  res.json({ success: true, sessions: sanitized });
}

// 6. Revoke a Single Session
export function revokeSession(req, res) {
  const { sessionId } = req.params;
  const userId = req.user.id;

  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(sessionId, userId);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  db.prepare('UPDATE sessions SET is_revoked = 1 WHERE id = ?').run(sessionId);
  recordAuditLog(userId, null, 'LOGOUT_SESSION', `Revoked session ${sessionId} (${session.browser} on ${session.os})`, req.ip);

  res.json({ success: true, message: 'Session revoked successfully.' });
}

// 7. Logout All Other Sessions
export function logoutAllOtherSessions(req, res) {
  const userId = req.user.id;
  const currentSessionId = req.session.id;

  db.prepare('UPDATE sessions SET is_revoked = 1 WHERE user_id = ? AND id != ?').run(userId, currentSessionId);
  recordAuditLog(userId, null, 'LOGOUT_ALL_OTHER_SESSIONS', 'Logged out of all other active sessions', req.ip);

  res.json({ success: true, message: 'All other active sessions have been invalidated.' });
}

// 8. Logout All Sessions (Including Current)
export function logoutAllSessions(req, res) {
  const userId = req.user.id;

  db.prepare('UPDATE sessions SET is_revoked = 1 WHERE user_id = ?').run(userId);
  recordAuditLog(userId, null, 'LOGOUT_ALL_SESSIONS', 'Terminated all active sessions', req.ip);

  res.json({ success: true, message: 'All active sessions have been terminated. Please log in again.' });
}

// 9. Standard Logout (Current Session)
export function logout(req, res) {
  const session = req.session;
  if (session) {
    db.prepare('UPDATE sessions SET is_revoked = 1 WHERE id = ?').run(session.id);
    recordAuditLog(req.user.id, null, 'LOGOUT', 'User logged out', req.ip);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
}

// 10. Developer Direct Registration (Sign Up)
export async function registerAccount(req, res) {
  const { username, password, email } = req.body;
  const now = Math.floor(Date.now() / 1000);

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Username must be at least 3 characters long.' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  const cleanUsername = username.trim();
  const cleanEmail = email && typeof email === 'string' ? email.trim() : `${cleanUsername.toLowerCase()}@habitauth.dev`;

  // Check if username already exists
  const existing = db.prepare('SELECT id FROM accounts WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Username is already taken. Please choose another.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const newId = 'usr_' + uuidv4().replace(/-/g, '').slice(0, 16);
    const placeholderDiscordId = 'local_' + uuidv4().replace(/-/g, '').slice(0, 16);
    const avatar = 'https://cdn.discordapp.com/embed/avatars/0.png';

    db.prepare(`
      INSERT INTO accounts (id, discord_id, username, email, avatar, role, password_hash, log_cycle_start, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?, ?)
    `).run(newId, placeholderDiscordId, cleanUsername, cleanEmail, avatar, passwordHash, now, now, now);

    // Initialize Free plan subscription
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan, status, started_at, expires_at, provider, created_at)
      VALUES (?, ?, 'free', 'active', ?, 0, 'credentials', ?)
    `).run('sub_' + uuidv4().slice(0, 12), newId, now, now);

    const { token } = createSession(newId, req);
    recordAuditLog(newId, null, 'USER_REGISTERED', `New developer registered with credentials (${cleanUsername})`, req.ip);

    res.status(201).json({
      success: true,
      token,
      message: 'Account registered successfully!',
      user: {
        id: newId,
        username: cleanUsername,
        email: cleanEmail,
        avatar,
        role: 'user',
        plan: 'free'
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
}

// 11. Developer Direct Login (Sign In with Username & Password)
export async function loginAccount(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const account = db.prepare('SELECT * FROM accounts WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)').get(username.trim(), username.trim());
    if (!account || !account.password_hash) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, account.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    if (account.status === 'banned') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_BANNED',
        message: 'Your developer account has been suspended by the administrator.',
        ban_reason: account.ban_reason || 'Terms of Service violation'
      });
    }

    const { token } = createSession(account.id, req);
    recordAuditLog(account.id, null, 'LOGIN_SUCCESS', `Dashboard login with credentials (${account.username})`, req.ip);

    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(account.id);

    res.json({
      success: true,
      token,
      message: 'Logged in successfully!',
      user: {
        id: account.id,
        username: account.username,
        email: account.email,
        avatar: account.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
        role: account.role,
        plan: sub?.plan || 'free'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

// 12. Super Admin: Generate Password Reset Link for User Ticket
export function adminGenerateResetLink(req, res) {
  const { userId } = req.params;
  const now = Math.floor(Date.now() / 1000);

  const account = db.prepare('SELECT id, username, email FROM accounts WHERE id = ?').get(userId);
  if (!account) {
    return res.status(404).json({ success: false, message: 'Developer account not found.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = now + (24 * 3600); // 24 hours validity

  db.prepare('UPDATE accounts SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
    .run(resetToken, expiresAt, account.id);

  recordAuditLog(req.user.id, null, 'RESET_TOKEN_GENERATED', `Generated password reset link for user '${account.username}'`, req.ip);

  // Derive domain from host header or protocol
  const host = req.get('host') || 'localhost:5173';
  const protocol = req.protocol === 'https' ? 'https' : 'http';
  // If request came to port 5000 in dev, point to port 5173 for client UI
  const clientHost = host.includes(':5000') ? host.replace(':5000', ':5173') : host;
  const resetUrl = `${protocol}://${clientHost}/reset-password?token=${resetToken}`;

  res.json({
    success: true,
    message: 'Password reset link generated successfully.',
    reset_url: resetUrl,
    reset_link: resetUrl,
    token: resetToken,
    reset_token: resetToken,
    expires_in_hours: 24,
    account: {
      id: account.id,
      username: account.username,
      email: account.email
    }
  });
}

// 13. Public: Reset Password With Token
export async function resetPasswordWithToken(req, res) {
  const token = req.body.token || req.body.reset_token;
  const newPassword = req.body.newPassword || req.body.new_password;
  const now = Math.floor(Date.now() / 1000);

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Valid token and new password (min 6 characters) required.' });
  }

  try {
    const account = db.prepare('SELECT id, username FROM accounts WHERE reset_token = ? AND reset_token_expires > ?')
      .get(token.trim(), now);

    if (!account) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    db.prepare('UPDATE accounts SET password_hash = ?, reset_token = NULL, reset_token_expires = 0, updated_at = ? WHERE id = ?')
      .run(passwordHash, now, account.id);

    // Invalidate all active sessions for security
    db.prepare('UPDATE sessions SET is_revoked = 1 WHERE user_id = ?').run(account.id);

    recordAuditLog(account.id, null, 'PASSWORD_RESET', `Password was successfully updated via admin reset link`, req.ip);

    res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now sign in with your new credentials.'
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
}

// 14. Developer: Set or Update Direct Credentials (Username & Password)
export async function setDirectCredentials(req, res) {
  const { username, password } = req.body;
  const userId = req.user.id;
  const now = Math.floor(Date.now() / 1000);

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Username must be at least 3 characters long.' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  const cleanUsername = username.trim();

  // Check if username is taken by another account
  const existing = db.prepare('SELECT id FROM accounts WHERE LOWER(username) = LOWER(?) AND id != ?').get(cleanUsername, userId);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Username is already taken by another account. Please pick another one.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    db.prepare('UPDATE accounts SET username = ?, password_hash = ?, updated_at = ? WHERE id = ?')
      .run(cleanUsername, passwordHash, now, userId);

    recordAuditLog(userId, null, 'CREDENTIALS_SET', `Direct login credentials set for user (${cleanUsername})`, req.ip);
    sendInAppNotification(
      userId,
      'Direct Login Configured',
      `You can now sign in using your username "${cleanUsername}" and password from any browser or device without requiring Discord.`,
      'security'
    );

    res.json({
      success: true,
      message: 'Direct credentials successfully saved! You can now log in using this username and password.',
      username: cleanUsername,
      has_password: true
    });
  } catch (err) {
    console.error('Error setting credentials:', err);
    res.status(500).json({ success: false, message: 'Failed to set direct credentials.' });
  }
}


