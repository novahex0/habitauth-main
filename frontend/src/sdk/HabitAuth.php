<?php
/**
 * HabitAuth Official PHP Client SDK
 * Zero-Trust Software Authentication, Hardware Locking & Cryptographic Verification
 */

namespace HabitAuth;

class HabitAuth {
    public $appName;
    public $appId;
    public $appSecret;
    public $version;
    public $baseUrl;

    public $isInitialized = false;
    public $response;
    public $user_data;
    public $app;

    public function __construct($name = "HabitApp", $ownerid = "", $secret = "", $version = "1.0", $url = "https://habitauth.com/api/v1") {
        $this->appName = $name;
        $this->appId = $ownerid;
        $this->appSecret = $secret;
        $this->version = $version;
        $this->baseUrl = rtrim($url, '/');

        $this->response = (object)[
            'success' => false,
            'message' => '',
            'code' => ''
        ];

        $this->user_data = (object)[
            'username' => '',
            'expires_at' => '',
            'hwid' => '',
            'ip' => ''
        ];

        $this->app = (object)[
            'name' => $this->appName,
            'version' => $this->version
        ];
    }

    public function getHWID() {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $raw = getenv('COMPUTERNAME') . '_' . getenv('USERNAME') . '_' . php_uname();
        } else {
            $raw = php_uname();
        }
        return hash('sha256', $raw);
    }

    public function init($token = null) {
        $payload = [
            'app_id' => $this->appId,
            'app_name' => $this->appName,
            'nonce' => bin2hex(random_bytes(16)),
            'client_version' => $this->version,
            'app_secret' => $this->appSecret
        ];

        if ($token) $payload['token'] = $token;

        $res = $this->post('/auth/client-init', $payload);
        if ($res && !empty($res['success'])) {
            $this->isInitialized = true;
            $this->response = (object)[
                'success' => true,
                'message' => $res['message'] ?? 'Handshake initialized successfully.',
                'code' => 'INIT_SUCCESS'
            ];
            return true;
        }

        $this->response = (object)[
            'success' => false,
            'message' => $res['message'] ?? 'Failed to initialize HabitAuth handshake.',
            'code' => $res['code'] ?? 'INIT_FAILED'
        ];
        return false;
    }

    public function login($username, $password) {
        if (!$this->isInitialized) {
            $this->response = (object)[
                'success' => false,
                'message' => 'HabitAuth must be initialized before calling login(). Call init() first.',
                'code' => 'NOT_INITIALIZED'
            ];
            return false;
        }

        $payload = [
            'app_id' => $this->appId,
            'username' => trim($username),
            'password' => $password,
            'hwid' => $this->getHWID(),
            'nonce' => bin2hex(random_bytes(16)),
            'client_version' => $this->version,
            'app_secret' => $this->appSecret
        ];

        $res = $this->post('/auth/client-login', $payload);
        if ($res && !empty($res['success'])) {
            $this->response = (object)[
                'success' => true,
                'message' => $res['message'] ?? 'Login successful.',
                'code' => 'LOGIN_SUCCESS'
            ];
            if (!empty($res['user'])) {
                $this->user_data = (object)[
                    'username' => $res['user']['username'] ?? '',
                    'expires_at' => $res['user']['expires_at'] ?? 'Lifetime',
                    'hwid' => $res['user']['hwid'] ?? '',
                    'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
                ];
            }
            return true;
        }

        $this->response = (object)[
            'success' => false,
            'message' => $res['message'] ?? 'Login failed.',
            'code' => $res['code'] ?? 'LOGIN_FAILED'
        ];
        return false;
    }

    public function register($username, $password, $licenseKey) {
        if (!$this->isInitialized) {
            $this->response = (object)[
                'success' => false,
                'message' => 'HabitAuth must be initialized before calling register(). Call init() first.',
                'code' => 'NOT_INITIALIZED'
            ];
            return false;
        }

        $payload = [
            'app_id' => $this->appId,
            'username' => trim($username),
            'password' => $password,
            'license_key' => trim($licenseKey),
            'hwid' => $this->getHWID(),
            'nonce' => bin2hex(random_bytes(16)),
            'client_version' => $this->version,
            'app_secret' => $this->appSecret
        ];

        $res = $this->post('/client/register', $payload);
        if ($res && !empty($res['success'])) {
            $this->response = (object)[
                'success' => true,
                'message' => $res['message'] ?? 'User registered successfully!',
                'code' => 'REGISTER_SUCCESS'
            ];
            return true;
        }

        $this->response = (object)[
            'success' => false,
            'message' => $res['message'] ?? 'Registration failed.',
            'code' => $res['code'] ?? 'REGISTER_FAILED'
        ];
        return false;
    }

    private function post($endpoint, $data) {
        $ch = curl_init($this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'User-Agent: HabitAuth-PHP-SDK/' . $this->version
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $result = curl_exec($ch);
        curl_close($ch);
        return json_decode($result, true);
    }
}

class api extends HabitAuth {}
