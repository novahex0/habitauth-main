// Package habitauth provides official client bindings for HabitAuth enterprise licensing platform.
package habitauth

import (
	"bytes"
	"crypto/ed25519"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type UserData struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	LicenseKey string `json:"license"`
	HWID       string `json:"hwid"`
	ExpiresAt  string `json:"expires_at"`
	IsLifetime bool   `json:"is_lifetime"`
}

type AppData struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	Status  string `json:"status"`
}

type ResponseData struct {
	Success               bool   `json:"success"`
	Message               string `json:"message"`
	Code                  string `json:"code"`
	RemainingLockoutHours int    `json:"remaining_hours"`
	DaysRemaining         int    `json:"days_remaining"`
}

type Client struct {
	AppName    string
	AppID      string
	AppSecret  string
	PublicKey  string
	Version    string
	BaseURL    string

	IsInitialized       bool
	IsMaintenanceActive bool
	UpdateAvailable     bool
	DownloadURL         string
	SessionToken        string
	SessionNonce        string

	User         *UserData
	App          *AppData
	LastResponse ResponseData

	httpClient *http.Client
}

// NewClient creates a new HabitAuth client instance.
func NewClient(appName, appID, appSecret, publicKey, version, baseURL string) *Client {
	if version == "" {
		version = "1.0.0"
	}
	if baseURL == "" {
		baseURL = "https://habitauth.com/api/v1"
	}
	return &Client{
		AppName:    appName,
		AppID:      appID,
		AppSecret:  appSecret,
		PublicKey:  publicKey,
		Version:    version,
		BaseURL:    strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

// Init initializes the cryptographic handshake with the HabitAuth server.
func (c *Client) Init(token string) (bool, error) {
	initNonce := fmt.Sprintf("%x", time.Now().UnixNano())
	payload := map[string]interface{}{
		"app_id":         c.AppID,
		"nonce":          initNonce,
		"client_version": c.Version,
	}
	if token != "" {
		payload["token"] = strings.TrimSpace(token)
	}

	body, err := c.postJSON("/auth/client-init", payload)
	if err != nil {
		c.LastResponse = ResponseData{Success: false, Message: err.Error(), Code: "NETWORK_ERROR"}
		return false, err
	}

	var res struct {
		Success      bool    `json:"success"`
		Message      string  `json:"message"`
		Code         string  `json:"code"`
		SessionNonce string  `json:"session_nonce"`
		Maintenance  bool    `json:"maintenance"`
		ForceUpdate  bool    `json:"force_update"`
		DownloadURL  string  `json:"download_url"`
		App          AppData `json:"app"`
	}
	if err := json.Unmarshal(body, &res); err != nil {
		return false, err
	}

	c.LastResponse = ResponseData{Success: res.Success, Message: res.Message, Code: res.Code}
	if !res.Success {
		return false, errors.New(res.Message)
	}

	c.SessionNonce = res.SessionNonce
	c.IsMaintenanceActive = res.Maintenance
	c.UpdateAvailable = res.ForceUpdate
	c.DownloadURL = res.DownloadURL
	c.App = &res.App
	c.IsInitialized = true

	return true, nil
}

// Login authenticates an existing user account with machine HWID binding.
func (c *Client) Login(username, password string) (bool, error) {
	c.checkInit()
	payload := map[string]interface{}{
		"app_id":   c.AppID,
		"username": strings.TrimSpace(username),
		"password": password,
		"hwid":     c.GetHWID(),
		"nonce":    fmt.Sprintf("%x", time.Now().UnixNano()),
	}
	return c.postAuth("/auth/client-login", payload)
}

// Register creates a new user account bound to a license key and local HWID.
func (c *Client) Register(username, password, licenseKey string) (bool, error) {
	c.checkInit()
	payload := map[string]interface{}{
		"app_id":      c.AppID,
		"username":    strings.TrimSpace(username),
		"password":    password,
		"license_key": strings.TrimSpace(licenseKey),
		"hwid":        c.GetHWID(),
		"nonce":       fmt.Sprintf("%x", time.Now().UnixNano()),
	}
	return c.postAuth("/auth/client-register", payload)
}

// License performs 1-Key instant authentication.
func (c *Client) License(licenseKey string) (bool, error) {
	c.checkInit()
	payload := map[string]interface{}{
		"app_id":      c.AppID,
		"license_key": strings.TrimSpace(licenseKey),
		"hwid":        c.GetHWID(),
		"nonce":       fmt.Sprintf("%x", time.Now().UnixNano()),
	}
	return c.postAuth("/auth/client-license", payload)
}

// ValidateLicense checks the status and duration of a license without consuming it.
func (c *Client) ValidateLicense(licenseKey string) (bool, error) {
	c.checkInit()
	payload := map[string]interface{}{
		"app_id":      c.AppID,
		"license_key": strings.TrimSpace(licenseKey),
		"nonce":       fmt.Sprintf("%x", time.Now().UnixNano()),
	}
	body, err := c.postJSON("/license/validate", payload)
	if err != nil {
		return false, err
	}
	var res ResponseData
	_ = json.Unmarshal(body, &res)
	c.LastResponse = res
	return res.Success, nil
}

// ResetHWID performs self-service hardware profile unbinding with cooldown check.
func (c *Client) ResetHWID(usernameOrKey string) (bool, error) {
	c.checkInit()
	isLic := strings.HasPrefix(strings.ToUpper(usernameOrKey), "HABIT-")
	payload := map[string]interface{}{
		"app_id": c.AppID,
		"nonce":  fmt.Sprintf("%x", time.Now().UnixNano()),
	}
	if isLic {
		payload["license_key"] = strings.TrimSpace(usernameOrKey)
	} else {
		payload["username"] = strings.TrimSpace(usernameOrKey)
	}

	body, err := c.postJSON("/client/reset-hwid", payload)
	if err != nil {
		return false, err
	}
	var res ResponseData
	_ = json.Unmarshal(body, &res)
	c.LastResponse = res
	return res.Success, nil
}

// StartHeartbeat runs periodic background telemetry and terminates process if killed by admin.
func (c *Client) StartHeartbeat(intervalSeconds int) {
	if intervalSeconds <= 0 {
		intervalSeconds = 30
	}
	go func() {
		for {
			time.Sleep(time.Duration(intervalSeconds) * time.Second)
			if c.User == nil || c.User.Username == "" {
				continue
			}
			payload := map[string]interface{}{
				"app_id":   c.AppID,
				"username": c.User.Username,
				"nonce":    fmt.Sprintf("%x", time.Now().UnixNano()),
			}
			body, err := c.postJSON("/client/heartbeat", payload)
			if err != nil {
				continue
			}
			var res struct {
				Killed bool `json:"killed"`
			}
			if json.Unmarshal(body, &res) == nil && res.Killed {
				os.Exit(0)
			}
		}
	}()
}

// GetHWID returns SHA-256 fingerprint over OS and machine attributes.
func (c *Client) GetHWID() string {
	hostname, _ := os.Hostname()
	raw := fmt.Sprintf("%s_%s_%s_%d", hostname, runtime.GOOS, runtime.GOARCH, runtime.NumCPU())
	hash := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(hash[:])
}

func (c *Client) checkInit() {
	if !c.IsInitialized {
		panic("[HabitAuth] Call client.Init() before authentication methods.")
	}
}

func (c *Client) postJSON(endpoint string, payload interface{}) ([]byte, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest("POST", c.BaseURL+endpoint, bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", fmt.Sprintf("HabitAuth-Go-SDK/%s", c.Version))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// 1. Verify Asymmetric Ed25519 signature if PublicKey is configured
	pubKeyHex := c.PublicKey
	if pubKeyHex == "" {
		pubKeyHex = resp.Header.Get("X-Public-Key")
	}
	edSigHex := resp.Header.Get("X-Signature-Ed25519")
	tsStr := resp.Header.Get("X-Timestamp")

	if pubKeyHex != "" && edSigHex != "" && tsStr != "" {
		ts, err := strconv.ParseInt(tsStr, 10, 64)
		if err != nil || math.Abs(float64(time.Now().Unix()-ts)) > 30 {
			os.Exit(0) // Replay attack detected
		}
		pubBytes, err1 := hex.DecodeString(pubKeyHex)
		sigBytes, err2 := hex.DecodeString(edSigHex)
		if err1 == nil && err2 == nil && len(pubBytes) == 32 && len(sigBytes) == 64 {
			msg := []byte(fmt.Sprintf("%s.%s", tsStr, string(body)))
			if !ed25519.Verify(pubBytes, msg, sigBytes) {
				os.Exit(0) // Ed25519 cryptographic tampering detected
			}
		}
	}

	// 2. Verify HMAC-SHA256 signature if AppSecret is configured
	if c.AppSecret != "" {
		sig := resp.Header.Get("X-Signature")
		if sig == "" || tsStr == "" {
			os.Exit(0) // Signature missing
		}
		ts, err := strconv.ParseInt(tsStr, 10, 64)
		if err != nil || math.Abs(float64(time.Now().Unix()-ts)) > 30 {
			os.Exit(0) // Replay attack
		}
		mac := hmac.New(sha256.New, []byte(c.AppSecret))
		mac.Write([]byte(fmt.Sprintf("%s.%s", tsStr, string(body))))
		expected := hex.EncodeToString(mac.Sum(nil))
		if !hmac.Equal([]byte(strings.ToLower(sig)), []byte(strings.ToLower(expected))) {
			os.Exit(0) // Tampering detected
		}
	}

	return body, nil
}

func (c *Client) postAuth(endpoint string, payload interface{}) (bool, error) {
	body, err := c.postJSON(endpoint, payload)
	if err != nil {
		c.LastResponse = ResponseData{Success: false, Message: err.Error(), Code: "NETWORK_ERROR"}
		return false, err
	}

	var res struct {
		Success        bool     `json:"success"`
		Message        string   `json:"message"`
		Code           string   `json:"code"`
		RemainingHours int      `json:"remaining_hours"`
		Token          string   `json:"token"`
		User           UserData `json:"user"`
	}
	if err := json.Unmarshal(body, &res); err != nil {
		return false, err
	}

	c.LastResponse = ResponseData{
		Success:               res.Success,
		Message:               res.Message,
		Code:                  res.Code,
		RemainingLockoutHours: res.RemainingHours,
	}

	if !res.Success {
		return false, errors.New(res.Message)
	}

	c.SessionToken = res.Token
	c.User = &res.User
	c.User.IsLifetime = strings.Contains(strings.ToLower(c.User.ExpiresAt), "lifetime")
	return true, nil
}
