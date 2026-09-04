# HABIT AUTH

> **Modern Authentication & License Infrastructure for Developers**

Habit Auth is a production-quality full-stack SaaS platform designed for software developers, C# desktop applications, websites, and games requiring hardware-locked licensing, Discord OAuth2 authentication, 24-hour brute-force protection, active session management, and real-time Discord webhook event broker.

---

## 🌟 Key Features

1. **Strict 2-Tier Pricing (NO Reseller Plan)**:
   - **FREE ($0/month)**: 1 Application, 10 Users, All Auth Methods, License System, Basic Dashboard.
   - **DEVELOPER ($1/month)**: Unlimited Applications, Unlimited Users, Unlimited Licenses, Discord Webhooks, Team Management, Full REST API Access, Advanced Analytics, Audit Logs, API Playground.
   - Purchase Flow: Clicking "Buy Now" directs users to join the official Discord server to purchase manually.
2. **Card-Based Developer Dashboard**:
   - Near-black `#050508` theme with subtle purple/violet neon accents (`#a855f7`).
   - Responsive card grid (4 cards per row on desktop, 3 on medium, 2 on tablet, 1 on mobile).
   - **User Cards**: Initial avatars, username, truncated ID with copy button, status badges (`ACTIVE`, `LOCKED`, `BANNED`), license key, HWID hash (truncated with copy button), SID, expiration date, and action buttons (`[Edit]`, `[Reset HWID]`, `[Reset SID]`, `[Ban/Unban]`, `[Delete]`, `[Unlock]`).
   - **License Cards**: Cryptographically secure keys (`PREFIX-XXXX-XXXX-XXXX-XXXX`), activations count, HWID binding status, and action buttons (`[Copy]`, `[Revoke]`, `[Reset HWID]`, `[Delete]`).
   - **Application Cards**: App ID, version, users count, licenses count, active keys count, and credentials access.
3. **Application Credentials**:
   - Only requires **App Name** on creation (no App Owner ID concept exposed).
   - Generates cryptographically secure `App ID` and `App Secret`.
   - Secret reveal, copy, and regeneration with immediate invalidation of old secrets.
4. **24-Hour Brute Force Lockout**:
   - 5 failed password attempts automatically locks *only that specific application user* for 24 hours (`locked_until = now + 24h`).
   - Automatically unlocks after 24 hours without requiring administrator intervention.
   - Administrators can manually unlock users anytime before the timeout via *Security Center &rarr; 24-Hour Lockouts*.
5. **Active Sessions Management**:
   - Tracks browser, OS, device, IP address, and login timestamp.
   - Actions: `[ Logout Session ]`, `[ Logout All Other Sessions ]`, and `[ Logout All Sessions ]`.
6. **Interactive API Playground**:
   - Test endpoints (`POST /api/v1/license/validate`, `POST /api/v1/auth/client-login`, `POST /api/v1/license/activate`) live from the dashboard.
7. **C# .NET 10 Desktop Client**:
   - Modern asynchronous client library (`HabitAuthClient.cs`) with hardware fingerprinting, smooth loading states, and 24h lockout handling.

---

## 🚀 Quick Start (Local Development)

### 1. Launch Server
Double-click `start.bat` or run:

```bash
cd backend
npm start
```

Open your browser at:
👉 **[http://localhost:5000](http://localhost:5000)**

### 2. Login
- Click **"Continue with Discord"** (uses Discord OAuth2 credentials in `backend/.env`).
- For instant zero-friction local testing without setting Discord credentials, click **"👑 Admin Owner"** or **"💻 Free Developer"** in the login modal.

### 3. Run C# Desktop Example

```bash
cd csharp_example/HabitAuth.Example
dotnet run
```

---

## 📡 REST API Documentation

### Client Authentication (with 24h Lockout Protection)
`POST /api/v1/auth/client-login`
```json
{
  "app_id": "app_nexus_auth_demo",
  "username": "john_developer",
  "password": "clientPass123!",
  "hwid": "40d8688ebdb6b9f7a1c8901234567890",
  "sid": "SID-Workstation"
}
```

### Validate License
`POST /api/v1/license/validate`
```json
{
  "app_id": "app_nexus_auth_demo",
  "license_key": "HABIT-NEXUS-2026-ACTIVE",
  "hwid": "40d8688ebdb6b9f7a1c8901234567890"
}
```

### Activate License
`POST /api/v1/license/activate`
```json
{
  "app_id": "app_nexus_auth_demo",
  "license_key": "HABIT-NEXUS-UNUSED-KEY1",
  "hwid": "40d8688ebdb6b9f7a1c8901234567890",
  "username": "new_client"
}
```
