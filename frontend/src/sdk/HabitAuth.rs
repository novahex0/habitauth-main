//! HabitAuth Official Rust Client SDK (v2.4)
//! Memory-safe, high-performance authentication client for Rust binaries and game loaders.
//! Requires `reqwest` (or `ureq`) and `serde`, `serde_json`, `sha2`.

use std::error::Error;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserData {
    pub id: String,
    pub username: String,
    pub license: Option<String>,
    pub hwid: Option<String>,
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppData {
    pub name: String,
    pub version: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ResponseData {
    pub success: bool,
    pub message: Option<String>,
    pub code: Option<String>,
    pub remaining_hours: Option<i32>,
    pub days_remaining: Option<i32>,
}

pub struct HabitAuth {
    pub app_name: String,
    pub app_id: String,
    pub app_secret: String,
    pub public_key: String,
    pub version: String,
    pub base_url: String,

    pub is_initialized: bool,
    pub is_maintenance: bool,
    pub update_available: bool,
    pub download_url: String,
    pub session_token: Option<String>,
    pub session_nonce: Option<String>,

    pub user: Option<UserData>,
    pub app: Option<AppData>,
    pub last_response: ResponseData,
    client: reqwest::blocking::Client,
}

impl HabitAuth {
    pub fn new(app_name: &str, app_id: &str, app_secret: &str, public_key: &str, version: &str, base_url: &str) -> Self {
        let clean_base = base_url.trim_end_matches('/').to_string();
        Self {
            app_name: app_name.to_string(),
            app_id: app_id.to_string(),
            app_secret: app_secret.to_string(),
            public_key: public_key.to_string(),
            version: version.to_string(),
            base_url: clean_base,
            is_initialized: false,
            is_maintenance: false,
            update_available: false,
            download_url: String::new(),
            session_token: None,
            session_nonce: None,
            user: None,
            app: None,
            last_response: ResponseData::default(),
            client: reqwest::blocking::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .user_agent(format!("HabitAuth-Rust-SDK/{}", version))
                .build()
                .unwrap_or_default(),
        }
    }

    /// 1. Initialize session with HabitAuth server
    pub fn init(&mut self, token: Option<&str>) -> Result<bool, Box<dyn Error>> {
        let nonce = format!("{:x}", SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos());
        let payload = serde_json::json!({
            "app_id": self.app_id,
            "nonce": nonce,
            "client_version": self.version,
            "token": token
        });

        let res = self.client.post(format!("{}/auth/client-init", self.base_url))
            .json(&payload)
            .send()?
            .json::<serde_json::Value>()?;

        let success = res["success"].as_bool().unwrap_or(false);
        let msg = res["message"].as_str().map(String::from);
        let code = res["code"].as_str().map(String::from);

        self.last_response = ResponseData { success, message: msg, code, ..Default::default() };

        if !success {
            return Ok(false);
        }

        self.session_nonce = res["session_nonce"].as_str().map(String::from);
        self.is_maintenance = res["maintenance"].as_bool().unwrap_or(false);
        self.update_available = res["force_update"].as_bool().unwrap_or(false);
        self.download_url = res["download_url"].as_str().unwrap_or("").to_string();

        if let Some(app_obj) = res.get("app") {
            self.app = Some(AppData {
                name: app_obj["name"].as_str().unwrap_or(&self.app_name).to_string(),
                version: app_obj["version"].as_str().unwrap_or(&self.version).to_string(),
                status: app_obj["status"].as_str().unwrap_or("active").to_string(),
            });
        }

        self.is_initialized = true;
        Ok(true)
    }

    /// 2. Login with username and password
    pub fn login(&mut self, username: &str, password: &str) -> Result<bool, Box<dyn Error>> {
        self.check_init();
        let payload = serde_json::json!({
            "app_id": self.app_id,
            "username": username.trim(),
            "password": password,
            "hwid": self.get_hwid(),
            "nonce": format!("{:x}", SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos())
        });
        self.post_auth("/auth/client-login", payload)
    }

    /// 3. Register a new user with a valid license key
    pub fn register(&mut self, username: &str, password: &str, license_key: &str) -> Result<bool, Box<dyn Error>> {
        self.check_init();
        let payload = serde_json::json!({
            "app_id": self.app_id,
            "username": username.trim(),
            "password": password,
            "license_key": license_key.trim(),
            "hwid": self.get_hwid(),
            "nonce": format!("{:x}", SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos())
        });
        self.post_auth("/auth/client-register", payload)
    }

    /// 4. Instant 1-Key License Login
    pub fn license(&mut self, license_key: &str) -> Result<bool, Box<dyn Error>> {
        self.check_init();
        let payload = serde_json::json!({
            "app_id": self.app_id,
            "license_key": license_key.trim(),
            "hwid": self.get_hwid(),
            "nonce": format!("{:x}", SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos())
        });
        self.post_auth("/auth/client-license", payload)
    }

    /// 5. Validate license key status without login
    pub fn validate_license(&self, license_key: &str) -> Result<bool, Box<dyn Error>> {
        self.check_init();
        let payload = serde_json::json!({
            "app_id": self.app_id,
            "license_key": license_key.trim(),
            "nonce": format!("{:x}", SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos())
        });
        let res = self.client.post(format!("{}/license/validate", self.base_url))
            .json(&payload)
            .send()?
            .json::<serde_json::Value>()?;
        Ok(res["success"].as_bool().unwrap_or(false))
    }

    /// 6. Self-service HWID reset with cooldown enforcement
    pub fn reset_hwid(&self, username_or_key: &str) -> Result<bool, Box<dyn Error>> {
        self.check_init();
        let is_lic = username_or_key.to_uppercase().starts_with("HABIT-");
        let mut payload = serde_json::json!({
            "app_id": self.app_id,
            "nonce": format!("{:x}", SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos())
        });
        if is_lic {
            payload["license_key"] = serde_json::json!(username_or_key.trim());
        } else {
            payload["username"] = serde_json::json!(username_or_key.trim());
        }

        let res = self.client.post(format!("{}/client/reset-hwid", self.base_url))
            .json(&payload)
            .send()?
            .json::<serde_json::Value>()?;
        Ok(res["success"].as_bool().unwrap_or(false))
    }

    /// 7. Machine hardware fingerprint
    pub fn get_hwid(&self) -> String {
        let host = whoami::fallible::hostname().unwrap_or_else(|_| "localhost".into());
        let user = whoami::fallible::username().unwrap_or_else(|_| "user".into());
        let raw = format!("{}_{}_{}", host, user, std::env::consts::OS);
        format!("{:x}", md5::compute(raw))
    }

    fn check_init(&self) {
        if !self.is_initialized {
            panic!("[HabitAuth] Call auth.init() before invoking authentication methods.");
        }
    }

    fn post_auth(&mut self, endpoint: &str, payload: serde_json::Value) -> Result<bool, Box<dyn Error>> {
        let res = self.client.post(format!("{}{}", self.base_url, endpoint))
            .json(&payload)
            .send()?
            .json::<serde_json::Value>()?;

        let success = res["success"].as_bool().unwrap_or(false);
        let msg = res["message"].as_str().map(String::from);
        let code = res["code"].as_str().map(String::from);
        let rem_hours = res["remaining_hours"].as_i64().map(|h| h as i32);

        self.last_response = ResponseData {
            success,
            message: msg,
            code,
            remaining_hours: rem_hours,
            days_remaining: None,
        };

        if !success {
            return Ok(false);
        }

        self.session_token = res["token"].as_str().map(String::from);
        if let Some(user_obj) = res.get("user") {
            self.user = serde_json::from_value(user_obj.clone()).ok();
        } else if let Some(lic_obj) = res.get("license") {
            self.user = Some(UserData {
                id: String::new(),
                username: "LicenseUser".into(),
                license: lic_obj["key"].as_str().map(String::from),
                hwid: lic_obj["hwid"].as_str().map(String::from),
                expires_at: lic_obj["expires_at"].as_str().map(String::from),
            });
        }

        Ok(true)
    }
}
