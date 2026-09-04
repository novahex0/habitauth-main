import React, { useState } from 'react';
import { AlertTriangle, X, Copy, Check, FileText } from 'lucide-react';

export default function CustomConfirmModal({ 
  isOpen, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  isDanger = true, 
  onConfirm, 
  onCancel 
}) {
  const [popupValue, setPopupValue] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parses message to detect quoted tokens or long unbroken strings and add 'more' buttons
  const renderFormattedMessage = (msg) => {
    if (typeof msg !== 'string') return msg;

    const regex = /('([^']+)'|"([^"]+)"|([^\s'"]{22,}))/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(msg)) !== null) {
      if (match.index > lastIndex) {
        elements.push(msg.substring(lastIndex, match.index));
      }

      const fullMatch = match[0];
      const isSingleQuoted = fullMatch.startsWith("'") && fullMatch.endsWith("'");
      const isDoubleQuoted = fullMatch.startsWith('"') && fullMatch.endsWith('"');
      const rawVal = match[2] || match[3] || match[4] || fullMatch;

      if (rawVal && rawVal.length > 20) {
        const quoteChar = isSingleQuoted ? "'" : isDoubleQuoted ? '"' : '';
        const truncated = `${quoteChar}${rawVal.slice(0, 16)}...${quoteChar}`;
        
        elements.push(
          <span key={match.index} style={{ display: 'inline', alignItems: 'center' }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontWeight: 700, 
              color: '#f87171',
              background: 'rgba(248, 113, 113, 0.08)',
              padding: '1px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              wordBreak: 'break-all',
              fontSize: '12.5px'
            }}>
              {truncated}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPopupValue(rawVal);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: '#60a5fa',
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '5px',
                marginRight: '4px',
                verticalAlign: 'middle',
                lineHeight: '1.4',
                transition: 'all 0.2s'
              }}
              title="Click to view full value in popup"
            >
              more
            </button>
          </span>
        );
      } else {
        elements.push(fullMatch);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < msg.length) {
      elements.push(msg.substring(lastIndex));
    }

    return elements;
  };

  return (
    <>
      <div className="modal-overlay animate-scale-in" style={{ zIndex: 10000 }}>
        <div 
          className="modal-content glass-panel" 
          style={{ 
            maxWidth: '460px', 
            width: '92%',
            padding: '28px', 
            border: isDanger ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-active)',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <div className="flex-align" style={{ gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDanger ? 'var(--danger)' : 'var(--primary)',
                flexShrink: 0
              }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{title}</h3>
            </div>
            <button className="icon-btn" onClick={onCancel}><X size={16} /></button>
          </div>

          <div style={{ 
            fontSize: '13.5px', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.7, 
            marginBottom: '24px',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          }}>
            {renderFormattedMessage(message)}
          </div>

          <div className="flex-align" style={{ justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: '12px' }}>
              {cancelText}
            </button>
            <button 
              type="button" 
              onClick={onConfirm} 
              className="btn btn-primary" 
              style={{ 
                padding: '9px 18px', 
                fontSize: '12px', 
                fontWeight: 800,
                background: isDanger ? 'var(--danger)' : 'var(--primary)',
                borderColor: isDanger ? 'var(--danger)' : 'var(--primary)',
                boxShadow: isDanger ? '0 0 15px rgba(239, 68, 68, 0.3)' : '0 0 15px var(--primary-glow)'
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* Detail Value Popup Modal */}
      {popupValue && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 10050, background: 'rgba(0, 0, 0, 0.75)' }} 
          onClick={() => setPopupValue(null)}
        >
          <div 
            className="modal-content glass-panel animate-scale-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '460px', 
              width: '90%', 
              padding: '24px', 
              border: '1px solid rgba(59, 130, 246, 0.4)', 
              borderRadius: '16px', 
              background: '#0a0a14',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div className="flex-between" style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <div className="flex-align" style={{ gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FileText size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Full Value Details
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Complete identifier string</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setPopupValue(null)}><X size={16} /></button>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '14px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#f87171',
              wordBreak: 'break-all',
              overflowWrap: 'anywhere',
              maxHeight: '180px',
              overflowY: 'auto',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              {popupValue}
            </div>

            <div className="flex-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleCopy(popupValue)}
                style={{ padding: '8px 16px', fontSize: '12px', gap: '6px' }}
              >
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Value'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPopupValue(null)}
                style={{ padding: '8px 20px', fontSize: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
