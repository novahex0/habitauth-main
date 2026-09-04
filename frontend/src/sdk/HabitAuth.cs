using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HabitAuth
{
    /// <summary>
    /// HabitAuth Enterprise C# SDK (v2.5)
    /// Fully compatible with .NET Framework 4.5 / 4.6 / 4.7 / 4.8, .NET Core, .NET 5 / 6 / 7 / 8 / 9 / 10, Unity & Mono.
    /// Zero external NuGet dependencies required.
    /// Dual Ed25519 asymmetric signature & HMAC-SHA256 verification.
    /// </summary>
    public class HabitAuthApp
    {
        public string AppName { get; set; }
        public string AppId { get; set; }
        public string AppSecret { get; set; }
        public string PublicKey { get; set; }
        public string Version { get; set; }
        public string BaseUrl { get; set; }
        public string TokenPath { get; set; }

        public bool IsInitialized { get; set; }
        public bool IsMaintenanceActive { get; set; }
        public string MaintenanceMessage { get; set; }
        public bool UpdateAvailable { get; set; }
        public string DownloadUrl { get; set; }
        public string SessionToken { get; set; }
        public string SessionNonce { get; set; }

        public UserData User { get; set; }
        public AppData App { get; set; }
        public ResponseData LastResponse { get; set; }

        // KeyAuth-style and camelCase property aliases
        public UserData user_data { get { return User; } }
        public ResponseData response { get { return LastResponse; } }

        private readonly HttpClient _http;
        private Thread _heartbeatThread;
        private bool _heartbeatRunning;

        static HabitAuthApp()
        {
            try
            {
                // Ensure TLS 1.2 is enabled for older .NET Framework runtimes (4.5 / 4.7 / 4.8)
                ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
            }
            catch { }
        }

        public HabitAuthApp(
            string name = "HabitApp",
            string ownerid = "",
            string secret = "",
            string version = "1.0",
            string tokenPath = "",
            string publicKey = "",
            string baseUrl = "http://localhost:5000/api/v1")
        {
            AppName = name ?? "HabitApp";
            AppId = ownerid ?? "";
            AppSecret = secret ?? "";
            PublicKey = publicKey ?? "";
            Version = version ?? "1.0";
            TokenPath = tokenPath ?? "";
            BaseUrl = (baseUrl ?? "http://localhost:5000/api/v1").TrimEnd('/');

            User = new UserData();
            App = new AppData { Name = AppName, Version = Version, Status = "active" };
            LastResponse = new ResponseData();

            HttpClientHandler handler = new HttpClientHandler();
            _http = new HttpClient(handler);
            _http.Timeout = TimeSpan.FromSeconds(15);
            try
            {
                _http.DefaultRequestHeaders.Add("User-Agent", "HabitAuth-CSharp-SDK/" + Version);
            }
            catch { }
        }

        #region Data Models
        public class UserData
        {
            public string Id { get; set; }
            public string Username { get; set; }
            public string LicenseKey { get; set; }
            public string Hwid { get; set; }
            public string ExpiresAt { get; set; }
            public bool IsLifetime { get; set; }
            public string Ip { get; set; }

            // Aliases for compatibility
            public string id { get { return Id; } set { Id = value; } }
            public string username { get { return Username; } set { Username = value; } }
            public string license { get { return LicenseKey; } set { LicenseKey = value; } }
            public string hwid { get { return Hwid; } set { Hwid = value; } }
            public string expires { get { return ExpiresAt; } set { ExpiresAt = value; } }
            public string expires_at { get { return ExpiresAt; } set { ExpiresAt = value; } }
            public bool is_lifetime { get { return IsLifetime; } set { IsLifetime = value; } }
            public string ip { get { return Ip; } set { Ip = value; } }

            public UserData()
            {
                Id = "";
                Username = "";
                LicenseKey = "";
                Hwid = "";
                ExpiresAt = "";
                Ip = "";
            }
        }

        public class AppData
        {
            public string Name { get; set; }
            public string Version { get; set; }
            public string Status { get; set; }

            public string name { get { return Name; } set { Name = value; } }
            public string version { get { return Version; } set { Version = value; } }
            public string status { get { return Status; } set { Status = value; } }

            public AppData()
            {
                Name = "";
                Version = "1.0";
                Status = "active";
            }
        }

        public class ResponseData
        {
            public bool Success { get; set; }
            public string Message { get; set; }
            public string ErrorCode { get; set; }
            public int RemainingLockoutHours { get; set; }
            public int DaysRemaining { get; set; }

            public bool success { get { return Success; } set { Success = value; } }
            public string message { get { return Message; } set { Message = value; } }
            public string code { get { return ErrorCode; } set { ErrorCode = value; } }
            public string error_code { get { return ErrorCode; } set { ErrorCode = value; } }
            public int remaining_hours { get { return RemainingLockoutHours; } set { RemainingLockoutHours = value; } }
            public int days_remaining { get { return DaysRemaining; } set { DaysRemaining = value; } }

            public ResponseData()
            {
                Success = false;
                Message = "";
                ErrorCode = "";
            }
        }
        #endregion

        #region Proactive Anti-Debugging & Security
        public static void CheckEnvironment()
        {
            try
            {
                if (Debugger.IsAttached)
                {
                    Environment.Exit(0);
                }
            }
            catch { }
        }
        #endregion

        #region Core Authentication Methods (Sync & Async Overloads)

        /// <summary>
        /// 1. Initialize session with HabitAuth server (Synchronous for WinForms/WPF constructors)
        /// </summary>
        public bool init(string token = null)
        {
            return Init(token);
        }

        public bool Init(string token = null)
        {
            return Task.Run(async () => await InitAsync(token)).ConfigureAwait(false).GetAwaiter().GetResult();
        }

        public async Task<bool> InitAsync(string token = null)
        {
            try
            {
                CheckEnvironment();

                string startupToken = token;
                if (string.IsNullOrEmpty(startupToken) && !string.IsNullOrEmpty(TokenPath) && File.Exists(TokenPath))
                {
                    try { startupToken = File.ReadAllText(TokenPath).Trim(); } catch { }
                }

                string initNonce = Guid.NewGuid().ToString("N");
                Dictionary<string, object> payload = new Dictionary<string, object>();
                payload["app_id"] = AppId;
                payload["nonce"] = initNonce;
                payload["client_version"] = Version;
                if (!string.IsNullOrEmpty(startupToken)) payload["token"] = startupToken;

                string jsonStr = JsonNode.Serialize(payload);
                StringContent content = new StringContent(jsonStr, Encoding.UTF8, "application/json");
                HttpResponseMessage response = await _http.PostAsync(BaseUrl + "/auth/client-init", content).ConfigureAwait(false);
                string rawBody = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (!VerifyResponse(response, rawBody))
                {
                    LastResponse = new ResponseData { Success = false, Message = "Cryptographic integrity failure! Tampering detected.", ErrorCode = "SIG_TAMPER_DETECTED" };
                    return false;
                }

                JsonNode root = JsonNode.Parse(rawBody);
                if (root.GetBool("killed"))
                {
                    Environment.Exit(0);
                }
                bool success = root.GetBool("success");
                if (!success)
                {
                    string errMsg = root.GetString("message", "Initialization failed.");
                    string code = root.GetString("code", "INIT_REJECTED");
                    LastResponse = new ResponseData { Success = false, Message = errMsg, ErrorCode = code };
                    return false;
                }

                SessionNonce = root.GetString("session_nonce", initNonce);
                string pk = root.GetString("public_key");
                if (string.IsNullOrEmpty(PublicKey) && !string.IsNullOrEmpty(pk))
                {
                    PublicKey = pk;
                }

                IsMaintenanceActive = root.GetBool("maintenance");
                UpdateAvailable = root.GetBool("force_update");
                DownloadUrl = root.GetString("download_url");

                JsonNode appObj = root.GetObject("app");
                if (appObj != null)
                {
                    App = new AppData
                    {
                        Name = appObj.GetString("name", AppName),
                        Version = appObj.GetString("version", Version),
                        Status = appObj.GetString("status", "active")
                    };
                }

                IsInitialized = true;
                LastResponse = new ResponseData { Success = true, Message = "Handshake initialized and cryptographically verified." };
                return true;
            }
            catch (Exception ex)
            {
                LastResponse = new ResponseData { Success = false, Message = ex.Message, ErrorCode = "INIT_EXCEPTION" };
                return false;
            }
        }

        /// <summary>
        /// 2. Authenticate existing user with username and password (Synchronous)
        /// </summary>
        public bool login(string username, string password)
        {
            return Login(username, password);
        }

        public bool Login(string username, string password)
        {
            return Task.Run(async () => await LoginAsync(username, password)).ConfigureAwait(false).GetAwaiter().GetResult();
        }

        public async Task<bool> LoginAsync(string username, string password)
        {
            CheckInit();
            string hwid = GetHWID();

            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["app_id"] = AppId;
            payload["username"] = username != null ? username.Trim() : "";
            payload["password"] = password;
            payload["hwid"] = hwid;
            payload["nonce"] = Guid.NewGuid().ToString("N");
            payload["client_version"] = Version;

            return await PostAuthRequestAsync(BaseUrl + "/auth/client-login", payload).ConfigureAwait(false);
        }

        /// <summary>
        /// 3. Register a new user account with a license key (Synchronous)
        /// </summary>
        public bool register(string username, string password, string licenseKey)
        {
            return Register(username, password, licenseKey);
        }

        public bool Register(string username, string password, string licenseKey)
        {
            return Task.Run(async () => await RegisterAsync(username, password, licenseKey)).ConfigureAwait(false).GetAwaiter().GetResult();
        }

        public async Task<bool> RegisterAsync(string username, string password, string licenseKey)
        {
            CheckInit();
            string hwid = GetHWID();

            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["app_id"] = AppId;
            payload["username"] = username != null ? username.Trim() : "";
            payload["password"] = password;
            payload["license_key"] = licenseKey != null ? licenseKey.Trim() : "";
            payload["hwid"] = hwid;
            payload["nonce"] = Guid.NewGuid().ToString("N");
            payload["client_version"] = Version;

            return await PostAuthRequestAsync(BaseUrl + "/client/register", payload).ConfigureAwait(false);
        }

        /// <summary>
        /// 4. 1-Key Direct License Login (Synchronous)
        /// </summary>
        public bool license(string licenseKey)
        {
            return License(licenseKey);
        }

        public bool License(string licenseKey)
        {
            return Task.Run(async () => await LicenseAsync(licenseKey)).ConfigureAwait(false).GetAwaiter().GetResult();
        }

        public async Task<bool> LicenseAsync(string licenseKey)
        {
            CheckInit();
            string hwid = GetHWID();

            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["app_id"] = AppId;
            payload["license_key"] = licenseKey != null ? licenseKey.Trim() : "";
            payload["hwid"] = hwid;
            payload["nonce"] = Guid.NewGuid().ToString("N");

            return await PostAuthRequestAsync(BaseUrl + "/client/license-login", payload).ConfigureAwait(false);
        }

        /// <summary>
        /// 5. Self-service HWID Reset with enforced cooldown (Synchronous)
        /// </summary>
        public bool reset_hwid(string username)
        {
            return ResetHWID(username);
        }

        public bool ResetHWID(string username)
        {
            return Task.Run(async () => await ResetHWIDAsync(username)).ConfigureAwait(false).GetAwaiter().GetResult();
        }

        public async Task<bool> ResetHWIDAsync(string username)
        {
            CheckInit();
            string hwid = GetHWID();

            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["app_id"] = AppId;
            payload["username"] = username != null ? username.Trim() : "";
            payload["hwid"] = hwid;
            payload["nonce"] = Guid.NewGuid().ToString("N");

            try
            {
                string jsonStr = JsonNode.Serialize(payload);
                StringContent content = new StringContent(jsonStr, Encoding.UTF8, "application/json");
                HttpResponseMessage response = await _http.PostAsync(BaseUrl + "/client/reset-hwid", content).ConfigureAwait(false);
                string rawBody = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (!VerifyResponse(response, rawBody)) return false;

                JsonNode root = JsonNode.Parse(rawBody);
                bool success = root.GetBool("success");
                string msg = root.GetString("message", "HWID reset failed.");
                string code = root.GetString("code");
                int remainingHours = root.GetInt("remaining_hours");

                LastResponse = new ResponseData
                {
                    Success = success,
                    Message = msg,
                    ErrorCode = code,
                    RemainingLockoutHours = remainingHours
                };
                return success;
            }
            catch (Exception ex)
            {
                LastResponse = new ResponseData { Success = false, Message = ex.Message, ErrorCode = "NETWORK_ERROR" };
                return false;
            }
        }

        /// <summary>
        /// 6. Background Heartbeat Telemetry (Every 30-60s)
        /// </summary>
        public void start_heartbeat(int intervalSeconds = 30)
        {
            StartHeartbeat(intervalSeconds);
        }

        public void StartHeartbeat(int intervalSeconds = 30)
        {
            if (_heartbeatRunning) return;
            _heartbeatRunning = true;

            _heartbeatThread = new Thread(new ThreadStart(delegate
            {
                while (_heartbeatRunning)
                {
                    Thread.Sleep(intervalSeconds * 1000);
                    if (!_heartbeatRunning) break;
                    if (User == null || string.IsNullOrEmpty(User.Username)) continue;

                    try
                    {
                        Dictionary<string, object> payload = new Dictionary<string, object>();
                        payload["app_id"] = AppId;
                        payload["username"] = User.Username;
                        payload["hwid"] = GetHWID();
                        payload["nonce"] = Guid.NewGuid().ToString("N");

                        string jsonStr = JsonNode.Serialize(payload);
                        StringContent content = new StringContent(jsonStr, Encoding.UTF8, "application/json");
                        HttpResponseMessage res = _http.PostAsync(BaseUrl + "/client/heartbeat", content).GetAwaiter().GetResult();
                        string raw = res.Content.ReadAsStringAsync().GetAwaiter().GetResult();

                        if (VerifyResponse(res, raw))
                        {
                            JsonNode doc = JsonNode.Parse(raw);
                            if (doc.GetBool("killed"))
                            {
                                Environment.Exit(0);
                            }
                        }
                    }
                    catch { }
                }
            }));
            _heartbeatThread.IsBackground = true;
            _heartbeatThread.Start();
        }

        public void stop_heartbeat()
        {
            StopHeartbeat();
        }

        public void StopHeartbeat()
        {
            _heartbeatRunning = false;
        }

        #endregion

        #region Helpers & Cryptography

        public static string GetHWID()
        {
            try
            {
                string raw = Environment.MachineName + "_" + Environment.UserName + "_" + Environment.ProcessorCount + "_" + Environment.OSVersion;
                using (SHA256 sha256 = SHA256.Create())
                {
                    byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(raw));
                    return ToHex(hashBytes);
                }
            }
            catch
            {
                return "UNKNOWN_HWID_FALLBACK";
            }
        }

        public static string ToHex(byte[] bytes)
        {
            if (bytes == null) return "";
            StringBuilder sb = new StringBuilder(bytes.Length * 2);
            for (int i = 0; i < bytes.Length; i++)
                sb.Append(bytes[i].ToString("x2"));
            return sb.ToString();
        }

        public static byte[] FromHex(string hex)
        {
            if (string.IsNullOrEmpty(hex)) return new byte[0];
            int len = hex.Length;
            byte[] raw = new byte[len / 2];
            for (int i = 0; i < len; i += 2)
                raw[i / 2] = Convert.ToByte(hex.Substring(i, 2), 16);
            return raw;
        }

        public static bool FixedTimeEquals(byte[] a, byte[] b)
        {
            if (a == null || b == null || a.Length != b.Length) return false;
            int diff = 0;
            for (int i = 0; i < a.Length; i++)
                diff |= a[i] ^ b[i];
            return diff == 0;
        }

        private bool VerifyResponse(HttpResponseMessage response, string rawContent)
        {
            if (string.IsNullOrEmpty(AppSecret) && string.IsNullOrEmpty(PublicKey)) return true;

            string tsStr = null;
            IEnumerable<string> tsVals;
            if (response.Headers.TryGetValues("X-Timestamp", out tsVals))
            {
                foreach (string val in tsVals) { tsStr = val; break; }
            }

            if (string.IsNullOrEmpty(tsStr))
            {
                LastResponse = new ResponseData { Success = false, Message = "Security violation: Missing server cryptographic timestamp.", ErrorCode = "SIGNATURE_MISSING" };
                Environment.Exit(0);
                return false;
            }

            long serverTimestamp;
            if (!long.TryParse(tsStr, out serverTimestamp))
            {
                Environment.Exit(0);
                return false;
            }

            long currentUnix = (long)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
            if (Math.Abs(currentUnix - serverTimestamp) > 30)
            {
                LastResponse = new ResponseData { Success = false, Message = "Replay attack detected: Expired response timestamp.", ErrorCode = "REPLAY_ATTACK" };
                Environment.Exit(0);
                return false;
            }

            // 1. Asymmetric Ed25519 Signature Verification
            string effectivePubKey = PublicKey;
            if (string.IsNullOrEmpty(effectivePubKey))
            {
                IEnumerable<string> pkVals;
                if (response.Headers.TryGetValues("X-Public-Key", out pkVals))
                {
                    foreach (string val in pkVals) { effectivePubKey = val; break; }
                }
            }

            string edSig = null;
            IEnumerable<string> edVals;
            if (response.Headers.TryGetValues("X-Signature-Ed25519", out edVals))
            {
                foreach (string val in edVals) { edSig = val; break; }
            }

            if (!string.IsNullOrEmpty(effectivePubKey) && !string.IsNullOrEmpty(edSig))
            {
                bool edValid = Ed25519.Verify(effectivePubKey, tsStr + "." + rawContent, edSig);
                if (!edValid)
                {
                    LastResponse = new ResponseData { Success = false, Message = "Security alert: Ed25519 cryptographic signature mismatch! Proxy tampering detected.", ErrorCode = "ED25519_TAMPER_DETECTED" };
                    Environment.Exit(0);
                    return false;
                }
            }

            // 2. Symmetric HMAC-SHA256 Signature Verification
            if (!string.IsNullOrEmpty(AppSecret))
            {
                string serverSig = null;
                IEnumerable<string> sigVals;
                if (response.Headers.TryGetValues("X-Signature", out sigVals))
                {
                    foreach (string val in sigVals) { serverSig = val; break; }
                }

                if (string.IsNullOrEmpty(serverSig))
                {
                    LastResponse = new ResponseData { Success = false, Message = "Security violation: Missing HMAC cryptographic signature.", ErrorCode = "SIGNATURE_MISSING" };
                    Environment.Exit(0);
                    return false;
                }

                using (HMACSHA256 hmac = new HMACSHA256(Encoding.UTF8.GetBytes(AppSecret)))
                {
                    byte[] computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(tsStr + "." + rawContent));
                    string expectedSig = ToHex(computedHash);

                    if (!FixedTimeEquals(Encoding.UTF8.GetBytes(expectedSig.ToLower()), Encoding.UTF8.GetBytes(serverSig.ToLower())))
                    {
                        LastResponse = new ResponseData { Success = false, Message = "Security alert: Response HMAC signature mismatch. Proxy tampering detected!", ErrorCode = "TAMPER_DETECTED" };
                        Environment.Exit(0);
                        return false;
                    }
                }
            }

            return true;
        }

        private async Task<bool> PostAuthRequestAsync(string url, Dictionary<string, object> payload)
        {
            try
            {
                CheckEnvironment();
                string jsonStr = JsonNode.Serialize(payload);
                StringContent content = new StringContent(jsonStr, Encoding.UTF8, "application/json");
                HttpResponseMessage response = await _http.PostAsync(url, content).ConfigureAwait(false);
                string responseBody = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (!VerifyResponse(response, responseBody)) return false;

                JsonNode root = JsonNode.Parse(responseBody);
                if (root.GetBool("killed"))
                {
                    Environment.Exit(0);
                }
                bool success = root.GetBool("success");
                string message = root.GetString("message", "Unknown error");
                string code = root.GetString("code");
                int remainingHours = root.GetInt("remaining_hours");

                LastResponse = new ResponseData
                {
                    Success = success,
                    Message = message,
                    ErrorCode = code,
                    RemainingLockoutHours = remainingHours
                };

                if (!success) return false;

                SessionToken = root.GetString("token");

                JsonNode usr = root.GetObject("user");
                if (usr != null)
                {
                    string exp = usr.GetString("expires_at");
                    User = new UserData
                    {
                        Id = usr.GetString("id"),
                        Username = usr.GetString("username"),
                        LicenseKey = usr.GetString("license"),
                        Hwid = usr.GetString("hwid"),
                        ExpiresAt = exp,
                        IsLifetime = exp != null && exp.IndexOf("lifetime", StringComparison.OrdinalIgnoreCase) >= 0
                    };
                }
                else
                {
                    JsonNode lic = root.GetObject("license");
                    if (lic != null)
                    {
                        string exp = lic.GetString("expires_at");
                        User = new UserData
                        {
                            Username = "LicenseUser",
                            LicenseKey = lic.GetString("key"),
                            Hwid = lic.GetString("hwid"),
                            ExpiresAt = exp,
                            IsLifetime = exp != null && exp.IndexOf("lifetime", StringComparison.OrdinalIgnoreCase) >= 0
                        };
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                LastResponse = new ResponseData { Success = false, Message = ex.Message, ErrorCode = "NETWORK_ERROR" };
                return false;
            }
        }

        private void CheckInit()
        {
            if (!IsInitialized)
            {
                throw new InvalidOperationException("HabitAuth must be initialized before calling authentication methods. Call HabitAuthApp.init() first.");
            }
        }

        #endregion
    }

    /// <summary>
    /// KeyAuth-compatible 'api' class alias.
    /// Allows developers to instantiate: public static api HabitAuthApp = new api(...);
    /// </summary>
    public class api : HabitAuthApp
    {
        public api(
            string name = "HabitApp",
            string ownerid = "",
            string secret = "",
            string version = "1.0",
            string tokenPath = "",
            string publicKey = "",
            string baseUrl = "http://localhost:5000/api/v1")
            : base(name, ownerid, secret, version, tokenPath, publicKey, baseUrl)
        {
        }
    }

    #region Zero-Dependency Lightweight JSON Parser (.NET 4.5+ Compatible)
    public class JsonNode
    {
        public Dictionary<string, JsonNode> Fields = new Dictionary<string, JsonNode>(StringComparer.OrdinalIgnoreCase);
        public string StringValue = "";
        public double NumberValue = 0;
        public bool BoolValue = false;
        public bool IsNull = false;
        public bool IsObject = false;

        public string GetString(string key, string def = "")
        {
            JsonNode n;
            return Fields.TryGetValue(key, out n) ? (n.StringValue ?? "") : def;
        }

        public bool GetBool(string key, bool def = false)
        {
            JsonNode n;
            return Fields.TryGetValue(key, out n) ? n.BoolValue : def;
        }

        public int GetInt(string key, int def = 0)
        {
            JsonNode n;
            return Fields.TryGetValue(key, out n) ? (int)n.NumberValue : def;
        }

        public JsonNode GetObject(string key)
        {
            JsonNode n;
            return Fields.TryGetValue(key, out n) && n.IsObject ? n : null;
        }

        public static JsonNode Parse(string json)
        {
            if (string.IsNullOrEmpty(json)) return new JsonNode();
            int idx = 0;
            return ParseValue(json.Trim(), ref idx);
        }

        private static void SkipWhitespace(string s, ref int idx)
        {
            while (idx < s.Length && char.IsWhiteSpace(s[idx])) idx++;
        }

        private static JsonNode ParseValue(string s, ref int idx)
        {
            SkipWhitespace(s, ref idx);
            if (idx >= s.Length) return new JsonNode();

            char c = s[idx];
            if (c == '{') return ParseObject(s, ref idx);
            if (c == '"') return new JsonNode { StringValue = ParseString(s, ref idx) };
            if (c == 't' || c == 'T') { idx += 4; return new JsonNode { BoolValue = true, StringValue = "true" }; }
            if (c == 'f' || c == 'F') { idx += 5; return new JsonNode { BoolValue = false, StringValue = "false" }; }
            if (c == 'n' || c == 'N') { idx += 4; return new JsonNode { IsNull = true }; }
            if (char.IsDigit(c) || c == '-') return ParseNumber(s, ref idx);

            idx++;
            return new JsonNode();
        }

        private static JsonNode ParseObject(string s, ref int idx)
        {
            JsonNode node = new JsonNode { IsObject = true };
            idx++; // skip '{'
            while (idx < s.Length)
            {
                SkipWhitespace(s, ref idx);
                if (idx >= s.Length || s[idx] == '}') { idx++; break; }

                if (s[idx] == ',') { idx++; continue; }

                if (s[idx] == '"')
                {
                    string key = ParseString(s, ref idx);
                    SkipWhitespace(s, ref idx);
                    if (idx < s.Length && s[idx] == ':') idx++;
                    JsonNode val = ParseValue(s, ref idx);
                    node.Fields[key] = val;
                }
                else
                {
                    idx++;
                }
            }
            return node;
        }

        private static string ParseString(string s, ref int idx)
        {
            idx++; // skip opening quote
            StringBuilder sb = new StringBuilder();
            while (idx < s.Length)
            {
                char c = s[idx++];
                if (c == '"') break;
                if (c == '\\' && idx < s.Length)
                {
                    char next = s[idx++];
                    if (next == '"') sb.Append('"');
                    else if (next == '\\') sb.Append('\\');
                    else if (next == '/') sb.Append('/');
                    else if (next == 'n') sb.Append('\n');
                    else if (next == 'r') sb.Append('\r');
                    else if (next == 't') sb.Append('\t');
                    else sb.Append(next);
                }
                else
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }

        private static JsonNode ParseNumber(string s, ref int idx)
        {
            int start = idx;
            if (s[idx] == '-') idx++;
            while (idx < s.Length && (char.IsDigit(s[idx]) || s[idx] == '.')) idx++;
            string numStr = s.Substring(start, idx - start);
            double d;
            double.TryParse(numStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out d);
            return new JsonNode { NumberValue = d, StringValue = numStr };
        }

        public static string Serialize(Dictionary<string, object> dict)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append('{');
            bool first = true;
            foreach (KeyValuePair<string, object> kvp in dict)
            {
                if (!first) sb.Append(',');
                first = false;
                sb.Append('"').Append(Escape(kvp.Key)).Append("\":");
                if (kvp.Value == null)
                {
                    sb.Append("null");
                }
                else if (kvp.Value is bool)
                {
                    sb.Append((bool)kvp.Value ? "true" : "false");
                }
                else if (kvp.Value is int || kvp.Value is long || kvp.Value is double || kvp.Value is float)
                {
                    sb.Append(kvp.Value.ToString());
                }
                else
                {
                    sb.Append('"').Append(Escape(kvp.Value.ToString())).Append('"');
                }
            }
            sb.Append('}');
            return sb.ToString();
        }

        private static string Escape(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\\\", "\\\\\\\\").Replace("\"", "\\\\\"").Replace("\\n", "\\\\n").Replace("\\r", "\\\\r").Replace("\\t", "\\\\t");
        }
    }
    #endregion

    #region Pure RFC 8032 Edwards25519 Engine (C# 7.0 / .NET 4.5+ Compatible)
    internal static class Ed25519
    {
        public struct ECPoint
        {
            public BigInteger X;
            public BigInteger Y;
            public ECPoint(BigInteger x, BigInteger y) { X = x; Y = y; }
        }

        private static readonly BigInteger P = BigInteger.Pow(2, 255) - 19;
        private static readonly BigInteger D = Mod(-121665 * ModInverse(121666, P), P);
        private static readonly BigInteger I = BigInteger.ModPow(2, (P - 1) / 4, P);

        private static readonly BigInteger By = Mod(4 * ModInverse(5, P), P);
        private static readonly BigInteger Bx = XRecover(By);

        private static BigInteger Mod(BigInteger a, BigInteger m)
        {
            BigInteger r = a % m;
            return r < 0 ? r + m : r;
        }

        private static BigInteger ModInverse(BigInteger a, BigInteger m)
        {
            return BigInteger.ModPow(Mod(a, m), m - 2, m);
        }

        private static BigInteger XRecover(BigInteger y)
        {
            BigInteger xx = Mod((y * y - 1) * ModInverse(D * y * y + 1, P), P);
            BigInteger x = BigInteger.ModPow(xx, (P + 3) / 8, P);
            if (Mod(x * x - xx, P) != 0)
            {
                x = Mod(x * I, P);
            }
            if (x % 2 != 0)
            {
                x = P - x;
            }
            return x;
        }

        private static ECPoint Edwards(ECPoint p1, ECPoint p2)
        {
            BigInteger x1 = p1.X, y1 = p1.Y, x2 = p2.X, y2 = p2.Y;
            BigInteger numX = Mod(x1 * y2 + x2 * y1, P);
            BigInteger denX = Mod(1 + D * x1 * x2 * y1 * y2, P);
            BigInteger x3 = Mod(numX * ModInverse(denX, P), P);

            BigInteger numY = Mod(y1 * y2 + x1 * x2, P);
            BigInteger denY = Mod(1 - D * x1 * x2 * y1 * y2, P);
            BigInteger y3 = Mod(numY * ModInverse(denY, P), P);

            return new ECPoint(x3, y3);
        }

        private static ECPoint ScalarMult(ECPoint pt, BigInteger e)
        {
            if (e == 0) return new ECPoint(0, 1);
            ECPoint q = ScalarMult(pt, e / 2);
            q = Edwards(q, q);
            if ((e & 1) == 1) q = Edwards(q, pt);
            return q;
        }

        private static ECPoint DecodePoint(byte[] s)
        {
            byte[] yBytes = new byte[33];
            Array.Copy(s, 0, yBytes, 0, 31);
            yBytes[31] = (byte)(s[31] & 0x7F);
            yBytes[32] = 0;
            BigInteger y = new BigInteger(yBytes);

            BigInteger x = XRecover(y);
            int bit = (s[31] >> 7) & 1;
            if ((x % 2 == 0 ? 0 : 1) != bit)
            {
                x = P - x;
            }
            return new ECPoint(x, y);
        }

        private static BigInteger DecodeLittleEndian(byte[] b)
        {
            byte[] padded = new byte[b.Length + 1];
            Array.Copy(b, 0, padded, 0, b.Length);
            padded[b.Length] = 0;
            return new BigInteger(padded);
        }

        public static bool Verify(string pubKeyHex, string message, string sigHex)
        {
            try
            {
                byte[] pk = HabitAuthApp.FromHex(pubKeyHex);
                byte[] sig = HabitAuthApp.FromHex(sigHex);
                if (pk.Length != 32 || sig.Length != 64) return false;

                byte[] rBytes = new byte[32];
                byte[] sBytes = new byte[32];
                Array.Copy(sig, 0, rBytes, 0, 32);
                Array.Copy(sig, 32, sBytes, 0, 32);

                ECPoint R = DecodePoint(rBytes);
                ECPoint A = DecodePoint(pk);
                BigInteger S = DecodeLittleEndian(sBytes);

                byte[] m = Encoding.UTF8.GetBytes(message);
                byte[] hInput = new byte[32 + 32 + m.Length];
                Array.Copy(rBytes, 0, hInput, 0, 32);
                Array.Copy(pk, 0, hInput, 32, 32);
                Array.Copy(m, 0, hInput, 64, m.Length);

                byte[] h;
                using (SHA512 sha512 = SHA512.Create())
                {
                    h = sha512.ComputeHash(hInput);
                }
                BigInteger k = DecodeLittleEndian(h);

                ECPoint B = new ECPoint(Bx, By);
                ECPoint sB = ScalarMult(B, S);
                ECPoint kA = ScalarMult(A, k);
                ECPoint rPlusKA = Edwards(R, kA);

                return sB.X == rPlusKA.X && sB.Y == rPlusKA.Y;
            }
            catch
            {
                return false;
            }
        }
    }
    #endregion
}
