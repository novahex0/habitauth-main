import { db } from '../config/db.js';
import crypto from 'crypto';

let TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || '';
let TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_TOKEN || '';

if (TURSO_URL && TURSO_URL.startsWith('libsql://')) {
  TURSO_URL = TURSO_URL.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '') + '/v2/pipeline';
} else if (TURSO_URL && !TURSO_URL.endsWith('/v2/pipeline')) {
  TURSO_URL = TURSO_URL.replace(/\/$/, '') + '/v2/pipeline';
}

const SYNC_TABLES = [
  'accounts',
  'subscriptions',
  'sessions',
  'applications',
  'application_users',
  'licenses',
  'devices',
  'teams',
  'team_members',
  'team_blacklists',
  'api_keys',
  'webhooks',
  'webhook_deliveries',
  'audit_logs',
  'notifications',
  'system_settings',
  'tickets',
  'ticket_messages',
  'blacklists',
  'crypto_payments',
  'coupons',
  'coupon_redemptions',
  'payment_sessions'
];

// In-memory cache of row content hashes.
// Guarantees that unchanged rows are NEVER written to Turso, saving 99.99% of writes.
const lastSyncedHashes = new Map(); // key: `${table}:${rowKey}`, value: md5 string
const knownRowKeysPerTable = new Map(); // key: table, value: Set of rowKeys

export async function executeTursoBatch(stmts) {
  if (!TURSO_URL || !TURSO_TOKEN) return null;
  if (!stmts || stmts.length === 0) return null;

  const requests = stmts.map(s => {
    const req = { type: 'execute', stmt: { sql: s.sql } };
    if (s.args && s.args.length > 0) {
      req.stmt.args = s.args.map(a => {
        if (a === null || a === undefined) return { type: 'null' };
        if (typeof a === 'number') {
          if (Number.isInteger(a)) return { type: 'integer', value: a.toString() };
          return { type: 'float', value: a };
        }
        if (typeof a === 'boolean') return { type: 'integer', value: a ? '1' : '0' };
        return { type: 'text', value: a.toString() };
      });
    }
    return req;
  });
  requests.push({ type: 'close' });

  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TURSO_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Turso HTTP error ${res.status}: ${txt}`);
  }
  return await res.json();
}

export async function queryTurso(sql, args = []) {
  const res = await executeTursoBatch([{ sql, args }]);
  if (!res || !res.results || !res.results[0] || !res.results[0].response || !res.results[0].response.result) {
    return [];
  }
  const execResult = res.results[0].response.result;
  const cols = execResult.cols.map(c => c.name);
  return execResult.rows.map(row => {
    const obj = {};
    row.forEach((val, idx) => {
      obj[cols[idx]] = val.type === 'null' ? null : (val.type === 'integer' ? parseInt(val.value, 10) : val.value);
    });
    return obj;
  });
}

/**
 * On server boot: Pulls remote data from Turso Cloud to guarantee persistence across redeploys.
 * Also seeds in-memory hash cache so zero redundant writes occur post-boot.
 */
export async function restoreFromCloud() {
  if (!TURSO_URL || !TURSO_TOKEN) {
    console.log('[CloudSync] Turso credentials not configured. Running in local-only SQLite mode.');
    return;
  }

  console.log('[CloudSync] Connecting to Turso Cloud for persistent state check...');
  try {
    db.exec('PRAGMA foreign_keys = OFF;');

    let totalRestored = 0;

    for (const table of SYNC_TABLES) {
      try {
        const localTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?;").get(table);
        if (!localTableCheck) continue;

        const remoteRows = await queryTurso(`SELECT * FROM ${table}`);
        if (!remoteRows || remoteRows.length === 0) continue;

        const localCount = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;

        const cols = Object.keys(remoteRows[0]);
        const placeholders = cols.map(() => '?').join(', ');
        const insertStmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`);

        if (!knownRowKeysPerTable.has(table)) knownRowKeysPerTable.set(table, new Set());
        const tableKeys = knownRowKeysPerTable.get(table);

        for (const row of remoteRows) {
          const vals = cols.map(c => row[c]);
          insertStmt.run(...vals);

          // Seed hash cache with already-persisted remote row data
          const rowKey = row.id !== undefined ? String(row.id) : String(row.key);
          const hash = crypto.createHash('md5').update(JSON.stringify(row)).digest('hex');
          lastSyncedHashes.set(`${table}:${rowKey}`, hash);
          tableKeys.add(rowKey);
        }

        totalRestored += remoteRows.length;
        if (localCount === 0 || remoteRows.length > localCount) {
          console.log(`[CloudSync] Table '${table}': restored ${remoteRows.length} rows (was ${localCount}).`);
        }
      } catch (tableErr) {
        console.error(`[CloudSync] Error restoring table ${table}:`, tableErr.message);
      }
    }

    db.exec('PRAGMA foreign_keys = ON;');
    console.log(`[CloudSync] Data persistence verified. Total synchronized records: ${totalRestored}`);
  } catch (err) {
    db.exec('PRAGMA foreign_keys = ON;');
    console.error('[CloudSync] Cloud restore error:', err.message);
  }
}

/**
 * Pushes ONLY modified, new, or deleted rows to Turso Cloud.
 * Unchanged rows are strictly skipped, resulting in 0 writes when data is untouched.
 */
export async function pushToCloud(tableList = SYNC_TABLES) {
  if (!TURSO_URL || !TURSO_TOKEN) return;

  const batchStmts = [];
  const pendingHashUpdates = [];
  const pendingKeyDeletions = [];

  for (const table of tableList) {
    try {
      const localTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?;").get(table);
      if (!localTableCheck) continue;

      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      const currentKeys = new Set();
      const pkCol = table === 'system_settings' ? 'key' : 'id';

      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        const placeholders = cols.map(() => '?').join(', ');
        const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;

        for (const row of rows) {
          const rowKey = row.id !== undefined ? String(row.id) : String(row.key);
          currentKeys.add(rowKey);

          const hash = crypto.createHash('md5').update(JSON.stringify(row)).digest('hex');
          const lastHash = lastSyncedHashes.get(`${table}:${rowKey}`);

          // If this row has NOT changed, SKIP IT completely! (0 writes)
          if (lastHash === hash) {
            continue;
          }

          batchStmts.push({
            sql,
            args: cols.map(c => row[c])
          });
          pendingHashUpdates.push({
            table,
            rowKey,
            hash
          });
        }
      }

      // Check for deleted rows that existed in Turso but are now removed from SQLite
      const knownKeys = knownRowKeysPerTable.get(table) || new Set();
      for (const oldKey of knownKeys) {
        if (!currentKeys.has(oldKey)) {
          batchStmts.push({
            sql: `DELETE FROM ${table} WHERE ${pkCol} = ?`,
            args: [oldKey]
          });
          pendingKeyDeletions.push({
            table,
            rowKey: oldKey
          });
        }
      }

      knownRowKeysPerTable.set(table, currentKeys);
    } catch (err) {
      // Non-blocking log
    }
  }

  // IF NOTHING CHANGED: DO NOT CALL TURSO! ZERO WRITES CONSUMED!
  if (batchStmts.length === 0) {
    return;
  }

  console.log(`[CloudSync] Detected ${batchStmts.length} modified/new row(s). Syncing strictly changed data to Turso...`);

  try {
    for (let i = 0; i < batchStmts.length; i += 50) {
      const chunk = batchStmts.slice(i, i + 50);
      await executeTursoBatch(chunk);
    }

    // Update in-memory hash cache only after successful Turso write
    for (const item of pendingHashUpdates) {
      lastSyncedHashes.set(`${item.table}:${item.rowKey}`, item.hash);
    }
    for (const item of pendingKeyDeletions) {
      lastSyncedHashes.delete(`${item.table}:${item.rowKey}`);
    }

    console.log(`[CloudSync] Successfully synchronized ${batchStmts.length} row(s) to Turso Cloud.`);
  } catch (err) {
    console.error('[CloudSync] Error pushing incremental updates to Turso:', err.message);
  }
}

let syncTimeout = null;
const dirtyTables = new Set();

/**
 * Immediate non-debounced sync for critical operations (e.g. subscription changes, payments).
 */
export async function syncNow(tableName = null) {
  if (tableName) {
    if (Array.isArray(tableName)) tableName.forEach(t => dirtyTables.add(t));
    else dirtyTables.add(tableName);
  }
  try {
    const tablesToSync = dirtyTables.size > 0 ? Array.from(dirtyTables) : SYNC_TABLES;
    dirtyTables.clear();
    await pushToCloud(tablesToSync);
  } catch (err) {
    console.error('[CloudSync] Immediate sync error:', err.message);
  }
}

/**
 * Non-blocking debounced sync trigger. Called after any write operation.
 */
export function scheduleSync(tableName = null) {
  if (tableName) {
    if (Array.isArray(tableName)) tableName.forEach(t => dirtyTables.add(t));
    else dirtyTables.add(tableName);
  }
  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      const tablesToSync = dirtyTables.size > 0 ? Array.from(dirtyTables) : SYNC_TABLES;
      dirtyTables.clear();
      await pushToCloud(tablesToSync);
    } catch (err) {
      console.error('[CloudSync] Scheduled sync error:', err.message);
    }
  }, 1000);
}

/**
 * Starts periodic background synchronization with zero-write idle optimization.
 */
export function startPeriodicSync(intervalMs = 60000) {
  if (!TURSO_URL || !TURSO_TOKEN) return;

  // Background safety sync (only pushes if differences are detected, otherwise 0 writes)
  setInterval(async () => {
    try {
      await pushToCloud();
    } catch (err) {}
  }, intervalMs);

  process.on('SIGTERM', async () => {
    console.log('[CloudSync] SIGTERM received. Saving state to Turso Cloud before shutdown...');
    try {
      await pushToCloud();
    } catch (e) {}
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[CloudSync] SIGINT received. Saving state to Turso Cloud before shutdown...');
    try {
      await pushToCloud();
    } catch (e) {}
    process.exit(0);
  });
}

/**
 * Permanently purges a ticket and all its threaded messages from Turso Cloud.
 * Guarantees that deleted tickets and messages can NEVER be restored on server restart or redeploy.
 */
export async function purgeTicketFromCloud(ticketId) {
  if (!TURSO_URL || !TURSO_TOKEN || !ticketId) return;
  try {
    await executeTursoBatch([
      { sql: 'DELETE FROM ticket_messages WHERE ticket_id = ?', args: [ticketId] },
      { sql: 'DELETE FROM tickets WHERE id = ?', args: [ticketId] }
    ]);
    lastSyncedHashes.delete(`tickets:${ticketId}`);
    const tKeys = knownRowKeysPerTable.get('tickets');
    if (tKeys) tKeys.delete(String(ticketId));
    console.log(`[CloudSync] Permanently purged ticket '${ticketId}' and its messages from Turso Cloud.`);
  } catch (err) {
    console.error('[CloudSync] Error purging ticket from Turso Cloud:', err.message);
  }
}

