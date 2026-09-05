import React from 'react';
import { ArrowUpRight, Terminal, Sparkles } from 'lucide-react';

export default function LanguageTicker({ onNavigate }) {
  const languages = [
    {
      id: 'csharp',
      name: 'C# / .NET',
      tag: 'WinForms / WPF / .NET 9',
      color: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.18)',
      borderColor: 'rgba(168, 85, 247, 0.35)',
      badge: 'Zero-Dep',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <path fill="#512bd4" d="M64 5.3L114.7 34.6v58.8L64 122.7 13.3 93.4V34.6z"/>
          <path fill="#ffffff" d="M79.2 46.5c-4.2-4.5-9.8-6.8-16.8-6.8-5.3 0-9.8 1.4-13.6 4.3-3.8 2.9-6.6 6.8-8.4 11.7-1.8 4.9-2.7 10.3-2.7 16.2 0 6.6 1 12.3 3.1 17.1 2.1 4.8 5 8.5 8.9 11.2 3.9 2.7 8.3 4 13.3 4 6.9 0 12.4-2.2 16.5-6.6l6.2 8.7c-6.1 5.9-14 8.8-23.7 8.8-7.3 0-13.8-1.9-19.4-5.6-5.6-3.7-9.8-9-12.7-15.7-2.9-6.7-4.3-14.5-4.3-23.4 0-8.5 1.5-16.1 4.4-22.9 3-6.8 7.3-12.2 13-16.1 5.7-3.9 12.3-5.9 19.8-5.9 9.6 0 17.5 3 23.6 9.1l-7.6 10.1zm22.4 8.7h5.8l-1.8 10.2h8.7v4.6h-9.5l-1.9 10.4h8.3v4.6h-9.1l-2 11.2h-5.4l2-11.2h-9.2l-2 11.2h-5.4l2-11.2h-7.8v-4.6h8.6l1.9-10.4h-8.2v-4.6h9l1.8-10.2h5.4l-1.8 10.2h9.2l1.8-10.2zm-4.3 14.8h-9.2l-1.9 10.4h9.2l1.9-10.4z"/>
        </svg>
      )
    },
    {
      id: 'cpp',
      name: 'C++ Native',
      tag: 'WinINet / Anti-Tamper',
      color: '#00599c',
      bgGlow: 'rgba(0, 89, 156, 0.22)',
      borderColor: 'rgba(0, 89, 156, 0.45)',
      badge: 'C++17 / Native',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <path fill="#00599C" d="M64 5.3L114.7 34.6v58.8L64 122.7 13.3 93.4V34.6z"/>
          <path fill="#004482" d="M64 13.3L107.8 38.6v50.8L64 114.7 20.2 89.4V38.6z"/>
          <path fill="#ffffff" d="M65.4 46.8c-4.1-4.4-9.5-6.6-16.3-6.6-5.1 0-9.6 1.4-13.3 4.2-3.7 2.8-6.4 6.6-8.2 11.4-1.8 4.8-2.6 10-2.6 15.7 0 6.4 1 12 2.9 16.6 2 4.6 4.9 8.2 8.7 10.8 3.8 2.6 8.1 3.9 13 3.9 6.7 0 12.1-2.1 16-6.4l6.1 8.5c-6 5.7-13.6 8.5-23 8.5-7.1 0-13.4-1.8-18.8-5.4-5.4-3.6-9.5-8.7-12.3-15.2-2.8-6.5-4.2-14.1-4.2-22.7 0-8.2 1.5-15.6 4.3-22.2 2.9-6.6 7.1-11.8 12.6-15.6 5.5-3.8 11.9-5.7 19.2-5.7 9.3 0 17 2.9 23 8.8l-7.5 9.8zm23.6 12.3h5.7v10.5h10.5v5.7H94.7v10.5H89V75.3H78.5v-5.7H89V59.1zm22.4 0h5.7v10.5h10.5v5.7h-10.5v10.5h-5.7V75.3h-10.5v-5.7h10.5V59.1z"/>
        </svg>
      )
    },
    {
      id: 'python',
      name: 'Python',
      tag: 'Cross-Platform / 3.8+',
      color: '#ffd438',
      bgGlow: 'rgba(255, 212, 56, 0.18)',
      borderColor: 'rgba(255, 212, 56, 0.4)',
      badge: 'Requests / Py3',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <path fill="#3776AB" d="M63.5 8c-27.9 0-26.2 12.1-26.2 12.1l.03 12.5h26.7v3.8H26.3S8 34.3 8 62.5c0 28.2 16 27.2 16 27.2h9.5v-13.4s-.5-16 15.7-16h27.1s15.2.2 15.2-14.7V22.7S93.2 8 63.5 8zm-14.6 8.3a4.4 4.4 0 1 1 0 8.9 4.4 4.4 0 0 1 0-8.9z"/>
          <path fill="#FFD438" d="M64.5 120c27.9 0 26.2-12.1 26.2-12.1l-.03-12.5H64v-3.8h37.7s18.3 2.1 18.3-26.1c0-28.2-16-27.2-16-27.2h-9.5v13.4s.5 16-15.7 16H51.7s-15.2-.2-15.2 14.7v21.9s-1.7 14.7 28 14.7zm14.6-8.3a4.4 4.4 0 1 1 0-8.9 4.4 4.4 0 0 1 0 8.9z"/>
        </svg>
      )
    },
    {
      id: 'rust',
      name: 'Rust',
      tag: 'Memory Safe / High-Speed',
      color: '#f74c00',
      bgGlow: 'rgba(247, 76, 0, 0.2)',
      borderColor: 'rgba(247, 76, 0, 0.45)',
      badge: 'Native Binaries',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <circle cx="64" cy="64" r="58" fill="#1b1d24" stroke="#f74c00" strokeWidth="6"/>
          <path fill="#f74c00" d="M64 24c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40zm-9 62H45V42h19c11 0 18 6 18 15s-6 15-16 15l16 14H70L56 72h-1v14zm0-24h9c5 0 8-3 8-7s-3-7-8-7h-9v14z"/>
        </svg>
      )
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      tag: 'Node.js / Web / Electron',
      color: '#f7df1e',
      bgGlow: 'rgba(247, 223, 30, 0.18)',
      borderColor: 'rgba(247, 223, 30, 0.4)',
      badge: 'ES6+ / Web',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <rect width="128" height="128" rx="20" fill="#F7DF1E"/>
          <path d="M33 103.5l14-8.5c3 5.4 6.8 9.5 13.5 9.5 6.8 0 11.2-3.4 11.2-12.4v-47h17v47.2c0 17.5-10.2 25.7-27.5 25.7-14.8 0-23.7-7.7-28.2-14.5zm59.2-1.3l14.1-8.2c4.1 6.8 9.6 11.8 18.5 11.8 7.7 0 12.6-3.9 12.6-9.3 0-6.4-5.2-8.7-14.3-12.6l-4.9-2.1c-14.1-6-23.4-13.6-23.4-29.6 0-14.7 11.4-25.9 28.9-25.9 12.6 0 21.6 4.5 27.8 15.5l-13.5 8.7c-3.2-5.7-7.2-8.4-14.3-8.4-6.6 0-11.1 3.6-11.1 8.4 0 5.9 4.3 8.2 13 11.9l4.9 2.1c16.6 7.1 25.1 14.3 25.1 30.5 0 17.3-13.6 27.1-31.4 27.1-17.5 0-28.2-8.6-33.5-19.9z"/>
        </svg>
      )
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      tag: 'Strict Typing / Modern',
      color: '#3178c6',
      bgGlow: 'rgba(49, 120, 198, 0.22)',
      borderColor: 'rgba(49, 120, 198, 0.45)',
      badge: 'Strict Types',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <rect width="128" height="128" rx="20" fill="#3178C6"/>
          <path fill="#ffffff" d="M22 41.5h48v13.6H51v51.4H35V55.1H22V41.5zm53.4 46.8l14.1-8.2c4.1 6.8 9.6 11.8 18.5 11.8 7.7 0 12.6-3.9 12.6-9.3 0-6.4-5.2-8.7-14.3-12.6l-4.9-2.1c-14.1-6-23.4-13.6-23.4-29.6 0-14.7 11.4-25.9 28.9-25.9 12.6 0 21.6 4.5 27.8 15.5l-13.5 8.7c-3.2-5.7-7.2-8.4-14.3-8.4-6.6 0-11.1 3.6-11.1 8.4 0 5.9 4.3 8.2 13 11.9l4.9 2.1c16.6 7.1 25.1 14.3 25.1 30.5 0 17.3-13.6 27.1-31.4 27.1-17.5 0-28.2-8.6-33.5-19.9z"/>
        </svg>
      )
    },
    {
      id: 'go',
      name: 'Go (Golang)',
      tag: 'Microservices / High-Perf',
      color: '#00add8',
      bgGlow: 'rgba(0, 173, 216, 0.2)',
      borderColor: 'rgba(0, 173, 216, 0.45)',
      badge: 'Concurrency',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <path fill="#00ADD8" d="M14.5 54.3c1.4-2.8 4.2-6.5 8.6-10.7 7.7-7.3 17.5-11.8 28.8-11.8 22.8 0 37.1 16.5 37.1 38.3 0 21.4-14.6 38.2-37.4 38.2-12.8 0-23.2-5.1-30.8-13.8L32.2 82c5.3 5.9 11.9 9.3 19.3 9.3 13.7 0 21.8-10.4 21.8-24.2 0-13.5-8.2-24.1-21.6-24.1-7.8 0-13.9 3.6-17.5 8.6h17.5v13.6H14.5V54.3zm85.2-22.5c20.4 0 35.8 15.6 35.8 38.3 0 22.5-15.4 38.2-35.8 38.2s-35.8-15.6-35.8-38.2c0-22.7 15.4-38.3 35.8-38.3zm0 63c11.6 0 20.3-9.9 20.3-24.7s-8.7-24.7-20.3-24.7-20.3 9.9-20.3 24.7c0 14.9 8.7 24.7 20.3 24.7z"/>
        </svg>
      )
    },
    {
      id: 'react',
      name: 'React / Next.js',
      tag: 'Frontend Auth Hooks',
      color: '#61dafb',
      bgGlow: 'rgba(97, 218, 251, 0.2)',
      borderColor: 'rgba(97, 218, 251, 0.4)',
      badge: 'Hooks & SPA',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <ellipse cx="64" cy="64" rx="14" ry="14" fill="#61DAFB"/>
          <g stroke="#61DAFB" strokeWidth="6" fill="none">
            <ellipse cx="64" cy="64" rx="54" ry="20"/>
            <ellipse cx="64" cy="64" rx="54" ry="20" transform="rotate(60 64 64)"/>
            <ellipse cx="64" cy="64" rx="54" ry="20" transform="rotate(120 64 64)"/>
          </g>
        </svg>
      )
    },
    {
      id: 'nodejs',
      name: 'Node.js',
      tag: 'Backend & Serverless',
      color: '#68a063',
      bgGlow: 'rgba(104, 160, 99, 0.2)',
      borderColor: 'rgba(104, 160, 99, 0.45)',
      badge: 'npm / ESM',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <path fill="#68A063" d="M64 5.3L114.7 34.6v58.8L64 122.7 13.3 93.4V34.6z"/>
          <path fill="#303030" d="M64 15.3L105.7 39.6v48.8L64 112.7 22.3 88.4V39.6z"/>
          <path fill="#ffffff" d="M64 36l30 17.3v34.7L64 105.3 34 88V53.3L64 36zm0 12L44 60v23.1L64 94.6l20-11.5V60L64 48z"/>
        </svg>
      )
    },
    {
      id: 'php',
      name: 'PHP',
      tag: 'Web Services & APIs',
      color: '#777bb4',
      bgGlow: 'rgba(119, 123, 180, 0.22)',
      borderColor: 'rgba(119, 123, 180, 0.45)',
      badge: 'cURL / REST',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <ellipse cx="64" cy="64" rx="58" ry="34" fill="#777BB4"/>
          <ellipse cx="64" cy="64" rx="50" ry="28" fill="#4F5B93"/>
          <text x="64" y="74" textAnchor="middle" fill="#ffffff" fontSize="32" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">PHP</text>
        </svg>
      )
    },
    {
      id: 'electron',
      name: 'Electron',
      tag: 'Cross-Platform Desktop',
      color: '#47848f',
      bgGlow: 'rgba(71, 132, 143, 0.22)',
      borderColor: 'rgba(71, 132, 143, 0.45)',
      badge: 'Desktop App',
      svg: (
        <svg viewBox="0 0 128 128" width="28" height="28">
          <circle cx="64" cy="64" r="56" fill="#1b1e2e" stroke="#47848F" strokeWidth="4"/>
          <circle cx="64" cy="64" r="10" fill="#47848F"/>
          <ellipse cx="64" cy="64" rx="46" ry="16" fill="none" stroke="#47848F" strokeWidth="4" transform="rotate(30 64 64)"/>
          <ellipse cx="64" cy="64" rx="46" ry="16" fill="none" stroke="#47848F" strokeWidth="4" transform="rotate(90 64 64)"/>
          <ellipse cx="64" cy="64" rx="46" ry="16" fill="none" stroke="#47848F" strokeWidth="4" transform="rotate(150 64 64)"/>
        </svg>
      )
    },
    {
      id: 'rest',
      name: 'cURL / REST API',
      tag: 'Any Language / HTTP',
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.2)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      badge: 'Universal HTTP',
      svg: (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <Terminal size={17} strokeWidth={2.5} />
        </div>
      )
    }
  ];

  // Double list for infinite smooth marquee
  const tickerItems = [...languages, ...languages];

  return (
    <section className="obsidian-reveal is-visible" style={{
      position: 'relative',
      width: '100%',
      padding: '45px 0 65px',
      overflow: 'hidden',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      background: 'linear-gradient(180deg, rgba(8, 10, 16, 0.5) 0%, rgba(13, 16, 26, 0.8) 50%, rgba(8, 10, 16, 0.5) 100%)'
    }}>
      {/* Background Subtle Cyber Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '240px',
        background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.09) 0%, rgba(168, 85, 247, 0.05) 50%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Section Header */}
      <div style={{
        textAlign: 'center',
        maxWidth: '750px',
        margin: '0 auto 28px',
        padding: '0 20px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          color: '#60a5fa',
          fontSize: '11.5px',
          fontWeight: 800,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '12px'
        }}>
          <Sparkles size={12} color="#60a5fa" />
          <span>Universal Ecosystem</span>
        </div>

        <h2 style={{
          fontSize: 'clamp(22px, 3.2vw, 34px)',
          fontWeight: 900,
          letterSpacing: '-0.8px',
          color: '#ffffff',
          marginBottom: '8px',
          lineHeight: 1.2
        }}>
          Integrate into any programming language
        </h2>

        <p style={{
          fontSize: '14.5px',
          color: '#94a3b8',
          lineHeight: 1.5,
          margin: 0
        }}>
          Battle-tested, zero-dependency official client SDKs and cryptographic wrappers ready to drop into your software in minutes.
        </p>
      </div>

      {/* Marquee Ticker Track Container */}
      <div className="habit-marquee-container" style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        padding: '14px 0',
        zIndex: 2
      }}>
        {/* Left Edge Fade Mask */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '160px',
          background: 'linear-gradient(to right, #07090e 20%, rgba(7, 9, 14, 0.8) 50%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none'
        }} />

        {/* Right Edge Fade Mask */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '160px',
          background: 'linear-gradient(to left, #07090e 20%, rgba(7, 9, 14, 0.8) 50%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none'
        }} />

        {/* Scrolling Inner Track */}
        <div className="habit-marquee-track">
          {tickerItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => onNavigate && onNavigate('docs')}
              className="habit-lang-card"
              style={{
                '--brand-glow': item.bgGlow,
                '--brand-border': item.borderColor
              }}
              title={`View ${item.name} SDK Documentation`}
            >
              {/* Logo / Icon */}
              <div className="habit-lang-icon-wrapper" style={{
                filter: `drop-shadow(0 0 10px ${item.color}40)`
              }}>
                {item.svg}
              </div>

              {/* Title & Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.2px'
                  }}>
                    {item.name}
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: item.bgGlow,
                    color: item.color,
                    border: `1px solid ${item.borderColor}`
                  }}>
                    {item.badge}
                  </span>
                </div>

                <span style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  fontWeight: 500
                }}>
                  {item.tag}
                </span>
              </div>

              {/* Arrow link icon */}
              <div className="habit-lang-arrow">
                <ArrowUpRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Sub-Action */}
      <div style={{
        textAlign: 'center',
        marginTop: '22px',
        position: 'relative',
        zIndex: 2
      }}>
        <button
          onClick={() => onNavigate && onNavigate('docs')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: '#60a5fa',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '6px 14px',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#60a5fa';
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          <span>Browse all code snippets & drop-in templates</span>
          <ArrowUpRight size={15} />
        </button>
      </div>

      {/* Scoped CSS Styles for 60fps Smooth Marquee Animation */}
      <style>{`
        .habit-marquee-container {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .habit-marquee-track {
          display: flex;
          gap: 16px;
          width: max-content;
          animation: habitInfiniteScroll 42s linear infinite;
        }

        .habit-marquee-track:hover {
          animation-play-state: paused;
        }

        @keyframes habitInfiniteScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .habit-lang-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 18px;
          border-radius: 14px;
          background: rgba(18, 22, 34, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          cursor: pointer;
          user-select: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          white-space: nowrap;
        }

        .habit-lang-card:hover {
          transform: translateY(-3px) scale(1.02);
          background: rgba(26, 32, 50, 0.95);
          border-color: var(--brand-border, rgba(59, 130, 246, 0.5));
          box-shadow: 0 8px 30px var(--brand-glow, rgba(59, 130, 246, 0.25)), 0 0 15px var(--brand-glow, rgba(59, 130, 246, 0.2));
        }

        .habit-lang-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .habit-lang-card:hover .habit-lang-icon-wrapper {
          transform: scale(1.1) rotate(2deg);
        }

        .habit-lang-arrow {
          color: #64748b;
          margin-left: 6px;
          transition: all 0.2s ease;
          opacity: 0.6;
        }

        .habit-lang-card:hover .habit-lang-arrow {
          color: #ffffff;
          transform: translate(2px, -2px);
          opacity: 1;
        }

        @media (max-width: 768px) {
          .habit-marquee-track {
            animation-duration: 28s;
          }
          .habit-lang-card {
            padding: 8px 14px;
            gap: 10px;
          }
        }
      `}</style>
    </section>
  );
}
