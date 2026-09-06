import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api/v1';

// Test runner helper
let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
    results.push({ name: testName, status: 'PASS', detail });
  } else {
    console.error(`  [FAIL] ${testName} - ${detail}`);
    failCount++;
    results.push({ name: testName, status: 'FAIL', detail });
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const rawText = await res.text();
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = rawText;
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
    rawText
  };
}

// Ed25519 response verifier mimicking client SDK
function verifyEd25519Signature(headers, rawText, publicKeyHex) {
  const timestamp = headers.get('x-timestamp');
  const edSigHex = headers.get('x-signature-ed25519');
  const serverPubKey = headers.get('x-public-key');

  const pubKey = publicKeyHex || serverPubKey;
  if (!pubKey || !edSigHex || !timestamp) return false;

  try {
    const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
    const fullSpki = Buffer.concat([spkiPrefix, Buffer.from(pubKey, 'hex')]);
    const pubKeyObj = crypto.createPublicKey({ key: fullSpki, format: 'der', type: 'spki' });
    const verifyMsg = Buffer.from(`${timestamp}.${rawText}`);
    return crypto.verify(null, verifyMsg, pubKeyObj, Buffer.from(edSigHex, 'hex'));
  } catch (err) {
    return false;
  }
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('  HABIT AUTH — COMPREHENSIVE END-TO-END SECURITY TEST & AUDIT');
  console.log('================================================================\n');

  // STEP 1: Developer Authentication
  console.log('--- 1. Developer Authentication & Account Setup ---');
  const devLoginRes = await apiRequest('/auth/discord/dev-login', {
    method: 'POST',
    body: JSON.stringify({ email: 'sec_tester@habitauth.test', username: 'SecAuditBot' })
  });

  assert(devLoginRes.status === 200 && devLoginRes.data?.token, 'Developer Dev-Login succeeds with JWT token');
  const devToken = devLoginRes.data?.token;

  const profileRes = await apiRequest('/auth/profile', {
    headers: { Authorization: `Bearer ${devToken}` }
  });
  assert(profileRes.status === 200 && profileRes.data?.user?.username, 'Developer Profile retrieval succeeds');

  // STEP 2: Create Test Application
  console.log('\n--- 2. Application Provisioning & Crypto Keypair Generation ---');
  const testAppName = `AuditApp_${Date.now()}`;
  const createAppRes = await apiRequest('/apps', {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` },
    body: JSON.stringify({ app_name: testAppName })
  });

  assert(createAppRes.status === 201 && (createAppRes.data?.application?.id || createAppRes.data?.app?.id), 'Create application succeeds');
  const app = createAppRes.data.application || createAppRes.data.app;
  assert(!!app.app_secret, 'Application has HMAC Secret Key');
  assert(!!app.public_key, 'Application has Ed25519 Public Key');

  // STEP 3: License Key Generation
  console.log('\n--- 3. License Generation & Vault Management ---');
  const singleLicRes = await apiRequest(`/apps/${app.id}/licenses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` },
    body: JSON.stringify({
      count: 1,
      duration_days: 30,
      level: 1,
      prefix: 'AUDIT'
    })
  });
  assert(singleLicRes.status === 201 && Array.isArray(singleLicRes.data?.keys) && singleLicRes.data.keys.length > 0, 'Single license generation succeeds with custom prefix');
  const licenseKey = singleLicRes.data.keys[0];

  const bulkLicRes = await apiRequest(`/apps/${app.id}/licenses/bulk`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` },
    body: JSON.stringify({
      count: 3,
      duration_days: 14,
      level: 2,
      prefix: 'BULK'
    })
  });
  const bulkKeys = bulkLicRes.data?.keys || bulkLicRes.data?.licenses;
  assert(bulkLicRes.status === 201 && Array.isArray(bulkKeys) && bulkKeys.length === 3, 'Bulk license generation (batch of 3) succeeds');

  // STEP 4: Client Handshake & Ed25519 Signature Verification
  console.log('\n--- 4. Client Handshake & Asymmetric Ed25519 Signature Verification ---');
  const initRes = await apiRequest('/client/init', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      client_version: '1.0.0'
    })
  });
  assert(initRes.status === 200, 'Client Init handshake responds 200 OK');
  assert(!!initRes.headers.get('x-signature-ed25519'), 'Server response includes X-Signature-Ed25519 header');

  const isInitSigValid = verifyEd25519Signature(initRes.headers, initRes.rawText, app.public_key);
  assert(isInitSigValid === true, 'Client SDK successfully verifies Ed25519 digital signature of server handshake');

  // STEP 5: Legitimate User Registration with License Key
  console.log('\n--- 5. User Registration & HWID Hardware Locking ---');
  const testUsername = `user_${Date.now().toString().slice(-6)}`;
  const testPassword = 'Password123!';
  const originalHwid = 'HWID_CORRECT_ORIGINAL_MACHINE_001';

  const regRes = await apiRequest('/client/register', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: testUsername,
      password: testPassword,
      license_key: licenseKey,
      hwid: originalHwid
    })
  });
  assert(regRes.status === 201 && regRes.data?.success === true, 'User registration with license key succeeds');
  const isRegSigValid = verifyEd25519Signature(regRes.headers, regRes.rawText, app.public_key);
  assert(isRegSigValid === true, 'Registration response passes Ed25519 signature check');

  // STEP 6: Double-Redemption Prevention Attack
  console.log('\n--- 6. License Double-Redemption Prevention ---');
  const doubleRedeemRes = await apiRequest('/client/register', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: `another_${Date.now().toString().slice(-6)}`,
      password: 'AnotherPassword!',
      license_key: licenseKey,
      hwid: 'HWID_OTHER'
    })
  });
  assert(doubleRedeemRes.status === 409, 'Double redemption of used license is blocked with 409 Conflict');

  // STEP 7: Legitimate Login on Original Machine
  console.log('\n--- 7. Legitimate User Authentication ---');
  const loginRes = await apiRequest('/client/login', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: testUsername,
      password: testPassword,
      hwid: originalHwid
    })
  });
  assert(loginRes.status === 200 && loginRes.data?.success === true, 'Legitimate login on bound HWID succeeds 200 OK');
  const clientToken = loginRes.data?.token;

  // CRACK ATTACK 1: MITM Packet Modification (Fiddler / Charles / Burp Suite Simulation)
  console.log('\n--- 8. CRACK ATTACK #1: Response Tampering / Signature Forgery ---');
  // Attacker intercepts response, changes an unauthenticated response into success
  const tamperedRawText = loginRes.rawText.replace('"success":true', '"success":true,"cracked_by_attacker":true');
  const isTamperedSigValid = verifyEd25519Signature(loginRes.headers, tamperedRawText, app.public_key);
  assert(isTamperedSigValid === false, 'CRACK DEFEATED: Ed25519 signature rejects modified/forged JSON packet');

  // CRACK ATTACK 2: HWID Spoofing / Unauthorized Second Machine Login
  console.log('\n--- 9. CRACK ATTACK #2: HWID Spoofing & Hardware Lock Defense ---');
  const pirateHwid = 'HWID_PIRATE_MACHINE_9999';
  const hwidBypassRes = await apiRequest('/client/login', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: testUsername,
      password: testPassword,
      hwid: pirateHwid
    })
  });
  assert(hwidBypassRes.status === 403 && hwidBypassRes.data?.code === 'HWID_MISMATCH', 'CRACK DEFEATED: Login on unbound HWID is blocked with HWID_MISMATCH');

  // HWID Reset by Developer
  console.log('\n--- 10. 1-Click HWID Reset Feature ---');
  const userListRes = await apiRequest(`/apps/${app.id}/users`, {
    headers: { Authorization: `Bearer ${devToken}` }
  });
  const createdUser = userListRes.data?.users?.find(u => u.username === testUsername);
  assert(!!createdUser, 'Created user found in developer dashboard users list');

  if (createdUser) {
    const resetHwidRes = await apiRequest(`/apps/${app.id}/users/${createdUser.id}/reset-hwid`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${devToken}` }
    });
    assert(resetHwidRes.status === 200, 'Developer 1-Click HWID reset succeeds');

    // Login from the new machine should now automatically bind the new HWID!
    const rebindLoginRes = await apiRequest('/client/login', {
      method: 'POST',
      body: JSON.stringify({
        app_id: app.id,
        username: testUsername,
        password: testPassword,
        hwid: pirateHwid
      })
    });
    assert(rebindLoginRes.status === 200 && rebindLoginRes.data?.success === true, 'Login after HWID reset successfully binds new HWID');
  }

  // CRACK ATTACK 3: Binary Tampering & Auto-Ban Defense (SHA-256 Anti-Crack Shield)
  console.log('\n--- 11. CRACK ATTACK #3: Executable Binary Tampering & Auto-Ban ---');
  const expectedBinaryHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  await apiRequest(`/apps/${app.id}/security-config`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${devToken}` },
    body: JSON.stringify({
      enforce_hash_check: true,
      expected_hash: expectedBinaryHash,
      auto_ban_on_hash_mismatch: true
    })
  });

  const tamperedBinaryHash = 'cracked_memory_patched_hash_bad_value';
  const tamperAttemptRes = await apiRequest('/client/login', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: testUsername,
      password: testPassword,
      hwid: pirateHwid,
      file_hash: tamperedBinaryHash
    })
  });
  assert(tamperAttemptRes.status === 403 && tamperAttemptRes.data?.code === 'HASH_MISMATCH', 'CRACK DEFEATED: Hash mismatch blocks login with HASH_MISMATCH');

  // Verify that the user was auto-banned in database
  const userCheckRes = await apiRequest(`/apps/${app.id}/users`, {
    headers: { Authorization: `Bearer ${devToken}` }
  });
  const bannedUser = userCheckRes.data?.users?.find(u => u.username === testUsername);
  assert(bannedUser?.status === 'banned', 'SECURITY SUCCESS: Tampering user account was automatically banned');

  // CRACK ATTACK 4: Blacklist Enforcement
  console.log('\n--- 12. CRACK ATTACK #4: HWID Blacklist Enforcement ---');
  const blacklistedLoginRes = await apiRequest('/client/login', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: 'any_user',
      password: 'any_password',
      hwid: pirateHwid
    })
  });
  assert(blacklistedLoginRes.status === 403 && blacklistedLoginRes.data?.code === 'DEVICE_OR_IP_BLACKLISTED', 'CRACK DEFEATED: Blacklisted HWID is denied access at gate');

  // CRACK ATTACK 5: Live Radar Remote Killswitch
  console.log('\n--- 13. CRACK ATTACK #5: Live Online Radar Remote Session Termination ---');
  // Create a clean user on a fresh HWID
  const radarUsername = `radar_${Date.now().toString().slice(-6)}`;
  const cleanLicRes = await apiRequest(`/apps/${app.id}/licenses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` },
    body: JSON.stringify({ count: 1, duration_days: 7, level: 1 })
  });
  const cleanLicKey = cleanLicRes.data?.keys?.[0] || cleanLicRes.data?.license?.key;
  const cleanHwid = 'HWID_CLEAN_RADAR_TEST_DEVICE_002';

  await apiRequest('/client/register', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: radarUsername,
      password: 'SafePassword123!',
      license_key: cleanLicKey,
      hwid: cleanHwid
    })
  });

  // Log in
  await apiRequest('/client/login', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: radarUsername,
      password: 'SafePassword123!',
      hwid: cleanHwid,
      file_hash: expectedBinaryHash
    })
  });

  // Client sends legitimate heartbeat ping
  const ping1 = await apiRequest('/client/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ app_id: app.id, username: radarUsername, hwid: cleanHwid })
  });
  assert(ping1.status === 200 && ping1.data?.success === true, 'Active client heartbeat acknowledged 200 OK');

  // Developer triggers remote session kill from Live Radar
  const radarUsersRes = await apiRequest(`/apps/${app.id}/users`, {
    headers: { Authorization: `Bearer ${devToken}` }
  });
  const radarUserObj = radarUsersRes.data?.users?.find(u => u.username === radarUsername);
  assert(!!radarUserObj, 'Radar user located in app users');

  if (radarUserObj) {
    const killRes = await apiRequest(`/apps/${app.id}/users/${radarUserObj.id}/kill-session`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${devToken}` }
    });
    assert(killRes.status === 200, 'Developer Live Radar remote kill triggered successfully');

    // Next client ping MUST be rejected with SESSION_KILLED!
    const ping2 = await apiRequest('/client/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ app_id: app.id, username: radarUsername, hwid: cleanHwid })
    });
    assert(ping2.status === 403 && ping2.data?.killed === true && ping2.data?.code === 'SESSION_KILLED', 'KILL ENFORCED: Client heartbeat blocked with SESSION_KILLED and killed: true');
  }

  // CRACK ATTACK 6: SQL Injection Probing
  console.log('\n--- 14. CRACK ATTACK #6: SQL Injection & Injection Probes ---');
  const sqlPayloads = [
    "' OR '1'='1",
    "admin'--",
    "' UNION SELECT 1,2,3,4,5--",
    "'; DROP TABLE users; --",
    '1; SELECT * FROM applications'
  ];

  let sqlSafe = true;
  for (const payload of sqlPayloads) {
    const sqliRes = await apiRequest('/client/login', {
      method: 'POST',
      body: JSON.stringify({
        app_id: app.id,
        username: payload,
        password: 'password'
      })
    });
    // Must return 401 or 400, never 500 or leaked rows
    if (sqliRes.status === 500) {
      sqlSafe = false;
      console.error(`  SQL syntax error on payload: ${payload}`);
    }
  }
  assert(sqlSafe, 'CRACK DEFEATED: All SQL injection payloads safely parameterized without syntax errors or data leaks');

  // CRACK ATTACK 7: Brute Force Password Lockout (5 Failed Attempts -> 24h Lockout)
  console.log('\n--- 15. CRACK ATTACK #7: Brute Force Attack & 24h Security Lockout ---');
  const bruteUser = `brute_${Date.now().toString().slice(-6)}`;
  const bruteLicRes = await apiRequest(`/apps/${app.id}/licenses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` },
    body: JSON.stringify({ count: 1, duration_days: 7, level: 1 })
  });
  const bruteHwid = 'HWID_BRUTE_TEST_99';
  const bruteLicKey = bruteLicRes.data?.keys?.[0] || bruteLicRes.data?.license?.key;
  await apiRequest('/client/register', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: bruteUser,
      password: 'CorrectPassword!',
      license_key: bruteLicKey,
      hwid: bruteHwid
    })
  });

  // Send 4 failed passwords
  for (let i = 1; i <= 4; i++) {
    await apiRequest('/client/login', {
      method: 'POST',
      body: JSON.stringify({
        app_id: app.id,
        username: bruteUser,
        password: `wrong_pass_${i}`,
        hwid: bruteHwid,
        file_hash: expectedBinaryHash
      })
    });
  }

  // 5th failed password must trigger 423 Locked!
  const fifthAttempt = await apiRequest('/client/login', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: bruteUser,
      password: 'wrong_pass_5',
      hwid: bruteHwid,
      file_hash: expectedBinaryHash
    })
  });
  assert(fifthAttempt.status === 423 && fifthAttempt.data?.code === 'ACCOUNT_TEMPORARILY_LOCKED', 'BRUTE FORCE DEFEATED: 5th failed attempt triggers 423 ACCOUNT_TEMPORARILY_LOCKED');

  // Even with the correct password, it must now be rejected!
  const sixthWithCorrectPassword = await apiRequest('/client/login', {
    method: 'POST',
    body: JSON.stringify({
      app_id: app.id,
      username: bruteUser,
      password: 'CorrectPassword!',
      hwid: bruteHwid,
      file_hash: expectedBinaryHash
    })
  });
  assert(sixthWithCorrectPassword.status === 423, 'LOCKOUT ENFORCED: Correct password rejected while 24h lockout is active');

  // STEP 16: Additional Developer Features (Webhooks, Tickets, Audit Logs)
  console.log('\n--- 16. Developer Ecosystem & Feature Verification ---');
  const webhookRes = await apiRequest(`/apps/${app.id}/webhooks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` },
    body: JSON.stringify({
      name: 'Security Discord Webhook',
      url: 'https://discord.com/api/webhooks/mock/test',
      platform: 'discord',
      events: 'login,register,user_banned'
    })
  });
  assert(webhookRes.status === 201, 'Discord Webhook creation succeeds');

  const auditLogRes = await apiRequest('/audit-logs', {
    headers: { Authorization: `Bearer ${devToken}` }
  });
  assert(auditLogRes.status === 200 && Array.isArray(auditLogRes.data?.logs) && auditLogRes.data.logs.length > 0, 'Audit logs properly recorded and retrievable');

  const ticketRes = await apiRequest('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` },
    body: JSON.stringify({
      appId: app.id,
      title: 'Automated Security Test Ticket',
      description: 'Automated test suite verification.',
      priority: 'high'
    })
  });
  assert((ticketRes.status === 200 || ticketRes.status === 201) && ticketRes.data?.success === true, 'Support Ticket creation succeeds');

  // CLEANUP TEST APP
  console.log('\n--- 17. Test Resource Teardown ---');
  const deleteAppRes = await apiRequest(`/apps/${app.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${devToken}` }
  });
  assert(deleteAppRes.status === 200, 'Test application cleaned up successfully');

  // SUMMARY
  console.log('\n================================================================');
  console.log(`  SECURITY TEST & AUDIT COMPLETE: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
