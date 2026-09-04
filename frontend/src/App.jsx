import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Pricing from './components/Pricing';
import DiscordPurchaseModal from './components/DiscordPurchaseModal';
import LoginModal from './components/LoginModal';
import PasswordResetModal from './components/PasswordResetModal';
import Dashboard from './pages/Dashboard';
import Documentation from './pages/Documentation';
import SystemStatus from './pages/SystemStatus';
import SystemNoticeBanner from './components/SystemNoticeBanner';
import Footer from './components/Footer';
import AnimatedDarkWaves from './components/AnimatedDarkWaves';
import { Shield, MessageSquare, Terminal } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('habit_user');
      const storedToken = localStorage.getItem('habit_token');
      if (storedUser && storedToken) {
        return JSON.parse(storedUser);
      }
    } catch (e) {}
    return null;
  });

  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/docs')) return 'docs';
    if (path.startsWith('/status')) return 'status';

    const storedUser = localStorage.getItem('habit_user');
    const storedToken = localStorage.getItem('habit_token');
    if (storedUser && storedToken) {
      return 'dashboard';
    }

    const saved = localStorage.getItem('habit_current_view');
    if (saved === 'dashboard' && (!storedUser || !storedToken)) {
      return 'landing';
    }
    return saved || 'landing';
  });

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState('signin');
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState(null);

  // Password reset token detection from query params or route
  const [resetToken, setResetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('reset_token') || params.get('token') || (window.location.pathname.startsWith('/reset-password') ? params.get('token') : null);
  });

  const [bannedInfo, setBannedInfo] = useState({ isBanned: false, reason: '' });

  const handleOpenLogin = (tab = 'signin') => {
    setBannedInfo({ isBanned: false, reason: '' });
    setLoginModalTab(tab);
    setLoginModalOpen(true);
  };

  // Ensure permanent dark obsidian theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('habit_theme', 'dark');
  }, []);

  // Restore session or process OAuth query parameter on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('habit_user');
    const storedToken = localStorage.getItem('habit_token');
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        // Instantly refresh profile & plan tier from backend on reload
        fetch('/api/v1/auth/profile', {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
          .then(r => r.json())
          .then(data => {
            if (data.success && data.user) {
              const refreshed = { ...parsed, ...data.user };
              setUser(refreshed);
              localStorage.setItem('habit_user', JSON.stringify(refreshed));
            } else if (!data.success || data.code === 'ACCOUNT_BANNED' || data.message === 'Session expired or revoked.') {
              localStorage.removeItem('habit_user');
              localStorage.removeItem('habit_token');
              setUser(null);
              if (data.code === 'ACCOUNT_BANNED') {
                setBannedInfo({ isBanned: true, reason: data.ban_reason || 'Violation of platform Terms of Service.' });
                setLoginModalOpen(true);
              }
            }
          })
          .catch(() => {});
      } catch (e) {
        localStorage.removeItem('habit_user');
        localStorage.removeItem('habit_token');
      }
    }

    // Process Discord OAuth query return
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const stepParam = urlParams.get('step');
    const errorParam = urlParams.get('error');

    if (errorParam === 'account_banned') {
      localStorage.removeItem('habit_user');
      localStorage.removeItem('habit_token');
      setUser(null);
      const reason = urlParams.get('reason') || 'Violation of platform Terms of Service.';
      setBannedInfo({ isBanned: true, reason });
      setLoginModalOpen(true);
      window.history.replaceState({}, document.title, '/');
    }

    if (stepParam === 'auth_success' && tokenParam) {
      localStorage.setItem('habit_token', tokenParam);
      fetch('/api/v1/auth/profile', {
        headers: { Authorization: `Bearer ${tokenParam}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setUser(data.user);
            localStorage.setItem('habit_user', JSON.stringify(data.user));
            setCurrentView('dashboard');
            localStorage.setItem('habit_current_view', 'dashboard');
          }
        });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'dashboard' && !user) {
      setCurrentView('landing');
      localStorage.setItem('habit_current_view', 'landing');
    } else {
      localStorage.setItem('habit_current_view', currentView);
    }
  }, [currentView, user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
    localStorage.setItem('habit_current_view', 'dashboard');
  };

  const handleLogout = () => {
    const token = localStorage.getItem('habit_token');
    if (token) {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    localStorage.removeItem('habit_token');
    localStorage.removeItem('habit_user');
    setUser(null);
    setCurrentView('landing');
    window.history.pushState({}, '', '/');
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlanForPurchase(plan);
    setPurchaseModalOpen(true);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/docs')) {
        setCurrentView('docs');
      } else if (path.startsWith('/status')) {
        setCurrentView('status');
      } else if (path === '/' || path === '/pricing') {
        setCurrentView('landing');
      } else if (user) {
        setCurrentView('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const [docsInitialTab, setDocsInitialTab] = useState(() => {
    return localStorage.getItem('habit_docs_tab') || 'getting-started';
  });

  const handleNavigate = (view, extra, targetTab) => {
    if (view === 'dashboard' && !user) {
      setLoginModalOpen(true);
      return;
    }
    if (view === 'docs') {
      if (targetTab) {
        setDocsInitialTab(targetTab);
        localStorage.setItem('habit_docs_tab', targetTab);
      }
      window.history.pushState(null, '', '/docs');
    } else if (view === 'status') {
      window.history.pushState(null, '', '/status');
    } else if (view === 'landing') {
      window.history.pushState(null, '', '/');
    } else if (view === 'dashboard') {
      const nav = localStorage.getItem('habit_active_nav') || 'overview';
      window.history.pushState(null, '', `/${nav}`);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // IF USER IS IN DASHBOARD MODE: SHOW FULLSCREEN DEDICATED SIDEBAR DASHBOARD
  if (currentView === 'dashboard' && user) {
    return (
      <div style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'transparent' }} className="font-sans">
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onBackToLanding={() => handleNavigate('landing')}
          onUpgradeClick={(targetPlan) => {
            const isProTarget = targetPlan === 'pro' || (targetPlan !== 'developer' && user?.plan === 'developer');
            if (isProTarget) {
              handleSelectPlan({
                id: 'pro',
                name: 'PRO DEVELOPER',
                price: '3.20',
                billing: 'per month'
              });
            } else {
              handleSelectPlan({
                id: 'developer',
                name: 'DEVELOPER',
                price: '1.20',
                billing: 'per month'
              });
            }
          }}
        />

        <DiscordPurchaseModal
          isOpen={purchaseModalOpen}
          onClose={() => setPurchaseModalOpen(false)}
          selectedPlan={selectedPlanForPurchase}
        />
      </div>
    );
  }

  // DEDICATED FULLSCREEN DOCUMENTATION VIEW (KEYAUTH-STYLE 3-COLUMN INDEPENDENT SCROLL)
  if (currentView === 'docs') {
    return (
      <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: 'transparent' }}>
        <Documentation 
          initialTab={docsInitialTab}
          onBack={() => handleNavigate('landing')}
          onOpenDashboard={() => handleNavigate('dashboard')}
          onNavigate={handleNavigate}
          user={user}
          onOpenLogin={() => setLoginModalOpen(true)}
        />

        {/* Modals */}
        <LoginModal
          isOpen={loginModalOpen}
          initialTab={loginModalTab}
          initialBannedInfo={bannedInfo}
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />

        <PasswordResetModal
          isOpen={Boolean(resetToken)}
          token={resetToken}
          onClose={() => {
            setResetToken(null);
            window.history.replaceState({}, document.title, '/');
          }}
          onLoginClick={() => {
            setResetToken(null);
            window.history.replaceState({}, document.title, '/');
            handleOpenLogin('signin');
          }}
        />

        <DiscordPurchaseModal
          isOpen={purchaseModalOpen}
          onClose={() => setPurchaseModalOpen(false)}
          selectedPlan={selectedPlanForPurchase}
        />
      </div>
    );
  }

  // OTHERWISE: SHOW CLEAN DEVELOPER SAAS WEBSITE
  return (
    <div className="landing-page-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AnimatedDarkWaves />
      <Navbar
        user={user}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        currentView={currentView}
      />

      <main style={{ flex: 1, paddingTop: '88px' }}>
        {currentView === 'landing' && (
          <div>
            <Hero
              user={user}
              onOpenLogin={handleOpenLogin}
              onExplorePricing={() => {
                const el = document.getElementById('pricing');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onNavigate={handleNavigate}
            />
            <Pricing
              user={user}
              onSelectPlan={handleSelectPlan}
              onOpenLogin={handleOpenLogin}
              onNavigate={handleNavigate}
            />
          </div>
        )}

        {currentView === 'status' && (
          <SystemStatus onBack={() => setCurrentView('landing')} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        initialTab={loginModalTab}
        initialBannedInfo={bannedInfo}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <PasswordResetModal
        isOpen={Boolean(resetToken)}
        token={resetToken}
        onClose={() => {
          setResetToken(null);
          window.history.replaceState({}, document.title, '/');
        }}
        onLoginClick={() => {
          setResetToken(null);
          window.history.replaceState({}, document.title, '/');
          handleOpenLogin('signin');
        }}
      />

      <DiscordPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        selectedPlan={selectedPlanForPurchase}
      />
    </div>
  );
}
