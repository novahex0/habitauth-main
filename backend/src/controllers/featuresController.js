import db from '../config/db.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { recordAuditLog, triggerDiscordWebhook } from '../middleware/helpers.js';

// ── 1. WEBHOOKS ─────────────────────────────────────────────
export function getWebhooks(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;

  const webhooks = db.prepare('SELECT * FROM webhooks WHERE app_id = ? AND user_id = ?').all(appId, userId);
  res.json({ success: true, webhooks });
}

export function createWebhook(req, res) {
  const { appId } = req.params;
  const { 
    name, 
    url = '', 
    events = 'login,register,user_banned', 
    platform = 'discord',
    telegram_token = '',
    telegram_chat_id = '' 
  } = req.body;
  const userId = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Webhook Name is required.' });
  }

  let finalUrl = (url || '').trim();
  let finalToken = (telegram_token || '').trim();
  let finalChatId = (telegram_chat_id || '').trim();

  if (platform === 'telegram') {
    // If user entered a full Telegram url e.g. https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>
    if (finalUrl && finalUrl.includes('api.telegram.org/bot')) {
      const match = finalUrl.match(/bot([^/]+)/);
      if (match && !finalToken) finalToken = match[1];
      try {
        const urlObj = new URL(finalUrl);
        const chatIdParam = urlObj.searchParams.get('chat_id');
        if (chatIdParam && !finalChatId) finalChatId = chatIdParam;
      } catch (e) {}
    }

    if (!finalToken || !finalChatId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telegram Bot Token and Chat ID are required for Telegram integration.' 
      });
    }

    if (!finalUrl) {
      finalUrl = `https://api.telegram.org/bot${finalToken}/sendMessage?chat_id=${finalChatId}`;
    }
  } else {
    // Discord validation
    if (!finalUrl) {
      return res.status(400).json({ success: false, message: 'Discord Webhook URL is required.' });
    }
  }

  const id = 'wh_' + uuidv4().slice(0, 10);
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO webhooks (id, app_id, user_id, name, url, events, platform, telegram_chat_id, telegram_token, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, appId, userId, name.trim(), finalUrl, events, platform, finalChatId, finalToken, now);

  recordAuditLog(userId, appId, 'WEBHOOK_CREATED', `${platform === 'telegram' ? 'Telegram' : 'Discord'} webhook '${name.trim()}' created with roles [${events}]`, req.ip);
  res.status(201).json({ success: true, message: `${platform === 'telegram' ? 'Telegram' : 'Discord'} webhook configured successfully!` });
}

export async function testWebhook(req, res) {
  const { webhookId } = req.params;
  const userId = req.user.id;
  // SECURITY: verify webhook belongs to requesting user
  const hook = db.prepare('SELECT * FROM webhooks WHERE id = ? AND user_id = ?').get(webhookId, userId);
  if (!hook) return res.status(404).json({ success: false, message: 'Webhook not found.' });

  try {
    const isTelegram = hook.platform === 'telegram' || hook.url.includes('api.telegram.org');

    if (isTelegram) {
      const token = hook.telegram_token || (hook.url.match(/bot([^/]+)/) ? hook.url.match(/bot([^/]+)/)[1] : '');
      let chatId = hook.telegram_chat_id;
      if (!chatId && hook.url.includes('chat_id=')) {
        try {
          chatId = new URL(hook.url).searchParams.get('chat_id');
        } catch (e) {}
      }

      if (!token || !chatId) {
        return res.status(400).json({ success: false, message: 'Invalid Telegram configuration: Bot Token or Chat ID missing.' });
      }

      const tgMessage = `🔔 <b>Habit Auth — Telegram Webhook Test</b>\n\n` +
        `✅ Your Telegram webhook integration is functioning properly!\n` +
        `Real-time notifications for your selected roles will arrive here immediately.\n\n` +
        `📌 <b>Webhook Name:</b> <code>${hook.name}</code>\n` +
        `🎯 <b>Active Roles:</b> <code>${hook.events}</code>\n` +
        `🕒 <b>Timestamp:</b> <i>${new Date().toLocaleString()}</i>`;

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: tgMessage,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        return res.json({ success: true, message: 'Test message delivered to Telegram successfully!' });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: `Telegram rejected message (${data.error_code || response.status}): ${data.description || response.statusText}` 
        });
      }
    } else {
      // Discord
      const payload = {
        embeds: [{
          title: '🔔 Habit Auth — Webhook Test Dispatch',
          description: 'Your Discord webhook integration is functioning properly! Real-time notifications for selected roles will be posted here.',
          color: 0x10b981,
          fields: [
            { name: 'Webhook Name', value: hook.name, inline: true },
            { name: 'Active Roles', value: hook.events, inline: true },
            { name: 'Timestamp', value: new Date().toLocaleTimeString(), inline: true }
          ],
          footer: { text: 'Habit Auth Webhook Broker' },
          timestamp: new Date().toISOString()
        }]
      };

      const response = await fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        res.json({ success: true, message: 'Test message delivered to Discord successfully!' });
      } else {
        res.status(400).json({ success: false, message: `Discord rejected webhook: HTTP ${response.status} ${response.statusText}` });
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to dispatch webhook: ' + err.message });
  }
}

export function deleteWebhook(req, res) {
  const { webhookId } = req.params;
  const userId = req.user.id;
  // SECURITY: only delete webhook owned by current user
  const hook = db.prepare('SELECT id FROM webhooks WHERE id = ? AND user_id = ?').get(webhookId, userId);
  if (!hook) return res.status(404).json({ success: false, message: 'Webhook not found.' });
  db.prepare('DELETE FROM webhooks WHERE id = ?').run(webhookId);
  res.json({ success: true, message: 'Webhook deleted.' });
}

// ── 2. TEAMS ────────────────────────────────────────────────
export function getTeams(req, res) {
  const userId = req.user.id;
  const teams = db.prepare(`
    SELECT t.id, t.name, t.created_at,
      (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
    FROM teams t WHERE t.owner_id = ?
  `).all(userId);

  res.json({ success: true, teams });
}

export function createTeam(req, res) {
  const userId = req.user.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Team name is required.' });

  const teamId = 'team_' + uuidv4().slice(0, 10);
  const now = Math.floor(Date.now() / 1000);

  db.prepare('INSERT INTO teams (id, owner_id, name, created_at) VALUES (?, ?, ?, ?)').run(teamId, userId, name.trim(), now);
  // Add owner
  db.prepare('INSERT INTO team_members (id, team_id, user_id, email, role, joined_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run('tm_' + uuidv4().slice(0, 10), teamId, userId, req.user.email || 'owner@habitauth.dev', 'owner', now);

  res.status(201).json({ success: true, message: 'Team created successfully!' });
}

// ── 3. API KEYS & PLAYGROUND ─────────────────────────────────
export function getApiKeys(req, res) {
  const userId = req.user.id;
  const keys = db.prepare('SELECT id, name, key_prefix, scopes, last_used_at, created_at FROM api_keys WHERE user_id = ?').all(userId);
  res.json({ success: true, keys });
}

export function createApiKey(req, res) {
  const userId = req.user.id;
  const { name, scopes = 'read,write' } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'API Key name is required.' });

  const rawKey = 'hb_' + crypto.randomBytes(24).toString('hex');
  const keyPrefix = rawKey.slice(0, 8) + '...';
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, scopes, last_used_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run('ak_' + uuidv4().slice(0, 10), userId, name.trim(), keyHash, keyPrefix, scopes, now);

  recordAuditLog(userId, null, 'API_KEY_CREATED', `Generated API Key '${name}'`, req.ip);

  // Expose full raw key only ONCE upon creation!
  res.status(201).json({
    success: true,
    message: 'API Key generated successfully! Save your key safely; it will not be displayed again.',
    apiKey: rawKey
  });
}

export function deleteApiKey(req, res) {
  const { keyId } = req.params;
  const userId = req.user.id;
  // SECURITY: only delete API keys owned by current user
  const key = db.prepare('SELECT id FROM api_keys WHERE id = ? AND user_id = ?').get(keyId, userId);
  if (!key) return res.status(404).json({ success: false, message: 'API Key not found.' });
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(keyId);
  res.json({ success: true, message: 'API Key revoked.' });
}

// ── 4. NOTIFICATIONS ─────────────────────────────────────────
export function getNotifications(req, res) {
  const userId = req.user.id;
  const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId);
  const unreadCount = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(userId).c;
  res.json({ success: true, notifications: notifs, unreadCount });
}

export function markNotificationRead(req, res) {
  const { notifId } = req.params;
  const userId = req.user.id;
  // SECURITY: scope mark-read to current user only
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notifId, userId);
  res.json({ success: true });
}

export function markAllNotificationsRead(req, res) {
  const userId = req.user.id;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  res.json({ success: true });
}

export function deleteNotification(req, res) {
  const { notifId } = req.params;
  const userId = req.user.id;
  if (notifId === 'all') {
    return clearAllNotifications(req, res);
  }
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(notifId, userId);
  res.json({ success: true, message: 'Notification removed.' });
}

export function clearAllNotifications(req, res) {
  const userId = req.user.id;
  db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
  res.json({ success: true, message: 'All notifications cleared.' });
}
