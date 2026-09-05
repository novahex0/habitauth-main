import React, { useState, useEffect } from 'react';
import { 
  Home, X, Headphones, Info, AlignLeft, Copy, Check, ShieldCheck, 
  Tag, AlertCircle, CheckCircle2, Clock, Zap, ArrowRight, ExternalLink, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PaymentPage() {
  const { language } = useLanguage();
  const [sessionId, setSessionId] = useState(() => {
    const parts = window.location.pathname.split('/');
    const idx = parts.indexOf('payment');
    return idx !== -1 && parts[idx + 1] ? parts[idx + 1] : '';
  });

  const [searchMethod, setSearchMethod] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('method') === 'international' ? 'international' : 'mobile_banking';
  });

  const [sessionData, setSessionData] = useState(null);
  const [gateways, setGateways] = useState({});
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  // Selected payment method & gateway
  const [activeTab, setActiveTab] = useState(searchMethod); // 'mobile_banking' | 'international'
  const [selectedGatewayId, setSelectedGatewayId] = useState('bkash');

  // Input states
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // UI helpers
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeInfoModal, setActiveInfoModal] = useState(null); // null | 'support' | 'info' | 'details'

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sync tab change to URL search params without reload
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const newGateway = newTab === 'mobile_banking' ? 'bkash' : 'binance_pay';
    setSelectedGatewayId(newGateway);

    const url = new URL(window.location);
    url.searchParams.set('method', newTab);
    window.history.pushState({}, '', url);
  };

  // Load session from backend
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!sessionId) {
        setSessionError('Invalid payment link. No session ID specified.');
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

          if (searchMethod === 'international') {
            setSelectedGatewayId('binance_pay');
          } else {
            setSelectedGatewayId('bkash');
          }
        } else {
          // Fallback: check localStorage for offline-saved session
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
        if (isMounted) setSessionError('Failed to connect to Habit Auth payment gateway.');
      } finally {
        if (isMounted) setLoadingSession(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [sessionId, searchMethod]);

  // Handle coupon validation
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
      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
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

  // Submit payment claim
  const handleSubmitPayment = async (e) => {
    if (e) e.preventDefault();
    setSubmitError('');

    const token = localStorage.getItem('habit_token');
    if (!token) {
      setSubmitError('Authentication required. Please sign in to complete payment.');
      return;
    }

    if (!senderNumber.trim()) {
      setSubmitError(
        activeTab === 'mobile_banking'
          ? 'Please enter your sender mobile number (bKash/Nagad/Rocket).'
          : 'Please enter your Binance Pay ID or Sender Wallet Address.'
      );
      return;
    }

    if (!trxId.trim()) {
      setSubmitError('Please enter the Transaction ID (TrxID / TxID) from your receipt.');
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
        setSubmitError(data.message || 'Payment submission failed. Please check your TrxID.');
      }
    } catch (err) {
      setSubmitError('Network error while submitting order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate current amount
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
      
      {/* Central Modal Card matching user screenshot */}
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.9)',
        width: '100%',
        maxWidth: '520px',
        padding: '28px 24px',
        position: 'relative'
      }}>

        {/* Top Control Bar: Home & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
              padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center'
            }}
            title="Go to Home"
          >
            <Home size={20} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.opener) window.close();
              else window.location.href = '/overview';
            }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
              padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center'
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading State */}
        {loadingSession && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <RefreshCw size={28} className="spinner-loader" style={{ margin: '0 auto 16px', color: '#004ecc' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>Connecting to Habit Auth Gateway...</div>
          </div>
        )}

        {/* Error State */}
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

        {/* Success Confirmation State */}
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

            {/* Order Details Card */}
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
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontWeight: 800, color: '#d97706', fontSize: '11.5px'
                }}>
                  <Clock size={12} /> PENDING ADMIN APPROVAL
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/overview';
                }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', background: '#004ecc', color: '#fff',
                  border: 'none', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer'
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Main Payment Interface */}
        {!loadingSession && !sessionError && !orderSuccess && (
          <div>
            
            {/* Header: Logo, Brand Name & Info Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
              {/* Circular Brand Logo */}
              <div style={{
                width: '54px', height: '54px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #004ecc, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                flexShrink: 0
              }}>
                <ShieldCheck size={28} color="#ffffff" />
              </div>

              {/* Title & Quick Action Buttons */}
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

            {/* Expandable Quick Info Banners */}
            {activeInfoModal === 'support' && (
              <div style={{
                background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px',
                padding: '12px 16px', marginBottom: '18px', fontSize: '12.5px', color: '#0369a1'
              }}>
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>Habit Auth Official Support:</div>
                <div>পেমেন্ট নিয়ে যেকোনো সহায়তার জন্য আমাদের ডিসকর্ড সার্ভারে যোগাযোগ করুন অথবা এডমিনকে সরাসরি মেসেজ দিন।</div>
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

            {/* Method Tabs Switcher matching screenshot: [ Mobile Banking ] [ International ] */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: '#e2e8f0',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => handleTabChange('mobile_banking')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === 'mobile_banking' ? '#004ecc' : 'transparent',
                  color: activeTab === 'mobile_banking' ? '#ffffff' : '#334155',
                  boxShadow: activeTab === 'mobile_banking' ? '0 4px 12px rgba(0, 78, 204, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Mobile Banking
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('international')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === 'international' ? '#004ecc' : 'transparent',
                  color: activeTab === 'international' ? '#ffffff' : '#334155',
                  boxShadow: activeTab === 'international' ? '0 4px 12px rgba(0, 78, 204, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                International
              </button>
            </div>

            {/* Gateways Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'mobile_banking' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {activeTab === 'mobile_banking' ? (
                <>
                  {/* bKash */}
                  <div
                    onClick={() => setSelectedGatewayId('bkash')}
                    style={{
                      border: selectedGatewayId === 'bkash' ? '2px solid #e2136e' : '1px solid #e2e8f0',
                      background: selectedGatewayId === 'bkash' ? 'rgba(226, 19, 110, 0.04)' : '#ffffff',
                      borderRadius: '12px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 900, color: '#e2136e', fontSize: '15px' }}>bKash</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>bKash Personal</div>
                  </div>

                  {/* Nagad */}
                  <div
                    onClick={() => setSelectedGatewayId('nagad')}
                    style={{
                      border: selectedGatewayId === 'nagad' ? '2px solid #f97316' : '1px solid #e2e8f0',
                      background: selectedGatewayId === 'nagad' ? 'rgba(249, 115, 22, 0.04)' : '#ffffff',
                      borderRadius: '12px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 900, color: '#f97316', fontSize: '15px' }}>Nagad</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>Nagad Personal</div>
                  </div>

                  {/* Rocket */}
                  <div
                    onClick={() => setSelectedGatewayId('rocket')}
                    style={{
                      border: selectedGatewayId === 'rocket' ? '2px solid #8c3494' : '1px solid #e2e8f0',
                      background: selectedGatewayId === 'rocket' ? 'rgba(140, 52, 148, 0.04)' : '#ffffff',
                      borderRadius: '12px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 900, color: '#8c3494', fontSize: '15px' }}>Rocket</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>Rocket Personal</div>
                  </div>
                </>
              ) : (
                <>
                  {/* Binance Pay */}
                  <div
                    onClick={() => setSelectedGatewayId('binance_pay')}
                    style={{
                      border: selectedGatewayId === 'binance_pay' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                      background: selectedGatewayId === 'binance_pay' ? 'rgba(245, 158, 11, 0.04)' : '#ffffff',
                      borderRadius: '12px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 900, color: '#f59e0b', fontSize: '15px' }}>Binance Pay</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>Pay ID (0 Fee)</div>
                  </div>

                  {/* TRON (TRC-20) */}
                  <div
                    onClick={() => setSelectedGatewayId('trc20')}
                    style={{
                      border: selectedGatewayId === 'trc20' ? '2px solid #06b6d4' : '1px solid #e2e8f0',
                      background: selectedGatewayId === 'trc20' ? 'rgba(6, 182, 212, 0.04)' : '#ffffff',
                      borderRadius: '12px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 900, color: '#06b6d4', fontSize: '15px' }}>TRON TRC20</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>USDT / TRX</div>
                  </div>
                </>
              )}
            </div>

            {/* Gateway Transfer Info Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                {activeGateway.name} {activeGateway.accountType || 'Account'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: activeGateway.payId ? '18px' : activeGateway.number?.length > 20 ? '12px' : '17px',
                  fontWeight: 800,
                  color: '#0f172a',
                  wordBreak: 'break-all'
                }}>
                  {activeGateway.payId || activeGateway.number || activeGateway.address}
                </span>

                <button
                  type="button"
                  onClick={() => copyToClipboard(activeGateway.payId || activeGateway.number || activeGateway.address, 'target')}
                  style={{
                    background: copiedKey === 'target' ? '#10b981' : '#004ecc',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '6px 12px', fontSize: '11.5px', fontWeight: 800,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                    flexShrink: 0
                  }}
                >
                  {copiedKey === 'target' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'target' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }}>
                {activeGateway.instructions}
              </div>
            </div>

            {/* Coupon Code Section */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Tag size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code (Optional)"
                    disabled={!!appliedCoupon}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px 10px 34px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#0f172a'
                    }}
                  />
                </div>

                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      padding: '0 16px', borderRadius: '10px',
                      background: '#fee2e2', color: '#ef4444',
                      border: '1px solid #fca5a5', fontWeight: 700,
                      fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    style={{
                      padding: '0 16px', borderRadius: '10px',
                      background: '#004ecc', color: '#fff',
                      border: 'none', fontWeight: 800,
                      fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                )}
              </div>

              {couponError && (
                <div style={{ fontSize: '11.5px', color: '#ef4444', marginTop: '6px', fontWeight: 600 }}>
                  {couponError}
                </div>
              )}

              {appliedCoupon && (
                <div style={{
                  marginTop: '8px', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700 }}>
                    {appliedCoupon.discount_percent}% DISCOUNT APPLIED
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Code: <strong>{appliedCoupon.code}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Inputs: Sender Number and TrxID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {activeTab === 'mobile_banking' ? 'Your Mobile Number' : 'Your Binance Pay ID / Wallet Address'}
                </label>
                <input
                  type="text"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder={activeTab === 'mobile_banking' ? 'e.g. 017xxxxxxxx or 019xxxxxxxx' : 'e.g. 1025707697'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '11px 12px', borderRadius: '10px',
                    border: '1px solid #cbd5e1', fontSize: '13px',
                    fontFamily: 'monospace', fontWeight: 600
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Transaction ID (TrxID / TxID)
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="Paste the 8-10 digit TrxID from your SMS receipt"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '11px 12px', borderRadius: '10px',
                    border: '1px solid #cbd5e1', fontSize: '13px',
                    fontFamily: 'monospace', fontWeight: 700, color: '#004ecc'
                  }}
                  required
                />
              </div>
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

            {/* Pay Button matching user screenshot: Pay 129 BDT */}
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitPayment}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: '#dbeafe',
                color: '#1d4ed8',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.12)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#004ecc';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dbeafe';
                e.currentTarget.style.color = '#1d4ed8';
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="spinner-loader" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  {appliedCoupon && (
                    <span style={{ textDecoration: 'line-through', opacity: 0.6, fontSize: '13px', marginRight: '4px' }}>
                      {basePrice} {currency}
                    </span>
                  )}
                  <span>Pay {finalPrice} {currency}</span>
                </>
              )}
            </button>

            <div style={{
              fontSize: '11px', color: '#94a3b8', textAlign: 'center',
              marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
            }}>
              <ShieldCheck size={13} color="#10b981" />
              <span>Habit Auth End-to-End Encrypted Verification</span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
