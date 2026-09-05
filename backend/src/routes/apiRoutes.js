import express from 'express';
import { 
  getDiscordAuthUrl, redirectToDiscord, discordCallback, devQuickLogin, getProfile,
  getActiveSessions, revokeSession, logoutAllOtherSessions, logoutAllSessions, logout,
  registerAccount, loginAccount, adminGenerateResetLink, resetPasswordWithToken, setDirectCredentials
} from '../controllers/authController.js';
import { 
  getApplications, getApplicationById, createApplication, regenerateSecret, updateApplication, deleteApplication,
  updateAppSecurityConfig, getLiveOnlineUsers, killUserSession, reviveUserSession, killAllAppSessions
} from '../controllers/appController.js';
import { 
  getAppUsers, createAppUser, updateAppUser, resetHwid, resetSid, toggleBan, unlockUser, deleteAppUser, deleteAllAppUsers 
} from '../controllers/userController.js';
import { 
  getLicenses, generateLicenses, revokeLicense, resetLicenseHwid, deleteLicense,
  bulkGenerateLicenses, exportLicenses, toggleFreezeLicenses, deleteAllAppLicenses
} from '../controllers/licenseController.js';
import { 
  clientInit, clientLogin, validateLicense, activateLicense, deactivateLicense, getPublicAppInfo,
  clientRegister, clientLicenseOnlyLogin, clientHeartbeat, clientResetHwid
} from '../controllers/clientApiController.js';
import { 
  getAdminStats, getAccounts, updateAccountPlan, getLockedUsers, adminUnlockUser, getAuditLogs, getAuditLogRetention, purgeAuditLogs, simulateRetentionDay, exportAuditLogsBackup, getSystemHealth,
  toggleBanAccount, deleteAccount, getAllApplications, adminDeleteApp, getAllApplicationUsers,
  adminToggleBanAppUser, adminDeleteAppUser, getAllLicenses, adminDeleteLicense, getAllTeams, adminDisbandTeam,
  adminUploadImage, broadcastNotification
} from '../controllers/adminController.js';
import { 
  createTeam, getMyTeam, regenerateTeamCode, requestJoinTeam, getJoinedTeam,
  cancelMyJoinRequest, acceptJoinRequest, rejectJoinRequest, updateMemberPermissions,
  kickMember, blacklistMember, unblacklistMember, setTeamCapacity,
  closeTeam, getTeamAppUsers, getTeamAppLicenses, leaveTeam
} from '../controllers/teamController.js';
import { 
  getSystemConfig, updateMaintenance, updateNotice, updateSdkConfig, updateHeroImage, checkAppUpdate,
  updateSocialLinks
} from '../controllers/systemController.js';
import { 
  getDatabaseStats, performDatabaseAction 
} from '../controllers/adminDatabaseController.js';
import { 
  getWebhooks, createWebhook, testWebhook, deleteWebhook,
  getApiKeys, createApiKey, deleteApiKey,
  getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications
} from '../controllers/featuresController.js';
import { 
  getTickets, createTicket, getTicketById, addTicketMessage, updateTicketStatus, deleteTicket 
} from '../controllers/ticketController.js';
import { 
  getBlacklists, addBlacklist, removeBlacklist 
} from '../controllers/blacklistController.js';

import { authenticateUser, requireAdmin, checkMaintenanceMode } from '../middleware/authMiddleware.js';
import { checkAppLimit, checkUserLimit } from '../middleware/helpers.js';

const router = express.Router();

// Apply Maintenance Mode Lock to /apps and /teams (allows GET, blocks mutations for non-admins)
router.use('/apps', authenticateUser, checkMaintenanceMode);
router.use('/teams', authenticateUser, checkMaintenanceMode);

// ── 1. AUTHENTICATION & SESSIONS ─────────────────────────────
router.get('/auth/discord/login', redirectToDiscord); // Direct Discord OAuth redirect
router.get('/auth/discord/url', getDiscordAuthUrl);
router.get('/auth/discord/callback', discordCallback);
// SECURITY: devQuickLogin is ONLY active in development mode — disabled in production!
if (process.env.NODE_ENV === 'development') {
  router.post('/auth/discord/dev-login', devQuickLogin);
} else {
  router.post('/auth/discord/dev-login', (req, res) => res.status(404).json({ success: false, message: 'Not found.' }));
}
router.post('/auth/register', registerAccount); // Direct developer Sign Up
router.post('/auth/login', loginAccount); // Direct developer Sign In
router.post('/auth/set-credentials', authenticateUser, setDirectCredentials); // Set/Update username & password for direct login
router.post('/auth/reset-password', resetPasswordWithToken); // Public token password reset
router.get('/auth/profile', authenticateUser, getProfile);
router.post('/auth/logout', authenticateUser, logout);

// Session Management (Security Center)
router.get('/auth/sessions', authenticateUser, getActiveSessions);
router.delete('/auth/sessions/:sessionId', authenticateUser, revokeSession);
router.post('/auth/sessions/logout-other', authenticateUser, logoutAllOtherSessions);
router.post('/auth/sessions/logout-all', authenticateUser, logoutAllSessions);

// ── 2. APPLICATIONS ──────────────────────────────────────────
router.get('/apps', authenticateUser, getApplications);
router.post('/apps', authenticateUser, checkAppLimit, createApplication); // App Name ONLY, quota enforced!
router.get('/apps/:appId', authenticateUser, getApplicationById);
router.put('/apps/:appId', authenticateUser, updateApplication);
router.delete('/apps/:appId', authenticateUser, deleteApplication);
router.post('/apps/:appId/regenerate-secret', authenticateUser, regenerateSecret);

// ── 3. USERS MANAGEMENT (CARD-BASED UI) ──────────────────────
router.get('/apps/:appId/users', authenticateUser, getAppUsers);
router.post('/apps/:appId/users', authenticateUser, checkUserLimit, createAppUser); // Manually Add User
router.put('/apps/:appId/users/:userId', authenticateUser, updateAppUser); // Edit User
router.post('/apps/:appId/users/:userId/reset-hwid', authenticateUser, resetHwid);
router.post('/apps/:appId/users/:userId/reset-sid', authenticateUser, resetSid);
router.post('/apps/:appId/users/:userId/toggle-ban', authenticateUser, toggleBan);
router.post('/apps/:appId/users/:userId/unlock', authenticateUser, unlockUser);
router.delete('/apps/:appId/users/all', authenticateUser, deleteAllAppUsers);
router.delete('/apps/:appId/users', authenticateUser, deleteAllAppUsers);
router.delete('/apps/:appId/users/:userId', authenticateUser, deleteAppUser);

// ── 4. LICENSES MANAGEMENT ───────────────────────────────────
router.get('/apps/:appId/licenses', authenticateUser, getLicenses);
router.post('/apps/:appId/licenses/generate', authenticateUser, generateLicenses);
router.post('/apps/:appId/licenses', authenticateUser, generateLicenses); // Single/Batch License Generation
router.post('/apps/:appId/licenses/:licenseId/revoke', authenticateUser, revokeLicense);
router.put('/apps/:appId/licenses/:licenseId/revoke', authenticateUser, revokeLicense);
router.post('/apps/:appId/licenses/:licenseId/reset-hwid', authenticateUser, resetLicenseHwid);
router.delete('/apps/:appId/licenses/all', authenticateUser, deleteAllAppLicenses);
router.delete('/apps/:appId/licenses', authenticateUser, deleteAllAppLicenses);
router.delete('/apps/:appId/licenses/:licenseId', authenticateUser, deleteLicense);

// ── 5. ADVANCED FEATURES (TEAMS, WEBHOOKS, API KEYS) ─────────
router.get('/apps/:appId/webhooks', authenticateUser, getWebhooks);
router.post('/apps/:appId/webhooks', authenticateUser, createWebhook);
router.post('/apps/:appId/webhooks/:webhookId/test', authenticateUser, testWebhook);
router.delete('/apps/:appId/webhooks/:webhookId', authenticateUser, deleteWebhook);

router.post('/teams', authenticateUser, createTeam);
router.get('/teams/my-team', authenticateUser, getMyTeam);
router.delete('/teams/:teamId', authenticateUser, closeTeam); // Owner closes & disbands team
router.post('/teams/regen-code', authenticateUser, regenerateTeamCode);
router.post('/teams/join-request', authenticateUser, requestJoinTeam);
router.get('/teams/joined', authenticateUser, getJoinedTeam);
router.get('/teams/joined/apps/:appId/users', authenticateUser, getTeamAppUsers);
router.get('/teams/joined/apps/:appId/licenses', authenticateUser, getTeamAppLicenses);
router.delete('/teams/join-request/cancel', authenticateUser, cancelMyJoinRequest);
router.post('/teams/leave', authenticateUser, leaveTeam); // Member voluntarily leaves team
router.post('/teams/:teamId/members/:memberId/accept', authenticateUser, acceptJoinRequest);
router.post('/teams/:teamId/members/:memberId/reject', authenticateUser, rejectJoinRequest);
router.put('/teams/:teamId/members/:memberId/permissions', authenticateUser, updateMemberPermissions);
router.post('/teams/:teamId/members/:memberId/kick', authenticateUser, kickMember);
router.post('/teams/:teamId/members/:memberId/blacklist', authenticateUser, blacklistMember);
router.delete('/teams/:teamId/blacklist/:blacklistId', authenticateUser, unblacklistMember);
router.put('/admin/teams/:teamId/capacity', authenticateUser, requireAdmin, setTeamCapacity);

router.get('/api-keys', authenticateUser, getApiKeys);
router.post('/api-keys', authenticateUser, createApiKey);
router.delete('/api-keys/:keyId', authenticateUser, deleteApiKey);

// In-Web Notifications
router.get('/notifications', authenticateUser, getNotifications);
router.put('/notifications/:notifId/read', authenticateUser, markNotificationRead);
router.put('/notifications/read-all', authenticateUser, markAllNotificationsRead);
router.delete('/notifications/all', authenticateUser, clearAllNotifications);
router.delete('/notifications', authenticateUser, clearAllNotifications);
router.delete('/notifications/:notifId', authenticateUser, deleteNotification);

// ── 6. PUBLIC CLIENT, SDK & SYSTEM API ────────────────────────
router.get('/system/config', getSystemConfig); // Public maintenance & announcement banner
router.get('/app/check-update/:appId', checkAppUpdate); // Auto-update check
router.post('/auth/client-init', clientInit); // Session initialization & anti-tamper handshake
router.post('/client/init', clientInit);
router.post('/auth/client-login', clientLogin); // Brute force & 24h lockout enforced!
router.post('/client/login', clientLogin);
router.post('/auth/client-register', clientRegister); // Register user with license key
router.post('/client/register', clientRegister);
router.post('/auth/client-license', clientLicenseOnlyLogin); // Instant license-only authentication
router.post('/client/license', clientLicenseOnlyLogin);
router.post('/client/license-login', clientLicenseOnlyLogin);
router.post('/client/heartbeat', clientHeartbeat); // Active user heartbeat (remote killswitch trigger)
router.post('/auth/client-heartbeat', clientHeartbeat);
router.post('/client/reset-hwid', clientResetHwid); // Self-service HWID reset endpoint
router.post('/auth/client-reset-hwid', clientResetHwid);
router.post('/license/validate', validateLicense);
router.post('/client/license/validate', validateLicense);
router.post('/license/activate', activateLicense);
router.post('/license/deactivate', deactivateLicense);
router.get('/app/info/:appId', getPublicAppInfo);

// ── 7. SUPER ADMIN ENDPOINTS ─────────────────────────────────
router.get('/admin/stats', authenticateUser, requireAdmin, getAdminStats);
router.get('/admin/accounts', authenticateUser, requireAdmin, getAccounts);
router.put('/admin/accounts/:accountId/plan', authenticateUser, requireAdmin, updateAccountPlan);
router.post('/admin/accounts/:accountId/toggle-ban', authenticateUser, requireAdmin, toggleBanAccount);
router.post('/admin/accounts/:accountId/ban', authenticateUser, requireAdmin, toggleBanAccount);
router.delete('/admin/accounts/:accountId', authenticateUser, requireAdmin, deleteAccount);

router.get('/admin/all-apps', authenticateUser, requireAdmin, getAllApplications);
router.delete('/admin/apps/:appId', authenticateUser, requireAdmin, adminDeleteApp);

router.get('/admin/all-users', authenticateUser, requireAdmin, getAllApplicationUsers);
router.post('/admin/users/:userId/toggle-ban', authenticateUser, requireAdmin, adminToggleBanAppUser);
router.delete('/admin/users/:userId', authenticateUser, requireAdmin, adminDeleteAppUser);

router.get('/admin/all-licenses', authenticateUser, requireAdmin, getAllLicenses);
router.delete('/admin/licenses/:licenseId', authenticateUser, requireAdmin, adminDeleteLicense);

router.get('/admin/all-teams', authenticateUser, requireAdmin, getAllTeams);
router.delete('/admin/teams/:teamId', authenticateUser, requireAdmin, adminDisbandTeam);

router.put('/admin/maintenance', authenticateUser, requireAdmin, updateMaintenance);
router.put('/admin/notice', authenticateUser, requireAdmin, updateNotice);
router.put('/admin/hero-image', authenticateUser, requireAdmin, updateHeroImage);
router.put('/admin/sdk-config', authenticateUser, requireAdmin, updateSdkConfig);
router.put('/admin/social-links', authenticateUser, requireAdmin, updateSocialLinks);
router.post('/admin/upload-image', authenticateUser, requireAdmin, adminUploadImage);
router.post('/admin/broadcast-notification', authenticateUser, requireAdmin, broadcastNotification);

router.get('/admin/locked-users', authenticateUser, requireAdmin, getLockedUsers);
router.post('/admin/locked-users/:userId/unlock', authenticateUser, requireAdmin, adminUnlockUser);
router.post('/admin/users/:userId/generate-reset-link', authenticateUser, requireAdmin, adminGenerateResetLink);
router.get('/admin/audit-logs', authenticateUser, requireAdmin, getAuditLogs);
router.get('/system/health', getSystemHealth);

// ── Admin Database Hub & Diagnostics ──
router.get('/admin/database/stats', authenticateUser, requireAdmin, getDatabaseStats);
router.post('/admin/database/action', authenticateUser, requireAdmin, performDatabaseAction);

// ── Bulk License Generation & Export ──
router.post('/apps/:appId/licenses/bulk', authenticateUser, bulkGenerateLicenses);
router.get('/apps/:appId/licenses/export', authenticateUser, exportLicenses);
router.post('/apps/:appId/licenses/toggle-freeze', authenticateUser, toggleFreezeLicenses);

// ── Security Center (Hash Check & Live Pulse) ──
router.put('/apps/:appId/security-config', authenticateUser, updateAppSecurityConfig);
router.get('/apps/:appId/live-users', authenticateUser, getLiveOnlineUsers);
router.post('/apps/:appId/users/:userId/kill-session', authenticateUser, killUserSession);
router.post('/apps/:appId/users/:userId/revive-session', authenticateUser, reviveUserSession);
router.post('/apps/:appId/kill-all-sessions', authenticateUser, killAllAppSessions);

// ── 8. SUPPORT TICKETING SYSTEM ─────────────────────────────
router.get('/tickets', authenticateUser, getTickets);
router.post('/tickets', authenticateUser, createTicket);
router.get('/tickets/:ticketId', authenticateUser, getTicketById);
router.post('/tickets/:ticketId/messages', authenticateUser, addTicketMessage);
router.put('/tickets/:ticketId/status', authenticateUser, updateTicketStatus);
router.delete('/tickets/:ticketId', authenticateUser, deleteTicket);

// ── 9. HARDWARE & IP BLACKLIST SYSTEM ────────────────────────
router.get('/blacklists', authenticateUser, getBlacklists);
router.post('/blacklists', authenticateUser, addBlacklist);
router.delete('/blacklists/:blacklistId', authenticateUser, removeBlacklist);

// ── 10. DEVELOPER AUDIT LOGS ─────────────────────────────────
router.get('/audit-logs', authenticateUser, getAuditLogs);
// ── 10b. AUDIT LOGS 30-DAY RETENTION, PURGE & BACKUP ──
router.get('/audit-logs/retention', authenticateUser, getAuditLogRetention);
router.post('/audit-logs/purge', authenticateUser, purgeAuditLogs);
router.post('/audit-logs/retention/simulate', authenticateUser, simulateRetentionDay);
router.get('/audit-logs/export', authenticateUser, exportAuditLogsBackup);

export default router;
