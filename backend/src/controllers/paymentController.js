import { db } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const GATEWAY_CONFIG = {
  prices: {
    developer: {
      monthly: { usd: 1.20, bdt: 150 },
      yearly: { usd: 12.00, bdt: 1500 }
    },
    pro: {
      monthly: { usd: 3.20, bdt: 400 },
      yearly: { usd: 32.00, bdt: 4000 }
    }
  },
  gateways: {
    bkash: {
      id: 'bkash',
      name: 'bKash',
      badge: 'Most Popular (BD)',
      color: '#e2136e',
      type: 'mobile_banking',
      number: '01939336831',
      accountType: 'Personal (Send Money)',
      currency: 'BDT',
      instructions: 'bKash অ্যাপ বা *247# এ গিয়ে "Send Money" করুন এই নম্বরে। ট্রানজেকশন সফল হলে ৮-১০ সংখ্যার TrxID এবং আপনার যে নম্বর থেকে টাকা পাঠিয়েছেন তা নিচে দিন।'
    },
    rocket: {
      id: 'rocket',
      name: 'Rocket',
      badge: 'Fast (BD)',
      color: '#8c3494',
      type: 'mobile_banking',
      number: '01939336831',
      accountType: 'Personal (Send Money)',
      currency: 'BDT',
      instructions: 'Rocket অ্যাপ বা *322# এ গিয়ে "Send Money" করুন এই নম্বরে। সফল হলে TrxID এবং আপনার রকেট নম্বর নিচে দিন।'
    },
    nagad: {
      id: 'nagad',
      name: 'Nagad',
      badge: 'Instant (BD)',
      color: '#f7941d',
      type: 'mobile_banking',
      number: '01925188754',
      accountType: 'Personal (Send Money)',
      currency: 'BDT',
      instructions: 'Nagad অ্যাপ বা *167# এ গিয়ে "Send Money" করুন এই নম্বরে। সফল হলে ৮ সংখ্যার TrxID এবং আপনার নগদ নম্বর নিচে দিন।'
    },
    binance_pay: {
      id: 'binance_pay',
      name: 'Binance Pay',
      badge: 'Zero Fee',
      color: '#f59e0b',
      type: 'crypto_pay',
      payId: '1025707697',
      accountType: 'Binance Pay ID (0 Fee)',
      currency: 'USDT',
      instructions: 'Open Binance App > Pay > Send > Enter Pay ID: 1025707697. After sending, copy your Binance Order ID / Pay ID and paste below.'
    },
    trc20: {
      id: 'trc20',
      name: 'TRON (TRC-20)',
      badge: 'USDT / TRX',
      color: '#06b6d4',
      type: 'crypto_onchain',
      address: 'TFtpThLcVSbR6KKEExWg2UiWibUvFc1AG3',
      network: 'TRON (TRC20)',
      acceptedCurrencies: ['USDT (TRC20)', 'TRX'],
      currency: 'USDT',
      qrCodeUrl: '/binance-qr.png',
      instructions: 'Send USDT (TRC-20) or TRX to the TRON wallet address. After transaction completes, copy the 64-character Transaction Hash (TxID) and paste below.'
    }
  }
};

/**
 * GET /api/v1/payment/config
 * Returns public payment gateways and pricing details
 */
export async function getPaymentConfig(req, res) {
  try {
    return res.json({
      success: true,
      config: GATEWAY_CONFIG
    });
  } catch (err) {
    console.error('[Payment Config Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to load payment configuration.' });
  }
}

/**
 * POST /api/v1/payment/submit-order
 * Authenticated user submits a payment claim for any of the 5 gateways
 */
export async function submitPaymentOrder(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please sign in or create an account first to continue.' });
    }

    const { 
      plan, 
      billing_cycle = 'monthly', 
      payment_method, 
      sender_number, 
      txid 
    } = req.body;

    // 1. Validation
    if (!plan || !['developer', 'pro'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan selected.' });
    }

    if (!billing_cycle || !['monthly', 'yearly'].includes(billing_cycle)) {
      return res.status(400).json({ success: false, message: 'Invalid billing cycle.' });
    }

    const gateway = GATEWAY_CONFIG.gateways[payment_method];
    if (!gateway) {
      return res.status(400).json({ success: false, message: 'Invalid payment method selected.' });
    }

    const cleanTxId = (txid || '').trim().toUpperCase();
    const cleanSender = (sender_number || '').trim();

    if (!cleanTxId || cleanTxId.length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Transaction ID / TrxID / Order ID.' });
    }

    if (!cleanSender) {
      return res.status(400).json({ 
        success: false, 
        message: gateway.type === 'mobile_banking' 
          ? 'Please provide the mobile number you sent the money from.' 
          : 'Please provide your sender wallet or Binance ID.' 
      });
    }

    // Phone number validation for bKash, Rocket, Nagad
    if (gateway.type === 'mobile_banking') {
      const sanitizedPhone = cleanSender.replace(/[^0-9]/g, '');
      if (sanitizedPhone.length < 11 || !sanitizedPhone.startsWith('01')) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX, 019XXXXXXXX).'
        });
      }
    }

    // 2. Anti-Spam Rate Limit Check: max 3 pending orders per user
    const pendingCount = db.prepare(`
      SELECT count(*) as count FROM crypto_payments 
      WHERE user_id = ? AND status = 'pending'
    `).get(userId)?.count || 0;

    if (pendingCount >= 3) {
      return res.status(429).json({
        success: false,
        code: 'TOO_MANY_PENDING',
        message: 'You already have 3 pending orders awaiting admin review. Please wait for our team to verify them.'
      });
    }

    // 3. STRICT ANTI-DUPLICATE & MULTI-ACCOUNT FRAUD CHECK
    const existing = db.prepare(`
      SELECT * FROM crypto_payments WHERE UPPER(txid) = ?
    `).get(cleanTxId);

    if (existing) {
      if (existing.user_id !== userId) {
        return res.status(400).json({
          success: false,
          code: 'TX_DUPLICATE_CROSS_ACCOUNT',
          message: 'Security Alert: This Transaction ID has already been submitted by another account. Multi-account fraud attempt detected and logged.'
        });
      }

      if (existing.status === 'approved' || existing.status === 'completed') {
        return res.status(400).json({
          success: false,
          code: 'TX_ALREADY_APPROVED',
          message: 'This Transaction ID has already been verified and your subscription is active.'
        });
      }

      if (existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          code: 'TX_ALREADY_PENDING',
          message: 'This Transaction ID is already submitted and is currently pending admin review.'
        });
      }

      if (existing.status === 'rejected') {
        return res.status(400).json({
          success: false,
          code: 'TX_PREVIOUSLY_REJECTED',
          message: 'This Transaction ID was previously reviewed and rejected by admin. Please check your payment details or contact support.'
        });
      }
    }

    // 4. Calculate Expected Price and Target Destination
    const isBdt = gateway.currency === 'BDT';
    const amount = isBdt 
      ? GATEWAY_CONFIG.prices[plan][billing_cycle].bdt
      : GATEWAY_CONFIG.prices[plan][billing_cycle].usd;
    const currency = gateway.currency;
    const toAddress = gateway.number || gateway.payId || gateway.address;

    // 5. Store Order in Database with 'pending' status
    const orderId = `ord_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO crypto_payments (
        id, user_id, plan, billing_cycle, amount, currency,
        txid, from_address, to_address, payment_method, sender_number,
        admin_notes, reviewed_at, reviewed_by, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 0, '', 'pending', ?)
    `).run(
      orderId,
      userId,
      plan,
      billing_cycle,
      amount,
      currency,
      cleanTxId,
      cleanSender,
      toAddress,
      payment_method,
      cleanSender,
      now
    );

    // 6. In-App Notification for User
    try {
      const notifId = `notif_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
        VALUES (?, ?, ?, ?, 'info', 0, ?)
      `).run(
        notifId,
        userId,
        'Payment Order Submitted',
        `Your order for ${plan.toUpperCase()} Plan (${billing_cycle}) via ${gateway.name} has been received and is pending admin review.`,
        now
      );
    } catch (notifErr) {}

    // 7. Instant Rich Discord Alert to Admin Webhook
    try {
      const userRecord = db.prepare('SELECT username, email FROM accounts WHERE id = ?').get(userId);
      const discordWebhook = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1479836371109154948/k2B8x1V_9vj9E_tVq5qg6R_yS2J_3Z';
      
      if (discordWebhook && discordWebhook.startsWith('https://')) {
        const payload = {
          username: 'Habit Auth Payment Alert',
          avatar_url: 'https://habitauth.onrender.com/assets/logo.png',
          embeds: [
            {
              title: `⏳ New Payment Order: ${gateway.name}`,
              description: `A user has submitted a new payment order awaiting admin review and plan release.`,
              color: 0xf59e0b, // Amber / Pending
              fields: [
                { name: '👤 Username', value: userRecord?.username || 'Unknown', inline: true },
                { name: '📧 Email', value: userRecord?.email || 'Unknown', inline: true },
                { name: '📦 Selected Plan', value: `${plan.toUpperCase()} (${billing_cycle})`, inline: true },
                { name: '💳 Gateway', value: `${gateway.name} (${gateway.accountType || ''})`, inline: true },
                { name: '💰 Amount', value: `${currency === 'BDT' ? '৳' : '$'}${amount} ${currency}`, inline: true },
                { name: '📱 Sender Info', value: `\`${cleanSender}\``, inline: true },
                { name: '🧾 TrxID / TxID', value: `\`${cleanTxId}\``, inline: false },
                { name: '🆔 Order ID', value: `\`${orderId}\``, inline: true },
                { name: '🕒 Status', value: '⏳ **PENDING ADMIN REVIEW**', inline: true }
              ],
              footer: { text: 'Habit Auth Billing Engine • Open Admin Panel to Approve' },
              timestamp: new Date().toISOString()
            }
          ]
        };

        fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('[Discord Webhook Error]:', err.message));
      }
    } catch (discErr) {
      console.warn('[Payment Alert Webhook Warning]:', discErr.message);
    }

    return res.json({
      success: true,
      message: 'Payment order submitted successfully! It is now pending admin review.',
      order: {
        id: orderId,
        plan,
        billing_cycle,
        amount,
        currency,
        payment_method,
        sender_number: cleanSender,
        txid: cleanTxId,
        status: 'pending',
        created_at: now
      }
    });

  } catch (err) {
    console.error('[Submit Payment Order Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error processing payment order.' });
  }
}

/**
 * GET /api/v1/payment/my-orders
 * Returns all payment orders for the authenticated user
 */
export async function getUserOrders(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const orders = db.prepare(`
      SELECT 
        id, plan, billing_cycle, amount, currency, txid,
        payment_method, sender_number, to_address,
        status, admin_notes, created_at, reviewed_at
      FROM crypto_payments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    return res.json({
      success: true,
      orders
    });
  } catch (err) {
    console.error('[Get User Orders Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user orders.' });
  }
}

/**
 * GET /api/v1/admin/payment-orders
 * Admin-only: Returns all payment orders across the platform
 */
export async function getAdminOrders(req, res) {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }

    const orders = db.prepare(`
      SELECT 
        cp.*,
        a.username,
        a.email,
        a.role as current_role,
        a.plan as current_plan
      FROM crypto_payments cp
      LEFT JOIN accounts a ON cp.user_id = a.id
      ORDER BY cp.created_at DESC
    `).all();

    return res.json({
      success: true,
      orders
    });
  } catch (err) {
    console.error('[Get Admin Orders Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to load admin orders.' });
  }
}

/**
 * POST /api/v1/admin/payment-orders/:id/review
 * Admin-only: Approve or Reject a payment order
 */
export async function reviewOrder(req, res) {
  try {
    const adminUser = req.user;
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }

    const { id } = req.params;
    const { action, admin_notes = '' } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action. Must be 'approve' or 'reject'." });
    }

    const order = db.prepare('SELECT * FROM crypto_payments WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Payment order not found.' });
    }

    const now = Math.floor(Date.now() / 1000);

    if (action === 'approve') {
      // 1. Mark order approved
      db.prepare(`
        UPDATE crypto_payments 
        SET status = 'approved', admin_notes = ?, reviewed_at = ?, reviewed_by = ?
        WHERE id = ?
      `).run(admin_notes, now, adminUser.username || 'admin', id);

      // 2. Update or Insert Subscription Record
      const durationSeconds = order.billing_cycle === 'yearly' ? (365 * 86400) : (30 * 86400);
      const expiresAt = now + durationSeconds;

      const existingSub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(order.user_id);
      if (existingSub) {
        db.prepare(`
          UPDATE subscriptions 
          SET plan = ?, status = 'active', started_at = ?, expires_at = ? 
          WHERE user_id = ?
        `).run(order.plan, now, expiresAt, order.user_id);
      } else {
        const subId = `sub_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
        db.prepare(`
          INSERT INTO subscriptions (id, user_id, plan, status, started_at, expires_at, provider, created_at)
          VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
        `).run(subId, order.user_id, order.plan, now, expiresAt, order.payment_method, now);
      }

      // 3. Update team capacity if owner has a team
      const targetCapacity = order.plan === 'pro' ? 500 : 25;
      try {
        db.prepare('UPDATE teams SET max_members = ? WHERE owner_id = ?').run(targetCapacity, order.user_id);
      } catch (e) {}

      // 4. In-App Notification for User
      try {
        const notifId = `notif_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
          VALUES (?, ?, ?, ?, 'security', 0, ?)
        `).run(
          notifId,
          order.user_id,
          '🎉 Subscription Activated!',
          `Your payment order (${order.txid}) for ${order.plan.toUpperCase()} Plan has been approved by admin! All premium developer features and hardware licenses are now unlocked.`,
          now
        );
      } catch (err) {}

      // 5. Discord Webhook Notification
      try {
        const discordWebhook = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1479836371109154948/k2B8x1V_9vj9E_tVq5qg6R_yS2J_3Z';
        if (discordWebhook && discordWebhook.startsWith('https://')) {
          fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'Habit Auth Payment Alert',
              avatar_url: 'https://habitauth.onrender.com/assets/logo.png',
              embeds: [{
                title: '✅ Payment Order APPROVED & Subscription Activated',
                description: `Admin **${adminUser.username}** approved order \`${id}\`. User has been upgraded to **${order.plan.toUpperCase()}** plan.`,
                color: 0x10b981, // Green
                fields: [
                  { name: '🆔 Order ID', value: `\`${id}\``, inline: true },
                  { name: '📦 Plan', value: `${order.plan.toUpperCase()} (${order.billing_cycle})`, inline: true },
                  { name: '💳 Gateway', value: `${order.payment_method.toUpperCase()}`, inline: true },
                  { name: '🧾 TrxID', value: `\`${order.txid}\``, inline: false },
                  { name: '📝 Admin Notes', value: admin_notes || 'Approved & Released', inline: false }
                ],
                timestamp: new Date().toISOString()
              }]
            })
          }).catch(() => {});
        }
      } catch (err) {}

      return res.json({
        success: true,
        message: 'Order approved successfully! User subscription is now active.',
        status: 'approved'
      });

    } else {
      // Action: REJECT
      db.prepare(`
        UPDATE crypto_payments 
        SET status = 'rejected', admin_notes = ?, reviewed_at = ?, reviewed_by = ?
        WHERE id = ?
      `).run(admin_notes, now, adminUser.username || 'admin', id);

      // In-App Notification for User
      try {
        const notifId = `notif_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
          VALUES (?, ?, ?, ?, 'warning', 0, ?)
        `).run(
          notifId,
          order.user_id,
          '❌ Order Rejected',
          `Your payment order (${order.txid}) was rejected by admin. Reason: ${admin_notes || 'Payment could not be verified in statements.'}`,
          now
        );
      } catch (err) {}

      return res.json({
        success: true,
        message: 'Order rejected.',
        status: 'rejected'
      });
    }

  } catch (err) {
    console.error('[Review Order Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error reviewing payment order.' });
  }
}
