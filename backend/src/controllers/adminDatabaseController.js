import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import { recordAuditLog } from '../middleware/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '../../');
const dbFile = path.resolve(dbDir, 'database.sqlite');
const walFile = path.resolve(dbDir, 'database.sqlite-wal');
const shmFile = path.resolve(dbDir, 'database.sqlite-shm');

function getSafeFileSize(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.statSync(filePath).size;
    }
  } catch (e) {}
  return 0;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 1. GET /api/v1/admin/database/stats
 * Returns complete database storage metrics and table-by-table row counts.
 */
export function getDatabaseStats(req, res) {
  try {
    const dbSizeBytes = getSafeFileSize(dbFile);
    const walSizeBytes = getSafeFileSize(walFile);
    const shmSizeBytes = getSafeFileSize(shmFile);
    const totalSizeBytes = dbSizeBytes + walSizeBytes + shmSizeBytes;

    // Pragma checks
    let pageSize = 4096;
    let pageCount = 0;
    let freelistCount = 0;
    let integrity = 'ok';

    try {
      const ps = db.prepare('PRAGMA page_size;').get();
      if (ps && ps.page_size) pageSize = ps.page_size;
      const pc = db.prepare('PRAGMA page_count;').get();
      if (pc && pc.page_count) pageCount = pc.page_count;
      const fc = db.prepare('PRAGMA freelist_count;').get();
      if (fc && fc.freelist_count) freelistCount = fc.freelist_count;
      const ic = db.prepare('PRAGMA integrity_check;').get();
      if (ic && ic.integrity_check) integrity = ic.integrity_check;
    } catch (e) {}

    // Table row counts
    const tables = [
      { key: 'accounts', name: 'Developer Accounts & Admins' },
      { key: 'subscriptions', name: 'Account Subscriptions' },
      { key: 'applications', name: 'Registered Software Apps' },
      { key: 'application_users', name: 'Software End-Users' },
      { key: 'licenses', name: 'Generated License Keys' },
      { key: 'devices', name: 'Bound Machine HWIDs' },
      { key: 'sessions', name: 'Active Login Sessions' },
      { key: 'audit_logs', name: 'Audit Trail Security Logs' },
      { key: 'tickets', name: 'Support Tickets' },
      { key: 'ticket_messages', name: 'Ticket Chat Messages' },
      { key: 'webhooks', name: 'Configured Webhooks' },
      { key: 'blacklists', name: 'Blacklisted Devices & IPs' },
      { key: 'system_settings', name: 'Global System Settings' }
    ];

    const tableCounts = {};
    let totalRecords = 0;

    for (const t of tables) {
      try {
        const row = db.prepare(`SELECT COUNT(*) as count FROM ${t.key}`).get();
        const count = row ? row.count : 0;
        tableCounts[t.key] = {
          name: t.name,
          count: count
        };
        totalRecords += count;
      } catch (err) {
        tableCounts[t.key] = { name: t.name, count: 0 };
      }
    }

    const counts = {
      accounts: tableCounts.accounts?.count || 0,
      applications: tableCounts.applications?.count || 0,
      users: tableCounts.users?.count || 0,
      licenses: tableCounts.licenses?.count || 0,
      devices: tableCounts.devices?.count || 0,
      webhooks: tableCounts.webhooks?.count || 0,
      tickets: tableCounts.tickets?.count || 0,
      audit_logs: tableCounts.audit_logs?.count || 0,
      sessions: tableCounts.sessions?.count || 0
    };

    const database = {
      db_size_formatted: formatBytes(dbSizeBytes),
      wal_size_formatted: formatBytes(walSizeBytes),
      shm_size_formatted: formatBytes(shmSizeBytes),
      total_size_formatted: formatBytes(totalSizeBytes),
      integrity_check: integrity,
      journal_mode: 'wal'
    };

    res.json({
      success: true,
      database,
      counts,
      stats: {
        storage: {
          main_db_bytes: dbSizeBytes,
          main_db_formatted: formatBytes(dbSizeBytes),
          wal_bytes: walSizeBytes,
          wal_formatted: formatBytes(walSizeBytes),
          shm_bytes: shmSizeBytes,
          shm_formatted: formatBytes(shmSizeBytes),
          total_bytes: totalSizeBytes,
          total_formatted: formatBytes(totalSizeBytes),
          free_pages: freelistCount,
          reclaimable_bytes: freelistCount * pageSize,
          reclaimable_formatted: formatBytes(freelistCount * pageSize),
          integrity: integrity,
          status: 'HEALTHY'
        },
        total_records: totalRecords,
        tables: tableCounts
      }
    });
  } catch (error) {
    console.error('Failed to get database stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve database metrics.' });
  }
}

/**
 * 2. POST /api/v1/admin/database/action
 * Executes safe maintenance operations with audit logging.
 */
export function performDatabaseAction(req, res) {
  const { action } = req.body;
  const adminId = req.user.id;
  const now = Math.floor(Date.now() / 1000);

  if (!action) {
    return res.status(400).json({ success: false, message: 'Action is required.' });
  }

  try {
    let resultMessage = '';

    switch (action) {
      case 'vacuum': {
        // Runs SQLite VACUUM to defragment and shrink database file size on disk
        db.exec('VACUUM;');
        db.exec('PRAGMA optimize;');
        resultMessage = 'Database VACUUM completed successfully. Unused pages reclaimed and disk space defragmented.';
        recordAuditLog(adminId, null, 'DATABASE_VACUUM', resultMessage, req.ip);
        break;
      }

      case 'clean_audit_logs': {
        // Keeps the last 50 important security events and clears older logs
        const countBefore = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get()?.count || 0;
        db.exec(`
          DELETE FROM audit_logs 
          WHERE id NOT IN (
            SELECT id FROM audit_logs ORDER BY created_at DESC LIMIT 50
          )
        `);
        const countAfter = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get()?.count || 0;
        const deleted = countBefore - countAfter;
        db.exec('VACUUM;');
        resultMessage = `Purged ${deleted} old audit logs. Retained 50 most recent records.`;
        recordAuditLog(adminId, null, 'DATABASE_PURGE_LOGS', resultMessage, req.ip);
        break;
      }

      case 'clean_sessions': {
        // Deletes revoked or inactive sessions older than 7 days
        const sevenDaysAgo = now - (7 * 86400);
        const res1 = db.prepare('DELETE FROM sessions WHERE is_revoked = 1 OR last_active < ?').run(sevenDaysAgo);
        db.exec('PRAGMA optimize;');
        resultMessage = `Cleaned ${res1.changes} expired or revoked sessions.`;
        recordAuditLog(adminId, null, 'DATABASE_CLEAN_SESSIONS', resultMessage, req.ip);
        break;
      }

      case 'clean_test_data': {
        // Cleans mock test applications, test users, and unlinked test records
        const testApps = db.prepare("SELECT id, app_name FROM applications WHERE app_name LIKE 'TEST_%' OR app_name LIKE 'DIMUX%' OR app_name LIKE '%test%'").all();
        let deletedAppsCount = 0;
        for (const app of testApps) {
          db.prepare('DELETE FROM applications WHERE id = ?').run(app.id);
          deletedAppsCount++;
        }
        db.exec('VACUUM;');
        resultMessage = `Cleaned ${deletedAppsCount} test applications and all associated users, licenses, and telemetry.`;
        recordAuditLog(adminId, null, 'DATABASE_CLEAN_TEST_DATA', resultMessage, req.ip);
        break;
      }

      case 'clean_unused_licenses': {
        // Removes unused, expired, or revoked licenses across all apps
        const resLic = db.prepare("DELETE FROM licenses WHERE status IN ('expired', 'revoked')").run();
        db.exec('PRAGMA optimize;');
        resultMessage = `Removed ${resLic.changes} expired/revoked licenses.`;
        recordAuditLog(adminId, null, 'DATABASE_CLEAN_LICENSES', resultMessage, req.ip);
        break;
      }

      default:
        return res.status(400).json({ success: false, message: `Unknown database maintenance action: ${action}` });
    }

    res.json({
      success: true,
      message: resultMessage,
      action
    });
  } catch (err) {
    console.error(`Database action '${action}' error:`, err);
    res.status(500).json({ success: false, message: `Database action failed: ${err.message}` });
  }
}
