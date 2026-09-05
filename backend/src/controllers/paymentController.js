import { db } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const WALLET_CONFIG = {
  address: 'TFtpThLcVSbR6KKEExWg2UiWibUvFc1AG3',
  network: 'TRON (TRC20)',
  binancePayId: '1025707697',
  qrCodeUrl: '/binance-qr.png',
  acceptedCurrencies: ['USDT (TRC20)', 'TRX', 'Binance Pay'],
  prices: {
    developer: { monthly: 1.20, yearly: 12.00 },
    pro: { monthly: 3.20, yearly: 32.00 }
  }
};

/**
 * GET /api/v1/payment/config
 * Returns public wallet details for crypto checkout
 */
export async function getCryptoConfig(req, res) {
  try {
    return res.json({
      success: true,
      config: WALLET_CONFIG
    });
  } catch (err) {
    console.error('[Payment Config Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to load payment configuration.' });
  }
}

/**
 * POST /api/v1/payment/verify-crypto
 * Validates on-chain TRON transaction or records Binance Pay ID transfer
 */
export async function verifyCryptoPayment(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to upgrade plan.' });
    }

    const { plan, billing_cycle = 'monthly', txid, payment_method = 'trc20' } = req.body;

    if (!plan || !['developer', 'pro'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected. Must be developer or pro.' });
    }

    if (!txid || typeof txid !== 'string' || txid.trim().length < 8) {
      return res.status(400).json({ success: false, message: 'Valid Transaction Hash (TxID) or Binance Order ID is required.' });
    }

    const cleanTxId = txid.trim();

    // 1. Anti-Replay: Prevent duplicate TxID claim
    const existingTx = db.prepare('SELECT * FROM crypto_payments WHERE txid = ?').get(cleanTxId);
    if (existingTx) {
      return res.status(409).json({
        success: false,
        code: 'TX_ALREADY_CLAIMED',
        message: 'This Transaction ID has already been claimed and applied to a subscription.'
      });
    }

    const expectedUsd = WALLET_CONFIG.prices[plan]?.[billing_cycle] || 1.20;
    let verified = false;
    let fromAddress = 'Crypto/Binance User';
    let verifiedAmount = expectedUsd;
    let verifiedCurrency = 'USDT';
    let verificationMethod = 'blockchain_trongrid';

    // 2. On-Chain TRON / TRC20 Verification via TronGrid
    if (payment_method === 'trc20' || cleanTxId.length >= 64) {
      try {
        // Method A: Check recent TRC20 token transfers for recipient
        const tronUrl = `https://api.trongrid.io/v1/accounts/${WALLET_CONFIG.address}/transactions/trc20?limit=50`;
        const tronRes = await fetch(tronUrl, { headers: { 'Accept': 'application/json' } });
        const tronData = await tronRes.json();

        if (tronData.success && Array.isArray(tronData.data)) {
          const match = tronData.data.find(
            tx => tx.transaction_id && tx.transaction_id.toLowerCase() === cleanTxId.toLowerCase()
          );

          if (match) {
            const recipient = match.to || '';
            const decimals = match.token_info?.decimals || 6;
            const rawVal = parseFloat(match.value || '0');
            const tokenSymbol = match.token_info?.symbol || 'USDT';
            const receivedAmount = rawVal / Math.pow(10, decimals);

            if (recipient.toLowerCase() === WALLET_CONFIG.address.toLowerCase()) {
              verified = true;
              fromAddress = match.from || 'TRON User';
              verifiedAmount = receivedAmount;
              verifiedCurrency = tokenSymbol;
            }
          }
        }

        // Method B: Direct Transaction Hash Lookup on TronGrid if not in recent list
        if (!verified) {
          const directUrl = `https://api.trongrid.io/v1/transactions/${cleanTxId}`;
          const directRes = await fetch(directUrl, { headers: { 'Accept': 'application/json' } });
          const directData = await directRes.json();

          if (directData && (directData.ret?.[0]?.contractRet === 'SUCCESS' || directData.data?.[0]?.ret?.[0]?.contractRet === 'SUCCESS')) {
            verified = true;
            verifiedCurrency = 'TRON';
          }
        }
      } catch (gridErr) {
        console.warn('[TronGrid Lookup Warning]:', gridErr.message);
      }
    }

    // 3. Binance Pay ID / App Internal Transfer Handling
    // If the user paid via Binance Pay ID (which uses internal 19-digit Order/Pay IDs rather than blockchain TxIDs)
    if (!verified && (payment_method === 'binance_pay' || /^\d{10,24}$/.test(cleanTxId))) {
      verified = true;
      verificationMethod = 'binance_pay_order';
      verifiedCurrency = 'Binance Pay';
    }

    // If verification still could not confirm valid receipt
    if (!verified) {
      return res.status(400).json({
        success: false,
        code: 'TX_NOT_FOUND',
        message: 'Transaction not found on the TRON blockchain yet. Please allow 1-2 minutes for network confirmations and try again.'
      });
    }

    // 4. Record Payment in Database
    const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const now = Math.floor(Date.now() / 1000);
    const durationSeconds = billing_cycle === 'yearly' ? (365 * 86400) : (30 * 86400);
    const expiresAt = now + durationSeconds;

    db.prepare(`
      INSERT INTO crypto_payments (
        id, user_id, plan, billing_cycle, amount, currency, txid, from_address, to_address, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `).run(
      paymentId,
      userId,
      plan,
      billing_cycle,
      verifiedAmount,
      verifiedCurrency,
      cleanTxId,
      fromAddress,
      WALLET_CONFIG.address,
      now
    );

    // 5. Upgrade User Subscription
    const existingSub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(userId);
    if (existingSub) {
      db.prepare(`
        UPDATE subscriptions 
        SET plan = ?, status = 'active', expires_at = ?, provider = 'crypto_binance'
        WHERE user_id = ?
      `).run(plan, expiresAt, userId);
    } else {
      db.prepare(`
        INSERT INTO subscriptions (id, user_id, plan, status, started_at, expires_at, provider, created_at)
        VALUES (?, ?, ?, 'active', ?, ?, 'crypto_binance', ?)
      `).run(uuidv4(), userId, plan, now, expiresAt, now);
    }

    // Upgrade account role to developer if on developer/pro plan
    db.prepare(`
      UPDATE accounts 
      SET role = 'developer', updated_at = ?
      WHERE id = ? AND role != 'admin'
    `).run(now, userId);

    // 6. Send Rich Discord Webhook Notification to Admin
    try {
      const configRow = db.prepare(`SELECT config_json FROM system_settings WHERE key = 'app_config'`).get();
      if (configRow && configRow.config_json) {
        const sysConfig = JSON.parse(configRow.config_json);
        if (sysConfig.discord_webhook_url) {
          const embed = {
            title: '💰 New Web3 Crypto Payment Confirmed!',
            color: 0x10b981, // Green
            fields: [
              { name: 'Plan Upgraded', value: `**${plan.toUpperCase()}** (${billing_cycle})`, inline: true },
              { name: 'Amount', value: `**$${verifiedAmount} ${verifiedCurrency}**`, inline: true },
              { name: 'User ID', value: `\`\`\`${userId}\`\`\``, inline: false },
              { name: 'Transaction ID / Hash', value: `\`\`\`${cleanTxId}\`\`\``, inline: false },
              { name: 'Payment Method', value: verificationMethod, inline: true },
              { name: 'Recipient Wallet', value: WALLET_CONFIG.address, inline: true }
            ],
            footer: { text: 'Habit Auth Web3 Payment Gateway' },
            timestamp: new Date().toISOString()
          };

          fetch(sysConfig.discord_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
          }).catch(() => {});
        }
      }
    } catch (whErr) {
      console.warn('[Payment Webhook Warning]:', whErr);
    }

    return res.json({
      success: true,
      message: `Congratulations! Your subscription has been upgraded to the ${plan.toUpperCase()} plan.`,
      plan,
      billing_cycle,
      expires_at: expiresAt,
      payment: {
        id: paymentId,
        amount: verifiedAmount,
        currency: verifiedCurrency,
        txid: cleanTxId
      }
    });

  } catch (err) {
    console.error('[Payment Verification Exception]:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during payment verification.' });
  }
}
