import { DatabaseSync } from 'node:sqlite';

const TURSO_URL = 'https://habitauth-db-habitauth.aws-ap-south-1.turso.io/v2/pipeline';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg3MTc0NjcsImlkIjoiMDFhMDc3ZGQtNWIwMS03NWQ2LWFlY2MtZmQwZWY5NjkwNmQ2Iiwia2lkIjoiUS1FV2Z2QWpOTUZmS0s0U3pYc2lCVk1ZbVo0aWRYLVZpNFVyTF9oUVVmZyIsInJpZCI6IjExYjQ2Nzk0LWIwOWUtNDVmMC05ZWE2LWJmMDJmYjFjNjFhYyJ9.vA0v4EaI67pP_IsqG143F_kFqO8Aorylseu_1GAtVXq96W6B1Jh4tPjaqQOnmQsWr4GCTF6i-qJyIQwUJjcNDA';

const db = new DatabaseSync('backend/database.sqlite');

async function executeTursoBatch(stmts) {
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
  return await res.json();
}

async function migrateSchemaAndDataToTurso() {
  console.log('Extracting local schema...');
  const tableDefs = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").all();
  
  const schemaStmts = tableDefs.map(t => ({ sql: t.sql }));
  console.log(`Sending ${schemaStmts.length} table definitions to Turso...`);
  const schemaResult = await executeTursoBatch(schemaStmts);
  console.log('Schema created on Turso:', schemaResult.results?.[0]?.type || 'error');

  // Push rows
  for (const t of tableDefs) {
    const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
    if (rows.length === 0) continue;

    console.log(`Pushing ${rows.length} rows for table ${t.name}...`);
    const cols = Object.keys(rows[0]);
    const placeholders = cols.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${t.name} (${cols.join(', ')}) VALUES (${placeholders})`;

    // Batch in chunks of 50
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const stmts = chunk.map(r => ({
        sql,
        args: cols.map(c => r[c])
      }));
      await executeTursoBatch(stmts);
    }
  }

  console.log('All local tables and data successfully pushed to Turso Cloud!');
}

migrateSchemaAndDataToTurso();
