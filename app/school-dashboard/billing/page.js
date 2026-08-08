'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getISTDateString } from '../../../lib/supabase'
import confetti from 'canvas-confetti'
import {
  Gift, AlertTriangle, RefreshCw, CheckCircle2, ChevronLeft,
  ShieldCheck, Sparkles, X, HelpCircle, CreditCard, Clock, Zap
} from 'lucide-react'

const PLAN_META = {
  elite_monthly: { name: 'Elite Monthly', price: '₹5,000', priceNum: 5000,  limit: Infinity, color: '#D97706' },
  elite_yearly:  { name: 'Elite Yearly',  price: '₹50,000', priceNum: 50000, limit: Infinity, color: '#059669' },
  elite_custom:  { name: 'Elite Custom',  price: '₹178/day', priceNum: 178,  limit: Infinity, color: '#7C3AED' },
  elite:         { name: 'Elite',         price: '₹5,000', priceNum: 5000,  limit: Infinity, color: '#D97706' },
  starter:       { name: 'Starter',       price: '₹499',   priceNum: 499,   limit: 50,       color: '#5A6E85' },
  pro:           { name: 'Pro',           price: '₹999',   priceNum: 999,   limit: 150,      color: '#2563EB' },
}

export default function SchoolBillingPage() {
  const router = useRouter()
  const [clinic, setClinic]                       = useState(null)
  const [loading, setLoading]                     = useState(true)
  const [todayCount, setTodayCount]               = useState(0)
  const [upgrading, setUpgrading]                 = useState(null)
  const [showDetails, setShowDetails]             = useState(false)
  const [showCancelModal, setShowCancelModal]     = useState(false)
  const [cancelReason, setCancelReason]           = useState('')
  const [isCanceling, setIsCanceling]             = useState(false)
  const [showSuccessModal, setShowSuccessModal]   = useState(null)
  const [currentDate, setCurrentDate]             = useState(null)
  const [openFaq, setOpenFaq]                     = useState(null)
  const [customDays, setCustomDays]               = useState(30)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setCurrentDate(new Date()) }, [])

  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-js')) {
      const script = document.createElement('script')
      script.id = 'razorpay-checkout-js'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.head.appendChild(script)
    }

    async function load() {
      const stored = localStorage.getItem('tokenpe_business')
      if (!stored) { router.push('/school-login'); return }
      const clinicData = JSON.parse(stored)

      const today = getISTDateString()

      const userClinics = JSON.parse(localStorage.getItem('tokenpe_user_businesses') || '[]')
      let queryParam = `clinicId=${clinicData.id}`
      if (userClinics.length > 0) {
        queryParam = `clinicIds=${userClinics.map(c => c.id).join(',')}`
      }

      const [freshRes, countRes] = await Promise.all([
        fetch(`/api/business/get?id=${clinicData.id}`),
        fetch(`/api/analytics/count?${queryParam}&date=${today}`)
      ])
      const freshData  = freshRes?.ok  ? await freshRes.json()  : null
      const countData  = countRes?.ok  ? await countRes.json()  : null

      if (freshData?.success && freshData.clinic) {
        setClinic(freshData.clinic)
        localStorage.setItem('tokenpe_business', JSON.stringify(freshData.clinic))
      } else {
        setClinic(clinicData)
      }
      setTodayCount(countData?.success ? countData.count : 0)
      setLoading(false)
    }
    load()
  }, [router])

  const pollForUpdate = useCallback(async (clinicId, newPlanTier) => {
    const maxAttempts = 6
    let attempts = 0
    const poll = async () => {
      attempts++
      const res = await fetch(`/api/business/get?id=${clinicId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.clinic) {
          const fresh = data.clinic
          setClinic(fresh)
          localStorage.setItem('tokenpe_business', JSON.stringify(fresh))
          const isActivated = fresh.subscription_status === 'active' && fresh.plan_id === newPlanTier
          if (isActivated || attempts >= maxAttempts) {
            setUpgrading(null)
            if (isActivated) {
              const meta = PLAN_META[fresh.plan_id]
              setShowSuccessModal(meta?.name || fresh.plan_id)
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#D97706', '#059669', '#2563EB'], zIndex: 10000 })
            }
            return
          }
        }
      }
      if (attempts < maxAttempts) setTimeout(poll, 2500)
      else setUpgrading(null)
    }
    setTimeout(poll, 2000)
  }, [])

  async function handleUpgrade(planTier) {
    if (!clinic?.id) return
    setUpgrading(planTier)
    try {
      const res = await fetch('/api/razorpay/school-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: clinic.id, planTier })
      })
      const data = await res.json()
      if (!res.ok || !data.subscriptionId) {
        alert(data.error || 'Could not create subscription. Please try again.')
        setUpgrading(null)
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'TokenPe for Schools',
        description: `${planTier.replace('_', ' ').toUpperCase()} plan — ${clinic.name || 'Your School'}`,
        image: '/logo-light.svg',
        prefill: {
          name: data.businessName || '',
          email: data.businessEmail || '',
          contact: data.businessPhone || '',
        },
        theme: { color: '#1B2A4A' },
        handler: function () {
          // Payment successful — poll until the webhook updates the DB
          pollForUpdate(clinic.id, planTier)
        },
        modal: {
          ondismiss: function () {
            setUpgrading(null)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        alert('Payment failed: ' + (response.error?.description || 'Unknown error'))
        setUpgrading(null)
      })
      rzp.open()
    } catch (err) {
      console.error('[handleUpgrade]', err)
      alert('Something went wrong. Please try again.')
      setUpgrading(null)
    }
  }



  async function executeCancel() {
    setIsCanceling(true)
    try {
      const res  = await fetch('/api/razorpay/cancel-subscription', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, reason: cancelReason })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to cancel')

      const res2 = await fetch(`/api/business/get?id=${clinic.id}`)
      if (res2.ok) {
        const data2 = await res2.json()
        if (data2.success && data2.clinic) {
          setClinic(data2.clinic)
          localStorage.setItem('tokenpe_business', JSON.stringify(data2.clinic))
        }
      }
      setShowCancelModal(false)
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setUpgrading(null)
      setIsCanceling(false)
    }
  }

  const executeResume = async () => {
    setUpgrading('resume')
    try {
      const res = await fetch('/api/razorpay/resume-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reactivate')

      const res2 = await fetch(`/api/business/get?id=${clinic.id}`)
      if (res2.ok) {
        const data2 = await res2.json()
        if (data2.success && data2.clinic) {
          setClinic(data2.clinic)
          localStorage.setItem('tokenpe_business', JSON.stringify(data2.clinic))
        }
      }
    } catch (err) {
      console.error(err); alert('An unexpected error occurred')
    }
    setIsCanceling(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#065F46] rounded-full animate-spin"></div>
    </div>
  )

  // ── Derived state ──────────────────────────────────────────────────────────
  const planId       = clinic?.plan_id || 'starter'
  const planMeta     = PLAN_META[planId] || PLAN_META['starter']
  const planName     = planMeta.name
  const planLimit    = planMeta.limit
  const planPrice    = planMeta.price

  const status          = clinic?.subscription_status || 'trialing'
  const isTrial         = status === 'trialing'
  const isActive        = status === 'active'
  const isCancelPending = status === 'cancel_at_period_end'
  const isCanceled      = status === 'canceled'

  const percentage = planLimit === Infinity ? 0 : Math.min((todayCount / planLimit) * 100, 100)

  const userClinics = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tokenpe_user_businesses') || '[]') : []
  const oldestClinic = userClinics.length > 0
    ? userClinics.reduce((oldest, c) => new Date(c.created_at) < new Date(oldest.created_at) ? c : oldest, userClinics[0])
    : clinic

  const trialEnd = oldestClinic?.trial_ends_at
    ? new Date(oldestClinic.trial_ends_at)
    : (oldestClinic?.created_at ? new Date(new Date(oldestClinic.created_at).getTime() + 7 * 24 * 60 * 60 * 1000) : null)

  const realDaysLeft    = trialEnd && currentDate ? Math.ceil((trialEnd - currentDate) / (1000 * 60 * 60 * 24)) : 0
  const daysLeft        = isTrial ? Math.max(0, realDaysLeft) : null
  const isTrialExpired  = isTrial && trialEnd && realDaysLeft < 0

  // Tier level map — normalise pro/professional
  const tierLevels = { starter: 1, pro: 2, professional: 2, elite: 3 }
  const currentLevel = tierLevels[planId] || 1

  // No downgrade support — only upgrades and reactivation

  const plans = [
    {
      tier: 'elite_monthly', label: 'Elite Monthly',
      price: '₹5,000', period: '/month', subnote: 'Standard monthly billing',
      badge: 'MOST COMMON', accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A',
      features: [
        'Unlimited tokens & students/day',
        'WhatsApp SMS & AI Voice alerts',
        '365-day full history & export',
        'Campus Analytics dashboard',
        'Student Directory (CRM)',
        'Multi-branch management',
      ]
    },
    {
      tier: 'elite_yearly', label: 'Elite Yearly',
      price: '₹50,000', period: '/year', subnote: '₹4,167/mo — 2 months FREE',
      badge: 'BEST VALUE — SAVE ₹10,000', accent: '#059669', bg: '#ECFDF5', border: '#A7F3D0',
      features: [
        'Everything in Monthly',
        '2 months FREE vs monthly rate',
        'Priority VIP Support',
        'All future updates included',
      ]
    },
    {
      tier: 'elite_custom', label: 'Elite Custom Duration',
      price: '₹178', period: '/day', subnote: `Total: ₹${(customDays * 178).toLocaleString('en-IN')} (${customDays} days)`,
      badge: 'FLEXIBLE DURATION', accent: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
      features: [
        'Choose exact number of days',
        'All Elite features included',
        'Min 1 day, max 365 days',
        'Ideal for events & admissions drives',
        'Pay only for what you use',
      ]
    }
  ]

  const faqs = [
    { q: 'Can I change plans anytime?', a: 'Yes! Upgrades take effect immediately. Simply select any tier above.' },
    { q: "What's included in Elite?", a: 'Unlimited student tokens/day, branded WhatsApp alerts, AI voice notes, multi-branch switching, Student CRM broadcasts, and 365-day analytics history.' },
    { q: 'Can I cancel anytime?', a: 'Yes — cancel with one click. Full access is maintained until your current period ends.' },
    { q: 'Do you offer refunds?', a: 'We do not issue partial refunds, but your service remains fully active until the end of your paid duration.' },
  ]

  const S = { fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center', ...S }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', ...S }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      {/* ── HEADER ── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(27,42,74,0.08)', padding: isMobile ? '10px 12px' : '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(27,42,74,0.06)' }}>
        <button onClick={() => router.push('/school-dashboard')} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#1B2A4A', fontWeight: 700, fontSize: '0.8rem' }}>
          <ChevronLeft size={16} />{isMobile ? null : ' Back'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #059669 100%)', borderRadius: 8, padding: 8 }}>
            <CreditCard size={18} color="#FFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A' }}>Billing Plans</div>
            <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600, display: isMobile ? 'none' : 'block' }}>{clinic?.name || 'School'} — Subscription Management</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', padding: '6px 12px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
          <ShieldCheck size={13} color="#059669" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Secure Billing via Razorpay</span>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '14px 12px' : '28px 20px' }}>

        {/* ── CURRENT PLAN CARD ── */}
        <div style={{ background: '#1B2A4A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '24px 28px', marginBottom: 28, color: '#FFF', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#F59E0B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Active Subscription Status</div>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#FFF', margin: 0 }}>{planName}</h2>

                {isTrial && !isTrialExpired && (
                  <span style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#FDE68A', padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Gift size={12} /> FREE TRIAL — {daysLeft} DAYS LEFT
                  </span>
                )}
                {isTrialExpired && (
                  <span style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle size={12} /> TRIAL EXPIRED
                  </span>
                )}
                {isActive && (
                  <span style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#6EE7B7', padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>ACTIVE</span>
                )}
                {isCanceled && (
                  <span style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>CANCELED</span>
                )}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.6 }}>
                {isTrialExpired
                  ? <span style={{ color: '#FCA5A5', fontWeight: 700 }}>Trial expired on {trialEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Select a plan below.</span>
                  : isTrial
                    ? `Trial valid through ${trialEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. All Elite features enabled.`
                    : isCancelPending
                      ? <span style={{ color: '#FCA5A5', fontWeight: 600 }}>Cancellation scheduled — access until {planEndDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.</span>
                      : isActive
                        ? <span style={{ color: '#6EE7B7', fontWeight: 600 }}>Plan active. All features fully unlocked.</span>
                        : 'Checking plan status...'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {isActive && !isCancelPending && (
                <button onClick={() => setShowCancelModal(true)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit' }}>
                  Cancel Plan
                </button>
              )}
              <button onClick={() => setShowDetails(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit' }}>
                View Feature Specs
              </button>
            </div>
          </div>
        </div>

        {/* ── PLANS SECTION ── */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1B2A4A', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#D97706" /> Available Subscription Tiers
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20, alignItems: 'stretch' }}>
            {plans.map((plan) => {
              const isCurrent = (planId === plan.tier) && !isTrial && !isCanceled
              const isLoading = upgrading === plan.tier
              const isCustom  = plan.tier === 'elite_custom'

              return (
                <div key={plan.tier} style={{
                  position: 'relative', background: '#FFFFFF',
                  border: isCurrent ? `2px solid ${plan.accent}` : `1.5px solid ${plan.border}`,
                  borderRadius: 14, padding: '28px 24px 24px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: isCurrent ? `0 8px 32px ${plan.accent}28` : '0 4px 16px rgba(27,42,74,0.06)',
                  boxSizing: 'border-box',
                }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.accent, color: '#FFF', fontSize: '0.62rem', fontWeight: 900, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.1em', whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${plan.accent}55` }}>
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: plan.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{plan.label}</div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: 700, color: '#1B2A4A' }}>{plan.price}</span>
                      <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{plan.period}</span>
                    </div>

                    <div style={{ minHeight: 22, fontSize: '0.76rem', fontWeight: 700, color: plan.accent, marginBottom: 16 }}>{plan.subnote}</div>

                    {/* Custom day picker */}
                    <div style={{ minHeight: isCustom ? 116 : 0, marginBottom: 16 }}>
                      {isCustom && (
                        <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: 12, borderRadius: 10 }}>
                          <div style={{ fontSize: '0.7rem', color: '#5A6E85', fontWeight: 600, marginBottom: 6 }}>Select Number of Days:</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <button onClick={() => setCustomDays(d => Math.max(1, d - 1))} style={{ background: '#FFF', border: '1px solid #DDD6FE', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontWeight: 800, color: '#7C3AED', fontSize: '1rem' }}>−</button>
                            <input
                              type="number" min={1} max={365} value={customDays}
                              onChange={e => setCustomDays(Math.min(365, Math.max(1, parseInt(e.target.value) || 1)))}
                              style={{ width: 64, textAlign: 'center', background: '#FFF', border: '1px solid #DDD6FE', color: '#7C3AED', fontWeight: 700, padding: '4px 0', borderRadius: 6, fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }}
                            />
                            <button onClick={() => setCustomDays(d => Math.min(365, d + 1))} style={{ background: '#FFF', border: '1px solid #DDD6FE', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontWeight: 800, color: '#7C3AED', fontSize: '1rem' }}>+</button>
                          </div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {[7, 14, 30, 90].map(d => (
                              <button key={d} onClick={() => setCustomDays(d)} style={{ padding: '3px 10px', fontSize: '0.68rem', fontWeight: 700, border: `1px solid ${customDays === d ? '#7C3AED' : '#DDD6FE'}`, color: customDays === d ? '#7C3AED' : '#94A3B8', background: customDays === d ? '#F5F3FF' : '#FFF', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {d}d
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {plan.features.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.81rem', color: '#334155', fontWeight: 500 }}>
                          <CheckCircle2 size={14} style={{ color: plan.accent, flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <button
                      disabled={isCurrent || (!!upgrading && upgrading !== plan.tier)}
                      onClick={() => !isCurrent && !upgrading && handleUpgrade(plan.tier)}
                      style={{
                        width: '100%', padding: '12px 0', border: 'none', borderRadius: 8,
                        background: isCurrent ? '#F1F5F9' : plan.accent,
                        color: isCurrent ? '#94A3B8' : '#FFF',
                        fontWeight: 800, fontSize: '0.85rem', cursor: (isCurrent || upgrading) ? 'not-allowed' : 'pointer',
                        opacity: (isCurrent || (!!upgrading && upgrading !== plan.tier)) ? 0.65 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        boxShadow: isCurrent ? 'none' : `0 4px 14px ${plan.accent}44`,
                        fontFamily: 'inherit', transition: 'all 0.2s ease',
                      }}
                    >
                      <Zap size={14} />
                      {isLoading ? 'Processing Payment...' : isCurrent ? '✓ Current Active Plan' : `Select ${plan.label}`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '22px 24px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1B2A4A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={18} color="#2563EB" /> Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: 'transparent', border: 'none', color: '#1B2A4A', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span>{faq.q}</span>
                  <span style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#2563EB', fontSize: '0.7rem' }}>▼</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 16px 14px', fontSize: '0.8rem', color: '#5A6E85', lineHeight: 1.7, borderTop: '1px solid #F1F5F9' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUCCESS MODAL ── */}
      {showSuccessModal && (
        <div onClick={() => setShowSuccessModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', border: '2px solid #059669', width: '100%', maxWidth: 380, borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 24px 60px rgba(5,150,105,0.2)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: '#1B2A4A', marginBottom: 8 }}>Plan Activated!</h3>
            <p style={{ fontSize: '0.85rem', color: '#5A6E85', marginBottom: 20 }}>
              <strong style={{ color: '#059669' }}>{showSuccessModal}</strong> is now active. All features are unlocked for your school.
            </p>
            <button onClick={() => setShowSuccessModal(null)} style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 28px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'inherit' }}>
              Awesome! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ── FEATURE COMPARISON MODAL ── */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', width: '100%', maxWidth: 720, borderRadius: 20, padding: 32, position: 'relative', maxHeight: '92vh', overflowY: 'auto' }}>
            <button onClick={() => setShowDetails(false)} style={{ position: 'absolute', top: 20, right: 20, background: '#F1F5F9', border: 'none', color: '#5A6E85', cursor: 'pointer', borderRadius: 6, padding: 6 }}>
              <X size={16} />
            </button>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#1B2A4A', marginBottom: 6 }}>Feature Comparison</h2>
            <p style={{ fontSize: '0.8rem', color: '#5A6E85', marginBottom: 20 }}>Detailed breakdown of capabilities per subscription plan.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#1B2A4A' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800 }}>Feature</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', color: '#D97706' }}>Elite Monthly</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', color: '#059669' }}>Elite Yearly</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Daily Student Tokens', 'Unlimited', 'Unlimited'],
                  ['WhatsApp SMS Notifications', '✓', '✓'],
                  ['AI Voice Notes (10 languages)', '✓', '✓'],
                  ['Campus Analytics Dashboard', '✓', '✓'],
                  ['Student CRM Directory', '✓', '✓'],
                  ['Multi-Branch Management', '✓', '✓'],
                  ['History Log Access', '365 Days', '365 Days'],
                  ['VIP Dedicated Support', 'Standard', 'Priority VIP'],
                  ['Savings vs Monthly', '—', '₹10,000/yr'],
                ].map(([feat, m, y], idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155' }}>{feat}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#D97706', fontWeight: 700 }}>{m}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CANCEL MODAL ── */}
      {showCancelModal && (
        <div onClick={() => setShowCancelModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', border: '1.5px solid #FECACA', width: '100%', maxWidth: 420, borderRadius: 20, padding: 28, color: '#1B2A4A' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#DC2626', marginBottom: 8 }}>Cancel Subscription?</h3>
            <p style={{ fontSize: '0.82rem', color: '#5A6E85', lineHeight: 1.5, marginBottom: 20 }}>
              You retain full access until <strong>{planEndDate ? planEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'end of period'}</strong>.
            </p>
            <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1B2A4A', fontSize: '0.82rem', outline: 'none', marginBottom: 20, fontFamily: 'inherit' }}>
              <option value="">Select cancellation reason… (Optional)</option>
              <option value="too_expensive">Too expensive</option>
              <option value="missing_features">Missing features</option>
              <option value="other">Other reason</option>
            </select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => setShowCancelModal(false)} disabled={isCanceling} style={{ padding: '11px 0', background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Keep My Subscription
              </button>
              <button onClick={executeCancel} disabled={isCanceling} style={{ padding: '11px 0', background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: 8, fontWeight: 800, fontSize: '0.85rem', cursor: isCanceling ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {isCanceling ? 'Canceling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
