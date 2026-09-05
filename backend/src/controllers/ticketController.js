import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { recordAuditLog, triggerDiscordWebhook } from '../middleware/helpers.js';

// 1. GET Tickets (Scoped to current developer or admin)
export function getTickets(req, res) {
  const { appId, status, priority, search = '' } = req.query;
  const user = req.user;

  let query = `
    SELECT 
      t.*, 
      a.app_name,
      u.username as creator_name,
      (SELECT COUNT(*) FROM ticket_messages m WHERE m.ticket_id = t.id) as message_count,
      (SELECT m.created_at FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
    FROM tickets t
    LEFT JOIN applications a ON a.id = t.app_id
    LEFT JOIN accounts u ON u.id = t.user_id
    WHERE 1=1
  `;
  const params = [];

  if (user.role !== 'admin') {
    query += ` AND (t.user_id = ? OR t.app_id IN (SELECT id FROM applications WHERE user_id = ?))`;
    params.push(user.id, user.id);
  }

  if (appId && appId !== 'all') {
    query += ` AND t.app_id = ?`;
    params.push(appId);
  }

  if (status && status !== 'all') {
    query += ` AND t.status = ?`;
    params.push(status);
  }

  if (priority && priority !== 'all') {
    query += ` AND t.priority = ?`;
    params.push(priority);
  }

  if (search.trim()) {
    query += ` AND (t.id LIKE ? OR t.title LIKE ? OR t.description LIKE ? OR t.client_username LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  query += ` ORDER BY t.updated_at DESC LIMIT 100`;

  const tickets = db.prepare(query).all(...params);
  res.json({ success: true, tickets });
}

// 2. CREATE Ticket
export function createTicket(req, res) {
  const { appId, title, description, priority = 'normal', clientUsername } = req.body;
  const user = req.user;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required.' });
  }

  const id = `tkt_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  const now = Math.floor(Date.now() / 1000);

  const targetAppId = (appId && appId !== 'all') ? appId : null;
  const username = clientUsername ? clientUsername.trim() : (user.username || 'Anonymous Client');

  db.prepare(`
    INSERT INTO tickets (id, app_id, user_id, client_username, title, description, status, priority, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)
  `).run(id, targetAppId, user.id, username, title.trim(), description.trim(), priority, now, now);

  // Add initial message (from the client asking for help)
  const msgId = `msg_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  db.prepare(`
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_name, sender_role, message, created_at)
    VALUES (?, ?, ?, ?, 'user', ?, ?)
  `).run(msgId, id, 'client_' + id, username, description.trim(), now);

  recordAuditLog(user.id, targetAppId, 'TICKET_CREATED', `Support ticket created: '${title}' (${priority})`, req.ip);

  // Trigger Discord webhook if app has webhooks
  if (targetAppId) {
    triggerDiscordWebhook(targetAppId, 'ticket_created', 'New Support Ticket Opened', `Ticket **${title}** opened by **${username}**.\nPriority: **${priority.toUpperCase()}**`, [
      { name: 'Ticket ID', value: id },
      { name: 'Description', value: description.slice(0, 200) }
    ]);
  }

  res.json({
    success: true,
    message: 'Support ticket created successfully.',
    ticket: { id, app_id: targetAppId, title, description, status: 'open', priority, created_at: now, updated_at: now }
  });
}

// 3. GET Ticket Details & Chat Messages
export function getTicketById(req, res) {
  const { ticketId } = req.params;
  const user = req.user;

  const ticket = db.prepare(`
    SELECT t.*, a.app_name, u.username as creator_name
    FROM tickets t
    LEFT JOIN applications a ON a.id = t.app_id
    LEFT JOIN accounts u ON u.id = t.user_id
    WHERE t.id = ?
  `).get(ticketId);

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }

  // Check access permission
  if (user.role !== 'admin' && ticket.user_id !== user.id) {
    const app = ticket.app_id ? db.prepare('SELECT user_id FROM applications WHERE id = ?').get(ticket.app_id) : null;
    if (!app || app.user_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this ticket.' });
    }
  }

  const messages = db.prepare(`
    SELECT * FROM ticket_messages 
    WHERE ticket_id = ? 
    ORDER BY created_at ASC
  `).all(ticketId);

  res.json({ success: true, ticket, messages });
}

// 4. ADD Message to Ticket Thread
export function addTicketMessage(req, res) {
  const { ticketId } = req.params;
  const { message, senderRole } = req.body;
  const user = req.user;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }

  const now = Math.floor(Date.now() / 1000);
  const msgId = `msg_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  
  const isClient = senderRole === 'user';
  const role = isClient ? 'user' : (user.role === 'admin' ? 'admin' : 'developer');
  const name = isClient ? (ticket.client_username || 'Client') : user.username;
  const senderId = isClient ? ('client_' + ticket.id) : user.id;

  db.prepare(`
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_name, sender_role, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(msgId, ticketId, senderId, name, role, message.trim(), now);

  // Update ticket timestamp without altering status
  db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(now, ticketId);

  recordAuditLog(user.id, ticket.app_id, 'TICKET_REPLY', `Reply sent on ticket '${ticket.title}'`, req.ip);

  res.json({
    success: true,
    message: 'Message sent successfully.',
    newMessage: { id: msgId, ticket_id: ticketId, sender_id: senderId, sender_name: name, sender_role: role, message: message.trim(), created_at: now }
  });
}

// 5. UPDATE Ticket Status or Priority (Admin Only)
export function updateTicketStatus(req, res) {
  const { ticketId } = req.params;
  const { status, priority } = req.body;
  const user = req.user;

  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Only administrators can change ticket status.' });
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }

  const now = Math.floor(Date.now() / 1000);
  const updatedStatus = status || ticket.status;
  const updatedPriority = priority || ticket.priority;

  db.prepare(`
    UPDATE tickets 
    SET status = ?, priority = ?, updated_at = ? 
    WHERE id = ?
  `).run(updatedStatus, updatedPriority, now, ticketId);

  recordAuditLog(user.id, ticket.app_id, 'TICKET_STATUS_UPDATED', `Ticket '${ticket.title}' updated to status '${updatedStatus}', priority '${updatedPriority}'`, req.ip);

  res.json({
    success: true,
    message: `Ticket updated to ${updatedStatus}.`,
    ticket: { ...ticket, status: updatedStatus, priority: updatedPriority, updated_at: now }
  });
}

// 6. DELETE Ticket
export function deleteTicket(req, res) {
  const { ticketId } = req.params;
  const user = req.user;

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }

  // Admin or app owner can delete
  if (user.role !== 'admin' && ticket.user_id !== user.id) {
    const app = ticket.app_id ? db.prepare('SELECT user_id FROM applications WHERE id = ?').get(ticket.app_id) : null;
    if (!app || app.user_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this ticket.' });
    }
  }

  db.prepare('DELETE FROM ticket_messages WHERE ticket_id = ?').run(ticketId);
  db.prepare('DELETE FROM tickets WHERE id = ?').run(ticketId);

  recordAuditLog(user.id, ticket.app_id, 'TICKET_DELETED', `Deleted support ticket '${ticket.title}'`, req.ip);

  res.json({ success: true, message: 'Ticket deleted successfully.' });
}
