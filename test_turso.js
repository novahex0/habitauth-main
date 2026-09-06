const TURSO_URL = 'https://habitauth-db-habitauth.aws-ap-south-1.turso.io/v2/pipeline';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg3MTc0NjcsImlkIjoiMDFhMDc3ZGQtNWIwMS03NWQ2LWFlY2MtZmQwZWY5NjkwNmQ2Iiwia2lkIjoiUS1FV2Z2QWpOTUZmS0s0U3pYc2lCVk1ZbVo0aWRYLVZpNFVyTF9oUVVmZyIsInJpZCI6IjExYjQ2Nzk0LWIwOWUtNDVmMC05ZWE2LWJmMDJmYjFjNjFhYyJ9.vA0v4EaI67pP_IsqG143F_kFqO8Aorylseu_1GAtVXq96W6B1Jh4tPjaqQOnmQsWr4GCTF6i-qJyIQwUJjcNDA';

async function queryTurso(sql, args = []) {
  const stmt = { sql };
  if (args.length > 0) {
    stmt.args = args.map(a => {
      if (a === null || a === undefined) return { type: 'null' };
      if (typeof a === 'number') {
        if (Number.isInteger(a)) return { type: 'integer', value: a.toString() };
        return { type: 'float', value: a };
      }
      if (typeof a === 'boolean') return { type: 'integer', value: a ? '1' : '0' };
      return { type: 'text', value: a.toString() };
    });
  }

  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TURSO_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt },
        { type: 'close' }
      ]
    })
  });

  const data = await res.json();
  const execResult = data.results?.[0]?.response?.result;
  if (!execResult) return [];

  const cols = execResult.cols.map(c => c.name);
  return execResult.rows.map(row => {
    const obj = {};
    row.forEach((val, idx) => {
      obj[cols[idx]] = val.type === 'null' ? null : (val.type === 'integer' ? parseInt(val.value, 10) : val.value);
    });
    return obj;
  });
}

async function test() {
  const tables = await queryTurso("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
  console.log('Tables on Turso:', tables);
}

test();
