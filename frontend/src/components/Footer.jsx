import React, { useState, useEffect } from 'react';
import { Shield, MessageSquare, Mail, ExternalLink, Code2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Footer({ onNavigate }) {
  const { t, language } = useLanguage();
  const [socials, setSocials] = useState({
    discord: 'https://discord.gg/7JX63q4Aa',
    github: 'https://github.com'
  });

  useEffect(() => {
    fetch('/api/v1/system/config')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.config) {
          setSocials({
            discord: data.config.discord_invite_url || 'https://discord.gg/7JX63q4Aa',
            github: data.config.github_url || 'https://github.com'
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLinkClick = (e, view, extra) => {
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      onNavigate(view, extra);
      if (extra === 'pricing') {
        setTimeout(() => {
          const el = document.getElementById('pricing');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  return (
    <footer className="scroll-reveal obsidian-reveal" style={{
      maxWidth: '1240px',
      margin: '0 auto 60px',
      padding: '0 24px',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Modern Frosted Glass Footer Card */}
      <div style={{
        background: 'rgba(18, 20, 26, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '48px 44px 30px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      }}>
        
        {/* Top 3-Column Section */}
        <div className="footer-grid">
          
          {/* Column 1: Brand, Description, Socials */}
          <div>
            {/* Logo without Shield Icon */}
            <div className="flex-align" style={{ gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Habit Auth
              </span>
            </div>

            {/* Description */}
            <p style={{
              fontSize: '13.5px',
              color: '#94a3b8',
              lineHeight: 1.65,
              maxWidth: '380px',
              marginBottom: '20px'
            }}>
              {t('footerDesc')}
            </p>

            {/* Operational Status Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '11.5px',
              fontWeight: 700,
              marginBottom: '22px'
            }}>
              <span className="pulse-dot-green" style={{ width: '6px', height: '6px' }} />
              <span>{t('footerStatusLive')}</span>
            </div>

            {/* Social Icon Pills */}
            <div className="flex-align" style={{ gap: '10px' }}>
              <a
                href={socials.github}
                target="_blank"
                rel="noreferrer"
                title="GitHub"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.75)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Code2 size={16} />
              </a>

              <a
                href={socials.discord}
                target="_blank"
                rel="noreferrer"
                title="Discord Community"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.75)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <MessageSquare size={16} />
              </a>

              <a
                href="mailto:support@habitauth.com"
                title="Email Support"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.75)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', marginBottom: '18px', letterSpacing: '0.2px' }}>
              {t('footerPlatform')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {[
                { label: t('navHome'), href: '/', action: (e) => handleLinkClick(e, 'landing') },
                { label: t('navDocs'), href: '/docs', action: (e) => handleLinkClick(e, 'docs') },
                { label: t('navPremium'), href: '/#pricing', action: (e) => handleLinkClick(e, 'landing', 'pricing') },
                { label: t('navStatus'), href: '/status', action: (e) => handleLinkClick(e, 'status') },
                { label: t('navSupport'), href: socials.discord, isExternal: true },
                { label: t('navDashboard'), href: '/overview', action: (e) => handleLinkClick(e, 'dashboard') }
              ].map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  onClick={link.action}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noreferrer' : undefined}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'none',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: Resources & Legal */}
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', marginBottom: '18px', letterSpacing: '0.2px' }}>
              {t('footerResources')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {[
                { label: t('moreApiEndpoints'), href: '/docs', action: (e) => handleLinkClick(e, 'docs') },
                { label: t('moreSdkIntegrations'), href: '/docs', action: (e) => handleLinkClick(e, 'docs') },
                { label: t('moreSecurityHardening'), href: '/docs', action: (e) => handleLinkClick(e, 'docs') },
                { label: t('footerLegal'), href: '/docs', action: (e) => handleLinkClick(e, 'docs') },
                { label: t('navSupport'), href: 'mailto:support@habitauth.com', isExternal: true }
              ].map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  onClick={link.action}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'none',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12.5px',
          color: '#64748b',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            © 2026 Habit Auth. {t('footerRights')}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#94a3b8' }}>
            v1.4.0 • Zero-Trust Production Ready
          </div>
        </div>

      </div>
    </footer>
  );
}
