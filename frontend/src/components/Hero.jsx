import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, Key, Cpu, Lock, CheckCircle2, ArrowRight, 
  Code, Sparkles, Copy, Check, FileCode, Layers, ExternalLink, Zap, 
  ArrowUpRight, Ban, Send, Database, Activity, Terminal, Smartphone, 
  Laptop, Globe, RefreshCw, Download, CheckSquare, XCircle, ChevronDown,
  Users, Server, Radio, BarChart3, Code2, Play, Eye
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Hero({ user, onOpenLogin, onExplorePricing, onNavigate }) {
  const { t, language } = useLanguage();
  const [openFaq, setOpenFaq] = useState(null);
  const [heroImage, setHeroImage] = useState(() => {
    return localStorage.getItem('habit_landing_hero_image') || '/uploads/notif_1788492876029_e25a3304.png';
  });
  const [isHeroImageActive, setIsHeroImageActive] = useState(() => {
    const saved = localStorage.getItem('habit_landing_hero_image_active');
    return saved !== null ? saved === 'true' : true;
  });

  // Fetch dynamic landing page hero image if configured by admin
  useEffect(() => {
    fetch('/api/v1/system/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          if (data.landing_hero_image) {
            setHeroImage(data.landing_hero_image);
            localStorage.setItem('habit_landing_hero_image', data.landing_hero_image);
          }
          if (data.landing_hero_image_active !== undefined) {
            setIsHeroImageActive(data.landing_hero_image_active);
            localStorage.setItem('habit_landing_hero_image_active', String(data.landing_hero_image_active));
          }
        }
      })
      .catch(err => console.error('Failed to load hero image:', err));
  }, []);

  // Interactive Live Dashboard Mockup Simulation State for Hero Right Side
  const [demoRadarUsers, setDemoRadarUsers] = useState([
    {
      id: 'u1',
      username: 'apex_developer',
      os: 'Windows 11',
      app: 'NexusSuite Pro v2.4',
      hwid: '7a91a0c4...440c98f2',
      ip: '103.14.22.8',
      ping: '2s ago',
      killed: false
    },
    {
      id: 'u2',
      username: 'titan_creator',
      os: 'Windows 10',
      app: 'TitanEngine v1.9',
      hwid: 'bc33f109...91e233d1',
      ip: '185.220.101.4',
      ping: '11s ago',
      killed: false
    },
    {
      id: 'u3',
      username: 'shadow_reign',
      os: 'Windows 11',
      app: 'AegisLoader v3.1',
      hwid: '2f88cd31...77a0bc45',
      ip: '45.133.1.80',
      ping: '18s ago',
      killed: true
    }
  ]);

  const toggleDemoKill = (id) => {
    setDemoRadarUsers(prev => prev.map(u => u.id === id ? { ...u, killed: !u.killed } : u));
  };

  // Scroll Reveal Observer (Triggers animated smooth visibility when scrolled into view)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    const targets = document.querySelectorAll('.obsidian-reveal, .scroll-reveal');
    targets.forEach(el => observer.observe(el));

    return () => targets.forEach(el => observer.unobserve(el));
  }, []);

  const faqs = [
    {
      q: 'Is Habit Auth free to use for developers?',
      a: 'Yes, Habit Auth offers a 100% free starter tier with no credit card required. You get hardware fingerprinting, cryptographic responses, and dashboard access out of the box.'
    },
    {
      q: 'How does Live Online Radar and Instant Kill work?',
      a: 'When your desktop application runs with our SDK, it emits lightweight cryptographic heartbeats every 30 seconds. In your dashboard Live Radar tab, you can view every connected machine in real-time. If you click "Kill Session", the server immediately sends a termination signal that causes the client process to exit instantly, and blocks any restart attempts until you revive it.'
    },
    {
      q: 'Which programming languages and frameworks are supported?',
      a: 'We provide production-ready, zero-dependency SDKs for C# (.NET Framework 4.5+ and modern .NET Core / .NET 6/7/8/9), native C++ (WinINet / Anti-Tamper), Python 3.8+, Node.js, Electron, Rust, and Go.'
    },
    {
      q: 'How does Ed25519 asymmetric cryptography protect against cracks?',
      a: 'Unlike traditional auth systems that rely on easily spoofed JSON responses, Habit Auth digitally signs every authentication response on the server using an Ed25519 private key. Even if an attacker intercepts the traffic using Fiddler, Charles, or proxy tools, they cannot forge a valid cryptographic signature.'
    },
    {
      q: 'Can I enforce mandatory auto-updates for my users?',
      a: 'Yes! You can enable Force Auto-Update from your App Settings. If a user launches an outdated client version, the SDK blocks login and automatically provides your direct executable download URL.'
    }
  ];

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      
      {/* ── 1. OBSIDIAN-STYLE HERO SECTION (2-COLUMN SPLIT) ───────────── */}
      <section className="obsidian-hero-section">
        <div className="obsidian-hero-grid">
          
          {/* Left Column: Heading, Description, Capsule Buttons, Stats */}
          <div className="obsidian-hero-left obsidian-reveal is-visible">
            
            {/* Live Operational Pill Badge */}
            <div className="obsidian-badge">
              <span className="obsidian-badge-dot" />
              <span>Now securing 14.8K+ applications & machines</span>
            </div>

            {/* Obsidian Clean Headline Typography */}
            <h1 className="obsidian-title">
              Secure Your Software<br />
              With Habit Auth
            </h1>

            {/* Obsidian Subtitle */}
            <p className="obsidian-subtitle">
              Habit Auth is the next-generation authentication and software protection platform — military-grade Ed25519 cryptography, hardware-locked licensing, real-time Live Online Radar, and instant remote session termination built for modern developers.
            </p>

            {/* Obsidian Capsule Buttons */}
            <div className="obsidian-hero-buttons">
              {user ? (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="obsidian-btn-primary"
                >
                  Open Dashboard <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="obsidian-btn-primary"
                >
                  Get Started Free <ArrowRight size={16} />
                </button>
              )}

              <button
                onClick={() => onNavigate('docs')}
                className="obsidian-btn-secondary"
              >
                Explore Documentation
              </button>
            </div>

            {/* Global Systems Online Status Line */}
            <div className="obsidian-status-line">
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Global Systems Online</span>
              <span style={{ opacity: 0.35 }}>|</span>
              <span 
                onClick={() => onNavigate('status')}
                style={{ color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                View System Status &rarr;
              </span>
            </div>

            {/* 3 Sleek Dark Stat Boxes */}
            <div className="obsidian-stats-row">
              <div className="obsidian-stat-box">
                <div className="obsidian-stat-number">14.8K+</div>
                <div className="obsidian-stat-label">Applications</div>
              </div>
              <div className="obsidian-stat-box">
                <div className="obsidian-stat-number">1.42M+</div>
                <div className="obsidian-stat-label">Connected Users</div>
              </div>
              <div className="obsidian-stat-box">
                <div className="obsidian-stat-number">99.99%</div>
                <div className="obsidian-stat-label">System Uptime</div>
              </div>
            </div>

          </div>

          {/* Right Column: Dashboard Mockup with Floating Orbiting Badges */}
          <div className="obsidian-preview-wrapper obsidian-reveal is-visible obsidian-delay-1">
            
            {/* Soft Ambient Radial Aura Behind Card (Obsidian Illustration Glow) */}
            <div className="obsidian-preview-aura" />

            {/* 4 Orbiting Telemetry Badges */}
            <div className="obsidian-float-badge obsidian-float-top-right">
              <Zap size={13} color="#f59e0b" />
              <span>Latency 14ms</span>
            </div>

            <div className="obsidian-float-badge obsidian-float-mid-left">
              <ShieldCheck size={14} color="#10b981" />
              <span>Ed25519 Signed</span>
            </div>

            <div className="obsidian-float-badge obsidian-float-bot-right">
              <Ban size={13} color="#ef4444" />
              <span>0 Cracks Detected</span>
            </div>

            <div className="obsidian-float-badge obsidian-float-bot-left">
              <Radio size={13} color="#38bdf8" />
              <span>Live Radar: Active</span>
            </div>

            {/* High-Fidelity Interactive Dashboard Mockup Card OR Custom Admin Uploaded Image */}
            {heroImage && isHeroImageActive ? (
              <div className="obsidian-dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Window Topbar */}
                <div style={{
                  background: 'rgba(15, 17, 23, 0.98)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    <span style={{ marginLeft: '10px', fontSize: '11.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      habit-auth-dashboard.preview
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#38bdf8'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
                    LIVE DASHBOARD
                  </div>
                </div>

                {/* Custom Uploaded Dashboard Image */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  background: '#0d1017',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={heroImage} 
                    alt="Habit Auth Dashboard Preview" 
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '520px',
                      objectFit: 'cover',
                      display: 'block',
                      borderRadius: '0 0 16px 16px'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="obsidian-dashboard-card">
              
              {/* Window Topbar */}
              <div style={{
                background: 'rgba(15, 17, 23, 0.98)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span style={{ marginLeft: '10px', fontSize: '11.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    habit-auth-radar.control-center
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#10b981'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  LIVE RADAR FEED
                </div>
              </div>

              {/* Inner Radar Dashboard Interface */}
              <div style={{ padding: '20px 22px', background: '#0f1117' }}>
                
                {/* Telemetry Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981'
                    }}>
                      <Radio size={16} className="radar-pulsing-icon" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                        LIVE ONLINE RADAR
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Active Workstation Telemetry (3s Polling)
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#60a5fa',
                    background: 'rgba(59, 130, 246, 0.12)',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.25)'
                  }}>
                    14 Online
                  </span>
                </div>

                {/* 3 Live Workstation Session Rows (Interactive Kill Simulation) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {demoRadarUsers.map(u => (
                    <div
                      key={u.id}
                      style={{
                        background: u.killed ? 'rgba(239, 68, 68, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                        border: u.killed ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Left: User & Machine Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: u.killed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: u.killed ? '#ef4444' : '#38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 800
                        }}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                              @{u.username}
                            </span>
                            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                              ({u.os})
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'var(--font-mono)' }}>
                            {u.hwid}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status & Interactive Kill Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {u.killed ? (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            KILLED
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                            {u.ping}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleDemoKill(u.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: u.killed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: u.killed ? '#10b981' : '#ef4444',
                            border: u.killed ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                            transition: 'all 0.15s ease'
                          }}
                          title={u.killed ? 'Click to Revive access' : 'Click to test Instant Kill'}
                        >
                          {u.killed ? 'Revive' : 'Kill'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Strip */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={13} color="#10b981" /> SHA-256 Anti-Tamper Shield Active
                  </span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                    100% Uncrackable
                  </span>
                </div>

              </div>
            </div>
            )}

          </div>

        </div>
      </section>

      {/* ── 2. OBSIDIAN-STYLE 6-FEATURE GRID (SCROLL REVEAL) ─────────── */}
      <section className="obsidian-reveal" style={{ maxWidth: '1240px', margin: '0 auto', padding: '90px 24px 60px', textAlign: 'center' }}>
        
        {/* Section Header */}
        <span className="obsidian-section-tag">FEATURES</span>
        <h2 className="obsidian-section-title">
          Powering Next-Gen Software & Games
        </h2>
        <p className="obsidian-section-subtitle">
          Everything you need to grow, manage, and protect your desktop software in one powerful platform.
        </p>

        {/* 6 Feature Cards Grid (Obsidian 3x2 Layout) */}
        <div className="obsidian-features-grid">
          
          {/* Card 1: Advanced Anti-Crack & HWID Lock */}
          <div className="obsidian-feature-card obsidian-reveal obsidian-delay-1">
            <div className="obsidian-icon-box">
              <Laptop size={22} color="#38bdf8" />
            </div>
            <h3 className="obsidian-card-title">
              Hardware ID Fingerprinting
            </h3>
            <p className="obsidian-card-desc">
              Deep CPU, motherboard, BIOS, and physical disk hashing with automatic spoof detection. Locks licenses securely to single machines and prevents unauthorized distribution.
            </p>
          </div>

          {/* Card 2: Ed25519 Cryptographic Signatures */}
          <div className="obsidian-feature-card obsidian-reveal obsidian-delay-2">
            <div className="obsidian-icon-box">
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <h3 className="obsidian-card-title">
              Ed25519 Signed Handshakes
            </h3>
            <p className="obsidian-card-desc">
              Every server response is cryptographically signed using asymmetric elliptic-curve keys. Neutralizes Fiddler, Charles, HTTP debuggers, and man-in-the-middle packet forgery.
            </p>
          </div>

          {/* Card 3: Live Online Radar & Instant Kill */}
          <div className="obsidian-feature-card obsidian-reveal obsidian-delay-3">
            <div className="obsidian-icon-box">
              <Radio size={22} color="#f59e0b" />
            </div>
            <h3 className="obsidian-card-title">
              Live Online Radar & Instant Kill
            </h3>
            <p className="obsidian-card-desc">
              Live 30-second telemetry heartbeat monitoring. Terminate any active client process remotely with a single click, with persistent locks preventing restart attempts.
            </p>
          </div>

          {/* Card 4: Anti-Tamper & Binary Shield */}
          <div className="obsidian-feature-card obsidian-reveal obsidian-delay-4">
            <div className="obsidian-icon-box">
              <Lock size={22} color="#a855f7" />
            </div>
            <h3 className="obsidian-card-title">
              Anti-Tamper & Binary Shield
            </h3>
            <p className="obsidian-card-desc">
              Enforce mandatory SHA-256 executable integrity checks on launch. If malicious patching, debugging, or binary cracking is detected, user and HWID are automatically banned.
            </p>
          </div>

          {/* Card 5: High-Performance Multi-Language SDKs */}
          <div className="obsidian-feature-card obsidian-reveal obsidian-delay-5">
            <div className="obsidian-icon-box">
              <Code2 size={22} color="#ec4899" />
            </div>
            <h3 className="obsidian-card-title">
              High-Performance Native SDKs
            </h3>
            <p className="obsidian-card-desc">
              Production-ready, zero-dependency client libraries for C# (.NET Framework 4.5+ & Modern .NET), C++17, Python, Rust, Go, and Node.js with complete drop-in examples.
            </p>
          </div>

          {/* Card 6: Discord Webhooks & Real-time Logs */}
          <div className="obsidian-feature-card obsidian-reveal obsidian-delay-6">
            <div className="obsidian-icon-box">
              <Send size={22} color="#60a5fa" />
            </div>
            <h3 className="obsidian-card-title">
              Real-time Discord Webhooks
            </h3>
            <p className="obsidian-card-desc">
              Instantly track vital application actions with beautiful embeds for user registrations, license redemptions, HWID resets, tamper alerts, and administrative bans.
            </p>
          </div>

        </div>
      </section>



      {/* ── 4. OBSIDIAN-STYLE FAQ SECTION (SCROLL REVEAL) ────────────── */}
      <section className="obsidian-reveal" style={{ maxWidth: '960px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span className="obsidian-section-tag">FAQ</span>
          <h2 className="obsidian-section-title">
            Questions, answered
          </h2>
        </div>

        {/* Accordion Container */}
        <div className="obsidian-faq-container">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="obsidian-faq-row">
                <button
                  type="button"
                  className="obsidian-faq-btn"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      color: isOpen ? '#ffffff' : '#94a3b8',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      flexShrink: 0,
                      marginLeft: '14px'
                    }}
                  />
                </button>

                {isOpen && (
                  <div className="obsidian-faq-body">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. OBSIDIAN-STYLE FLOATING CTA BANNER (SCROLL REVEAL) ────── */}
      <section className="obsidian-reveal" style={{ maxWidth: '1060px', margin: '0 auto 110px', padding: '0 24px' }}>
        <div className="obsidian-cta-banner">
          
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 46px)',
            fontWeight: 900,
            letterSpacing: '-1.4px',
            color: '#ffffff',
            marginBottom: '14px'
          }}>
            Ready to upgrade your software security?
          </h2>

          <p style={{
            fontSize: '16px',
            color: '#94a3b8',
            maxWidth: '580px',
            margin: '0 auto 36px',
            lineHeight: 1.65
          }}>
            Join thousands of developers already using Habit Auth. Free forever, no credit card required.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={user ? () => onNavigate('dashboard') : onOpenLogin}
              className="obsidian-btn-primary"
              style={{ padding: '14px 34px', fontSize: '15px' }}
            >
              Start for Free <ArrowRight size={16} />
            </button>

            <a
              href="https://discord.gg/7JX63q4Aa"
              target="_blank"
              rel="noreferrer"
              className="obsidian-btn-secondary"
              style={{ padding: '14px 28px', fontSize: '15px', textDecoration: 'none' }}
            >
              Join Discord Support
            </a>
          </div>

        </div>
      </section>

    </div>
  );
}
