import React, { useState } from 'react';
import { 
  X, Check, Copy, Shield, Zap, Sparkles, ExternalLink, 
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw, QrCode, Wallet
} from 'lucide-react';

export default function CryptoCheckoutModal({ 
  isOpen, 
  onClose, 
  selectedPlan, 
  user, 
  onUpgradeSuccess,
  onOpenLogin 
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('trc20'); // 'trc20' | 'binance_pay'
  const [txId, setTxId] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const walletAddress = 'TFtpThLcVSbR6KKEExWg2UiWibUvFc1AG3';
  const binancePayId = '1025707697';
  const planName = selectedPlan?.name || 'Developer';
  const planId = selectedPlan?.id || 'developer';
  const planPrice = selectedPlan?.price || '$1.20';
  const billingCycle = selectedPlan?.billingCycle || 'monthly';
  const rawPrice = selectedPlan?.rawPrice || '1.20';

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in or create an account first to activate your subscription.');
      return;
    }

    if (!txId.trim()) {
      setError('Please paste your Transaction Hash (TxID) or Binance Order ID.');
      return;
    }

    setVerifying(true);

    try {
      const token = localStorage.getItem('habit_token');
      const res = await fetch('/api/v1/payment/verify-crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: planId,
          billing_cycle: billingCycle,
          txid: txId.trim(),
          payment_method: activeTab
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccessData(data);
        if (onUpgradeSuccess) {
          onUpgradeSuccess(data);
        }
        // Update local storage user profile
        try {
          const stored = localStorage.getItem('habit_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.role = 'developer';
            parsed.plan = planId;
            localStorage.setItem('habit_user', JSON.stringify(parsed));
          }
        } catch (err) {}
      } else {
        setError(data.message || 'Payment verification failed. Please ensure the transaction is confirmed on the blockchain.');
      }
    } catch (err) {
      setError('Network error connecting to payment verification server. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="modal-overlay animate-scale-in" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 12, 0.86)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 1000
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: '#0d1017',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '26px',
        padding: '30px 28px',
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/logo.png" 
              alt="Habit Auth Logo" 
              style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))' }} 
            />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Instant Crypto Checkout
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Zero KYC • Automated Instant Activation
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── CASE 1: SUCCESSFUL ACTIVATION VIEW ── */}
        {successData ? (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={34} />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
              Subscription Upgraded!
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '24px' }}>
              Your account has been upgraded to <strong>{planName.toUpperCase()} Plan</strong>. All limits, hardware locking features, and SDK keys are now unlocked.
            </p>

            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
              }}
            >
              Go to Developer Dashboard &rarr;
            </button>
          </div>
        ) : (
          /* ── CASE 2: ACTIVE CHECKOUT VIEW ── */
          <>
            {/* Selected Plan Summary Banner */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '16px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: '#38bdf8'
                }}>
                  Selected Plan
                </span>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff' }}>
                  {planName} ({billingCycle})
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
                  ${rawPrice}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>
                  USDT
                </span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('trc20')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '9px',
                  background: activeTab === 'trc20' ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                  color: activeTab === 'trc20' ? '#38bdf8' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: activeTab === 'trc20' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <QrCode size={14} /> USDT / TRX (TRC20)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('binance_pay')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '9px',
                  background: activeTab === 'binance_pay' ? 'rgba(245, 158, 11, 0.16)' : 'transparent',
                  color: activeTab === 'binance_pay' ? '#f59e0b' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: activeTab === 'binance_pay' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <Wallet size={14} /> Binance Pay (0 Fee)
              </button>
            </div>

            {/* TAB CONTENT 1: TRON TRC20 DEPOSIT */}
            {activeTab === 'trc20' ? (
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                {/* QR Code */}
                <div style={{
                  display: 'inline-block',
                  padding: '12px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                  marginBottom: '16px'
                }}>
                  <img 
                    src="/binance-qr.png" 
                    alt="Binance TRON Deposit QR" 
                    style={{ width: '170px', height: '170px', display: 'block' }}
                  />
                </div>

                {/* Wallet Address Copy Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  textAlign: 'left'
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>
                      Network: <strong style={{ color: '#38bdf8' }}>TRX Tron (TRC20)</strong>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      wordBreak: 'break-all'
                    }}>
                      {walletAddress}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(walletAddress, 'wallet')}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: copiedField === 'wallet' ? '#10b981' : 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: copiedField === 'wallet' ? '#ffffff' : '#38bdf8',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedField === 'wallet' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
              </div>
            ) : (
              /* TAB CONTENT 2: BINANCE PAY ID */
              <div style={{ textAlign: 'left', marginBottom: '22px' }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '14px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Send via Binance App (Instant & 0 Fee)
                  </div>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '12px' }}>
                    1. Open Binance App ➔ Tap <strong>Pay</strong> icon on top-right.<br />
                    2. Tap <strong>Send</strong> ➔ Select <strong>Binance ID (UID)</strong>.<br />
                    3. Enter the ID below and transfer <strong>${rawPrice} USDT</strong>.
                  </div>

                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Binance ID (Payee)</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '1px' }}>
                        {binancePayId}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(binancePayId, 'binance_id')}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        background: copiedField === 'binance_id' ? '#10b981' : 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: copiedField === 'binance_id' ? '#ffffff' : '#f59e0b',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedField === 'binance_id' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Box */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '12.5px',
                color: '#f87171',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  marginBottom: '6px'
                }}>
                  Enter Transaction Hash (TxID) or Binance Order ID
                </label>
                <input
                  type="text"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="Paste your 64-char TxID or Binance Pay ID..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenLogin) onOpenLogin();
                  }}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  Sign In to Continue &rarr;
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={verifying || !txId.trim()}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    background: verifying || !txId.trim()
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: verifying || !txId.trim() ? '#64748b' : '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: verifying || !txId.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: verifying || !txId.trim() ? 'none' : '0 6px 20px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {verifying ? (
                    <>
                      <RefreshCw size={16} className="spinner-loader" />
                      <span>Verifying On-Chain...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Verify Payment & Activate Plan</span>
                    </>
                  )}
                </button>
              )}
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Need help or manual support?{' '}
                <a 
                  href="https://discord.gg/7JX63q4Aa" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                >
                  Contact us on Discord
                </a>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
