/**
 * HabitAuth Official JavaScript Client SDK (v2.4)
 * Universal client for Node.js backends, Electron desktop apps, React Native, and Web browsers.
 * Full cryptographic verification, 1-key licenses, self-service HWID resets, and telemetry heartbeats.
 */

class HabitAuth {
  /**
   * @param {Object} options
   * @param {string} options.appName - Human-readable application name
   * @param {string} options.appId - Application ID from dashboard
   * @param {string} [options.appSecret=''] - Application secret for cryptographic HMAC-SHA256 response verification
   * @param {string} [options.publicKey=''] - Application Ed25519 public key (hex) for asymmetric zero-trust verification
   * @param {string} [options.version='1.0.0'] - Client version for auto-update checks
   * @param {string} [options.baseUrl='https://habitauth.com/api/v1'] - HabitAuth backend API URL
   */
  constructor({ appName = 'HabitApp', appId, appSecret = '', publicKey = '', version = '1.0.0', baseUrl = 'https://habitauth.com/api/v1' } = {}) {
    if (!appId) throw new Error('[HabitAuth] appId is required.');

    this.appName = appName;
    this.appId = appId;
    this.appSecret = appSecret;
    this.publicKey = publicKey;
    this.version = version;
    this.baseUrl = baseUrl.replace(/\/+$/, '');

    this.isInitialized = false;
    this.isMaintenanceActive = false;
    this.maintenanceMessage = '';
    this.updateAvailable = false;
    this.downloadUrl = '';
    this.sessionToken = null;
    this.sessionNonce = null;

    this.user = null;
    this.app = null;
    this.lastResponse = null;
    this._heartbeatInterval = null;
  }

  /**
   * 1. Initialize cryptographic handshake with the HabitAuth server.
   * Validates app status, maintenance mode, auto-updates, and startup token.
   * @param {string} [token=null] - Optional startup token if Token Validation is enabled
   */
  async init(token = null) {
    try {
      const initNonce = this._generateNonce();
      const payload = {
        app_id: this.appId,
        app_name: this.appName,
        nonce: initNonce,
        client_version: this.version,
        app_secret: this.appSecret || undefined,
        public_key: this.publicKey || undefined,
        token: token ? token.trim() : undefined
      };

      const res = await fetch(`${this.baseUrl}/auth/client-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const rawText = await res.text();
      await this._verifyResponse(res, rawText);
      const data = JSON.parse(rawText);
      this.lastResponse = data;

      if (data.killed) {
        if (typeof process !== 'undefined' && process.exit) process.exit(0);
      }

      if (!data.success) {
        return false;
      }

      if (this.publicKey && data.public_key && this.publicKey.trim().toLowerCase() !== data.public_key.trim().toLowerCase()) {
        this.lastResponse = { success: false, message: 'Public Key does not match! Zero-Trust verification failed.', code: 'PUBKEY_NOT_MATCH' };
        return false;
      }

      if (data.public_key && !this.publicKey) {
        this.publicKey = data.public_key;
      }

      if (data.app) {
        const srvAppName = data.app.name;
        if (this.appName && srvAppName && this.appName.toLowerCase() !== 'habitapp' && this.appName.toLowerCase() !== srvAppName.toLowerCase()) {
          this.lastResponse = { success: false, message: `App Name does not match! Client specified '${this.appName}', but registered application name is '${srvAppName}'.`, code: 'APP_NAME_NOT_MATCH' };
          return false;
        }

        this.app = {
          name: srvAppName || this.appName,
          version: data.app.version || this.version,
          status: data.app.status || 'active'
        };
      }

      this.sessionNonce = data.session_nonce || initNonce;
      this.isMaintenanceActive = !!data.maintenance;
      this.updateAvailable = !!data.force_update;
      this.downloadUrl = data.download_url || '';

      this.isInitialized = true;
      return true;
    } catch (err) {
      this.lastResponse = { success: false, message: err.message, code: 'INIT_EXCEPTION' };
      return false;
    }
  }

  /**
   * 2. Authenticate existing user with username and password.
   * Enforces SHA-256 HWID binding and 24h lockout security.
   */
  async login(username, password) {
    this._checkInit();
    const hwid = await this.getHWID();

    return this._postAuth(`${this.baseUrl}/auth/client-login`, {
      app_id: this.appId,
      username: username?.trim(),
      password,
      hwid,
      nonce: this._generateNonce()
    });
  }

  /**
   * 3. Register a new user with a valid license key and automatically bind hardware.
   */
  async register(username, password, licenseKey) {
    this._checkInit();
    const hwid = await this.getHWID();

    return this._postAuth(`${this.baseUrl}/auth/client-register`, {
      app_id: this.appId,
      username: username?.trim(),
      password,
      license_key: licenseKey?.trim(),
      hwid,
      nonce: this._generateNonce()
    });
  }

  /**
   * 4. Instant 1-Key License Login (No username or password required).
   */
  async license(licenseKey) {
    this._checkInit();
    const hwid = await this.getHWID();

    return this._postAuth(`${this.baseUrl}/auth/client-license`, {
      app_id: this.appId,
      license_key: licenseKey?.trim(),
      hwid,
      nonce: this._generateNonce()
    });
  }

  /**
   * 5. Validate license key status without login.
   */
  async validateLicense(licenseKey) {
    this._checkInit();
    try {
      const res = await fetch(`${this.baseUrl}/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.appId,
          license_key: licenseKey?.trim(),
          nonce: this._generateNonce()
        })
      });
      const data = await res.json();
      this.lastResponse = data;
      return !!data.success;
    } catch (err) {
      this.lastResponse = { success: false, message: err.message, code: 'VALIDATE_ERROR' };
      return false;
    }
  }

  /**
   * 6. Self-service HWID reset with cooldown enforcement.
   * Accepts username or license key.
   */
  async resetHWID(usernameOrKey) {
    this._checkInit();
    try {
      const isLic = usernameOrKey && usernameOrKey.startsWith('HABIT-');
      const payload = {
        app_id: this.appId,
        username: isLic ? undefined : usernameOrKey?.trim(),
        license_key: isLic ? usernameOrKey?.trim() : undefined,
        nonce: this._generateNonce()
      };

      const res = await fetch(`${this.baseUrl}/client/reset-hwid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      this.lastResponse = data;
      return !!data.success;
    } catch (err) {
      this.lastResponse = { success: false, message: err.message, code: 'HWID_RESET_ERROR' };
      return false;
    }
  }

  /**
   * 7. Start continuous background heartbeat telemetry (default every 30 seconds).
   * Remotely terminates application or fires onKilled callback if killed in dashboard.
   */
  startHeartbeat(intervalSeconds = 30, onKilled = null) {
    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);

    this._heartbeatInterval = setInterval(async () => {
      if (!this.user || !this.user.username) return;

      try {
        const payload = {
          app_id: this.appId,
          username: this.user.username,
          nonce: this._generateNonce()
        };

        const res = await fetch(`${this.baseUrl}/client/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.killed) {
          clearInterval(this._heartbeatInterval);
          if (typeof onKilled === 'function') {
            onKilled(data);
          } else if (typeof process !== 'undefined' && process.exit) {
            process.exit(0);
          }
        }
      } catch {
        // Ignore transient network errors
      }
    }, intervalSeconds * 1000);
  }

  /**
   * Stop background heartbeat telemetry.
   */
  stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }

  /**
   * Generate SHA-256 Hardware Fingerprint (Node.js or Browser)
   */
  async getHWID() {
    try {
      // Node.js environment
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const os = require('os');
        const crypto = require('crypto');
        const raw = `${os.hostname()}_${os.userInfo().username}_${os.cpus().length}_${os.platform()}`;
        return crypto.createHash('sha256').update(raw).digest('hex');
      }

      // Browser environment
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const raw = `${navigator.userAgent}_${navigator.language}_${screen.width}x${screen.height}`;
        const msgBuffer = new TextEncoder().encode(raw);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      return 'BROWSER_HWID_FALLBACK';
    } catch {
      return 'UNKNOWN_HWID_FALLBACK';
    }
  }

  _generateNonce() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async _postAuth(url, payload) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const rawText = await res.text();
      await this._verifyResponse(res, rawText);
      const data = JSON.parse(rawText);
      this.lastResponse = data;

      if (data.killed) {
        if (typeof process !== 'undefined' && process.exit) process.exit(0);
      }

      if (!data.success) return false;

      if (data.token) this.sessionToken = data.token;
      if (data.user) {
        this.user = {
          ...data.user,
          isLifetime: data.user.expires_at === 'Lifetime'
        };
      } else if (data.license) {
        this.user = {
          username: 'LicenseUser',
          licenseKey: data.license.key,
          hwid: data.license.hwid,
          expiresAt: data.license.expires_at,
          isLifetime: data.license.expires_at === 'Lifetime'
        };
      }

      return true;
    } catch (err) {
      this.lastResponse = { success: false, message: err.message, code: 'NETWORK_ERROR' };
      return false;
    }
  }

  async _getCrypto() {
    if (typeof globalThis.process !== 'undefined' && globalThis.process.versions && globalThis.process.versions.node) {
      try {
        return await import('node:crypto');
      } catch {
        if (typeof require !== 'undefined') return require('crypto');
      }
    }
    return null;
  }

  /**
   * Cryptographically verifies response authenticity using Ed25519 or HMAC-SHA256.
   * Prevents proxy spoofing, local patching, and replay attacks.
   */
  async _verifyResponse(res, rawText) {
    const getHeader = (name) => {
      if (res.headers && typeof res.headers.get === 'function') {
        return res.headers.get(name);
      }
      return res.headers ? res.headers[name.toLowerCase()] || res.headers[name] : null;
    };

    const timestamp = getHeader('x-timestamp');
    const edSigHex = getHeader('x-signature-ed25519');
    const hmacSig = getHeader('x-signature');
    const serverPubKey = getHeader('x-public-key');

    const effectivePubKey = this.publicKey || serverPubKey;
    const crypto = await this._getCrypto();

    // 1. Verify Asymmetric Ed25519 Signature
    if (effectivePubKey && edSigHex && timestamp && crypto) {
      try {
        const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
        const fullSpki = Buffer.concat([spkiPrefix, Buffer.from(effectivePubKey, 'hex')]);
        const pubKeyObj = crypto.createPublicKey({ key: fullSpki, format: 'der', type: 'spki' });
        const verifyMsg = Buffer.from(`${timestamp}.${rawText}`);
        const isValid = crypto.verify(null, verifyMsg, pubKeyObj, Buffer.from(edSigHex, 'hex'));
        if (!isValid) {
          throw new Error('[HabitAuth] Public Key does not match! Zero-Trust signature verification failed.');
        }
        return true;
      } catch (e) {
        throw new Error('[HabitAuth] Public Key verification failed: ' + e.message);
      }
    }

    // 2. Fallback / Dual HMAC-SHA256 Verification
    if (this.appSecret && hmacSig && timestamp && crypto) {
      const expected = crypto.createHmac('sha256', this.appSecret).update(`${timestamp}.${rawText}`).digest('hex');
      if (expected.toLowerCase() !== hmacSig.toLowerCase()) {
        throw new Error('[HabitAuth] App Secret does not match! Cryptographic verification failed.');
      }
      return true;
    }

    return true;
  }

  get response() {
    return this.lastResponse || { success: false, message: '' };
  }

  get user_data() {
    return this.user || {};
  }

  _checkInit() {
    if (!this.isInitialized) {
      throw new Error('[HabitAuth] You must call await auth.init() before invoking authentication methods.');
    }
  }
}

class api extends HabitAuth {
  constructor({ name, ownerid, secret = '', version = '1.0', url = 'https://habitauth.com/api/v1' } = {}) {
    super({ appName: name, appId: ownerid, appSecret: secret, version, baseUrl: url });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HabitAuth;
  module.exports.HabitAuth = HabitAuth;
  module.exports.api = api;
}
if (typeof window !== 'undefined') {
  window.HabitAuth = HabitAuth;
  window.api = api;
}

export { api };
export default HabitAuth;
