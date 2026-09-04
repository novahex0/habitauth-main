import React from 'react';
import { MessageSquare, X, Shield, ArrowRight } from 'lucide-react';

export default function DiscordPurchaseModal({ isOpen, onClose, selectedPlan }) {
  if (!isOpen) return null;

  const discordInviteUrl = 'https://discord.gg/habitauth';

  return (
    <div className="modal-overlay animate-scale-in" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 6, 10, 0.82)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 1000
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#12141a',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '32px 30px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: '#94a3b8',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 10px',
            borderRadius: '999px'
          }}>
            Subscription Upgrade
          </span>
          <button
            onClick={onClose}
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
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'rgba(88, 101, 242, 0.15)',
          border: '1px solid rgba(88, 101, 242, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
          color: '#5865F2',
          boxShadow: '0 0 24px rgba(88, 101, 242, 0.2)'
        }}>
          <MessageSquare size={26} />
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.4px', marginBottom: '8px' }}>
          Discord Upgrade Portal
        </h3>

        <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.55, marginBottom: '22px' }}>
          Subscription licenses and automated delivery are processed securely through our official Discord server.
        </p>

        {selectedPlan && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px 18px',
            textAlign: 'left',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff' }}>{selectedPlan.name} PLAN</span>
              <span style={{ fontWeight: 800, fontSize: '15px', color: '#38bdf8' }}>${selectedPlan.price}/mo</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: 1.4 }}>
              {selectedPlan.name?.toLowerCase().includes('pro') 
                ? '1,000 Apps • 100,000 Users • Custom Key Masks • 500 Team Members • VIP Support'
                : '100 Apps • 10,000 Users • Instant HWID Locks • 24/7 Webhooks • Official SDKs'}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href={discordInviteUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              width: '100%',
              padding: '13px 20px',
              borderRadius: '12px',
              background: '#5865F2',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(88, 101, 242, 0.35)',
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
            <MessageSquare size={16} /> Join Official Discord
          </a>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
