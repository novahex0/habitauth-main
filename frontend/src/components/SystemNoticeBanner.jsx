import React, { useState, useEffect } from 'react';
import { Bell, X, Wrench } from 'lucide-react';

export default function SystemNoticeBanner({ containerStyle = {} }) {
  const [config, setConfig] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/v1/system/config');
      const data = await res.json();
      if (data && data.success) {
        setConfig(data);
        // Unique token combining notice update timestamp and notice content
        const noticeToken = `${data.notice_updated_at || 0}_${data.announcement_notice || ''}`;
        const storedDismissedToken = localStorage.getItem('habit_dismissed_notice_token');

        // If the user previously dismissed this exact notice version, keep it hidden
        if (storedDismissedToken === noticeToken) {
          setDismissed(true);
        } else {
          // If the admin updated or published a new notice, show it!
          setDismissed(false);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, 10000); // Poll config every 10s
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    if (config) {
      const noticeToken = `${config.notice_updated_at || 0}_${config.announcement_notice || ''}`;
      localStorage.setItem('habit_dismissed_notice_token', noticeToken);
    }
    setDismissed(true);
  };

  if (!config) return null;

  // Format notice text to ensure "System Notice: " prefix if not already present
  let displayNotice = config.announcement_notice || '';
  if (displayNotice && !displayNotice.toLowerCase().startsWith('system notice:')) {
    displayNotice = `System Notice: ${displayNotice}`;
  }

  return (
    <>
      {/* 1. Maintenance Mode Critical Alert Bar */}
      {config.maintenance_mode && (
        <div style={{
          background: 'linear-gradient(90deg, #b91c1c 0%, #7f1d1d 100%)',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 2px 10px rgba(220, 38, 38, 0.4)',
          letterSpacing: '0.3px'
        }}>
          <Wrench size={16} className="animate-spin" style={{ animationDuration: '6s' }} />
          <span><b>MAINTENANCE MODE ACTIVE:</b> {config.maintenance_message}</span>
        </div>
      )}

      {/* 2. Sleek Purple Glowing Capsule Notification Banner (Inside Content View) */}
      {config.announcement_active && config.announcement_notice && !dismissed && (
        <div style={{
          width: '100%',
          marginBottom: '20px',
          boxSizing: 'border-box',
          ...containerStyle
        }}>
          <div style={{
            width: '100%',
            background: 'rgba(13, 10, 25, 0.85)',
            border: '1px solid rgba(168, 85, 247, 0.55)',
            boxShadow: '0 0 25px rgba(168, 85, 247, 0.22), inset 0 0 14px rgba(168, 85, 247, 0.06)',
            borderRadius: '11px',
            padding: '11px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} className="animate-slide-up">
            {/* Left Side: Purple Bell Icon & Text */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: 0,
              flex: 1
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bell size={16} color="#c084fc" strokeWidth={2} />
              </div>

              <span style={{
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                lineHeight: 1.5,
                letterSpacing: '-0.01em',
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
              }}>
                {displayNotice}
              </span>
            </div>

            {/* Right Side: Subtle Close Button */}
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(216, 180, 254, 0.65)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '6px',
                flexShrink: 0,
                transition: 'color 0.2s, background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(216, 180, 254, 0.65)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
