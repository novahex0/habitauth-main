import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Enforce plan quota server-side (Free: 1 App / 10 Users, Dev: 100 Apps / 10K Users, Pro: 1000 Apps / 100K Users)
export function checkAppLimit(req, res, next) {
  const user = req.user;
  // SECURITY: treat expired subscriptions as free plan
  const isExpired = user.sub_status === 'expired';
  const userPlan = (isExpired ? 'free' : user.plan) || 'free';
  const isSuperAdmin = user.role === 'admin';
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?').get(user.id).count;

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

  if (appCount >= maxAllowed) {
    return res.status(403).json({
      success: false,
      code: 'APP_LIMIT_REACHED',
      message: `You have reached the ${maxAllowed} application limit on the ${userPlan.toUpperCase()} plan. Upgrade to a higher plan to create more applications.`
    });
  }
  next();
}

// Centralized App Access & Permissions Verifier (Supports Direct Owner, Super Admin & Active Team Members)
export function verifyAppAccess(appId, userId, requiredPerm = null, isSuperAdmin = false) {
  if (!appId || !userId) return null;

  // 1. Super Admin access: can access any application
  if (isSuperAdmin) {
    const app = db.prepare('SELECT * FROM applications WHERE id = ? OR app_name = ?').get(appId, appId);
    if (app) {
      const ownerSub = db.prepare('SELECT plan FROM subscriptions WHERE user_id = ?').get(app.user_id);
      const ownerAcc = db.prepare('SELECT plan, role FROM accounts WHERE id = ?').get(app.user_id);
      const effectivePlan = (ownerAcc?.role === 'admin') ? 'pro' : (ownerSub?.plan || ownerAcc?.plan || 'pro');
      return { ...app, accessRole: 'admin', isAdmin: true, effectivePlan, ownerId: app.user_id, isTeamAccess: false };
    }
    return null;
  }

  // 2. Direct Application Owner check
  const directApp = db.prepare('SELECT * FROM applications WHERE (id = ? OR app_name = ?) AND user_id = ?').get(appId, appId, userId);
  if (directApp) {
    const ownerSub = db.prepare('SELECT plan FROM subscriptions WHERE user_id = ?').get(userId);
    const ownerAcc = db.prepare('SELECT plan, role FROM accounts WHERE id = ?').get(userId);
    const effectivePlan = (ownerAcc?.role === 'admin') ? 'pro' : (ownerSub?.plan || ownerAcc?.plan || 'free');
    return { ...directApp, accessRole: 'owner', isAdmin: true, effectivePlan, ownerId: userId, isTeamAccess: false };
  }

  // 3. Team Member Access check
  const teamApp = db.prepare(`
    SELECT tm.role, tm.permissions, a.*, a.user_id as app_owner_id
    FROM applications a
    JOIN teams t ON t.owner_id = a.user_id
    JOIN team_members tm ON tm.team_id = t.id
    WHERE (a.id = ? OR a.app_name = ?) AND tm.user_id = ? AND tm.status = 'active'
  `).get(appId, appId, userId);

  if (!teamApp) return null;

  const role = (teamApp.role || 'developer').toLowerCase();
  let perms = {};
  try {
    perms = typeof teamApp.permissions === 'string' ? JSON.parse(teamApp.permissions) : (teamApp.permissions || {});
  } catch (e) {
    perms = {};
  }

  const isTeamAdmin = (role === 'admin');

  // If a specific permission is required, check admin role or permission flag
  if (requiredPerm) {
    if (!isTeamAdmin && !perms[requiredPerm]) {
      return null;
    }
  }

  // Resolve application owner's plan for quota limits
  const ownerSub = db.prepare('SELECT plan FROM subscriptions WHERE user_id = ?').get(teamApp.app_owner_id);
  const ownerAcc = db.prepare('SELECT plan, role FROM accounts WHERE id = ?').get(teamApp.app_owner_id);
  const effectivePlan = (ownerAcc?.role === 'admin') ? 'pro' : (ownerSub?.plan || ownerAcc?.plan || 'developer');

  return {
    ...teamApp,
    id: teamApp.id,
    accessRole: role,
    isAdmin: isTeamAdmin,
    permissions: perms,
    effectivePlan,
    ownerId: teamApp.app_owner_id,
    isTeamAccess: true
  };
}

export function checkUserLimit(req, res, next) {
  const user = req.user;
  const isSuperAdmin = user.role === 'admin';
  const appId = req.params.appId || req.body.appId;

  const appAccess = verifyAppAccess(appId, user.id, 'manage_users', isSuperAdmin);
  if (!appAccess) {
    return res.status(403).json({ success: false, message: 'Application not found or unauthorized.' });
  }

  const effectivePlan = isSuperAdmin ? 'pro' : appAccess.effectivePlan;
  const userCount = db.prepare('SELECT COUNT(*) as count FROM application_users WHERE app_id = ?').get(appAccess.id)?.count || 0;

  let maxAllowed = 10;
  if (isSuperAdmin) {
    maxAllowed = 9999999;
  } else if (effectivePlan === 'pro') {
    maxAllowed = 100000;
  } else if (effectivePlan === 'developer') {
    maxAllowed = 10000;
  } else {
    maxAllowed = 10;
  }

  if (userCount >= maxAllowed) {
    return res.status(403).json({
      success: false,
      code: 'USER_LIMIT_REACHED',
      message: `Maximum user limit (${maxAllowed.toLocaleString()} users) reached on this application for the ${effectivePlan.toUpperCase()} plan.`
    });
  }
  req.appAccess = appAccess;
  next();
}

// List of routine / noisy non-security events that bloat the database
const IGNORED_NOISY_EVENTS = new Set([
  'LOGIN_SUCCESS',
  'LOGOUT',
  'LOGOUT_SESSION',
  'LOGOUT_ALL_OTHER_SESSIONS',
  'LOGOUT_ALL_SESSIONS',
  'REMOTE_SESSION_KILLED'
]);

export function recordAuditLog(userId, appId, eventType, description, ip = '127.0.0.1') {
  try {
    // 1. Prevent DB bloat: ignore routine non-security logs
    if (IGNORED_NOISY_EVENTS.has(eventType)) {
      return;
    }

    const id = 'log_' + uuidv4().slice(0, 12);
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, app_id, event_type, description, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, appId, eventType, description, ip, now);

    // 2. Prevent DB bloat: cap audit logs per user to maximum 500 records
    if (userId) {
      const countRow = db.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?').get(userId);
      if (countRow && countRow.count > 500) {
        db.prepare(`
          DELETE FROM audit_logs WHERE id IN (
            SELECT id FROM audit_logs WHERE user_id = ? ORDER BY created_at ASC LIMIT ?
          )
        `).run(userId, countRow.count - 450);
      }
    }
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}

export async function triggerWebhook(appId, eventType, title, description, fields = []) {
  try {
    const webhooks = db.prepare('SELECT * FROM webhooks WHERE app_id = ? AND is_active = 1').all(appId);
    if (!webhooks || webhooks.length === 0) return;

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
    const customUsername = app?.custom_webhook_username || null;
    const customAvatar = app?.custom_webhook_avatar || null;
    const customColorHex = app?.custom_webhook_color || null;

    let embedColor = eventType.includes('locked') || eventType.includes('banned') ? 0xef4444 : 0xa855f7;
    if (customColorHex) {
      const parsed = parseInt(customColorHex.replace('#', ''), 16);
      if (!isNaN(parsed)) embedColor = parsed;
    }

    const normEvent = (eventType || '').toLowerCase().trim();

    for (const hook of webhooks) {
      const eventsList = (hook.events || '').split(',').map(e => e.trim().toLowerCase());

      // Strict role check: only dispatch if event is in the hook's selected roles list
      // "jeta dibe only shetai jabe"
      const matches = eventsList.includes(normEvent) ||
                      eventsList.includes('*') ||
                      (normEvent === 'new_user' && eventsList.includes('register')) ||
                      (normEvent === 'register' && eventsList.includes('new_user'));

      if (!matches) {
        continue;
      }

      const isTelegram = hook.platform === 'telegram' || (hook.url && hook.url.includes('api.telegram.org'));

      if (isTelegram) {
        const token = hook.telegram_token || (hook.url.match(/bot([^/]+)/) ? hook.url.match(/bot([^/]+)/)[1] : '');
        let chatId = hook.telegram_chat_id;
        if (!chatId && hook.url.includes('chat_id=')) {
          try {
            chatId = new URL(hook.url).searchParams.get('chat_id');
          } catch (e) {}
        }

        if (token && chatId) {
          let tgText = `<b>${customUsername || (app ? app.app_name : 'Habit Auth')}</b>\n\n` +
                       `[Event] <b>${title}</b>\n\n`;

          if (description) {
            const cleanDesc = description
              .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
              .replace(/\*(.*?)\*/g, '<i>$1</i>')
              .replace(/`(.*?)`/g, '<code>$1</code>');
            tgText += `${cleanDesc}\n\n`;
          }

          if (fields && fields.length > 0) {
            for (const f of fields) {
              tgText += `* <b>${f.name}:</b> <code>${f.value}</code>\n`;
            }
            tgText += '\n';
          }

          tgText += `<i>${new Date().toLocaleTimeString()} • Habit Auth</i>`;

          try {
            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: tgText,
                parse_mode: 'HTML'
              })
            });

            const now = Math.floor(Date.now() / 1000);
            db.prepare(`
              INSERT INTO webhook_deliveries (id, webhook_id, event, payload, status_code, response, delivered_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run('del_' + uuidv4().slice(0, 10), hook.id, eventType, JSON.stringify({ text: tgText }), res.status, res.statusText, now);
          } catch (postErr) {
            console.error('Telegram webhook dispatch error:', postErr.message);
          }
        }
      } else {
        // Discord Webhook
        const payload = {
          username: customUsername || undefined,
          avatar_url: customAvatar || undefined,
          embeds: [{
            title: customUsername ? `${customUsername} - ${title}` : `Habit Auth - ${title}`,
            description,
            color: embedColor,
            fields: fields.map(f => ({ name: f.name, value: String(f.value), inline: true })),
            footer: { text: customUsername ? `${customUsername} Security Broker` : 'Habit Auth Event Broker • v1.0.0' },
            timestamp: new Date().toISOString()
          }]
        };

        try {
          const res = await fetch(hook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          const now = Math.floor(Date.now() / 1000);
          db.prepare(`
            INSERT INTO webhook_deliveries (id, webhook_id, event, payload, status_code, response, delivered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run('del_' + uuidv4().slice(0, 10), hook.id, eventType, JSON.stringify(payload), res.status, res.statusText, now);
        } catch (postErr) {
          console.error('Discord webhook dispatch error:', postErr.message);
        }
      }
    }
  } catch (err) {
    console.error('triggerWebhook error:', err);
  }
}

// Backward compatibility alias
export const triggerDiscordWebhook = triggerWebhook;

// Centralized In-App Notification Dispatcher
export function sendInAppNotification(userId, title, message, type = 'info', linkUrl = null, imageUrl = null) {
  try {
    if (!userId || !title || !message) return null;
    const now = Math.floor(Date.now() / 1000);
    const notifId = 'notif_' + uuidv4().slice(0, 12);
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link_url, image_url, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(notifId, userId, title, message, type, linkUrl || null, imageUrl || null, now);
    return notifId;
  } catch (err) {
    console.error('sendInAppNotification error:', err.message);
    return null;
  }
}
