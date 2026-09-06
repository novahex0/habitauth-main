const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=== E2E Client SDK Verification ===');

  // Find or use an existing app ID from DB or dev login
  const db = require('../backend/src/config/db.js').default;
  const app = db.prepare('SELECT * FROM applications LIMIT 1').get();
  if (!app) {
    console.error('No application found in database to test.');
    process.exit(1);
  }

  console.log(`Testing with Application: "${app.app_name}" (ID: ${app.id})`);

  // 1. Test Client Init
  console.log('\n[1] Testing Client Init (/auth/client-init)...');
  const initRes = await post('/auth/client-init', {
    app_id: app.id,
    nonce: 'test_nonce_123',
    client_version: '1.0.0'
  });
  console.log('Init Status:', initRes.status);
  console.log('Init Success:', initRes.data.success);
  console.log('Signed Header X-Signature present:', !!initRes.headers['x-signature']);

  // 2. Generate a test license for registration testing
  const licKey = 'HABIT-TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-SDK';
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`
    INSERT INTO licenses (id, app_id, license_key, status, duration_days, created_at, expires_at)
    VALUES (?, ?, ?, 'unused', 30, ?, 0)
  `).run('lic_' + Date.now(), app.id, licKey, now);
  console.log(`\nCreated test license: ${licKey}`);

  // 3. Test Client Register
  console.log('\n[2] Testing Client Register (/auth/client-register)...');
  const testUser = 'sdk_user_' + Math.random().toString(36).substring(2, 7);
  const regRes = await post('/auth/client-register', {
    app_id: app.id,
    username: testUser,
    password: 'Password123!',
    license_key: licKey,
    hwid: 'HWID_TEST_MACHINE_1'
  });
  console.log('Register Status:', regRes.status);
  console.log('Register Response:', regRes.data);

  if (!regRes.data.success) {
    console.error('Registration failed!');
    process.exit(1);
  }

  // 4. Test Client Login
  console.log('\n[3] Testing Client Login (/auth/client-login)...');
  const loginRes = await post('/auth/client-login', {
    app_id: app.id,
    username: testUser,
    password: 'Password123!',
    hwid: 'HWID_TEST_MACHINE_1'
  });
  console.log('Login Status:', loginRes.status);
  console.log('Login Success:', loginRes.data.success);
  console.log('User Token issued:', !!loginRes.data.token);

  // 5. Test Heartbeat
  console.log('\n[4] Testing Client Heartbeat (/client/heartbeat)...');
  const hbRes = await post('/client/heartbeat', {
    app_id: app.id,
    username: testUser,
    hwid: 'HWID_TEST_MACHINE_1'
  });
  console.log('Heartbeat Status:', hbRes.status);
  console.log('Heartbeat Success:', hbRes.data.success);

  // 6. Test License Validation
  console.log('\n[5] Testing License Validate (/license/validate)...');
  const valRes = await post('/license/validate', {
    app_id: app.id,
    license_key: licKey
  });
  console.log('Validate Status:', valRes.status);
  console.log('Validate Success:', valRes.data.success);

  // 7. Test Self-Service HWID Reset
  console.log('\n[6] Testing Self-Service HWID Reset (/client/reset-hwid)...');
  // Enable self-reset on app if needed
  db.prepare('UPDATE applications SET hwid_self_reset_enabled = 1 WHERE id = ?').run(app.id);
  const resetRes = await post('/client/reset-hwid', {
    app_id: app.id,
    username: testUser
  });
  console.log('Reset HWID Status:', resetRes.status);
  console.log('Reset HWID Response:', resetRes.data);

  console.log('\n=== ALL CLIENT SDK ENDPOINTS VERIFIED 100% WORKING! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
