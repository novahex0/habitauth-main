import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance and durability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    -- 1. Accounts / Dashboard Users
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      discord_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      email TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'user', -- 'user' | 'admin'
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 2. Subscriptions (Strictly FREE & DEVELOPER)
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan TEXT DEFAULT 'free', -- 'free' | 'developer'
      status TEXT DEFAULT 'active', -- 'active' | 'canceled' | 'expired'
      started_at INTEGER NOT NULL,
      expires_at INTEGER DEFAULT 0, -- 0 = lifetime / active
      provider TEXT DEFAULT 'discord',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- 3. Sessions (Active sessions tracking & revocation)
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      device TEXT,
      browser TEXT,
      os TEXT,
      ip_address TEXT,
      created_at INTEGER NOT NULL,
      last_active INTEGER NOT NULL,
      is_revoked INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- 4. Applications (App Name ONLY during creation, App ID & Secret generated)
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY, -- e.g. app_xxxxxxxxxxxx
      user_id TEXT NOT NULL,
      app_name TEXT NOT NULL,
      app_secret TEXT NOT NULL,
      version TEXT DEFAULT '1.0.0',
      status TEXT DEFAULT 'active', -- 'active' | 'paused'
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- 5. Application Users (End-client users belonging to an app, failed login lockout)
    CREATE TABLE IF NOT EXISTS application_users (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      license_key TEXT,
      hwid TEXT,
      sid TEXT,
      status TEXT DEFAULT 'active', -- 'active' | 'banned' | 'locked'
      failed_attempts INTEGER DEFAULT 0,
      locked_until INTEGER DEFAULT 0, -- Timestamp. If > now, account is locked for 24h
      expires_at INTEGER DEFAULT 0, -- 0 = lifetime
      last_ip TEXT,
      last_login INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
      UNIQUE(app_id, username)
    );

    -- 6. Licenses (Keys for applications)
    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      license_key TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'unused', -- 'unused' | 'active' | 'expired' | 'revoked' | 'suspended'
      duration_days INTEGER DEFAULT 0, -- 0 = lifetime
      bound_user_id TEXT,
      bound_username TEXT,
      bound_hwid TEXT,
      activations_count INTEGER DEFAULT 0,
      note TEXT,
      expires_at INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 7. Devices (HWID binding & management)
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      user_id TEXT,
      hwid TEXT NOT NULL,
      device_name TEXT,
      os TEXT,
      status TEXT DEFAULT 'bound', -- 'bound' | 'revoked'
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 8. Teams (Developer Plan feature)
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE,
      max_members INTEGER DEFAULT 5,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- 9. Team Members (Join Requests, Permissions, Roles)
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'developer', -- 'owner' | 'admin' | 'developer' | 'support' | 'viewer'
      status TEXT DEFAULT 'pending', -- 'pending' | 'active' | 'rejected'
      permissions TEXT, -- JSON string e.g. {"manage_users":true,"manage_licenses":true,"view_analytics":true,"manage_webhooks":false}
      joined_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
      UNIQUE(team_id, user_id)
    );

    -- 9b. Team Blacklists
    CREATE TABLE IF NOT EXISTS team_blacklists (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
      UNIQUE(team_id, user_id)
    );

    -- 10. API Keys (Developer Plan feature)
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      app_id TEXT,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      scopes TEXT DEFAULT 'read,write',
      last_used_at INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- 11. Webhooks (Discord integration)
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT NOT NULL, -- comma separated e.g. 'new_user,login,license_activated'
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 12. Webhook Deliveries
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      webhook_id TEXT NOT NULL,
      event TEXT NOT NULL,
      payload TEXT NOT NULL,
      status_code INTEGER,
      response TEXT,
      delivered_at INTEGER NOT NULL,
      FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
    );

    -- 13. Audit Logs (Immutable security ledger)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      app_id TEXT,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      ip_address TEXT,
      created_at INTEGER NOT NULL
    );

    -- 14. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info', -- 'info' | 'warning' | 'security'
      is_read INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- 15. System Settings (Maintenance Mode & Announcement Notice)
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER NOT NULL
    );

    -- 16. Support Tickets (In-Dashboard Customer Support)
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      app_id TEXT,
      user_id TEXT,
      client_username TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'open', -- 'open' | 'in-progress' | 'resolved' | 'closed'
      priority TEXT DEFAULT 'normal', -- 'low' | 'normal' | 'high' | 'critical'
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- 17. Ticket Messages (Threaded Support Conversations)
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT DEFAULT 'user', -- 'developer' | 'admin' | 'user'
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    -- 18. Blacklists (IP & HWID Global or Per-App Blocks)
    CREATE TABLE IF NOT EXISTS blacklists (
      id TEXT PRIMARY KEY,
      app_id TEXT, -- NULL / 'global' for global blacklist, or specific app_id
      user_id TEXT,
      type TEXT NOT NULL, -- 'hwid' | 'ip'
      value TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_accounts_discord ON accounts(discord_id);
    CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_app_users_app ON application_users(app_id);
    CREATE INDEX IF NOT EXISTS idx_licenses_app ON licenses(app_id);
    CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_app ON tickets(app_id);
    CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_blacklists_lookup ON blacklists(type, value);
  `);

  // Auto-migrate new columns if existing SQLite DB was already created
  try { db.exec('ALTER TABLE teams ADD COLUMN invite_code TEXT;'); } catch (e) {}
  try { db.exec('ALTER TABLE teams ADD COLUMN max_members INTEGER DEFAULT 5;'); } catch (e) {}
  try { db.exec("ALTER TABLE team_members ADD COLUMN status TEXT DEFAULT 'active';"); } catch (e) {}
  try { db.exec('ALTER TABLE team_members ADD COLUMN permissions TEXT;'); } catch (e) {}
  try { db.exec("ALTER TABLE accounts ADD COLUMN status TEXT DEFAULT 'active';"); } catch (e) {}
  try { db.exec("ALTER TABLE accounts ADD COLUMN ban_reason TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE application_users ADD COLUMN ban_reason TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN latest_version TEXT DEFAULT '1.0.0';"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN download_url TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN changelog TEXT;"); } catch (e) {}

  // Top-Tier Premium & Security Auto-Migrations
  try { db.exec("ALTER TABLE notifications ADD COLUMN link_url TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE notifications ADD COLUMN image_url TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN force_update_enabled INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN update_download_url TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN enforce_hash_check INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN expected_hash TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN auto_ban_on_hash_mismatch INTEGER DEFAULT 1;"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN custom_key_mask TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN hwid_cooldown_days INTEGER DEFAULT 7;"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN hwid_self_reset_enabled INTEGER DEFAULT 1;"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN custom_webhook_username TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN custom_webhook_avatar TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN custom_webhook_color TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN subscriptions_frozen INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN frozen_at INTEGER DEFAULT 0;"); } catch (e) {}

  try { db.exec("ALTER TABLE application_users ADD COLUMN is_online INTEGER DEFAULT 0;"); } catch (e) {}

  // Auto-sync team capacity to 500 for Pro and Admin accounts
  try {
    db.exec(`
      UPDATE teams 
      SET max_members = 500 
      WHERE owner_id IN (
        SELECT a.id FROM accounts a 
        LEFT JOIN subscriptions s ON a.id = s.user_id 
        WHERE a.role = 'admin' OR s.plan = 'pro'
      ) AND (max_members IS NULL OR max_members < 500);
    `);
  } catch (e) {}
  try { db.exec("ALTER TABLE application_users ADD COLUMN last_heartbeat INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE application_users ADD COLUMN session_killed INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE application_users ADD COLUMN last_hwid_reset INTEGER DEFAULT 0;"); } catch (e) {}

  try { db.exec("ALTER TABLE licenses ADD COLUMN is_frozen INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE licenses ADD COLUMN frozen_at INTEGER DEFAULT 0;"); } catch (e) {}

  // Token Validation Migrations (Secondary Startup Verification)
  try { db.exec("ALTER TABLE applications ADD COLUMN token_validation_enabled INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE application_users ADD COLUMN token TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE licenses ADD COLUMN token TEXT;"); } catch (e) {}
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_app_users_token ON application_users(token);"); } catch (e) {}
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_licenses_token ON licenses(token);"); } catch (e) {}

  // 30-Day Per-User Log Retention Cycle Migrations
  try { db.exec("ALTER TABLE accounts ADD COLUMN log_cycle_start INTEGER;"); } catch (e) {}
  try {
    const existingAccounts = db.prepare("SELECT id FROM accounts WHERE log_cycle_start IS NULL OR log_cycle_start = 0").all();
    const nowEpoch = Math.floor(Date.now() / 1000);
    // Existing accounts initialized to Day 29 (1 day remaining) per user specification:
    // "ar already jader account ache tader already 29 day maybe hoye jabe logs clean hobar jonno"
    const day29CycleStart = nowEpoch - (28 * 86400 + 43200);
    const updateCycle = db.prepare("UPDATE accounts SET log_cycle_start = ? WHERE id = ?");
    for (const acc of existingAccounts) {
      updateCycle.run(day29CycleStart, acc.id);
    }
  } catch (e) {}


  // Backfill unique tokens for any existing users/licenses
  try {
    const usersWithoutToken = db.prepare("SELECT id FROM application_users WHERE token IS NULL OR token = ''").all();
    const updateUsrToken = db.prepare("UPDATE application_users SET token = ? WHERE id = ?");
    for (const u of usersWithoutToken) {
      updateUsrToken.run('tok_' + uuidv4().replace(/-/g, '').slice(0, 24), u.id);
    }

    const licWithoutToken = db.prepare("SELECT id FROM licenses WHERE token IS NULL OR token = ''").all();
    const updateLicToken = db.prepare("UPDATE licenses SET token = ? WHERE id = ?");
    for (const l of licWithoutToken) {
      updateLicToken.run('tok_' + uuidv4().replace(/-/g, '').slice(0, 24), l.id);
    }
  } catch (e) {}

  // Webhook Platform (Discord / Telegram) & Granular Roles Migrations
  try { db.exec("ALTER TABLE webhooks ADD COLUMN platform TEXT DEFAULT 'discord';"); } catch (e) {}
  try { db.exec("ALTER TABLE webhooks ADD COLUMN telegram_chat_id TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE webhooks ADD COLUMN telegram_token TEXT DEFAULT '';"); } catch (e) {}

  // Ed25519 Asymmetric Digital Signature Migrations
  try { db.exec("ALTER TABLE applications ADD COLUMN public_key TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE applications ADD COLUMN private_key TEXT DEFAULT '';"); } catch (e) {}
  try {
    const appsWithoutKeys = db.prepare("SELECT id FROM applications WHERE public_key IS NULL OR public_key = ''").all();
    const updateAppKeys = db.prepare("UPDATE applications SET public_key = ?, private_key = ? WHERE id = ?");
    for (const app of appsWithoutKeys) {
      const keys = generateEd25519Keypair();
      updateAppKeys.run(keys.publicKeyHex, keys.privateKeyPem, app.id);
    }
  } catch (e) {
    console.error('Ed25519 migration error:', e);
  }

  // Developer Account Direct Credentials & Password Reset
  try { db.exec("ALTER TABLE accounts ADD COLUMN password_hash TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE accounts ADD COLUMN reset_token TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE accounts ADD COLUMN reset_token_expires INTEGER DEFAULT 0;"); } catch (e) {}

  // Seed default system settings
  const now = Math.floor(Date.now() / 1000);
  const insertSetting = db.prepare('INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)');
  insertSetting.run('maintenance_mode', 'false', now);
  insertSetting.run('maintenance_message', 'Habit Auth systems are undergoing routine maintenance. Normal operations will resume shortly.', now);
  insertSetting.run('announcement_notice', '🔥 Welcome to Habit Auth — High Performance Authentication & Hardware-Locked Licensing for Developers.', now);
  insertSetting.run('announcement_active', 'true', now);
  insertSetting.run('discord_invite_url', 'https://discord.gg/7JX63q4Aa', now);
  insertSetting.run('github_url', 'https://github.com/YourOrganization/HabitAuth', now);

  // Always ensure Master Owner Account exists in the database on any instance boot
  try {
    const owner = db.prepare("SELECT id FROM accounts WHERE discord_id = '1281266486601715834' OR username = 'meherab009'").get();
    if (!owner) {
      db.prepare(`
        INSERT INTO accounts (id, discord_id, username, email, avatar, role, created_at, updated_at, status)
        VALUES ('usr_c0049143710d4e5c', '1281266486601715834', 'meherab009', 'bappyxcheat@gmail.com', 'https://cdn.discordapp.com/avatars/1281266486601715834/d71403e45350fb26a3270b20df95e8df.png', 'admin', 1788558076, 1788558076, 'active')
      `).run();

      db.prepare(`
        INSERT OR REPLACE INTO subscriptions (id, user_id, plan, status, started_at, expires_at, provider, created_at)
        VALUES ('sub_b9bf6ca6-79d', 'usr_c0049143710d4e5c', 'developer', 'active', 1788558076, 0, 'discord', 1788558076)
      `).run();
      console.log('👑 Master Owner account (meherab009) initialized successfully.');
    }
  } catch (e) {
    console.error('Owner seed error:', e);
  }

  console.log('📦 Habit Auth Relational Database Initialized Successfully (node:sqlite native).');
}

/**
 * Generates an Ed25519 keypair for cryptographic asymmetric response signing.
 * Returns raw 32-byte hex public key and PKCS8 PEM private key.
 */
export function generateEd25519Keypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pubDer = publicKey.export({ type: 'spki', format: 'der' });
  const rawPublicKeyHex = pubDer.subarray(pubDer.length - 32).toString('hex');
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  return {
    publicKeyHex: rawPublicKeyHex,
    privateKeyPem: privateKeyPem
  };
}

export default db;
