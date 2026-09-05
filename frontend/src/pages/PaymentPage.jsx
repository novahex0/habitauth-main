import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, X, Headphones, Info, AlignLeft, Copy, Check, ShieldCheck, 
  Tag, AlertCircle, CheckCircle2, Clock, Zap, ExternalLink, RefreshCw, QrCode, Phone, Mail, MessageCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PaymentPage() {
  const { currentLang, language, setLanguage } = useLanguage();
  const lang = currentLang || language || 'bn';
  
  // Extract sessionId from path e.g. /payment/:sessionId
  const [sessionId, setSessionId] = useState(() => {
    const parts = window.location.pathname.split('/');
    const idx = parts.indexOf('payment');
    return idx !== -1 && parts[idx + 1] ? parts[idx + 1] : '';
  });

  const urlParams = new URLSearchParams(window.location.search);
  const initialMethod = urlParams.get('method') === 'international' ? 'international' : 'mobile_banking';
  const initialGateway = urlParams.get('gateway') || '';

  // Step 1: 'select_gateway' | Step 2: 'enter_transaction'
  const [currentStep, setCurrentStep] = useState(initialGateway ? 'enter_transaction' : 'select_gateway');
  const [activeTab, setActiveTab] = useState(initialMethod);
  const [selectedGatewayId, setSelectedGatewayId] = useState(initialGateway || 'bkash');

  const [sessionData, setSessionData] = useState(null);
  const [gateways, setGateways] = useState({});
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  // Form inputs
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState(3);
  const [activeInfoModal, setActiveInfoModal] = useState(null); // null | 'support' | 'info' | 'details' | 'qr'
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sync URL query params with current state
  const updateUrl = (method, gateway) => {
    const url = new URL(window.location);
    url.searchParams.set('method', method);
    if (gateway) {
      url.searchParams.set('gateway', gateway);
      url.searchParams.set('accountType', 'personal');
    } else {
      url.searchParams.delete('gateway');
      url.searchParams.delete('accountType');
    }
    window.history.pushState({}, '', url);
  };

  // Tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const defGateway = newTab === 'mobile_banking' ? 'bkash' : 'binance_pay';
    setSelectedGatewayId(defGateway);
    updateUrl(newTab, currentStep === 'enter_transaction' ? defGateway : null);
  };

  // Select gateway and advance to Step 2
  const handleSelectGatewayAndProceed = (gwId) => {
    setSelectedGatewayId(gwId);
    setCurrentStep('enter_transaction');
    updateUrl(activeTab, gwId);
  };

  // Back button to Step 1
  const handleBackToSelection = () => {
    setCurrentStep('select_gateway');
    updateUrl(activeTab, null);
  };

  // Cancel modal handler
  const handleTriggerCancel = () => {
    setShowCancelModal(true);
    setCancelCountdown(3);
  };

  useEffect(() => {
    let timer;
    if (showCancelModal) {
      if (cancelCountdown > 0) {
        timer = setTimeout(() => setCancelCountdown(prev => prev - 1), 1000);
      } else {
        if (window.opener) {
          window.close();
        } else {
          window.location.href = '/overview';
        }
      }
    }
    return () => clearTimeout(timer);
  }, [showCancelModal, cancelCountdown]);

  // Load session from backend
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!sessionId) {
        setSessionError('Invalid payment link. No session ID provided.');
        setLoadingSession(false);
        return;
      }

      try {
        const res = await fetch(`/api/v1/payment/session/${sessionId}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.success && data.session) {
          setSessionData(data.session);
          setGateways(data.gateways || {});
        } else {
          // Fallback from localStorage
          try {
            const fallback = localStorage.getItem('habit_payment_session_' + sessionId);
            if (fallback) {
              const parsed = JSON.parse(fallback);
              setSessionData(parsed);
              const cfgRes = await fetch('/api/v1/payment/config');
              const cfgData = await cfgRes.json();
              if (cfgData.success) {
                setGateways(cfgData.config?.gateways || {});
              }
              setLoadingSession(false);
              return;
            }
          } catch (e) {}

          setSessionError(data.message || 'Payment session has expired or is invalid.');
        }
      } catch (err) {
        if (isMounted) setSessionError('Failed to connect to Habit Auth gateway.');
      } finally {
        if (isMounted) setLoadingSession(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [sessionId]);

  // Coupon validation
  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const res = await fetch('/api/v1/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          plan: sessionData?.plan || 'developer',
          billing_cycle: sessionData?.billing_cycle || 'monthly'
        })
      });

      const data = await res.json();
      const validCoupon = data.coupon || (data.valid || data.success ? data : null);
      if (data.success && validCoupon && (validCoupon.code || validCoupon.discount_percent)) {
        setAppliedCoupon(validCoupon);
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || 'Invalid or expired coupon code.');
      }
    } catch (err) {
      setCouponError('Network error while validating coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Submit payment order
  const handleSubmitPayment = async (e) => {
    if (e) e.preventDefault();
    setSubmitError('');

    const token = localStorage.getItem('habit_token');
    if (!token) {
      setSubmitError('Authentication required. Please sign in to verify transaction.');
      return;
    }

    if (!senderNumber.trim()) {
      setSubmitError(
        activeTab === 'mobile_banking'
          ? 'Please enter your sender mobile number.'
          : 'Please enter your Binance Pay ID or Sender Wallet Address.'
      );
      return;
    }

    if (!trxId.trim()) {
      setSubmitError('Please enter the Transaction ID (TrxID) from your SMS receipt.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/payment/submit-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: sessionData?.plan || 'developer',
          billing_cycle: sessionData?.billing_cycle || 'monthly',
          payment_method: selectedGatewayId,
          sender_number: senderNumber.trim(),
          txid: trxId.trim(),
          coupon_code: appliedCoupon ? appliedCoupon.code : ''
        })
      });

      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.order);
      } else {
        setSubmitError(data.message || 'Verification failed. Please check your TrxID.');
      }
    } catch (err) {
      setSubmitError('Network error while verifying transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  // Price calculations
  const isMobile = activeTab === 'mobile_banking';
  const currency = isMobile ? 'BDT' : 'USD';
  const basePrice = isMobile ? (sessionData?.amount_bdt || 150) : (sessionData?.amount_usd || 1.20);

  let finalPrice = basePrice;
  if (appliedCoupon && appliedCoupon.discount_percent) {
    const discount = (basePrice * appliedCoupon.discount_percent) / 100;
    finalPrice = isMobile ? Math.max(1, Math.round(basePrice - discount)) : Math.max(0.1, Number((basePrice - discount).toFixed(2)));
  }

  const activeGateway = gateways[selectedGatewayId] || {
    id: selectedGatewayId,
    name: selectedGatewayId.toUpperCase(),
    number: '01939336831',
    instructions: 'Send money and paste the transaction TrxID below.'
  };

  // Color theme per gateway
  const gatewayTheme = {
    bkash: { primary: '#e2136e', bgTint: 'rgba(226, 19, 110, 0.06)', name: 'BKASH', code: '*247#' },
    nagad: { primary: '#f7941d', bgTint: 'rgba(247, 148, 29, 0.06)', name: 'NAGAD', code: '*167#' },
    rocket: { primary: '#8c3494', bgTint: 'rgba(140, 52, 148, 0.06)', name: 'ROCKET', code: '*322#' },
    binance_pay: { primary: '#d97706', bgTint: 'rgba(217, 119, 6, 0.06)', name: 'BINANCE PAY', code: 'Binance App' },
    trc20: { primary: '#0891b2', bgTint: 'rgba(8, 145, 178, 0.06)', name: 'TRON TRC20', code: 'TronLink / Trust' }
  }[selectedGatewayId] || { primary: '#004ecc', bgTint: 'rgba(0, 78, 204, 0.06)', name: 'PAYMENT', code: '' };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#0f172a'
    }}>

      {/* ── CANCEL MODAL (MATCHING SCREENSHOT 4/5) ── */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', padding: '36px 32px', textAlign: 'center',
            maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Red Circle with X */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <X size={32} color="#ef4444" strokeWidth={3} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
              Invoice Canceled
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
              Your request to cancel the invoice has been processed successfully.
            </p>

            {/* Progress Bar */}
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
              Redirecting in {cancelCountdown} seconds...
            </div>
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((3 - cancelCountdown) / 3) * 100}%`,
                background: '#ef4444',
                transition: 'width 1s linear'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CARD CONTAINER ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 45px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(226, 232, 240, 0.9)',
        width: '100%',
        maxWidth: '520px',
        padding: '28px 24px',
        position: 'relative'
      }}>

        {/* Top Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          {currentStep === 'enter_transaction' ? (
            <button
              type="button"
              onClick={handleBackToSelection}
              style={{
                background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#334155',
                padding: '7px 12px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: 700
              }}
              title={lang === 'bn' ? "পেমেন্ট মাধ্যম পরিবর্তন করুন" : "Change Payment Method"}
            >
              <ArrowLeft size={14} />
              <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
            </button>
          ) : (
            <div />
          )}

          {/* Top Right: English / Bangla Switcher + Cancel (X) Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '999px',
              padding: '2px'
            }}>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                style={{
                  border: 'none',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: lang === 'bn' ? '#004ecc' : 'transparent',
                  color: lang === 'bn' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                  border: 'none',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: lang === 'en' ? '#004ecc' : 'transparent',
                  color: lang === 'en' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={handleTriggerCancel}
              style={{
                background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#94a3b8',
                padding: '7px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title={lang === 'bn' ? "ইনভয়েস বাতিল করুন" : "Cancel Invoice"}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loadingSession && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <RefreshCw size={28} className="spinner-loader" style={{ margin: '0 auto 16px', color: '#004ecc' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>Connecting to Habit Auth Gateway...</div>
          </div>
        )}

        {!loadingSession && sessionError && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Session Unavailable</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>{sessionError}</p>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              style={{
                padding: '10px 24px', borderRadius: '10px', background: '#004ecc', color: '#fff',
                border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px'
              }}
            >
              Return to Pricing
            </button>
          </div>
        )}

        {/* Success Confirmation */}
        {!loadingSession && !sessionError && orderSuccess && (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
              border: '2px solid rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={36} color="#10b981" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>
              Payment Order Submitted!
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
              Your transaction has been securely logged and is awaiting admin verification. Once verified, your subscription will be activated automatically.
            </p>

            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px',
              padding: '16px', textAlign: 'left', marginBottom: '24px', fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Order ID</span>
                <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#004ecc' }}>{orderSuccess.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Plan</span>
                <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{orderSuccess.plan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Gateway</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{orderSuccess.payment_method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Transaction ID (TrxID)</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{orderSuccess.txid}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#d97706', fontSize: '11.5px' }}>
                  <Clock size={12} /> PENDING ADMIN APPROVAL
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = '/overview'; }}
              style={{
                width: '100%', padding: '13px', borderRadius: '10px', background: '#004ecc', color: '#fff',
                border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── STEP 1: GATEWAY SELECTION (SCREENSHOT 1 REFERENCE) ─── */}
        {/* ══════════════════════════════════════════════════════════ */}
        {!loadingSession && !sessionError && !orderSuccess && currentStep === 'select_gateway' && (
          <div>
            {/* Header with Circular Logo, Habit Auth, and Action Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #004ecc, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)', flexShrink: 0
              }}>
                <ShieldCheck size={28} color="#ffffff" />
              </div>

              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.3px', color: '#0f172a', textTransform: 'uppercase' }}>
                  HABIT AUTH
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveInfoModal(activeInfoModal === 'support' ? null : 'support')}
                    style={{
                      background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '999px',
                      padding: '3px 10px', fontSize: '11px', fontWeight: 700, color: '#475569',
                      display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                    }}
                  >
                    <Headphones size={11} />
                    <span>সাপোর্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveInfoModal(activeInfoModal === 'info' ? null : 'info')}
                    style={{
                      background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '999px',
                      padding: '3px 10px', fontSize: '11px', fontWeight: 700, color: '#475569',
                      display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                    }}
                  >
                    <Info size={11} />
                    <span>তথ্যাদি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveInfoModal(activeInfoModal === 'details' ? null : 'details')}
                    style={{
                      background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '999px',
                      padding: '3px 10px', fontSize: '11px', fontWeight: 700, color: '#475569',
                      display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                    }}
                  >
                    <AlignLeft size={11} />
                    <span>বিস্তারিত</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Support Modal Content */}
            {activeInfoModal === 'support' && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px',
                padding: '14px 16px', marginBottom: '18px', fontSize: '12.5px', color: '#166534'
              }}>
                <div style={{ fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Headphones size={14} /> Habit Auth Official Support:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <a
                    href="https://wa.me/8801939336831"
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 700, textDecoration: 'none' }}
                  >
                    <Phone size={13} /> WhatsApp: 01939336831
                  </a>
                  <a
                    href="mailto:habitauthentication@gmail.com"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 700, textDecoration: 'none' }}
                  >
                    <Mail size={13} /> Email: habitauthentication@gmail.com
                  </a>
                </div>
              </div>
            )}

            {activeInfoModal === 'info' && (
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                padding: '12px 16px', marginBottom: '18px', fontSize: '12.5px', color: '#334155'
              }}>
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>Selected Plan: {(sessionData?.plan || 'DEVELOPER').toUpperCase()}</div>
                <div>বিলিং চক্র: {sessionData?.billing_cycle === 'yearly' ? 'বার্ষিক বিলিং' : 'মাসিক বিলিং'}। পেমেন্ট সম্পন্ন করার পর এডমিন ভেরিফাই করে সাথে সাথে সাবস্ক্রিপশন একটিভ করে দেবে।</div>
              </div>
            )}

            {activeInfoModal === 'details' && (
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                padding: '12px 16px', marginBottom: '18px', fontSize: '12px', color: '#334155'
              }}>
                <div style={{ fontWeight: 800, marginBottom: '6px' }}>ফিচারসমূহ:</div>
                <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                  <li>১০০+ অ্যাপ্লিকেশন সাপোর্ট ও ১০,০০০ লাইসেন্স কি</li>
                  <li>ইনস্ট্যান্ট হার্ডওয়্যার (HWID) লক ও ১-ক্লিক রিসেট</li>
                  <li>২৪/৭ ডিসকর্ড স্বয়ংক্রিয় নোটিফিকেশন সিস্টেম</li>
                </ul>
              </div>
            )}

            {/* Pill Method Tabs: [ Mobile Banking ] [ International ] */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#e2e8f0',
              padding: '4px', borderRadius: '12px', marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => handleTabChange('mobile_banking')}
                style={{
                  padding: '10px 16px', borderRadius: '9px', border: 'none',
                  fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                  background: activeTab === 'mobile_banking' ? '#004ecc' : 'transparent',
                  color: activeTab === 'mobile_banking' ? '#ffffff' : '#334155',
                  boxShadow: activeTab === 'mobile_banking' ? '0 4px 12px rgba(0, 78, 204, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {lang === 'bn' ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking'}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('international')}
                style={{
                  padding: '10px 16px', borderRadius: '9px', border: 'none',
                  fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                  background: activeTab === 'international' ? '#004ecc' : 'transparent',
                  color: activeTab === 'international' ? '#ffffff' : '#334155',
                  boxShadow: activeTab === 'international' ? '0 4px 12px rgba(0, 78, 204, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {lang === 'bn' ? 'আন্তর্জাতিক' : 'International'}
              </button>
            </div>

            {/* Gateway Cards Grid with Pure White Logos */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: activeTab === 'mobile_banking' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {activeTab === 'mobile_banking' ? (
                <>
                  {/* bKash Card */}
                  <div
                    onClick={() => handleSelectGatewayAndProceed('bkash')}
                    style={{
                      border: selectedGatewayId === 'bkash' ? '2px solid #e2136e' : '1px solid #e2e8f0',
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '14px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                      <img
                        src="/gateways/bkash.png"
                        alt="bKash"
                        style={{ maxHeight: '34px', maxWidth: '85px', objectFit: 'contain', mixBlendMode: 'multiply' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>bKash Personal</div>
                  </div>

                  {/* Nagad Card */}
                  <div
                    onClick={() => handleSelectGatewayAndProceed('nagad')}
                    style={{
                      border: selectedGatewayId === 'nagad' ? '2px solid #f7941d' : '1px solid #e2e8f0',
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '14px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                      <img
                        src="/gateways/nagad.png"
                        alt="Nagad"
                        style={{ maxHeight: '34px', maxWidth: '85px', objectFit: 'contain', mixBlendMode: 'multiply' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Nagad Personal</div>
                  </div>

                  {/* Rocket Card */}
                  <div
                    onClick={() => handleSelectGatewayAndProceed('rocket')}
                    style={{
                      border: selectedGatewayId === 'rocket' ? '2px solid #8c3494' : '1px solid #e2e8f0',
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '14px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                      <img
                        src="/gateways/rocket.png"
                        alt="Rocket"
                        style={{ maxHeight: '34px', maxWidth: '85px', objectFit: 'contain', mixBlendMode: 'multiply' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Rocket Personal</div>
                  </div>
                </>
              ) : (
                <>
                  {/* Binance Pay Card */}
                  <div
                    onClick={() => handleSelectGatewayAndProceed('binance_pay')}
                    style={{
                      border: selectedGatewayId === 'binance_pay' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '14px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                      <img
                        src="/gateways/binance.svg"
                        alt="Binance Pay"
                        style={{ maxHeight: '32px', maxWidth: '32px' }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>Binance Pay</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Pay ID (0 Fee)</div>
                  </div>

                  {/* TRON TRC20 Card */}
                  <div
                    onClick={() => handleSelectGatewayAndProceed('trc20')}
                    style={{
                      border: selectedGatewayId === 'trc20' ? '2px solid #06b6d4' : '1px solid #e2e8f0',
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '14px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                      <img
                        src="/gateways/tron.svg"
                        alt="TRON"
                        style={{ maxHeight: '32px', maxWidth: '32px' }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>TRON TRC20</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>USDT / TRX</div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Proceed Action Button */}
            <button
              type="button"
              onClick={() => handleSelectGatewayAndProceed(selectedGatewayId)}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: '#dbeafe', color: '#1d4ed8', fontSize: '15px', fontWeight: 900,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.12)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#004ecc'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.color = '#1d4ed8'; }}
            >
              <span>{lang === 'bn' ? `পরবর্তী ধাপে যান (${finalPrice} ${currency})` : `Pay ${finalPrice} ${currency}`}</span>
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── STEP 2: PAYMENT VERIFICATION (SCREENSHOT 1 EXACT) ──── */}
        {/* ══════════════════════════════════════════════════════════ */}
        {!loadingSession && !sessionError && !orderSuccess && currentStep === 'enter_transaction' && (
          <div>
            {/* Top Brand & Invoice Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #004ecc, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <ShieldCheck size={20} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                    HABIT AUTH
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>INVOICE</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{sessionId.slice(0, 8)}...</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(sessionId, 'inv')}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {copiedKey === 'inv' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Amount Badge */}
              <div style={{
                fontSize: '18px', fontWeight: 900, color: '#0f172a',
                padding: '6px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0'
              }}>
                {currency === 'BDT' ? `৳ ${finalPrice}` : `$ ${finalPrice}`}
              </div>
            </div>

            {/* Selected Gateway Logo in Center with pure white background */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '56px', background: '#ffffff', borderRadius: '12px', marginBottom: '14px'
            }}>
              {selectedGatewayId === 'bkash' && (
                <img src="/gateways/bkash.png" alt="bKash" style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
              )}
              {selectedGatewayId === 'nagad' && (
                <img src="/gateways/nagad.png" alt="Nagad" style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
              )}
              {selectedGatewayId === 'rocket' && (
                <img src="/gateways/rocket.png" alt="Rocket" style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
              )}
              {selectedGatewayId === 'binance_pay' && (
                <img src="/gateways/binance.svg" alt="Binance" style={{ maxHeight: '40px', maxWidth: '40px' }} />
              )}
              {selectedGatewayId === 'trc20' && (
                <img src="/gateways/tron.svg" alt="TRON" style={{ maxHeight: '40px', maxWidth: '40px' }} />
              )}
            </div>

            {/* Yellow advice bar from screenshot */}
            <div style={{
              background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px',
              padding: '9px 12px', textAlign: 'center', fontSize: '12px', color: '#854d0e',
              fontWeight: 700, marginBottom: '14px'
            }}>
              {lang === 'bn' ? 'নোটঃ টাকা পাঠানোর ৫-১৫ সেকেন্ড পর ভেরিফাই করবেন।' : 'Note: Please verify 5-15 seconds after sending money.'}
            </div>

            {/* ── GATEWAY-THEMED CARD (MATCHING SCREENSHOT 1) ── */}
            <div style={{
              background: gatewayTheme.primary,
              borderRadius: '16px',
              padding: '20px',
              color: '#ffffff',
              marginBottom: '20px',
              boxShadow: `0 10px 25px -5px ${gatewayTheme.primary}55`
            }}>
              {/* Title */}
              {/* Title based on gateway */}
              <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 800, marginBottom: '12px' }}>
                {(selectedMethod === 'binance_pay' || selectedMethod === 'binance')
                  ? (lang === 'bn' ? 'Binance Order ID দিন' : 'Enter Binance Order ID')
                  : (lang === 'bn' ? 'ট্রানজেকশন আইডি দিন' : 'Enter Transaction ID')}
              </div>

              {/* Large Input for TrxID / Order ID */}
              <div style={{ marginBottom: '14px' }}>
                <input
                  type="text"
                  className="payment-white-input"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  placeholder={(selectedMethod === 'binance_pay' || selectedMethod === 'binance')
                    ? (lang === 'bn' ? "Binance Order ID (যেমন: 452654450400329728)" : "Binance Order ID (e.g. 452654450400329728)")
                    : (lang === 'bn' ? "ট্রানজেকশন আইডি দিন" : "Enter Transaction ID")}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    height: '48px', padding: '12px 16px', borderRadius: '8px',
                    border: '2px solid #cbd5e1', fontSize: '15px', fontWeight: 800,
                    fontFamily: 'monospace', textAlign: 'center',
                    background: '#ffffff', color: '#000000',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Sender mobile / ID input (Solid white fill) */}
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  className="payment-white-input"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder={activeTab === 'mobile_banking' 
                    ? (lang === 'bn' ? "আপনার প্রেরক মোবাইল নম্বর লিখুন" : "Enter Sender Mobile Number") 
                    : (lang === 'bn' ? "আপনার Binance Pay ID / Wallet Address" : "Your Binance Pay ID / Wallet Address")}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    height: '44px', padding: '10px 16px', borderRadius: '8px',
                    border: '2px solid #cbd5e1', fontSize: '13px', fontWeight: 700,
                    fontFamily: 'monospace', textAlign: 'center',
                    background: '#ffffff', color: '#000000',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Instructions Header with Show QR button (ONLY for crypto / Binance, NEVER for bKash / Nagad / Rocket) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {lang === 'bn' ? 'নির্দেশনাাবলী' : 'INSTRUCTIONS'}
                </span>

                {(activeTab === 'crypto' || selectedMethod === 'binance_pay' || selectedMethod === 'binance' || selectedMethod === 'trc20' || selectedMethod === 'crypto') && (
                  <button
                    type="button"
                    onClick={() => setActiveInfoModal(activeInfoModal === 'qr' ? null : 'qr')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)', border: 'none', borderRadius: '6px',
                      padding: '4px 10px', fontSize: '10.5px', fontWeight: 800, color: '#ffffff',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <QrCode size={11} />
                    <span>Show QR</span>
                  </button>
                )}
              </div>

              {/* QR Code Popup (Only for Crypto / Binance) */}
              {activeInfoModal === 'qr' && (activeTab === 'crypto' || selectedMethod === 'binance_pay' || selectedMethod === 'binance' || selectedMethod === 'trc20' || selectedMethod === 'crypto') && (
                <div style={{
                  background: '#ffffff', borderRadius: '10px', padding: '14px',
                  textAlign: 'center', color: '#0f172a', marginBottom: '14px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>Scan with Binance / TRON Wallet</div>
                  <img src="/binance-qr.png" alt="QR" style={{ width: '140px', height: '140px', objectFit: 'contain' }} />
                </div>
              )}

              {/* Instruction Bullet Points matching screenshot */}
              <div style={{ fontSize: '12px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>• {lang === 'bn' ? `${gatewayTheme.code} ডায়াল করে আপনার ${gatewayTheme.name} মোবাইল মেনুতে যান অথবা ${gatewayTheme.name} অ্যাপে যান` : `Dial ${gatewayTheme.code} or open your ${gatewayTheme.name} mobile app`}</div>
                <div>• {lang === 'bn' ? '"Send Money"-এ ক্লিক করুন।' : 'Select "Send Money".'}</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>• {lang === 'bn' ? 'প্রাপক নম্বর হিসাবে এই নম্বরটি লিখুন:' : 'Enter recipient account number:'} <strong>{activeGateway.number || activeGateway.payId || activeGateway.address}</strong></span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeGateway.number || activeGateway.payId || activeGateway.address, 'boxNum')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '6px',
                      padding: '2px 8px', fontSize: '10.5px', fontWeight: 800, color: gatewayTheme.primary,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {copiedKey === 'boxNum' ? <Check size={10} /> : <Copy size={10} />}
                    <span>{copiedKey === 'boxNum' ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
                  </button>
                </div>

                <div>• {lang === 'bn' ? `পরিমাণ: ` : `Amount: `}<strong>{finalPrice} {currency}</strong> {lang === 'bn' ? 'দিয়ে SUBMIT করুন।' : 'and submit.'}</div>
                <div>• {(selectedMethod === 'binance_pay' || selectedMethod === 'binance')
                  ? (lang === 'bn' ? 'সফল মেসেজের Order ID ওপরের বক্সে দিন এবং VERIFY করুন।' : 'After transfer, paste Binance Order ID above and click VERIFY.')
                  : (lang === 'bn' ? 'সফল মেসেজের Transaction ID ওপরের বক্সে দিন এবং VERIFY করুন।' : 'After transfer, paste Transaction ID above and click VERIFY.')}</div>
              </div>
            </div>

            {/* Optional Coupon Box */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={lang === 'bn' ? "কুপন কোড (যদি থাকে)" : "Coupon Code (if any)"}
                  disabled={!!appliedCoupon}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1',
                    fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase'
                  }}
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{ padding: '0 14px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    {lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    style={{ padding: '0 16px', borderRadius: '10px', background: '#004ecc', color: '#fff', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                  >
                    {validatingCoupon ? (lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Checking...') : (lang === 'bn' ? 'প্রয়োগ করুন' : 'Apply')}
                  </button>
                )}
              </div>

              {couponError && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>{couponError}</div>
              )}
              {appliedCoupon && (
                <div style={{ fontSize: '11.5px', color: '#059669', marginTop: '6px', fontWeight: 700 }}>
                  {appliedCoupon.discount_percent}% {lang === 'bn' ? 'ছাড় কার্যকর হয়েছে!' : 'Discount Applied!'}
                </div>
              )}
            </div>

            {submitError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#b91c1c',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={15} color="#ef4444" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Bottom VERIFY TRANSACTION Button matching screenshot */}
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitPayment}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: 'none',
                background: gatewayTheme.primary,
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: `0 8px 20px ${gatewayTheme.primary}66`
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="spinner-loader" />
                  <span>{lang === 'bn' ? 'ভেরিফাই হচ্ছে...' : 'VERIFYING TRANSACTION...'}</span>
                </>
              ) : (
                <span>{lang === 'bn' ? 'VERIFY TRANSACTION / সাবমিট করুন' : 'VERIFY TRANSACTION'}</span>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
