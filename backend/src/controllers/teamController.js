import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { recordAuditLog } from '../middleware/helpers.js';

function generateTeamInviteCode() {
  const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TEAM-${p1}-${p2}`;
}

const DEFAULT_PERMISSIONS = {
  manage_users: true,
  manage_licenses: true,
  view_analytics: true,
  manage_webhooks: false,
  api_access: false
};

function safeParseJSON(val, fallback) {
  if (!val) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

// 1. Create Team (Owner)
export function createTeam(req, res) {
  const { name } = req.body;
  const ownerId = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Team name is required.' });
  }

  // Enforce Developer / Pro Plan requirement for team creation
  const sub = db.prepare('SELECT plan FROM subscriptions WHERE user_id = ?').get(ownerId);
  const plan = sub?.plan || req.user.plan || 'free';
  if (req.user.role !== 'admin' && plan === 'free') {
    return res.status(403).json({ success: false, message: 'Team management is exclusive to Developer ($1.20/mo) and Pro ($3.20/mo) plans. Please upgrade to create a team.' });
  }

  // Check if owner already has a team
  const existing = db.prepare('SELECT id, name FROM teams WHERE owner_id = ?').get(ownerId);
  if (existing) {
    return res.status(400).json({ success: false, message: `You already own team '${existing.name}'.` });
  }

  const teamId = 'team_' + uuidv4().replace(/-/g, '').slice(0, 16);
  const inviteCode = generateTeamInviteCode();
  const now = Math.floor(Date.now() / 1000);
  const isPro = req.user.role === 'admin' || plan === 'pro';
  const maxMembers = isPro ? 500 : 25;

  db.prepare(`
    INSERT INTO teams (id, owner_id, name, invite_code, max_members, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(teamId, ownerId, name.trim(), inviteCode, maxMembers, now);

  // Insert owner as active member
  const memberId = 'tm_' + uuidv4().replace(/-/g, '').slice(0, 16);
  db.prepare(`
    INSERT INTO team_members (id, team_id, user_id, email, role, status, permissions, joined_at)
    VALUES (?, ?, ?, ?, 'owner', 'active', ?, ?)
  `).run(memberId, teamId, ownerId, req.user.email || null, JSON.stringify({
    manage_users: true,
    manage_licenses: true,
    view_analytics: true,
    manage_webhooks: true,
    api_access: true
  }), now);

  recordAuditLog(ownerId, null, 'TEAM_CREATED', `Created team '${name.trim()}' with code ${inviteCode}`, req.ip);

  res.status(201).json({
    success: true,
    message: `Team '${name.trim()}' created successfully!`,
    team: {
      id: teamId,
      name: name.trim(),
      invite_code: inviteCode,
      max_members: maxMembers
    }
  });
}

// 2. Get Owner's Team with Members, Requests, and Blacklist
export function getMyTeam(req, res) {
  const ownerId = req.user.id;

  const team = db.prepare('SELECT * FROM teams WHERE owner_id = ?').get(ownerId);
  if (!team) {
    return res.json({ success: true, hasTeam: false, team: null });
  }

  // Auto-sync team capacity with current subscription plan
  const sub = db.prepare('SELECT plan FROM subscriptions WHERE user_id = ?').get(ownerId);
  const currentPlan = sub?.plan || req.user.plan || 'free';
  const isPro = req.user.role === 'admin' || currentPlan === 'pro';
  const targetCapacity = isPro ? 500 : 25;
  if (team.max_members !== targetCapacity) {
    db.prepare('UPDATE teams SET max_members = ? WHERE id = ?').run(targetCapacity, team.id);
    team.max_members = targetCapacity;
  }

  // Active members
  const activeMembers = db.prepare(`
    SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.status, tm.permissions, tm.joined_at,
           a.username, a.email, a.avatar
    FROM team_members tm
    JOIN accounts a ON tm.user_id = a.id
    WHERE tm.team_id = ? AND tm.status = 'active'
    ORDER BY tm.joined_at ASC
  `).all(team.id);

  // Parse permissions JSON
  const parsedActiveMembers = activeMembers.map(m => ({
    ...m,
    permissions: safeParseJSON(m.permissions, DEFAULT_PERMISSIONS)
  }));

  // Pending join requests
  const pendingRequests = db.prepare(`
    SELECT tm.id, tm.team_id, tm.user_id, tm.joined_at,
           a.username, a.email, a.avatar
    FROM team_members tm
    JOIN accounts a ON tm.user_id = a.id
    WHERE tm.team_id = ? AND tm.status = 'pending'
    ORDER BY tm.joined_at DESC
  `).all(team.id);

  // Blacklisted users
  const blacklistedUsers = db.prepare(`
    SELECT tb.id, tb.user_id, tb.reason, tb.created_at,
           a.username, a.avatar
    FROM team_blacklists tb
    JOIN accounts a ON tb.user_id = a.id
    WHERE tb.team_id = ?
    ORDER BY tb.created_at DESC
  `).all(team.id);

  res.json({
    success: true,
    hasTeam: true,
    team: {
      ...team,
      membersCount: activeMembers.length,
      members: parsedActiveMembers,
      pendingRequests,
      blacklistedUsers
    }
  });
}

// 3. Regenerate Invite Code (Owner)
export function regenerateTeamCode(req, res) {
  const ownerId = req.user.id;
  const team = db.prepare('SELECT id, name FROM teams WHERE owner_id = ?').get(ownerId);
  if (!team) {
    return res.status(404).json({ success: false, message: 'You do not own a team.' });
  }

  const newCode = generateTeamInviteCode();
  db.prepare('UPDATE teams SET invite_code = ? WHERE id = ?').run(newCode, team.id);

  recordAuditLog(ownerId, null, 'TEAM_CODE_REGENERATED', `Regenerated invite code to ${newCode}`, req.ip);

  res.json({
    success: true,
    message: 'Team invite code regenerated successfully!',
    invite_code: newCode
  });
}

// 4. Request to Join Team (Any user enters team code)
export function requestJoinTeam(req, res) {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Team invite code is required.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const team = db.prepare('SELECT * FROM teams WHERE invite_code = ?').get(cleanCode);

  if (!team) {
    return res.status(404).json({ success: false, message: 'Invalid team invite code. Team not found.' });
  }

  if (team.owner_id === userId) {
    return res.status(400).json({ success: false, message: 'You are the owner of this team.' });
  }

  // Check if blacklisted
  const isBlacklisted = db.prepare('SELECT id FROM team_blacklists WHERE team_id = ? AND user_id = ?').get(team.id, userId);
  if (isBlacklisted) {
    return res.status(403).json({ success: false, message: 'You have been blacklisted by this team owner.' });
  }

  // Check if already a member or requested
  const existing = db.prepare('SELECT id, status FROM team_members WHERE team_id = ? AND user_id = ?').get(team.id, userId);
  if (existing) {
    if (existing.status === 'active') {
      return res.status(400).json({ success: false, message: 'You are already an active member of this team.' });
    }
    if (existing.status === 'pending') {
      return res.status(400).json({ success: false, message: 'You have already sent a join request to this team. Waiting for owner approval.' });
    }
  }

  // Check team capacity
  const activeCount = db.prepare("SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND status = 'active'").get(team.id).count;
  if (activeCount >= (team.max_members || 5)) {
    return res.status(400).json({ 
      success: false, 
      message: `Team has reached its maximum capacity of ${team.max_members || 5} members.` 
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const memberId = existing ? existing.id : 'tm_' + uuidv4().replace(/-/g, '').slice(0, 16);

  if (existing) {
    db.prepare("UPDATE team_members SET status = 'pending', joined_at = ? WHERE id = ?").run(now, existing.id);
  } else {
    db.prepare(`
      INSERT INTO team_members (id, team_id, user_id, email, role, status, permissions, joined_at)
      VALUES (?, ?, ?, ?, 'developer', 'pending', ?, ?)
    `).run(memberId, team.id, userId, req.user.email || null, JSON.stringify(DEFAULT_PERMISSIONS), now);
  }

  // Notify team owner
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
    VALUES (?, ?, ?, ?, 'info', 0, ?)
  `).run(
    'notif_' + uuidv4().slice(0, 16),
    team.owner_id,
    'New Team Join Request',
    `User **${req.user.username}** requested to join team **${team.name}**.`,
    now
  );

  res.json({
    success: true,
    message: `Join request sent to team '${team.name}'. Awaiting owner approval.`,
    team_name: team.name
  });
}

// 5. Accept Join Request (Owner)
export function acceptJoinRequest(req, res) {
  const { teamId, memberId } = req.params;
  const ownerId = req.user.id;

  const team = db.prepare('SELECT id, name, max_members FROM teams WHERE id = ? AND owner_id = ?').get(teamId, ownerId);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found or unauthorized.' });

  // Capacity check
  const activeCount = db.prepare("SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND status = 'active'").get(teamId).count;
  if (activeCount >= (team.max_members || 5)) {
    return res.status(400).json({ success: false, message: `Team is full (${team.max_members} max).` });
  }

  const member = db.prepare('SELECT tm.*, a.username FROM team_members tm JOIN accounts a ON tm.user_id = a.id WHERE tm.id = ? AND tm.team_id = ?').get(memberId, teamId);
  if (!member) return res.status(404).json({ success: false, message: 'Join request not found.' });

  db.prepare("UPDATE team_members SET status = 'active' WHERE id = ?").run(memberId);

  // Notify accepted user
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
    VALUES (?, ?, ?, ?, 'success', 0, ?)
  `).run(
    'notif_' + uuidv4().slice(0, 16),
    member.user_id,
    'Team Join Request Accepted!',
    `Congratulations! You are now an active member of team **${team.name}**. Access your Team Dashboard now.`,
    Math.floor(Date.now() / 1000)
  );

  recordAuditLog(ownerId, null, 'TEAM_MEMBER_ACCEPTED', `Accepted user '${member.username}' into team '${team.name}'`, req.ip);

  res.json({ success: true, message: `User '${member.username}' is now an active team member.` });
}

// 6. Reject Join Request (Owner)
export function rejectJoinRequest(req, res) {
  const { teamId, memberId } = req.params;
  const ownerId = req.user.id;

  const team = db.prepare('SELECT id FROM teams WHERE id = ? AND owner_id = ?').get(teamId, ownerId);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found or unauthorized.' });

  db.prepare("DELETE FROM team_members WHERE id = ? AND team_id = ? AND status = 'pending'").run(memberId, teamId);

  res.json({ success: true, message: 'Join request rejected.' });
}

// 7. Update Member Role & Permissions (Owner)
export function updateMemberPermissions(req, res) {
  const { teamId, memberId } = req.params;
  const { role, permissions } = req.body;
  const ownerId = req.user.id;

  const team = db.prepare('SELECT id FROM teams WHERE id = ? AND owner_id = ?').get(teamId, ownerId);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found or unauthorized.' });

  const member = db.prepare('SELECT user_id, role FROM team_members WHERE id = ? AND team_id = ?').get(memberId, teamId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

  if (member.user_id === ownerId) {
    return res.status(400).json({ success: false, message: 'Cannot modify permissions for team owner.' });
  }

  const validRole = ['admin', 'manager', 'developer', 'moderator', 'support', 'viewer'].includes(role?.toLowerCase()) ? role.toLowerCase() : (role || 'developer');
  const permsString = typeof permissions === 'object' ? JSON.stringify(permissions) : JSON.stringify(DEFAULT_PERMISSIONS);

  db.prepare('UPDATE team_members SET role = ?, permissions = ? WHERE id = ?').run(validRole, permsString, memberId);

  recordAuditLog(ownerId, null, 'TEAM_PERMISSIONS_UPDATED', `Updated permissions and role (${validRole}) for member ${memberId}`, req.ip);

  res.json({ success: true, message: 'Member permissions updated successfully.' });
}

// 8. Kick Member (Owner)
export function kickMember(req, res) {
  const { teamId, memberId } = req.params;
  const currentUserId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const team = isAdmin
    ? db.prepare('SELECT id, name, owner_id FROM teams WHERE id = ?').get(teamId)
    : db.prepare('SELECT id, name, owner_id FROM teams WHERE id = ? AND owner_id = ?').get(teamId, currentUserId);

  if (!team) return res.status(404).json({ success: false, message: 'Team not found or unauthorized.' });

  const member = db.prepare('SELECT tm.user_id, a.username FROM team_members tm JOIN accounts a ON tm.user_id = a.id WHERE tm.id = ? AND tm.team_id = ?').get(memberId, teamId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

  if (member.user_id === team.owner_id) {
    return res.status(400).json({ success: false, message: 'Cannot kick team owner. Use Disband Team to terminate.' });
  }

  db.prepare('DELETE FROM team_members WHERE id = ?').run(memberId);

  // Notify kicked user
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
    VALUES (?, ?, ?, ?, 'warning', 0, ?)
  `).run(
    'notif_' + uuidv4().slice(0, 16),
    member.user_id,
    'Removed from Team',
    `You have been removed from team **${team.name}**.`,
    Math.floor(Date.now() / 1000)
  );

  recordAuditLog(currentUserId, null, 'TEAM_MEMBER_KICKED', `Kicked user '${member.username}' from team '${team.name}'`, req.ip);

  res.json({ success: true, message: `User '${member.username}' has been removed from the team.` });
}

// 9. Blacklist Member (Owner & Super Admin)
export function blacklistMember(req, res) {
  const { teamId, memberId } = req.params;
  const { reason } = req.body;
  const currentUserId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const team = isAdmin
    ? db.prepare('SELECT id, name, owner_id FROM teams WHERE id = ?').get(teamId)
    : db.prepare('SELECT id, name, owner_id FROM teams WHERE id = ? AND owner_id = ?').get(teamId, currentUserId);

  if (!team) return res.status(404).json({ success: false, message: 'Team not found or unauthorized.' });

  const member = db.prepare('SELECT tm.user_id, a.username FROM team_members tm JOIN accounts a ON tm.user_id = a.id WHERE tm.id = ? AND tm.team_id = ?').get(memberId, teamId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

  if (member.user_id === team.owner_id) {
    return res.status(400).json({ success: false, message: 'Cannot blacklist team owner.' });
  }

  // Remove from team members
  db.prepare('DELETE FROM team_members WHERE id = ?').run(memberId);

  // Insert into blacklist
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`
    INSERT INTO team_blacklists (id, team_id, user_id, reason, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run('tbl_' + uuidv4().slice(0, 16), teamId, member.user_id, reason || (isAdmin ? 'Banned by Super Admin' : 'Blacklisted by team owner'), now);

  recordAuditLog(currentUserId, null, 'TEAM_MEMBER_BLACKLISTED', `Blacklisted user '${member.username}' from team '${team.name}'`, req.ip);

  res.json({ success: true, message: `User '${member.username}' has been blacklisted from this team.` });
}

// 10. Unblacklist Member (Owner)
export function unblacklistMember(req, res) {
  const { teamId, blacklistId } = req.params;
  const ownerId = req.user.id;

  const team = db.prepare('SELECT id FROM teams WHERE id = ? AND owner_id = ?').get(teamId, ownerId);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found or unauthorized.' });

  db.prepare('DELETE FROM team_blacklists WHERE id = ? AND team_id = ?').run(blacklistId, teamId);

  res.json({ success: true, message: 'User removed from blacklist.' });
}

// 11. Get Joined Team Information (For Member's Team Dashboard)
export function getJoinedTeam(req, res) {
  const userId = req.user.id;

  // Find active membership in a team where user is NOT owner
  const membership = db.prepare(`
    SELECT tm.id as membership_id, tm.role, tm.permissions, tm.joined_at,
           t.id as team_id, t.name as team_name, t.owner_id,
           owner.username as owner_username, owner.avatar as owner_avatar
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    JOIN accounts owner ON t.owner_id = owner.id
    WHERE tm.user_id = ? AND tm.status = 'active' AND t.owner_id != ?
  `).get(userId, userId);

  if (!membership) {
    // Check if user has a pending join request
    const pending = db.prepare(`
      SELECT tm.id as request_id, tm.joined_at, t.name as team_name, owner.username as owner_username
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN accounts owner ON t.owner_id = owner.id
      WHERE tm.user_id = ? AND tm.status = 'pending'
    `).get(userId);

    return res.json({
      success: true,
      hasJoinedTeam: false,
      pendingRequest: pending || null
    });
  }

  // Parse permissions
  const permissions = safeParseJSON(membership.permissions, DEFAULT_PERMISSIONS);

  // Fetch Team Owner's Applications
  const ownerApps = db.prepare(`
    SELECT id, app_name, version, status, created_at,
           (SELECT COUNT(*) FROM application_users WHERE app_id = applications.id) as total_users,
           (SELECT COUNT(*) FROM licenses WHERE app_id = applications.id) as total_licenses
    FROM applications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(membership.owner_id);

  res.json({
    success: true,
    hasJoinedTeam: true,
    team: {
      team_id: membership.team_id,
      team_name: membership.team_name,
      owner_username: membership.owner_username,
      owner_avatar: membership.owner_avatar,
      role: membership.role,
      permissions,
      joined_at: membership.joined_at,
      apps: ownerApps
    }
  });
}

// 12. Cancel My Pending Join Request
export function cancelMyJoinRequest(req, res) {
  const userId = req.user.id;
  db.prepare("DELETE FROM team_members WHERE user_id = ? AND status = 'pending'").run(userId);
  res.json({ success: true, message: 'Pending join request cancelled.' });
}

// 13. Admin: Update Team Member Capacity (Up to 500)
export function setTeamCapacity(req, res) {
  const { teamId } = req.params;
  const { max_members } = req.body;

  const count = parseInt(max_members, 10);
  if (isNaN(count) || count < 1 || count > 500) {
    return res.status(400).json({ success: false, message: 'Max members must be between 1 and 500.' });
  }

  db.prepare('UPDATE teams SET max_members = ? WHERE id = ?').run(count, teamId);
  recordAuditLog(req.user.id, null, 'ADMIN_TEAM_CAPACITY_UPDATED', `Set team ${teamId} max members to ${count}`, req.ip);

  res.json({ success: true, message: `Team capacity updated to ${count} members.` });
}

// 14. Owner: Close & Disband Team
export function closeTeam(req, res) {
  const { teamId } = req.params;
  const userId = req.user.id;

  const team = db.prepare('SELECT id, name FROM teams WHERE id = ? AND owner_id = ?').get(teamId, userId);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found or unauthorized.' });

  // Notify all active members that team was closed
  const members = db.prepare('SELECT user_id FROM team_members WHERE team_id = ? AND user_id != ?').all(teamId, userId);
  const now = Math.floor(Date.now() / 1000);
  const insertNotif = db.prepare('INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)');
  members.forEach(m => {
    insertNotif.run('notif_' + uuidv4().slice(0, 16), m.user_id, 'Team Closed', `The team '${team.name}' has been closed and disbanded by its owner.`, 'warning', now);
  });

  db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
  recordAuditLog(userId, null, 'TEAM_CLOSED', `Owner closed and disbanded team '${team.name}'`, req.ip);

  res.json({ success: true, message: `Team '${team.name}' has been successfully closed and disbanded.` });
}

// 15. Team Member: Get Team Owner's App Users
export function getTeamAppUsers(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;

  const membership = db.prepare(`
    SELECT tm.permissions, tm.role, t.owner_id
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = ? AND tm.status = 'active'
  `).get(userId);

  if (!membership) return res.status(403).json({ success: false, message: 'You are not an active member of any team.' });
  const perms = safeParseJSON(membership.permissions, DEFAULT_PERMISSIONS);
  if (!perms.manage_users && membership.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You do not have permission to manage team users.' });
  }

  // Look up application ONLY under team owner — no system-wide fallback
  const app = db.prepare('SELECT id, app_name FROM applications WHERE (id = ? OR app_name = ?) AND user_id = ?').get(appId, appId, membership.owner_id);
  if (!app) return res.status(404).json({ success: false, message: 'Team application not found.' });

  const users = db.prepare(`
    SELECT id, app_id, username, license_key, hwid, sid, status, failed_attempts, locked_until, expires_at, last_login, created_at
    FROM application_users
    WHERE app_id = ? OR app_id = ?
    ORDER BY created_at DESC
  `).all(app.id, app.app_name);

  res.json({ success: true, app_name: app.app_name, users });
}

// 16. Team Member: Get Team Owner's App Licenses
export function getTeamAppLicenses(req, res) {
  const { appId } = req.params;
  const userId = req.user.id;

  const membership = db.prepare(`
    SELECT tm.permissions, tm.role, t.owner_id
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = ? AND tm.status = 'active'
  `).get(userId);

  if (!membership) return res.status(403).json({ success: false, message: 'You are not an active member of any team.' });
  const perms = safeParseJSON(membership.permissions, DEFAULT_PERMISSIONS);
  if (!perms.manage_licenses && membership.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You do not have permission to view team licenses.' });
  }

  // Look up application ONLY under team owner — no system-wide fallback
  const app = db.prepare('SELECT id, app_name FROM applications WHERE (id = ? OR app_name = ?) AND user_id = ?').get(appId, appId, membership.owner_id);
  if (!app) return res.status(404).json({ success: false, message: 'Team application not found.' });

  const licenses = db.prepare(`
    SELECT *
    FROM licenses
    WHERE app_id = ? OR app_id = ?
    ORDER BY created_at DESC
  `).all(app.id, app.app_name);

  res.json({ success: true, app_name: app.app_name, licenses });
}

// 17. Team Member: Voluntary Leave Team
export function leaveTeam(req, res) {
  const userId = req.user.id;

  const membership = db.prepare(`
    SELECT tm.id as membership_id, tm.team_id, t.name as team_name, t.owner_id
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = ? AND tm.status = 'active' AND t.owner_id != ?
  `).get(userId, userId);

  if (!membership) {
    return res.status(400).json({ success: false, message: 'You are not an active member of any team.' });
  }

  // Remove member from team
  db.prepare('DELETE FROM team_members WHERE id = ?').run(membership.membership_id);

  // Audit log
  recordAuditLog(userId, membership.owner_id, 'TEAM_MEMBER_LEFT', `User '${req.user.username}' voluntarily left team '${membership.team_name}'`, req.ip);

  // Notify team owner
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run('notif_' + uuidv4().slice(0, 14), membership.owner_id, 'Member Left Team', `User **${req.user.username}** has voluntarily left your team **${membership.team_name}**.`, 'info', now);

  res.json({ success: true, message: `You have successfully left team '${membership.team_name}'.` });
}


