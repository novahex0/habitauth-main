import React, { useState } from 'react';
import { CheckCircle2, Zap, Shield, Sparkles, ArrowRight, Star, Crown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Pricing({ onSelectPlan, onOpenLogin, user, onNavigate }) {
  const { t, language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  // Dynamic translated plan details based on current language
  const plansData = {
    en: [
      {
        id: 'free',
        name: 'Free',
        badge: 'Starter',
        price: '$0',
        rawPrice: '0',
        period: 'Forever free',
        description: 'Ideal for small utilities, hobby projects, and initial API testing.',
        features: [
          '1 Application included',
          '10 Users maximum limit',
          'Hardware (HWID) fingerprinting',
          'Unguessable license keys',
          'Basic dashboard analytics',
          'Standard community support'
        ],
        ctaText: 'Start for Free',
        popular: false,
        isFree: true,
        highlight: false,
        guarantee: 'Instant access • No card required'
      },
      {
        id: 'developer',
        name: 'Developer',
        badge: 'Most Popular',
        price: billingCycle === 'monthly' ? '$1.20' : '$12',
        rawPrice: billingCycle === 'monthly' ? '1.20' : '12',
        period: billingCycle === 'monthly' ? '/ month' : '/ year (save 17%)',
        description: 'Everything you need to secure, license, and distribute your software.',
        features: [
          '100 Applications',
          '10,000 Users & Licenses',
          'Instant HWID Lock & 1-Click Reset',
          '24/7 Discord Webhook Integrations',
          '24h Brute-Force Lockout Defense',
          'Telegram Bot Security Notifications',
          'Official C#, C++, Python, JS SDKs',
          'Standard community support'
        ],
        ctaText: 'Upgrade with Crypto / Pay',
        popular: true,
        isFree: false,
        highlight: true,
        guarantee: 'Instant Binance / Web3 delivery • 0 KYC'
      },
      {
        id: 'pro',
        name: 'Pro Developer',
        badge: 'Ultimate Power',
        price: billingCycle === 'monthly' ? '$3.20' : '$32',
        rawPrice: billingCycle === 'monthly' ? '3.20' : '32',
        period: billingCycle === 'monthly' ? '/ month' : '/ year (save 17%)',
        description: 'Maximum scale, custom branding, and priority infrastructure for commercial software.',
        features: [
          '1,000 Applications',
          '100,000 Users & Licenses',
          'Everything in Developer Plan',
          'Custom License Key Prefixes',
          '500+ Team Member Capacity',
          'Dedicated VIP Discord Role',
          'Telegram Bot Security Notifications',
          'Priority 24/7 VIP Support'
        ],
        ctaText: 'Get Pro Access',
        popular: false,
        isFree: false,
        highlight: false,
        guarantee: 'Commercial scale • Instant Binance / Web3 delivery • 0 KYC'
      }
    ],
    bn: [
      {
        id: 'free',
        name: 'ফ্রি',
        badge: 'স্টার্টার',
        price: '$০',
        rawPrice: '0',
        period: 'আজীবন ফ্রি',
        description: 'ছোট ইউটিলিটি, শখের প্রজেক্ট এবং প্রাথমিক এপিআই টেস্টিংয়ের জন্য আদর্শ।',
        features: [
          '১টি অ্যাপ্লিকেশন অন্তর্ভুক্ত',
          '১০ জন সর্বোচ্চ ইউজার লিমিট',
          'হার্ডওয়্যার (HWID) ফিঙ্গারপ্রিন্ট লক',
          'অনুমান-অযোগ্য লাইসেন্স কি',
          'বেসিক ড্যাশবোর্ড অ্যানালিটিক্স',
          'কমিউনিটি ডিসকর্ড সাপোর্ট'
        ],
        ctaText: 'বিনামূল্যে শুরু করুন',
        popular: false,
        isFree: true,
        highlight: false,
        guarantee: 'তাত্ক্ষণিক অ্যাক্সেস • কোনো কার্ড প্রয়োজন নেই'
      },
      {
        id: 'developer',
        name: 'ডেভেলপার',
        badge: 'সর্বাধিক জনপ্রিয়',
        price: billingCycle === 'monthly' ? '$১.২০' : '$১২',
        rawPrice: billingCycle === 'monthly' ? '1.20' : '12',
        period: billingCycle === 'monthly' ? '/ মাস' : '/ বছর (১৭% সাশ্রয়)',
        description: 'আপনার সফটওয়্যার সুরক্ষিত, লাইসেন্সিং ও ডিস্ট্রিবিউশনের জন্য প্রয়োজনীয় সবকিছু।',
        features: [
          '১০০টি অ্যাপ্লিকেশন',
          '১০,০০০ ইউজার ও লাইসেন্স',
          'তাত্ক্ষণিক HWID লক ও ১-ক্লিক রিসেট',
          '২৪/৭ ডিসকর্ড ওয়েবহুক ইন্টিগ্রেশন',
          '২৪ ঘণ্টা ব্রুট-ফোর্স লকআউট ডিফেন্স',
          'টেলিগ্রাম বট সিকিউরিটি নোটিফিকেশন',
          'অফিসিয়াল C#, C++, Python, JS SDKs',
          'স্ট্যান্ডার্ড কমিউনিটি সাপোর্ট'
        ],
        ctaText: 'ক্রিপ্টো / বাইন্যান্স দিয়ে নিন',
        popular: true,
        isFree: false,
        highlight: true,
        guarantee: 'তাত্ক্ষণিক বাইন্যান্স ও ওয়েব৩ ডেলিভারি • ০ KYC'
      },
      {
        id: 'pro',
        name: 'প্রো ডেভেলপার',
        badge: 'সর্বোচ্চ ক্ষমতা',
        price: billingCycle === 'monthly' ? '$৩.২০' : '$৩২',
        rawPrice: billingCycle === 'monthly' ? '3.20' : '32',
        period: billingCycle === 'monthly' ? '/ মাস' : '/ বছর (১৭% সাশ্রয়)',
        description: 'কমার্শিয়াল সফটওয়্যার ও বড় টিমের জন্য সর্বোচ্চ স্কেল, কাস্টম ব্র্যান্ডিং ও ভিআইপি সাপোর্ট।',
        features: [
          '১,০০০টি অ্যাপ্লিকেশন',
          '১,০০,০০০ ইউজার ও লাইসেন্স',
          'ডেভেলপার প্ল্যানের সমস্ত ফিচার',
          'কাস্টম লাইসেন্স কি প্রিফিক্স',
          '৫০০+ টিম মেম্বার ক্যাপাসিটি',
          'ডেডিকেটেড ভিআইপি ডিসকর্ড রোল',
          'টেলিগ্রাম বট সিকিউরিটি নোটিফিকেশন',
          'অগ্রাধিকারভিত্তিক ২৪/৭ ভিআইপি সাপোর্ট'
        ],
        ctaText: 'প্রো অ্যাক্সেস নিন',
        popular: false,
        isFree: false,
        highlight: false,
        guarantee: 'বাণিজ্যিক লাইসেন্স • তাত্ক্ষণিক বাইন্যান্স ও ওয়েব৩ অ্যাক্টিভেশন'
      }
    ]
  };

  const currentPlans = plansData[language] || plansData.en;

  return (
    <section id="pricing" className="scroll-reveal obsidian-reveal" style={{ padding: '90px 24px 120px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background ambient spotlight */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -25%)',
        width: '800px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(37, 99, 235, 0.08) 40%, transparent 75%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ maxWidth: '1240px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        
        {/* Top Header Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(18, 24, 38, 0.85)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#93c5fd',
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          <Sparkles size={14} /> {t('pricingBadge')}
        </div>

        {/* Section Heading */}
        <h2 style={{
          fontSize: 'clamp(32px, 4vw, 46px)',
          fontWeight: 900,
          letterSpacing: '-1.2px',
          color: '#ffffff',
          marginBottom: '12px'
        }}>
          {t('pricingTitle')}
        </h2>

        <p style={{
          fontSize: '15.5px',
          color: 'var(--text-secondary)',
          maxWidth: '620px',
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          {t('pricingSubtitle')}
        </p>

        {/* Billing Cycle Toggle */}
        <div className="keyauth-pricing-toggle">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`keyauth-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
          >
            {language === 'bn' ? 'মাসিক বিলিং' : 'Monthly Billing'}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`keyauth-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
          >
            {language === 'bn' ? 'বার্ষিক বিলিং' : 'Yearly Billing'}
            <span style={{
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '999px',
              background: billingCycle === 'yearly' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(59, 130, 246, 0.2)',
              color: billingCycle === 'yearly' ? '#ffffff' : '#60a5fa',
              fontWeight: 800
            }}>
              {language === 'bn' ? '২০% সেভ' : 'SAVE 20%'}
            </span>
          </button>
        </div>

        {/* 3-Column Modern KeyAuth Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px',
          alignItems: 'stretch'
        }}>
          {currentPlans.map((plan) => {
            const isFeatured = plan.highlight;

            return (
              <div
                key={plan.id}
                className={`keyauth-pricing-card ${isFeatured ? 'popular' : ''}`}
              >
                {/* Header row */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                      {plan.name}
                    </span>
                    <span className="keyauth-pricing-badge" style={{
                      background: plan.id === 'pro' ? 'rgba(245, 158, 11, 0.15)' : isFeatured ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      borderColor: plan.id === 'pro' ? 'rgba(245, 158, 11, 0.4)' : isFeatured ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.12)',
                      color: plan.id === 'pro' ? '#f59e0b' : isFeatured ? '#93c5fd' : '#94a3b8'
                    }}>
                      {plan.id === 'pro' && <Crown size={11} fill="#f59e0b" />}
                      {isFeatured && <Star size={11} fill="#60a5fa" />}
                      {plan.badge}
                    </span>
                  </div>

                  {/* Price Row */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{
                        fontSize: '50px',
                        fontWeight: 900,
                        letterSpacing: '-2px',
                        color: '#ffffff',
                        lineHeight: 1
                      }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: '13.5px', color: '#94a3b8', fontWeight: 600 }}>
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px', minHeight: '44px' }}>
                    {plan.description}
                  </p>

                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', marginBottom: '26px' }} />

                  {/* Features List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
                    {plan.features.map((feat, i) => {
                      const isPrefixFeat = feat.toLowerCase().includes('prefix') || feat.includes('প্রিফিক্স');
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', textAlign: 'left' }}>
                          {isPrefixFeat ? (
                            <Crown
                              size={16}
                              style={{
                                color: '#f59e0b',
                                flexShrink: 0,
                                marginTop: '2px'
                              }}
                              fill="#f59e0b"
                            />
                          ) : (
                            <CheckCircle2
                              size={16}
                              style={{
                                color: isFeatured ? '#38bdf8' : '#10b981',
                                flexShrink: 0,
                                marginTop: '2px'
                              }}
                            />
                          )}
                          <span style={{ fontSize: '13.5px', color: isPrefixFeat ? '#fcd34d' : '#e2e8f0', lineHeight: 1.5, fontWeight: isPrefixFeat ? 700 : 500 }}>
                            {feat}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card CTA Action Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (plan.isFree) {
                        if (user) {
                          if (onNavigate) onNavigate('dashboard');
                          else window.location.href = '/overview';
                        } else {
                          onOpenLogin();
                        }
                      } else {
                        if (!user) {
                          try {
                            sessionStorage.setItem('habit_pending_plan', JSON.stringify({
                              id: plan.id,
                              name: plan.name.toUpperCase(),
                              price: plan.rawPrice || plan.price.replace(/[^0-9.]/g, ''),
                              billing: plan.period,
                              billingCycle: billingCycle,
                              rawPrice: plan.rawPrice
                            }));
                          } catch (e) {}
                          onOpenLogin('signin');
                          return;
                        }
                        onSelectPlan({
                          id: plan.id,
                          name: plan.name.toUpperCase(),
                          price: plan.rawPrice || plan.price.replace(/[^0-9.]/g, ''),
                          billing: plan.period,
                          billingCycle: billingCycle,
                          rawPrice: plan.rawPrice
                        });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '13px 20px',
                      borderRadius: '999px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      border: isFeatured ? 'none' : '1px solid rgba(255, 255, 255, 0.14)',
                      background: isFeatured ? '#2563eb' : 'rgba(255, 255, 255, 0.06)',
                      color: '#ffffff',
                      boxShadow: isFeatured ? '0 8px 25px rgba(37, 99, 235, 0.45)' : 'none',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (isFeatured) {
                        e.currentTarget.style.background = '#1d4ed8';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.6)';
                      } else {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isFeatured) {
                        e.currentTarget.style.background = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.45)';
                      } else {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight size={15} />
                  </button>

                  <div style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textAlign: 'center',
                    marginTop: '12px'
                  }}>
                    {plan.guarantee}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
