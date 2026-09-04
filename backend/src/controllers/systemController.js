import db from '../config/db.js';
import { recordAuditLog } from '../middleware/helpers.js';

// 1. Get Public System Config (Notice Banner & Maintenance Check)
export function getSystemConfig(req, res) {
  const settings = db.prepare('SELECT key, value, updated_at FROM system_settings').all();
  const configMap = {};
  const timeMap = {};
  settings.forEach(s => {
    configMap[s.key] = s.value;
    timeMap[s.key] = s.updated_at;
  });

  const noticeUpdatedAt = timeMap['announcement_notice'] || timeMap['announcement_active'] || 0;

  res.json({
    success: true,
    maintenance_mode: configMap['maintenance_mode'] === 'true',
    maintenance_message: configMap['maintenance_message'] || 'System under maintenance.',
    announcement_notice: configMap['announcement_notice'] || '',
    announcement_active: configMap['announcement_active'] === 'true',
    notice_updated_at: noticeUpdatedAt,
    example_app_github_url: configMap['example_app_github_url'] || 'https://github.com/HabitAuth/HabitAuth-Example',
    landing_hero_image: configMap['landing_hero_image'] || '',
    landing_hero_image_active: configMap['landing_hero_image_active'] !== 'false',
    discord_invite_url: configMap['discord_invite_url'] || 'https://discord.gg/7JX63q4Aa',
    github_url: configMap['github_url'] || 'https://github.com/HabitAuth/HabitAuth'
  });
}

// 1b. Super Admin: Update Social & Community Links
export function updateSocialLinks(req, res) {
  const { discord_invite_url, github_url } = req.body;
  const now = Math.floor(Date.now() / 1000);

  if (discord_invite_url !== undefined) {
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run('discord_invite_url', discord_invite_url.trim(), now);
  }
  if (github_url !== undefined) {
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run('github_url', github_url.trim(), now);
  }

  recordAuditLog(req.user.id, null, 'SOCIAL_LINKS_UPDATED', `Updated Discord & GitHub community links`, req.ip);

  res.json({
    success: true,
    message: 'Social & Community Links updated successfully.',
    discord_invite_url: discord_invite_url ? discord_invite_url.trim() : undefined,
    github_url: github_url ? github_url.trim() : undefined
  });
}

// 2. Super Admin: Update Server Maintenance Mode
export function updateMaintenance(req, res) {
  const { enabled, message } = req.body;
  const now = Math.floor(Date.now() / 1000);

  const isEnabled = enabled ? 'true' : 'false';
  db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run('maintenance_mode', isEnabled, now);

  if (message) {
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run('maintenance_message', message.trim(), now);
  }

  recordAuditLog(req.user.id, null, 'MAINTENANCE_TOGGLED', `Maintenance mode set to ${isEnabled}`, req.ip);

  res.json({
    success: true,
    message: `Server Maintenance Mode ${enabled ? 'ACTIVATED' : 'DEACTIVATED'}.`,
    maintenance_mode: enabled
  });
}

// 3. Super Admin: Update Global Announcement Notice
export function updateNotice(req, res) {
  const { notice, active } = req.body;
  const now = Math.floor(Date.now() / 1000);

  if (notice !== undefined) {
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run('announcement_notice', notice.trim(), now);
  }

  if (active !== undefined) {
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run('announcement_active', active ? 'true' : 'false', now);
  }

  recordAuditLog(req.user.id, null, 'NOTICE_UPDATED', `Updated announcement notice banner`, req.ip);

  res.json({
    success: true,
    message: 'Global announcement notice banner updated successfully.'
  });
}

// 3b. Super Admin: Update SDK Configuration (Example App GitHub URL)
export function updateSdkConfig(req, res) {
  const { example_app_github_url } = req.body;
  const now = Math.floor(Date.now() / 1000);

  if (example_app_github_url !== undefined) {
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run('example_app_github_url', example_app_github_url.trim(), now);
  }

  recordAuditLog(req.user.id, null, 'SDK_CONFIG_UPDATED', `Updated SDK Example App GitHub URL to ${example_app_github_url}`, req.ip);

  res.json({
    success: true,
    message: 'SDK Configuration saved successfully.',
    example_app_github_url: example_app_github_url ? example_app_github_url.trim() : ''
  });
}

// 3c. Super Admin: Update Landing Page Hero Mockup Image
export function updateHeroImage(req, res) {
  const { image_url, active } = req.body;
  const now = Math.floor(Date.now() / 1000);

  if (image_url !== undefined) {
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run('landing_hero_image', image_url.trim(), now);
  }

  if (active !== undefined) {
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run('landing_hero_image_active', active ? 'true' : 'false', now);
  }

  recordAuditLog(req.user.id, null, 'HERO_IMAGE_UPDATED', `Landing hero mockup image updated to ${image_url}`, req.ip);

  res.json({
    success: true,
    message: 'Landing page hero image updated successfully.',
    landing_hero_image: image_url !== undefined ? image_url.trim() : undefined,
    landing_hero_image_active: active !== undefined ? !!active : true
  });
}

// 4. Client / SDK: Check Auto-Update for Application
export function checkAppUpdate(req, res) {
  const { appId } = req.params;
  const clientVersion = req.query.current_version || req.query.version || '1.0.0';

  const app = db.prepare('SELECT id, app_name, version, latest_version, download_url, changelog, status FROM applications WHERE id = ?').get(appId);
  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found.' });
  }

  const latest = app.latest_version || app.version || '1.0.0';
  const updateAvailable = clientVersion.trim() !== latest.trim();

  res.json({
    success: true,
    app_name: app.app_name,
    client_version: clientVersion.trim(),
    latest_version: latest.trim(),
    update_available: updateAvailable,
    mandatory_update: updateAvailable,
    download_url: app.download_url || `${process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`}/downloads/${app.id}/latest`,
    changelog: app.changelog || 'Latest performance enhancements, bug fixes, and security patches.'
  });
}
