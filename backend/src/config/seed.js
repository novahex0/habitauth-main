import db from './db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  const existingAccounts = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
  if (existingAccounts.count > 0) {
    return; // Already seeded
  }

  console.log('🌱 Seeding initial Habit Auth development data...');
  const now = Math.floor(Date.now() / 1000);

  // 1. Admin / Developer Account
  const adminId = 'usr_' + uuidv4().replace(/-/g, '').slice(0, 16);
  db.prepare(`
    INSERT INTO accounts (id, discord_id, username, email, avatar, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    '100000000000000001',
    'AdminOwner',
    'admin@habitauth.dev',
    'https://cdn.discordapp.com/embed/avatars/0.png',
    'admin',
    now,
    now
  );

  // Subscription: Developer Plan ($1/mo tier)
  db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan, status, started_at, expires_at, provider, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('sub_' + uuidv4().slice(0, 12), adminId, 'developer', 'active', now, 0, 'discord', now);

  // 2. Demo Application
  const appId = 'app_nexus_auth_demo';
  const appSecret = 'sec_' + uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').slice(0, 16);
  db.prepare(`
    INSERT INTO applications (id, user_id, app_name, app_secret, version, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(appId, adminId, 'Nexus Suite Pro', appSecret, '1.0.0', 'active', now, now);

  // 3. Application Users (Active, Banned, and 24-hr Locked to demonstrate brute-force lockout)
  const defaultPassHash = await bcrypt.hash('clientPass123!', 10);

  // User 1: Active user with HWID
  db.prepare(`
    INSERT INTO application_users (id, app_id, username, password_hash, license_key, hwid, sid, status, failed_attempts, locked_until, expires_at, last_ip, last_login, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'u_' + uuidv4().slice(0, 10),
    appId,
    'john_developer',
    defaultPassHash,
    'HABIT-NEXUS-2026-ACTIVE',
    '40d8688ebdb6b9f7a1c8901234567890',
    'S-1-5-21-3623811015-3361044348-30300820-1013',
    'active',
    0,
    0,
    now + (86400 * 365), // 1 year
    '192.168.1.101',
    now - 120, // 2 mins ago
    now - 86400 * 10
  );

  // User 2: Locked User (Failed 5 attempts -> 24 hour lockout)
  db.prepare(`
    INSERT INTO application_users (id, app_id, username, password_hash, license_key, hwid, sid, status, failed_attempts, locked_until, expires_at, last_ip, last_login, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'u_' + uuidv4().slice(0, 10),
    appId,
    'locked_target_user',
    defaultPassHash,
    'HABIT-NEXUS-LOCKED-01',
    '99a1288efdb6b9f7a1c8901234567899',
    'S-1-5-21-3623811015-3361044348-30300820-1014',
    'locked',
    5,
    now + (86400 * 1), // 24 hours from now
    now + (86400 * 30),
    '203.0.113.45',
    0,
    now - 3600
  );

  // User 3: Banned user
  db.prepare(`
    INSERT INTO application_users (id, app_id, username, password_hash, license_key, hwid, sid, status, failed_attempts, locked_until, expires_at, last_ip, last_login, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'u_' + uuidv4().slice(0, 10),
    appId,
    'malicious_actor',
    defaultPassHash,
    'HABIT-REVOKED-KEY-99',
    '77c8688ebdb6b9f7a1c8901234567877',
    'S-1-5-21-3623811015-3361044348-30300820-1015',
    'banned',
    0,
    0,
    0,
    '198.51.100.12',
    0,
    now - 86400 * 5
  );

  // 4. Seed Licenses
  db.prepare(`
    INSERT INTO licenses (id, app_id, license_key, status, duration_days, bound_user_id, bound_username, bound_hwid, activations_count, note, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'lic_' + uuidv4().slice(0, 10),
    appId,
    'HABIT-NEXUS-2026-ACTIVE',
    'active',
    365,
    'u_1',
    'john_developer',
    '40d8688ebdb6b9f7a1c8901234567890',
    1,
    'Annual Pro Subscription',
    now + (86400 * 365),
    now - 86400 * 10
  );

  db.prepare(`
    INSERT INTO licenses (id, app_id, license_key, status, duration_days, bound_user_id, bound_username, bound_hwid, activations_count, note, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'lic_' + uuidv4().slice(0, 10),
    appId,
    'HABIT-NEXUS-UNUSED-KEY1',
    'unused',
    0, // lifetime
    null,
    null,
    null,
    0,
    'VIP Lifetime License',
    0,
    now
  );

  db.prepare(`
    INSERT INTO licenses (id, app_id, license_key, status, duration_days, bound_user_id, bound_username, bound_hwid, activations_count, note, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'lic_' + uuidv4().slice(0, 10),
    appId,
    'HABIT-NEXUS-UNUSED-KEY2',
    'unused',
    30, // 30 days
    null,
    null,
    null,
    0,
    'Monthly Key',
    0,
    now
  );

  // 5. Seed Audit Logs
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, app_id, event_type, description, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('log_1', adminId, appId, 'APPLICATION_CREATED', "Application 'Nexus Suite Pro' initialized.", '127.0.0.1', now - 86400 * 10);

  db.prepare(`
    INSERT INTO audit_logs (id, user_id, app_id, event_type, description, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('log_2', adminId, appId, 'ACCOUNT_TEMPORARILY_LOCKED', "User 'locked_target_user' locked for 24 hours due to 5 failed login attempts.", '203.0.113.45', now - 3600);

  // 6. Seed Notifications
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('notif_1', adminId, 'Welcome to Habit Auth', 'Your developer account has been provisioned with full API access.', 'info', 0, now);

  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('notif_2', adminId, 'Security Alert: Account Locked', "User 'locked_target_user' exceeded failed attempts and was locked for 24 hours.", 'security', 0, now - 3600);

  console.log('✅ Habit Auth Demo seed completed.');
}
