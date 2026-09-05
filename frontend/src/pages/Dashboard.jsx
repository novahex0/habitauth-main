import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, LayoutDashboard, Smartphone, Key, Users, Bell, Code, Shield, ShieldAlert, MessageSquare, LifeBuoy, FileText,
  Plus, Copy, Check, Eye, EyeOff, RefreshCw, Trash2, Ban, ExternalLink, ArrowLeft,
  CheckCircle2, AlertTriangle, Search, Filter, Lock, Unlock, KeyRound, Sparkles,
  Calendar, UserPlus, LogOut, Globe, Terminal, Activity, X, Sliders, Edit2, Menu,
  Send, Users2, Laptop, Clock, AlertCircle, Play, Code2, Wrench, Megaphone, FileCode, Crown, ChevronDown, ChevronUp, ChevronRight, Zap, Radio, Download, Snowflake,
  Sun, Moon, LogIn, XCircle, Layers, Image, Database, HardDrive
} from 'lucide-react';
import CustomConfirmModal from '../components/CustomConfirmModal';
import SystemNoticeBanner from '../components/SystemNoticeBanner';
import { SDK_REGISTRY, SDK_VERSION, downloadSdkFile } from '../sdk/sdkConfig';
import SdkCodeViewer from '../components/SdkCodeViewer';
import { useLanguage } from '../context/LanguageContext';

// Official Discord Logo SVG
const DiscordIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

// Official Telegram Logo SVG
const TelegramIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
  </svg>
);

const WEBHOOK_AVAILABLE_ROLES = [
  { id: 'login', label: 'User Login', icon: LogIn, desc: 'When client user or license logs in' },
  { id: 'register', label: 'User Register', icon: UserPlus, desc: 'When new client user registers with license' },
  { id: 'user_banned', label: 'User Ban', icon: Ban, desc: 'When user is manually banned or auto-banned' },
  { id: 'hwid_reset', label: 'HWID Reset', icon: RefreshCw, desc: 'When machine hardware ID is reset' },
  { id: 'security_alert', label: 'Security & Tamper Alert', icon: ShieldAlert, desc: 'Binary hash mismatch / cracked binary alert' },
  { id: 'account_locked', label: 'Account Lockout', icon: Lock, desc: '5 consecutive failed password attempts' },
  { id: 'license_created', label: 'License Created', icon: Key, desc: 'Single or bulk license keys generated' },
  { id: 'license_activated', label: 'License Activated', icon: Zap, desc: 'Unused license key is first redeemed' },
  { id: 'license_revoked', label: 'License Revoked', icon: XCircle, desc: 'License revoked, deleted or suspended' },
  { id: 'ticket_created', label: 'Support Ticket', icon: MessageSquare, desc: 'Customer creates a new support ticket' }
];

export default function Dashboard({ user, onLogout, onBackToLanding, onUpgradeClick }) {
  const { t, language, setLanguage, languages, currentLanguageObj } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('habit_theme') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('habit_theme', nextTheme);
  };

  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user]);


  // Synchronize fresh subscription and plan from backend immediately on page load/reload
  useEffect(() => {
    const token = localStorage.getItem('habit_token');
    if (token) {
      fetch('/api/v1/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.user) {
            setCurrentUser(prev => {
              const merged = { ...prev, ...data.user };
              localStorage.setItem('habit_user', JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch(() => {});
    }
  }, []);
  const [activeNav, setActiveNav] = useState(() => {
    try {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const seg0 = parts[0].toLowerCase();
        if (seg0 === 'user' || seg0 === 'users') return 'users';
        if (seg0 === 'license' || seg0 === 'licenses') return 'licenses';
        if (seg0 === 'app' || seg0 === 'apps') return 'apps';
        if (seg0 === 'device' || seg0 === 'devices') return 'devices';
        if (seg0 === 'webhook' || seg0 === 'webhooks') return 'webhooks';
        if (seg0 === 'team' || seg0 === 'teams') return 'teams';
        if (seg0 === 'join-team') return 'join-team';
        if (seg0 === 'team-dashboard') return 'team-dashboard';
        if (seg0 === 'sdk' || seg0 === 'sdks') return 'sdks';
        if (seg0 === 'playground') return 'playground';
        if (seg0 === 'security') return 'security';
        if (seg0 === 'tickets' || seg0 === 'ticket') return 'tickets';
        if (seg0 === 'audit') return 'audit';
        if (seg0 === 'admin') return 'admin';
        if (seg0 === 'overview') return 'overview';
      }
    } catch (e) {}
    return localStorage.getItem('habit_active_nav') || 'overview';
  }); 

  useEffect(() => {
    localStorage.setItem('habit_active_nav', activeNav);
    setMobileSidebarOpen(false);
    let target = `/${activeNav}`;
    if (activeNav === 'users' && userSearch) {
      target = `/User/${encodeURIComponent(userSearch)}`;
    }
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
  }, [activeNav]);

  // Handle browser Back/Forward buttons (popstate) & initial deep link params
  useEffect(() => {
    const handlePopState = () => {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const seg0 = parts[0].toLowerCase();
        const seg1 = parts[1] ? decodeURIComponent(parts[1]) : '';
        if (seg0 === 'user' || seg0 === 'users') {
          setActiveNav('users');
          if (seg1) setUserSearch(seg1);
        } else if (seg0 === 'license' || seg0 === 'licenses') {
          setActiveNav('licenses');
          if (seg1) setLicenseSearch(seg1);
        } else if (seg0 === 'app' || seg0 === 'apps') {
          setActiveNav('apps');
        } else if (seg0 === 'radar' || seg0 === 'live-radar') {
          setActiveNav('radar');
        } else if (seg0 === 'device' || seg0 === 'devices') {
          setActiveNav('devices');
        } else if (seg0 === 'webhook' || seg0 === 'webhooks') {
          setActiveNav('webhooks');
        } else if (seg0 === 'team' || seg0 === 'teams') {
          setActiveNav('teams');
        } else if (seg0 === 'join-team') {
          setActiveNav('join-team');
        } else if (seg0 === 'team-dashboard') {
          setActiveNav('team-dashboard');
        } else if (seg0 === 'sdk' || seg0 === 'sdks') {
          setActiveNav('sdks');
        } else if (seg0 === 'playground') {
          setActiveNav('playground');
        } else if (seg0 === 'security') {
          setActiveNav('security');
        } else if (seg0 === 'audit') {
          setActiveNav('audit');
        } else if (seg0 === 'admin') {
          setActiveNav('admin');
        } else if (seg0 === 'overview') {
          setActiveNav('overview');
        }
      }
    };

    // On initial mount: if URL has /User/{Key} or /licenses/{Key}, load it immediately
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 1) {
      const seg0 = parts[0].toLowerCase();
      const seg1 = decodeURIComponent(parts[1]);
      if (seg0 === 'user' || seg0 === 'users') {
        setUserSearch(seg1);
      } else if (seg0 === 'license' || seg0 === 'licenses') {
        setLicenseSearch(seg1);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Modals & In-Website Confirmations
  const [showCreateAppModal, setShowCreateAppModal] = useState(false);
  const [showGenLicenseModal, setShowGenLicenseModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // In-Website Custom Confirmation Dialog (Replaces native browser confirm())
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: true,
    onConfirm: null
  });

  const promptConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = true, onConfirm }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDanger,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };
  const triggerConfirm = promptConfirm;

  // App Creation Form (App Name ONLY! No App Owner ID)
  const [newAppName, setNewAppName] = useState('');
  const [newAppVersion, setNewAppVersion] = useState('1.0.0');

  // License Generator Form
  const [genCount, setGenCount] = useState(1);
  const [genDuration, setGenDuration] = useState('0'); // 0 = lifetime, or custom
  const [customGenDuration, setCustomGenDuration] = useState(30);
  const [genPrefix, setGenPrefix] = useState('HABIT');
  const [genNote, setGenNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manually Add User Form
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserLicense, setNewUserLicense] = useState('MANUAL_BYPASS');
  const [newUserExpiry, setNewUserExpiry] = useState('');
  const [newUserHwidLock, setNewUserHwidLock] = useState(true);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Edit User Modal Form
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // App Credentials visibility & copy states
  const [showSecret, setShowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // Searches & Filters
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // all | active | locked | banned
  const [licenseSearch, setLicenseSearch] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('all'); // all | active | unused | revoked

  // Current App Details
  const [currentAppDetails, setCurrentAppDetails] = useState(null);
  const [appUsers, setAppUsers] = useState([]);
  const [appLicenses, setAppLicenses] = useState([]);
  const [appWebhooks, setAppWebhooks] = useState([]);

  // Webhook Platform & Granular Roles State
  const [webhookPlatform, setWebhookPlatform] = useState('discord'); // 'discord' | 'telegram'
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookTgToken, setWebhookTgToken] = useState('');
  const [webhookTgChatId, setWebhookTgChatId] = useState('');
  const [webhookRoles, setWebhookRoles] = useState(['login', 'register', 'user_banned', 'security_alert', 'account_locked']);
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);

  // Sessions & Security
  const [sessions, setSessions] = useState([]);
  const [lockedUsers, setLockedUsers] = useState([]);

  // API Playground State
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState('/api/v1/license/validate');
  const [playgroundBody, setPlaygroundBody] = useState('{\n  "app_id": "app_nexus_auth_demo",\n  "license_key": "HABIT-NEXUS-2026-ACTIVE"\n}');
  const [playgroundResponse, setPlaygroundResponse] = useState(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  // Teams & API Keys
  const [teams, setTeams] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditEventFilter, setAuditEventFilter] = useState('all');
  const [logRetention, setLogRetention] = useState(null);
  const [isPurgingLogs, setIsPurgingLogs] = useState(false);
  const [selectedBanInfraction, setSelectedBanInfraction] = useState(null);

  // Support Tickets States
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isSendingTicketMsg, setIsSendingTicketMsg] = useState(false);
  const ticketMessagesEndRef = useRef(null);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('normal');
  const [newTicketClientUser, setNewTicketClientUser] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Blacklist States (IP & HWID)
  const [blacklists, setBlacklists] = useState([]);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [blacklistTypeFilter, setBlacklistTypeFilter] = useState('all');
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false);
  const [newBlacklistType, setNewBlacklistType] = useState('hwid');
  const [newBlacklistValue, setNewBlacklistValue] = useState('');
  const [newBlacklistReason, setNewBlacklistReason] = useState('');
  const [newBlacklistAppId, setNewBlacklistAppId] = useState('global');
  const [isAddingBlacklist, setIsAddingBlacklist] = useState(false);

  // Advanced Team Collaboration States
  const [myTeam, setMyTeam] = useState(null);
  const [joinedTeam, setJoinedTeam] = useState(null);

  // Auto-redirect to Overview if team-dashboard is accessed without active joined team
  useEffect(() => {
    if (activeNav === 'team-dashboard' && !joinedTeam) {
      setActiveNav('overview');
      window.history.replaceState({}, '', '/overview');
    }
  }, [activeNav, joinedTeam]);
  const [pendingJoinRequest, setPendingJoinRequest] = useState(null);
  const [teamInviteCodeInput, setTeamInviteCodeInput] = useState('');
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showMemberPermsModal, setShowMemberPermsModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberRole, setMemberRole] = useState('developer');
  const [memberPerms, setMemberPerms] = useState({
    manage_users: true,
    manage_licenses: true,
    view_analytics: true,
    manage_webhooks: false,
    api_access: false
  });
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistingMember, setBlacklistingMember] = useState(null);
  const [blacklistReason, setBlacklistReason] = useState('');

  // Admin Data & Master Control Directories
  const [adminStats, setAdminStats] = useState(null);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminSubTab, setAdminSubTab] = useState('system'); // 'system' | 'accounts' | 'apps' | 'users' | 'licenses' | 'teams'
  const [adminApps, setAdminApps] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLicenses, setAdminLicenses] = useState([]);
  const [adminTeams, setAdminTeams] = useState([]);
  const [adminAppSearch, setAdminAppSearch] = useState('');
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminLicenseSearch, setAdminLicenseSearch] = useState('');
  const [adminTeamSearch, setAdminTeamSearch] = useState('');
  const [adminAccountPlanFilter, setAdminAccountPlanFilter] = useState('all');
  const [subModalAccount, setSubModalAccount] = useState(null);
  const [subModalPlan, setSubModalPlan] = useState('developer');
  const [subModalDuration, setSubModalDuration] = useState('1month');
  const [subModalSaving, setSubModalSaving] = useState(false);
  const [showEditVersionModal, setShowEditVersionModal] = useState(false);
  const [editAppVersion, setEditAppVersion] = useState('1.0.0');
  const [isUpdatingVersion, setIsUpdatingVersion] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  const handleOpenSubModal = (acc, preferredPlan) => {
    setSubModalAccount(acc);
    setSubModalPlan(preferredPlan || (acc.plan === 'pro' ? 'pro' : 'developer'));
    setSubModalDuration('1month');
  };

  const handleSaveSubscription = async (e) => {
    if (e) e.preventDefault();
    if (!subModalAccount) return;
    setSubModalSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/accounts/${subModalAccount.id}/plan`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          plan: subModalPlan,
          duration: subModalDuration
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Subscription updated successfully!');
        fetchAdminData();
        setSubModalAccount(null);
      } else {
        showToast(data.message || 'Failed to update subscription', 'error');
      }
    } catch (err) {
      showToast('Error updating subscription', 'error');
    } finally {
      setSubModalSaving(false);
    }
  };
  
  // Super Admin Database Hub & Password Reset Link States
  const [dbStats, setDbStats] = useState(null);
  const [loadingDbStats, setLoadingDbStats] = useState(false);
  const [resetLinkModalData, setResetLinkModalData] = useState(null);
  const [copiedResetLink, setCopiedResetLink] = useState(false);

  // Top-Tier Premium States
  const [showBulkGenModal, setShowBulkGenModal] = useState(false);
  const [bulkGenCount, setBulkGenCount] = useState(100);
  const [bulkGenDuration, setBulkGenDuration] = useState(30);
  const [bulkGenMask, setBulkGenMask] = useState('');
  const [bulkGenNote, setBulkGenNote] = useState('');
  const [bulkGeneratedKeys, setBulkGeneratedKeys] = useState([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('txt');
  const [exportStatus, setExportStatus] = useState('all');

  const [liveUsers, setLiveUsers] = useState([]);
  const [radarSearch, setRadarSearch] = useState('');
  const [radarAutoRefresh, setRadarAutoRefresh] = useState(true);
  const [radarSelectedApp, setRadarSelectedApp] = useState('all');
  const [radarStatusFilter, setRadarStatusFilter] = useState('all'); // 'all' | 'active' | 'killed'
  const [isRefreshingRadar, setIsRefreshingRadar] = useState(false);
  const [selectedRadarUser, setSelectedRadarUser] = useState(null);

  const filteredRadarUsers = liveUsers.filter(u => {
    if (radarSelectedApp !== 'all' && u.application_id !== radarSelectedApp) return false;
    const isKilled = Boolean(u.is_killed || u.session_killed);
    if (radarStatusFilter === 'active' && isKilled) return false;
    if (radarStatusFilter === 'killed' && !isKilled) return false;
    if (radarSearch) {
      const q = radarSearch.toLowerCase().trim();
      const matchUser = u.username?.toLowerCase().includes(q);
      const matchHwid = u.hwid?.toLowerCase().includes(q);
      const matchIp = u.last_ip?.toLowerCase().includes(q);
      const matchApp = u.app_name?.toLowerCase().includes(q);
      if (!matchUser && !matchHwid && !matchIp && !matchApp) return false;
    }
    return true;
  });
  const activeRadarCount = liveUsers.filter(u => !u.is_killed && !u.session_killed).length;
  const killedRadarCount = liveUsers.filter(u => u.is_killed || u.session_killed).length;

  const [appSecForm, setAppSecForm] = useState({
    token_validation_enabled: false,
    force_update_enabled: false,
    latest_version: '1.0.0',
    update_download_url: '',
    enforce_hash_check: false,
    expected_hash: '',
    custom_key_mask: '',
    hwid_cooldown_days: 7,
    hwid_self_reset_enabled: true,
    custom_webhook_username: '',
    custom_webhook_avatar: '',
    custom_webhook_color: ''
  });
  const [isSavingSec, setIsSavingSec] = useState(false);
  const [systemMaintenance, setSystemMaintenance] = useState({ active: false, message: '' });
  const isMaintenanceLocked = systemMaintenance.active && user?.role !== 'admin';

  const [adminSystemConfig, setAdminSystemConfig] = useState({
    maintenance_mode: false,
    maintenance_message: '',
    announcement_notice: '',
    announcement_active: true,
    landing_hero_image: '',
    landing_hero_image_active: true,
    example_app_github_url: 'https://github.com/HabitAuth/HabitAuth-Example',
    discord_invite_url: 'https://discord.gg/7JX63q4Aa',
    github_url: 'https://github.com'
  });
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);

  // Broadcast Notification Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastImage, setBroadcastImage] = useState('');
  const [broadcastType, setBroadcastType] = useState('info'); // 'info' | 'security' | 'warning' | 'danger'
  const [broadcastTargetFree, setBroadcastTargetFree] = useState(true);
  const [broadcastTargetDev, setBroadcastTargetDev] = useState(true);
  const [broadcastTargetPro, setBroadcastTargetPro] = useState(true);
  const [isUploadingBroadcastImage, setIsUploadingBroadcastImage] = useState(false);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Ban Reason Modal State (interactive ban modal)
  const [banReasonModal, setBanReasonModal] = useState(null); // { type: 'account'|'admin_user'|'app_user', id, name, reason }
  const [isSubmittingBan, setIsSubmittingBan] = useState(false);

  // Direct Login Credentials Setup Modal State
  const [showDirectCredsModal, setShowDirectCredsModal] = useState(false);
  const [directCredsUsername, setDirectCredsUsername] = useState(user?.username || '');
  const [directCredsPassword, setDirectCredsPassword] = useState('');
  const [directCredsSaving, setDirectCredsSaving] = useState(false);
  const [directCredsError, setDirectCredsError] = useState('');

  // Dynamic Example App GitHub URL (configured by admin)
  const [exampleAppUrl, setExampleAppUrl] = useState('https://github.com/HabitAuth/HabitAuth-Example');

  // SDK Selector State (C#, C++, or JavaScript)
  const [selectedSdkId, setSelectedSdkId] = useState('csharp'); // 'csharp' | 'cpp' | 'javascript'
  const [sdkTab, setSdkTab] = useState('csharp');

  // Team Scoped App View (for members inspecting team owner's apps)
  const [teamAppScope, setTeamAppScope] = useState(null); // { appId, appName, users: [], licenses: [], activeTab: 'users' | 'licenses' }

  // ── Multi-Toast In-Web Notification Engine ──
  const [toasts, setToasts] = useState([]);
  const showToast = (msg, type = 'success', title = null) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6);
    const newToast = { id, message: String(msg || ''), type, title };
    setToasts(prev => [...prev.slice(-4), newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Currently selected app computed safely
  const selectedApp = apps.find(a => a.id === selectedAppId) || currentAppDetails || apps[0] || null;

  // ── In-Web Notification Center State & Handlers ──
  const [inWebNotifications, setInWebNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [selectedNotifDetails, setSelectedNotifDetails] = useState(null);
  const notifRef = useRef(null);

  const fetchInWebNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setInWebNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch (e) {}
  };

  const handleMarkNotifRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PUT', headers: getHeaders() });
      setInWebNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'PUT', headers: getHeaders() });
      setInWebNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadNotifCount(0);
      showToast('All notifications marked as read', 'info');
    } catch (e) {}
  };

  const handleDeleteNotif = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/v1/notifications/${id}`, { method: 'DELETE', headers: getHeaders() });
      setInWebNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification removed', 'info');
    } catch (e) {}
  };

  const handleClearAllNotifs = async () => {
    try {
      await fetch('/api/v1/notifications', { method: 'DELETE', headers: getHeaders() });
      setInWebNotifications([]);
      setUnreadNotifCount(0);
      showToast('All notifications cleared', 'info');
    } catch (e) {}
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchInWebNotifications();
    const notifInterval = setInterval(() => {
      fetchInWebNotifications();
    }, 25000);
    return () => clearInterval(notifInterval);
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('habit_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  };

  // Fetch Apps
  const fetchApps = async () => {
    try {
      const res = await fetch('/api/v1/apps', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setApps(data.applications);
        if (data.applications.length > 0) {
          const targetId = selectedAppId || data.applications[0].id;
          if (!selectedAppId) setSelectedAppId(targetId);
          await fetchCurrentApp(targetId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch Current App Data
  const fetchCurrentApp = async (appId) => {
    if (!appId) return;
    try {
      setLoading(true);
      const [appRes, usersRes, licensesRes, webhooksRes] = await Promise.all([
        fetch(`/api/v1/apps/${appId}`, { headers: getHeaders() }),
        fetch(`/api/v1/apps/${appId}/users`, { headers: getHeaders() }),
        fetch(`/api/v1/apps/${appId}/licenses`, { headers: getHeaders() }),
        fetch(`/api/v1/apps/${appId}/webhooks`, { headers: getHeaders() })
      ]);

      const [appData, usersData, licensesData, webhooksData] = await Promise.all([
        appRes.json(), usersRes.json(), licensesRes.json(), webhooksRes.json()
      ]);

      if (appData.success) setCurrentAppDetails(appData.application);
      if (usersData.success) setAppUsers(usersData.users);
      if (licensesData.success) setAppLicenses(licensesData.licenses);
      if (webhooksData.success) setAppWebhooks(webhooksData.webhooks);
      fetchLiveUsers(appId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Real-time Live Online Users (Radar Telemetry)
  const fetchLiveUsers = async (appId) => {
    const target = appId !== undefined ? appId : (radarSelectedApp || selectedAppId || 'all');
    if (!target) return;
    try {
      setIsRefreshingRadar(true);
      const res = await fetch(`/api/v1/apps/${target}/live-users`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setLiveUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch radar telemetry:', e);
    } finally {
      setIsRefreshingRadar(false);
    }
  };

  useEffect(() => {
    if (activeNav === 'users' || activeNav === 'radar') {
      const target = activeNav === 'radar' ? (radarSelectedApp || 'all') : (selectedAppId || 'all');
      fetchLiveUsers(target);

      const intervalMs = activeNav === 'radar' ? 3000 : 10000;
      if (radarAutoRefresh || activeNav !== 'radar') {
        const timer = setInterval(() => {
          fetchLiveUsers(target);
        }, intervalMs);
        return () => clearInterval(timer);
      }
    }
  }, [selectedAppId, activeNav, radarSelectedApp, radarAutoRefresh]);

  // Fetch Active Sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/v1/auth/sessions', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setSessions(data.sessions);
    } catch (e) {}
  };

  // Fetch Team Data (Owner & Joined Member)
  const fetchTeamData = async () => {
    try {
      const [myRes, joinedRes] = await Promise.all([
        fetch('/api/v1/teams/my-team', { headers: getHeaders() }),
        fetch('/api/v1/teams/joined', { headers: getHeaders() })
      ]);

      const myData = await myRes.json();
      const joinedData = await joinedRes.json();

      if (myData.success && myData.hasTeam) {
        setMyTeam(myData.team);
      } else {
        setMyTeam(null);
      }

      if (joinedData.success) {
        if (joinedData.hasJoinedTeam) {
          setJoinedTeam(joinedData.team);
          setPendingJoinRequest(null);
        } else {
          setJoinedTeam(null);
          setPendingJoinRequest(joinedData.pendingRequest);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Developer & Admin Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/v1/audit-logs', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setAuditLogs(data.logs);
      fetchLogRetention();
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch 30-Day Audit Log Retention Status
  const fetchLogRetention = async () => {
    try {
      const res = await fetch('/api/v1/audit-logs/retention', { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.retention) {
        setLogRetention(data.retention);
      }
    } catch (e) {
      console.error('Failed to fetch retention status:', e);
    }
  };

  // Real-time auto-polling for open ticket thread (every 2.5s)
  useEffect(() => {
    if (!selectedTicket?.id) return;
    const interval = setInterval(() => {
      fetch(`/api/v1/tickets/${selectedTicket.id}`, { headers: getHeaders() })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.messages) {
            setTicketMessages(data.messages);
            if (data.ticket && data.ticket.status !== selectedTicket.status) {
              setSelectedTicket(prev => ({ ...prev, status: data.ticket.status }));
            }
          }
        })
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedTicket?.id, selectedTicket?.status]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (selectedTicket && ticketMessages.length > 0) {
      ticketMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketMessages.length, selectedTicket?.id]);

  // Fetch Support Tickets
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/v1/tickets', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Ticket Messages
  const fetchTicketMessages = async (ticketId) => {
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.ticket);
        setTicketMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Blacklists
  const fetchBlacklists = async () => {
    try {
      const res = await fetch('/api/v1/blacklists', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setBlacklists(data.blacklists);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Locked Users & Admin Data
  const fetchAdminData = async () => {
    if (user?.role !== 'admin') return;
    try {
      const [sRes, aRes, lRes, logRes, appRes, uRes, licRes, tRes, sysRes] = await Promise.all([
        fetch('/api/v1/admin/stats', { headers: getHeaders() }),
        fetch(`/api/v1/admin/accounts?query=${encodeURIComponent(adminSearch)}`, { headers: getHeaders() }),
        fetch('/api/v1/admin/locked-users', { headers: getHeaders() }),
        fetch('/api/v1/admin/audit-logs', { headers: getHeaders() }),
        fetch('/api/v1/admin/all-apps', { headers: getHeaders() }),
        fetch(`/api/v1/admin/all-users?query=${encodeURIComponent(adminUserSearch)}`, { headers: getHeaders() }),
        fetch(`/api/v1/admin/all-licenses?query=${encodeURIComponent(adminLicenseSearch)}`, { headers: getHeaders() }),
        fetch('/api/v1/admin/all-teams', { headers: getHeaders() }),
        fetch('/api/v1/system/config')
      ]);

      const [sData, aData, lData, logData, appData, uData, licData, tData, sysData] = await Promise.all([
        sRes.json(), aRes.json(), lRes.json(), logRes.json(), appRes.json(), uRes.json(), licRes.json(), tRes.json(), sysRes.json()
      ]);

      if (sData.success) setAdminStats(sData.stats);
      if (aData.success) setAdminAccounts(aData.accounts);
      if (lData.success) setLockedUsers(lData.lockedUsers);
      if (logData.success) setAuditLogs(logData.logs);
      if (appData.success) setAdminApps(appData.applications);
      if (uData.success) setAdminUsers(uData.users);
      if (licData.success) setAdminLicenses(licData.licenses);
      if (tData.success) setAdminTeams(tData.teams);
      if (sysData && sysData.success) {
        setAdminSystemConfig({
          maintenance_mode: sysData.maintenance_mode,
          maintenance_message: sysData.maintenance_message,
          announcement_notice: sysData.announcement_notice,
          announcement_active: sysData.announcement_active,
          landing_hero_image: sysData.landing_hero_image || '',
          landing_hero_image_active: sysData.landing_hero_image_active !== false,
          example_app_github_url: sysData.example_app_github_url || 'https://github.com/HabitAuth/HabitAuth-Example',
          discord_invite_url: sysData.discord_invite_url || 'https://discord.gg/7JX63q4Aa',
          github_url: sysData.github_url || 'https://github.com'
        });
        if (sysData.example_app_github_url) {
          setExampleAppUrl(sysData.example_app_github_url);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchApps();
    fetchSessions();
    fetchBlacklists();
    fetchTeamData();
    fetchLogRetention();
    fetch('/api/v1/system/config')
      .then(r => r.json())
      .then(data => {
        if (data && data.success) {
          if (data.example_app_github_url) {
            setExampleAppUrl(data.example_app_github_url);
          }
          setSystemMaintenance({
            active: !!data.maintenance_mode,
            message: data.maintenance_message || ''
          });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (currentAppDetails) {
      setAppSecForm({
        token_validation_enabled: !!currentAppDetails.token_validation_enabled,
        force_update_enabled: !!currentAppDetails.force_update_enabled,
        latest_version: currentAppDetails.latest_version || currentAppDetails.version || '1.0.0',
        update_download_url: currentAppDetails.update_download_url || '',
        enforce_hash_check: !!currentAppDetails.enforce_hash_check,
        expected_hash: currentAppDetails.expected_hash || '',
        auto_ban_on_hash_mismatch: currentAppDetails.auto_ban_on_hash_mismatch !== false,
        custom_key_mask: currentAppDetails.custom_key_mask || '',
        hwid_cooldown_days: currentAppDetails.hwid_cooldown_days || 7,
        hwid_self_reset_enabled: currentAppDetails.hwid_self_reset_enabled !== false,
        custom_webhook_username: currentAppDetails.custom_webhook_username || '',
        custom_webhook_avatar: currentAppDetails.custom_webhook_avatar || '',
        custom_webhook_color: currentAppDetails.custom_webhook_color || ''
      });
    }
  }, [currentAppDetails]);

  useEffect(() => {
    if (selectedAppId) {
      fetchCurrentApp(selectedAppId);
    }
  }, [selectedAppId]);

  useEffect(() => {
    if (activeNav === 'admin' || activeNav === 'security' || activeNav === 'audit' || activeNav === 'banned') {
      fetchAdminData();
      fetchSessions();
      fetchAuditLogs();
      fetchBlacklists();
      fetchLogRetention();
    }
    if (activeNav === 'tickets') {
      fetchTickets();
    }
    if (activeNav === 'teams' || activeNav === 'join-team' || activeNav === 'team-dashboard') {
      fetchTeamData();
    }
  }, [activeNav, adminSearch]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(field);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Support Ticket Action Handlers
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newTicketDesc.trim()) return;
    setIsCreatingTicket(true);
    try {
      const res = await fetch('/api/v1/tickets', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          appId: selectedAppId,
          title: newTicketTitle.trim(),
          description: newTicketDesc.trim(),
          priority: newTicketPriority,
          clientUsername: newTicketClientUser.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create ticket');
      showToast('Support ticket created successfully!');
      setShowCreateTicketModal(false);
      setNewTicketTitle('');
      setNewTicketDesc('');
      setNewTicketClientUser('');
      fetchTickets();
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSendTicketMessage = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !newTicketMessage.trim()) return;
    setIsSendingTicketMsg(true);
    try {
      const res = await fetch(`/api/v1/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: newTicketMessage.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send message');
      setNewTicketMessage('');
      fetchTicketMessages(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsSendingTicketMsg(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    if (currentUser?.role !== 'admin') {
      showToast('Permission Denied: Only administrators can update ticket status.');
      return;
    }
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update status');
      showToast(`Ticket status marked as ${status.toUpperCase()}`);
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status }));
      }
      fetchTickets();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    promptConfirm({
      title: 'Delete Support Ticket',
      message: 'Are you sure you want to permanently delete this support ticket thread? This cannot be undone.',
      confirmText: 'Delete Ticket',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/tickets/${ticketId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete ticket');
          showToast('Ticket thread deleted.');
          if (selectedTicket && selectedTicket.id === ticketId) setSelectedTicket(null);
          fetchTickets();
        } catch (err) {
          showToast(err.message);
        }
      }
    });
  };

  // Bulk Delete All Users
  const handleDeleteAllUsers = () => {
    if (!selectedAppId) return;
    promptConfirm({
      title: 'DANGER: Delete ALL Users?',
      message: `Permanently delete ALL ${appUsers.length} users and their hardware bindings for this app? This action is irreversible.`,
      confirmText: 'Yes, Delete All Users',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/apps/${selectedAppId}/users/all`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete all users');
          showToast(data.message || 'All users deleted successfully.');
          fetchCurrentApp(selectedAppId);
          fetchApps();
        } catch (err) {
          showToast(err.message);
        }
      }
    });
  };

  // Bulk Delete All Licenses
  const handleDeleteAllLicenses = () => {
    if (!selectedAppId) return;
    promptConfirm({
      title: 'DANGER: Delete ALL Licenses?',
      message: `Permanently delete ALL ${appLicenses.length} license keys for this app? All active and unused keys will be permanently destroyed. This action is irreversible.`,
      confirmText: 'Yes, Delete All Keys',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/apps/${selectedAppId}/licenses/all`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete all licenses');
          showToast(data.message || 'All licenses deleted successfully.');
          fetchCurrentApp(selectedAppId);
          fetchApps();
        } catch (err) {
          showToast(err.message);
        }
      }
    });
  };

  // Blacklist Action Handlers
  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    if (!newBlacklistValue.trim()) return;
    setIsAddingBlacklist(true);
    try {
      const targetApp = newBlacklistAppId && newBlacklistAppId !== 'global' ? newBlacklistAppId : (selectedAppId || null);
      const res = await fetch('/api/v1/blacklists', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          type: newBlacklistType,
          value: newBlacklistValue.trim(),
          reason: newBlacklistReason.trim() || 'Administrative hardware ban',
          appId: targetApp
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to blacklist');
      showToast(`${newBlacklistType === 'hwid' ? 'Hardware ID (HWID)' : 'IP'} banned successfully!`);
      setShowAddBlacklistModal(false);
      setNewBlacklistValue('');
      setNewBlacklistReason('');
      fetchBlacklists();
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsAddingBlacklist(false);
    }
  };

  const handleRemoveBlacklist = (blacklistId, value, type) => {
    promptConfirm({
      title: `Unblock ${type.toUpperCase()}`,
      message: `Are you sure you want to remove '${value}' from the blacklist? This device or IP will regain software access.`,
      confirmText: 'Unblock Access',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/blacklists/${blacklistId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.message || 'Failed to remove');
          showToast(`${type.toUpperCase()} '${value}' unblocked.`);
          fetchBlacklists();
        } catch (err) {
          showToast(err.message);
        }
      }
    });
  };

  const handleQuickBlacklistHwid = (hwid, username) => {
    if (!hwid) { showToast('User does not have a bound HWID to blacklist.'); return; }
    promptConfirm({
      title: 'Blacklist Hardware ID',
      message: `Permanently blacklist HWID '${hwid}' (User: ${username})? They will be barred from launching any client.`,
      confirmText: 'Blacklist HWID',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/blacklists', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              type: 'hwid',
              value: hwid,
              reason: `Banned from User Management (@${username})`,
              appId: selectedAppId
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.message || 'Failed to blacklist HWID');
          showToast(`HWID '${hwid}' added to blacklist.`);
          fetchBlacklists();
        } catch (err) {
          showToast(err.message);
        }
      }
    });
  };

  const handleQuickBlacklistIp = (ip, username) => {
    if (!ip) { showToast('User does not have an IP logged yet.'); return; }
    promptConfirm({
      title: 'Blacklist IP Address',
      message: `Permanently blacklist IP Address '${ip}' (User: @${username})? All login attempts and network requests from this IP will be blocked.`,
      confirmText: 'Blacklist IP',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/blacklists', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              type: 'ip',
              value: ip.trim(),
              reason: `Banned from User Management (@${username})`,
              appId: selectedAppId
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.message || 'Failed to blacklist IP');
          showToast(`IP Address '${ip}' blacklisted successfully!`);
          fetchBlacklists();
        } catch (err) {
          showToast(err.message);
        }
      }
    });
  };

  // Export Audit Logs to CSV
  const handleExportAuditLogsCsv = () => {
    if (!auditLogs || auditLogs.length === 0) {
      showToast('No audit logs to export.');
      return;
    }
    const header = 'ID,Timestamp,Event Type,Actor,App Name,IP Address,Description\n';
    const rows = auditLogs.map(l => {
      const time = new Date(l.created_at * 1000).toISOString();
      const cleanDesc = (l.description || '').replace(/"/g, '""');
      return `"${l.id}","${time}","${l.event_type}","${l.actor_name || 'System'}","${l.app_name || 'Global'}","${l.ip_address || '127.0.0.1'}","${cleanDesc}"`;
    }).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HabitAuth_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Audit logs exported successfully!');
  };

  // Export Audit Logs to JSON Backup
  const handleExportAuditLogsJson = async () => {
    try {
      const res = await fetch('/api/v1/audit-logs/export?format=json', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `HabitAuth_Audit_Logs_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Full audit logs JSON backup exported successfully!');
      } else {
        showToast(data.message || 'Export failed.');
      }
    } catch (e) {
      showToast('Failed to export JSON backup.');
    }
  };

  // Manual Trigger Audit Log Purge (Clean DB)
  const handleManualPurgeAuditLogs = async () => {
    promptConfirm({
      title: 'Purge Old Audit Logs & Vacuum DB',
      message: 'Are you sure you want to clean and purge old audit logs now? Expired records will be deleted and SQLite database vacuumed to free disk space.',
      confirmText: 'Purge & Vacuum',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: async () => {
        try {
          setIsPurgingLogs(true);
          const res = await fetch('/api/v1/audit-logs/purge', {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message, 'success');
            if (data.retention) setLogRetention(data.retention);
            fetchAuditLogs();
          } else {
            showToast(data.message || 'Failed to purge logs.', 'error');
          }
        } catch (e) {
          showToast('Purge request failed: ' + e.message, 'error');
        } finally {
          setIsPurgingLogs(false);
        }
      }
    });
    return;
    try {
      setIsPurgingLogs(true);
      const res = await fetch('/api/v1/audit-logs/purge', {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        if (data.retention) setLogRetention(data.retention);
        fetchAuditLogs();
      } else {
        showToast(data.message || 'Failed to purge logs.');
      }
    } catch (e) {
      showToast('Purge request failed: ' + e.message);
    } finally {
      setIsPurgingLogs(false);
    }
  };

  // Simulator for Developer Testing of Badges & Alerts
  const handleSimulateRetentionDay = async (targetDay) => {
    try {
      const res = await fetch('/api/v1/audit-logs/retention/simulate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targetDay })
      });
      const data = await res.json();
      if (data.success) {
        setLogRetention(data.retention);
        showToast(data.message);
      } else {
        showToast(data.message || 'Simulation failed.');
      }
    } catch (e) {
      showToast('Failed to simulate retention: ' + e.message);
    }
  };

  // 1. Create Application (App Name ONLY!)
  const handleCreateApp = async (e) => {
    e.preventDefault();
    if (isMaintenanceLocked) { showToast('System Maintenance: Creating apps is locked.'); return; }
    if (!newAppName.trim()) return;

    try {
      const res = await fetch('/api/v1/apps', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ app_name: newAppName.trim(), version: newAppVersion.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Application creation failed');

      showToast(`Application '${newAppName}' created!`);
      setShowCreateAppModal(false);
      setNewAppName('');
      fetchApps();
      setSelectedAppId(data.application.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 2. Regenerate App Secret
  const handleRegenerateSecret = () => {
    if (isMaintenanceLocked) { showToast('System Maintenance: Regenerating secret is locked.'); return; }
    promptConfirm({
      title: 'Regenerate App Secret',
      message: 'Regenerating your App Secret will immediately invalidate the existing secret. Any server integrations using the old secret will fail. Proceed?',
      confirmText: 'Regenerate Secret',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/apps/${selectedAppId}/regenerate-secret`, {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast('App Secret regenerated!');
            fetchCurrentApp(selectedAppId);
          } else {
            showToast(data.message || 'Failed to regenerate secret.', 'error');
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  // 2b. Delete Application (Developer Scope)
  const handleDeleteApp = (appId, appName) => {
    if (isMaintenanceLocked) { showToast('System Maintenance: Deleting apps is locked.'); return; }
    const targetId = appId || selectedAppId;
    const targetName = appName || currentAppDetails?.app_name || 'this application';
    promptConfirm({
      title: 'Delete Application',
      message: `Are you sure you want to permanently delete '${targetName}' (${targetId})? All client user accounts, license keys, devices, and webhook integrations for this app will be deleted forever. This action cannot be undone.`,
      confirmText: 'Delete Application',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/apps/${targetId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(`Application '${targetName}' deleted successfully.`);
            const remaining = apps.filter(a => a.id !== targetId);
            setApps(remaining);
            if (selectedAppId === targetId) {
              if (remaining.length > 0) {
                setSelectedAppId(remaining[0].id);
                fetchCurrentApp(remaining[0].id);
              } else {
                setSelectedAppId('');
                setCurrentAppDetails(null);
                setActiveNav('overview');
                window.history.pushState({}, '', '/overview');
              }
            }
            fetchApps();
          } else {
            showToast(data.message || 'Failed to delete application.', 'error');
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  // 3. Manually Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (isMaintenanceLocked) { showToast('System Maintenance: Adding users is locked.'); return; }
    if (!newUsername.trim() || !newUserPassword.trim() || isSubmittingUser) return;

    const targetAppId = selectedAppId || apps[0]?.id;
    if (!targetAppId) {
      showToast('Please select or create an application first.', 'error');
      return;
    }

    setIsSubmittingUser(true);
    try {
      const res = await fetch(`/api/v1/apps/${targetAppId}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newUserPassword.trim(),
          license_key: newUserLicense,
          expiry_date: newUserExpiry,
          hwid_lock: newUserHwidLock
        })
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Server returned non-JSON (${res.status}): ${text.slice(0, 100)}`);
      }

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to add user');

      showToast(data.message);
      setShowAddUserModal(false);
      setNewUsername('');
      setNewUserPassword('');
      setNewUserLicense('MANUAL_BYPASS');
      setNewUserExpiry('');
      fetchCurrentApp(targetAppId);
      fetchApps();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // 3b. Edit User Handlers
  const startEditUser = (u) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditPassword('');
    setEditExpiry(u.expires_at ? new Date(u.expires_at * 1000).toISOString().split('T')[0] : '');
    setEditStatus(u.status || 'active');
    setShowEditUserModal(true);
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (isMaintenanceLocked) { showToast('System Maintenance: Editing users is locked.'); return; }
    if (!editingUser || isSavingEdit) return;

    const targetAppId = selectedAppId || apps[0]?.id;
    if (!targetAppId) {
      showToast('Target application is required.', 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/v1/apps/${targetAppId}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          username: editUsername.trim(),
          password: editPassword.trim() || undefined,
          expiry_date: editExpiry || null,
          status: editStatus
        })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Server returned invalid response (${res.status})`);
      }

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update user');

      showToast(data.message);
      setShowEditUserModal(false);
      fetchCurrentApp(targetAppId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 4. Generate Licenses
  const handleGenerateLicenses = async (e) => {
    e.preventDefault();
    if (isMaintenanceLocked) { showToast('System Maintenance: Generating licenses is locked.'); return; }
    setIsGenerating(true);
    const resolvedDuration = genDuration === 'custom' 
      ? Math.max(parseInt(customGenDuration, 10) || 1, 1) 
      : parseInt(genDuration, 10) || 0;

    try {
      const res = await fetch(`/api/v1/apps/${selectedAppId}/licenses/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          count: parseInt(genCount) || 1,
          duration_days: resolvedDuration,
          prefix: genPrefix.trim() || 'HABIT',
          note: genNote.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Generation failed');

      showToast(data.message);
      setShowGenLicenseModal(false);
      fetchCurrentApp(selectedAppId);
      fetchApps();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. Reset HWID for User
  const handleResetUserHwid = async (userId) => {
    if (isMaintenanceLocked) { showToast('System Maintenance: Resetting HWID is locked.'); return; }
    try {
      const res = await fetch(`/api/v1/apps/${selectedAppId}/users/${userId}/reset-hwid`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast('HWID reset successfully!');
        fetchCurrentApp(selectedAppId);
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // 6. Reset SID for User
  const handleResetUserSid = async (userId) => {
    try {
      const res = await fetch(`/api/v1/apps/${selectedAppId}/users/${userId}/reset-sid`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast('SID reset successfully!');
        fetchCurrentApp(selectedAppId);
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Ban Action Execution (with Reason)
  const executeBanToggle = async (type, id, reason = 'Terms of Service violation', action = 'ban') => {
    setIsSubmittingBan(true);
    try {
      let url = '';
      if (type === 'account') url = `/api/v1/admin/accounts/${id}/toggle-ban`;
      else if (type === 'admin_user') url = `/api/v1/admin/users/${id}/toggle-ban`;
      else if (type === 'app_user') url = `/api/v1/apps/${selectedAppId}/users/${id}/toggle-ban`;

      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setBanReasonModal(null);
        if (type === 'account' || type === 'admin_user') {
          fetchAdminData();
        } else {
          fetchCurrentApp(selectedAppId);
        }
      } else {
        showToast(data.message || 'Failed to update ban status', 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setIsSubmittingBan(false);
    }
  };

  // 7. Toggle Ban User
  const handleToggleBanUser = (userId, username, status) => {
    if (isMaintenanceLocked) { showToast('System Maintenance: Changing user ban status is locked.'); return; }
    if (status === 'banned') {
      executeBanToggle('app_user', userId, '', 'unban');
    } else {
      setBanReasonModal({
        type: 'app_user',
        id: userId,
        name: username || userId,
        reason: 'Violation of software licensing terms'
      });
    }
  };

  // 8. Unlock User (Manual unlock before 24h lockout)
  const handleUnlockUser = async (userId) => {
    try {
      const res = await fetch(`/api/v1/apps/${selectedAppId}/users/${userId}/unlock`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchCurrentApp(selectedAppId);
        fetchAdminData();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Update Application Version
  const handleUpdateAppVersion = async (e) => {
    e.preventDefault();
    if (!selectedAppId) return;
    setIsUpdatingVersion(true);
    try {
      const res = await fetch(`/api/v1/apps/${selectedAppId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ version: editAppVersion.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update version');
      showToast(`Application version updated to v${editAppVersion.trim()}!`);
      setShowEditVersionModal(false);
      fetchCurrentApp(selectedAppId);
      fetchApps();
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsUpdatingVersion(false);
    }
  };

  // Top-Tier Premium: Bulk Generate Licenses
  const handleBulkGenerateLicenses = async (e) => {
    e.preventDefault();
    if (!selectedAppId) {
      showToast('Please select or create an application first.');
      return;
    }
    setIsBulkGenerating(true);
    try {
      const res = await fetch(`/api/v1/apps/${selectedAppId}/licenses/bulk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          count: bulkGenCount,
          duration_days: bulkGenDuration,
          mask: bulkGenMask,
          note: bulkGenNote
        })
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error('Server returned an unexpected response. Please try again.');
      }
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to bulk generate licenses.');
      }
      showToast(`Bulk created ${data.count} keys successfully!`);
      setBulkGeneratedKeys(data.keys || []);
      fetchCurrentApp(selectedAppId);
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsBulkGenerating(false);
    }
  };

  // Top-Tier Premium: Export Licenses
  const handleExportLicenses = (format = 'txt') => {
    if (!selectedAppId) return;
    const token = localStorage.getItem('habit_token');
    const url = `/api/v1/apps/${selectedAppId}/licenses/export?format=${format}&status=${exportStatus}`;
    
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${currentAppDetails?.app_name || 'licenses'}_${exportStatus}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(`Licenses exported as .${format.toUpperCase()}!`);
        setShowExportModal(false);
      })
      .catch(e => showToast('Failed to export licenses: ' + e.message));
  };

  // Top-Tier Premium: Freeze / Resume Subscriptions
  const handleToggleFreezeLicenses = () => {
    if (!selectedAppId) return;
    const isFrozen = !!currentAppDetails?.subscriptions_frozen;
    promptConfirm({
      title: isFrozen ? 'Resume Subscriptions' : 'Freeze All Subscriptions',
      message: isFrozen
        ? 'Resume all subscriptions now? Active users will automatically receive extra validity days to compensate for the maintenance downtime.'
        : 'Freeze all active subscriptions and licenses now? Expiration timers will be PAUSED immediately so users do not lose time while software is updating.',
      confirmText: isFrozen ? 'Resume & Extend Validity' : 'Freeze Subscriptions',
      isDanger: !isFrozen,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/apps/${selectedAppId}/licenses/toggle-freeze`, {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchCurrentApp(selectedAppId);
          } else {
            showToast(data.message);
          }
        } catch (e) {
          showToast('Failed to toggle freeze: ' + e.message);
        }
      }
    });
  };

  // Top-Tier Premium: Remote Session Kill Switch (Instant Termination & Persistent Lock)
  const handleKillSession = (userId, username, targetAppId) => {
    const appIdToUse = targetAppId || selectedAppId;
    promptConfirm({
      title: 'Remote Kill Session',
      message: `Remotely terminate active session for @${username}? Their running software will exit immediately, and any new login attempts will be killed.`,
      confirmText: 'Kill Session',
      isDanger: true,
      onConfirm: async () => {
        try {
          // Optimistic UI update: instantly mark as killed in UI state
          setLiveUsers(prev => prev.map(u => u.id === userId ? { ...u, is_killed: true, session_killed: 1 } : u));

          const res = await fetch(`/api/v1/apps/${appIdToUse}/users/${userId}/kill-session`, {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchLiveUsers(appIdToUse);
            if (appIdToUse && appIdToUse !== 'all') fetchCurrentApp(appIdToUse);
          } else {
            showToast(data.message);
            fetchLiveUsers(appIdToUse);
          }
        } catch (e) {
          showToast('Kill failed: ' + e.message);
          fetchLiveUsers(appIdToUse);
        }
      }
    });
  };

  // Revive Killed Session (Re-enable access)
  const handleReviveSession = async (userId, username, targetAppId) => {
    const appIdToUse = targetAppId || selectedAppId;
    try {
      setLiveUsers(prev => prev.map(u => u.id === userId ? { ...u, is_killed: false, session_killed: 0 } : u));
      const res = await fetch(`/api/v1/apps/${appIdToUse}/users/${userId}/revive-session`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchLiveUsers(appIdToUse);
      } else {
        showToast(data.message);
        fetchLiveUsers(appIdToUse);
      }
    } catch (e) {
      showToast('Revive failed: ' + e.message);
    }
  };

  // Emergency Kill All Active Sessions
  const handleKillAllSessions = (targetAppId) => {
    const appIdToUse = targetAppId || (radarSelectedApp !== 'all' ? radarSelectedApp : selectedAppId);
    if (!appIdToUse || appIdToUse === 'all') {
      showToast('Please select a specific application from the dropdown to engage emergency killswitch.');
      return;
    }

    const appObj = apps.find(a => a.id === appIdToUse);
    const appName = appObj ? appObj.app_name : 'this application';

    promptConfirm({
      title: 'Emergency Kill All Sessions',
      message: `Engage emergency killswitch for '${appName}'? This will instantly terminate ALL currently connected clients and block new logins.`,
      confirmText: 'Engage Killswitch',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/apps/${appIdToUse}/kill-all-sessions`, {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchLiveUsers(appIdToUse);
          } else {
            showToast(data.message);
          }
        } catch (e) {
          showToast('Emergency kill failed: ' + e.message);
        }
      }
    });
  };

  // Top-Tier Premium: Save App Security & White-Label Config
  const handleSaveAppSecurityConfig = async (e) => {
    e.preventDefault();
    if (!selectedAppId) return;
    setIsSavingSec(true);
    try {
      const res = await fetch(`/api/v1/apps/${selectedAppId}/security-config`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(appSecForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save security settings');
      showToast(data.message);
      fetchCurrentApp(selectedAppId);
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsSavingSec(false);
    }
  };

  // 9. Delete User (Using In-Website Confirmation)
  const handleDeleteUser = (userId, username) => {
    if (isMaintenanceLocked) { showToast('System Maintenance: Deleting users is locked.'); return; }
    promptConfirm({
      title: 'Permanently Delete User',
      message: `Are you sure you want to permanently delete user '${username || 'this user'}'? All license bindings, HWID associations, and sessions will be destroyed immediately.`,
      confirmText: 'Delete User',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/apps/${selectedAppId}/users/${userId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast('User deleted.');
            fetchCurrentApp(selectedAppId);
            fetchApps();
          } else {
            showToast(data.message || 'Failed to delete user', 'error');
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  // 10. Revoke License
  const handleRevokeLicense = (licId, key) => {
    if (isMaintenanceLocked) { showToast('System Maintenance: Revoking licenses is locked.'); return; }
    promptConfirm({
      title: 'Revoke License Key',
      message: `Are you sure you want to revoke license key '${key || licId}'? The activated client will be barred from authentication immediately.`,
      confirmText: 'Revoke License',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/apps/${selectedAppId}/licenses/${licId}/revoke`, {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchCurrentApp(selectedAppId);
          } else {
            showToast(data.message || 'Failed to revoke license', 'error');
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  // Delete Individual License Key
  const handleDeleteLicense = (licId, key) => {
    if (isMaintenanceLocked) { showToast('System Maintenance: Deleting licenses is locked.'); return; }
    promptConfirm({
      title: 'Permanently Delete License Key',
      message: `Permanently delete license key '${key || licId}'? This key will be destroyed immediately and cannot be recovered.`,
      confirmText: 'Delete License',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/apps/${selectedAppId}/licenses/${licId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message || 'License deleted.');
            fetchCurrentApp(selectedAppId);
            fetchApps();
          } else {
            showToast(data.message || 'Failed to delete license', 'error');
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  // Reset License Bound HWID
  const handleResetLicenseHwid = async (licId, key) => {
    try {
      const res = await fetch(`/api/v1/apps/${selectedAppId}/licenses/${licId}/reset-hwid`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Hardware profile reset.');
        fetchCurrentApp(selectedAppId);
      } else {
        showToast(data.message || 'Failed to reset hardware profile', 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // 11. Run API Playground Request
  const handlePlaygroundSend = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    try {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(playgroundBody);
      } catch (jsonErr) {
        showToast('Invalid JSON in request body: ' + jsonErr.message, 'error');
        setPlaygroundLoading(false);
        return;
      }

      const res = await fetch(playgroundEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBody)
      });
      const data = await res.json();
      setPlaygroundResponse({
        status: res.status,
        statusText: res.statusText,
        data
      });
    } catch (err) {
      setPlaygroundResponse({
        status: 500,
        statusText: 'Network / Client Error',
        data: { error: err.message }
      });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  // 12. Session Management Actions
  const handleRevokeSession = async (sessionId) => {
    try {
      const res = await fetch(`/api/v1/auth/sessions/${sessionId}`, { method: 'DELETE', headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        showToast('Session revoked.');
        fetchSessions();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleLogoutAllOther = () => {
    promptConfirm({
      title: 'Log Out Other Sessions',
      message: 'Are you sure you want to log out of all other active browser and desktop sessions?',
      confirmText: 'Log Out Others',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/auth/sessions/logout-other', { method: 'POST', headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchSessions();
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  const handleLogoutAll = () => {
    promptConfirm({
      title: 'Log Out of ALL Sessions',
      message: 'Log out of ALL sessions including this one? You will be signed out of this dashboard immediately.',
      confirmText: 'Log Out Everywhere',
      isDanger: true,
      onConfirm: async () => {
        try {
          await fetch('/api/v1/auth/sessions/logout-all', { method: 'POST', headers: getHeaders() });
          onLogout();
        } catch (e) {
          onLogout();
        }
      }
    });
  };

  // ── TEAM COLLABORATION HANDLERS ────────────────────────────
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (isFreePlan) {
      showToast('Team creation is exclusive to Developer Plan subscribers ($1.20/mo).');
      if (onUpgradeClick) onUpgradeClick();
      return;
    }
    if (isMaintenanceLocked) {
      showToast('System Maintenance: Creating teams is locked.');
      return;
    }
    if (!newTeamName.trim()) return;
    try {
      const res = await fetch('/api/v1/teams', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: newTeamName.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create team');
      showToast(data.message);
      setShowCreateTeamModal(false);
      setNewTeamName('');
      fetchTeamData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCloseTeam = () => {
    promptConfirm({
      title: 'Disband & Close Team',
      message: `Are you sure you want to close team '${myTeam?.name}'? This will permanently disband the team, invalidate all invite codes, and revoke dashboard access for all members.`,
      confirmText: 'Close & Disband Team',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/teams/${myTeam.id}`, { method: 'DELETE', headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchTeamData();
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  const handleRegenTeamCode = () => {
    promptConfirm({
      title: 'Regenerate Team Invite Code',
      message: 'Are you sure? This will instantly invalidate the previous team code. Old invite links will no longer function.',
      confirmText: 'Regenerate Code',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/teams/regen-code', { method: 'POST', headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            showToast('New invite code generated!');
            fetchTeamData();
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  const handleJoinTeamSubmit = async (e) => {
    e.preventDefault();
    if (!teamInviteCodeInput.trim() || isJoiningTeam) return;
    setIsJoiningTeam(true);
    try {
      const res = await fetch('/api/v1/teams/join-request', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code: teamInviteCodeInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to submit join request');
      showToast(data.message);
      setTeamInviteCodeInput('');
      fetchTeamData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsJoiningTeam(false);
    }
  };

  const handleCancelJoinRequest = () => {
    promptConfirm({
      title: 'Cancel Join Request',
      message: 'Are you sure you want to cancel your pending team join request?',
      confirmText: 'Cancel Request',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/teams/join-request/cancel', { method: 'DELETE', headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchTeamData();
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  const handleAcceptMember = async (memberId) => {
    try {
      const res = await fetch(`/api/v1/teams/${myTeam.id}/members/${memberId}/accept`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to accept member');
      showToast(data.message);
      fetchTeamData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectMember = (memberId) => {
    promptConfirm({
      title: 'Reject Join Request',
      message: 'Reject this user request to join your team?',
      confirmText: 'Reject Request',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/teams/${myTeam.id}/members/${memberId}/reject`, {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchTeamData();
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleStartEditPermissions = (member) => {
    setEditingMember(member);
    setMemberRole(member.role || 'developer');
    setMemberPerms(member.permissions || {
      manage_users: true,
      manage_licenses: true,
      view_analytics: true,
      manage_webhooks: false,
      api_access: false
    });
    setShowMemberPermsModal(true);
  };

  const handleSaveMemberPermissions = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const res = await fetch(`/api/v1/teams/${myTeam.id}/members/${editingMember.id}/permissions`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ role: memberRole, permissions: memberPerms })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update permissions');
      showToast(data.message);
      setShowMemberPermsModal(false);
      fetchTeamData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleKickMember = (memberId, username) => {
    promptConfirm({
      title: 'Kick Team Member',
      message: `Are you sure you want to remove '${username}' from the team? They will lose access to team applications immediately.`,
      confirmText: 'Kick Member',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/teams/${myTeam.id}/members/${memberId}/kick`, {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchTeamData();
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleOpenBlacklistModal = (member) => {
    setBlacklistingMember(member);
    setBlacklistReason('Violated team policies');
    setShowBlacklistModal(true);
  };

  const handleConfirmBlacklist = async (e) => {
    e.preventDefault();
    if (!blacklistingMember) return;
    try {
      const res = await fetch(`/api/v1/teams/${myTeam.id}/members/${blacklistingMember.id}/blacklist`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason: blacklistReason })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to blacklist user');
      showToast(data.message);
      setShowBlacklistModal(false);
      fetchTeamData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUnblacklist = (blacklistId) => {
    promptConfirm({
      title: 'Remove from Blacklist',
      message: 'Remove this user from the blacklist? They will be allowed to send join requests again.',
      confirmText: 'Unblock User',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/teams/${myTeam.id}/blacklist/${blacklistId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchTeamData();
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Team Member Scoped View Handlers
  const handleOpenTeamAppUsers = async (appId, appName) => {
    try {
      const res = await fetch(`/api/v1/teams/joined/apps/${appId}/users`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setTeamAppScope({
          appId,
          appName: data.app_name || appName,
          users: data.users || [],
          activeTab: 'users'
        });
      } else {
        showToast(data.message);
      }
    } catch (e) {
      showToast('Error loading team users: ' + e.message);
    }
  };

  const handleOpenTeamAppLicenses = async (appId, appName) => {
    try {
      const res = await fetch(`/api/v1/teams/joined/apps/${appId}/licenses`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setTeamAppScope({
          appId,
          appName: data.app_name || appName,
          licenses: data.licenses || [],
          activeTab: 'licenses'
        });
      } else {
        showToast(data.message);
      }
    } catch (e) {
      showToast('Error loading team licenses: ' + e.message);
    }
  };

  const handleLeaveTeam = () => {
    promptConfirm({
      title: 'Leave Team Workspace',
      message: `Are you sure you want to leave team '${joinedTeam?.team_name}'? You will forfeit access to all shared team applications, users, and licenses.`,
      confirmText: 'Leave Team',
      cancelText: 'Stay in Team',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/teams/leave', {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            setJoinedTeam(null);
            setTeamAppScope(null);
            fetchTeamData();
            setActiveNav('overview');
            window.history.pushState({}, '', '/overview');
          } else {
            showToast(data.message);
          }
        } catch (e) {
          showToast('Failed to leave team: ' + e.message);
        }
      }
    });
  };

  // ── SUPER ADMIN MASTER CONTROLS HANDLERS ────────────────────
  const handleAdminToggleBanAccount = (accId, username, status) => {
    if (status === 'banned') {
      executeBanToggle('account', accId, '', 'unban');
    } else {
      setBanReasonModal({
        type: 'account',
        id: accId,
        name: username,
        reason: 'Violation of platform Terms of Service'
      });
    }
  };

  const handleAdminDeleteAccount = (accId, username) => {
    promptConfirm({
      title: 'Master Delete Account',
      message: `Permanently delete account '${username}'? This will delete all their applications, end-users, licenses, and teams.`,
      confirmText: 'Delete Account',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/admin/accounts/${accId}`, { method: 'DELETE', headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchAdminData();
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  const handleAdminDeleteApp = (appId, appName) => {
    promptConfirm({
      title: 'Master Delete Application',
      message: `Permanently delete application '${appName}' (${appId})? All its client users and licenses will be deleted.`,
      confirmText: 'Delete Application',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/admin/apps/${appId}`, { method: 'DELETE', headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchAdminData();
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  const handleAdminToggleBanUser = (userId, username, status) => {
    if (status === 'banned') {
      executeBanToggle('admin_user', userId, '', 'unban');
    } else {
      setBanReasonModal({
        type: 'admin_user',
        id: userId,
        name: username || userId,
        reason: 'Violation of Terms of Service'
      });
    }
  };

  // Direct Credentials Save Handler
  const handleSaveDirectCredentials = async (e) => {
    if (e) e.preventDefault();
    setDirectCredsError('');

    if (!directCredsUsername.trim() || directCredsUsername.trim().length < 3) {
      setDirectCredsError('Username must be at least 3 characters.');
      return;
    }
    if (!directCredsPassword || directCredsPassword.length < 6) {
      setDirectCredsError('Password must be at least 6 characters long.');
      return;
    }

    setDirectCredsSaving(true);
    try {
      const res = await fetch('/api/v1/auth/set-credentials', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          username: directCredsUsername.trim(),
          password: directCredsPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setCurrentUser(prev => {
          const updated = { ...prev, username: data.username, has_password: true };
          localStorage.setItem('habit_user', JSON.stringify(updated));
          return updated;
        });
        setShowDirectCredsModal(false);
        setDirectCredsPassword('');
      } else {
        setDirectCredsError(data.message || 'Failed to save credentials.');
      }
    } catch (err) {
      setDirectCredsError(err.message || 'Connection error.');
    } finally {
      setDirectCredsSaving(false);
    }
  };

  const handleAdminDeleteUser = (userId, username) => {
    promptConfirm({
      title: 'Master Delete User',
      message: `Permanently delete client user '${username}'?`,
      confirmText: 'Delete User',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/admin/users/${userId}`, { method: 'DELETE', headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchAdminData();
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  const handleAdminDeleteLicense = (licenseId, key) => {
    promptConfirm({
      title: 'Master Delete License',
      message: `Permanently delete license '${key || licenseId}'?`,
      confirmText: 'Delete License',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/admin/licenses/${licenseId}`, { method: 'DELETE', headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchAdminData();
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  const handleAdminDisbandTeam = (teamId, teamName) => {
    promptConfirm({
      title: 'Master Disband Team',
      message: `Permanently disband and delete team '${teamName}'?`,
      confirmText: 'Disband Team',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/admin/teams/${teamId}`, { method: 'DELETE', headers: getHeaders() });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchAdminData();
          }
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  };

  const handleAdminKickTeamMember = (teamId, memberId, username, teamName) => {
    promptConfirm({
      title: 'Kick Member from Team',
      message: `Are you sure you want to kick @${username} from team '${teamName}'?`,
      confirmText: 'Kick Member',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/teams/${teamId}/members/${memberId}/kick`, {
            method: 'POST',
            headers: getHeaders()
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchAdminData();
          } else {
            showToast(data.message);
          }
        } catch (e) {
          showToast('Failed to kick member: ' + e.message);
        }
      }
    });
  };

  const handleAdminBanTeamMember = (teamId, memberId, username, teamName) => {
    promptConfirm({
      title: 'Ban Member from Team',
      message: `Are you sure you want to ban and blacklist @${username} from team '${teamName}'? They will not be able to rejoin this team.`,
      confirmText: 'Ban Member',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/teams/${teamId}/members/${memberId}/blacklist`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason: 'Banned by Super Administrator' })
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchAdminData();
          } else {
            showToast(data.message);
          }
        } catch (e) {
          showToast('Failed to ban member: ' + e.message);
        }
      }
    });
  };

  const handleAdminSaveMaintenance = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/admin/maintenance', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          enabled: adminSystemConfig.maintenance_mode,
          message: adminSystemConfig.maintenance_message
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchAdminData();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAdminSaveNotice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/admin/notice', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          notice: adminSystemConfig.announcement_notice,
          active: adminSystemConfig.announcement_active
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchAdminData();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAdminSaveSdkConfig = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch('/api/v1/admin/sdk-config', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          example_app_github_url: adminSystemConfig.example_app_github_url
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Example App GitHub URL updated successfully!');
        if (data.example_app_github_url) {
          setExampleAppUrl(data.example_app_github_url);
        }
        fetchAdminData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAdminSaveHeroImage = async (e, customActive) => {
    if (e) e.preventDefault();
    try {
      const activeState = customActive !== undefined ? customActive : adminSystemConfig.landing_hero_image_active;
      const res = await fetch('/api/v1/admin/hero-image', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          image_url: adminSystemConfig.landing_hero_image,
          active: activeState
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Landing hero image saved!');
        fetchAdminData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be under 15MB', 'error');
      return;
    }

    setIsUploadingHeroImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        const res = await fetch('/api/v1/admin/upload-image', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ image: base64Data, filename: file.name })
        });
        const data = await res.json();
        setIsUploadingHeroImage(false);

        if (data.success && data.url) {
          setAdminSystemConfig(prev => ({
            ...prev,
            landing_hero_image: data.url,
            landing_hero_image_active: true
          }));
          await fetch('/api/v1/admin/hero-image', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
              image_url: data.url,
              active: true
            })
          });
          showToast('Landing Page Hero image uploaded and updated successfully!', 'success');
          fetchAdminData();
        } else {
          showToast(data.message || 'Image upload failed', 'error');
        }
      };
      reader.onerror = () => {
        setIsUploadingHeroImage(false);
        showToast('Failed to read image file', 'error');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploadingHeroImage(false);
      showToast('Failed to upload image: ' + err.message, 'error');
    }
  };

  const fetchDatabaseStats = async () => {
    if (user?.role !== 'admin') return;
    setLoadingDbStats(true);
    try {
      const res = await fetch('/api/v1/admin/database/stats', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setDbStats(data);
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoadingDbStats(false);
    }
  };

  const handleExecuteDatabaseAction = async (actionName) => {
    try {
      const res = await fetch('/api/v1/admin/database/action', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: actionName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Database action executed successfully!');
        fetchDatabaseStats();
        fetchAdminData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAdminGenerateResetLink = async (userId, username) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/generate-reset-link`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setResetLinkModalData({
          username: username,
          reset_token: data.reset_token,
          reset_link: data.reset_link || `${window.location.origin}/reset-password?token=${data.reset_token}`,
          expires_in: data.expires_in || '24 hours'
        });
        setCopiedResetLink(false);
      } else {
        showToast(data.message || 'Failed to generate reset link', 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleAdminSaveSocialLinks = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch('/api/v1/admin/social-links', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          discord_invite_url: adminSystemConfig.discord_invite_url,
          github_url: adminSystemConfig.github_url
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Official community links updated successfully!');
        fetchAdminData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleBroadcastImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be under 15MB', 'error');
      return;
    }

    setIsUploadingBroadcastImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        const res = await fetch('/api/v1/admin/upload-image', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ image: base64Data, filename: file.name })
        });
        const data = await res.json();
        setIsUploadingBroadcastImage(false);

        if (data.success && data.url) {
          setBroadcastImage(data.url);
          showToast('Image uploaded successfully!', 'success');
        } else {
          showToast(data.message || 'Image upload failed', 'error');
        }
      };
      reader.onerror = () => {
        setIsUploadingBroadcastImage(false);
        showToast('Failed to read image file', 'error');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploadingBroadcastImage(false);
      showToast('Failed to upload image: ' + err.message, 'error');
    }
  };

  const handleSendBroadcastNotification = async (e) => {
    if (e) e.preventDefault();

    if (!broadcastTitle.trim()) {
      showToast('Please enter a notification title', 'warning');
      return;
    }

    if (!broadcastMessage.trim()) {
      showToast('Please enter a notification message', 'warning');
      return;
    }

    const target_plans = [];
    if (broadcastTargetFree) target_plans.push('free');
    if (broadcastTargetDev) target_plans.push('developer');
    if (broadcastTargetPro) target_plans.push('pro');

    if (target_plans.length === 0) {
      showToast('Please select at least one target plan (Free, Developer, or Pro)', 'warning');
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const res = await fetch('/api/v1/admin/broadcast-notification', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          link_url: broadcastLink,
          image_url: broadcastImage,
          type: broadcastType,
          target_plans
        })
      });
      const data = await res.json();
      setIsSendingBroadcast(false);

      if (data.success) {
        showToast(data.message || 'Broadcast notification sent!', 'success');
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastLink('');
        setBroadcastImage('');
        setBroadcastType('info');
        fetchInWebNotifications();
      } else {
        showToast(data.message || 'Failed to send broadcast', 'error');
      }
    } catch (err) {
      setIsSendingBroadcast(false);
      showToast('Network error sending broadcast: ' + err.message, 'error');
    }
  };

  // Calculation totals
  const totalAppsCount = apps.length;
  const totalUsersCount = apps.reduce((acc, a) => acc + (a.total_users || 0), 0);
  const totalLicensesCount = apps.reduce((acc, a) => acc + (a.total_licenses || 0), 0);
  const activeLicensesCount = apps.reduce((acc, a) => acc + (a.active_licenses || 0), 0);

  const unusedLicenses = appLicenses.filter(l => l.status === 'unused');

  // Filtered Users
  const filteredUsers = appUsers.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.hwid && u.hwid.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.license_key && u.license_key.toLowerCase().includes(userSearch.toLowerCase()));
    if (!matchSearch) return false;
    if (userFilter === 'active') return u.status === 'active';
    if (userFilter === 'locked') return u.status === 'locked' || u.is_locked;
    if (userFilter === 'banned') return u.status === 'banned';
    return true;
  });

  // Filtered Licenses
  const filteredLicenses = appLicenses.filter(l => {
    const matchSearch = l.license_key.toLowerCase().includes(licenseSearch.toLowerCase()) ||
      (l.bound_username && l.bound_username.toLowerCase().includes(licenseSearch.toLowerCase()));
    if (!matchSearch) return false;
    if (licenseFilter === 'active') return l.status === 'active';
    if (licenseFilter === 'unused') return l.status === 'unused';
    if (licenseFilter === 'revoked') return l.status === 'revoked';
    return true;
  });

  const activeUser = currentUser || user;
  const currentPlan = activeUser?.plan || 'free';
  const isSuperAdmin = activeUser?.role === 'admin';
  const isExpired = activeUser?.sub_status === 'expired';
  const isFreePlan = (currentPlan === 'free' && !isSuperAdmin) || isExpired;
  const isDevPlan = currentPlan === 'developer' && !isSuperAdmin && !isExpired;
  const isProPlan = (currentPlan === 'pro' || isSuperAdmin) && !isExpired;
  const maxAppsAllowed = isSuperAdmin ? 999999 : (isProPlan ? 1000 : (isDevPlan ? 100 : 1));

  // 15-Day Unlocked Badge Logic:
  // Features unlocked by upgrading display an "UNLOCKED" badge for 15 days.
  // After 15 days, "UNLOCKED" text is hidden ("muche jabe") while subscription remains active.
  // If subscription expires, feature locks and Crown (👑) icon reappears.
  const nowTs = Math.floor(Date.now() / 1000);
  const subStartedAt = activeUser?.sub_started_at || 0;
  const isWithin15Days = !isExpired && (!subStartedAt || ((nowTs - subStartedAt) <= 15 * 86400));

  if (initialLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090714',
        gap: '20px'
      }}>
        <div style={{ position: 'relative', width: '56px', height: '56px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '3px solid rgba(59, 130, 246, 0.15)',
            borderTopColor: '#3b82f6',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.3)',
            filter: 'blur(8px)'
          }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
            HABIT AUTH
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            Synchronizing dashboard & security suite...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
      <div className="dashboard-bg-glow"></div>

      {/* ── MOBILE STICKY HEADER ─────────────────────────────── */}
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-toggle-btn"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle Mobile Navigation Drawer"
        >
          {mobileSidebarOpen ? <X size={22} color="#ffffff" /> : <Menu size={22} color="#ffffff" />}
        </button>

        <div 
          className="mobile-brand-title"
          onClick={() => {
            setMobileSidebarOpen(false);
            if (onBackToLanding) onBackToLanding();
            else window.location.href = '/';
          }}
          style={{ cursor: 'pointer' }}
        >
          HABIT AUTH
        </div>

        <div className="mobile-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Mobile Language Switcher Pill */}
          <button
            type="button"
            className="mobile-header-lang-btn"
            onClick={() => setLangDropdownOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '11px',
              cursor: 'pointer',
              lineHeight: 1
            }}
            title={t('switchLang')}
          >
            <Globe size={12} color="#60a5fa" />
            <span style={{ fontSize: '13px' }}>{currentLanguageObj?.flag}</span>
            <span style={{ fontWeight: 600, fontSize: '10.5px' }}>{currentLanguageObj?.label}</span>
          </button>

          {isFreePlan ? (
            <button 
              className="btn btn-warning btn-sm" 
              onClick={() => { setMobileSidebarOpen(false); if (onUpgradeClick) onUpgradeClick('developer'); }}
              style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Crown size={12} fill="#f59e0b" /> $1.20/mo
            </button>
          ) : (
            <span className="badge badge-success" style={{ fontSize: '10px' }}>
              {currentUser?.plan?.toUpperCase() || 'PRO'}
            </span>
          )}
        </div>
      </header>

      {/* ── MOBILE BACKDROP OVERLAY ────────────────────────────── */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay" 
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* ── IN-WEB FLOATING TOAST STACK ── */}
      {toasts.length > 0 && (
        <div className="inweb-toast-container">
          {toasts.map(t => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';

            return (
              <div key={t.id} className={`inweb-toast ${t.type || 'info'}`}>
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  {isSuccess && <CheckCircle2 size={18} color="#10b981" />}
                  {isError && <AlertCircle size={18} color="#ef4444" />}
                  {isWarning && <AlertTriangle size={18} color="#f59e0b" />}
                  {!isSuccess && !isError && !isWarning && <Bell size={18} color="#3b82f6" />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {t.title && (
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                      {t.title}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {t.message}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={14} />
                </button>

                <div className="toast-progress-bar" style={{
                  background: isSuccess ? '#10b981' : isError ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--primary)'
                }} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        {/* Brand Header — Stylish HABIT AUTH with link to Landing Page */}
        <div className="logo-section" style={{ paddingBottom: '18px', justifyContent: 'center' }}>
          <button
            onClick={() => onBackToLanding ? onBackToLanding() : (window.location.href = '/')}
            title="Click to visit Landing Page"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              textDecoration: 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              borderRadius: 'var(--radius-md)',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.filter = 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))';
            }}
          >
            <div style={{
              fontFamily: "'Outfit', 'Space Grotesk', system-ui, -apple-system, sans-serif",
              fontSize: '23px',
              fontWeight: 900,
              letterSpacing: '2.5px',
              background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 35%, #93c5fd 70%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              lineHeight: 1.15,
              textShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
            }}>
              HABIT AUTH
            </div>
          </button>
        </div>

        {/* Scope App Selector */}
        {apps.length > 0 && (
          <div className="form-group" style={{ marginBottom: '20px', padding: '0 2px' }}>
            <label className="form-label" style={{ fontSize: '10px' }}>{t('dashScope')}</label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select 
                className="form-select"
                value={selectedAppId} 
                onChange={(e) => setSelectedAppId(e.target.value)}
                style={{ flexGrow: 1, marginBottom: 0, padding: '7px 10px', fontSize: '12px' }}
              >
                {apps.map(a => (
                  <option key={a.id} value={a.id}>{a.app_name}</option>
                ))}
              </select>
              <button 
                className="icon-btn" 
                onClick={() => setShowCreateAppModal(true)} 
                title={totalAppsCount >= maxAppsAllowed ? `App limit reached (${maxAppsAllowed} max for your plan)` : "Create New App"}
                style={{ flexShrink: 0, width: '32px', height: '32px' }}
                disabled={totalAppsCount >= maxAppsAllowed}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <ul className="nav-links">
          <div className="nav-section-label">{t('dashPlatform')}</div>
          <li className={`nav-item ${activeNav === 'overview' ? 'active' : ''}`} onClick={() => setActiveNav('overview')}>
            <LayoutDashboard size={17} /> <span>{t('dashOverview')}</span>
          </li>
          <li className={`nav-item ${activeNav === 'apps' ? 'active' : ''}`} onClick={() => setActiveNav('apps')}>
            <Smartphone size={17} /> <span>{t('dashApps')} ({totalAppsCount})</span>
          </li>

          <div className="nav-section-label">{t('dashManagement')}</div>
          <li className={`nav-item ${activeNav === 'users' ? 'active' : ''}`} onClick={() => setActiveNav('users')}>
            <Users size={17} /> <span>{t('dashUsers')}</span>
          </li>
          <li 
            className={`nav-item ${activeNav === 'radar' ? 'active' : ''}`} 
            onClick={() => { setActiveNav('radar'); window.history.pushState({}, '', '/radar'); }}
          >
            <Radio 
              size={17} 
              color={activeNav === 'radar' ? '#fff' : '#10b981'} 
              style={{
                filter: liveUsers.filter(u => !u.is_killed && (u.last_heartbeat > 0 || u.is_online)).length > 0 ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' : 'none'
              }}
            /> 
            <span>Live Radar</span>
            {isFreePlan ? (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }} title="Developer & Pro Feature">
                <Crown size={14} color="#f59e0b" fill="#f59e0b" />
              </span>
            ) : isWithin15Days ? (
              <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Crown size={10} fill="#10b981" /> UNLOCKED
              </span>
            ) : liveUsers.filter(u => !u.is_killed && (u.last_heartbeat > 0 || u.is_online)).length > 0 ? (
              <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '9.5px', padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                {liveUsers.filter(u => !u.is_killed && (u.last_heartbeat > 0 || u.is_online)).length} LIVE
              </span>
            ) : (
              <span className="badge" style={{ marginLeft: 'auto', fontSize: '9px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                0
              </span>
            )}
          </li>
          <li className={`nav-item ${activeNav === 'licenses' ? 'active' : ''}`} onClick={() => setActiveNav('licenses')}>
            <Key size={17} /> <span>{t('dashLicenses')}</span>
          </li>
          <li className={`nav-item ${activeNav === 'devices' ? 'active' : ''}`} onClick={() => setActiveNav('devices')}>
            <Laptop size={17} /> <span>{t('dashDevices')}</span>
          </li>
          <li className={`nav-item ${activeNav === 'banned' ? 'active' : ''}`} onClick={() => setActiveNav('banned')}>
            <Ban size={17} color={activeNav === 'banned' ? '#fff' : 'var(--danger)'} /> <span>{t('dashBanned')}</span>
            {blacklists.filter(b => b.type === 'hwid').length > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto', fontSize: '9.5px', padding: '2px 7px' }}>
                {blacklists.filter(b => b.type === 'hwid').length}
              </span>
            )}
          </li>
          <li className={`nav-item ${activeNav === 'webhooks' ? 'active' : ''}`} onClick={() => setActiveNav('webhooks')}>
            <Bell size={17} /> <span>{t('dashWebhooks')}</span>
          </li>
          <li className={`nav-item ${activeNav === 'teams' ? 'active' : ''}`} onClick={() => setActiveNav('teams')}>
            <Users2 size={17} /> <span>{t('dashTeams')}</span>
            {isFreePlan ? (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }} title="Developer Plan Feature">
                <Crown size={14} color="#f59e0b" fill="#f59e0b" />
              </span>
            ) : isWithin15Days ? (
              <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Crown size={10} fill="#10b981" /> UNLOCKED
              </span>
            ) : null}
          </li>

          <div className="nav-section-label">{t('dashDevTools')}</div>
          <li className={`nav-item ${activeNav === 'sdks' ? 'active' : ''}`} onClick={() => setActiveNav('sdks')}>
            <Code2 size={17} /> <span>{t('dashSdks')}</span>
          </li>
          <li className={`nav-item ${activeNav === 'playground' ? 'active' : ''}`} onClick={() => setActiveNav('playground')}>
            <Terminal size={17} /> <span>API Playground</span>
          </li>
          <li className="nav-item" onClick={() => window.open('/docs', '_blank')} title="Open Developer Documentation in new tab" style={{ cursor: 'pointer' }}>
            <Book size={17} /> <span>{t('dashDocs')}</span>
            <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </li>

          {/* Join Team (Shown when not in a team) */}
          {!joinedTeam && (
            <li className={`nav-item ${activeNav === 'join-team' ? 'active' : ''}`} onClick={() => setActiveNav('join-team')}>
              <Users2 size={17} /> <span>Join Team</span>
              {pendingJoinRequest && (
                <span className="badge badge-warning" style={{ fontSize: '9px', marginLeft: 'auto' }}>PENDING</span>
              )}
            </li>
          )}

          {/* Team Dashboard (Appears once accepted by team owner, hides Join Team) */}
          {joinedTeam && (
            <li className={`nav-item ${activeNav === 'team-dashboard' ? 'active' : ''}`} onClick={() => setActiveNav('team-dashboard')}>
              <Users2 size={17} color="var(--primary-light)" /> 
              <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>Team Dashboard</span>
              <span className="badge badge-primary" style={{ fontSize: '9px', marginLeft: 'auto', textTransform: 'uppercase' }}>
                {joinedTeam.team_name}
              </span>
            </li>
          )}

          <li className={`nav-item ${activeNav === 'tickets' ? 'active' : ''}`} onClick={() => setActiveNav('tickets')}>
            <MessageSquare size={17} /> <span>{t('dashSupport')}</span>
            {tickets.filter(t => t.status === 'open').length > 0 && (
              <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '9.5px', padding: '2px 7px' }}>
                {tickets.filter(t => t.status === 'open').length}
              </span>
            )}
          </li>
          <li className={`nav-item ${activeNav === 'security' ? 'active' : ''}`} onClick={() => setActiveNav('security')}>
            <Lock size={17} /> <span>{t('dashSecurity')}</span>
          </li>
          <li className={`nav-item ${activeNav === 'audit' ? 'active' : ''}`} onClick={() => setActiveNav('audit')}>
            <Clock size={17} /> <span>{t('dashAudit')}</span>
            {logRetention?.is_warning && logRetention?.warning_badge && (
              <span 
                className="badge-pulse" 
                title={`Scheduled 30-day database log cleanup in ${logRetention.days_remaining} day(s)`}
                style={{ 
                  marginLeft: 'auto', 
                  fontSize: '11px', 
                  fontWeight: '800', 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  background: logRetention.warning_badge === '1' 
                    ? 'linear-gradient(135deg, #ef4444, #b91c1c)' 
                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  boxShadow: logRetention.warning_badge === '1' 
                    ? '0 0 10px rgba(239,68,68,0.8)' 
                    : '0 0 8px rgba(245,158,11,0.7)',
                  minWidth: '20px',
                  textAlign: 'center'
                }}
              >
                {logRetention.warning_badge}
              </span>
            )}
          </li>

          {user?.role === 'admin' && (
            <>
              <div className="nav-section-label" style={{ color: 'var(--danger)' }}>{t('dashAdministration')}</div>
              <li className={`nav-item ${activeNav === 'admin' ? 'active' : ''}`} onClick={() => setActiveNav('admin')} style={{ color: '#f87171' }}>
                <ShieldAlert size={17} /> <span>{t('dashAdmin')}</span>
              </li>
            </>
          )}
        </ul>

        {/* Sidebar User Card Footer */}
        <div className="sidebar-footer">
          <div className="user-profile-badge" style={{ marginBottom: '12px' }}>
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username}
                className="user-avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(99, 102, 241, 0.4) 100%)',
                border: '1px solid var(--border-active)',
                display: user?.avatar ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0
              }}
            >
              {(user?.username || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.username}
              </div>
              <div style={{ fontSize: '10px', color: isProPlan ? '#f59e0b' : isDevPlan ? '#38bdf8' : 'var(--primary-light)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isProPlan && <Crown size={11} fill="#f59e0b" />}
                {(currentUser || user)?.plan} PLAN
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => {
              setMobileSidebarOpen(false);
              setLangDropdownOpen(true);
            }}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#93c5fd',
              borderColor: 'rgba(59, 130, 246, 0.25)',
              background: 'rgba(59, 130, 246, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '8px'
            }}
          >
            <Globe size={13} color="#60a5fa" />
            <span>Language: {currentLanguageObj?.flag} {currentLanguageObj?.name}</span>
          </button>

          <button 
            onClick={() => {
              setDirectCredsUsername(currentUser?.username || user?.username || '');
              setDirectCredsPassword('');
              setDirectCredsError('');
              setShowDirectCredsModal(true);
            }}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: currentUser?.has_password ? '#94a3b8' : '#38bdf8',
              borderColor: currentUser?.has_password ? 'rgba(255, 255, 255, 0.1)' : 'rgba(56, 189, 248, 0.35)',
              background: currentUser?.has_password ? 'rgba(255, 255, 255, 0.03)' : 'rgba(56, 189, 248, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '8px'
            }}
            title="Set username and password for direct login without Discord"
          >
            <Key size={13} /> {currentUser?.has_password ? 'Direct Login Password' : 'Set Direct Login'}
          </button>

          <button 
            onClick={onLogout}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '9px 12px', fontSize: '11.5px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            title="Sign Out"
          >
            <LogOut size={13} /> {t('dashLogout')}
          </button>
        </div>
      </aside>

      {/* ── RIGHT MAIN CONTENT AREA ───────────────────────────── */}
      <main className="main-content">
        {/* ── TOP FLOATING NAVBAR ── */}
        <div className="dashboard-top-navbar">
          <div className="top-navbar-left">
            {/* Current Application Capsule */}
            {selectedApp ? (
              <div className="top-nav-pill" style={{ background: 'rgba(37, 99, 235, 0.12)', borderColor: 'rgba(59, 130, 246, 0.35)', color: '#fff' }}>
                <Smartphone size={13} color="#60a5fa" />
                <span>App: <strong>{selectedApp.app_name}</strong></span>
                <span className="badge badge-active" style={{ fontSize: '9px', padding: '1px 6px', textTransform: 'uppercase' }}>
                  {language === 'bn' ? 'লাইভ' : 'Live'}
                </span>
              </div>
            ) : null}

            {/* Live API Health Status */}
            <div className="top-nav-pill status-pill" title="Backend SQLite WAL & Client API Operational">
              <span className="pulse-dot-green" />
              <span>{language === 'bn' ? 'এপিআই সক্রিয়' : 'API Operational'}</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>4ms</span>
            </div>
          </div>

          <div className="top-navbar-right" ref={notifRef}>
            {/* Language Selector Trigger in Dashboard */}
            <button
              type="button"
              onClick={() => setLangDropdownOpen(true)}
              className="top-nav-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f1f5f9'
              }}
              title={t('switchLang')}
            >
              <Globe size={13} color="#60a5fa" />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>
                {currentLanguageObj?.flag} {currentLanguageObj?.label}
              </span>
              <ChevronDown size={11} style={{ opacity: 0.7 }} />
            </button>

            {/* Documentation Quick Link */}
            <a 
              href="/docs" 
              target="_blank" 
              rel="noreferrer" 
              className="top-nav-pill" 
              title="Open Official Documentation"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Book size={13} />
              <span>{t('navDocs')}</span>
              <ExternalLink size={10} style={{ opacity: 0.6 }} />
            </a>

            {/* In-Web Notification Bell Trigger */}
            <button
              type="button"
              className={`notif-trigger-btn ${showNotifPopover ? 'active' : ''}`}
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              title="In-Web Notifications"
              style={unreadNotifCount > 0 ? {
                borderColor: 'rgba(239, 68, 68, 0.6)',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.12)',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.5)'
              } : {}}
            >
              <Bell size={16} color={unreadNotifCount > 0 ? '#ef4444' : 'currentColor'} />
              {unreadNotifCount > 0 && (
                <span className="notif-badge-counter" style={{ background: '#ef4444', color: '#ffffff', boxShadow: '0 0 8px #ef4444' }}>
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* In-Web Notification Drawer Popover */}
            {showNotifPopover && (
              <div className="notif-popover-drawer">
                <div className="notif-popover-header">
                  <div className="notif-popover-title">
                    <Bell size={15} color="var(--primary)" />
                    <span>Notifications</span>
                    {unreadNotifCount > 0 && (
                      <span className="badge badge-danger" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {unreadNotifCount} unread
                      </span>
                    )}
                  </div>
                  <div className="notif-popover-actions">
                    {unreadNotifCount > 0 && (
                      <button 
                        type="button" 
                        onClick={handleMarkAllNotifsRead} 
                        className="notif-header-btn"
                        title="Mark all as read"
                      >
                        <Check size={12} /> Read all
                      </button>
                    )}
                    {inWebNotifications.length > 0 && (
                      <button 
                        type="button" 
                        onClick={handleClearAllNotifs} 
                        className="notif-header-btn" 
                        style={{ color: '#ef4444' }}
                        title="Clear all notifications"
                      >
                        <Trash2 size={12} /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Strip */}
                <div className="notif-filter-strip">
                  {['all', 'unread', 'security', 'warning'].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setNotifFilter(f)}
                      className={`notif-filter-pill ${notifFilter === f ? 'active' : ''}`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Feed Body */}
                <div className="notif-feed-body">
                  {inWebNotifications
                    .filter(n => {
                      if (notifFilter === 'unread') return n.is_read === 0;
                      if (notifFilter === 'security') return n.type === 'security';
                      if (notifFilter === 'warning') return n.type === 'warning';
                      return true;
                    })
                    .length === 0 ? (
                      <div className="notif-empty-state">
                        <Sparkles size={24} color="var(--primary)" />
                        <span style={{ fontWeight: 600, color: '#fff' }}>All caught up!</span>
                        <span style={{ fontSize: '11px' }}>No notifications in this view.</span>
                      </div>
                    ) : (
                      inWebNotifications
                        .filter(n => {
                          if (notifFilter === 'unread') return n.is_read === 0;
                          if (notifFilter === 'security') return n.type === 'security';
                          if (notifFilter === 'warning') return n.type === 'warning';
                          return true;
                        })
                        .map(n => {
                          const isSecurity = n.type === 'security';
                          const isWarning = n.type === 'warning';

                          return (
                            <div 
                              key={n.id} 
                              className={`notif-feed-item ${n.is_read === 0 ? 'unread' : ''}`}
                              onClick={() => {
                                handleMarkNotifRead(n.id);
                                setSelectedNotifDetails(n);
                              }}
                              style={{ cursor: 'pointer' }}
                              title="Click to view full notification details"
                            >
                              <div className={`notif-icon-box ${isSecurity ? 'security' : isWarning ? 'warning' : 'info'}`}>
                                {isSecurity ? <ShieldAlert size={16} /> : isWarning ? <AlertTriangle size={16} /> : <Bell size={16} />}
                              </div>

                              <div className="notif-content-wrap">
                                <div className="notif-item-title">{n.title}</div>
                                <div className="notif-item-desc">{n.message}</div>

                                {/* Render attached notice image if present */}
                                {n.image_url && (
                                  <div style={{ marginTop: '8px', marginBottom: '6px' }}>
                                    <img 
                                      src={n.image_url} 
                                      alt="Notification Attachment" 
                                      style={{
                                        width: '100%',
                                        maxHeight: '180px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                                      }} 
                                    />
                                  </div>
                                )}

                                {/* Render action link if present */}
                                {n.link_url && (
                                  <div style={{ marginTop: '8px', marginBottom: '4px' }}>
                                    <a 
                                      href={n.link_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="btn btn-primary"
                                      style={{
                                        fontSize: '11px',
                                        padding: '4px 10px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        textDecoration: 'none'
                                      }}
                                    >
                                      <span>Open Link / Attachment</span> <ExternalLink size={11} />
                                    </a>
                                  </div>
                                )}

                                {/* Direct action button for log purge warnings */}
                                {n.message && n.message.includes('backup') && (
                                  <div style={{ marginTop: '8px' }}>
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExportAuditLogsJson();
                                      }}
                                      className="btn btn-secondary"
                                      style={{ fontSize: '10.5px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      <Download size={11} /> Download Backup
                                    </button>
                                  </div>
                                )}

                                <div className="notif-item-footer">
                                  <span>{new Date(n.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at * 1000).toLocaleDateString()}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteNotif(n.id, e)}
                                    className="notif-item-delete"
                                    title="Delete notification"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SCROLLABLE DASHBOARD BODY (Top Navbar is Fixed at Top) ── */}
        <div className="dashboard-scroll-body">
          {/* Maintenance Mode Lockdown Alert */}
        {isMaintenanceLocked && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.18)',
            borderRadius: '11px',
            padding: '12px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#ffffff'
          }} className="animate-slide-up">
            <Lock size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              <strong style={{ color: '#f87171' }}>MAINTENANCE LOCKDOWN:</strong> {systemMaintenance.message || 'System maintenance is active. You can inspect all data in read-only mode, but creating, editing, and deleting records is temporarily locked.'}
            </span>
          </div>
        )}
        <SystemNoticeBanner />
        
        {/* ── 1. OVERVIEW TAB ──────────────────────────────────── */}
        {activeNav === 'overview' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">Executive Command Center</h1>
                <p className="page-subtitle">Welcome back, {user?.username}. Overview of your applications, licenses, and security status.</p>
              </div>

              <div className="flex-align" style={{ gap: '12px' }}>
                {isFreePlan && (
                  <button 
                    onClick={onUpgradeClick}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' }}
                  >
                    <Crown size={15} fill="#ffffff" style={{ marginRight: '6px' }} /> Upgrade to Developer ($1.20/mo)
                  </button>
                )}
                {isDevPlan && (
                  <button 
                    onClick={() => onUpgradeClick('pro')}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}
                  >
                    <Crown size={15} fill="#ffffff" style={{ marginRight: '6px' }} /> Upgrade to Pro ($3.20/mo)
                  </button>
                )}
                {isProPlan && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#f59e0b',
                    fontSize: '12px',
                    fontWeight: 800
                  }}>
                    <Crown size={15} fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' }} />
                    PRO DEVELOPER
                  </div>
                )}
                <button 
                  onClick={() => setShowCreateAppModal(true)} 
                  className="btn btn-primary"
                  disabled={totalAppsCount >= maxAppsAllowed}
                >
                  <Plus size={15} style={{ marginRight: '6px' }} /> {t('dashCreateApp')}
                </button>
              </div>
            </header>

            {/* Developer Subscription Expired Alert */}
            {user?.sub_status === 'expired' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }} className="animate-scale-in">
                <div className="flex-align" style={{ gap: '12px' }}>
                  <AlertTriangle size={22} color="var(--danger)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '14px' }}>
                      SUBSCRIPTION EXPIRED (STRICT SUSPENSION ACTIVE)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Your plan has expired. Client software authentication for your applications is temporarily suspended. Please renew your plan to re-activate your software clients.
                    </div>
                  </div>
                </div>
                <button onClick={onUpgradeClick} className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '12.5px', background: 'var(--danger)', borderColor: 'var(--danger)', whiteSpace: 'nowrap' }}>
                  Renew Plan
                </button>
              </div>
            )}

            {/* Overview Stats Cards */}
            <div className="stats-grid">
              <div className="glass-panel stat-card primary">
                <div className="stat-header">
                  <span>{t('dashCurrentPlan')}</span>
                  <div className="stat-icon-container">
                    {isProPlan ? <Crown size={16} fill="#f59e0b" color="#f59e0b" /> : <Sparkles size={16} />}
                  </div>
                </div>
                <div className="stat-value" style={{ textTransform: 'uppercase', fontSize: '26px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isProPlan && <Crown size={24} fill="#f59e0b" color="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' }} />}
                  {user?.plan}
                </div>
                <div className="stat-trend">
                  {user?.sub_status === 'expired' ? (
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Expired (Clients Suspended)</span>
                  ) : user?.sub_expires_at > 0 ? (
                    <span style={{ color: '#38bdf8' }}>Expires: {new Date(user.sub_expires_at * 1000).toLocaleDateString()}</span>
                  ) : isFreePlan ? (
                    '1 App / 10 Users limit'
                  ) : isDevPlan ? (
                    <span style={{ color: '#38bdf8' }}>100 Apps / 10,000 Users</span>
                  ) : isProPlan ? (
                    <span style={{ color: '#a855f7' }}>1,000 Apps / 100,000 Users</span>
                  ) : (
                    <span style={{ color: '#10b981' }}>Active Access</span>
                  )}
                </div>
              </div>

              <div className="glass-panel stat-card indigo">
                <div className="stat-header"><span>{t('dashApps')}</span><div className="stat-icon-container"><Smartphone size={16} /></div></div>
                <div className="stat-value">{totalAppsCount} / {maxAppsAllowed >= 999999 ? '∞' : maxAppsAllowed}</div>
                <div className="stat-trend">Managed software products</div>
              </div>

              <div className="glass-panel stat-card success">
                <div className="stat-header"><span>{t('dashUsers')}</span><div className="stat-icon-container"><Users size={16} /></div></div>
                <div className="stat-value">{totalUsersCount}</div>
                <div className="stat-trend">Client user accounts</div>
              </div>

              <div className="glass-panel stat-card danger">
                <div className="stat-header"><span>{t('dashLicenses')}</span><div className="stat-icon-container"><Key size={16} /></div></div>
                <div className="stat-value">{activeLicensesCount}</div>
                <div className="stat-trend">{totalLicensesCount} total generated keys</div>
              </div>
            </div>

            {/* Applications Card Grid Overview */}
            <div className="users-header-bar">
              <div>
                <h3 className="users-title"><Smartphone size={18} style={{ marginRight: '8px', color: 'var(--primary)' }} /> {t('dashYourApps')}</h3>
                <p className="users-subtitle">{t('dashManageAppsSubtitle')}</p>
              </div>

              <button 
                onClick={() => setShowCreateAppModal(true)} 
                className="btn btn-primary"
                disabled={totalAppsCount >= maxAppsAllowed}
              >
                <Plus size={15} style={{ marginRight: '6px' }} /> + {t('dashCreateApp')}
              </button>
            </div>

            {apps.length === 0 ? (
              <div className="users-empty">
                <Smartphone size={36} opacity={0.3} style={{ marginBottom: '12px' }} />
                <p style={{ fontWeight: 700, fontSize: '15px' }}>No applications yet</p>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>Create your first application to get started.</span>
                <button onClick={() => setShowCreateAppModal(true)} className="btn btn-primary">+ New Application</button>
              </div>
            ) : (
              <div className="users-card-grid">
                {apps.map(app => (
                  <div key={app.id} className="user-card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedAppId(app.id); setActiveNav('users'); }}>
                    <div className="user-card-glow" />
                    <div className="user-card-header">
                      <div className="user-avatar">{app.app_name.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="user-card-name">{app.app_name}</div>
                        <div className="user-card-meta">ID: {app.id.slice(0, 14)}...</div>
                      </div>
                      <span className="badge badge-active">{app.status}</span>
                    </div>

                    <div className="user-card-body">
                      <div className="user-info-row">
                        <span className="user-info-label">Users</span>
                        <span className="user-info-value">{app.total_users || 0}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="user-info-label">Licenses</span>
                        <span className="user-info-value">{app.total_licenses || 0}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="user-info-label">Active Keys</span>
                        <span className="user-info-value">{app.active_licenses || 0}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="user-info-label">Version</span>
                        <span className="user-info-value mono-text">v{app.version}</span>
                      </div>
                    </div>

                    <div className="user-card-actions">
                      <button className="user-action-btn edit" onClick={(e) => { e.stopPropagation(); setSelectedAppId(app.id); setActiveNav('users'); }}>
                        Manage Users
                      </button>
                      <button className="user-action-btn hwid" onClick={(e) => { e.stopPropagation(); setSelectedAppId(app.id); setActiveNav('apps'); }}>
                        Credentials
                      </button>
                      <button 
                        className="user-action-btn delete" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteApp(app.id, app.app_name); }}
                        title="Delete Application"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 2. APPLICATIONS MANAGEMENT TAB ───────────────────── */}
        {activeNav === 'apps' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">Application Management</h1>
                <p className="page-subtitle">Inspect credentials, reveal App Secret, or regenerate cryptographic tokens.</p>
              </div>

              <button 
                onClick={() => setShowCreateAppModal(true)} 
                className="btn btn-primary"
                disabled={totalAppsCount >= maxAppsAllowed}
              >
                <Plus size={15} style={{ marginRight: '6px' }} /> New Application
              </button>
            </header>

            {/* Application Credentials Card */}
            {currentAppDetails && (
              <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
                <div className="flex-between" style={{ marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{currentAppDetails.app_name} Credentials</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      App ID identifies your software. App Secret is required for server-side verification and SDK negotiations.
                    </p>
                  </div>
                  <span className="badge badge-active">{currentAppDetails.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  {/* 1. App Name */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">App Name</label>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <input type="text" readOnly value={currentAppDetails.app_name} className="form-input" style={{ fontWeight: 700 }} />
                      <button onClick={() => copyToClipboard(currentAppDetails.app_name, 'app_name')} className="btn btn-secondary" style={{ padding: '10px' }} title="Copy App Name">
                        {copiedKey === 'app_name' ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* 2. App ID */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">App ID</label>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <input type="text" readOnly value={currentAppDetails.id} className="form-input mono-text" style={{ color: 'var(--primary-light)', fontWeight: 700 }} />
                      <button onClick={() => copyToClipboard(currentAppDetails.id, 'app_id')} className="btn btn-secondary" style={{ padding: '10px' }} title="Copy App ID">
                        {copiedKey === 'app_id' ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* 3. App Secret */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">App Secret</label>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <input 
                        type={showSecret ? "text" : "password"} 
                        readOnly 
                        value={currentAppDetails.app_secret} 
                        className="form-input mono-text" 
                      />
                      <button onClick={() => setShowSecret(!showSecret)} className="btn btn-secondary" style={{ padding: '10px' }} title={showSecret ? "Hide Secret" : "Reveal Secret"}>
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => copyToClipboard(currentAppDetails.app_secret, 'app_secret')} className="btn btn-secondary" style={{ padding: '10px' }} title="Copy Secret">
                        {copiedKey === 'app_secret' ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* 3.1 Ed25519 Asymmetric Public Key */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={13} color="var(--primary)" /> Ed25519 Public Key
                    </label>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={currentAppDetails.public_key || 'No Public Key Generated'} 
                        className="form-input mono-text" 
                        style={{ fontSize: '11.5px', color: '#38bdf8' }}
                      />
                      <button onClick={() => copyToClipboard(currentAppDetails.public_key, 'public_key')} className="btn btn-secondary" style={{ padding: '10px' }} title="Copy Public Key">
                        {copiedKey === 'public_key' ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* 4. Current Application Version */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Client Version</label>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={`v${currentAppDetails.version || '1.0.0'}`} 
                        className="form-input mono-text" 
                        style={{ color: '#22c55e', fontWeight: 800 }} 
                      />
                      <button 
                        onClick={() => {
                          setEditAppVersion(currentAppDetails.version || '1.0.0');
                          setShowEditVersionModal(true);
                        }} 
                        className="btn btn-primary" 
                        style={{ padding: '10px 14px', fontSize: '11.5px', whiteSpace: 'nowrap' }} 
                        title="Change software release version"
                      >
                        <Edit2 size={13} style={{ marginRight: '5px' }} /> Edit Version
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '12px' }} className="flex-between">
                  <span style={{ fontSize: '12px', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={13} /> Never embed your App Secret in frontend JavaScript or uncompiled public clients.
                  </span>
                  <div className="flex-align" style={{ gap: '10px' }}>
                    <button onClick={handleRegenerateSecret} className="btn btn-secondary" style={{ color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.3)', fontSize: '12px' }}>
                      <RefreshCw size={13} style={{ marginRight: '6px' }} /> Regenerate Secret
                    </button>
                    <button 
                      onClick={() => handleDeleteApp(currentAppDetails.id, currentAppDetails.app_name)} 
                      className="btn btn-secondary" 
                      style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '12px' }}
                    >
                      <Trash2 size={13} style={{ marginRight: '6px' }} /> Delete Application
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AUTO-UPDATE, .EXE DOWNLOAD URL & ANTI-CHEAT CENTER */}
            {currentAppDetails && (
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '28px', 
                  marginBottom: '32px',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(10, 8, 22, 0.95) 100%)'
                }}
              >
                <div className="flex-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800 }} className="flex-align">
                      <Shield size={20} color="var(--primary)" style={{ marginRight: '10px' }} />
                      Auto-Update & .EXE Download Distribution Center
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                      Provide your executable's direct download link (.exe / .zip). When auto-update is enabled, clients on older versions will be blocked and given this download URL.
                    </p>
                  </div>
                  <span className="badge badge-primary" style={{ padding: '6px 14px', fontSize: '11px', letterSpacing: '0.5px' }}>
                    AUTOMATED DEPLOYMENT
                  </span>
                </div>

                <form onSubmit={handleSaveAppSecurityConfig}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {/* Column 1: Auto-Update & .EXE URL */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      {/* Token Validation Switch (Secondary Verification) */}
                      <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(56,189,248,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56,189,248,0.25)' }}>
                        <label className="flex-between" style={{ cursor: 'pointer', margin: 0 }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <KeyRound size={14} /> Require Token Validation on Startup
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                              Users must provide a valid startup token during client init before they can even log in or see the interface.
                            </span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={!!appSecForm.token_validation_enabled}
                            onChange={(e) => setAppSecForm(prev => ({ ...prev, token_validation_enabled: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#38bdf8' }}
                          />
                        </label>
                      </div>

                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--primary-light)', marginBottom: '16px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw size={14} /> 1. Force Auto-Update Settings
                      </h4>

                      {/* Enable Switch */}
                      <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(59, 130, 246,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246,0.2)' }}>
                        <label className="flex-between" style={{ cursor: 'pointer', margin: 0 }}>
                          <div>
                            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff' }}>Enforce Force Auto-Update on Launch</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                              Blocks any user running an older version and prompts them to download the new update.
                            </span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={!!appSecForm.force_update_enabled}
                            onChange={(e) => setAppSecForm(prev => ({ ...prev, force_update_enabled: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                          />
                        </label>
                      </div>

                      {/* .EXE Download URL */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>
                          Direct .EXE / Installer Download URL (Where users download update)
                        </label>
                        <input 
                          type="url" 
                          className="form-input mono-text" 
                          value={appSecForm.update_download_url}
                          onChange={(e) => setAppSecForm(prev => ({ ...prev, update_download_url: e.target.value }))}
                          placeholder="https://yourwebsite.com/downloads/MySoftware_v2.0.exe"
                          style={{ fontSize: '12px' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                          Paste direct link to your compiled .exe, installer, or GitHub release binary.
                        </span>
                      </div>

                      {/* Latest Required Version */}
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>
                          Target Latest Version Required to Run
                        </label>
                        <input 
                          type="text" 
                          className="form-input mono-text" 
                          value={appSecForm.latest_version}
                          onChange={(e) => setAppSecForm(prev => ({ ...prev, latest_version: e.target.value }))}
                          placeholder="e.g. 2.0.0"
                          style={{ width: '160px', fontWeight: 800, color: '#22c55e' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                          Clients reporting a version other than this will be prompted to update.
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Anti-Patch Hash Check & HWID Policy */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--primary-light)', marginBottom: '16px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={14} /> 2. Anti-Patch Integrity & Policies
                      </h4>

                      {/* File Hash Check */}
                      <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <label className="flex-between" style={{ cursor: 'pointer', margin: 0 }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>SHA-256 Binary Integrity Check</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                              Blocks cracked/patched .exe binaries automatically.
                            </span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={!!appSecForm.enforce_hash_check}
                            onChange={(e) => setAppSecForm(prev => ({ ...prev, enforce_hash_check: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                          />
                        </label>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Expected Binary SHA-256 Hash</label>
                        <input 
                          type="text" 
                          className="form-input mono-text" 
                          value={appSecForm.expected_hash}
                          onChange={(e) => setAppSecForm(prev => ({ ...prev, expected_hash: e.target.value }))}
                          placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                          style={{ fontSize: '11px' }}
                        />
                        <label className="flex-align" style={{ cursor: 'pointer', gap: '8px', marginTop: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={appSecForm.auto_ban_on_hash_mismatch !== false}
                            onChange={(e) => setAppSecForm(prev => ({ ...prev, auto_ban_on_hash_mismatch: e.target.checked }))}
                            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--danger)' }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)' }}>
                            Auto-Ban User & Blacklist HWID immediately if Hash Check fails (Anti-Tamper Auto-Ban)
                          </span>
                        </label>
                      </div>

                      {/* Custom Key Mask */}
                      <div className="form-group">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700 }}>
                            Custom License Format Mask
                            {!isProPlan ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                color: '#f59e0b',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                letterSpacing: '0.4px'
                              }}>
                                <Crown size={12} fill="#f59e0b" /> PRO EXCLUSIVE
                              </span>
                            ) : isWithin15Days ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                color: '#10b981',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10.5px',
                                fontWeight: 800
                              }}>
                                <Crown size={12} fill="#10b981" /> UNLOCKED
                              </span>
                            ) : null}
                          </label>
                          {!isProPlan && (
                            <button
                              type="button"
                              onClick={() => onUpgradeClick('pro')}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#f59e0b',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Crown size={12} fill="#f59e0b" /> Unlock ($3.20/mo)
                            </button>
                          )}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="text" 
                            className="form-input mono-text" 
                            value={!isProPlan ? '' : appSecForm.custom_key_mask}
                            onChange={(e) => isProPlan && setAppSecForm(prev => ({ ...prev, custom_key_mask: e.target.value }))}
                            placeholder={!isProPlan ? "PRO Feature: VIP-****-****-**** (Locked)" : "e.g. VIP-****-****-**** (use * for random)"}
                            readOnly={!isProPlan}
                            style={{
                              fontSize: '12px',
                              paddingRight: !isProPlan ? '42px' : '14px',
                              background: !isProPlan ? 'rgba(245, 158, 11, 0.05)' : undefined,
                              borderColor: !isProPlan ? 'rgba(245, 158, 11, 0.3)' : undefined,
                              cursor: !isProPlan ? 'not-allowed' : 'text',
                              color: !isProPlan ? '#fcd34d' : undefined
                            }}
                          />
                          {!isProPlan && (
                            <div style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              display: 'flex',
                              alignItems: 'center',
                              pointerEvents: 'none'
                            }}>
                              <Crown size={18} color="#f59e0b" fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))' }} />
                            </div>
                          )}
                        </div>
                        {!isProPlan && (
                          <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Crown size={12} fill="#f59e0b" style={{ flexShrink: 0 }} />
                            <span>Custom format masks require <strong>Pro Developer ($3.20/mo)</strong> tier.</span>
                          </div>
                        )}
                      </div>

                      {/* HWID Reset Cooldown */}
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Client Self-Service HWID Reset Cooldown</label>
                        <select 
                          className="form-select"
                          value={appSecForm.hwid_cooldown_days}
                          onChange={(e) => setAppSecForm(prev => ({ ...prev, hwid_cooldown_days: parseInt(e.target.value) }))}
                          style={{ marginBottom: 0 }}
                        >
                          <option value={1}>1 Day (24 Hours)</option>
                          <option value={3}>3 Days</option>
                          <option value={7}>7 Days (Recommended)</option>
                          <option value={14}>14 Days</option>
                          <option value={30}>30 Days</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', textAlign: 'right' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSavingSec} style={{ padding: '10px 24px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {isSavingSec ? 'Saving...' : <><Shield size={14} /> Save Auto-Update & Security Settings</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Applications Card Grid */}
            <div className="users-card-grid">
              {apps.map(app => (
                <div key={app.id} className="user-card" style={{ border: selectedAppId === app.id ? '1px solid var(--primary)' : undefined }}>
                  <div className="user-card-glow" />
                  <div className="user-card-header">
                    <div className="user-avatar">{app.app_name.slice(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="user-card-name">{app.app_name}</div>
                      <div className="user-card-meta">v{app.version}</div>
                    </div>
                    <span className="badge badge-active">{app.status}</span>
                  </div>

                  <div className="user-card-body">
                    <div className="user-info-row">
                      <span className="user-info-label">App ID</span>
                      <span className="user-info-value mono-text">{app.id.slice(0, 14)}...</span>
                    </div>
                    <div className="user-info-row">
                      <span className="user-info-label">Users</span>
                      <span className="user-info-value">{app.total_users || 0}</span>
                    </div>
                    <div className="user-info-row">
                      <span className="user-info-label">Licenses</span>
                      <span className="user-info-value">{app.total_licenses || 0}</span>
                    </div>
                    <div className="user-info-row">
                      <span className="user-info-label">Created</span>
                      <span className="user-info-value">{new Date(app.created_at * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    <button className="user-action-btn edit" onClick={() => setSelectedAppId(app.id)}>
                      {selectedAppId === app.id ? 'Active Scope' : 'Select'}
                    </button>
                    <button className="user-action-btn hwid" onClick={() => { setSelectedAppId(app.id); setActiveNav('users'); }}>
                      Open Users
                    </button>
                    <button 
                      className="user-action-btn delete" 
                      onClick={(e) => { e.stopPropagation(); handleDeleteApp(app.id, app.app_name); }}
                      title="Delete Application"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 3. USERS MANAGEMENT TAB (CARD-BASED UI) ──────────── */}
        {activeNav === 'users' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">User Accounts</h1>
                <p className="page-subtitle">Manage registered clients, reset hardware fingerprints, and manage brute-force lockouts.</p>
              </div>

              <div className="flex-align" style={{ gap: '10px' }}>
                {appUsers.length > 0 && (
                  <button 
                    onClick={handleDeleteAllUsers} 
                    className="btn btn-secondary" 
                    style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.35)', fontSize: '12px' }}
                    title="Permanently wipe all users for this app"
                  >
                    <Trash2 size={13} style={{ marginRight: '6px' }} /> Delete All Users ({appUsers.length})
                  </button>
                )}
                <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary">
                  <UserPlus size={15} style={{ marginRight: '6px' }} /> Add User
                </button>
              </div>
            </header>

            {/* Live Online Radar Telemetry Bar */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: '16px 20px', 
                marginBottom: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.04) 0%, rgba(8, 6, 16, 0.9) 100%)'
              }}
            >
              <div className="flex-align" style={{ gap: '12px' }}>
                <div style={{ position: 'relative', width: '12px', height: '12px' }}>
                  <span style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', opacity: 0.7, animation: 'pulse 2s infinite' }}></span>
                  <span style={{ position: 'absolute', top: '2px', left: '2px', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                </div>
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.3px' }}>
                    LIVE ONLINE RADAR — {liveUsers.length} ACTIVE {liveUsers.length === 1 ? 'SESSION' : 'SESSIONS'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                    {liveUsers.length === 0 
                      ? 'Radar Active • Listening for client heartbeats (0 desktop clients connected). When users run your software, they appear here live.' 
                      : 'Real-time telemetry heartbeat (every 60s). Click "Kill" on any user to remotely terminate their session.'}
                  </span>
                </div>
              </div>

              {liveUsers.length > 0 && (
                <div className="flex-align" style={{ gap: '8px', flexWrap: 'wrap' }}>
                  {liveUsers.slice(0, 5).map(lu => (
                    <span 
                      key={lu.id} 
                      className="badge" 
                      style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      @{lu.username}
                      <button 
                        onClick={() => handleKillSession(lu.id, lu.username)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        title={`Kill session for @${lu.username}`}
                      >
                        <Zap size={11} />
                      </button>
                    </span>
                  ))}
                  {liveUsers.length > 5 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{liveUsers.length - 5} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Header Search & Filter Bar */}
            <div className="users-header-bar">
              <div>
                <h3 className="users-title"><Users size={18} style={{ marginRight: '8px', color: 'var(--primary)' }} /> User Database</h3>
                <p className="users-subtitle">{filteredUsers.length} users registered for this application</p>
              </div>

              <div className="flex-align" style={{ gap: '10px', flexWrap: 'wrap' }}>
                {/* Search */}
                <div className="users-search-wrap">
                  <Search size={15} className="users-search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search username, HWID..." 
                    className="users-search-input"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>

                {/* Filter */}
                <select 
                  className="form-select"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  style={{ width: '130px', padding: '7px 10px', fontSize: '12px', marginBottom: 0 }}
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Only</option>
                  <option value="locked">Locked Only</option>
                  <option value="banned">Banned Only</option>
                </select>
              </div>
            </div>

            {/* Card Grid (4 per row on wide desktop, 3 med, 2 tablet, 1 mobile) */}
            {filteredUsers.length === 0 ? (
              <div className="users-empty">
                <Users size={36} opacity={0.3} style={{ marginBottom: '12px' }} />
                <p style={{ fontWeight: 700, fontSize: '15px' }}>No users found</p>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Click "+ Manually Add User" to register a client profile.
                </span>
                <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary">+ Manually Add User</button>
              </div>
            ) : (
              <div className="users-card-grid">
                {filteredUsers.map(u => {
                  const initials = u.username.slice(0, 2).toUpperCase();
                  const isLocked = u.status === 'locked' || u.is_locked;
                  const isBanned = u.status === 'banned';
                  const isOnline = liveUsers.some(lu => lu.id === u.id);

                  return (
                    <div key={u.id} className="user-card">
                      <div className="user-card-glow" />

                      {/* Card Header: Avatar + Username + Status */}
                      <div className="user-card-header">
                        <div className="user-avatar">{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="user-card-name">{u.username}</div>
                          <div className="user-card-meta">
                            ID: {u.id.slice(0, 8)}... 
                            <button onClick={() => copyToClipboard(u.id, u.id)} className="icon-btn" style={{ display: 'inline-flex', width: '16px', height: '16px', marginLeft: '4px', verticalAlign: 'middle' }}>
                              {copiedKey === u.id ? <Check size={10} color="var(--success)" /> : <Copy size={10} />}
                            </button>
                          </div>
                        </div>

                        <span className={`badge ${isBanned ? 'badge-danger' : isLocked ? 'badge-locked' : 'badge-active'}`}>
                          {isBanned ? 'BANNED' : isLocked ? 'LOCKED (24H)' : 'ACTIVE'}
                        </span>
                      </div>

                      {/* Card Body: Info Rows with Prominent HWID & IP Tracking */}
                      <div className="user-card-body" style={{ gap: '10px', padding: '14px 16px' }}>
                        <div className="user-info-row">
                          <span className="user-info-label">License</span>
                          <span className="user-info-value mono-text" style={{ color: 'var(--primary-light)' }}>
                            {u.license_key ? `${u.license_key.slice(0, 16)}...` : 'Manual'}
                          </span>
                        </div>

                        <div className="user-info-row">
                          <span className="user-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
                            <KeyRound size={12} /> Token
                          </span>
                          <span className="user-info-value mono-text" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {u.token ? `${u.token.slice(0, 14)}...` : 'N/A'}
                            {u.token && (
                              <button onClick={() => copyToClipboard(u.token, `tok_${u.id}`)} className="icon-btn" style={{ width: '18px', height: '18px', marginLeft: '4px' }} title="Copy Token">
                                {copiedKey === `tok_${u.id}` ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                              </button>
                            )}
                          </span>
                        </div>

                        {/* Hardware ID (HWID) Row */}
                        <div className="user-info-row" style={{ alignItems: 'flex-start' }}>
                          <span className="user-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171' }}>
                            <Laptop size={12} /> HWID
                          </span>
                          <span className="user-info-value mono-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {u.hwid ? (
                              <>
                                <span style={{ color: '#fca5a5', fontSize: '11px', letterSpacing: '0.3px' }} title={u.hwid}>
                                  {u.hwid.length > 20 ? `${u.hwid.slice(0, 18)}...` : u.hwid}
                                </span>
                                <button onClick={() => copyToClipboard(u.hwid, `hwid_${u.id}`)} className="icon-btn" style={{ width: '18px', height: '18px', marginLeft: '4px' }} title="Copy HWID">
                                  {copiedKey === `hwid_${u.id}` ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                                </button>
                              </>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Not bound yet</span>
                            )}
                          </span>
                        </div>

                        {/* IP Address Row */}
                        <div className="user-info-row">
                          <span className="user-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
                            <Globe size={12} /> Last IP
                          </span>
                          <span className="user-info-value mono-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {u.last_ip ? (
                              <>
                                <span style={{ color: '#bae6fd', fontSize: '12px' }} title={u.last_ip}>{u.last_ip}</span>
                                <button onClick={() => copyToClipboard(u.last_ip, `ip_${u.id}`)} className="icon-btn" style={{ width: '18px', height: '18px', marginLeft: '4px' }} title="Copy IP">
                                  {copiedKey === `ip_${u.id}` ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                                </button>
                              </>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Not logged yet</span>
                            )}
                          </span>
                        </div>

                        <div className="user-info-row">
                          <span className="user-info-label">Expires</span>
                          <span className="user-info-value">
                            {u.expires_at === 0 ? 'Lifetime' : new Date(u.expires_at * 1000).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="user-info-row">
                          <span className="user-info-label">Last Login</span>
                          <span className="user-info-value">
                            {u.last_login === 0 ? 'Never' : new Date(u.last_login * 1000).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions: Edit, Reset HWID, Reset SID, Ban, Ban HWID, Ban IP, Delete */}
                      <div className="user-card-actions" style={{ gap: '6px', paddingTop: '14px' }}>
                        <button className="user-action-btn edit" onClick={() => startEditUser(u)} title="Edit user profile">
                          <Edit2 size={11} style={{ marginRight: '3px' }} /> Edit
                        </button>

                        {isLocked ? (
                          <button className="user-action-btn hwid" onClick={() => handleUnlockUser(u.id)} style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', borderColor: 'var(--warning)' }}>
                            <Unlock size={12} /> Unlock
                          </button>
                        ) : (
                          <button className="user-action-btn hwid" onClick={() => handleResetUserHwid(u.id)} disabled={!u.hwid} title="Reset HWID lock">
                            HWID
                          </button>
                        )}

                        <button className="user-action-btn edit" onClick={() => handleResetUserSid(u.id)} disabled={!u.sid} title="Reset SID">
                          SID
                        </button>

                        <button className={`user-action-btn ${isBanned ? 'unban' : 'ban'}`} onClick={() => handleToggleBanUser(u.id, u.username, u.status)}>
                          {isBanned ? 'Unban' : 'Ban'}
                        </button>

                        {/* Direct One-Click Blacklist HWID Button */}
                        {u.hwid && (
                          <button 
                            className="user-action-btn delete" 
                            onClick={() => handleQuickBlacklistHwid(u.hwid, u.username)} 
                            title="Permanently Blacklist User's Hardware ID (HWID)"
                            style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                          >
                            <Ban size={11} style={{ marginRight: '2px' }} /> Ban HWID
                          </button>
                        )}

                        {/* Direct One-Click Blacklist IP Button */}
                        {u.last_ip && (
                          <button 
                            className="user-action-btn" 
                            onClick={() => handleQuickBlacklistIp(u.last_ip, u.username)} 
                            title="Permanently Blacklist User's IP Address"
                            style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                          >
                            <Globe size={11} style={{ marginRight: '2px' }} /> Ban IP
                          </button>
                        )}

                        <button className="user-action-btn delete" onClick={() => handleDeleteUser(u.id)} title="Delete user">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 3.5 LIVE ONLINE RADAR TAB (REAL-TIME TELEMETRY & INSTANT KILL) ───────── */}
        {activeNav === 'radar' && (
          <div className="animate-slide-up">
            {isFreePlan ? (
              <div className="users-empty" style={{ padding: '60px 20px', maxWidth: '640px', margin: '40px auto', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.04)' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '16px',
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)'
                }}>
                  <Crown size={34} fill="#f59e0b" />
                </div>
                <div className="badge badge-warning" style={{ fontSize: '11px', padding: '4px 10px', marginBottom: '12px' }}>
                  DEVELOPER & PRO EXCLUSIVE
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '10px', color: '#fff' }}>
                  Live Radar is a Premium Feature
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '26px', maxWidth: '480px', lineHeight: 1.6 }}>
                  Free plan does not include real-time telemetry. Upgrade to the <strong>Developer Plan ($1.20/mo)</strong> or <strong>Pro Developer ($3.20/mo)</strong> to monitor live active client sessions in real-time, view interactive node telemetry, and remotely terminate unauthorized sessions.
                </p>
                <button 
                  onClick={onUpgradeClick} 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '13px 28px', fontSize: '14px', fontWeight: 800,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 0 25px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  <Crown size={16} fill="#ffffff" style={{ marginRight: '8px' }} /> Upgrade to Developer ($1.20/mo)
                </button>
              </div>
            ) : (
              <>
                {/* Content Header */}
                <header className="content-header" style={{ marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    position: 'relative',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}>
                    <Radio size={18} className="radar-pulsing-icon" />
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 10px #10b981'
                    }} />
                  </div>
                  <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Live Online Radar
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '20px',
                      padding: '2px 10px'
                    }}>
                      LIVE FEED
                    </span>
                  </h1>
                </div>
                <p className="page-subtitle" style={{ marginTop: '6px' }}>
                  Real-time client telemetry, active machine heartbeats, and instant process killswitch controls.
                </p>
              </div>

              <div className="flex-align" style={{ gap: '10px', flexWrap: 'wrap' }}>
                {/* Auto refresh status badge / button */}
                <button
                  onClick={() => setRadarAutoRefresh(!radarAutoRefresh)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '12px',
                    padding: '8px 14px',
                    background: radarAutoRefresh ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: radarAutoRefresh ? 'rgba(16, 185, 129, 0.35)' : 'var(--border)',
                    color: radarAutoRefresh ? '#10b981' : 'var(--text-muted)'
                  }}
                  title="Toggle 3-second live auto polling"
                >
                  <Activity size={14} style={{ marginRight: '6px' }} />
                  Auto-Refresh (3s): {radarAutoRefresh ? 'ON' : 'PAUSED'}
                </button>

                {/* Manual Refresh */}
                <button
                  onClick={() => fetchLiveUsers(radarSelectedApp)}
                  disabled={isRefreshingRadar}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  <RefreshCw size={13} className={isRefreshingRadar ? 'spinning' : ''} style={{ marginRight: '6px' }} />
                  Sync Radar
                </button>

                {/* Emergency Kill All Sessions for Current App */}
                <button
                  onClick={() => handleKillAllSessions(radarSelectedApp !== 'all' ? radarSelectedApp : selectedAppId)}
                  className="btn btn-danger"
                  style={{ fontSize: '12px', padding: '8px 14px', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                  title="Kill all currently active client sessions for selected app"
                >
                  <Zap size={14} style={{ marginRight: '6px' }} />
                  Emergency Kill All
                </button>
              </div>
            </header>

            {/* 4 Telemetry Stat Metric Cards (Obsidian Design) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {/* Active Online */}
              <div style={{
                background: '#12141a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px 22px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Active Workstations
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '11px',
                    color: '#10b981',
                    fontWeight: 700
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                    LIVE
                  </span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
                  {activeRadarCount}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>
                  Transmitting real-time heartbeats
                </div>
              </div>

              {/* Terminated Sessions */}
              <div style={{
                background: '#12141a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px 22px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Killed / Locked
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    fontSize: '11px',
                    color: '#ef4444',
                    fontWeight: 700
                  }}>
                    <Ban size={11} /> LOCKED
                  </span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: killedRadarCount > 0 ? '#ef4444' : '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
                  {killedRadarCount}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>
                  Blocked instantly on heartbeat & login
                </div>
              </div>

              {/* Heartbeat Frequency */}
              <div style={{
                background: '#12141a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px 22px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Heartbeat Cadence
                  </span>
                  <Clock size={15} color="#94a3b8" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
                  &lt; 120s
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>
                  Clients ping every 30 seconds
                </div>
              </div>

              {/* Telemetry Scope */}
              <div style={{
                background: '#12141a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px 22px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Filtered Application
                  </span>
                  <Laptop size={15} color="#94a3b8" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {radarSelectedApp === 'all' ? 'All Applications' : (apps.find(a => a.id === radarSelectedApp)?.app_name || 'Selected App')}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>
                  {apps.length} configured desktop apps
                </div>
              </div>
            </div>

            {/* Filter Toolbar (Obsidian Surface) */}
            <div style={{
              background: '#12141a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '22px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Left Controls: Search Box + Combobox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                {/* Custom Obsidian Search Box */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1,
                  maxWidth: '420px',
                  minWidth: '240px'
                }}>
                  <Search size={15} style={{
                    position: 'absolute',
                    left: '14px',
                    color: '#64748b',
                    pointerEvents: 'none',
                    zIndex: 2
                  }} />
                  <input
                    type="text"
                    placeholder="Search client, HWID, IP address, or app..."
                    value={radarSearch}
                    onChange={e => setRadarSearch(e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 38px 0 40px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.06)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {radarSearch && (
                    <button
                      onClick={() => setRadarSearch('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: '#94a3b8',
                        borderRadius: '6px',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Custom Obsidian Combobox (Select) */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <select
                    value={radarSelectedApp}
                    onChange={e => {
                      const val = e.target.value;
                      setRadarSelectedApp(val);
                      fetchLiveUsers(val);
                    }}
                    style={{
                      height: '42px',
                      padding: '0 38px 0 14px',
                      background: '#141620',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '220px',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.06)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="all" style={{ background: '#141620', color: '#ffffff', padding: '10px' }}>
                      Global (All Applications)
                    </option>
                    {apps.map(app => (
                      <option key={app.id} value={app.id} style={{ background: '#141620', color: '#ffffff', padding: '10px' }}>
                        {app.app_name} (v{app.version || '1.0.0'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      color: '#94a3b8',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Right: Status Filter Segmented Capsule */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  onClick={() => setRadarStatusFilter('all')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    background: radarStatusFilter === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    color: radarStatusFilter === 'all' ? '#ffffff' : '#94a3b8',
                    boxShadow: radarStatusFilter === 'all' ? '0 2px 6px rgba(0, 0, 0, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All ({liveUsers.length})
                </button>
                <button
                  onClick={() => setRadarStatusFilter('active')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    background: radarStatusFilter === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: radarStatusFilter === 'active' ? '#34d399' : '#94a3b8',
                    boxShadow: radarStatusFilter === 'active' ? '0 2px 6px rgba(16, 185, 129, 0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Active Online ({activeRadarCount})
                </button>
                <button
                  onClick={() => setRadarStatusFilter('killed')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    background: radarStatusFilter === 'killed' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    color: radarStatusFilter === 'killed' ? '#f87171' : '#94a3b8',
                    boxShadow: radarStatusFilter === 'killed' ? '0 2px 6px rgba(239, 68, 68, 0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Killed / Locked ({killedRadarCount})
                </button>
              </div>
            </div>

            {/* Live Telemetry Table View */}
            <div style={{
              background: '#12141a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 28px rgba(0, 0, 0, 0.4)'
            }}>
              {filteredRadarUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px dashed rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#10b981'
                  }}>
                    <Radio size={28} className="radar-pulsing-icon" />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>
                    {radarSearch ? 'No matching live sessions found' : 'Radar Scanning - No Connected Desktop Clients'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 18px' }}>
                    {radarSearch
                      ? `No active client heartbeats match query "${radarSearch}". Clear the search or filter to view all clients.`
                      : 'When users launch your C++, C#, Python, or Node.js software integrated with the HabitAuth SDK, their live telemetry ping will appear on this radar instantly.'}
                  </p>
                  {radarSearch && (
                    <button onClick={() => setRadarSearch('')} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                      Clear Search Filter
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Client User</th>
                        <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Application</th>
                        <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Hardware ID (HWID)</th>
                        <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Network IP</th>
                        <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Last Heartbeat</th>
                        <th style={{ textAlign: 'right', paddingRight: '18px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Session Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRadarUsers.map(u => {
                        const isKilled = Boolean(u.is_killed || u.session_killed);
                        return (
                          <tr
                            key={u.id}
                            style={{
                              background: isKilled ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                              transition: 'background 0.2s'
                            }}
                          >
                            {/* Status badge */}
                            <td style={{ padding: '12px 16px' }}>
                              {isKilled ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: '20px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.35)'
                                }}>
                                  <Ban size={11} /> KILLED (LOCKED)
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: '20px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16, 185, 129, 0.35)'
                                }}>
                                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                  ONLINE
                                </span>
                              )}
                            </td>

                            {/* Client User */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: isKilled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: isKilled ? '#ef4444' : '#60a5fa',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '13px'
                                }}>
                                  {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: '13px' }}>
                                    @{u.username}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    ID: {u.id?.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Application */}
                            <td>
                              <div>
                                <span className="badge badge-primary" style={{ fontSize: '11px', padding: '3px 8px' }}>
                                  {u.app_name || 'Application'}
                                </span>
                                {u.app_version && (
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                                    v{u.app_version}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* HWID */}
                            <td>
                              {u.hwid ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span
                                    className="mono-text"
                                    style={{
                                      fontSize: '11.5px',
                                      background: 'rgba(0, 0, 0, 0.35)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}
                                    title={u.hwid}
                                  >
                                    {u.hwid.length > 16 ? `${u.hwid.slice(0, 16)}...` : u.hwid}
                                  </span>
                                  {u.hwid.length > 16 && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRadarUser(u)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        background: 'rgba(59, 130, 246, 0.15)',
                                        border: '1px solid rgba(59, 130, 246, 0.35)',
                                        color: '#60a5fa',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '1px 7px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      title="Click to view full HWID in popup"
                                    >
                                      more
                                    </button>
                                  )}
                                  <button
                                    className="icon-btn"
                                    onClick={() => copyToClipboard(u.hwid, `hwid_radar_${u.id}`)}
                                    title="Copy HWID"
                                    style={{ padding: '3px' }}
                                  >
                                    {copiedKey === `hwid_radar_${u.id}` ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unbound</span>
                              )}
                            </td>

                            {/* Network IP */}
                            <td>
                              {u.last_ip ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="mono-text" style={{ fontSize: '12px' }}>
                                    {u.last_ip}
                                  </span>
                                  <button
                                    className="icon-btn"
                                    onClick={() => copyToClipboard(u.last_ip, `ip_radar_${u.id}`)}
                                    title="Copy IP"
                                    style={{ padding: '3px' }}
                                  >
                                    {copiedKey === `ip_radar_${u.id}` ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>N/A</span>
                              )}
                            </td>

                            {/* Last Heartbeat */}
                            <td>
                              <div style={{ fontSize: '12px' }}>
                                {u.seconds_since_ping != null ? (
                                  <span style={{
                                    color: u.seconds_since_ping < 35 ? '#10b981' : (u.seconds_since_ping < 90 ? '#f59e0b' : '#ef4444'),
                                    fontWeight: 700
                                  }}>
                                    {u.seconds_since_ping}s ago
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>just now</span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Login: {u.last_login ? new Date(u.last_login * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                              </div>
                            </td>

                            {/* Session Actions */}
                            <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                                {/* Instant Kill or Revive */}
                                {isKilled ? (
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => handleReviveSession(u.id, u.username, u.application_id)}
                                    style={{
                                      fontSize: '11.5px',
                                      padding: '5px 10px',
                                      color: '#10b981',
                                      background: 'rgba(16, 185, 129, 0.12)',
                                      borderColor: 'rgba(16, 185, 129, 0.35)'
                                    }}
                                    title="Revive access and unlock client session"
                                  >
                                    <RefreshCw size={12} style={{ marginRight: '4px' }} /> Revive
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleKillSession(u.id, u.username, u.application_id)}
                                    style={{
                                      fontSize: '11.5px',
                                      padding: '5px 10px',
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      borderColor: 'rgba(239, 68, 68, 0.4)',
                                      color: '#ef4444'
                                    }}
                                    title="Instantly terminate running client process and lock login"
                                  >
                                    <Zap size={12} style={{ marginRight: '4px' }} /> Kill Session
                                  </button>
                                )}

                                {/* Ban HWID */}
                                {u.hwid && (
                                  <button
                                    onClick={() => handleQuickBlacklistHwid(u.hwid, u.username)}
                                    className="icon-btn"
                                    title="Permanently Blacklist HWID"
                                    style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '5px' }}
                                  >
                                    <Ban size={13} />
                                  </button>
                                )}

                                {/* Ban IP */}
                                {u.last_ip && (
                                  <button
                                    onClick={() => handleQuickBlacklistIp(u.last_ip, u.username)}
                                    className="icon-btn"
                                    title="Permanently Blacklist IP"
                                    style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '5px' }}
                                  >
                                    <Globe size={13} />
                                  </button>
                                )}

                                {/* View full modal */}
                                <button
                                  onClick={() => setSelectedRadarUser(u)}
                                  className="icon-btn"
                                  title="View Full Telemetry Details"
                                  style={{ padding: '5px' }}
                                >
                                  <Eye size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Dedicated Radar Full Details Popup Modal */}
            {selectedRadarUser && (
              <div 
                className="modal-overlay" 
                onClick={() => setSelectedRadarUser(null)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px'
                }}
              >
                <div 
                  className="modal-card" 
                  onClick={e => e.stopPropagation()}
                  style={{
                    maxWidth: '560px',
                    width: '94%',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    padding: '24px',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
                    background: 'var(--card-bg, #111318)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: selectedRadarUser.session_killed || selectedRadarUser.is_killed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: selectedRadarUser.session_killed || selectedRadarUser.is_killed ? '#ef4444' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Radio size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                          Workstation Telemetry Details
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          User: @{selectedRadarUser.username}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRadarUser(null)}
                      className="icon-btn"
                      style={{ padding: '6px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* HWID Box */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '5px' }}>
                        Hardware ID (HWID)
                      </label>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: '#60a5fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}>
                        <span style={{ wordBreak: 'break-all', overflowWrap: 'anywhere', flexGrow: 1 }}>
                          {selectedRadarUser.hwid || 'No hardware binding recorded'}
                        </span>
                        {selectedRadarUser.hwid && (
                          <button
                            className="icon-btn"
                            onClick={() => copyToClipboard(selectedRadarUser.hwid, 'radar_modal_hwid')}
                            title="Copy HWID"
                            style={{ padding: '4px', flexShrink: 0 }}
                          >
                            {copiedKey === 'radar_modal_hwid' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Grid for IP and Application */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '5px' }}>
                          IP Address
                        </label>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text)' }}>
                          {selectedRadarUser.last_ip || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '5px' }}>
                          Target Application
                        </label>
                        <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                          {selectedRadarUser.app_name || 'Application'}
                        </span>
                      </div>
                    </div>

                    {/* Grid for Timestamps */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '5px' }}>
                          Session Login Time
                        </label>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {selectedRadarUser.last_login ? new Date(selectedRadarUser.last_login * 1000).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '5px' }}>
                          Last Telemetry Ping
                        </label>
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                          {selectedRadarUser.seconds_since_ping != null ? `${selectedRadarUser.seconds_since_ping}s ago` : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{
                      marginTop: '10px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      justifyContent: 'flex-end'
                    }}>
                      {selectedRadarUser.session_killed || selectedRadarUser.is_killed ? (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            handleReviveSession(selectedRadarUser.id, selectedRadarUser.username, selectedRadarUser.application_id);
                            setSelectedRadarUser(null);
                          }}
                          style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                        >
                          <RefreshCw size={13} style={{ marginRight: '6px' }} /> Revive Session
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            handleKillSession(selectedRadarUser.id, selectedRadarUser.username, selectedRadarUser.application_id);
                            setSelectedRadarUser(null);
                          }}
                        >
                          <Zap size={13} style={{ marginRight: '6px' }} /> Kill Session
                        </button>
                      )}

                      {selectedRadarUser.hwid && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            handleQuickBlacklistHwid(selectedRadarUser.hwid, selectedRadarUser.username);
                            setSelectedRadarUser(null);
                          }}
                          style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                        >
                          <Ban size={13} style={{ marginRight: '6px' }} /> Ban HWID
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedRadarUser(null)}
                        className="btn btn-secondary"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        )}

        {/* ── 4. LICENSES MANAGEMENT TAB (CARD-BASED UI) ───────── */}
        {activeNav === 'licenses' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">License Keys</h1>
                <p className="page-subtitle">Generate unpredictable cryptographic keys, revoke activations, or reset machine bindings.</p>
              </div>

              <div className="flex-align" style={{ gap: '10px', flexWrap: 'wrap' }}>
                {/* Freeze / Unfreeze Subscriptions */}
                <button 
                  onClick={handleToggleFreezeLicenses}
                  className={`btn ${currentAppDetails?.subscriptions_frozen ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                  title="Freeze active subscriptions for maintenance so users do not lose time"
                >
                  <Snowflake size={14} style={{ marginRight: '6px' }} />
                  {currentAppDetails?.subscriptions_frozen ? 'FROZEN (Click to Resume)' : 'Freeze Subscriptions'}
                </button>

                {/* Export TXT / CSV */}
                <button 
                  onClick={() => setShowExportModal(true)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  <Download size={14} style={{ marginRight: '6px' }} /> Export Keys
                </button>

                {/* Bulk Generate */}
                <button 
                  onClick={() => {
                    setBulkGeneratedKeys([]);
                    setShowBulkGenModal(true);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  <Crown size={14} style={{ marginRight: '6px', color: '#f59e0b' }} fill="#f59e0b" /> Bulk Generate
                </button>

                {appLicenses.length > 0 && (
                  <button 
                    onClick={handleDeleteAllLicenses} 
                    className="btn btn-secondary" 
                    style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.35)', fontSize: '12px', padding: '8px 14px' }}
                    title="Permanently wipe all licenses for this app"
                  >
                    <Trash2 size={13} style={{ marginRight: '6px' }} /> Delete All Keys ({appLicenses.length})
                  </button>
                )}
                <button onClick={() => setShowGenLicenseModal(true)} className="btn btn-primary" style={{ fontSize: '12px', padding: '8px 14px' }}>
                  <Plus size={15} style={{ marginRight: '6px' }} /> Generate Keys
                </button>
              </div>
            </header>

            {/* Frozen Notice Banner if subscriptions are frozen */}
            {currentAppDetails?.subscriptions_frozen && (
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '14px 20px', 
                  marginBottom: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--danger)'
                }}
              >
                <div className="flex-align" style={{ gap: '10px' }}>
                  <Snowflake size={20} color="var(--danger)" />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>SUBSCRIPTIONS ARE CURRENTLY FROZEN</span>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0 }}>
                      All user expiration timers are paused. When you resume, users will automatically receive extra validity for the maintenance period.
                    </p>
                  </div>
                </div>
                <button onClick={handleToggleFreezeLicenses} className="btn btn-primary" style={{ fontSize: '11.5px', padding: '6px 14px' }}>
                  Resume Subscriptions
                </button>
              </div>
            )}

            {/* Header Search & Filter */}
            <div className="users-header-bar">
              <div>
                <h3 className="users-title"><Key size={18} style={{ marginRight: '8px', color: 'var(--primary)' }} /> License Database</h3>
                <p className="users-subtitle">{filteredLicenses.length} of {appLicenses.length} licenses</p>
              </div>

              <div className="flex-align" style={{ gap: '10px' }}>
                <div className="users-search-wrap">
                  <Search size={15} className="users-search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search key, user..." 
                    className="users-search-input"
                    value={licenseSearch}
                    onChange={(e) => setLicenseSearch(e.target.value)}
                  />
                </div>

                <select 
                  className="form-select"
                  value={licenseFilter}
                  onChange={(e) => setLicenseFilter(e.target.value)}
                  style={{ width: '130px', padding: '7px 10px', fontSize: '12px', marginBottom: 0 }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="unused">Unused</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>

            {/* License Card Grid */}
            {filteredLicenses.length === 0 ? (
              <div className="users-empty">
                <Key size={36} opacity={0.3} style={{ marginBottom: '12px' }} />
                <p style={{ fontWeight: 700, fontSize: '15px' }}>No licenses yet</p>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>Generate your first license for this application.</span>
                <button onClick={() => setShowGenLicenseModal(true)} className="btn btn-primary">+ Generate License</button>
              </div>
            ) : (
              <div className="users-card-grid">
                {filteredLicenses.map(lic => {
                  const isRevoked = lic.status === 'revoked';
                  const isUnused = lic.status === 'unused';

                  return (
                    <div key={lic.id} className="user-card">
                      <div className="user-card-glow" />

                      {/* Header: Key + Status */}
                      <div className="flex-between">
                        <div className="flex-align" style={{ gap: '8px' }}>
                          <Key size={16} color="var(--primary)" />
                          <span style={{ fontWeight: 800, fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}>
                            {lic.license_key.slice(0, 16)}...
                          </span>
                        </div>
                        <span className={`badge ${isRevoked ? 'badge-danger' : isUnused ? 'badge-unused' : 'badge-active'}`}>
                          {lic.status}
                        </span>
                      </div>

                      {/* Body: User, Duration, Activations, Device */}
                      <div className="user-card-body">
                        <div className="user-info-row">
                          <span className="user-info-label">Bound User</span>
                          <span className="user-info-value">{lic.bound_username || <span style={{ color: 'var(--text-muted)' }}>Unbound</span>}</span>
                        </div>

                        <div className="user-info-row">
                          <span className="user-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
                            <KeyRound size={11} /> Startup Token
                          </span>
                          <span className="user-info-value mono-text" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {lic.token ? `${lic.token.slice(0, 12)}...` : 'N/A'}
                            {lic.token && (
                              <button onClick={() => copyToClipboard(lic.token, lic.token)} className="icon-btn" style={{ width: '16px', height: '16px', marginLeft: '4px' }}>
                                {copiedKey === lic.token ? <Check size={10} color="var(--success)" /> : <Copy size={10} />}
                              </button>
                            )}
                          </span>
                        </div>
                        <div className="user-info-row">
                          <span className="user-info-label">Duration</span>
                          <span className="user-info-value">{lic.duration_days === 0 ? 'Lifetime' : `${lic.duration_days} Days`}</span>
                        </div>
                        <div className="user-info-row">
                          <span className="user-info-label">Activations</span>
                          <span className="user-info-value">{lic.activations_count || 0}</span>
                        </div>
                        <div className="user-info-row">
                          <span className="user-info-label">HWID Lock</span>
                          <span className="user-info-value">{lic.bound_hwid ? 'ENABLED' : 'UNLOCKED'}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="user-card-actions" style={{ flexWrap: 'wrap' }}>
                        <button className="user-action-btn edit" onClick={() => copyToClipboard(lic.license_key, lic.id)}>
                          <Copy size={11} /> Copy
                        </button>
                        <button className={`user-action-btn ${isRevoked ? 'unban' : 'ban'}`} onClick={() => handleRevokeLicense(lic.id, lic.license_key)}>
                          {isRevoked ? 'Restore' : 'Revoke'}
                        </button>
                        {lic.bound_hwid && (
                          <button className="user-action-btn edit" title="Reset Hardware Profile Lock" onClick={() => handleResetLicenseHwid(lic.id, lic.license_key)}>
                            <RefreshCw size={11} /> Reset HWID
                          </button>
                        )}
                        <button className="user-action-btn ban" title="Delete License Key" onClick={() => handleDeleteLicense(lic.id, lic.license_key)}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 5. DEVICES (HWID) MANAGEMENT TAB ─────────────────── */}
        {activeNav === 'devices' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">Connected Devices (HWID)</h1>
                <p className="page-subtitle">Inspect client machine fingerprints and hardware profile bindings.</p>
              </div>
            </header>

            <div className="users-card-grid">
              {appUsers.filter(u => u.hwid).length === 0 ? (
                <div className="users-empty" style={{ gridColumn: '1 / -1' }}>
                  <Laptop size={36} opacity={0.3} style={{ marginBottom: '12px' }} />
                  <p style={{ fontWeight: 700, fontSize: '15px' }}>No bound devices</p>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Devices will appear here once users authenticate through the C# SDK.</span>
                </div>
              ) : (
                appUsers.filter(u => u.hwid).map(u => (
                  <div key={u.id} className="user-card">
                    <div className="user-card-glow" />
                    <div className="user-card-header">
                      <div className="user-avatar"><Laptop size={18} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="user-card-name">{u.username}'s PC</div>
                        <div className="user-card-meta">Windows Workstation</div>
                      </div>
                      <span className="badge badge-active">BOUND</span>
                    </div>

                    <div className="user-card-body">
                      <div className="user-info-row">
                        <span className="user-info-label">HWID Hash</span>
                        <span className="user-info-value mono-text" onClick={() => copyToClipboard(u.hwid, u.id)} style={{ cursor: 'pointer' }}>
                          {u.hwid.slice(0, 16)}... <Copy size={10} style={{ display: 'inline' }} />
                        </span>
                      </div>
                      <div className="user-info-row">
                        <span className="user-info-label">Last IP</span>
                        <span className="user-info-value mono-text">{u.last_ip || 'N/A'}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="user-info-label">Last Active</span>
                        <span className="user-info-value">{u.last_login ? new Date(u.last_login * 1000).toLocaleDateString() : 'Active'}</span>
                      </div>
                    </div>

                    <div className="user-card-actions">
                      <button className="user-action-btn hwid" onClick={() => handleResetUserHwid(u.id)}>
                        Reset Machine Binding
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── 5B. BANNED HWIDs TAB ─────────────────────────────── */}
        {activeNav === 'banned' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title flex-align">
                  <Ban size={22} color="var(--danger)" style={{ marginRight: '10px' }} />
                  Banned Hardware IDs (HWID Blacklist)
                </h1>
                <p className="page-subtitle">
                  Permanently blocked device hardware signatures. Any banned HWID is automatically denied during authentication, license activation, and heartbeats.
                </p>
              </div>

              <div className="flex-align" style={{ gap: '10px' }}>
                <button 
                  onClick={() => {
                    setNewBlacklistType('hwid');
                    setShowAddBlacklistModal(true);
                  }} 
                  className="btn btn-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                >
                  <Plus size={15} /> Ban New HWID
                </button>
                <button 
                  onClick={fetchBlacklists} 
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                  title="Refresh Banned HWIDs"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </header>

            {/* Filter & Search Bar */}
            <div className="users-header-bar" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-danger" style={{ fontSize: '11px', padding: '5px 10px', fontWeight: 800 }}>
                  <ShieldAlert size={13} style={{ marginRight: '5px' }} />
                  {blacklists.filter(b => b.type === 'hwid').length} BANNED HWIDs
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Total Blocked Hardware Profiles
                </span>
              </div>

              <div className="users-search-wrap" style={{ maxWidth: '320px', marginLeft: 'auto' }}>
                <Search size={15} className="users-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search banned HWID, reason, or app..." 
                  className="users-search-input"
                  value={blacklistSearch}
                  onChange={(e) => setBlacklistSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Banned HWID Table */}
            <div className="table-wrapper glass-panel">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '24%' }}>Blocked Hardware ID (HWID)</th>
                    <th style={{ width: '16%' }}>Scope / Application</th>
                    <th style={{ width: '32%' }}>Ban Reason / Infraction</th>
                    <th style={{ width: '16%', whiteSpace: 'nowrap' }}>Banned Date</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blacklists
                    .filter(b => b.type === 'hwid')
                    .filter(b => {
                      if (!blacklistSearch) return true;
                      const q = blacklistSearch.toLowerCase();
                      return b.value?.toLowerCase().includes(q) || b.reason?.toLowerCase().includes(q) || b.app_name?.toLowerCase().includes(q);
                    })
                    .map(b => (
                      <tr key={b.id}>
                        <td>
                          <div className="flex-align" style={{ gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: 800, color: '#f87171', letterSpacing: '0.5px' }} title={b.value}>
                              {b.value && b.value.length > 20 ? `${b.value.slice(0, 16)}...` : b.value}
                            </span>
                            {b.value && b.value.length > 20 && (
                              <button
                                type="button"
                                onClick={() => setSelectedBanInfraction(b)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  border: '1px solid rgba(59, 130, 246, 0.35)',
                                  color: '#60a5fa',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '1px 7px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                title="Click to view full HWID in popup"
                              >
                                more
                              </button>
                            )}
                            <button 
                              className="icon-btn" 
                              onClick={() => copyToClipboard(b.value, `hwid_${b.id}`)}
                              title="Copy HWID"
                              style={{ padding: '4px' }}
                            >
                              {copiedKey === `hwid_${b.id}` ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${b.app_name ? 'badge-primary' : 'badge-secondary'}`} style={{ fontSize: '10.5px' }}>
                            {b.app_name ? b.app_name : 'Global (All Apps)'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                          <span style={{ color: '#fca5a5', fontWeight: 500 }}>
                            {b.reason && b.reason.length > 38 ? b.reason.slice(0, 38) + '... ' : (b.reason || 'Administrative hardware ban')}
                          </span>
                          {b.reason && b.reason.length > 38 && (
                            <button
                              type="button"
                              onClick={() => setSelectedBanInfraction(b)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                background: 'rgba(59, 130, 246, 0.15)',
                                border: '1px solid rgba(59, 130, 246, 0.35)',
                                color: '#60a5fa',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '1px 7px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginLeft: '5px',
                                transition: 'all 0.2s'
                              }}
                              title="Click to view full infraction reason in popup"
                            >
                              more
                            </button>
                          )}
                        </td>
                        <td style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: '155px' }}>
                          {new Date(b.created_at * 1000).toLocaleString()}
                        </td>
                        <td>
                          <span className="badge badge-danger" style={{ fontSize: '10px', fontWeight: 800 }}>
                            <Ban size={10} style={{ marginRight: '4px' }} /> BANNED
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => handleRemoveBlacklist(b.id, b.value, 'hwid')} 
                            className="btn btn-secondary" 
                            style={{ 
                              padding: '6px 14px', 
                              fontSize: '11.5px', 
                              fontWeight: 700,
                              color: 'var(--success)', 
                              borderColor: 'rgba(34,197,94,0.4)',
                              background: 'rgba(34,197,94,0.08)'
                            }}
                            title="Unban this Hardware ID"
                          >
                            <Unlock size={13} style={{ marginRight: '5px' }} /> Unban HWID
                          </button>
                        </td>
                      </tr>
                    ))}

                  {blacklists.filter(b => b.type === 'hwid').length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                        <Shield size={36} opacity={0.3} style={{ margin: '0 auto 10px', color: 'var(--success)' }} />
                        <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                          No Banned Hardware IDs
                        </p>
                        <span style={{ fontSize: '12.5px' }}>
                          All devices have normal access. Use "Ban New HWID" to permanently block fraudulent or tampered hardware.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Ban Reason / Infraction Details Modal Popup */}
            {selectedBanInfraction && (
              <div className="modal-overlay" onClick={() => setSelectedBanInfraction(null)}>
                <div 
                  className="modal-content glass-panel animate-scale-in" 
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '540px', width: '92%', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '24px', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '10px', 
                        background: 'rgba(239, 68, 68, 0.2)', 
                        color: '#ef4444', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <ShieldAlert size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Ban Reason & Infraction Details
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hardware Blacklist Incident Report</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedBanInfraction(null)} 
                      className="icon-btn" 
                      style={{ padding: '6px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '5px' }}>
                        Blocked Hardware ID (HWID)
                      </label>
                      <div style={{ 
                        background: 'rgba(0,0,0,0.45)', 
                        padding: '10px 14px', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '12.5px', 
                        fontWeight: 800, 
                        color: '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere'
                      }}>
                        <span style={{ wordBreak: 'break-all', overflowWrap: 'anywhere', flexGrow: 1 }}>{selectedBanInfraction.value}</span>
                        <button 
                          className="icon-btn" 
                          onClick={() => copyToClipboard(selectedBanInfraction.value, 'modal_hwid')}
                          title="Copy HWID"
                          style={{ padding: '4px', flexShrink: 0 }}
                        >
                          {copiedKey === 'modal_hwid' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '5px' }}>
                          Scope / Application
                        </label>
                        <span className={`badge ${selectedBanInfraction.app_name ? 'badge-primary' : 'badge-secondary'}`} style={{ fontSize: '11.5px', padding: '6px 12px' }}>
                          {selectedBanInfraction.app_name || 'Global (All Apps)'}
                        </span>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '5px' }}>
                          Incident Timestamp
                        </label>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'inline-block', paddingTop: '4px' }}>
                          {new Date(selectedBanInfraction.created_at * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '6px' }}>
                        Full Infraction Description & Security Log
                      </label>
                      <div style={{ 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                        borderRadius: '10px', 
                        padding: '16px',
                        color: '#fca5a5', 
                        fontSize: '13.5px', 
                        lineHeight: '1.6',
                        fontWeight: 500,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {selectedBanInfraction.reason || 'Administrative hardware ban: Security integrity violation or unauthorized tampering detected.'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button 
                      onClick={() => setSelectedBanInfraction(null)} 
                      className="btn btn-secondary"
                      style={{ padding: '8px 22px', fontSize: '12.5px' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 6. WEBHOOKS TAB (DISCORD & TELEGRAM WITH GRANULAR ROLES) ── */}
        {activeNav === 'webhooks' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">Webhooks & Alert Integrations</h1>
                <p className="page-subtitle">Deliver real-time alerts to Discord channels or Telegram groups for specific roles & events.</p>
              </div>
            </header>

            <div className="glass-panel" style={{ padding: '28px', maxWidth: '840px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Configure Webhook Integration</h3>
                <span className="badge badge-active" style={{ fontSize: '12px' }}>Role-Filtered Alerts</span>
              </div>

              {/* Platform Selector Toggle */}
              <div className="webhook-platform-toggle">
                <button
                  type="button"
                  onClick={() => setWebhookPlatform('discord')}
                  className={`webhook-platform-btn ${webhookPlatform === 'discord' ? 'active-discord' : ''}`}
                >
                  <DiscordIcon size={18} color={webhookPlatform === 'discord' ? '#ffffff' : '#5865F2'} /> Discord Webhook
                </button>
                <button
                  type="button"
                  onClick={() => setWebhookPlatform('telegram')}
                  className={`webhook-platform-btn ${webhookPlatform === 'telegram' ? 'active-telegram' : ''}`}
                >
                  <TelegramIcon size={18} color={webhookPlatform === 'telegram' ? '#ffffff' : '#229ED9'} /> Telegram Bot Webhook
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!webhookName.trim()) {
                  showToast('Please provide an Integration Name.');
                  return;
                }
                if (webhookRoles.length === 0) {
                  showToast('Please select at least one role/event for this webhook.');
                  return;
                }
                if (webhookPlatform === 'discord' && !webhookUrl.trim()) {
                  showToast('Please provide a Discord Webhook URL.');
                  return;
                }
                if (webhookPlatform === 'telegram' && (!webhookTgToken.trim() || !webhookTgChatId.trim())) {
                  showToast('Please provide both Telegram Bot Token and Chat ID.');
                  return;
                }

                setIsSavingWebhook(true);
                try {
                  const payload = {
                    name: webhookName.trim(),
                    platform: webhookPlatform,
                    url: webhookPlatform === 'discord' ? webhookUrl.trim() : '',
                    telegram_token: webhookTgToken.trim(),
                    telegram_chat_id: webhookTgChatId.trim(),
                    events: webhookRoles.join(',')
                  };

                  const res = await fetch(`/api/v1/apps/${selectedAppId}/webhooks`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(payload)
                  });
                  const data = await res.json();
                  if (data.success) {
                    showToast(data.message || 'Webhook integration saved!');
                    setWebhookName('');
                    setWebhookUrl('');
                    setWebhookTgToken('');
                    setWebhookTgChatId('');
                    fetchCurrentApp(selectedAppId);
                  } else {
                    showToast(data.message || 'Failed to save webhook');
                  }
                } catch (err) {
                  showToast('Error saving webhook: ' + err.message);
                } finally {
                  setIsSavingWebhook(false);
                }
              }}>
                <div className="form-group">
                  <label className="form-label">Integration Name</label>
                  <input 
                    type="text" 
                    value={webhookName}
                    onChange={(e) => setWebhookName(e.target.value)}
                    required 
                    placeholder={webhookPlatform === 'discord' ? 'e.g. Discord Security Channel' : 'e.g. Telegram Admin Alerts'} 
                    className="form-input" 
                  />
                </div>

                {webhookPlatform === 'discord' ? (
                  <div className="form-group">
                    <label className="form-label">Discord Webhook URL</label>
                    <input 
                      type="url" 
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      required 
                      placeholder="https://discord.com/api/webhooks/..." 
                      className="form-input" 
                      style={{ fontFamily: 'var(--font-mono)' }} 
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      Obtain from your Discord Server Settings &gt; Integrations &gt; Webhooks.
                    </small>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Telegram Bot Token</label>
                      <input 
                        type="text" 
                        value={webhookTgToken}
                        onChange={(e) => setWebhookTgToken(e.target.value)}
                        required 
                        placeholder="e.g. 7123456789:AAH_abcdef12345..." 
                        className="form-input" 
                        style={{ fontFamily: 'var(--font-mono)' }} 
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                        Create a bot via <b>@BotFather</b> on Telegram to get your bot token.
                      </small>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Telegram Chat ID / Channel</label>
                      <input 
                        type="text" 
                        value={webhookTgChatId}
                        onChange={(e) => setWebhookTgChatId(e.target.value)}
                        required 
                        placeholder="e.g. @mychannel or -100123456789 or 123456789" 
                        className="form-input" 
                        style={{ fontFamily: 'var(--font-mono)' }} 
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                        Your chat ID, group ID (with negative sign), or @channel_username.
                      </small>
                    </div>
                  </div>
                )}

                {/* Granular Roles Filter Container */}
                <div className="webhook-roles-container">
                  <div className="webhook-roles-header">
                    <div className="webhook-roles-title">
                      <Sliders size={14} style={{ color: 'var(--primary)' }} /> Select Webhook Roles &amp; Events
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        ({webhookRoles.length} selected — only selected roles will be sent)
                      </span>
                    </div>

                    <div className="webhook-presets">
                      <button 
                        type="button" 
                        className="webhook-preset-btn"
                        onClick={() => setWebhookRoles(WEBHOOK_AVAILABLE_ROLES.map(r => r.id))}
                      >
                        Select All
                      </button>
                      <button 
                        type="button" 
                        className="webhook-preset-btn"
                        onClick={() => setWebhookRoles(['login', 'register', 'user_banned'])}
                      >
                        Users Only
                      </button>
                      <button 
                        type="button" 
                        className="webhook-preset-btn"
                        onClick={() => setWebhookRoles(['user_banned', 'security_alert', 'account_locked', 'hwid_reset'])}
                      >
                        Security Only
                      </button>
                      <button 
                        type="button" 
                        className="webhook-preset-btn"
                        onClick={() => setWebhookRoles([])}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="webhook-roles-grid">
                    {WEBHOOK_AVAILABLE_ROLES.map(role => {
                      const isChecked = webhookRoles.includes(role.id);
                      const RoleIcon = role.icon;
                      return (
                        <div 
                          key={role.id} 
                          className={`webhook-role-card ${isChecked ? 'selected' : ''}`}
                          onClick={() => {
                            setWebhookRoles(prev => 
                              prev.includes(role.id) ? prev.filter(r => r !== role.id) : [...prev, role.id]
                            );
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="webhook-role-checkbox"
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="webhook-role-label" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              {RoleIcon && <RoleIcon size={14} style={{ color: isChecked ? 'var(--primary-light)' : 'var(--text-muted)', flexShrink: 0 }} />}
                              <span>{role.label}</span>
                            </div>
                            <div className="webhook-role-desc">{role.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSavingWebhook}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
                >
                  {isSavingWebhook ? <RefreshCw size={14} className="spin" /> : (webhookPlatform === 'telegram' ? <TelegramIcon size={16} color="#fff" /> : <DiscordIcon size={16} color="#fff" />)}
                  Save {webhookPlatform === 'telegram' ? 'Telegram' : 'Discord'} Webhook
                </button>
              </form>
            </div>

            {/* Webhook Cards Grid */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Active Webhook Integrations ({appWebhooks.length})</h3>
            </div>

            <div className="users-card-grid">
              {appWebhooks.map(hook => {
                const isTg = hook.platform === 'telegram' || (hook.url && hook.url.includes('telegram'));
                const activeRolesList = (hook.events || '').split(',').map(s => s.trim()).filter(Boolean);

                return (
                  <div key={hook.id} className="user-card">
                    <div className="user-card-glow" />
                    <div className="user-card-header">
                      <div className="user-avatar" style={{ background: isTg ? 'rgba(34, 158, 217, 0.15)' : 'rgba(88, 101, 242, 0.15)', color: isTg ? '#229ED9' : '#5865F2' }}>
                        {isTg ? <TelegramIcon size={18} color="#229ED9" /> : <DiscordIcon size={18} color="#5865F2" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="user-card-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {hook.name}
                        </div>
                        <div style={{ marginTop: '3px' }}>
                          <span className="badge" style={{ 
                            background: isTg ? 'rgba(34, 158, 217, 0.2)' : 'rgba(88, 101, 242, 0.2)',
                            color: isTg ? '#38bdf8' : '#a78bfa',
                            border: `1px solid ${isTg ? 'rgba(34, 158, 217, 0.4)' : 'rgba(88, 101, 242, 0.4)'}`,
                            fontSize: '10.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            {isTg ? <><TelegramIcon size={12} color="#38bdf8" /> Telegram</> : <><DiscordIcon size={12} color="#a78bfa" /> Discord</>}
                          </span>
                        </div>
                      </div>
                      <span className="badge badge-active">Active</span>
                    </div>

                    <div className="user-card-body">
                      {/* Active Roles Pills */}
                      <div style={{ marginBottom: '10px' }}>
                        <div className="user-info-label" style={{ marginBottom: '6px' }}>Configured Roles ({activeRolesList.length})</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {activeRolesList.map(r => (
                            <span key={r} className="webhook-role-pill active">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="user-info-row">
                        <span className="user-info-label">{isTg ? 'Chat ID' : 'Endpoint'}</span>
                        <span className="user-info-value mono-text">
                          {isTg ? (hook.telegram_chat_id || 'Configured') : `${hook.url.slice(0, 24)}...`}
                        </span>
                      </div>
                      <div className="user-info-row">
                        <span className="user-info-label">Created</span>
                        <span className="user-info-value">{new Date(hook.created_at * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="user-card-actions">
                      <button 
                        className="user-action-btn edit" 
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/v1/apps/${selectedAppId}/webhooks/${hook.id}/test`, { method: 'POST', headers: getHeaders() });
                            const d = await res.json();
                            if (d.success) {
                              showToast(d.message);
                            } else {
                              showToast(d.message, 'error');
                            }
                          } catch (err) {
                            showToast('Test ping failed: ' + err.message, 'error');
                          }
                        }}
                      >
                        <Send size={11} /> Test Ping
                      </button>
                      <button 
                        className="user-action-btn delete"
                        onClick={() => {
                          triggerConfirm({
                            title: 'Delete Webhook Integration',
                            message: `Are you sure you want to delete '${hook.name}'? Real-time notifications to this webhook will stop immediately.`,
                            confirmText: 'Delete Webhook',
                            cancelText: 'Cancel',
                            isDanger: true,
                            onConfirm: async () => {
                              try {
                                await fetch(`/api/v1/apps/${selectedAppId}/webhooks/${hook.id}`, { method: 'DELETE', headers: getHeaders() });
                                showToast('Webhook deleted successfully');
                                fetchCurrentApp(selectedAppId);
                              } catch (err) {
                                showToast('Failed to delete webhook');
                              }
                            }
                          });
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 7. TEAMS TAB (OWNER VIEW) ───────────────────────── */}
        {activeNav === 'teams' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">Team Collaboration</h1>
                <p className="page-subtitle">Invite developers, manage join requests, assign granular roles and permissions.</p>
              </div>

              {!myTeam ? (
                <button onClick={() => setShowCreateTeamModal(true)} className="btn btn-primary">
                  <Plus size={15} style={{ marginRight: '6px' }} /> Create Team
                </button>
              ) : (
                <button onClick={handleCloseTeam} className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  <Trash2 size={14} style={{ marginRight: '6px' }} /> Close & Disband Team
                </button>
              )}
            </header>

            {isFreePlan ? (
              <div className="users-empty" style={{ padding: '60px 20px', maxWidth: '640px', margin: '40px auto', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.04)' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '16px',
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)'
                }}>
                  <Crown size={34} fill="#f59e0b" />
                </div>
                <div className="badge badge-warning" style={{ fontSize: '11px', padding: '4px 10px', marginBottom: '12px' }}>
                  DEVELOPER PLAN EXCLUSIVE
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '10px', color: '#fff' }}>
                  Team Collaboration is a Premium Feature
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '26px', maxWidth: '480px', lineHeight: 1.6 }}>
                  Free plan does not support team creation. Upgrade to the <strong>Developer Plan ($1.20/mo)</strong> or <strong>Pro Developer ($3.20/mo)</strong> to create teams, invite members, assign custom roles & permissions, and build software collaboratively.
                </p>
                <button 
                  onClick={onUpgradeClick} 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '13px 28px', fontSize: '14px', fontWeight: 800,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 0 25px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  <Sparkles size={16} style={{ marginRight: '8px' }} /> Upgrade to Developer ($1.20/mo)
                </button>
              </div>
            ) : !myTeam ? (
              <div className="users-empty" style={{ padding: '60px 20px', maxWidth: '640px', margin: '40px auto' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '16px'
                }}>
                  <Users2 size={32} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Create Your Team</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '420px' }}>
                  Form a development team, generate unique invite codes, and grant team members granular access to your applications.
                </p>
                <form onSubmit={handleCreateTeam} style={{ width: '100%', maxWidth: '380px' }}>
                  <div className="form-group" style={{ textAlign: 'left' }}>
                    <label className="form-label">Team Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Apex Core Development" 
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="form-input" 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                    Create Team & Generate Invite Code
                  </button>
                </form>
              </div>
            ) : (
              <div>
                {/* Team Info Hero Card */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
                  <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
                    <div className="flex-align" style={{ gap: '16px' }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246,0.25) 0%, rgba(99,102,241,0.15) 100%)',
                        border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)', boxShadow: '0 0 20px var(--primary-glow)'
                      }}>
                        <Users2 size={26} />
                      </div>
                      <div>
                        <div className="flex-align" style={{ gap: '10px' }}>
                          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{myTeam.name}</h2>
                          <span className="badge badge-primary">OWNER</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Created on {new Date(myTeam.created_at * 1000).toLocaleDateString()} • Capacity: <b>{myTeam.membersCount} / {myTeam.max_members || (isProPlan ? 500 : 25)} Members</b>
                        </div>
                      </div>
                    </div>

                    {/* Invite Code with Copy & Regenerate */}
                    <div style={{
                      background: 'rgba(2, 2, 4, 0.7)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '14px'
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          Team Invite Code
                        </div>
                        <div className="font-mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: '1px' }}>
                          {myTeam.invite_code}
                        </div>
                      </div>

                      <button onClick={() => copyToClipboard(myTeam.invite_code, 'team_code')} className="btn btn-secondary" style={{ padding: '8px' }} title="Copy Code">
                        {copiedKey === 'team_code' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                      </button>

                      <button onClick={handleRegenTeamCode} className="btn btn-secondary" style={{ padding: '8px', color: 'var(--warning)' }} title="Regenerate Invite Code">
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 1: Pending Join Requests */}
                {myTeam.pendingRequests && myTeam.pendingRequests.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <div className="flex-align" style={{ gap: '8px', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Pending Join Requests</h3>
                      <span className="badge badge-warning">{myTeam.pendingRequests.length} New</span>
                    </div>

                    <div className="users-card-grid">
                      {myTeam.pendingRequests.map(req => (
                        <div key={req.id} className="user-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                          <div className="user-card-header">
                            <img src={req.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="user-avatar-img" alt={req.username} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="user-card-name">@{req.username}</div>
                              <div className="user-card-meta">Requested: {new Date(req.joined_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <span className="badge badge-warning">Awaiting</span>
                          </div>

                          <div className="user-card-actions" style={{ marginTop: '10px' }}>
                            <button onClick={() => handleAcceptMember(req.id)} className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '11.5px' }}>
                              <Check size={13} style={{ marginRight: '4px' }} /> Accept
                            </button>
                            <button onClick={() => handleRejectMember(req.id)} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '11.5px', color: 'var(--danger)' }}>
                              <X size={13} style={{ marginRight: '4px' }} /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Active Team Members */}
                <div style={{ marginBottom: '32px' }}>
                  <div className="flex-between" style={{ marginBottom: '14px' }}>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Active Team Members</h3>
                      <span className="badge badge-active">{myTeam.membersCount} Members</span>
                    </div>
                  </div>

                  <div className="users-card-grid">
                    {myTeam.members && myTeam.members.map(m => {
                      const isOwner = m.role === 'owner';
                      const perms = m.permissions || {};

                      return (
                        <div key={m.id} className="user-card">
                          <div className="user-card-header">
                            <img src={m.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="user-avatar-img" alt={m.username} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="user-card-name">@{m.username}</div>
                              <div className="user-card-meta">{m.email || 'Member'}</div>
                            </div>
                            <span 
                              className="badge" 
                              style={{
                                textTransform: 'uppercase',
                                fontSize: '10px',
                                fontWeight: 800,
                                letterSpacing: '0.5px',
                                background: isOwner 
                                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                  : m.role === 'admin'
                                  ? 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)'
                                  : m.role === 'manager'
                                  ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                                  : m.role === 'moderator'
                                  ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
                                  : m.role === 'support'
                                  ? 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)'
                                  : m.role === 'viewer'
                                  ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '3px 8px'
                              }}
                            >
                              {m.role?.toUpperCase() || 'DEVELOPER'}
                            </span>
                          </div>

                          <div className="user-card-body" style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>
                              Assigned Permissions
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '4px', background: perms.manage_users ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,255,255,0.03)', color: perms.manage_users ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                                Users: {perms.manage_users ? '✓' : '✗'}
                              </span>
                              <span style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '4px', background: perms.manage_licenses ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,255,255,0.03)', color: perms.manage_licenses ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                                Licenses: {perms.manage_licenses ? '✓' : '✗'}
                              </span>
                              <span style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '4px', background: perms.view_analytics ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,255,255,0.03)', color: perms.view_analytics ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                                Analytics: {perms.view_analytics ? '✓' : '✗'}
                              </span>
                              <span style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '4px', background: perms.manage_webhooks ? 'rgba(59, 130, 246,0.15)' : 'rgba(255,255,255,0.03)', color: perms.manage_webhooks ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                                Webhooks: {perms.manage_webhooks ? '✓' : '✗'}
                              </span>
                            </div>
                          </div>

                          {!isOwner && (
                            <div className="user-card-actions" style={{ marginTop: '14px' }}>
                              <button onClick={() => handleStartEditPermissions(m)} className="user-action-btn edit">
                                <Sliders size={11} style={{ marginRight: '3px' }} /> Role & Perms
                              </button>
                              <button onClick={() => handleKickMember(m.id, m.username)} className="user-action-btn ban" title="Kick from team">
                                Kick
                              </button>
                              <button onClick={() => handleOpenBlacklistModal(m)} className="user-action-btn delete" title="Blacklist user">
                                <Ban size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Blacklisted Users */}
                {myTeam.blacklistedUsers && myTeam.blacklistedUsers.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--danger)', marginBottom: '12px' }}>
                      Blacklisted Users ({myTeam.blacklistedUsers.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {myTeam.blacklistedUsers.map(b => (
                        <div key={b.id} className="glass-panel flex-between" style={{ padding: '12px 18px' }}>
                          <div className="flex-align" style={{ gap: '10px' }}>
                            <span className="badge badge-danger">BLOCKED</span>
                            <span style={{ fontWeight: 700, fontSize: '13px' }}>@{b.username}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reason: {b.reason}</span>
                          </div>
                          <button onClick={() => handleUnblacklist(b.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 8. JOIN TEAM TAB (USER VIEW) ──────────────────────── */}
        {activeNav === 'join-team' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">Join a Team</h1>
                <p className="page-subtitle">Collaborate on applications with a shared development team.</p>
              </div>
            </header>

            {pendingJoinRequest ? (
              <div className="glass-panel" style={{ maxWidth: '580px', padding: '36px', textAlign: 'center', margin: '40px auto' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', margin: '0 auto 16px'
                }}>
                  <Clock size={32} />
                </div>
                <span className="badge badge-warning" style={{ marginBottom: '12px' }}>REQUEST PENDING</span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
                  Awaiting Approval from Team Owner
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                  You submitted a join request for team <b>{pendingJoinRequest.team_name}</b> (Owner: <b>@{pendingJoinRequest.owner_username}</b>).
                  Once the owner accepts your request, your Team Dashboard will activate automatically.
                </p>
                <button onClick={handleCancelJoinRequest} className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
                  Cancel Join Request
                </button>
              </div>
            ) : (
              <div className="glass-panel" style={{ maxWidth: '540px', padding: '36px', margin: '40px auto', textAlign: 'center' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246,0.25) 0%, rgba(99,102,241,0.15) 100%)',
                  border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px', color: 'var(--primary)', boxShadow: '0 0 20px var(--primary-glow)'
                }}>
                  <Users2 size={30} />
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Join Team Workspace</h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Enter the unique invite code provided by your team owner to send an instant join request.
                </p>

                <form onSubmit={handleJoinTeamSubmit}>
                  <div className="form-group" style={{ textAlign: 'left' }}>
                    <label className="form-label">Team Invite Code</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. TEAM-4F2A-98C1" 
                      value={teamInviteCodeInput}
                      onChange={(e) => setTeamInviteCodeInput(e.target.value)}
                      className="form-input" 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', letterSpacing: '1px', textAlign: 'center' }}
                    />
                  </div>

                  <button type="submit" disabled={isJoiningTeam} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 800 }}>
                    {isJoiningTeam ? 'Sending Request...' : 'Send Join Request'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── 9. TEAM DASHBOARD TAB (ACCEPTED MEMBER VIEW) ──────── */}
        {activeNav === 'team-dashboard' && !joinedTeam && (
          <div className="animate-slide-up glass-panel" style={{ padding: '48px 32px', textAlign: 'center', marginTop: '30px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary-light)' }}>
              <Users2 size={28} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>No Active Team Workspace</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              You are not currently an active member of any team. Join a team using an invite code or return to your overview dashboard.
            </p>
            <div className="flex-align" style={{ justifyContent: 'center', gap: '12px' }}>
              <button 
                onClick={() => { setActiveNav('overview'); window.history.pushState({}, '', '/overview'); }} 
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontSize: '13px' }}
              >
                Go to Overview
              </button>
              <button 
                onClick={() => { setActiveNav('join-team'); window.history.pushState({}, '', '/teams'); }} 
                className="btn btn-secondary"
                style={{ padding: '10px 22px', fontSize: '13px' }}
              >
                Join a Team
              </button>
            </div>
          </div>
        )}

        {activeNav === 'team-dashboard' && joinedTeam && (
          <div className="animate-slide-up">
            <header className="content-header flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="flex-align" style={{ gap: '10px' }}>
                  <h1 className="page-title">{joinedTeam.team_name}</h1>
                  <span className="badge badge-primary">{joinedTeam.role.toUpperCase()}</span>
                </div>
                <p className="page-subtitle">Team Workspace owned by @{joinedTeam.owner_username}</p>
              </div>

              <button 
                onClick={handleLeaveTeam}
                className="btn btn-secondary"
                style={{
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
                title="Leave this team workspace"
              >
                <LogOut size={15} /> Leave Team
              </button>
            </header>

            {/* Member Permissions Overview Panel */}
            <div className="glass-panel" style={{ padding: '22px 28px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '10px' }}>Your Team Permissions</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span className={`badge ${joinedTeam.permissions.manage_users ? 'badge-active' : 'badge-danger'}`}>
                  Manage Users: {joinedTeam.permissions.manage_users ? 'ALLOWED' : 'RESTRICTED'}
                </span>
                <span className={`badge ${joinedTeam.permissions.manage_licenses ? 'badge-active' : 'badge-danger'}`}>
                  Manage Licenses: {joinedTeam.permissions.manage_licenses ? 'ALLOWED' : 'RESTRICTED'}
                </span>
                <span className={`badge ${joinedTeam.permissions.view_analytics ? 'badge-active' : 'badge-danger'}`}>
                  View Analytics: {joinedTeam.permissions.view_analytics ? 'ALLOWED' : 'RESTRICTED'}
                </span>
                <span className={`badge ${joinedTeam.permissions.manage_webhooks ? 'badge-active' : 'badge-danger'}`}>
                  Webhooks: {joinedTeam.permissions.manage_webhooks ? 'ALLOWED' : 'RESTRICTED'}
                </span>
              </div>
            </div>

            {/* Team Owner's Applications Available to Member */}
            {teamAppScope ? (
              <div className="animate-slide-up" style={{ marginTop: '16px' }}>
                <div className="flex-between" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div className="flex-align" style={{ gap: '12px' }}>
                    <button onClick={() => setTeamAppScope(null)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                      <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Team Apps
                    </button>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                        {teamAppScope.appName} — {teamAppScope.activeTab === 'users' ? 'Users Directory' : 'Licenses Directory'}
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>App ID: {teamAppScope.appId}</span>
                    </div>
                  </div>

                  <div className="flex-align" style={{ gap: '8px' }}>
                    <button 
                      onClick={() => handleOpenTeamAppUsers(teamAppScope.appId, teamAppScope.appName)}
                      className={`btn ${teamAppScope.activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                      disabled={!joinedTeam.permissions.manage_users}
                    >
                      Users ({teamAppScope.users?.length || 0})
                    </button>
                    <button 
                      onClick={() => handleOpenTeamAppLicenses(teamAppScope.appId, teamAppScope.appName)}
                      className={`btn ${teamAppScope.activeTab === 'licenses' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                      disabled={!joinedTeam.permissions.manage_licenses}
                    >
                      Licenses ({teamAppScope.licenses?.length || 0})
                    </button>
                  </div>
                </div>

                {teamAppScope.activeTab === 'users' ? (
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Hardware ID (HWID)</th>
                          <th>Status</th>
                          <th>Expiration</th>
                          <th>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!teamAppScope.users || teamAppScope.users.length === 0) ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>No client users registered under this application yet.</td></tr>
                        ) : (
                          teamAppScope.users.map(u => (
                            <tr key={u.id}>
                              <td style={{ fontWeight: 800 }}>@{u.username}</td>
                              <td className="mono-text" style={{ fontSize: '11px' }}>{u.hwid ? `${u.hwid.slice(0, 16)}...` : 'Not bound'}</td>
                              <td>
                                <span className={`badge ${u.status === 'active' ? 'badge-active' : 'badge-danger'}`}>
                                  {u.status?.toUpperCase()}
                                </span>
                              </td>
                              <td>{u.expires_at === 0 ? 'Lifetime' : new Date(u.expires_at * 1000).toLocaleDateString()}</td>
                              <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(u.created_at * 1000).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>License Key</th>
                          <th>Duration</th>
                          <th>Bound User</th>
                          <th>Status</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!teamAppScope.licenses || teamAppScope.licenses.length === 0) ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>No licenses generated for this app yet.</td></tr>
                        ) : (
                          teamAppScope.licenses.map(lic => (
                            <tr key={lic.id}>
                              <td className="mono-text" style={{ fontWeight: 800, color: 'var(--primary-light)' }}>{lic.license_key}</td>
                              <td>{lic.duration_days === 0 ? 'Lifetime' : `${lic.duration_days} Days`}</td>
                              <td>{lic.bound_username ? `@${lic.bound_username}` : <span style={{ color: 'var(--text-muted)' }}>Unused</span>}</td>
                              <td>
                                <span className={`badge ${lic.status === 'active' ? 'badge-active' : lic.status === 'unused' ? 'badge-primary' : 'badge-danger'}`}>
                                  {lic.status?.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(lic.created_at * 1000).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '14px' }}>Team Applications</h3>
                {(!joinedTeam.apps || joinedTeam.apps.length === 0) ? (
                  <div className="users-empty">
                    <Smartphone size={32} opacity={0.3} style={{ marginBottom: '10px' }} />
                    <p style={{ fontWeight: 700 }}>No applications created in this team yet.</p>
                  </div>
                ) : (
                  <div className="users-card-grid">
                    {joinedTeam.apps.map(app => (
                      <div key={app.id} className="user-card">
                        <div className="user-card-header">
                          <div className="user-avatar">{app.app_name.slice(0, 2).toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="user-card-name">{app.app_name}</div>
                            <div className="user-card-meta">v{app.version}</div>
                          </div>
                          <span className="badge badge-active">{app.status}</span>
                        </div>

                        <div className="user-card-body">
                          <div className="user-info-row">
                            <span className="user-info-label">App ID</span>
                            <span className="user-info-value mono-text">{app.id.slice(0, 14)}...</span>
                          </div>
                          <div className="user-info-row">
                            <span className="user-info-label">Users</span>
                            <span className="user-info-value">{app.total_users || 0}</span>
                          </div>
                          <div className="user-info-row">
                            <span className="user-info-label">Licenses</span>
                            <span className="user-info-value">{app.total_licenses || 0}</span>
                          </div>
                        </div>

                        <div className="user-card-actions">
                          <button 
                            className="user-action-btn edit" 
                            onClick={() => handleOpenTeamAppUsers(app.id, app.app_name)}
                            disabled={!joinedTeam.permissions.manage_users}
                            title={joinedTeam.permissions.manage_users ? 'Manage application users' : 'Permission required'}
                          >
                            {joinedTeam.permissions.manage_users ? 'Open Users' : 'Users Restricted'}
                          </button>

                          <button 
                            className="user-action-btn hwid" 
                            onClick={() => handleOpenTeamAppLicenses(app.id, app.app_name)}
                            disabled={!joinedTeam.permissions.manage_licenses}
                            title={joinedTeam.permissions.manage_licenses ? 'Manage licenses' : 'Permission required'}
                          >
                            {joinedTeam.permissions.manage_licenses ? 'Open Licenses' : 'Licenses Restricted'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 8. SDKs & INTEGRATIONS TAB ──────────────────────── */}
        {activeNav === 'sdks' && (
          <div className="animate-slide-up">
            <header className="content-header flex-between" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
              <div>
                <h1 className="page-title flex-align" style={{ gap: '10px' }}>
                  <span>Official Software Development Kits (SDKs)</span>
                  <span className="badge badge-primary">v{SDK_VERSION}</span>
                </h1>
                <p className="page-subtitle">
                  Lightweight, fast, and hardware-locked official client libraries for C#, C++, and JavaScript. Fully connected to the HabitAuth backend.
                </p>
              </div>

              {/* Example App Button (Configurable from Admin Panel) */}
              <a 
                href={exampleAppUrl || 'https://github.com/HabitAuth/HabitAuth-Example'}
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary flex-align"
                style={{
                  gap: '8px',
                  padding: '11px 22px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(59, 130, 246,0.35)'
                }}
                title="Open the official HabitAuth Example App repository on GitHub"
              >
                <Code2 size={16} />
                <span>Example App</span>
                <ExternalLink size={14} />
              </a>
            </header>

            {/* Scope App Credentials Pill */}
            {currentAppDetails && (
              <div className="glass-panel flex-between" style={{ padding: '16px 24px', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div className="flex-align" style={{ gap: '12px' }}>
                  <div className="user-avatar" style={{ width: '38px', height: '38px', fontSize: '13px' }}>
                    {currentAppDetails.app_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Target Application</span>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>{currentAppDetails.app_name}</div>
                  </div>
                </div>

                <div className="flex-align" style={{ gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '6px 14px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>App ID: </span>
                    <span className="mono-text" style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary-light)' }}>{currentAppDetails.id}</span>
                  </div>
                  <button onClick={() => copyToClipboard(currentAppDetails.id, 'sdk_appid')} className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '11.5px' }}>
                    {copiedKey === 'sdk_appid' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Language Selector Pills */}
            <div className="flex-align" style={{ gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {SDK_REGISTRY.map(sdk => (
                <button
                  key={sdk.id}
                  onClick={() => setSelectedSdkId(sdk.id)}
                  className={`btn ${selectedSdkId === sdk.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FileCode size={16} />
                  <span>{sdk.name}</span>
                  <span className="badge" style={{
                    background: selectedSdkId === sdk.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                    color: selectedSdkId === sdk.id ? '#fff' : 'var(--text-secondary)',
                    fontSize: '10.5px',
                    padding: '2px 6px'
                  }}>
                    {sdk.filename}
                  </span>
                </button>
              ))}
            </div>

            {/* Professional Developer-Style Code Viewer */}
            <SdkCodeViewer 
              sdk={SDK_REGISTRY.find(s => s.id === selectedSdkId) || SDK_REGISTRY[0]} 
              activeApp={currentAppDetails}
              onCopy={copyToClipboard}
              copiedKey={copiedKey}
            />
          </div>
        )}

        {/* ── 9. API PLAYGROUND TAB ────────────────────────────── */}
        {activeNav === 'playground' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">Interactive API Playground</h1>
                <p className="page-subtitle">Test REST API endpoints live directly from your browser.</p>
              </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {/* Request Builder */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Request Specification</h3>

                <div className="form-group">
                  <label className="form-label">Endpoint</label>
                  <select 
                    className="form-select"
                    value={playgroundEndpoint}
                    onChange={(e) => {
                      setPlaygroundEndpoint(e.target.value);
                      if (e.target.value === '/api/v1/auth/client-login') {
                        setPlaygroundBody('{\n  "app_id": "' + (currentAppDetails?.id || 'app_nexus_auth_demo') + '",\n  "username": "john_developer",\n  "password": "clientPass123!",\n  "hwid": "40d8688ebdb6b9f7a1c8901234567890"\n}');
                      } else if (e.target.value === '/api/v1/license/validate') {
                        setPlaygroundBody('{\n  "app_id": "' + (currentAppDetails?.id || 'app_nexus_auth_demo') + '",\n  "license_key": "HABIT-NEXUS-2026-ACTIVE"\n}');
                      }
                    }}
                  >
                    <option value="/api/v1/license/validate">POST /api/v1/license/validate</option>
                    <option value="/api/v1/auth/client-login">POST /api/v1/auth/client-login (with 24h lockout)</option>
                    <option value="/api/v1/license/activate">POST /api/v1/license/activate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Request Payload (JSON)</label>
                  <textarea 
                    rows={8}
                    value={playgroundBody}
                    onChange={(e) => setPlaygroundBody(e.target.value)}
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6 }}
                  />
                </div>

                <button 
                  onClick={handlePlaygroundSend}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={playgroundLoading}
                >
                  <Play size={14} style={{ marginRight: '6px' }} /> {playgroundLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>

              {/* Response Viewer */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Response Output</h3>
                  {playgroundResponse && (
                    <span className={`badge ${playgroundResponse.status < 400 ? 'badge-active' : 'badge-danger'}`}>
                      HTTP {playgroundResponse.status} {playgroundResponse.statusText}
                    </span>
                  )}
                </div>

                {playgroundResponse ? (
                  <pre style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12.5px', background: 'rgba(2,2,4,0.8)',
                    padding: '16px', borderRadius: 'var(--radius-md)', overflowX: 'auto',
                    border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', lineHeight: 1.6
                  }}>
                    {JSON.stringify(playgroundResponse.data, null, 2)}
                  </pre>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <Terminal size={32} opacity={0.3} style={{ margin: '0 auto 10px' }} />
                    <p>Send a request to inspect formatted response headers and JSON body.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 9. SECURITY CENTER TAB (ACTIVE SESSIONS & LOCKOUT) ─ */}
        {activeNav === 'security' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title">Security & Session Center</h1>
                <p className="page-subtitle">Track active web sessions, revoke sessions, and review 24-hour brute-force lockouts.</p>
              </div>

              <div className="flex-align" style={{ gap: '10px' }}>
                <button onClick={handleLogoutAllOther} className="btn btn-secondary" style={{ color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.3)', fontSize: '12px' }}>
                  Logout All Other Sessions
                </button>
                <button onClick={handleLogoutAll} className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', fontSize: '12px' }}>
                  Logout All Sessions
                </button>
              </div>
            </header>

            {/* Active Sessions Grid */}
            <div className="users-header-bar" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="users-title"><Laptop size={18} style={{ marginRight: '8px', color: 'var(--primary)' }} /> Active Web Sessions</h3>
                <p className="users-subtitle">All active login sessions for your Habit Auth dashboard account</p>
              </div>
            </div>

            <div className="users-card-grid" style={{ marginBottom: '40px' }}>
              {sessions.map(s => (
                <div key={s.id} className="user-card">
                  <div className="user-card-glow" />
                  <div className="user-card-header">
                    <div className="user-avatar"><Laptop size={18} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="user-card-name">{s.browser} on {s.os}</div>
                      <div className="user-card-meta">{s.device}</div>
                    </div>
                    {s.is_current ? (
                      <span className="badge badge-primary">CURRENT</span>
                    ) : (
                      <span className="badge badge-active">ACTIVE</span>
                    )}
                  </div>

                  <div className="user-card-body">
                    <div className="user-info-row">
                      <span className="user-info-label">IP Address</span>
                      <span className="user-info-value mono-text">{s.ip_address}</span>
                    </div>
                    <div className="user-info-row">
                      <span className="user-info-label">Login Time</span>
                      <span className="user-info-value">{new Date(s.created_at * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="user-info-row">
                      <span className="user-info-label">Last Active</span>
                      <span className="user-info-value">{new Date(s.last_active * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    {!s.is_current && (
                      <button className="user-action-btn delete" onClick={() => handleRevokeSession(s.id)} style={{ width: '100%', justifyContent: 'center' }}>
                        Logout Session
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 24-Hour Brute-Force Locked Users List */}
            <div className="users-header-bar" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="users-title" style={{ color: 'var(--warning)' }}>
                  <AlertCircle size={18} style={{ marginRight: '8px' }} /> 24-Hour Brute-Force Lockouts
                </h3>
                <p className="users-subtitle">Users who exceeded 5 failed password attempts and are locked for 24 hours</p>
              </div>
            </div>

            {lockedUsers.length === 0 ? (
              <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 600 }}>No accounts currently locked</p>
                <span style={{ fontSize: '12px' }}>When an account fails 5 login attempts, it will automatically lock for 24 hours and appear here.</span>
              </div>
            ) : (
              <div className="users-card-grid">
                {lockedUsers.map(lu => (
                  <div key={lu.id} className="user-card" style={{ border: '1px solid rgba(245,158,11,0.4)' }}>
                    <div className="user-card-header">
                      <div className="user-avatar" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}><Lock size={18} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="user-card-name">{lu.username}</div>
                        <div className="user-card-meta">App: {lu.app_name}</div>
                      </div>
                      <span className="badge badge-locked">LOCKED</span>
                    </div>

                    <div className="user-card-body">
                      <div className="user-info-row">
                        <span className="user-info-label">Failed Attempts</span>
                        <span className="user-info-value" style={{ color: 'var(--danger)', fontWeight: 800 }}>{lu.failed_attempts}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="user-info-label">Remaining Time</span>
                        <span className="user-info-value" style={{ color: 'var(--warning)' }}>{lu.remaining_hours} Hours</span>
                      </div>
                      <div className="user-info-row">
                        <span className="user-info-label">Attacker IP</span>
                        <span className="user-info-value mono-text">{lu.last_ip || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="user-card-actions">
                      <button className="user-action-btn hwid" onClick={() => handleUnlockUser(lu.id)} style={{ width: '100%', color: 'var(--warning)', borderColor: 'var(--warning)' }}>
                        <Unlock size={12} /> Unlock User Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── BLACKLIST SYSTEM SECTION (IP & HWID) ──────────────── */}
            <div className="users-header-bar" style={{ marginTop: '40px', marginBottom: '16px' }}>
              <div>
                <h3 className="users-title flex-align" style={{ color: 'var(--danger)' }}>
                  <Ban size={18} style={{ marginRight: '8px' }} /> Permanent Blacklist Center (IP & Hardware ID)
                </h3>
                <p className="users-subtitle">
                  Instantly deny access to fraud rings, cracked loaders, and malicious hardware profiles across all endpoints.
                </p>
              </div>

              <div className="flex-align" style={{ gap: '10px' }}>
                <button 
                  onClick={() => setShowAddBlacklistModal(true)} 
                  className="btn btn-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <Plus size={15} /> Add to Blacklist
                </button>
              </div>
            </div>

            <div className="users-header-bar" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setBlacklistTypeFilter('all')} 
                  className={`btn ${blacklistTypeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11.5px', padding: '6px 12px' }}
                >
                  All Entries ({blacklists.length})
                </button>
                <button 
                  onClick={() => setBlacklistTypeFilter('hwid')} 
                  className={`btn ${blacklistTypeFilter === 'hwid' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11.5px', padding: '6px 12px' }}
                >
                  Hardware IDs ({blacklists.filter(b => b.type === 'hwid').length})
                </button>
                <button 
                  onClick={() => setBlacklistTypeFilter('ip')} 
                  className={`btn ${blacklistTypeFilter === 'ip' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11.5px', padding: '6px 12px' }}
                >
                  IP Addresses ({blacklists.filter(b => b.type === 'ip').length})
                </button>
              </div>

              <div className="users-search-wrap" style={{ maxWidth: '300px', marginLeft: 'auto' }}>
                <Search size={15} className="users-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search blocked HWID, IP, reason..." 
                  className="users-search-input"
                  value={blacklistSearch}
                  onChange={(e) => setBlacklistSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-wrapper glass-panel">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Blocked Value</th>
                    <th>Reason / Note</th>
                    <th>Scope</th>
                    <th>Blocked Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blacklists
                    .filter(b => {
                      if (blacklistTypeFilter !== 'all' && b.type !== blacklistTypeFilter) return false;
                      if (!blacklistSearch) return true;
                      const q = blacklistSearch.toLowerCase();
                      return b.value?.toLowerCase().includes(q) || b.reason?.toLowerCase().includes(q);
                    })
                    .map(b => (
                      <tr key={b.id}>
                        <td>
                          <span className={`badge ${b.type === 'hwid' ? 'badge-danger' : 'badge-warning'}`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                            {b.type}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                          {b.value && b.value.length > 20 ? (
                            <div className="flex-align" style={{ gap: '6px' }}>
                              <span title={b.value}>{b.value.slice(0, 16)}...</span>
                              <button
                                type="button"
                                onClick={() => setSelectedBanInfraction(b)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  border: '1px solid rgba(59, 130, 246, 0.35)',
                                  color: '#60a5fa',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                                title="Click to view full value in popup"
                              >
                                more
                              </button>
                            </div>
                          ) : (
                            b.value
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.reason}</td>
                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: '10px' }}>
                            {b.app_name || 'Global'}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(b.created_at * 1000).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => handleRemoveBlacklist(b.id, b.value, b.type)} 
                            className="btn btn-secondary" 
                            style={{ padding: '5px 10px', fontSize: '11.5px', color: 'var(--success)', borderColor: 'rgba(34,197,94,0.3)' }}
                          >
                            <Unlock size={12} style={{ marginRight: '4px' }} /> Unblock
                          </button>
                        </td>
                      </tr>
                    ))}

                  {blacklists.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                        No blocked devices or IP addresses.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 9B. SUPPORT TICKETS TAB ─────────────────────────── */}
        {activeNav === 'tickets' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title flex-align">
                  <MessageSquare size={22} color="var(--primary)" style={{ marginRight: '10px' }} />
                  Customer Support & Tickets
                </h1>
                <p className="page-subtitle">
                  Manage end-user inquiries, bug reports, and hardware assistance requests with real-time threaded chat.
                </p>
              </div>

              <div className="flex-align" style={{ gap: '10px' }}>
                <button 
                  onClick={() => setShowCreateTicketModal(true)} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Open New Ticket
                </button>
              </div>
            </header>

            {/* Filter & Search Bar */}
            <div className="users-header-bar" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'open', 'in-progress', 'resolved', 'closed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setTicketFilter(st)}
                    className={`btn ${ticketFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '11.5px', padding: '6px 12px', textTransform: 'capitalize' }}
                  >
                    {st.replace('-', ' ')} ({st === 'all' ? tickets.length : tickets.filter(t => t.status === st).length})
                  </button>
                ))}
              </div>

              <div className="users-search-wrap" style={{ maxWidth: '320px', marginLeft: 'auto' }}>
                <Search size={15} className="users-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search tickets by title, user..." 
                  className="users-search-input"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Tickets Table */}
            <div className="table-wrapper glass-panel">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject & Issue</th>
                    <th>Application</th>
                    <th>Client / Creator</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Messages</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets
                    .filter(t => {
                      if (ticketFilter !== 'all' && t.status !== ticketFilter) return false;
                      if (!ticketSearch) return true;
                      const q = ticketSearch.toLowerCase();
                      return t.id?.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q) || t.client_username?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.app_name?.toLowerCase().includes(q);
                    })
                    .map(t => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--primary-light)', fontWeight: 700 }}>
                          {t.id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '13.5px' }}>{t.title}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.description}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                            {t.app_name || 'Global'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.client_username || t.creator_name || 'User'}</td>
                        <td>
                          <span className={`badge ${
                            t.priority === 'critical' || t.priority === 'high' ? 'badge-danger' : t.priority === 'normal' ? 'badge-primary' : 'badge-secondary'
                          }`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            t.status === 'open' ? 'badge-active' : t.status === 'in-progress' ? 'badge-warning' : t.status === 'resolved' ? 'badge-primary' : 'badge-secondary'
                          }`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                            {t.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {t.message_count || 1}
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(t.updated_at * 1000).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                            <button 
                              onClick={() => fetchTicketMessages(t.id)} 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '11.5px' }}
                            >
                              <MessageSquare size={13} style={{ marginRight: '4px' }} /> View & Reply
                            </button>
                            <button 
                              onClick={() => handleDeleteTicket(t.id)} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 8px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                              title="Delete Ticket"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                        <LifeBuoy size={36} opacity={0.3} style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontWeight: 600 }}>No Support Tickets Yet</p>
                        <span style={{ fontSize: '12px' }}>Click "Open New Ticket" to create a support thread for end-users.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 10. AUDIT LOGS TAB ───────────────────────────────── */}
        {activeNav === 'audit' && (
          <div className="animate-slide-up">
            {/* 30-Day Automated Maintenance Advance Notice Banner */}
            {logRetention?.is_warning && (
              <div 
                className="glass-panel" 
                style={{ 
                  marginBottom: '20px', 
                  padding: '16px 20px', 
                  borderRadius: '14px',
                  background: logRetention.days_remaining === 1 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(185, 28, 28, 0.08))' 
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.08))',
                  border: logRetention.days_remaining === 1 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)',
                  boxShadow: logRetention.days_remaining === 1 ? '0 6px 24px rgba(239, 68, 68, 0.15)' : '0 6px 24px rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '780px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: logRetention.days_remaining === 1 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: logRetention.days_remaining === 1 ? '#ef4444' : '#f59e0b',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: '700', 
                      color: logRetention.days_remaining === 1 ? '#f87171' : '#fbbf24',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>
                        {logRetention.days_remaining === 1 
                          ? 'Final Notice: Database Audit Logs Will Be Cleared Tomorrow (in 1 Day)' 
                          : `30-Day Database Maintenance Notice: Logs Will Be Cleared in ${logRetention.days_remaining} Days`}
                      </span>
                      <span 
                        className="badge" 
                        style={{ 
                          fontSize: '10px', 
                          padding: '2px 8px',
                          background: logRetention.days_remaining === 1 ? '#ef4444' : '#f59e0b',
                          color: '#fff',
                          fontWeight: 'bold',
                          borderRadius: '10px'
                        }}
                      >
                        Badge Indicator: {logRetention.warning_badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {logRetention.days_remaining === 1 
                        ? 'Automated 30-day database log cleanup is scheduled for tomorrow. Expired audit records will be purged to keep SQLite storage lightweight and ultra-performant. You can download and save your complete log backup right now.'
                        : `To maintain zero query latency and prevent SQLite database bloat, audit logs are automatically cleared every 30 days. Your logs will be cleared in ${logRetention.days_remaining} days. You can download and backup your full history right now.`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    onClick={handleExportAuditLogsJson} 
                    className="btn btn-primary"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '7px', 
                      fontSize: '12.5px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderColor: '#10b981'
                    }}
                  >
                    <Download size={15} /> Backup Now (.JSON)
                  </button>
                  <button 
                    onClick={handleExportAuditLogsCsv} 
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px' }}
                  >
                    <Download size={15} /> Backup (.CSV)
                  </button>
                </div>
              </div>
            )}

            <header className="content-header">
              <div>
                <h1 className="page-title flex-align">
                  <Clock size={22} color="var(--primary)" style={{ marginRight: '10px' }} />
                  Immutable Audit Ledger & Security History
                </h1>
                <p className="page-subtitle">
                  Tamper-evident chronological audit trail recording logins, license creations, bans, hardware resets, and integrity violations.
                </p>
              </div>

              <div className="flex-align" style={{ gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleExportAuditLogsJson} 
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <Download size={14} /> Export Backup (.JSON)
                </button>
                <button 
                  onClick={handleExportAuditLogsCsv} 
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <Download size={14} /> Export Logs (.CSV)
                </button>
                <button 
                  onClick={fetchAuditLogs} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <RefreshCw size={14} /> Refresh Logs
                </button>
              </div>
            </header>

            {/* Retention Cycle Status Bar */}
            <div className="retention-status-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Retention Cycle:</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary-light)' }}>
                    Day {logRetention?.current_day || 1} of 30
                  </span>
                  <div style={{ 
                    width: '80px', 
                    height: '6px', 
                    borderRadius: '3px', 
                    background: 'rgba(255,255,255,0.1)', 
                    overflow: 'hidden',
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    marginLeft: '4px'
                  }}>
                    <div style={{ 
                      width: `${Math.min(100, ((logRetention?.current_day || 1) / 30) * 100)}%`, 
                      height: '100%', 
                      background: logRetention?.is_warning ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #6366f1)' 
                    }} />
                  </div>
                </div>

                <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Next Auto-Purge:</span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: logRetention?.days_remaining <= 2 ? (logRetention?.days_remaining === 1 ? '#ef4444' : '#f59e0b') : 'var(--text-primary)' 
                  }}>
                    in {logRetention?.days_remaining ?? 30} day(s)
                  </span>
                </div>

                <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Records:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {logRetention?.total_logs ?? auditLogs.length} logs
                  </span>
                </div>

                <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Database Engine:</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>● WAL Optimized</span>
                </div>
              </div>

              {/* Maintenance & Testing Simulator Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Test Simulation:</span>
                <button
                  onClick={() => handleSimulateRetentionDay('reset')}
                  className={`btn ${!logRetention?.simulated_offset_days ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  title="Live realistic retention timeline"
                >
                  Live ({logRetention?.current_day || 1}d)
                </button>
                <button
                  onClick={() => handleSimulateRetentionDay(28)}
                  className={`btn ${logRetention?.current_day === 28 ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    fontSize: '11px', 
                    padding: '4px 8px',
                    color: logRetention?.current_day === 28 ? '#fff' : '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.4)'
                  }}
                  title="Simulate Day 28: displays badge '2' and 2-day warning banner"
                >
                  Simulate Day 28 (Badge 2)
                </button>
                <button
                  onClick={() => handleSimulateRetentionDay(29)}
                  className={`btn ${logRetention?.current_day === 29 ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    fontSize: '11px', 
                    padding: '4px 8px',
                    color: logRetention?.current_day === 29 ? '#fff' : '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.4)'
                  }}
                  title="Simulate Day 29: displays badge '1' and 1-day urgent banner"
                >
                  Simulate Day 29 (Badge 1)
                </button>
                <button
                  onClick={handleManualPurgeAuditLogs}
                  disabled={isPurgingLogs}
                  className="btn btn-danger"
                  style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Immediately clean expired logs and vacuum database"
                >
                  <Trash2 size={12} /> {isPurgingLogs ? 'Purging...' : 'Clean DB Now'}
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="users-header-bar" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'SECURITY', label: 'Security & Bans' },
                  { id: 'LICENSE', label: 'Licenses' },
                  { id: 'USER', label: 'Users' },
                  { id: 'BLACKLIST', label: 'Blacklists' },
                  { id: 'INTEGRITY', label: 'Integrity Violations' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setAuditEventFilter(cat.id)}
                    className={`btn ${auditEventFilter === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '11.5px', padding: '6px 12px' }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="users-search-wrap" style={{ maxWidth: '320px', marginLeft: 'auto' }}>
                <Search size={15} className="users-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search logs by actor, IP, action..." 
                  className="users-search-input"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-wrapper glass-panel">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Type</th>
                    <th>Description</th>
                    <th>Actor</th>
                    <th>Application</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter(log => {
                      if (auditEventFilter !== 'all' && !log.event_type.includes(auditEventFilter)) return false;
                      if (!auditSearch) return true;
                      const q = auditSearch.toLowerCase();
                      return (
                        log.description?.toLowerCase().includes(q) ||
                        log.event_type?.toLowerCase().includes(q) ||
                        log.actor_name?.toLowerCase().includes(q) ||
                        log.ip_address?.toLowerCase().includes(q)
                      );
                    })
                    .map(log => (
                      <tr key={log.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(log.created_at * 1000).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${
                            log.event_type.includes('LOCKED') || log.event_type.includes('BANNED') || log.event_type.includes('AUTOBAN') || log.event_type.includes('VIOLATION') || log.event_type.includes('BLACKLIST')
                              ? 'badge-danger' 
                              : log.event_type.includes('SUCCESS') || log.event_type.includes('CREATED')
                              ? 'badge-active' 
                              : 'badge-primary'
                          }`} style={{ fontSize: '10.5px', letterSpacing: '0.4px' }}>
                            {log.event_type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#fff', fontSize: '12.5px' }}>{log.description}</td>
                        <td style={{ fontSize: '12px' }}>{log.actor_name || 'System / Automated'}</td>
                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: '10.5px' }}>
                            {log.app_name || 'Global'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--primary-light)' }}>
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}

                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 11. SUPER ADMIN RADAR TAB (MASTER OVERSIGHT) ─────── */}
        {activeNav === 'admin' && user?.role === 'admin' && (
          <div className="animate-slide-up">
            <header className="content-header">
              <div>
                <h1 className="page-title" style={{ color: '#f87171' }}>Super Admin Radar</h1>
                <p className="page-subtitle">Master command center for platform infrastructure, developer accounts, applications, end-users, licenses, and teams.</p>
              </div>
            </header>

            {adminStats && (
              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="glass-panel stat-card danger">
                  <div className="stat-header"><span>Total Accounts</span><div className="stat-icon-container"><Users size={16} /></div></div>
                  <div className="stat-value">{adminStats.totalAccounts}</div>
                </div>
                <div className="glass-panel stat-card indigo">
                  <div className="stat-header"><span>Total Apps</span><div className="stat-icon-container"><Smartphone size={16} /></div></div>
                  <div className="stat-value">{adminStats.totalApps}</div>
                </div>
                <div className="glass-panel stat-card success">
                  <div className="stat-header"><span>Total Licenses</span><div className="stat-icon-container"><Key size={16} /></div></div>
                  <div className="stat-value">{adminStats.totalLicenses}</div>
                </div>
                <div className="glass-panel stat-card primary">
                  <div className="stat-header"><span>Locked Users</span><div className="stat-icon-container"><Lock size={16} /></div></div>
                  <div className="stat-value">{adminStats.lockedUsers}</div>
                </div>
              </div>
            )}

            {/* Admin Sub-Tabs Navigation Bar */}
            <div className="flex-align" style={{ gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setAdminSubTab('system')} 
                className={`btn ${adminSubTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Wrench size={13} /> System & Notices
              </button>
              <button 
                onClick={() => setAdminSubTab('accounts')} 
                className={`btn ${adminSubTab === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Users size={13} /> Accounts ({adminAccounts.length})
              </button>
              <button 
                onClick={() => setAdminSubTab('apps')} 
                className={`btn ${adminSubTab === 'apps' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Smartphone size={13} /> All Applications ({adminApps.length})
              </button>
              <button 
                onClick={() => setAdminSubTab('users')} 
                className={`btn ${adminSubTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Users2 size={13} /> All Client Users ({adminUsers.length})
              </button>
              <button 
                onClick={() => setAdminSubTab('licenses')} 
                className={`btn ${adminSubTab === 'licenses' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Key size={13} /> All Licenses ({adminLicenses.length})
              </button>
              <button 
                onClick={() => setAdminSubTab('teams')} 
                className={`btn ${adminSubTab === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Shield size={13} /> All Teams ({adminTeams.length})
              </button>
              <button 
                onClick={() => setAdminSubTab('sdk')} 
                className={`btn ${adminSubTab === 'sdk' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Code size={13} /> Settings → SDK
              </button>
              <button 
                onClick={() => { setAdminSubTab('database'); fetchDatabaseStats(); }} 
                className={`btn ${adminSubTab === 'database' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Database size={13} /> Database Hub
              </button>
            </div>

            {/* 1. SYSTEM SETTINGS & NOTICES SUB-TAB */}
            {adminSubTab === 'system' && (
              <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
                {/* Maintenance Mode Controller */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <div className="flex-align" style={{ gap: '10px' }}>
                      <AlertTriangle size={20} color="var(--warning)" />
                      <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Server Maintenance Mode</h3>
                    </div>
                    <span className={`badge ${adminSystemConfig.maintenance_mode ? 'badge-danger' : 'badge-active'}`}>
                      {adminSystemConfig.maintenance_mode ? 'ACTIVE' : 'OFFLINE'}
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5, minHeight: '56px' }}>
                    When active, a maintenance notification banner is shown to all users, and SDK authentication requests can be blocked or put in update mode.
                  </p>

                  <form onSubmit={handleAdminSaveMaintenance} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="flex-between" style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', minHeight: '46px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Enable Maintenance Mode</span>
                        <input 
                          type="checkbox" 
                          checked={!!adminSystemConfig.maintenance_mode} 
                          onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, maintenance_mode: e.target.checked }))} 
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </label>
                    </div>

                    <div className="form-group" style={{ marginTop: '16px', marginBottom: '24px' }}>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>Maintenance Notice Message</label>
                      <input 
                        type="text" 
                        required
                        className="form-input"
                        style={{ height: '42px' }}
                        value={adminSystemConfig.maintenance_message}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, maintenance_message: e.target.value }))}
                        placeholder="e.g. Scheduled database maintenance in progress."
                      />
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }}>
                        Save Maintenance Settings
                      </button>
                    </div>
                  </form>
                </div>

                {/* Announcement Notice Controller */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <div className="flex-align" style={{ gap: '10px' }}>
                      <Bell size={20} color="var(--primary)" />
                      <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Auth Notice (Top Banner)</h3>
                    </div>
                    <span className={`badge ${adminSystemConfig.announcement_active ? 'badge-active' : 'badge-secondary'}`}>
                      {adminSystemConfig.announcement_active ? 'SHOWING' : 'HIDDEN'}
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5, minHeight: '56px' }}>
                    Broadcasting text that renders at the very top of the website on landing and dashboard pages for all users.
                  </p>

                  <form onSubmit={handleAdminSaveNotice} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="flex-between" style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', minHeight: '46px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Display Banner Notice</span>
                        <input 
                          type="checkbox" 
                          checked={!!adminSystemConfig.announcement_active} 
                          onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, announcement_active: e.target.checked }))} 
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </label>
                    </div>

                    <div className="form-group" style={{ marginTop: '16px', marginBottom: '24px' }}>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>Banner Notice Text</label>
                      <input 
                        type="text" 
                        required
                        className="form-input"
                        style={{ height: '42px' }}
                        value={adminSystemConfig.announcement_notice}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, announcement_notice: e.target.value }))}
                        placeholder="e.g. Habit Auth v2.0 is live! Join Discord for announcements."
                      />
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }}>
                        Save & Publish Notice
                      </button>
                    </div>
                  </form>
                </div>

                {/* Landing Page Hero Mockup / Image Manager */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <div className="flex-align" style={{ gap: '10px' }}>
                      <Layers size={20} color="#38bdf8" />
                      <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Landing Hero Graphic</h3>
                    </div>
                    <span className={`badge ${adminSystemConfig.landing_hero_image && adminSystemConfig.landing_hero_image_active ? 'badge-active' : 'badge-secondary'}`}>
                      {adminSystemConfig.landing_hero_image && adminSystemConfig.landing_hero_image_active ? 'CUSTOM IMAGE' : 'RADAR MOCKUP'}
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                    Controls the visual dashboard card in the hero section on the landing page. Upload your custom dashboard screenshot, or switch back to the built-in radar mockup.
                  </p>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="flex-between" style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', minHeight: '46px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Display Custom Uploaded Image</span>
                      <input 
                        type="checkbox" 
                        checked={!!adminSystemConfig.landing_hero_image_active} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          setAdminSystemConfig(prev => ({ ...prev, landing_hero_image_active: val }));
                          handleAdminSaveHeroImage(null, val);
                        }} 
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </label>

                    {/* Image Preview & Upload Controls */}
                    {adminSystemConfig.landing_hero_image ? (
                      <div style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        background: '#0a0d14',
                        marginBottom: '14px'
                      }}>
                        <img 
                          src={adminSystemConfig.landing_hero_image} 
                          alt="Hero Preview" 
                          style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: 'rgba(0,0,0,0.75)',
                          backdropFilter: 'blur(4px)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.4)'
                        }}>
                          Active on Landing Page
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '24px 16px',
                        borderRadius: '10px',
                        border: '1px dashed var(--border-subtle)',
                        background: 'rgba(255,255,255,0.01)',
                        textAlign: 'center',
                        marginBottom: '14px'
                      }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                          Currently displaying default interactive radar simulation.
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <label 
                        className="btn btn-secondary" 
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px', fontWeight: 700, cursor: isUploadingHeroImage ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Download size={13} style={{ transform: 'rotate(180deg)' }} />
                        {isUploadingHeroImage ? 'Uploading Image...' : (adminSystemConfig.landing_hero_image ? 'Replace Image' : 'Upload Screenshot')}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleHeroImageUpload} 
                          disabled={isUploadingHeroImage}
                          style={{ display: 'none' }} 
                        />
                      </label>

                      {adminSystemConfig.landing_hero_image && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdminSystemConfig(prev => ({ ...prev, landing_hero_image: '', landing_hero_image_active: false }));
                            fetch('/api/v1/admin/hero-image', {
                              method: 'PUT',
                              headers: getHeaders(),
                              body: JSON.stringify({ image_url: '', active: false })
                            }).then(() => {
                              showToast('Reset to default radar simulation!');
                              fetchAdminData();
                            });
                          }}
                          className="btn btn-danger"
                          style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700 }}
                          title="Clear custom image and revert to radar"
                        >
                          <Trash2 size={13} /> Revert
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <button 
                      type="button" 
                      onClick={handleAdminSaveHeroImage} 
                      className="btn btn-primary" 
                      style={{ width: '100%', height: '42px' }}
                    >
                      Save Hero Graphic Settings
                    </button>
                  </div>
                </div>

                {/* Dynamic Community & Social Links Card */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <div className="flex-align" style={{ gap: '10px' }}>
                      <Globe size={20} color="var(--primary)" />
                      <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Community & Social Links</h3>
                    </div>
                    <span className="badge badge-primary">DYNAMIC</span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5, minHeight: '56px' }}>
                    Update the official Discord community invite link and GitHub repository URL across the website navbar, footer, support tickets, and mobile drawer without modifying code.
                  </p>

                  <form onSubmit={handleAdminSaveSocialLinks} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DiscordIcon size={14} color="#5865F2" /> Discord Community Invite URL
                      </label>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://discord.gg/your-invite"
                        value={adminSystemConfig.discord_invite_url || ''}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, discord_invite_url: e.target.value }))}
                        style={{ height: '40px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Code2 size={14} color="#38bdf8" /> GitHub Repository URL
                      </label>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://github.com/your-org"
                        value={adminSystemConfig.github_url || ''}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, github_url: e.target.value }))}
                        style={{ height: '40px' }}
                      />
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Check size={16} /> Save Community Links
                      </button>
                    </div>
                  </form>
                </div>

                {/* Targeted Broadcast Notification & Image Attachment Center Card */}
                <div className="glass-panel" style={{ padding: '24px', gridColumn: '1 / -1', marginTop: '8px' }}>
                  <div className="flex-between" style={{ marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                    <div className="flex-align" style={{ gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa',
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
                      }}>
                        <Megaphone size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                          Targeted Broadcast Notification & Image Attachment Center
                        </h3>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Send targeted announcements with optional image uploads & link attachments to Free Plan and/or Developer Plan users.
                        </p>
                      </div>
                    </div>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <span className="badge badge-primary" style={{ padding: '5px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Bell size={13} /> Live Broadcast Engine
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSendBroadcastNotification} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                      
                      {/* Title */}
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffffff' }}>
                          Notification Title / Headline *
                        </label>
                        <input 
                          type="text" 
                          required
                          className="form-input"
                          style={{ height: '42px' }}
                          value={broadcastTitle}
                          onChange={(e) => setBroadcastTitle(e.target.value)}
                          placeholder="e.g. Critical System Security & Engine Upgrade Notice"
                        />
                      </div>

                      {/* Notification Category / Type */}
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffffff' }}>
                          Category & Severity *
                        </label>
                        <select
                          className="form-select"
                          style={{ height: '42px', fontSize: '12.5px' }}
                          value={broadcastType}
                          onChange={(e) => setBroadcastType(e.target.value)}
                        >
                          <option value="info">📢 Information / System Announcement</option>
                          <option value="security">🛡️ Security Alert / Vulnerability Notice</option>
                          <option value="warning">⚠️ Warning / Maintenance Notice</option>
                          <option value="danger">🚨 Critical Danger / Emergency Alert</option>
                        </select>
                      </div>

                      {/* Action Link URL */}
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffffff' }}>
                          Action Link URL (Optional)
                        </label>
                        <input 
                          type="url" 
                          className="form-input"
                          style={{ height: '42px' }}
                          value={broadcastLink}
                          onChange={(e) => setBroadcastLink(e.target.value)}
                          placeholder="e.g. https://habitauth.com/docs or /status"
                        />
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffffff' }}>
                        Notification Message Body *
                      </label>
                      <textarea 
                        required
                        className="form-input"
                        rows={3}
                        style={{ padding: '12px', lineHeight: 1.5, resize: 'vertical' }}
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="Write announcement text here... Users will instantly receive this notification in their in-web drawer with a red glowing bell indicator."
                      />
                    </div>

                    {/* Image Upload & URL Section */}
                    <div style={{
                      background: 'rgba(18, 20, 26, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '18px'
                    }}>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={14} color="#60a5fa" /> Notice Image Attachment (Upload File or Enter Image URL)
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', alignItems: 'center' }}>
                        
                        {/* Upload File Input */}
                        <div>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '11px 16px',
                            background: 'rgba(37, 99, 235, 0.15)',
                            border: '1px dashed rgba(59, 130, 246, 0.45)',
                            borderRadius: '10px',
                            cursor: isUploadingBroadcastImage ? 'wait' : 'pointer',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#60a5fa',
                            transition: 'all 0.2s ease'
                          }}>
                            {isUploadingBroadcastImage ? (
                              <>
                                <RefreshCw size={15} className="spin-icon" /> Uploading image file...
                              </>
                            ) : (
                              <>
                                <Plus size={15} /> Choose & Upload Image File (PNG, JPG, WebP)
                              </>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={handleBroadcastImageUpload}
                              disabled={isUploadingBroadcastImage}
                            />
                          </label>
                        </div>

                        {/* Or Image URL Input */}
                        <div>
                          <input 
                            type="text" 
                            className="form-input"
                            style={{ height: '42px', fontSize: '12.5px' }}
                            value={broadcastImage}
                            onChange={(e) => setBroadcastImage(e.target.value)}
                            placeholder="Or paste direct image URL (e.g. /uploads/notif_123.png)"
                          />
                        </div>
                      </div>

                      {/* Live Image Preview Thumbnail */}
                      {broadcastImage && (
                        <div style={{ marginTop: '14px', position: 'relative', display: 'inline-block', maxWidth: '340px' }}>
                          <img 
                            src={broadcastImage} 
                            alt="Uploaded notice attachment" 
                            style={{
                              width: '100%',
                              maxHeight: '180px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              border: '1px solid rgba(59, 130, 246, 0.5)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.6)'
                            }} 
                          />
                          <button 
                            type="button" 
                            onClick={() => setBroadcastImage('')}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'rgba(239, 68, 68, 0.95)',
                              border: 'none',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                            }}
                            title="Remove Image Attachment"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Target Audience Checkboxes */}
                    <div style={{
                      background: 'rgba(18, 20, 26, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '18px'
                    }}>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="#34d399" /> Target Plan Audience (Select who receives this notification)
                      </label>

                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Checkbox 1: Free Plan */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '11px 18px',
                          borderRadius: '10px',
                          background: broadcastTargetFree ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${broadcastTargetFree ? 'rgba(59, 130, 246, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.15s ease'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={broadcastTargetFree}
                            onChange={(e) => setBroadcastTargetFree(e.target.checked)}
                            style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#3b82f6' }}
                          />
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: broadcastTargetFree ? '#ffffff' : '#94a3b8' }}>
                            1. Free Plan Users
                          </span>
                        </label>

                        {/* Checkbox 2: Developer Plan */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '11px 18px',
                          borderRadius: '10px',
                          background: broadcastTargetDev ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${broadcastTargetDev ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.15s ease'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={broadcastTargetDev}
                            onChange={(e) => setBroadcastTargetDev(e.target.checked)}
                            style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#10b981' }}
                          />
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: broadcastTargetDev ? '#ffffff' : '#94a3b8' }}>
                            2. Developer Plan ($1.20/mo)
                          </span>
                        </label>

                        {/* Checkbox 3: Pro Developer Plan */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '11px 18px',
                          borderRadius: '10px',
                          background: broadcastTargetPro ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${broadcastTargetPro ? 'rgba(168, 85, 247, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.15s ease'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={broadcastTargetPro}
                            onChange={(e) => setBroadcastTargetPro(e.target.checked)}
                            style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#a855f7' }}
                          />
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: broadcastTargetPro ? '#ffffff' : '#94a3b8' }}>
                            3. Pro Developer ($3.20/mo)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Send Broadcast Action Button */}
                    <div>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSendingBroadcast}
                        style={{
                          width: '100%',
                          height: '48px',
                          fontSize: '14.5px',
                          fontWeight: 800,
                          letterSpacing: '0.3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          boxShadow: '0 0 25px rgba(59, 130, 246, 0.35)'
                        }}
                      >
                        {isSendingBroadcast ? (
                          <>
                            <RefreshCw size={17} className="spin-icon" /> Sending Broadcast...
                          </>
                        ) : (
                          <>
                            <Send size={17} /> Send All (Broadcast Notification to Selected Plans)
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

            {/* DEDICATED SETTINGS → SDK SUB-TAB */}
            {adminSubTab === 'sdk' && (
              <div className="animate-slide-up">
                <div className="glass-panel" style={{ padding: '28px', maxWidth: '800px' }}>
                  <div className="flex-between" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div className="flex-align" style={{ gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Code2 size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Settings → SDK → Example App GitHub URL</h3>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          Configure the official GitHub repository for the Example Application shown on the SDK download page.
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-primary">SDK v{SDK_VERSION}</span>
                  </div>

                  <form onSubmit={handleAdminSaveSdkConfig}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label className="form-label" style={{ fontWeight: 700 }}>Example App GitHub Repository URL</label>
                      <div className="flex-align" style={{ gap: '10px' }}>
                        <input 
                          type="url"
                          required
                          className="form-input"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                          value={adminSystemConfig.example_app_github_url || ''}
                          onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, example_app_github_url: e.target.value }))}
                          placeholder="https://github.com/HabitAuth/HabitAuth-Example"
                        />
                        {adminSystemConfig.example_app_github_url && (
                          <a 
                            href={adminSystemConfig.example_app_github_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary flex-align"
                            style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
                            title="Test GitHub URL in new tab"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </div>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                        When users click the <strong>Example App</strong> button on the SDK page, they will be redirected to this URL.
                      </span>
                    </div>

                    <button type="submit" className="btn btn-primary">
                      Save SDK Settings
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 2. ACCOUNTS DIRECTORY SUB-TAB */}
            {adminSubTab === 'accounts' && (
              <div className="animate-slide-up">
                {/* Account Plan & Status Quick Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setAdminAccountPlanFilter('all')}
                    className={`btn ${adminAccountPlanFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '7px 14px' }}
                  >
                    All Accounts ({adminAccounts.length})
                  </button>
                  <button 
                    onClick={() => setAdminAccountPlanFilter('developer')}
                    className={`btn ${adminAccountPlanFilter === 'developer' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '7px 14px', borderColor: adminAccountPlanFilter === 'developer' ? undefined : 'rgba(59, 130, 246, 0.3)' }}
                  >
                    <Sparkles size={12} style={{ marginRight: '5px', color: 'var(--primary-light)' }} />
                    Developer Accounts ({adminAccounts.filter(a => a.plan === 'developer').length})
                  </button>
                  <button 
                    onClick={() => setAdminAccountPlanFilter('pro')}
                    className={`btn ${adminAccountPlanFilter === 'pro' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '7px 14px', borderColor: adminAccountPlanFilter === 'pro' ? undefined : 'rgba(168, 85, 247, 0.3)' }}
                  >
                    <Sparkles size={12} style={{ marginRight: '5px', color: '#a855f7' }} />
                    Pro Accounts ({adminAccounts.filter(a => a.plan === 'pro').length})
                  </button>
                  <button 
                    onClick={() => setAdminAccountPlanFilter('free')}
                    className={`btn ${adminAccountPlanFilter === 'free' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '7px 14px' }}
                  >
                    Free Accounts ({adminAccounts.filter(a => !['developer', 'pro'].includes(a.plan) && a.role !== 'admin').length})
                  </button>
                  <button 
                    onClick={() => setAdminAccountPlanFilter('admin')}
                    className={`btn ${adminAccountPlanFilter === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '7px 14px' }}
                  >
                    Super Admins ({adminAccounts.filter(a => a.role === 'admin').length})
                  </button>
                  <button 
                    onClick={() => setAdminAccountPlanFilter('banned')}
                    className="btn"
                    style={{ 
                      fontSize: '12px', 
                      padding: '7px 14px', 
                      background: adminAccountPlanFilter === 'banned' ? '#ffffff' : 'rgba(239, 68, 68, 0.12)', 
                      color: adminAccountPlanFilter === 'banned' ? '#000000' : 'var(--danger)',
                      borderColor: adminAccountPlanFilter === 'banned' ? '#ffffff' : 'rgba(239, 68, 68, 0.35)',
                      fontWeight: 800
                    }}
                  >
                    <Ban size={12} style={{ marginRight: '5px', color: adminAccountPlanFilter === 'banned' ? '#000000' : 'var(--danger)' }} />
                    Banned Accounts ({adminAccounts.filter(a => a.status === 'banned').length})
                  </button>
                </div>

                <div className="users-header-bar" style={{ marginBottom: '14px' }}>
                  <div className="users-search-wrap">
                    <Search size={15} className="users-search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search accounts by username..." 
                      className="users-search-input"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Developer Account</th>
                        <th>Status</th>
                        <th>Plan & Duration</th>
                        <th>Apps</th>
                        <th>Joined</th>
                        <th style={{ textAlign: 'right' }}>Master Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminAccounts
                        .filter(acc => {
                          // Tab filter
                          if (adminAccountPlanFilter === 'developer' && acc.plan !== 'developer') return false;
                          if (adminAccountPlanFilter === 'pro' && acc.plan !== 'pro') return false;
                          if (adminAccountPlanFilter === 'free' && (acc.plan === 'developer' || acc.plan === 'pro' || acc.role === 'admin')) return false;
                          if (adminAccountPlanFilter === 'admin' && acc.role !== 'admin') return false;
                          if (adminAccountPlanFilter === 'banned' && acc.status !== 'banned') return false;

                          // Search query filter
                          if (!adminSearch) return true;
                          const q = adminSearch.toLowerCase();
                          return (
                            acc.username?.toLowerCase().includes(q) ||
                            acc.email?.toLowerCase().includes(q) ||
                            acc.discord_id?.toLowerCase().includes(q) ||
                            acc.role?.toLowerCase().includes(q) ||
                            acc.plan?.toLowerCase().includes(q)
                          );
                        })
                        .map(acc => (
                        <tr key={acc.id}>
                          <td>
                            <div className="flex-align" style={{ gap: '10px' }}>
                              {acc.avatar ? (
                                <img 
                                  src={acc.avatar} 
                                  alt={acc.username}
                                  className="user-avatar-img" 
                                  style={{ width: '34px', height: '34px', flexShrink: 0 }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(99, 102, 241, 0.4) 100%)',
                                  border: '1px solid var(--border-active)',
                                  display: acc.avatar ? 'none' : 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  color: '#fff',
                                  flexShrink: 0
                                }}
                              >
                                {(acc.username || 'U').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800 }}>
                                  {acc.username} {acc.role === 'admin' && <span className="badge badge-danger" style={{ fontSize: '9px' }}>ADMIN</span>}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Discord: {acc.discord_id}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${acc.status === 'banned' ? 'badge-danger' : 'badge-active'}`}>
                              {acc.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                              <div className="flex-align" style={{ gap: '6px' }}>
                                <select 
                                  className="form-select"
                                  value={acc.plan}
                                  style={{ padding: '5px 8px', fontSize: '11.5px', width: '120px', marginBottom: 0 }}
                                  onChange={async (e) => {
                                    const val = e.target.value;
                                    if (val === 'developer' || val === 'pro') {
                                      handleOpenSubModal(acc, val);
                                    } else {
                                      await fetch(`/api/v1/admin/accounts/${acc.id}/plan`, {
                                        method: 'PUT',
                                        headers: getHeaders(),
                                        body: JSON.stringify({ plan: 'free', duration: 'lifetime' })
                                      });
                                      showToast('Plan set to FREE');
                                      fetchAdminData();
                                    }
                                  }}
                                >
                                  <option value="free">FREE</option>
                                  <option value="developer">DEVELOPER</option>
                                  <option value="pro">PRO DEVELOPER</option>
                                </select>
                                {(acc.plan === 'developer' || acc.plan === 'pro') && (
                                  <button 
                                    onClick={() => handleOpenSubModal(acc, acc.plan)}
                                    className="icon-btn"
                                    title="Set / Extend Subscription Duration"
                                    style={{ width: '26px', height: '26px', borderRadius: '6px' }}
                                  >
                                    <Clock size={12} color="#38bdf8" />
                                  </button>
                                )}
                              </div>

                              {(acc.plan === 'developer' || acc.plan === 'pro') && (
                                <div>
                                  {acc.sub_status === 'expired' ? (
                                    <span 
                                      className="badge badge-danger" 
                                      style={{ fontSize: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px' }}
                                      onClick={() => handleOpenSubModal(acc, acc.plan)}
                                      title="Subscription expired! Software clients are blocked. Click to renew."
                                    >
                                      <AlertTriangle size={10} /> EXPIRED (Blocked)
                                    </span>
                                  ) : acc.expires_at > 0 ? (
                                    <span 
                                      className="badge badge-warning" 
                                      style={{ fontSize: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px' }}
                                      onClick={() => handleOpenSubModal(acc, acc.plan)}
                                      title={`Expires: ${new Date(acc.expires_at * 1000).toLocaleDateString()} (Click to edit)`}
                                    >
                                      <Clock size={10} /> {Math.max(0, Math.ceil((acc.expires_at - Math.floor(Date.now() / 1000)) / 86400))}d left
                                    </span>
                                  ) : (
                                    <span 
                                      className="badge badge-active" 
                                      style={{ fontSize: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px' }}
                                      onClick={() => handleOpenSubModal(acc, acc.plan)}
                                      title="Lifetime Access (Click to set duration)"
                                    >
                                      <Sparkles size={10} /> Lifetime
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }}>{acc.total_apps || 0} Apps</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(acc.created_at * 1000).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                              <button 
                                onClick={() => handleAdminGenerateResetLink(acc.id, acc.username)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '11.5px', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }}
                                title="Generate 24h Password Reset Link to paste in user's support ticket"
                              >
                                <KeyRound size={13} style={{ marginRight: '4px' }} /> Reset Link
                              </button>
                              {acc.id !== user?.id && (
                                <>
                                  <button 
                                    onClick={() => handleAdminToggleBanAccount(acc.id, acc.username, acc.status)}
                                    className={`btn ${acc.status === 'banned' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '6px 10px', fontSize: '11.5px', color: acc.status === 'banned' ? '#fff' : 'var(--warning)' }}
                                    title={acc.status === 'banned' ? 'Unban Account' : 'Ban Account'}
                                  >
                                    <Ban size={13} style={{ marginRight: '4px' }} />
                                    {acc.status === 'banned' ? 'Unban' : 'Ban'}
                                  </button>
                                  <button 
                                    onClick={() => handleAdminDeleteAccount(acc.id, acc.username)}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 10px', fontSize: '11.5px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                                    title="Permanently Delete Account"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. ALL APPLICATIONS SUB-TAB */}
            {adminSubTab === 'apps' && (
              <div className="animate-slide-up">
                <div className="users-header-bar" style={{ marginBottom: '14px' }}>
                  <div className="users-search-wrap">
                    <Search size={15} className="users-search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search applications by name, App ID, owner..." 
                      className="users-search-input"
                      value={adminAppSearch}
                      onChange={(e) => setAdminAppSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Application</th>
                        <th>App ID</th>
                        <th>Owner</th>
                        <th>Users</th>
                        <th>Licenses</th>
                        <th>Version</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!adminApps || adminApps.length === 0) ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No applications registered on the platform.</td></tr>
                      ) : (
                        adminApps
                          .filter(app => {
                            if (!adminAppSearch) return true;
                            const q = adminAppSearch.toLowerCase();
                            return (
                              app.app_name?.toLowerCase().includes(q) ||
                              app.id?.toLowerCase().includes(q) ||
                              app.owner_username?.toLowerCase().includes(q)
                            );
                          })
                          .map(app => (
                          <tr key={app.id}>
                            <td style={{ fontWeight: 800 }}>{app.app_name}</td>
                            <td className="mono-text" style={{ fontSize: '11.5px', color: 'var(--primary-light)' }}>{app.id}</td>
                            <td>
                              <div className="flex-align" style={{ gap: '8px' }}>
                                {app.owner_avatar ? (
                                  <img 
                                    src={app.owner_avatar} 
                                    alt={app.owner_username}
                                    className="user-avatar-img" 
                                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(99, 102, 241, 0.4) 100%)',
                                    border: '1px solid var(--border-active)',
                                    display: app.owner_avatar ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    color: '#fff',
                                    flexShrink: 0
                                  }}
                                >
                                  {(app.owner_username || 'U').slice(0, 2).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '12.5px', fontWeight: 600 }}>@{app.owner_username}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>{app.total_users || 0}</td>
                            <td style={{ fontWeight: 700 }}>{app.total_licenses || 0}</td>
                            <td className="mono-text" style={{ fontSize: '11.5px' }}>v{app.version}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                onClick={() => handleAdminDeleteApp(app.id, app.app_name)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                                title="Delete Application"
                              >
                                <Trash2 size={13} /> Delete App
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. ALL CLIENT END-USERS SUB-TAB */}
            {adminSubTab === 'users' && (
              <div className="animate-slide-up">
                <div className="users-header-bar" style={{ marginBottom: '14px' }}>
                  <div className="users-search-wrap">
                    <Search size={15} className="users-search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search by username, HWID..." 
                      className="users-search-input"
                      value={adminUserSearch}
                      onChange={(e) => setAdminUserSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Client Username</th>
                        <th>Application</th>
                        <th>App Owner</th>
                        <th>HWID</th>
                        <th>Status</th>
                        <th>Expires</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers
                        .filter(u => !adminUserSearch || u.username?.toLowerCase().includes(adminUserSearch.toLowerCase()) || (u.hwid && u.hwid.toLowerCase().includes(adminUserSearch.toLowerCase())) || (u.app_name && u.app_name.toLowerCase().includes(adminUserSearch.toLowerCase())) || (u.license_key && u.license_key.toLowerCase().includes(adminUserSearch.toLowerCase())))
                        .map(u => (
                          <tr key={u.id}>
                            <td style={{ fontWeight: 800 }}>@{u.username}</td>
                            <td>{u.app_name}</td>
                            <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {u.owner_username || u.app_owner ? `@${u.owner_username || u.app_owner}` : '—'}
                            </td>
                            <td className="mono-text" style={{ fontSize: '11px' }}>{u.hwid ? `${u.hwid.slice(0, 16)}...` : 'Unbound'}</td>
                            <td>
                              <span className={`badge ${u.status === 'active' ? 'badge-active' : 'badge-danger'}`}>
                                {u.status?.toUpperCase()}
                              </span>
                            </td>
                            <td>{u.expires_at === 0 ? 'Lifetime' : new Date(u.expires_at * 1000).toLocaleDateString()}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                                <button 
                                  onClick={() => handleAdminToggleBanUser(u.id, u.username, u.status)}
                                  className={`btn ${u.status === 'banned' ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ padding: '5px 8px', fontSize: '11px', color: u.status === 'banned' ? '#fff' : 'var(--warning)' }}
                                >
                                  {u.status === 'banned' ? 'Unban' : 'Ban'}
                                </button>
                                <button 
                                  onClick={() => handleAdminDeleteUser(u.id, u.username)}
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '11px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. ALL LICENSES SUB-TAB */}
            {adminSubTab === 'licenses' && (
              <div className="animate-slide-up">
                <div className="users-header-bar" style={{ marginBottom: '14px' }}>
                  <div className="users-search-wrap">
                    <Search size={15} className="users-search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search license key, application..." 
                      className="users-search-input"
                      value={adminLicenseSearch}
                      onChange={(e) => setAdminLicenseSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>License Key</th>
                        <th>Application</th>
                        <th>Owner</th>
                        <th>Duration</th>
                        <th>Bound User</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLicenses
                        .filter(l => !adminLicenseSearch || l.license_key.toLowerCase().includes(adminLicenseSearch.toLowerCase()) || l.app_name.toLowerCase().includes(adminLicenseSearch.toLowerCase()))
                        .map(l => (
                          <tr key={l.id}>
                            <td className="mono-text" style={{ fontWeight: 800, color: 'var(--primary-light)' }}>{l.license_key}</td>
                            <td>{l.app_name}</td>
                            <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{l.owner_username}</td>
                            <td>{l.duration_days === 0 ? 'Lifetime' : `${l.duration_days} Days`}</td>
                            <td>{l.bound_username ? `@${l.bound_username}` : <span style={{ color: 'var(--text-muted)' }}>Unused</span>}</td>
                            <td>
                              <span className={`badge ${l.status === 'active' ? 'badge-active' : l.status === 'unused' ? 'badge-primary' : 'badge-danger'}`}>
                                {l.status?.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                onClick={() => handleAdminDeleteLicense(l.id, l.license_key)}
                                className="btn btn-secondary"
                                style={{ padding: '5px 8px', fontSize: '11px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. ALL TEAMS SUB-TAB */}
            {adminSubTab === 'teams' && (
              <div className="animate-slide-up">
                <div className="users-header-bar" style={{ marginBottom: '14px' }}>
                  <div className="users-search-wrap">
                    <Search size={15} className="users-search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search teams by name, invite code, owner, member..." 
                      className="users-search-input"
                      value={adminTeamSearch}
                      onChange={(e) => setAdminTeamSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Team Name</th>
                        <th>Invite Code</th>
                        <th>Owner</th>
                        <th>Members / Capacity</th>
                        <th>Created</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!adminTeams || adminTeams.length === 0) ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No teams created on the platform yet.</td></tr>
                      ) : (
                        adminTeams
                          .filter(t => {
                            if (!adminTeamSearch) return true;
                            const q = adminTeamSearch.toLowerCase();
                            const hasMatchingMember = t.members?.some(m => m.username?.toLowerCase().includes(q) || m.discord_id?.includes(q));
                            return (
                              t.name?.toLowerCase().includes(q) ||
                              t.invite_code?.toLowerCase().includes(q) ||
                              t.owner_username?.toLowerCase().includes(q) ||
                              hasMatchingMember
                            );
                          })
                          .map(t => {
                            const isExpanded = expandedTeamId === t.id;
                            return (
                              <React.Fragment key={t.id}>
                                <tr 
                                  style={{ cursor: 'pointer', transition: 'background 0.2s ease' }}
                                  onClick={() => setExpandedTeamId(isExpanded ? null : t.id)}
                                >
                                  <td>
                                    <div 
                                      style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        borderRadius: '50%', 
                                        background: isExpanded ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        transition: 'all 0.2s ease'
                                      }}
                                      title={isExpanded ? 'Collapse team members' : 'Expand team members'}
                                    >
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                  </td>
                                  <td style={{ fontWeight: 800 }}>
                                    <div className="flex-align" style={{ gap: '8px' }}>
                                      <span>{t.name}</span>
                                      {t.members?.length > 0 && (
                                        <span style={{ fontSize: '10.5px', color: 'var(--primary-light)', background: 'rgba(59, 130, 246,0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                                          {t.members.length} {t.members.length === 1 ? 'member' : 'members'}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="mono-text" style={{ fontSize: '11.5px', color: 'var(--primary-light)' }}>
                                    {t.invite_code || <span style={{ color: 'var(--text-muted)' }}>None</span>}
                                  </td>
                                  <td>
                                    <div className="flex-align" style={{ gap: '8px' }}>
                                      {t.owner_avatar ? (
                                        <img 
                                          src={t.owner_avatar} 
                                          alt={t.owner_username}
                                          className="user-avatar-img" 
                                          style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div 
                                        style={{
                                          width: '22px',
                                          height: '22px',
                                          borderRadius: '50%',
                                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(99, 102, 241, 0.4) 100%)',
                                          border: '1px solid var(--border-active)',
                                          display: t.owner_avatar ? 'none' : 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '9px',
                                          fontWeight: 800,
                                          color: '#fff',
                                          flexShrink: 0
                                        }}
                                      >
                                        {(t.owner_username || 'U').slice(0, 2).toUpperCase()}
                                      </div>
                                      <span style={{ fontSize: '12.5px', fontWeight: 600 }}>@{t.owner_username}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge badge-primary">{t.active_members} / {t.max_members || 5}</span>
                                  </td>
                                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(t.created_at * 1000).toLocaleDateString()}</td>
                                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={() => handleAdminDisbandTeam(t.id, t.name)}
                                      className="btn btn-secondary"
                                      style={{ padding: '6px 10px', fontSize: '11.5px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                                      title="Permanently disband team"
                                    >
                                      <Trash2 size={13} style={{ marginRight: '4px' }} /> Disband
                                    </button>
                                  </td>
                                </tr>

                                {/* EXPANDED TEAM MEMBERS DRAWER */}
                                {isExpanded && (
                                  <tr key={`${t.id}-expanded`}>
                                    <td colSpan="7" style={{ background: 'rgba(8, 6, 16, 0.85)', padding: '20px 24px', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                                      <div className="animate-slide-up">
                                        <div className="flex-between" style={{ marginBottom: '14px' }}>
                                          <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Users2 size={16} color="var(--primary-light)" /> 
                                            <span>Team Roster & Members ({t.members?.length || 0})</span>
                                          </h4>
                                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                            Team ID: <code style={{ color: 'var(--primary-light)' }}>{t.id}</code> • Max Capacity: {t.max_members || 5}
                                          </span>
                                        </div>

                                        {(!t.members || t.members.length === 0) ? (
                                          <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '12.5px' }}>
                                            No members in this team workspace yet.
                                          </div>
                                        ) : (
                                          <div style={{ display: 'grid', gap: '10px' }}>
                                            {t.members.map(m => (
                                              <div 
                                                key={m.member_id}
                                                className="flex-between"
                                                style={{
                                                  padding: '12px 16px',
                                                  borderRadius: 'var(--radius-sm)',
                                                  background: 'rgba(255, 255, 255, 0.03)',
                                                  border: '1px solid rgba(255, 255, 255, 0.07)',
                                                  flexWrap: 'wrap',
                                                  gap: '12px'
                                                }}
                                              >
                                                <div className="flex-align" style={{ gap: '10px' }}>
                                                  {m.avatar ? (
                                                    <img 
                                                      src={m.avatar} 
                                                      alt={m.username}
                                                      className="user-avatar-img" 
                                                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                                      onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                                      }}
                                                    />
                                                  ) : null}
                                                  <div 
                                                    style={{
                                                      width: '28px',
                                                      height: '28px',
                                                      borderRadius: '50%',
                                                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)',
                                                      border: '1px solid var(--border-active)',
                                                      display: m.avatar ? 'none' : 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      fontSize: '10px',
                                                      fontWeight: 800,
                                                      color: '#fff',
                                                      flexShrink: 0
                                                    }}
                                                  >
                                                    {(m.username || 'M').slice(0, 2).toUpperCase()}
                                                  </div>
                                                  <div>
                                                    <div className="flex-align" style={{ gap: '8px' }}>
                                                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>@{m.username}</span>
                                                      <span 
                                                        className={`badge ${m.role === 'owner' ? 'badge-primary' : 'badge-secondary'}`}
                                                        style={{ fontSize: '9.5px', padding: '1px 6px' }}
                                                      >
                                                        {m.role?.toUpperCase()}
                                                      </span>
                                                      <span 
                                                        className={`badge ${m.status === 'active' ? 'badge-active' : 'badge-danger'}`}
                                                        style={{ fontSize: '9.5px', padding: '1px 6px' }}
                                                      >
                                                        {m.status?.toUpperCase()}
                                                      </span>
                                                    </div>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                      Discord ID: {m.discord_id} • Joined: {m.joined_at ? new Date(m.joined_at * 1000).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Action buttons: Kick & Ban (Super Admin Master Controls) */}
                                                {m.role !== 'owner' ? (
                                                  <div className="flex-align" style={{ gap: '8px' }}>
                                                    <button
                                                      onClick={() => handleAdminKickTeamMember(t.id, m.member_id, m.username, t.name)}
                                                      className="btn btn-secondary"
                                                      style={{ padding: '5px 12px', fontSize: '11.5px', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                                                      title={`Kick @${m.username} from ${t.name}`}
                                                    >
                                                      Kick
                                                    </button>
                                                    <button
                                                      onClick={() => handleAdminBanTeamMember(t.id, m.member_id, m.username, t.name)}
                                                      className="btn btn-secondary"
                                                      style={{ padding: '5px 12px', fontSize: '11.5px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                      title={`Ban & Blacklist @${m.username} from ${t.name}`}
                                                    >
                                                      Ban
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    Team Creator (Owner)
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. DATABASE MANAGEMENT & HEALTH HUB SUB-TAB */}
            {adminSubTab === 'database' && (
              <div className="animate-slide-up tab-animated-content">
                {/* Header bar */}
                <div className="flex-between" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Database size={20} color="var(--primary)" /> Database Hub & Infrastructure Health
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Real-time SQLite storage footprint, WAL journaling status, record counts, and zero-downtime maintenance operations.
                    </p>
                  </div>
                  <div className="flex-align" style={{ gap: '10px' }}>
                    <button 
                      onClick={fetchDatabaseStats} 
                      disabled={loadingDbStats}
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                    >
                      <RefreshCw size={14} className={loadingDbStats ? 'spin' : ''} />
                      {loadingDbStats ? 'Scanning Storage...' : 'Refresh Diagnostics'}
                    </button>
                  </div>
                </div>

                {/* Storage & Engine Metrics Grid */}
                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                  <div className="glass-panel stat-card primary">
                    <div className="stat-header">
                      <span>Database File Size</span>
                      <div className="stat-icon-container"><Database size={16} /></div>
                    </div>
                    <div className="stat-value">{dbStats?.database?.db_size_formatted || 'Scanning...'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Physical habit_auth.db on disk
                    </div>
                  </div>

                  <div className="glass-panel stat-card cyan">
                    <div className="stat-header">
                      <span>WAL Journal Size</span>
                      <div className="stat-icon-container"><HardDrive size={16} /></div>
                    </div>
                    <div className="stat-value">{dbStats?.database?.wal_size_formatted || '0 KB'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Write-Ahead Log transactions buffer
                    </div>
                  </div>

                  <div className="glass-panel stat-card indigo">
                    <div className="stat-header">
                      <span>Total Disk Footprint</span>
                      <div className="stat-icon-container"><Layers size={16} /></div>
                    </div>
                    <div className="stat-value">{dbStats?.database?.total_size_formatted || 'Scanning...'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      DB + WAL + Shared Memory (SHM)
                    </div>
                  </div>

                  <div className="glass-panel stat-card success">
                    <div className="stat-header">
                      <span>Engine & Health</span>
                      <div className="stat-icon-container"><CheckCircle2 size={16} /></div>
                    </div>
                    <div className="stat-value" style={{ fontSize: '20px', textTransform: 'uppercase' }}>
                      {dbStats?.database?.integrity_check === 'ok' ? 'OPTIMAL (OK)' : (dbStats?.database?.integrity_check || 'ACTIVE')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#34d399', marginTop: '6px', fontWeight: 600 }}>
                      Mode: {dbStats?.database?.journal_mode?.toUpperCase() || 'WAL'} • Ultra-Low Latency
                    </div>
                  </div>
                </div>

                {/* Tables & Record Counts Breakdown */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                  <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <div className="flex-align" style={{ gap: '10px' }}>
                      <Layers size={18} color="var(--primary)" />
                      <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Table Record Breakdown</h3>
                    </div>
                    <span className="badge badge-active">9 Core Tables</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                    {[
                      { label: 'Developer Accounts', count: dbStats?.counts?.accounts ?? adminAccounts.length, icon: Users, color: '#38bdf8' },
                      { label: 'Applications', count: dbStats?.counts?.applications ?? adminApps.length, icon: Smartphone, color: '#a855f7' },
                      { label: 'Client Users', count: dbStats?.counts?.users ?? adminUsers.length, icon: Users2, color: '#10b981' },
                      { label: 'License Keys', count: dbStats?.counts?.licenses ?? adminLicenses.length, icon: Key, color: '#f59e0b' },
                      { label: 'Registered Devices', count: dbStats?.counts?.devices ?? 0, icon: Laptop, color: '#06b6d4' },
                      { label: 'Configured Webhooks', count: dbStats?.counts?.webhooks ?? 0, icon: Radio, color: '#ec4899' },
                      { label: 'Support Tickets', count: dbStats?.counts?.tickets ?? 0, icon: MessageSquare, color: '#6366f1' },
                      { label: 'Audit Log Entries', count: dbStats?.counts?.audit_logs ?? 0, icon: ShieldAlert, color: '#ef4444' },
                      { label: 'Active Sessions', count: dbStats?.counts?.sessions ?? 0, icon: Activity, color: '#34d399' }
                    ].map((tbl, i) => {
                      const IconComponent = tbl.icon;
                      return (
                        <div 
                          key={i} 
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '12px',
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: `${tbl.color}18`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: tbl.color
                            }}>
                              <IconComponent size={15} />
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tbl.label}</div>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                                {typeof tbl.count === 'number' ? tbl.count.toLocaleString() : '0'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Maintenance & Safe Cleanup Center */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wrench size={18} color="var(--warning)" /> Database Optimization & Cleanup Actions
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Execute safe database maintenance and cleanups. Destructive operations require explicit confirmation.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    
                    {/* Action 1: VACUUM */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>Run SQLite VACUUM</span>
                          <span className="badge badge-active" style={{ fontSize: '10px' }}>SAFE • NO DATA LOSS</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                          Reclaims fragmented empty pages, compacts storage on disk, and optimizes internal B-Tree query search paths.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          promptConfirm({
                            title: 'Run SQLite VACUUM & Optimize',
                            message: 'This will reorganize the physical database file and rebuild query indices. No data will be deleted. Proceed?',
                            confirmText: 'Run VACUUM',
                            isDanger: false,
                            onConfirm: () => handleExecuteDatabaseAction('vacuum')
                          });
                        }}
                        className="btn btn-primary"
                        style={{ width: '100%', height: '38px', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Zap size={14} /> Run VACUUM & Optimize
                      </button>
                    </div>

                    {/* Action 2: Purge Audit Logs */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>Purge Audit Logs</span>
                          <span className="badge badge-danger" style={{ fontSize: '10px' }}>PURGES LOGS</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                          Permanently deletes all historical security, authentication, and event audit log entries to reduce database bloat.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          promptConfirm({
                            title: 'Purge All Audit Logs',
                            message: 'Are you sure you want to permanently clear all entries from the audit_logs table? This action cannot be undone.',
                            confirmText: 'Purge Audit Logs',
                            isDanger: true,
                            onConfirm: () => handleExecuteDatabaseAction('clean_audit_logs')
                          });
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', height: '38px', fontSize: '12.5px', fontWeight: 700, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Trash2 size={14} /> Purge Audit Logs ({dbStats?.counts?.audit_logs || 0})
                      </button>
                    </div>

                    {/* Action 3: Purge Expired Sessions */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>Clean Inactive Sessions</span>
                          <span className="badge badge-active" style={{ fontSize: '10px' }}>CLEANUP</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                          Removes revoked or stale user browser sessions, reducing login verification query times.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          promptConfirm({
                            title: 'Clean Inactive Sessions',
                            message: 'This will purge revoked and stale authentication tokens from the database. Active users will remain logged in. Proceed?',
                            confirmText: 'Clean Sessions',
                            isDanger: false,
                            onConfirm: () => handleExecuteDatabaseAction('clean_sessions')
                          });
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', height: '38px', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={14} /> Clean Stale Sessions
                      </button>
                    </div>

                    {/* Action 4: Purge Test Data for Deployment */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>Purge Test & Dev Data</span>
                          <span className="badge badge-danger" style={{ fontSize: '10px' }}>DEPLOYMENT PREP</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                          Removes mock accounts matching TEST_% or DIMUX%, orphan licenses, and resets system tables for clean production deployment.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          promptConfirm({
                            title: 'Purge Test & Orphan Data',
                            message: 'This will clean up mock development accounts and orphaned data records to prepare the database for live deployment. Proceed?',
                            confirmText: 'Purge Test Data',
                            isDanger: true,
                            onConfirm: () => handleExecuteDatabaseAction('clean_test_data')
                          });
                        }}
                        className="btn btn-danger"
                        style={{ width: '100%', height: '38px', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Trash2 size={14} /> Purge Test & Mock Data
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        </div>
      </main>

      {/* ── MODALS ────────────────────────────────────────────── */}

      {/* 0. ADMIN USER PASSWORD RESET LINK MODAL */}
      {resetLinkModalData && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-header">
              <div className="flex-align" style={{ gap: '10px' }}>
                <KeyRound size={20} color="#38bdf8" />
                <h3 className="modal-title">Password Reset Link Generated</h3>
              </div>
              <button 
                onClick={() => setResetLinkModalData(null)} 
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                A secure, one-time password reset link has been generated for <strong style={{ color: '#ffffff' }}>{resetLinkModalData.username}</strong>. Paste this link into the customer's support ticket:
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                  Direct Reset Link (Valid for 24 Hours)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={resetLinkModalData.reset_link}
                    className="form-input font-mono"
                    style={{ fontSize: '12px', height: '42px', flex: 1, color: '#38bdf8', background: 'rgba(0,0,0,0.4)' }}
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resetLinkModalData.reset_link);
                      setCopiedResetLink(true);
                      setTimeout(() => setCopiedResetLink(false), 2000);
                      showToast('Reset link copied to clipboard!');
                    }}
                    className="btn btn-primary"
                    style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                  >
                    {copiedResetLink ? <Check size={16} /> : <Copy size={16} />}
                    {copiedResetLink ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12px',
                color: '#bae6fd',
                lineHeight: 1.5
              }}>
                <Sparkles size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  When the customer opens this link, the password reset modal will automatically appear allowing them to enter a new password without knowing the old one.
                </span>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setResetLinkModalData(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 20px', fontSize: '13px' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. CREATE APPLICATION MODAL (App Name ONLY! No App Owner ID) */}
      {showCreateAppModal && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Create New Application</h3>
              <button className="icon-btn" onClick={() => setShowCreateAppModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateApp}>
              <div className="form-group">
                <label className="form-label">App Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. My Awesome App" 
                  value={newAppName} 
                  onChange={(e) => setNewAppName(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Version</label>
                <input 
                  type="text" 
                  value={newAppVersion} 
                  onChange={(e) => setNewAppVersion(e.target.value)} 
                  className="form-input" 
                  style={{ fontFamily: 'var(--font-mono)' }} 
                />
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowCreateAppModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MANUALLY ADD USER MODAL */}
      {showAddUserModal && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }} className="flex-align">
                <UserPlus size={20} color="var(--primary)" style={{ marginRight: '8px' }} />
                Manually Add User
              </h3>
              <button className="icon-btn" onClick={() => setShowAddUserModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="form-label">Target Application</label>
                <select 
                  className="form-select"
                  value={selectedAppId || apps[0]?.id || ''}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  required
                >
                  {apps.map(a => (
                    <option key={a.id} value={a.id}>{a.app_name} ({a.id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. client_user_01" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••••••" 
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Redeem License Key (Optional)</label>
                <select 
                  className="form-select"
                  value={newUserLicense}
                  onChange={(e) => setNewUserLicense(e.target.value)}
                >
                  <option value="MANUAL_BYPASS">No License (Manual Expiry)</option>
                  {unusedLicenses.map(lic => (
                    <option key={lic.id} value={lic.license_key}>
                      {lic.license_key} ({lic.duration_days === 0 ? 'Lifetime' : `${lic.duration_days} Days`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Manual Expiry Date (If no license)</label>
                <input 
                  type="date" 
                  value={newUserExpiry}
                  onChange={(e) => setNewUserExpiry(e.target.value)}
                  className="form-input" 
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '20px' }} className="flex-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Enforce Machine HWID Lock</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Binds account to the user's first machine profile</div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={newUserHwidLock} onChange={(e) => setNewUserHwidLock(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingUser}>
                  {isSubmittingUser ? 'Adding...' : 'Add User Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2b. EDIT USER MODAL */}
      {showEditUserModal && editingUser && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }} className="flex-align">
                <Edit2 size={20} color="var(--primary)" style={{ marginRight: '8px' }} />
                Edit User Profile
              </h3>
              <button className="icon-btn" onClick={() => setShowEditUserModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveUserEdit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  required 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password (leave blank to keep current)</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••" 
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date (leave empty for Lifetime)</label>
                <input 
                  type="date" 
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Status</label>
                <select 
                  className="form-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="active">ACTIVE</option>
                  <option value="locked">LOCKED</option>
                  <option value="banned">BANNED</option>
                </select>
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowEditUserModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSavingEdit} className="btn btn-primary">
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. GENERATE LICENSES MODAL */}
      {showGenLicenseModal && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Generate License Keys</h3>
              <button className="icon-btn" onClick={() => setShowGenLicenseModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleGenerateLicenses}>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  max={isFreePlan ? 10 : 100}
                  value={genCount} 
                  onChange={(e) => setGenCount(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duration</label>
                <select 
                  className="form-select"
                  value={genDuration}
                  onChange={(e) => setGenDuration(e.target.value)}
                >
                  <option value="0">Lifetime (No Expiration)</option>
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="365">365 Days (1 Year)</option>
                  <option value="custom">⚡ Custom Duration (Enter Days)</option>
                </select>
              </div>

              {genDuration === 'custom' && (
                <div className="form-group animate-slide-up">
                  <label className="form-label">Enter Custom Days</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="3650"
                    placeholder="e.g. 15, 45, 90, 180"
                    value={customGenDuration} 
                    onChange={(e) => setCustomGenDuration(e.target.value)} 
                    className="form-input" 
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700 }}>
                    Prefix
                    {!isProPlan ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: '#f59e0b',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        letterSpacing: '0.4px'
                      }}>
                        <Crown size={12} fill="#f59e0b" /> PRO EXCLUSIVE
                      </span>
                    ) : isWithin15Days ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#10b981',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '10.5px',
                        fontWeight: 800
                      }}>
                        <Crown size={12} fill="#10b981" /> UNLOCKED
                      </span>
                    ) : null}
                  </label>
                  {!isProPlan && (
                    <button
                      type="button"
                      onClick={() => { setShowGenLicenseModal(false); onUpgradeClick('pro'); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#f59e0b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Crown size={12} fill="#f59e0b" /> Unlock ($3.20/mo)
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={!isProPlan ? 'HABIT' : genPrefix} 
                    onChange={(e) => isProPlan && setGenPrefix(e.target.value.toUpperCase())} 
                    readOnly={!isProPlan}
                    className="form-input" 
                    style={{
                      fontFamily: 'var(--font-mono)',
                      paddingRight: !isProPlan ? '42px' : '14px',
                      background: !isProPlan ? 'rgba(245, 158, 11, 0.05)' : undefined,
                      borderColor: !isProPlan ? 'rgba(245, 158, 11, 0.3)' : undefined,
                      cursor: !isProPlan ? 'not-allowed' : 'text',
                      color: !isProPlan ? '#fcd34d' : '#ffffff'
                    }} 
                  />
                  {!isProPlan && (
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none'
                    }}>
                      <Crown size={18} color="#f59e0b" fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))' }} />
                    </div>
                  )}
                </div>

                {!isProPlan && (
                  <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Crown size={12} fill="#f59e0b" style={{ flexShrink: 0 }} />
                    <span>Free and Starter plans are locked to default prefix <strong>HABIT-</strong>. Upgrade to <strong>Pro Developer ($3.20/mo)</strong> to customize prefixes.</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Optional Note</label>
                <input 
                  type="text" 
                  placeholder="e.g. VIP Giveaway" 
                  value={genNote} 
                  onChange={(e) => setGenNote(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowGenLicenseModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate Keys'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CREATE TEAM MODAL */}
      {showCreateTeamModal && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }} className="flex-align">
                <Users2 size={20} color="var(--primary)" style={{ marginRight: '8px' }} />
                Create Development Team
              </h3>
              <button className="icon-btn" onClick={() => setShowCreateTeamModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Apex Software Team" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="form-input" 
                />
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowCreateTeamModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5B. EDIT APPLICATION VERSION MODAL */}
      {showEditVersionModal && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel" style={{ maxWidth: '440px' }}>
            <div className="flex-between" style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }} className="flex-align">
                <Edit2 size={18} color="var(--primary)" style={{ marginRight: '8px' }} />
                Update Application Version
              </h3>
              <button className="icon-btn" onClick={() => setShowEditVersionModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleUpdateAppVersion}>
              <div className="form-group">
                <label className="form-label">Current Version</label>
                <input 
                  type="text" 
                  readOnly 
                  value={`v${currentAppDetails?.version || '1.0.0'}`} 
                  className="form-input mono-text" 
                  style={{ opacity: 0.7 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Release Version</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 1.1.0 or 2.0.0"
                  value={editAppVersion}
                  onChange={(e) => setEditAppVersion(e.target.value)}
                  className="form-input mono-text"
                  style={{ fontWeight: 800, color: 'var(--primary-light)' }}
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Standard semantic versioning recommended (e.g. Major.Minor.Patch).
                </span>
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowEditVersionModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isUpdatingVersion}>
                  {isUpdatingVersion ? 'Saving...' : 'Save & Publish Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5C. SUPPORT TICKET CHAT & THREAD MODAL (SPACIOUS & EXPANDED) */}
      {selectedTicket && (
        <div className="modal-overlay animate-scale-in">
          <div 
            className="modal-content glass-panel" 
            style={{ 
              maxWidth: '1050px', 
              width: '94vw', 
              height: '86vh', 
              display: 'flex', 
              flexDirection: 'column',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.15)'
            }}
          >
            {/* Top Modal Bar */}
            <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div className="flex-align" style={{ gap: '10px' }}>
                  <span className={`badge ${selectedTicket.priority === 'critical' || selectedTicket.priority === 'high' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                    {selectedTicket.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="mono-text" style={{ fontSize: '12.5px', color: 'var(--primary-light)', fontWeight: 800 }}>
                    #{selectedTicket.id}
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{selectedTicket.title}</h3>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }} className="flex-align">
                  <span>Client: <strong style={{ color: '#fff' }}>@{selectedTicket.client_username || selectedTicket.creator_name || 'User'}</strong></span>
                  <span style={{ margin: '0 8px' }}>&bull;</span>
                  <span>App: <strong style={{ color: 'var(--primary-light)' }}>{selectedTicket.app_name || 'Global'}</strong></span>
                  <span style={{ margin: '0 8px' }}>&bull;</span>
                  <span>Opened: {new Date(selectedTicket.created_at * 1000).toLocaleString()}</span>
                  <span style={{ margin: '0 8px' }}>&bull;</span>
                  <span className="badge badge-active" style={{ fontSize: '10px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Zap size={10} /> LIVE CHAT SYNC</span>
                </div>
              </div>

              <div className="flex-align" style={{ gap: '12px' }}>
                <div className="flex-align" style={{ gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</label>
                  {currentUser?.role === 'admin' ? (
                    <select 
                      className="form-select" 
                      value={selectedTicket.status} 
                      onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value)}
                      style={{ fontSize: '12.5px', padding: '6px 12px', width: 'auto', fontWeight: 700 }}
                    >
                      <option value="open">Status: Open</option>
                      <option value="in-progress">Status: In Progress</option>
                      <option value="resolved">Status: Resolved</option>
                      <option value="closed">Status: Closed</option>
                    </select>
                  ) : (
                    <span 
                      className={`badge ${selectedTicket.status === 'open' ? 'badge-active' : selectedTicket.status === 'in-progress' ? 'badge-warning' : selectedTicket.status === 'resolved' ? 'badge-primary' : 'badge-inactive'}`}
                      style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 700, textTransform: 'capitalize' }}
                      title="Only Administrators can change ticket status"
                    >
                      {selectedTicket.status === 'open' && 'Open'}
                      {selectedTicket.status === 'in-progress' && 'In Progress'}
                      {selectedTicket.status === 'resolved' && 'Resolved'}
                      {selectedTicket.status === 'closed' && 'Closed'}
                    </span>
                  )}
                </div>
                <button className="icon-btn" onClick={() => setSelectedTicket(null)} style={{ padding: '8px' }}><X size={18} /></button>
              </div>
            </div>

            {/* Original Problem Statement Box */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Original Issue Description
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {selectedTicket.description}
              </p>
            </div>

            {/* Chat Thread Message History */}
            <div 
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '18px 20px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '14px',
                background: 'rgba(5, 4, 12, 0.65)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              {ticketMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>No messages in this ticket thread yet.</p>
                </div>
              ) : (
                ticketMessages.map((msg, idx) => {
                  const isMe = Boolean(
                    (currentUser?.id && msg.sender_id === currentUser.id) ||
                    (currentUser?.username && msg.sender_name === currentUser.username) ||
                    (currentUser?.role !== 'user' && (msg.sender_role === 'developer' || msg.sender_role === 'admin'))
                  );

                  return (
                    <div 
                      key={msg.id || idx} 
                      style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        minWidth: '220px',
                        background: isMe 
                          ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.32) 0%, rgba(109, 40, 217, 0.22) 100%)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isMe 
                          ? '1px solid rgba(59, 130, 246, 0.5)' 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: isMe ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                        padding: '13px 16px',
                        boxShadow: isMe 
                          ? '0 4px 20px rgba(59, 130, 246, 0.18)' 
                          : '0 4px 16px rgba(0, 0, 0, 0.4)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="flex-between" style={{ gap: '14px', marginBottom: '7px' }}>
                        <div className="flex-align" style={{ gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: isMe ? 'var(--primary-light)' : '#38bdf8' }}>
                            {isMe ? 'You' : msg.sender_name}
                          </span>
                          {msg.sender_role === 'user' ? (
                            <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '4px', fontSize: '8.5px', padding: '1px 6px', fontWeight: 700 }}>
                              CLIENT
                            </span>
                          ) : (
                            <span className="badge badge-primary" style={{ fontSize: '8.5px', padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: 700 }}>
                              SUPPORT
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', color: isMe ? 'rgba(216, 180, 254, 0.7)' : 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                          {new Date(msg.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '13.5px', color: isMe ? '#ffffff' : '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: 1.5, wordBreak: 'break-word' }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={ticketMessagesEndRef} />
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendTicketMessage} style={{ marginTop: '16px' }}>
              <div className="flex-align" style={{ gap: '12px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type your reply..." 
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', fontSize: '13.5px' }}
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSendingTicketMsg || !newTicketMessage.trim()}
                  style={{ padding: '12px 24px', fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                  <Send size={15} style={{ marginRight: '6px' }} /> Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5D. OPEN NEW SUPPORT TICKET MODAL */}
      {showCreateTicketModal && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="flex-between" style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }} className="flex-align">
                <LifeBuoy size={18} color="var(--primary)" style={{ marginRight: '8px' }} />
                Open Support Ticket
              </h3>
              <button className="icon-btn" onClick={() => setShowCreateTicketModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label className="form-label">Subject / Issue Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. HWID reset request / Game crash on launch"
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Client Username (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. JohnGamer12"
                  value={newTicketClientUser}
                  onChange={(e) => setNewTicketClientUser(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select 
                  className="form-select"
                  value={newTicketPriority}
                  onChange={(e) => setNewTicketPriority(e.target.value)}
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical / Blocker</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the issue or error logs in detail..."
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCreateTicketModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingTicket}>
                  {isCreatingTicket ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5E. ADD TO BLACKLIST MODAL */}
      {showAddBlacklistModal && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel" style={{ maxWidth: '480px' }}>
            <div className="flex-between" style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f87171' }} className="flex-align">
                <Ban size={18} style={{ marginRight: '8px' }} />
                Add Device / IP to Blacklist
              </h3>
              <button className="icon-btn" onClick={() => setShowAddBlacklistModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleAddBlacklist}>
              <div className="form-group">
                <label className="form-label">Blacklist Type</label>
                <select 
                  className="form-select"
                  value={newBlacklistType}
                  onChange={(e) => setNewBlacklistType(e.target.value)}
                >
                  <option value="hwid">Hardware ID (HWID)</option>
                  <option value="ip">IP Address</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Application Scope</label>
                <select 
                  className="form-select"
                  value={newBlacklistAppId}
                  onChange={(e) => setNewBlacklistAppId(e.target.value)}
                >
                  <option value="global">Global (All Applications)</option>
                  {apps.map(a => (
                    <option key={a.id} value={a.id}>{a.app_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Blocked Value ({newBlacklistType.toUpperCase()})</label>
                <input 
                  type="text" 
                  required
                  placeholder={newBlacklistType === 'hwid' ? 'e.g. 7A1F-9E02-8BC4...' : 'e.g. 192.168.1.100'}
                  value={newBlacklistValue}
                  onChange={(e) => setNewBlacklistValue(e.target.value)}
                  className="form-input mono-text"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ban Reason / Policy Violation</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Memory dumping, reversing, multiple chargebacks"
                  value={newBlacklistReason}
                  onChange={(e) => setNewBlacklistReason(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddBlacklistModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={isAddingBlacklist}>
                  {isAddingBlacklist ? 'Blacklisting...' : 'Confirm Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. BULK GENERATE LICENSES MODAL */}
      {showBulkGenModal && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel" style={{ maxWidth: '560px' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }} className="flex-align">
                <Sparkles size={20} color="var(--primary)" style={{ marginRight: '8px' }} />
                Bulk License Generator
              </h3>
              <button className="icon-btn" onClick={() => setShowBulkGenModal(false)}><X size={16} /></button>
            </div>

            {bulkGeneratedKeys.length === 0 ? (
              <form onSubmit={handleBulkGenerateLicenses}>
                <div className="form-group">
                  <label className="form-label">Quantity to Generate</label>
                  <select 
                    className="form-select"
                    value={bulkGenCount}
                    onChange={(e) => setBulkGenCount(parseInt(e.target.value))}
                  >
                    <option value={10}>10 Keys</option>
                    <option value={25}>25 Keys</option>
                    <option value={50}>50 Keys</option>
                    <option value={100}>100 Keys (Standard Store Batch)</option>
                    <option value={250}>250 Keys</option>
                    <option value={500}>500 Keys (High Volume)</option>
                    <option value={1000}>1,000 Keys (Max Batch)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">License Duration (Days)</label>
                  <select 
                    className="form-select"
                    value={bulkGenDuration}
                    onChange={(e) => setBulkGenDuration(parseInt(e.target.value))}
                  >
                    <option value={1}>1 Day (Day Pass)</option>
                    <option value={7}>7 Days (Weekly)</option>
                    <option value={30}>30 Days (Monthly)</option>
                    <option value={90}>90 Days (Quarterly)</option>
                    <option value={365}>365 Days (Annual)</option>
                    <option value={0}>0 (Lifetime License)</option>
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700 }}>
                      Custom License Format Mask (Optional)
                      {!isProPlan ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#f59e0b',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          letterSpacing: '0.4px'
                        }}>
                          <Crown size={12} fill="#f59e0b" /> PRO EXCLUSIVE
                        </span>
                      ) : isWithin15Days ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          color: '#10b981',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '10.5px',
                          fontWeight: 800
                        }}>
                          <Crown size={12} fill="#10b981" /> UNLOCKED
                        </span>
                      ) : null}
                    </label>
                    {!isProPlan && (
                      <button
                        type="button"
                        onClick={() => { setShowBulkGenModal(false); onUpgradeClick('pro'); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#f59e0b',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Crown size={12} fill="#f59e0b" /> Unlock ($3.20/mo)
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-input mono-text"
                      value={!isProPlan ? '' : bulkGenMask}
                      onChange={(e) => isProPlan && setBulkGenMask(e.target.value)}
                      placeholder={!isProPlan ? "PRO Feature: VIP-****-****-**** (Locked)" : "e.g. VIP-****-****-**** (leave empty for default)"}
                      readOnly={!isProPlan}
                      style={{
                        paddingRight: !isProPlan ? '42px' : '14px',
                        background: !isProPlan ? 'rgba(245, 158, 11, 0.05)' : undefined,
                        borderColor: !isProPlan ? 'rgba(245, 158, 11, 0.3)' : undefined,
                        cursor: !isProPlan ? 'not-allowed' : 'text',
                        color: !isProPlan ? '#fcd34d' : undefined
                      }}
                    />
                    {!isProPlan && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none'
                      }}>
                        <Crown size={18} color="#f59e0b" fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))' }} />
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: !isProPlan ? '#f59e0b' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                    {!isProPlan ? (
                      <>
                        <Crown size={12} fill="#f59e0b" style={{ flexShrink: 0 }} />
                        <span>Custom mask patterns are reserved for <strong>Pro Developer ($3.20/mo)</strong> subscribers.</span>
                      </>
                    ) : (
                      'Each * will be replaced by a cryptographically secure random character.'
                    )}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Batch Note / Tag (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={bulkGenNote}
                    onChange={(e) => setBulkGenNote(e.target.value)}
                    placeholder="e.g. Shoppy Batch #4, Sellix Promo"
                  />
                </div>

                <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                  <button type="button" onClick={() => setShowBulkGenModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isBulkGenerating}>
                    {isBulkGenerating ? 'Generating...' : `Generate ${bulkGenCount} Keys`}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Check size={24} />
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800 }}>{bulkGeneratedKeys.length} Keys Generated Successfully!</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ready for distribution on Shoppy, Sellix, Sellpass, or Discord.</span>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', lineHeight: 1.6, color: 'var(--primary-light)' }}>
                  {bulkGeneratedKeys.map((k, idx) => (
                    <div key={idx}>{k}</div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(bulkGeneratedKeys.join('\n'));
                      showToast('Copied all keys to clipboard (line by line)!');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px' }}
                  >
                    <Copy size={13} style={{ marginRight: '6px' }} /> Copy All
                  </button>
                  <button 
                    onClick={() => handleExportLicenses('txt')}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px' }}
                  >
                    <Download size={13} style={{ marginRight: '6px' }} /> Download .TXT
                  </button>
                  <button 
                    onClick={() => handleExportLicenses('csv')}
                    className="btn btn-primary"
                    style={{ fontSize: '12px' }}
                  >
                    <Download size={13} style={{ marginRight: '6px' }} /> Download .CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. EXPORT LICENSES MODAL */}
      {showExportModal && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel" style={{ maxWidth: '420px' }}>
            <div className="flex-between" style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }} className="flex-align">
                <Download size={18} color="var(--primary)" style={{ marginRight: '8px' }} />
                Export License Keys
              </h3>
              <button className="icon-btn" onClick={() => setShowExportModal(false)}><X size={16} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Filter by Status</label>
              <select 
                className="form-select"
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value)}
              >
                <option value="all">All Licenses</option>
                <option value="unused">Unused (Ready to Sell)</option>
                <option value="active">Active (Bound to Users)</option>
                <option value="revoked">Revoked Keys</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Export File Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label 
                  style={{ 
                    cursor: 'pointer',
                    padding: '12px', 
                    borderRadius: 'var(--radius-sm)', 
                    border: exportFormat === 'txt' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: exportFormat === 'txt' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <input 
                    type="radio" 
                    name="exportFormat" 
                    checked={exportFormat === 'txt'} 
                    onChange={() => setExportFormat('txt')} 
                  />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>.TXT File</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>One key per line (Shoppy/Discord)</span>
                  </div>
                </label>

                <label 
                  style={{ 
                    cursor: 'pointer',
                    padding: '12px', 
                    borderRadius: 'var(--radius-sm)', 
                    border: exportFormat === 'csv' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: exportFormat === 'csv' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <input 
                    type="radio" 
                    name="exportFormat" 
                    checked={exportFormat === 'csv'} 
                    onChange={() => setExportFormat('csv')} 
                  />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>.CSV Spreadsheet</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>Full metadata with HWID & user</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowExportModal(false)} className="btn btn-secondary">Cancel</button>
              <button 
                type="button" 
                onClick={() => handleExportLicenses(exportFormat)} 
                className="btn btn-primary"
              >
                Download .{exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EDIT MEMBER PERMISSIONS MODAL */}
      {showMemberPermsModal && editingMember && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }} className="flex-align">
                <Sliders size={20} color="var(--primary)" style={{ marginRight: '8px' }} />
                Member Roles & Permissions
              </h3>
              <button className="icon-btn" onClick={() => setShowMemberPermsModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveMemberPermissions}>
              <div className="form-group">
                <label className="form-label">Team Member</label>
                <input type="text" readOnly value={`@${editingMember.username}`} className="form-input" style={{ opacity: 0.8 }} />
              </div>

              <div className="form-group">
                <label className="form-label">Assign Team Role</label>
                <select 
                  className="form-select"
                  value={memberRole}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setMemberRole(newRole);
                    // Automatically adjust default permissions based on role preset
                    if (newRole === 'admin') {
                      setMemberPerms({ manage_users: true, manage_licenses: true, view_analytics: true, manage_webhooks: true });
                    } else if (newRole === 'manager') {
                      setMemberPerms({ manage_users: true, manage_licenses: true, view_analytics: true, manage_webhooks: false });
                    } else if (newRole === 'developer') {
                      setMemberPerms({ manage_users: true, manage_licenses: true, view_analytics: false, manage_webhooks: false });
                    } else if (newRole === 'moderator') {
                      setMemberPerms({ manage_users: true, manage_licenses: false, view_analytics: false, manage_webhooks: false });
                    } else if (newRole === 'support') {
                      setMemberPerms({ manage_users: true, manage_licenses: false, view_analytics: false, manage_webhooks: false });
                    } else if (newRole === 'viewer') {
                      setMemberPerms({ manage_users: false, manage_licenses: false, view_analytics: true, manage_webhooks: false });
                    }
                  }}
                >
                  <option value="admin">Admin — Full Master Access</option>
                  <option value="manager">Manager — Users, Licenses & Analytics</option>
                  <option value="developer">Developer — Manage Users & Licenses</option>
                  <option value="moderator">Moderator — User & HWID Moderation</option>
                  <option value="support">Support — User & License Lookup</option>
                  <option value="viewer">Viewer — Read-Only Analytics</option>
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Selecting a role auto-configures default permissions below. You can customize permissions individually.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '10px' }}>Granular Access Permissions</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="flex-between" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '13px' }}>Manage Users (Add, edit, ban, reset HWID/SID)</span>
                    <input type="checkbox" checked={!!memberPerms.manage_users} onChange={(e) => setMemberPerms({ ...memberPerms, manage_users: e.target.checked })} />
                  </label>

                  <label className="flex-between" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '13px' }}>Manage Licenses (Generate & revoke licenses)</span>
                    <input type="checkbox" checked={!!memberPerms.manage_licenses} onChange={(e) => setMemberPerms({ ...memberPerms, manage_licenses: e.target.checked })} />
                  </label>

                  <label className="flex-between" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '13px' }}>View Analytics (Overview stats & active apps)</span>
                    <input type="checkbox" checked={!!memberPerms.view_analytics} onChange={(e) => setMemberPerms({ ...memberPerms, view_analytics: e.target.checked })} />
                  </label>

                  <label className="flex-between" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '13px' }}>Manage Webhooks (Configure Discord event hooks)</span>
                    <input type="checkbox" checked={!!memberPerms.manage_webhooks} onChange={(e) => setMemberPerms({ ...memberPerms, manage_webhooks: e.target.checked })} />
                  </label>
                </div>
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowMemberPermsModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Permissions</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. BLACKLIST MEMBER MODAL */}
      {showBlacklistModal && blacklistingMember && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger)' }} className="flex-align">
                <Ban size={20} style={{ marginRight: '8px' }} />
                Blacklist Team Member
              </h3>
              <button className="icon-btn" onClick={() => setShowBlacklistModal(false)}><X size={16} /></button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Blacklisting <b>@{blacklistingMember.username}</b> will immediately remove them from the team and permanently block them from rejoining with any invite code.
            </p>

            <form onSubmit={handleConfirmBlacklist}>
              <div className="form-group">
                <label className="form-label">Blacklist Reason</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Unauthorized credential extraction" 
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  className="form-input" 
                />
              </div>

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowBlacklistModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Confirm Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6.5. MANAGE DEVELOPER SUBSCRIPTION DURATION MODAL */}
      {subModalAccount && (
        <div className="modal-overlay animate-scale-in">
          <div className="modal-content glass-panel" style={{ maxWidth: '480px' }}>
            <div className="flex-between" style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }} className="flex-align">
                <Crown size={20} style={{ marginRight: '8px', color: '#f59e0b' }} />
                Manage Plan & Subscription
              </h3>
              <button className="icon-btn" onClick={() => setSubModalAccount(null)}><X size={16} /></button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>@{subModalAccount.username}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Discord ID: {subModalAccount.discord_id}</div>
              {subModalAccount.expires_at > 0 ? (
                <div style={{ fontSize: '12px', marginTop: '6px', color: subModalAccount.sub_status === 'expired' ? 'var(--danger)' : '#38bdf8', fontWeight: 600 }}>
                  Current Expiry: {new Date(subModalAccount.expires_at * 1000).toLocaleDateString()} {new Date(subModalAccount.expires_at * 1000).toLocaleTimeString()}
                  {subModalAccount.sub_status === 'expired' ? ' (EXPIRED - CLIENTS SUSPENDED)' : ` (${Math.max(0, Math.ceil((subModalAccount.expires_at - Math.floor(Date.now() / 1000)) / 86400))} days left)`}
                </div>
              ) : (subModalAccount.plan === 'developer' || subModalAccount.plan === 'pro') ? (
                <div style={{ fontSize: '12px', marginTop: '6px', color: '#10b981', fontWeight: 600 }}>
                  Current Status: Lifetime {subModalAccount.plan?.toUpperCase()} Access
                </div>
              ) : (
                <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-muted)' }}>
                  Current Plan: Free Tier (1 App / 10 Users)
                </div>
              )}
            </div>

            <form onSubmit={handleSaveSubscription}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Plan Tier</label>
                <select
                  className="form-select"
                  value={subModalPlan}
                  onChange={(e) => setSubModalPlan(e.target.value)}
                >
                  <option value="developer">DEVELOPER PLAN ($1.20/mo - 100 Apps / 10K Users)</option>
                  <option value="pro">PRO DEVELOPER PLAN ($3.20/mo - 1,000 Apps / 100K Users)</option>
                  <option value="free">FREE PLAN (Reset to 1 App limit)</option>
                </select>
              </div>

              {(subModalPlan === 'developer' || subModalPlan === 'pro') && (
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Subscription Duration</label>
                  <select
                    className="form-select"
                    value={subModalDuration}
                    onChange={(e) => setSubModalDuration(e.target.value)}
                  >
                    <option value="1month">1 Month (30 Days)</option>
                    <option value="3months">3 Months (90 Days)</option>
                    <option value="1year">1 Year (365 Days)</option>
                    <option value="lifetime">Lifetime Access (Indefinite)</option>
                  </select>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--danger)' }}>Strict Suspension:</strong> When this subscription duration expires, client software authentication for this developer's applications will be automatically blocked until renewed.
                  </div>
                </div>
              )}

              <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button type="button" onClick={() => setSubModalAccount(null)} className="btn btn-secondary" disabled={subModalSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={subModalSaving}>
                  {subModalSaving ? 'Saving...' : 'Save & Apply Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. CUSTOM IN-WEBSITE CONFIRMATION MODAL */}
      <CustomConfirmModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 8. INTERACTIVE BAN REASON MODAL */}
      {banReasonModal && (
        <div className="modal-overlay animate-scale-in" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 6, 10, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1100
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: '#11131a',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(239, 68, 68, 0.18)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ban size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>Enforce Account Suspension</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    Target: <strong style={{ color: '#fca5a5' }}>@{banReasonModal.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBanReasonModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Quick Preset Reasons (Click to select)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  'Terms of Service violation',
                  'Unauthorized debugging / binary tampering',
                  'Multi-device license key abuse',
                  'Suspicious bot / credential brute-force behavior',
                  'Payment chargeback or disputed invoice'
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBanReasonModal(prev => ({ ...prev, reason: preset }))}
                    style={{
                      background: banReasonModal.reason === preset ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${banReasonModal.reason === preset ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: banReasonModal.reason === preset ? '#fca5a5' : '#cbd5e1',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Suspension Reason (Visible to user upon login attempt) *
              </label>
              <textarea
                rows={3}
                required
                value={banReasonModal.reason || ''}
                onChange={e => setBanReasonModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain the specific reason for suspending this user..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                When this user attempts to sign in, they will be blocked and this reason will be displayed on their screen.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setBanReasonModal(null)}
                className="btn btn-secondary"
                disabled={isSubmittingBan}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeBanToggle(banReasonModal.type, banReasonModal.id, banReasonModal.reason, 'ban')}
                className="btn btn-primary"
                disabled={isSubmittingBan || !banReasonModal.reason?.trim()}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderColor: '#ef4444',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                {isSubmittingBan ? 'Suspending...' : 'Confirm & Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. SET DIRECT LOGIN CREDENTIALS MODAL */}
      {showDirectCredsModal && (
        <div className="modal-overlay animate-scale-in" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 6, 10, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1100
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: '#11131a',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Key size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>Direct Login Credentials</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    Log in from other browsers without Discord
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDirectCredsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {directCredsError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#ef4444',
                fontSize: '12.5px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{directCredsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDirectCredentials}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  Direct Login Username *
                </label>
                <input
                  type="text"
                  required
                  value={directCredsUsername}
                  onChange={e => setDirectCredsUsername(e.target.value)}
                  placeholder="e.g. johndev"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  Set New Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={directCredsPassword}
                  onChange={e => setDirectCredsPassword(e.target.value)}
                  placeholder="Enter strong password"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowDirectCredsModal(false)}
                  className="btn btn-secondary"
                  disabled={directCredsSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={directCredsSaving}
                >
                  {directCredsSaving ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. NOTIFICATION DETAILS POPUP MODAL */}
      {selectedNotifDetails && (
        <div className="modal-overlay animate-scale-in" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '26px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div className="flex-align" style={{ gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: selectedNotifDetails.type === 'security' ? 'rgba(239, 68, 68, 0.15)' : selectedNotifDetails.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: selectedNotifDetails.type === 'security' ? '#ef4444' : selectedNotifDetails.type === 'warning' ? '#f59e0b' : '#3b82f6',
                  border: `1px solid ${selectedNotifDetails.type === 'security' ? 'rgba(239, 68, 68, 0.3)' : selectedNotifDetails.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                }}>
                  {selectedNotifDetails.type === 'security' ? <ShieldAlert size={20} /> : selectedNotifDetails.type === 'warning' ? <AlertTriangle size={20} /> : <Bell size={20} />}
                </div>
                <div>
                  <span className={`badge badge-${selectedNotifDetails.type === 'security' ? 'danger' : selectedNotifDetails.type === 'warning' ? 'warning' : 'primary'}`} style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>
                    {selectedNotifDetails.type === 'security' ? 'Security Advisory' : selectedNotifDetails.type === 'warning' ? 'Warning Notice' : 'System Announcement'}
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(selectedNotifDetails.created_at * 1000).toLocaleString()}
                  </div>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedNotifDetails(null)}>
                <X size={16} />
              </button>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '14px', lineHeight: 1.4 }}>
              {selectedNotifDetails.title}
            </h3>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '13.5px',
              color: '#e2e8f0',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              marginBottom: '16px',
              maxHeight: '260px',
              overflowY: 'auto'
            }}>
              {selectedNotifDetails.message}
            </div>

            {selectedNotifDetails.image_url && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Attached Image / Document
                </div>
                <a href={selectedNotifDetails.image_url} target="_blank" rel="noreferrer" title="Click to view full image in new tab">
                  <img 
                    src={selectedNotifDetails.image_url} 
                    alt="Attached Broadcast" 
                    style={{
                      width: '100%',
                      maxHeight: '260px',
                      objectFit: 'contain',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      cursor: 'zoom-in'
                    }} 
                  />
                </a>
              </div>
            )}

            {selectedNotifDetails.link_url && (
              <div style={{ marginBottom: '16px' }}>
                <a 
                  href={selectedNotifDetails.link_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '10px' }}
                >
                  <span>Visit Referenced Link</span> <ExternalLink size={14} />
                </a>
              </div>
            )}

            <div className="flex-between" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                type="button" 
                onClick={(e) => {
                  handleDeleteNotif(selectedNotifDetails.id, e);
                  setSelectedNotifDetails(null);
                }} 
                className="btn btn-secondary" 
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '12px', gap: '6px' }}
              >
                <Trash2 size={13} /> Delete
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedNotifDetails(null)} 
                className="btn btn-secondary" 
                style={{ fontSize: '12px', padding: '8px 20px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── APK NATIVE LANGUAGE SELECTOR BOTTOM SHEET / MODAL ── */}
      {langDropdownOpen && (
        <div 
          className="modal-overlay" 
          style={{ 
            zIndex: 99999, 
            alignItems: 'flex-end', 
            padding: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={() => setLangDropdownOpen(false)}
        >
          <div 
            className="mobile-lang-sheet animate-slide-up"
            style={{
              width: '100%',
              maxWidth: '480px',
              margin: '0 auto',
              background: '#0d101a',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '16px 20px calc(env(safe-area-inset-bottom, 0px) + 24px) 20px',
              boxShadow: '0 -12px 50px rgba(0, 0, 0, 0.9)',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.25)', margin: '0 auto 16px auto' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="#60a5fa" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Select Language</span>
              </div>
              <button 
                type="button" 
                onClick={() => setLangDropdownOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '58vh', overflowY: 'auto' }}>
              {languages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
                      showToast(`Language switched to ${lang.name}`, 'info');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(37, 99, 235, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#93c5fd' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '22px' }}>{lang.flag}</span>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#60a5fa' : '#ffffff' }}>
                          {lang.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                          {lang.code}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="#60a5fa" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── APK MOBILE BOTTOM NAVIGATION BAR ───────────────────── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button 
          type="button"
          className={`mobile-nav-tab ${activeNav === 'overview' ? 'active' : ''}`}
          onClick={() => { setActiveNav('overview'); setMobileSidebarOpen(false); }}
        >
          <div className="mobile-nav-icon-wrap">
            <LayoutDashboard size={19} />
          </div>
          <span>Overview</span>
        </button>

        <button 
          type="button"
          className={`mobile-nav-tab ${activeNav === 'apps' ? 'active' : ''}`}
          onClick={() => { setActiveNav('apps'); setMobileSidebarOpen(false); }}
        >
          <div className="mobile-nav-icon-wrap">
            <Smartphone size={19} />
          </div>
          <span>Apps</span>
        </button>

        <button 
          type="button"
          className={`mobile-nav-tab ${activeNav === 'users' ? 'active' : ''}`}
          onClick={() => { setActiveNav('users'); setMobileSidebarOpen(false); }}
        >
          <div className="mobile-nav-icon-wrap">
            <Users size={19} />
          </div>
          <span>Users</span>
        </button>

        <button 
          type="button"
          className={`mobile-nav-tab ${activeNav === 'licenses' ? 'active' : ''}`}
          onClick={() => { setActiveNav('licenses'); setMobileSidebarOpen(false); }}
        >
          <div className="mobile-nav-icon-wrap">
            <Key size={19} />
          </div>
          <span>Licenses</span>
        </button>

        <button 
          type="button"
          className={`mobile-nav-tab ${mobileSidebarOpen ? 'active' : ''}`}
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          <div className="mobile-nav-icon-wrap">
            <Menu size={19} />
          </div>
          <span>Menu</span>
        </button>
      </nav>

    </div>
  );
}
