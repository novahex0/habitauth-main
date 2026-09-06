using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace HabitAuth.Example;

public class HabitAuthClient
{
    private readonly string _appId;
    private readonly string _baseUrl;
    private readonly HttpClient _http;
    private string? _hwid;

    public HabitAuthClient(string appId, string baseUrl = "http://localhost:5000/api/v1")
    {
        _appId = appId;
        _baseUrl = baseUrl.TrimEnd('/');
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
    }

    /// <summary>
    /// Generates or retrieves unique SHA-256 machine hardware profile fingerprint
    /// </summary>
    public string GetHardwareId()
    {
        if (!string.IsNullOrEmpty(_hwid)) return _hwid;

        try
        {
            var rawIdentity = $"{Environment.MachineName}-{Environment.UserName}-{Environment.ProcessorCount}-{Environment.OSVersion}";
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(rawIdentity));
            _hwid = Convert.ToHexString(bytes).ToLowerInvariant();
        }
        catch
        {
            _hwid = "fallback-hwid-" + Guid.NewGuid().ToString("N");
        }

        return _hwid;
    }

    /// <summary>
    /// Verifies connectivity and retrieves application information
    /// </summary>
    public async Task<bool> InitializeAsync()
    {
        try
        {
            var response = await _http.GetAsync($"{_baseUrl}/app/info/{_appId}");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Authenticates end-user with password and binds to machine hardware fingerprint
    /// </summary>
    public async Task<AuthResult> LoginAsync(string username, string password)
    {
        try
        {
            var payload = new
            {
                app_id = _appId,
                username = username.Trim(),
                password = password,
                hwid = GetHardwareId(),
                sid = "SID-" + Environment.UserName
            };

            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync($"{_baseUrl}/auth/client-login", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            bool success = root.TryGetProperty("success", out var s) && s.GetBoolean();
            string message = root.TryGetProperty("message", out var m) ? m.GetString() ?? "" : "";
            string code = root.TryGetProperty("code", out var c) ? c.GetString() ?? "" : "";

            if (success)
            {
                var token = root.GetProperty("token").GetString() ?? "";
                var userElem = root.GetProperty("user");
                return new AuthResult(
                    Success: true,
                    Message: message,
                    Code: "SUCCESS",
                    Token: token,
                    Username: userElem.GetProperty("username").GetString() ?? username,
                    ExpiresAt: userElem.GetProperty("expires_at").GetString() ?? "Lifetime",
                    RemainingHours: 0
                );
            }

            int remainingHours = 0;
            if (root.TryGetProperty("remaining_hours", out var rh))
            {
                remainingHours = rh.GetInt32();
            }

            return new AuthResult(
                Success: false,
                Message: message,
                Code: code,
                Token: null,
                Username: null,
                ExpiresAt: null,
                RemainingHours: remainingHours
            );
        }
        catch (Exception ex)
        {
            return new AuthResult(false, "Connection error: " + ex.Message, "NETWORK_ERROR", null, null, null, 0);
        }
    }

    /// <summary>
    /// Validates an existing software license key
    /// </summary>
    public async Task<LicenseValidationResult> ValidateLicenseAsync(string licenseKey)
    {
        try
        {
            var payload = new
            {
                app_id = _appId,
                license_key = licenseKey.Trim(),
                hwid = GetHardwareId()
            };

            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync($"{_baseUrl}/license/validate", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            bool success = root.TryGetProperty("success", out var s) && s.GetBoolean();
            string message = root.TryGetProperty("message", out var m) ? m.GetString() ?? "" : "";

            if (success && root.TryGetProperty("license", out var licElem))
            {
                return new LicenseValidationResult(
                    Valid: true,
                    Status: licElem.GetProperty("status").GetString() ?? "active",
                    ExpiresAt: licElem.GetProperty("expires_at").GetString() ?? "Lifetime",
                    Message: message
                );
            }

            return new LicenseValidationResult(false, "invalid", null, message);
        }
        catch (Exception ex)
        {
            return new LicenseValidationResult(false, "error", null, ex.Message);
        }
    }
}

public record AuthResult(
    bool Success,
    string Message,
    string Code,
    string? Token,
    string? Username,
    string? ExpiresAt,
    int RemainingHours
);

public record LicenseValidationResult(
    bool Valid,
    string Status,
    string? ExpiresAt,
    string Message
);
