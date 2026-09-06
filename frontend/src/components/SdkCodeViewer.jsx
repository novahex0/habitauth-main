import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Terminal, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { downloadSdkFile } from '../sdk/sdkConfig';

export default function SdkCodeViewer({ sdk, activeApp, onCopy, copiedKey }) {
  const [activeTab, setActiveTab] = useState('source'); // 'source' | 'example' | 'docs'

  const rawCode = sdk.sourceCode || '';
  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://habitauth.com';
  const apiBase = `${currentHost}/api/v1`;

  // Replace target placeholders with active app details if available
  const personalizedCode = (activeApp
    ? rawCode
        .replace(/DIMUXAPP_DEMO/g, activeApp.id)
        .replace(/TARGET_APP_ID/g, activeApp.id)
        .replace(/TARGET_APP_NAME/g, activeApp.app_name)
        .replace(/TARGET_APP_SECRET/g, activeApp.app_secret || '')
        .replace(/TARGET_PUBLIC_KEY/g, activeApp.public_key || '')
    : rawCode).replace(/https?:\/\/(localhost:5000|habitauth\.onrender\.com|habitauth\.com)\/api\/v1/g, apiBase);

  const personalizedExample = (activeApp
    ? sdk.usageExample
        .replace(/TARGET_APP_ID/g, activeApp.id)
        .replace(/TARGET_APP_NAME/g, activeApp.app_name)
        .replace(/TARGET_APP_SECRET/g, activeApp.app_secret || '')
        .replace(/TARGET_PUBLIC_KEY/g, activeApp.public_key || '')
    : sdk.usageExample).replace(/https?:\/\/(localhost:5000|habitauth\.onrender\.com|habitauth\.com)\/api\/v1/g, apiBase);

  const codeToDisplay = activeTab === 'example' ? personalizedExample : personalizedCode;
  const lines = codeToDisplay.split('\n');

  const handleDownload = () => {
    downloadSdkFile(sdk.filename, personalizedCode);
  };

  return (
    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
      {/* Code Viewer Top Bar */}
      <div className="flex-between" style={{
        padding: '14px 20px',
        background: 'rgba(10, 10, 18, 0.85)',
        borderBottom: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div className="flex-align" style={{ gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(168,85,247,0.15)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FileCode size={18} />
          </div>

          <div>
            <div className="flex-align" style={{ gap: '8px' }}>
              <span className="mono-text" style={{ fontWeight: 800, fontSize: '14px', color: '#fff' }}>
                {sdk.filename}
              </span>
              <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                v{sdk.version}
              </span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '10px' }}>
                {sdk.badge}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {sdk.description}
            </div>
          </div>
        </div>

        {/* View Mode Switcher & Actions */}
        <div className="flex-align" style={{ gap: '8px' }}>
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setActiveTab('source')}
              className={`btn ${activeTab === 'source' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 12px', fontSize: '11.5px', border: 'none' }}
            >
              <FileCode size={13} style={{ marginRight: '4px' }} /> Source
            </button>
            <button
              onClick={() => setActiveTab('example')}
              className={`btn ${activeTab === 'example' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 12px', fontSize: '11.5px', border: 'none' }}
            >
              <Terminal size={13} style={{ marginRight: '4px' }} /> Example Usage
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`btn ${activeTab === 'docs' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 12px', fontSize: '11.5px', border: 'none' }}
            >
              <BookOpen size={13} style={{ marginRight: '4px' }} /> Integration Guide
            </button>
          </div>

          <button
            onClick={() => onCopy(codeToDisplay, sdk.id + '_' + activeTab)}
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '12px' }}
            title="Copy code to clipboard"
          >
            {copiedKey === (sdk.id + '_' + activeTab) ? (
              <>
                <Check size={14} color="#10b981" style={{ marginRight: '6px' }} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} style={{ marginRight: '6px' }} />
                Copy Code
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="btn btn-primary"
            style={{ padding: '7px 14px', fontSize: '12px' }}
            title={`Download ${sdk.filename}`}
          >
            <Download size={14} style={{ marginRight: '6px' }} />
            Download {sdk.filename}
          </button>
        </div>
      </div>

      {/* Code Viewer Body */}
      {activeTab === 'docs' ? (
        <div style={{ padding: '28px', background: '#080811' }} className="animate-slide-up">
          <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px' }} className="flex-align">
            <ShieldCheck size={18} color="#a855f7" style={{ marginRight: '8px' }} />
            {sdk.name} Integration & Security Guide
          </h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            {sdk.docs.map((doc, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', padding: '16px 20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-light)', marginBottom: '6px' }}>
                  {i + 1}. {doc.title}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {doc.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          background: '#040409',
          fontSize: '12.5px',
          lineHeight: '1.7',
          fontFamily: 'var(--font-mono)',
          overflow: 'hidden'
        }}>
          {/* Line Numbers Column */}
          <div style={{
            userSelect: 'none',
            padding: '20px 14px 20px 18px',
            textAlign: 'right',
            color: 'rgba(255,255,255,0.22)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.3)',
            minWidth: '50px'
          }}>
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Source Code Content */}
          <pre style={{
            margin: 0,
            padding: '20px 24px',
            flexGrow: 1,
            color: '#e2e8f0',
            overflowX: 'auto'
          }}>
            <code>{codeToDisplay}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
