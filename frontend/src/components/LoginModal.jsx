import React, { useState, useEffect } from 'react';
import { MessageSquare, X, User, Lock, ArrowRight, AlertCircle, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';

export default function LoginModal({ isOpen, initialMode = 'signin', initialTab = 'signin', initialBannedInfo = null, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState(initialTab || initialMode || 'signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);
  const [bannedInfo, setBannedInfo] = useState(initialBannedInfo || { isBanned: false, reason: '' });

  useEffect(() => {
    setActiveTab(initialTab || initialMode || 'signin');
  }, [initialTab, initialMode]);

  useEffect(() => {
    if (initialBannedInfo?.isBanned) {
      setBannedInfo(initialBannedInfo);
    }
  }, [initialBannedInfo]);

  if (!isOpen) return null;

  // Direct redirect to Discord OAuth
  const handleDiscordOAuth = () => {
    window.location.href = '/api/v1/auth/discord/login';
  };

  const handleClose = () => {
    setError('');
    setShowForgotNotice(false);
    setBannedInfo({ isBanned: false, reason: '' });
    onClose();
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('habit_token', data.token);
        localStorage.setItem('habit_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
        handleClose();
      } else if (data.code === 'ACCOUNT_BANNED') {
        setBannedInfo({
          isBanned: true,
          reason: data.ban_reason || 'Terms of Service violation'
        });
      } else {
        setError(data.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-scale-in" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 6, 10, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 1000
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#11131a',
        border: bannedInfo.isBanned ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: bannedInfo.isBanned 
          ? '0 25px 65px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(239, 68, 68, 0.2)' 
          : '0 25px 65px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: bannedInfo.isBanned ? '#f87171' : '#e2e8f0',
            background: bannedInfo.isBanned ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: bannedInfo.isBanned ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '4px 12px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {bannedInfo.isBanned ? <ShieldAlert size={12} /> : null}
            {bannedInfo.isBanned ? 'Security Enforcement' : 'Developer Portal'}
          </span>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
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
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── CASE 1: ACCOUNT BANNED / SUSPENDED VIEW ────────── */}
        {bannedInfo.isBanned ? (
          <div style={{ textAlign: 'center', padding: '10px 4px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)'
            }}>
              <ShieldAlert size={34} />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Account Suspended
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
              Your developer account has been suspended by the platform administrator.
            </p>

            <div style={{
              background: 'rgba(239, 68, 68, 0.07)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '22px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                Ban Reason:
              </div>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600, wordBreak: 'break-word', lineHeight: 1.5 }}>
                {bannedInfo.reason || 'Violation of platform Terms of Service.'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="https://discord.gg/habitauth"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#5865F2',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(88, 101, 242, 0.35)',
                  boxSizing: 'border-box'
                }}
              >
                <MessageSquare size={16} /> Appeal via Discord Support
              </a>
              <button
                onClick={handleClose}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : showForgotNotice ? (
          /* ── CASE 2: FORGOT PASSWORD HELPER VIEW ─────────── */
          <div style={{ textAlign: 'left', padding: '6px 2px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <HelpCircle size={28} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
              Password Recovery
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '18px' }}>
              For strict security and zero-trust protection, developer accounts are linked to verified Discord identities:
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px',
              fontSize: '12.5px',
              color: '#cbd5e1',
              lineHeight: 1.6
            }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>1.</span>
                <span>Log in to your account using the <strong>Continue with Discord</strong> button.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>2.</span>
                <span>Open a <strong>Support Ticket</strong> from the sidebar or reach out on Discord.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>3.</span>
                <span>An administrator will generate a one-time <strong>cryptographic reset link valid for 24 hours</strong>.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleDiscordOAuth}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '11px',
                  background: '#5865F2',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <MessageSquare size={15} /> Login via Discord
              </button>
              <button
                type="button"
                onClick={() => setShowForgotNotice(false)}
                style={{
                  padding: '11px 18px',
                  borderRadius: '11px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          /* ── CASE 3: STANDARD SIGN IN / SIGN UP MODAL ─────── */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <img 
                src="/logo.png" 
                alt="Habit Auth Logo" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.6))' 
                }} 
              />
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Habit Auth
              </span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '6px' }}>
              {activeTab === 'signin' ? 'Sign In to Habit Auth' : 'Create Developer Account'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '22px' }}>
              {activeTab === 'signin' 
                ? 'Access your software dashboard and cryptographic license control center.' 
                : 'Join thousands of developers protecting and monetizing their applications.'}
            </p>

            {/* Tab Switcher */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeTab === 'signin' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                  color: activeTab === 'signin' ? '#ffffff' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'signin' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeTab === 'signup' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                  color: activeTab === 'signup' ? '#ffffff' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'signup' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '12.5px',
                textAlign: 'left',
                marginBottom: '14px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* TAB: SIGN UP (ONLY DISCORD SIGN UP!) */}
            {activeTab === 'signup' ? (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleDiscordOAuth}
                  disabled={loading}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '14px',
                    background: '#5865F2',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 24px rgba(88, 101, 242, 0.4)',
                    marginBottom: '18px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#4752C4';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#5865F2';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <MessageSquare size={18} /> 
                  <span>Sign Up with Discord</span>
                </button>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: '#94a3b8',
                  lineHeight: 1.6
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', color: '#e2e8f0', fontWeight: 700 }}>
                    <CheckCircle2 size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>Instant 1-Click Verification</span>
                  </div>
                  <p style={{ margin: '0 0 10px 24px' }}>
                    Registration is powered directly by Discord OAuth. No spam, no email confirmation waiting.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', color: '#e2e8f0', fontWeight: 700 }}>
                    <CheckCircle2 size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>Multi-Device Direct Login Ready</span>
                  </div>
                  <p style={{ margin: '0 0 0 24px' }}>
                    Once registered, you can set a custom username and password from your dashboard to log in from other devices without Discord.
                  </p>
                </div>
              </div>
            ) : (
              /* TAB: SIGN IN (DISCORD OR USERNAME/PASSWORD) */
              <div>
                <button
                  onClick={handleDiscordOAuth}
                  disabled={loading}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: '#5865F2',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 24px rgba(88, 101, 242, 0.35)',
                    marginBottom: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#4752C4';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#5865F2';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <MessageSquare size={16} /> 
                  <span>Continue with Discord</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 14px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    or with credentials
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                </div>

                <form onSubmit={handleSignIn} style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0', marginBottom: '5px' }}>
                      Username or Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Enter username or email"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 38px',
                          borderRadius: '11px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#ffffff',
                          fontSize: '13.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = '#38bdf8'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0' }}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotNotice(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '11px',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 38px',
                          borderRadius: '11px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#ffffff',
                          fontSize: '13.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = '#38bdf8'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)',
                      color: '#090a0f',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: loading ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Dashboard'} 
                    <ArrowRight size={15} />
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
