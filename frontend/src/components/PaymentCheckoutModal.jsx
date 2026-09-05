import React, { useState, useEffect } from 'react';
import { 
  X, Check, Copy, Shield, Zap, Sparkles, ExternalLink, 
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw, QrCode, Wallet,
  PhoneCall, Clock, FileText, Smartphone, Tag
} from 'lucide-react';

export default function PaymentCheckoutModal({ 
  isOpen, 
  onClose, 
  selectedPlan, 
  user, 
  onOpenLogin,
  onNavigateToOrders
}) {
  if (!isOpen) return null;

  // Selected payment gateway tab: 'bkash' | 'rocket' | 'nagad' | 'binance_pay' | 'trc20'
  const [activeTab, setActiveTab] = useState('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [txId, setTxId] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState(null);

  // Dynamic config from backend
  const [dynamicConfig, setDynamicConfig] = useState(null);

  // Coupon Engine state
  const [couponInput, setCouponInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const planName = selectedPlan?.name || 'Developer';
  const planId = selectedPlan?.id || 'developer';
  const billingCycle = selectedPlan?.billingCycle || 'monthly';
  const isYearly = billingCycle === 'yearly';
  const isPro = planId === 'pro';

  // Load latest live pricing and gateway details on mount
  useEffect(() => {
    fetch('/api/v1/payment/config')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.config) {
          setDynamicConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  // Base pricing (dynamic or default)
  const defaultBdt = isPro ? (isYearly ? 4000 : 400) : (isYearly ? 1500 : 150);
  const defaultUsd = isPro ? (isYearly ? 32.00 : 3.20) : (isYearly ? 12.00 : 1.20);

  const baseBdtPrice = dynamicConfig?.prices?.[planId]?.[billingCycle]?.bdt || defaultBdt;
  const baseUsdPrice = dynamicConfig?.prices?.[planId]?.[billingCycle]?.usd || defaultUsd;

  // Apply discount if coupon is active
  const bdtPrice = appliedCoupon ? appliedCoupon.discounted_bdt : baseBdtPrice;
  const usdPrice = appliedCoupon ? appliedCoupon.discounted_usd : (+baseUsdPrice).toFixed(2);

  // Dynamic gateway details (fallbacks ensure zero downtime)
  const bkashNumber = dynamicConfig?.gateways?.bkash?.number || '01939336831';
  const rocketNumber = dynamicConfig?.gateways?.rocket?.number || '01939336831';
  const nagadNumber = dynamicConfig?.gateways?.nagad?.number || '01925188754';
  const binancePayId = dynamicConfig?.gateways?.binance_pay?.payId || '1025707697';
  const trc20Address = dynamicConfig?.gateways?.trc20?.address || 'TFtpThLcVSbR6KKEExWg2UiWibUvFc1AG3';

  // Gateways configuration
  const gateways = {
    bkash: {
      id: 'bkash',
      name: 'bKash',
      badge: 'Send Money',
      brandColor: '#e2136e',
      recipient: bkashNumber,
      recipientType: 'Personal',
      priceDisplay: `৳${bdtPrice} BDT`,
      currency: 'BDT',
      senderLabel: 'Your bKash Mobile Number',
      senderPlaceholder: '01XXXXXXXXX',
      txIdLabel: 'bKash Transaction ID (TrxID)',
      txIdPlaceholder: 'e.g. BLA76GH12',
      instructions: [
        'bKash অ্যাপ ওপেন করুন অথবা *247# ডায়াল করুন।',
        `Send Money অপশনে গিয়ে প্রাপক নম্বরে দিন: ${bkashNumber} (Personal)`,
        `অ্যামাউন্ট দিন ঠিক: ৳${bdtPrice} টাকা।`,
        'ট্রানজেকশন সফল হওয়ার পর SMS বা অ্যাপ থেকে TrxID কপি করে নিচে দিন।'
      ]
    },
    rocket: {
      id: 'rocket',
      name: 'Rocket',
      badge: 'Send Money',
      brandColor: '#8c3494',
      recipient: rocketNumber,
      recipientType: 'Personal',
      priceDisplay: `৳${bdtPrice} BDT`,
      currency: 'BDT',
      senderLabel: 'Your Rocket Mobile Number',
      senderPlaceholder: '01XXXXXXXXX',
      txIdLabel: 'Rocket Transaction ID (TrxID)',
      txIdPlaceholder: 'e.g. 9H5J76KD8',
      instructions: [
        'Rocket অ্যাপ ওপেন করুন অথবা *322# ডায়াল করুন।',
        `Send Money সিলেক্ট করে নম্বর দিন: ${rocketNumber} (Personal)`,
        `সঠিক অ্যামাউন্ট দিন: ৳${bdtPrice} টাকা।`,
        'ট্রানজেকশন সফল হলে ফিরতি মেসেজের TrxID কপি করে নিচে পেস্ট করুন।'
      ]
    },
    nagad: {
      id: 'nagad',
      name: 'Nagad',
      badge: 'Send Money',
      brandColor: '#f7941d',
      recipient: nagadNumber,
      recipientType: 'Personal',
      priceDisplay: `৳${bdtPrice} BDT`,
      currency: 'BDT',
      senderLabel: 'Your Nagad Mobile Number',
      senderPlaceholder: '01XXXXXXXXX',
      txIdLabel: 'Nagad Transaction ID (TrxID)',
      txIdPlaceholder: 'e.g. 78GH92FA',
      instructions: [
        'Nagad অ্যাপ অথবা *167# এ প্রবেশ করুন।',
        `Send Money অপশনে গিয়ে নম্বর দিন: ${nagadNumber} (Personal)`,
        `সঠিক অ্যামাউন্ট দিন: ৳${bdtPrice} টাকা।`,
        'সেন্ড মানি সম্পন্ন হলে ৮ সংখ্যার TrxID নিচে লিখুন।'
      ]
    },
    binance_pay: {
      id: 'binance_pay',
      name: 'Binance Pay',
      badge: '0 Fee',
      brandColor: '#f59e0b',
      recipient: binancePayId,
      recipientType: 'Binance Pay ID',
      priceDisplay: `$${usdPrice} USDT`,
      currency: 'USDT',
      senderLabel: 'Your Binance Pay ID / Nickname / Email',
      senderPlaceholder: 'e.g. 987654321 or your@email.com',
      txIdLabel: 'Binance Pay Order ID / Transaction ID',
      txIdPlaceholder: 'e.g. 238910293810293',
      instructions: [
        'Open Binance App on your phone and tap Pay.',
        `Tap Send > Enter Binance Pay ID: ${binancePayId}`,
        `Enter exact amount: $${usdPrice} USDT and confirm transfer (0 transaction fee).`,
        'Copy the Order ID / Pay ID from transaction details and paste below.'
      ]
    },
    trc20: {
      id: 'trc20',
      name: 'TRON (TRC20)',
      badge: 'USDT / TRX',
      brandColor: '#06b6d4',
      recipient: trc20Address,
      recipientType: 'TRON TRC20 Wallet',
      priceDisplay: `$${usdPrice} USDT`,
      currency: 'USDT',
      senderLabel: 'Your Sender Wallet Address',
      senderPlaceholder: 'e.g. T...',
      txIdLabel: 'Blockchain Transaction Hash (TxID)',
      txIdPlaceholder: '64-character transaction hash...',
      instructions: [
        'Send USDT (TRC-20) or TRX from Binance, Trust Wallet, TronLink, or any Web3 wallet.',
        `Recipient Address: ${trc20Address}`,
        `Send: $${usdPrice} USDT (or equivalent TRX).`,
        'Once confirmed on TronScan, copy the 64-char TxID and paste below.'
      ]
    }
  };

  const currentGateway = gateways[activeTab];

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setValidatingCoupon(true);
    try {
      const res = await fetch('/api/v1/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          plan: planId,
          billing_cycle: billingCycle
        })
      });
      const data = await res.json();
      if (data.success && data.valid) {
        setAppliedCoupon(data);
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || 'Invalid or expired coupon code.');
      }
    } catch (err) {
      setCouponError('Network error validating coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in or create an account first.');
      return;
    }

    if (!senderNumber.trim()) {
      setError(`Please enter ${currentGateway.senderLabel}.`);
      return;
    }

    if (!txId.trim()) {
      setError(`Please enter ${currentGateway.txIdLabel}.`);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('habit_token');
      const res = await fetch('/api/v1/payment/submit-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: planId,
          billing_cycle: billingCycle,
          payment_method: activeTab,
          sender_number: senderNumber.trim(),
          txid: txId.trim(),
          coupon_code: appliedCoupon ? appliedCoupon.code : undefined
        })
      });

      const data = await res.json();

      if (data.success) {
        setSubmittedOrder(data.order);
      } else {
        setError(data.message || 'Failed to submit payment order. Please check your transaction details.');
      }
    } catch (err) {
      setError('Network error connecting to payment server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay animate-scale-in" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 12, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 1100
    }}>
      <div style={{
        background: '#0a0d14',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 40px rgba(56, 189, 248, 0.12)',
        position: 'relative',
        padding: '28px',
        color: '#f8fafc'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <X size={17} />
        </button>

        {/* ── CASE 1: ORDER SUBMITTED CONFIRMATION SCREEN ── */}
        {submittedOrder ? (
          <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '2px solid rgba(245, 158, 11, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#f59e0b',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)'
            }}>
              <Clock size={38} className="animate-pulse" />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px', color: '#ffffff' }}>
              Payment Order Submitted!
            </h3>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '999px',
              padding: '4px 14px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#f59e0b',
              marginBottom: '18px'
            }}>
              <Clock size={13} /> PENDING ADMIN REVIEW
            </div>

            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '22px' }}>
              আপনার পেমেন্ট রিকোয়েস্ট অ্যাডমিন টিমের কাছে জমা হয়েছে। স্টেটমেন্ট ভেরিফাই করে অ্যাডমিন রিলিজ করলেই আপনার <strong>{planName} Plan</strong> সক্রিয় হয়ে যাবে (সাধারণত ৫ থেকে ১৫ মিনিটের মধ্যে)।
            </p>

            {/* Order Receipt Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '24px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Order ID:</span>
                <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>{submittedOrder.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Selected Plan:</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{planName} ({billingCycle})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Method:</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{currentGateway.name}</span>
              </div>

              {submittedOrder.coupon_code && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#10b981' }}>Applied Coupon:</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>
                    {submittedOrder.coupon_code} ({submittedOrder.discount_percent}% OFF)
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Amount Paid:</span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>
                  {submittedOrder.currency === 'BDT' ? `৳${submittedOrder.amount}` : `$${submittedOrder.amount}`} {submittedOrder.currency}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>TrxID / TxID:</span>
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: 'monospace' }}>{submittedOrder.txid}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  onClose();
                  if (onNavigateToOrders) {
                    onNavigateToOrders();
                  } else {
                    window.location.href = '/orders';
                  }
                }}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)'
                }}
              >
                Track in Orders Tab &rarr;
              </button>

              <button
                onClick={onClose}
                style={{
                  padding: '13px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ── CASE 2: ACTIVE PAYMENT SELECTION & CHECKOUT ── */
          <>
            {/* Modal Header */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '5px',
                  borderRadius: '8px',
                  color: '#38bdf8'
                }}>
                  <Shield size={16} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Checkout: {planName} Plan
                </h2>
              </div>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
                Instant deposit • Zero KYC • 5 Payment Gateways • Promo Code Supported
              </p>
            </div>

            {/* If user is NOT logged in: Prompt sign in */}
            {!user ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ color: '#ef4444', marginBottom: '12px' }}>
                  <AlertCircle size={36} style={{ margin: '0 auto' }} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                  Sign In Required to Purchase
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '18px' }}>
                  পেমেন্ট সম্পন্ন করার জন্য আপনাকে প্রথমে একটি একাউন্টে লগইন থাকতে হবে, যাতে আপনার সাবস্ক্রিপশনটি নিরাপদভাবে যুক্ত হতে পারে।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenLogin) onOpenLogin('signin');
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '999px',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)'
                  }}
                >
                  Sign In / Create Account &rarr;
                </button>
              </div>
            ) : (
              <>
                {/* Plan Summary Banner with Dynamic Pricing & Strikethrough Discount */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>
                      Selected Plan ({billingCycle})
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
                      {planName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {appliedCoupon ? (
                      <div>
                        <span style={{
                          fontSize: '13px',
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                          marginRight: '8px'
                        }}>
                          {currentGateway.currency === 'BDT' ? `৳${baseBdtPrice}` : `$${baseUsdPrice}`}
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>
                          {currentGateway.priceDisplay}
                        </span>
                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800 }}>
                          🔥 {appliedCoupon.discount_percent}% DISCOUNT APPLIED
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>
                          {currentGateway.priceDisplay}
                        </span>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {currentGateway.currency === 'BDT' ? `≈ $${usdPrice} USD` : `≈ ৳${bdtPrice} BDT`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PROMO / COUPON CODE BOX */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '16px'
                }}>
                  {appliedCoupon ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={16} color="#10b981" />
                        <div>
                          <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#10b981' }}>
                            Coupon Applied: {appliedCoupon.code}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                            ({appliedCoupon.discount_percent}% OFF)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <Tag size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              setCouponError('');
                            }}
                            placeholder="Promo / Coupon Code (e.g. SUMMER50)"
                            style={{
                              width: '100%',
                              padding: '8px 10px 8px 32px',
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '8px',
                              color: '#ffffff',
                              fontSize: '12px',
                              textTransform: 'uppercase',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponInput.trim()}
                          style={{
                            padding: '8px 16px',
                            background: validatingCoupon || !couponInput.trim() ? 'rgba(255, 255, 255, 0.08)' : '#2563eb',
                            color: validatingCoupon || !couponInput.trim() ? '#64748b' : '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: validatingCoupon || !couponInput.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {validatingCoupon ? <RefreshCw size={13} className="spinner-loader" /> : <Sparkles size={13} />}
                          <span>Apply</span>
                        </button>
                      </div>
                      {couponError && (
                        <div style={{ fontSize: '11px', color: '#f87171', marginTop: '6px' }}>
                          {couponError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5-GATEWAY TAB SELECTOR */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '5px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '16px'
                }}>
                  {Object.values(gateways).map((gw) => {
                    const isSelected = activeTab === gw.id;
                    return (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(gw.id);
                          setError('');
                        }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                          color: isSelected ? '#ffffff' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          border: isSelected ? `1px solid ${gw.brandColor}` : '1px solid transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ color: gw.brandColor, fontWeight: 900 }}>{gw.name}</span>
                        <span style={{ fontSize: '9px', opacity: 0.7 }}>{gw.badge}</span>
                      </button>
                    );
                  })}
                </div>

                {/* GATEWAY PAYMENT CARD */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${currentGateway.brandColor}33`,
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                      Send Money to ({currentGateway.recipientType}):
                    </span>
                    <span style={{ fontSize: '11px', color: currentGateway.brandColor, fontWeight: 800, textTransform: 'uppercase' }}>
                      {currentGateway.badge}
                    </span>
                  </div>

                  {/* Recipient Address / Number with Copy Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginBottom: '14px'
                  }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: currentGateway.recipient.length > 20 ? '12px' : '16px',
                      fontWeight: 800,
                      color: '#ffffff',
                      wordBreak: 'break-all'
                    }}>
                      {currentGateway.recipient}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(currentGateway.recipient, 'recipient')}
                      style={{
                        background: copiedField === 'recipient' ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                        marginLeft: '10px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {copiedField === 'recipient' ? (
                        <>
                          <Check size={13} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Optional TRON QR Code */}
                  {activeTab === 'trc20' && (
                    <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                      <img 
                        src="/binance-qr.png" 
                        alt="TRON QR Code"
                        style={{
                          width: '130px',
                          height: '130px',
                          borderRadius: '12px',
                          border: '2px solid rgba(6, 182, 212, 0.4)',
                          padding: '4px',
                          background: '#fff'
                        }}
                      />
                    </div>
                  )}

                  {/* Step Instructions */}
                  <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>Instructions:</div>
                    <ol style={{ paddingLeft: '18px', margin: 0 }}>
                      {currentGateway.instructions.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: '3px' }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    color: '#f87171',
                    fontSize: '12.5px'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* SUBMISSION FORM */}
                <form onSubmit={handleSubmitOrder}>
                  {/* Field 1: Sender Info */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#cbd5e1',
                      marginBottom: '6px'
                    }}>
                      {currentGateway.senderLabel} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder={currentGateway.senderPlaceholder}
                      required
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = currentGateway.brandColor}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                    />
                  </div>

                  {/* Field 2: TrxID */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#cbd5e1',
                      marginBottom: '6px'
                    }}>
                      {currentGateway.txIdLabel} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      placeholder={currentGateway.txIdPlaceholder}
                      required
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = currentGateway.brandColor}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                    />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Anti-fraud protected: Every TrxID is uniquely verified. Multi-account reuse is strictly blocked.
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !senderNumber.trim() || !txId.trim()}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '12px',
                      background: submitting || !senderNumber.trim() || !txId.trim()
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: submitting || !senderNumber.trim() || !txId.trim() ? '#64748b' : '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: submitting || !senderNumber.trim() || !txId.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: submitting || !senderNumber.trim() || !txId.trim() ? 'none' : '0 6px 20px rgba(37, 99, 235, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={16} className="spinner-loader" />
                        <span>Submitting Order...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Submit Payment Order (Pending Review)</span>
                      </>
                    )}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Orders are verified by admin within 5-15 mins. Track in your{' '}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onNavigateToOrders) onNavigateToOrders();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#38bdf8',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      Dashboard Orders
                    </button>
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
