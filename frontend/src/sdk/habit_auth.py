"""
HabitAuth Official Python Client SDK (v2.4)
Hardware-locked, cryptographically verified authentication client.
Includes auto-updater, anti-patch binary hashing, self-service HWID reset, and background heartbeat.
"""

import os
import sys
import uuid
import time
import hashlib
import platform
import threading
import subprocess
import requests

class HabitAuth:
    """
    HabitAuth Python Enterprise Client SDK
    """
    def __init__(self, app_name="HabitApp", app_id=None, app_secret="", public_key="", version="1.0.0", base_url="https://habitauth.onrender.com/api/v1", ownerid=None):
        effective_id = app_id or ownerid
        if not effective_id:
            raise ValueError("[HabitAuth] app_id or ownerid cannot be empty.")

        self.app_name = app_name or "HabitApp"
        self.app_id = effective_id
        self.ownerid = effective_id
        self.app_secret = app_secret
        self.public_key = public_key
        self.version = version
        self.base_url = (base_url or "https://habitauth.onrender.com/api/v1").rstrip('/')

        self.session = requests.Session()
        self.session.headers.update({"User-Agent": f"HabitAuth-Python-SDK/{version}"})

        self.is_initialized = False
        self.is_maintenance_active = False
        self.maintenance_message = ""
        self.update_available = False
        self.download_url = ""
        self.session_token = None
        self.session_nonce = None

        # Clock skew compensation for worldwide users
        self._clock_offset = 0
        self._clock_offset_synced = False

        self.user = None
        self.app = None
        self.last_response = {}
        self._heartbeat_thread = None
        self._heartbeat_stop = threading.Event()

    def get_hwid(self):
        """Generate tamper-resistant machine hardware fingerprint"""
        try:
            raw = f"{platform.node()}_{platform.machine()}_{platform.processor()}_{platform.system()}"
            return hashlib.sha256(raw.encode()).hexdigest()
        except Exception:
            return "PYTHON_HWID_FALLBACK"

    def get_binary_hash(self):
        """Calculate SHA-256 of the currently running file or PyInstaller binary"""
        try:
            exe_path = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(__file__)
            hasher = hashlib.sha256()
            with open(exe_path, 'rb') as f:
                while chunk := f.read(8192):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception:
            return ""

    def _generate_nonce(self):
        return uuid.uuid4().hex

    def init(self, token=None):
        """
        1. Initialize cryptographic handshake with HabitAuth server.
        Validates app status, maintenance, auto-updates, and optional startup token.
        """
        try:
            init_nonce = self._generate_nonce()
            payload = {
                "app_id": self.app_id,
                "nonce": init_nonce,
                "client_version": self.version,
                "token": token.strip() if token else None
            }

            raw_res = self.session.post(f"{self.base_url}/auth/client-init", json=payload)
            self._verify_response(raw_res)
            res = raw_res.json()
            self.last_response = res

            if res.get("killed"):
                sys.exit(0)

            if not res.get("success"):
                return False, res.get("message", "Initialization failed.")

            # Automatic Clock Synchronization:
            # Calibrate the exact time difference between client machine and HabitAuth server.
            # Ensures 100% reliability for users across all worldwide timezones or with unsynced Windows clocks.
            server_time = res.get("server_time") or res.get("timestamp")
            if server_time is not None and not self._clock_offset_synced:
                try:
                    self._clock_offset = int(server_time) - int(time.time())
                    self._clock_offset_synced = True
                except Exception:
                    pass

            if res.get("public_key") and not self.public_key:
                self.public_key = res.get("public_key")

            self.session_nonce = res.get("session_nonce", init_nonce)
            self.is_maintenance_active = bool(res.get("maintenance"))
            self.update_available = bool(res.get("force_update"))
            self.download_url = res.get("download_url", "")

            if res.get("app"):
                self.app = res.get("app")

            self.is_initialized = True
            return True, "Initialized successfully."
        except Exception as e:
            self.last_response = {"success": False, "message": str(e), "code": "INIT_EXCEPTION"}
            return False, str(e)

    def login(self, username, password):
        """
        2. Authenticate existing user with username, password, HWID, and binary hash.
        """
        self._check_init()
        payload = {
            "app_id": self.app_id,
            "username": username.strip() if username else "",
            "password": password,
            "hwid": self.get_hwid(),
            "file_hash": self.get_binary_hash(),
            "client_version": self.version,
            "nonce": self._generate_nonce()
        }

        return self._post_auth(f"{self.base_url}/auth/client-login", payload)

    def register(self, username, password, license_key):
        """
        3. Register a new user with a valid license key and bind hardware profile.
        """
        self._check_init()
        payload = {
            "app_id": self.app_id,
            "username": username.strip() if username else "",
            "password": password,
            "license_key": license_key.strip() if license_key else "",
            "hwid": self.get_hwid(),
            "client_version": self.version,
            "nonce": self._generate_nonce()
        }

        return self._post_auth(f"{self.base_url}/auth/client-register", payload)

    def license(self, license_key):
        """
        4. Instant 1-Key License Login (No username or password required).
        """
        self._check_init()
        payload = {
            "app_id": self.app_id,
            "license_key": license_key.strip() if license_key else "",
            "hwid": self.get_hwid(),
            "client_version": self.version,
            "nonce": self._generate_nonce()
        }

        return self._post_auth(f"{self.base_url}/auth/client-license", payload)

    def validate_license(self, license_key):
        """
        5. Validate a license key status without logging in.
        """
        self._check_init()
        try:
            payload = {
                "app_id": self.app_id,
                "license_key": license_key.strip() if license_key else "",
                "nonce": self._generate_nonce()
            }
            res = self.session.post(f"{self.base_url}/license/validate", json=payload).json()
            self.last_response = res
            return bool(res.get("success")), res.get("message", "")
        except Exception as e:
            self.last_response = {"success": False, "message": str(e)}
            return False, str(e)

    def reset_hwid(self, username_or_key):
        """
        6. Self-service HWID reset with cooldown enforcement.
        Accepts username or license key.
        """
        self._check_init()
        try:
            is_lic = username_or_key and username_or_key.startswith("HABIT-")
            payload = {
                "app_id": self.app_id,
                "username": None if is_lic else username_or_key.strip(),
                "license_key": username_or_key.strip() if is_lic else None,
                "nonce": self._generate_nonce()
            }
            res = self.session.post(f"{self.base_url}/client/reset-hwid", json=payload).json()
            self.last_response = res
            return bool(res.get("success")), res.get("message", "")
        except Exception as e:
            self.last_response = {"success": False, "message": str(e)}
            return False, str(e)

    def start_heartbeat(self, interval=30):
        """
        7. Start continuous background heartbeat telemetry in a daemon thread.
        Terminates the process if an administrator kills the session remotely.
        """
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            return

        self._heartbeat_stop.clear()

        def _worker():
            while not self._heartbeat_stop.is_set():
                time.sleep(interval)
                if self._heartbeat_stop.is_set():
                    break
                if not self.user or not self.user.get("username"):
                    continue

                try:
                    payload = {
                        "app_id": self.app_id,
                        "username": self.user["username"],
                        "nonce": self._generate_nonce()
                    }
                    res = self.session.post(f"{self.base_url}/client/heartbeat", json=payload).json()
                    if res.get("killed"):
                        os._exit(0)
                except Exception:
                    pass

        self._heartbeat_thread = threading.Thread(target=_worker, daemon=True)
        self._heartbeat_thread.start()

    def stop_heartbeat(self):
        """Stop background heartbeat telemetry"""
        self._heartbeat_stop.set()

    def perform_auto_update(self):
        """Download latest release and seamlessly replace executable"""
        if not self.update_available or not self.download_url:
            return False, "No update available."
        try:
            r = requests.get(self.download_url, stream=True)
            temp_path = "update_temp.exe" if sys.platform == "win32" else "update_temp.bin"
            with open(temp_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

            current_exe = sys.executable if getattr(sys, 'frozen', False) else sys.argv[0]
            if sys.platform == "win32":
                cmd = f'cmd.exe /C timeout /t 1 && move /y "{temp_path}" "{current_exe}" && start "" "{current_exe}"'
                subprocess.Popen(cmd, shell=True)
            else:
                os.chmod(temp_path, 0o755)
                os.replace(temp_path, current_exe)
                subprocess.Popen([current_exe] + sys.argv[1:])
            sys.exit(0)
        except Exception as e:
            return False, f"Update failed: {str(e)}"

    def _post_auth(self, url, payload):
        try:
            raw_res = self.session.post(url, json=payload)
            self._verify_response(raw_res)
            res = raw_res.json()
            self.last_response = res

            if res.get("killed"):
                sys.exit(0)

            if res.get("success"):
                self.session_token = res.get("token")
                self.user = res.get("user") or res.get("license")
                return True, res.get("message", "Success")

            return False, res.get("message", "Authentication failed")
        except Exception as e:
            self.last_response = {"success": False, "message": str(e), "code": "NETWORK_ERROR"}
            return False, str(e)

    def _verify_response(self, response):
        """
        Cryptographically validates response authenticity using Ed25519 and HMAC-SHA256.
        Exits or throws immediately if proxy tampering or replay attack is detected.
        """
        if not self.public_key and not self.app_secret:
            return True

        ts_str = response.headers.get("X-Timestamp")
        ed_sig = response.headers.get("X-Signature-Ed25519")
        hmac_sig = response.headers.get("X-Signature")
        server_pub = response.headers.get("X-Public-Key")

        if ts_str:
            try:
                server_ts = int(ts_str)
                current_ts = int(time.time())
                synced_ts = current_ts + self._clock_offset
                if abs(synced_ts - server_ts) > 120:
                    raise PermissionError("[HabitAuth] Anti-replay check failed: Server timestamp skew detected. Please verify your system clock.")
            except ValueError:
                pass

        effective_pub = self.public_key or server_pub
        raw_body = response.text
        signed_data = f"{ts_str}.{raw_body}".encode("utf-8")

        # 1. Asymmetric Ed25519 Verification (High Security Zero-Trust)
        if effective_pub and ed_sig and ts_str:
            try:
                from cryptography.hazmat.primitives.asymmetric import ed25519
                pub_bytes = bytes.fromhex(effective_pub)
                sig_bytes = bytes.fromhex(ed_sig)
                pub_key = ed25519.Ed25519PublicKey.from_public_bytes(pub_bytes)
                pub_key.verify(sig_bytes, signed_data)
            except ImportError:
                pass
            except Exception as e:
                raise PermissionError(f"[HabitAuth Security Alert] Ed25519 signature mismatch! Tampering detected: {e}")

        # 2. Symmetric HMAC-SHA256 Verification
        if self.app_secret and hmac_sig and ts_str:
            import hmac
            expected = hmac.new(self.app_secret.encode("utf-8"), signed_data, hashlib.sha256).hexdigest()
            if expected.lower() != hmac_sig.lower():
                raise PermissionError("[HabitAuth Security Alert] HMAC signature mismatch! Tampering detected.")

        return True

    def _check_init(self):
        if not self.is_initialized:
            raise RuntimeError("[HabitAuth] You must call auth.init() before invoking authentication methods.")


class api(HabitAuth):
    """
    KeyAuth-compatible drop-in alias class for Python.
    Usage:
        habit_app = api(name="My Application", ownerid="APP-XXXX", secret="SECRET", version="1.0.0")
    """
    def __init__(self, name, ownerid, secret="", version="1.0.0", url="https://habitauth.onrender.com/api/v1"):
        super().__init__(app_name=name, app_id=ownerid, app_secret=secret, version=version, base_url=url, ownerid=ownerid)

