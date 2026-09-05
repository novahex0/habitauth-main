import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, LayoutDashboard, LayoutGrid, LogOut, Sun, Moon, ChevronDown, 
  ExternalLink, Menu, X, Book, LifeBuoy, Check, Globe, 
  Terminal, Code, Lock, KeyRound, Activity
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Navbar({ user, onOpenLogin, onLogout, onNavigate, currentView }) {
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentLang, setLanguage, currentLanguageObj, languages, t } = useLanguage();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('habit_theme') || 'dark';
  });

  const moreDropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('habit_theme', theme);
  }, [theme]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        setShowMoreDropdown(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [discordUrl, setDiscordUrl] = useState('https://discord.gg/7JX63q4Aa');

  useEffect(() => {
    fetch('/api/v1/system/config')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.config?.discord_invite_url) {
          setDiscordUrl(data.config.discord_invite_url);
        }
      })
      .catch(() => {});
  }, []);

  const handleClearCacheAndLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    onLogout();
    window.location.reload();
  };

  const handleNavClick = (view, extra, targetTab) => {
    setMobileMenuOpen(false);
    setShowMoreDropdown(false);
    setShowLangDropdown(false);
    onNavigate(view, extra, targetTab);
    if (extra === 'pricing') {
      setTimeout(() => {
        const el = document.getElementById('pricing');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleLinkClick = (e, view, extra, targetTab) => {
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      handleNavClick(view, extra, targetTab);
    }
  };

  return (
    <header className="navbar-fixed-header">
      <div className="navbar-unified-bar">
        
        {/* Left Brand - Clean Text (Right click native link support) */}
        <a 
          href="/"
          onClick={(e) => handleLinkClick(e, 'landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '4px 8px',
            transition: 'opacity 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <img 
            src="/logo.png" 
            alt="Habit Auth Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.45))',
              marginRight: '10px'
            }} 
          />
          <span style={{
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '-0.4px',
            color: '#ffffff',
            whiteSpace: 'nowrap'
          }}>
            Habit Auth
          </span>
        </a>

        {/* Center Desktop Navigation Links (Scaled up with semantic links) */}
        <nav className="navbar-nav-desktop" style={{
          alignItems: 'center',
          gap: '6px'
        }}>
          {/* Home Tab */}
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, 'landing')}
            style={{
              background: currentView === 'landing' ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
              borderRadius: '999px',
              padding: '8px 20px',
              color: currentView === 'landing' ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
              fontSize: '14px',
              fontWeight: currentView === 'landing' ? 600 : 500,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { if (currentView !== 'landing') e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { if (currentView !== 'landing') e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'; }}
          >
            {t('navHome')}
          </a>

          {/* Status Tab */}
          <a
            href="/status"
            onClick={(e) => handleLinkClick(e, 'status')}
            style={{
              background: currentView === 'status' ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
              borderRadius: '999px',
              padding: '8px 18px',
              color: currentView === 'status' ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
              fontSize: '14px',
              fontWeight: currentView === 'status' ? 600 : 500,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { if (currentView !== 'status') e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { if (currentView !== 'status') e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'; }}
          >
            {t('navStatus')}
          </a>

          {/* Premium / Pricing Tab */}
          <a
            href="/#pricing"
            onClick={(e) => handleLinkClick(e, 'landing', 'pricing')}
            style={{
              background: 'transparent',
              borderRadius: '999px',
              padding: '8px 18px',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'}
          >
            {t('navPremium')}
          </a>

          {/* Docs Tab */}
          <a
            href="/docs"
            onClick={(e) => handleLinkClick(e, 'docs')}
            style={{
              background: currentView === 'docs' ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
              borderRadius: '999px',
              padding: '8px 18px',
              color: currentView === 'docs' ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
              fontSize: '14px',
              fontWeight: currentView === 'docs' ? 600 : 500,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { if (currentView !== 'docs') e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { if (currentView !== 'docs') e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'; }}
          >
            {t('navDocs')}
          </a>

          {/* More Dropdown */}
          <div ref={moreDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowMoreDropdown(!showMoreDropdown);
                setShowLangDropdown(false);
              }}
              style={{
                background: showMoreDropdown ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                border: 'none',
                borderRadius: '999px',
                padding: '8px 16px',
                color: showMoreDropdown ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                fontSize: '14px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => { if (!showMoreDropdown) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'; }}
            >
              {t('navMore')} <ChevronDown size={12} style={{ transform: showMoreDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {showMoreDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 14px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(18, 20, 30, 0.98)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '16px',
                padding: '8px',
                minWidth: '205px',
                boxShadow: '0 20px 45px rgba(0,0,0,0.9)',
                zIndex: 250,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <a
                  href="/docs"
                  onClick={(e) => handleLinkClick(e, 'docs', null, 'rest-api')}
                  style={{
                    background: 'transparent', color: 'rgba(255,255,255,0.85)',
                    padding: '9px 12px', fontSize: '13px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Terminal size={15} color="#38bdf8" />
                  {t('moreApiEndpoints')}
                </a>
                <a
                  href="/docs"
                  onClick={(e) => handleLinkClick(e, 'docs', null, 'sdk-libraries')}
                  style={{
                    background: 'transparent', color: 'rgba(255,255,255,0.85)',
                    padding: '9px 12px', fontSize: '13px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Code size={15} color="#a855f7" />
                  {t('moreSdkIntegrations')}
                </a>
                <a
                  href="/docs"
                  onClick={(e) => handleLinkClick(e, 'docs', null, 'security-hardening')}
                  style={{
                    background: 'transparent', color: 'rgba(255,255,255,0.85)',
                    padding: '9px 12px', fontSize: '13px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Shield size={15} color="#10b981" />
                  {t('moreSecurityHardening')}
                </a>
                <a
                  href="/docs"
                  onClick={(e) => handleLinkClick(e, 'docs', null, 'token-validation')}
                  style={{
                    background: 'transparent', color: 'rgba(255,255,255,0.85)',
                    padding: '9px 12px', fontSize: '13px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <KeyRound size={15} color="#f59e0b" />
                  {t('moreTokenGate')}
                </a>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                <a
                  href="/status"
                  onClick={(e) => handleLinkClick(e, 'status')}
                  style={{
                    background: 'transparent', color: 'rgba(255,255,255,0.85)',
                    padding: '9px 12px', fontSize: '13px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Activity size={15} color="#06b6d4" />
                  {t('moreSystemStatus')}
                </a>
              </div>
            )}
          </div>
        </nav>

        {/* Right Desktop Controls (Scaled up) */}
        <div className="navbar-controls-desktop" style={{
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0
        }}>
          {/* Interactive Language Selector Pill */}
          <div ref={langDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowLangDropdown(!showLangDropdown);
                setShowMoreDropdown(false);
              }}
              title="Change Language"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 15px',
                borderRadius: '999px',
                background: showLangDropdown ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                fontSize: '13px',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)'}
              onMouseLeave={(e) => { if (!showLangDropdown) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)'; }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{currentLanguageObj.flag}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
                {currentLanguageObj.code || 'EN'}
              </span>
              <ChevronDown size={12} style={{ opacity: 0.8, transform: showLangDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {showLangDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 14px)',
                right: 0,
                background: 'rgba(18, 20, 30, 0.98)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '16px',
                padding: '8px',
                minWidth: '210px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
                zIndex: 250,
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <div style={{ padding: '6px 10px 4px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('switchLang')}
                </div>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLangDropdown(false);
                    }}
                    style={{
                      background: currentLang === lang.code ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
                      border: currentLang === lang.code ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid transparent',
                      color: currentLang === lang.code ? '#ffffff' : 'rgba(255,255,255,0.85)',
                      padding: '9px 12px',
                      fontSize: '13px',
                      fontWeight: currentLang === lang.code ? 700 : 500,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { if (currentLang !== lang.code) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={(e) => { if (currentLang !== lang.code) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                    {currentLang === lang.code && <Check size={14} color="#a855f7" />}
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Frosted Silver Dashboard Capsule Button (Grand Scale) */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onNavigate('dashboard')}
                style={{
                  padding: '9px 24px',
                  borderRadius: '999px',
                  background: 'linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)',
                  color: '#090a0f',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 22px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.95)';
                }}
              >
                <LayoutGrid size={16} />
                <span>{t('navDashboard')}</span>
              </button>
              <button
                onClick={handleClearCacheAndLogout}
                title="Log Out & Clear Cache"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onOpenLogin && onOpenLogin('signin')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                }}
              >
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenLogin && onOpenLogin('signup')}
                style={{
                  padding: '8px 20px',
                  borderRadius: '999px',
                  background: 'linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)',
                  color: '#090a0f',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 22px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.95)';
                }}
              >
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Controls (< 860px) */}
        <div className="navbar-nav-mobile" style={{ alignItems: 'center', gap: '10px' }}>
          {user ? (
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                padding: '8px 18px',
                borderRadius: '999px',
                background: 'linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)',
                color: '#090a0f',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LayoutGrid size={14} /> {t('navDashboard')}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => onOpenLogin && onOpenLogin('signin')}
                style={{
                  padding: '7px 13px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenLogin && onOpenLogin('signup')}
                style={{
                  padding: '7px 15px',
                  borderRadius: '999px',
                  background: 'linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)',
                  color: '#090a0f',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Sign Up
              </button>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div style={{
          marginTop: '10px',
          background: 'rgba(14, 16, 26, 0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Mobile Navigation Links */}
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, 'landing')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: '10px', background: currentView === 'landing' ? 'rgba(255,255,255,0.1)' : 'transparent',
              textDecoration: 'none', color: '#ffffff', fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer'
            }}
          >
            {t('navHome')}
          </a>

          <a
            href="/docs"
            onClick={(e) => handleLinkClick(e, 'docs')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: '10px', background: currentView === 'docs' ? 'rgba(255,255,255,0.1)' : 'transparent',
              textDecoration: 'none', color: '#ffffff', fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer'
            }}
          >
            {t('navDocs')}
          </a>

          <a
            href="/#pricing"
            onClick={(e) => handleLinkClick(e, 'landing', 'pricing')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: '10px', background: 'transparent',
              textDecoration: 'none', color: '#ffffff', fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer'
            }}
          >
            {t('navPremium')}
          </a>

          <a
            href="/status"
            onClick={(e) => handleLinkClick(e, 'status')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: '10px', background: currentView === 'status' ? 'rgba(255,255,255,0.1)' : 'transparent',
              textDecoration: 'none', color: '#ffffff', fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer'
            }}
          >
            {t('navStatus')}
          </a>

          <a
            href={discordUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: '10px', background: 'transparent',
              color: '#ffffff', fontSize: '14px', fontWeight: 600, textDecoration: 'none'
            }}
          >
            {t('navSupport')}
          </a>

          {/* Quick Docs Links */}
          <div style={{ padding: '8px 12px 4px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('navMore')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <a
              href="/docs"
              onClick={(e) => handleLinkClick(e, 'docs', null, 'rest-api')}
              style={{
                padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
              }}
            >
              <Terminal size={13} color="#38bdf8" /> API Docs
            </a>
            <a
              href="/docs"
              onClick={(e) => handleLinkClick(e, 'docs', null, 'sdk-libraries')}
              style={{
                padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
              }}
            >
              <Code size={13} color="#a855f7" /> SDKs
            </a>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />

          {/* Mobile Language Selector Chips */}
          <div style={{ padding: '0 4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              {t('switchLang')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: currentLang === lang.code ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: currentLang === lang.code ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: currentLang === lang.code ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>


          {user && (
            <button
              onClick={handleClearCacheAndLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)',
                fontSize: '13px', fontWeight: 700, textAlign: 'left', cursor: 'pointer', marginTop: '6px'
              }}
            >
              <LogOut size={14} /> Log Out & Clear Cache
            </button>
          )}
        </div>
      )}
    </header>
  );
}
