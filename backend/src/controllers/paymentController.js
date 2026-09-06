import { db } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Reads dynamic pricing, gateway details, and webhook URL from system_settings with default fallbacks
 */
export function getDynamicGatewayConfig() {
  const rows = db.prepare('SELECT key, value FROM system_settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });

  const prices = {
    developer: {
      monthly: {
        usd: parseFloat(settings['payment_price_dev_monthly_usd'] || '1.20'),
        bdt: parseInt(settings['payment_price_dev_monthly_bdt'] || '150', 10)
      },
      yearly: {
        usd: parseFloat(settings['payment_price_dev_yearly_usd'] || '12.00'),
        bdt: parseInt(settings['payment_price_dev_yearly_bdt'] || '1500', 10)
      }
    },
    pro: {
      monthly: {
        usd: parseFloat(settings['payment_price_pro_monthly_usd'] || '3.20'),
        bdt: parseInt(settings['payment_price_pro_monthly_bdt'] || '400', 10)
      },
      yearly: {
        usd: parseFloat(settings['payment_price_pro_yearly_usd'] || '32.00'),
        bdt: parseInt(settings['payment_price_pro_yearly_bdt'] || '4000', 10)
      }
    }
  };

  const gateways = {
    bkash: {
      id: 'bkash',
      name: 'bKash',
      badge: 'Send Money',
      color: '#e2136e',
      type: 'mobile_banking',
      number: settings['payment_bkash_number'] || '01939336831',
      accountType: 'Personal (Send Money)',
      currency: 'BDT',
      instructions: 'bKash অ্যাপ বা *247# এ গিয়ে "Send Money" করুন। ট্রানজেকশন সফল হলে ৮-১০ সংখ্যার TrxID এবং আপনার বিকাশ নম্বর নিচে দিন।'
    },
    rocket: {
      id: 'rocket',
      name: 'Rocket',
      badge: 'Send Money',
      color: '#8c3494',
      type: 'mobile_banking',
      number: settings['payment_rocket_number'] || '01939336831',
      accountType: 'Personal (Send Money)',
      currency: 'BDT',
      instructions: 'Rocket অ্যাপ বা *322# এ গিয়ে "Send Money" করুন। সফল হলে TrxID এবং আপনার রকেট নম্বর নিচে দিন।'
    },
    nagad: {
      id: 'nagad',
      name: 'Nagad',
      badge: 'Send Money',
      color: '#f7941d',
      type: 'mobile_banking',
      number: settings['payment_nagad_number'] || '01925188754',
      accountType: 'Personal (Send Money)',
      currency: 'BDT',
      instructions: 'Nagad অ্যাপ বা *167# এ গিয়ে "Send Money" করুন। সফল হলে ৮ সংখ্যার TrxID এবং আপনার নগদ নম্বর নিচে দিন।'
    },
    binance_pay: {
      id: 'binance_pay',
      name: 'Binance Pay',
      badge: '0 Fee',
      color: '#f59e0b',
      type: 'crypto_pay',
      payId: settings['payment_binance_pay_id'] || '1025707697',
      accountType: 'Binance Pay ID (0 Fee)',
      currency: 'USDT',
      instructions: 'Open Binance App > Pay > Send > Enter Pay ID: ' + (settings['payment_binance_pay_id'] || '1025707697') + '. Paste Order ID below.'
    },
    trc20: {
      id: 'trc20',
      name: 'TRON (TRC-20)',
      badge: 'USDT / TRX',
      color: '#06b6d4',
      type: 'crypto_onchain',
      address: settings['payment_trc20_address'] || 'TFtpThLcVSbR6KKEExWg2UiWibUvFc1AG3',
      network: 'TRON (TRC20)',
      acceptedCurrencies: ['USDT (TRC20)', 'TRX'],
      currency: 'USDT',
      qrCodeUrl: '/binance-qr.png',
      instructions: 'Send USDT (TRC-20) or TRX to TRON wallet. Once confirmed on TronScan, copy the 64-char TxID and paste below.'
    }
  };

  const discordWebhook = settings['payment_discord_webhook'] || 'https://discord.com/api/webhooks/1479836371109154948/k2B8x1V_9vj9E_tVq5qg6R_yS2J_3Z';

  return { prices, gateways, discordWebhook };
}

/**
 * GET /api/v1/payment/config
 * Returns public dynamic payment gateways and pricing details
 */
export async function getPaymentConfig(req, res) {
  try {
    const { prices, gateways } = getDynamicGatewayConfig();
    return res.json({
      success: true,
      config: { prices, gateways }
    });
  } catch (err) {
    console.error('[Payment Config Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to load payment configuration.' });
  }
}

/**
 * POST /api/v1/payment/validate-coupon
 * Validates a coupon code, checking expiration and usage limits, and calculates discounted prices
 */

/**
 * POST /api/v1/payment/create-session
 * Creates a secure hosted payment session with unique UUID token
 */
export async function createPaymentSession(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Please log in to initiate checkout.' });
    }

    const { plan = 'developer', billing_cycle = 'monthly' } = req.body;
    const { prices } = getDynamicGatewayConfig();

    const planPrices = prices[plan] || prices.developer;
    const cyclePrices = planPrices[billing_cycle] || planPrices.monthly;

    const sessionId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 7200; // 2 hours validity

    db.prepare(`
      INSERT INTO payment_sessions (id, user_id, plan, billing_cycle, amount_usd, amount_bdt, status, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(sessionId, user.id, plan, billing_cycle, cyclePrices.usd, cyclePrices.bdt, now, expiresAt);

    return res.json({
      success: true,
      session_id: sessionId,
      checkout_url: `/payment/${sessionId}?method=mobile_banking`
    });
  } catch (err) {
    console.error('[Create Payment Session Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment session.' });
  }
}

/**
 * GET /api/v1/payment/session/:sessionId
 * Retrieves hosted checkout session details
 */
export async function getPaymentSession(req, res) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID required.' });
    }

    const session = db.prepare('SELECT * FROM payment_sessions WHERE id = ?').get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Payment session not found or invalid.' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at < now) {
      return res.status(410).json({ success: false, message: 'This payment session has expired. Please initiate a new purchase.' });
    }

    const account = db.prepare('SELECT id, username, email FROM accounts WHERE id = ?').get(session.user_id) || {};
    const { gateways, prices } = getDynamicGatewayConfig();

    return res.json({
      success: true,
      session: {
        id: session.id,
        user_id: session.user_id,
        username: account.username || 'User',
        email: account.email || '',
        plan: session.plan,
        plan_name: session.plan === 'pro' ? 'Pro Developer' : 'Developer',
        billing_cycle: session.billing_cycle,
        amount_usd: session.amount_usd,
        amount_bdt: session.amount_bdt,
        status: session.status,
        created_at: session.created_at,
        expires_at: session.expires_at
      },
      gateways
    });
  } catch (err) {
    console.error('[Get Payment Session Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payment session.' });
  }
}

export async function validateCoupon(req, res) {
  try {
    const { code, plan = 'developer', billing_cycle = 'monthly' } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = ?').get(cleanCode);

    if (!coupon || !coupon.is_active) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    const now = Math.floor(Date.now() / 1000);

    // Check expiration timer (1s to 1 month)
    if (coupon.expires_at > 0 && coupon.expires_at < now) {
      return res.status(400).json({
        success: false,
        code: 'COUPON_EXPIRED',
        message: 'This coupon code has expired.'
      });
    }

    // Check maximum usage count
    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({
        success: false,
        code: 'COUPON_MAX_USES_REACHED',
        message: 'This coupon has reached its maximum redemption limit.'
      });
    }

    const { prices } = getDynamicGatewayConfig();
    const origUsd = prices[plan]?.[billing_cycle]?.usd || 1.20;
    const origBdt = prices[plan]?.[billing_cycle]?.bdt || 150;

    const discountUsd = Math.max(0, +(origUsd * (1 - coupon.discount_percent / 100)).toFixed(2));
    const discountBdt = Math.max(0, Math.round(origBdt * (1 - coupon.discount_percent / 100)));

    const couponData = {
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      expires_at: coupon.expires_at,
      original_usd: origUsd,
      discounted_usd: discountUsd,
      original_bdt: origBdt,
      discounted_bdt: discountBdt,
      savings_text: `${coupon.discount_percent}% OFF`
    };

    return res.json({
      success: true,
      valid: true,
      coupon: couponData,
      ...couponData
    });

  } catch (err) {
    console.error('[Validate Coupon Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error validating coupon.' });
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
      txid,
      coupon_code
    } = req.body;

    // 1. Validation
    if (!plan || !['developer', 'pro'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan selected.' });
    }

    if (!billing_cycle || !['monthly', 'yearly'].includes(billing_cycle)) {
      return res.status(400).json({ success: false, message: 'Invalid billing cycle.' });
    }

    const config = getDynamicGatewayConfig();
    const gateway = config.gateways[payment_method];
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

    // 4. Calculate Price (with Coupon if provided)
    const isBdt = gateway.currency === 'BDT';
    let baseAmount = isBdt 
      ? config.prices[plan][billing_cycle].bdt
      : config.prices[plan][billing_cycle].usd;
    
    let originalAmount = baseAmount;
    let finalAmount = baseAmount;
    let appliedCoupon = null;
    let discountPercent = 0;

    if (coupon_code) {
      const cleanCoupon = coupon_code.trim().toUpperCase();
      const nowTs = Math.floor(Date.now() / 1000);
      const cpn = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = ?').get(cleanCoupon);

      if (cpn && cpn.is_active && (cpn.expires_at === 0 || cpn.expires_at >= nowTs) && (cpn.max_uses === 0 || cpn.used_count < cpn.max_uses)) {
        appliedCoupon = cpn;
        discountPercent = cpn.discount_percent;
        if (isBdt) {
          finalAmount = Math.max(0, Math.round(baseAmount * (1 - discountPercent / 100)));
        } else {
          finalAmount = Math.max(0, +(baseAmount * (1 - discountPercent / 100)).toFixed(2));
        }
      }
    }

    const currency = gateway.currency;
    const toAddress = gateway.number || gateway.payId || gateway.address;

    // 5. Store Order in Database with 'pending' status
    const orderId = `ord_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO crypto_payments (
        id, user_id, plan, billing_cycle, amount, currency,
        txid, from_address, to_address, payment_method, sender_number,
        admin_notes, reviewed_at, reviewed_by, status, created_at,
        coupon_code, discount_percent, original_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 0, '', 'pending', ?, ?, ?, ?)
    `).run(
      orderId,
      userId,
      plan,
      billing_cycle,
      finalAmount,
      currency,
      cleanTxId,
      cleanSender,
      toAddress,
      payment_method,
      cleanSender,
      now,
      appliedCoupon?.code || '',
      discountPercent,
      originalAmount
    );

    // 6. If coupon used, increment count and log redemption
    if (appliedCoupon) {
      try {
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(appliedCoupon.id);
        const redId = `red_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
        db.prepare(`
          INSERT INTO coupon_redemptions (id, coupon_id, user_id, order_id, discount_percent, redeemed_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(redId, appliedCoupon.id, userId, orderId, discountPercent, now);
      } catch (cpnErr) {}
    }

    // 7. In-App Notification for User
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

    // 8. Rich Discord Alert to Configured Webhook
    try {
      const userRecord = db.prepare('SELECT username, email FROM accounts WHERE id = ?').get(userId);
      const discordWebhook = config.discordWebhook;
      
      if (discordWebhook && discordWebhook.startsWith('https://')) {
        const fields = [
          { name: 'Username', value: userRecord?.username || 'Unknown', inline: true },
          { name: 'Email', value: userRecord?.email || 'Unknown', inline: true },
          { name: 'Selected Plan', value: `${plan.toUpperCase()} (${billing_cycle})`, inline: true },
          { name: 'Gateway', value: `${gateway.name} (${gateway.accountType || ''})`, inline: true },
          { name: 'Final Amount', value: `**${currency === 'BDT' ? '৳' : '$'}${finalAmount} ${currency}**`, inline: true },
          { name: 'Sender Info', value: `\`${cleanSender}\``, inline: true },
          { name: 'Transaction ID', value: `\`${cleanTxId}\``, inline: false },
          { name: 'Order ID', value: `\`${orderId}\``, inline: true },
          { name: 'Status', value: '**PENDING ADMIN REVIEW**', inline: true }
        ];

        if (appliedCoupon) {
          fields.splice(5, 0, {
            name: 'Coupon Applied',
            value: `\`${appliedCoupon.code}\` (${discountPercent}% OFF) • Orig: ${currency === 'BDT' ? '৳' : '$'}${originalAmount}`,
            inline: false
          });
        }

        const payload = {
          username: 'Habit Auth Payment Alert',
          avatar_url: 'https://habitauth.com/assets/logo.png',
          embeds: [
            {
              title: `New Payment Order: ${gateway.name}`,
              description: `A user has submitted a new payment order awaiting admin review and plan release.`,
              color: 0xf59e0b,
              fields,
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
        amount: finalAmount,
        currency,
        payment_method,
        sender_number: cleanSender,
        txid: cleanTxId,
        coupon_code: appliedCoupon?.code || '',
        discount_percent: discountPercent,
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
        coupon_code, discount_percent, original_amount,
        status, admin_notes, created_at, reviewed_at
      FROM crypto_payments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    const formattedOrders = orders.map(ord => ({
      ...ord,
      amount_bdt: (ord.currency === 'BDT' || ord.currency === '৳') ? ord.amount : null,
      amount_usd: (ord.currency !== 'BDT' && ord.currency !== '৳') ? ord.amount : null
    }));

    return res.json({
      success: true,
      orders: formattedOrders
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
        a.role as current_role
      FROM crypto_payments cp
      LEFT JOIN accounts a ON cp.user_id = a.id
      ORDER BY cp.created_at DESC
    `).all();

    const formattedOrders = orders.map(ord => ({
      ...ord,
      amount_bdt: (ord.currency === 'BDT' || ord.currency === '৳') ? ord.amount : null,
      amount_usd: (ord.currency !== 'BDT' && ord.currency !== '৳') ? ord.amount : null
    }));

    return res.json({
      success: true,
      orders: formattedOrders
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
          'Subscription Activated!',
          `Your payment order (${order.txid}) for ${order.plan.toUpperCase()} Plan has been approved by admin! All premium developer features and hardware licenses are now unlocked.`,
          now
        );
      } catch (err) {}

      // 5. Discord Webhook Notification
      try {
        const { discordWebhook } = getDynamicGatewayConfig();
        if (discordWebhook && discordWebhook.startsWith('https://')) {
          fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'Habit Auth Payment Alert',
              avatar_url: 'https://habitauth.com/assets/logo.png',
              embeds: [{
                title: 'Payment Order APPROVED & Subscription Activated',
                description: `Admin **${adminUser.username}** approved order \`${id}\`. User has been upgraded to **${order.plan.toUpperCase()}** plan.`,
                color: 0x10b981,
                fields: [
                  { name: 'Order ID', value: `\`${id}\``, inline: true },
                  { name: 'Plan', value: `${order.plan.toUpperCase()} (${order.billing_cycle})`, inline: true },
                  { name: 'Gateway', value: `${order.payment_method.toUpperCase()}`, inline: true },
                  { name: 'Transaction ID', value: `\`${order.txid}\``, inline: false },
                  { name: 'Admin Notes', value: admin_notes || 'Approved & Released', inline: false }
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
          'Order Rejected',
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

// ─────────────────────────────────────────────────────────────
// ── COUPON MANAGEMENT CONTROLLERS (ADMIN) ────────────────────
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/coupons
 * Admin fetches all coupons with live status calculations
 */
export async function getAdminCoupons(req, res) {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const now = Math.floor(Date.now() / 1000);
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();

    const formatted = coupons.map(c => {
      const isExpired = c.expires_at > 0 && c.expires_at < now;
      const isMaxedOut = c.max_uses > 0 && c.used_count >= c.max_uses;
      const secondsLeft = c.expires_at > 0 ? Math.max(0, c.expires_at - now) : null;

      return {
        ...c,
        is_expired: isExpired,
        is_maxed_out: isMaxedOut,
        seconds_left: secondsLeft,
        status_label: !c.is_active ? 'Disabled' : isExpired ? 'Expired' : isMaxedOut ? 'Maxed Out' : 'Active'
      };
    });

    return res.json({
      success: true,
      coupons: formatted
    });
  } catch (err) {
    console.error('[Get Admin Coupons Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
}

/**
 * POST /api/v1/admin/coupons
 * Admin creates a new custom coupon code with custom timer (1s to 1 month)
 */
export async function createCoupon(req, res) {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { 
      code, 
      discount_percent, 
      duration_value = 0, 
      duration_unit = 'hours', 
      max_uses = 0 
    } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a coupon code.' });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 2) {
      return res.status(400).json({ success: false, message: 'Coupon code must be at least 2 characters.' });
    }

    const discount = parseInt(discount_percent, 10);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      return res.status(400).json({ success: false, message: 'Discount must be between 1% and 100%.' });
    }

    // Check duplicate code
    const existing = db.prepare('SELECT id FROM coupons WHERE UPPER(code) = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A coupon with this code already exists.' });
    }

    // Calculate expiration timer in seconds (supports 1s to 30 days)
    const val = parseInt(duration_value, 10) || 0;
    let multiplier = 1;
    if (duration_unit === 'minutes') multiplier = 60;
    else if (duration_unit === 'hours') multiplier = 3600;
    else if (duration_unit === 'days') multiplier = 86400;
    else if (duration_unit === 'months') multiplier = 30 * 86400;

    let durationSeconds = val * multiplier;
    // Cap at 31 days max
    if (durationSeconds > 31 * 86400) {
      durationSeconds = 31 * 86400;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = durationSeconds > 0 ? (now + durationSeconds) : 0;
    const couponId = `cpn_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

    db.prepare(`
      INSERT INTO coupons (
        id, code, discount_percent, expires_at, duration_seconds,
        max_uses, used_count, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?)
    `).run(
      couponId,
      cleanCode,
      discount,
      expiresAt,
      durationSeconds,
      parseInt(max_uses, 10) || 0,
      user.username || 'admin',
      now
    );

    return res.json({
      success: true,
      message: `Coupon ${cleanCode} created with ${discount}% discount!`,
      coupon: {
        id: couponId,
        code: cleanCode,
        discount_percent: discount,
        expires_at: expiresAt,
        duration_seconds: durationSeconds,
        max_uses: parseInt(max_uses, 10) || 0
      }
    });

  } catch (err) {
    console.error('[Create Coupon Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to create coupon.' });
  }
}

/**
 * DELETE /api/v1/admin/coupons/:id
 * Admin deletes or disables a coupon
 */
export async function deleteCoupon(req, res) {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { id } = req.params;
    db.prepare('DELETE FROM coupons WHERE id = ?').run(id);

    return res.json({
      success: true,
      message: 'Coupon deleted successfully.'
    });
  } catch (err) {
    console.error('[Delete Coupon Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
  }
}

// ─────────────────────────────────────────────────────────────
// ── PAYMENT SETTINGS & DISCORD WEBHOOK CONTROLLERS (ADMIN) ───
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/payment-settings
 * Admin fetches all editable prices, numbers, and webhook URL
 */
export async function getPaymentSettings(req, res) {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const config = getDynamicGatewayConfig();

    return res.json({
      success: true,
      settings: {
        price_dev_monthly_usd: config.prices.developer.monthly.usd,
        price_dev_monthly_bdt: config.prices.developer.monthly.bdt,
        price_dev_yearly_usd: config.prices.developer.yearly.usd,
        price_dev_yearly_bdt: config.prices.developer.yearly.bdt,
        price_pro_monthly_usd: config.prices.pro.monthly.usd,
        price_pro_monthly_bdt: config.prices.pro.monthly.bdt,
        price_pro_yearly_usd: config.prices.pro.yearly.usd,
        price_pro_yearly_bdt: config.prices.pro.yearly.bdt,
        bkash_number: config.gateways.bkash.number,
        rocket_number: config.gateways.rocket.number,
        nagad_number: config.gateways.nagad.number,
        binance_pay_id: config.gateways.binance_pay.payId,
        trc20_address: config.gateways.trc20.address,
        discord_webhook_url: config.discordWebhook
      }
    });
  } catch (err) {
    console.error('[Get Payment Settings Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment settings.' });
  }
}

/**
 * PUT /api/v1/admin/payment-settings
 * Admin updates pricing, gateway numbers, and Discord webhook URL
 */
export async function updatePaymentSettings(req, res) {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const {
      price_dev_monthly_usd,
      price_dev_monthly_bdt,
      price_dev_yearly_usd,
      price_dev_yearly_bdt,
      price_pro_monthly_usd,
      price_pro_monthly_bdt,
      price_pro_yearly_usd,
      price_pro_yearly_bdt,
      bkash_number,
      rocket_number,
      nagad_number,
      binance_pay_id,
      trc20_address,
      discord_webhook_url
    } = req.body;

    const now = Math.floor(Date.now() / 1000);
    const setSetting = (key, val) => {
      if (val !== undefined && val !== null) {
        db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)').run(key, String(val).trim(), now);
      }
    };

    setSetting('payment_price_dev_monthly_usd', price_dev_monthly_usd);
    setSetting('payment_price_dev_monthly_bdt', price_dev_monthly_bdt);
    setSetting('payment_price_dev_yearly_usd', price_dev_yearly_usd);
    setSetting('payment_price_dev_yearly_bdt', price_dev_yearly_bdt);
    setSetting('payment_price_pro_monthly_usd', price_pro_monthly_usd);
    setSetting('payment_price_pro_monthly_bdt', price_pro_monthly_bdt);
    setSetting('payment_price_pro_yearly_usd', price_pro_yearly_usd);
    setSetting('payment_price_pro_yearly_bdt', price_pro_yearly_bdt);

    setSetting('payment_bkash_number', bkash_number);
    setSetting('payment_rocket_number', rocket_number);
    setSetting('payment_nagad_number', nagad_number);
    setSetting('payment_binance_pay_id', binance_pay_id);
    setSetting('payment_trc20_address', trc20_address);

    if (discord_webhook_url !== undefined) {
      setSetting('payment_discord_webhook', discord_webhook_url);
    }

    return res.json({
      success: true,
      message: 'Payment settings and live prices updated successfully!'
    });

  } catch (err) {
    console.error('[Update Payment Settings Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update payment settings.' });
  }
}

/**
 * POST /api/v1/admin/test-webhook
 * Sends a test ping to the configured Discord webhook URL
 */
export async function testDiscordWebhook(req, res) {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { webhook_url } = req.body;
    const targetUrl = webhook_url || getDynamicGatewayConfig().discordWebhook;

    if (!targetUrl || !targetUrl.startsWith('https://')) {
      return res.status(400).json({ success: false, message: 'Invalid Discord Webhook URL.' });
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Habit Auth Billing Test',
        avatar_url: 'https://habitauth.com/assets/logo.png',
        embeds: [{
          title: 'Discord Webhook Test Successful',
          description: `Test alert triggered by admin **${user.username}**. Your payment notification webhook is active and functioning properly!`,
          color: 0x38bdf8,
          timestamp: new Date().toISOString()
        }]
      })
    });

    if (response.ok || response.status === 204) {
      return res.json({ success: true, message: 'Test message sent to Discord successfully!' });
    } else {
      return res.status(400).json({ success: false, message: `Discord returned HTTP ${response.status}. Check the webhook URL.` });
    }

  } catch (err) {
    console.error('[Test Webhook Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to reach Discord webhook: ' + err.message });
  }
}
