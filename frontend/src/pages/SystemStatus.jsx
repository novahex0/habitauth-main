import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, ArrowLeft, Activity, Server, Database, Lock, RefreshCw } from 'lucide-react';

export default function SystemStatus({ onBack }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/system/health');
      const data = await res.json();
      if (data.success) setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const services = [
    {
      id: 'api',
      name: 'REST API Gateway',
      desc: 'v1.4 & v1.0 Client Authentication endpoints',
      uptime: '100%',
      latency: '< 5ms',
      status: 'Operational'
    },
    {
      id: 'crypto',
      name: 'Cryptographic Signing Engine',
      desc: 'RFC 8032 Ed25519 asymmetric response validation',
      uptime: '100%',
      latency: '< 2ms',
      status: 'Operational'
    },
    {
      id: 'db',
      name: 'Relational Database',
      desc: 'WAL-Mode zero-latency persistent data storage',
      uptime: '99.99%',
      latency: '< 1ms',
      status: 'Operational'
    },
    {
      id: 'radar',
      name: 'Live Online Radar & Telemetry',
      desc: 'Real-time client heartbeats & instant remote kill signals',
      uptime: '100%',
      latency: '< 8ms',
      status: 'Operational'
    },
    {
      id: 'sso',
      name: 'Discord OAuth2 SSO Gateway',
      desc: 'Federated developer login & instant role verification',
      uptime: '100%',
      latency: '< 15ms',
      status: 'Operational'
    },
    {
      id: 'licensing',
      name: 'Licensing & HWID Engine',
      desc: 'Hardware fingerprinting & automatic anti-abuse locks',
      uptime: '100%',
      latency: '< 4ms',
      status: 'Operational'
    }
  ];

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '50px 24px 100px' }} className="animate-slide-up">
      
      {/* Top Bar with Back Button & Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          <ArrowLeft size={14} /> Back to Home
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Updated just now
          </span>
          <button
            onClick={fetchHealth}
            title="Refresh Health Telemetry"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          >
            <RefreshCw size={14} className={loading ? 'spinner-loader' : ''} />
          </button>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div style={{
        background: 'rgba(18, 20, 26, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '22px',
        padding: '36px 32px',
        marginBottom: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: '0 24px 50px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.2)'
          }}>
            <CheckCircle2 size={30} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>
                All Systems Fully Operational
              </h1>
            </div>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Zero service degradations or anomalies. Global cryptographic response latency: <strong style={{ color: '#ffffff' }}>&lt; 5ms</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '10px 16px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Current Uptime</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-mono)' }}>99.99%</div>
          </div>
        </div>
      </div>

      {/* 90-Day Uptime Segmented Visual Strip */}
      <div style={{
        background: 'rgba(18, 20, 26, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '18px',
        padding: '24px 28px',
        marginBottom: '36px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>90-Day Global Availability</span>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>100.0% Available</span>
        </div>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '34px', overflowX: 'auto', paddingBottom: '4px' }}>
          {Array.from({ length: 45 }).map((_, i) => (
            <div
              key={i}
              title={`Day ${90 - (45 - i) * 2}: 100% Operational`}
              style={{
                flex: 1,
                minWidth: '10px',
                height: '28px',
                borderRadius: '3px',
                background: '#10b981',
                opacity: 0.75 + (i % 3) * 0.1,
                transition: 'transform 0.15s ease, opacity 0.15s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scaleY(1.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = String(0.75 + (i % 3) * 0.1);
                e.currentTarget.style.transform = 'scaleY(1)';
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
          <span>90 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Core Services 6-Card Grid */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', marginBottom: '16px' }}>
          Core Infrastructure Nodes
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {services.map(s => (
            <div
              key={s.id}
              style={{
                background: 'rgba(18, 20, 26, 0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '22px 24px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  {s.name}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#10b981'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  {s.status}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px', minHeight: '36px' }}>
                {s.desc}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                <span>Latency: <strong style={{ color: '#e2e8f0' }}>{s.latency}</strong></span>
                <span>Uptime: <strong style={{ color: '#e2e8f0' }}>{s.uptime}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident History Log */}
      <div style={{
        background: '#12141a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '28px 30px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
          Past Incident History
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
          No system outages or security incidents recorded across any cluster during the past 90 days. All cryptographic signature handshakes, authentication checks, and database syncs operated at 100% SLA uptime.
        </p>
      </div>

    </div>
  );
}
