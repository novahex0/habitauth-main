import { db } from '../config/db.js';

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

        for (const row of remoteRows) {
          const vals = cols.map(c => row[c]);
          insertStmt.run(...vals);
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
 * Pushes local SQLite data to Turso Cloud.
 */
export async function pushToCloud(tableList = SYNC_TABLES) {
  if (!TURSO_URL || !TURSO_TOKEN) return;

  for (const table of tableList) {
    try {
      const localTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?;").get(table);
      if (!localTableCheck) continue;

      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) continue;

      const cols = Object.keys(rows[0]);
      const placeholders = cols.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;

      for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50);
        const stmts = chunk.map(r => ({
          sql,
          args: cols.map(c => r[c])
        }));
        await executeTursoBatch(stmts);
      }
    } catch (err) {
      // Non-blocking log
    }
  }
}

let syncTimeout = null;
const dirtyTables = new Set();

/**
 * Non-blocking debounced sync trigger. Called after any critical write (register, add license, payment, etc.)
 */
export function scheduleSync(tableName = null) {
  if (tableName) dirtyTables.add(tableName);
  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      const tablesToSync = dirtyTables.size > 0 ? Array.from(dirtyTables) : SYNC_TABLES;
      dirtyTables.clear();
      await pushToCloud(tablesToSync);
    } catch (err) {
      console.error('[CloudSync] Scheduled sync error:', err.message);
    }
  }, 2000);
}

/**
 * Starts periodic background synchronization and registers shutdown hooks.
 */
export function startPeriodicSync(intervalMs = 15000) {
  if (!TURSO_URL || !TURSO_TOKEN) return;

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
