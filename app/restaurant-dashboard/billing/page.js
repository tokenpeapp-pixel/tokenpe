'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import '../lovable.css'
import { supabase, getISTDateString } from '../../../lib/supabase'
import confetti from 'canvas-confetti'
import { Gift, AlertTriangle, Hourglass, RefreshCw, CheckCircle2, ArrowLeft, ShieldCheck, Sparkles, X, HelpCircle, PhoneCall, CreditCard, Clock } from 'lucide-react'

const PLAN_META = {
  elite_monthly: { name: 'Elite Monthly', price: '₹5,000', priceNum: 5000,  limit: Infinity, color: '#fbbf24' },
  elite_yearly:  { name: 'Elite Yearly',  price: '₹50,000', priceNum: 50000, limit: Infinity, color: '#10b981' },
  elite_custom:  { name: 'Elite Custom',  price: '₹178/day', priceNum: 178,  limit: Infinity, color: '#a78bfa' },
  elite:         { name: 'Elite',         price: '₹5,000', priceNum: 5000,  limit: Infinity, color: '#fbbf24' },
  starter:       { name: 'Starter',       price: '₹499',   priceNum: 499,   limit: 50,       color: '#9ca3af' },
  pro:           { name: 'Pro',           price: '₹999',   priceNum: 999,   limit: 150,      color: '#fef3c7' },
  professional:  { name: 'Pro',           price: '₹999',   priceNum: 999,   limit: 150,      color: '#fef3c7' },
}

export default function BillingPage() {
  const router = useRouter()
  const [clinic, setRestaurant]               = useState(null)
  const [loading, setLoading]             = useState(true)
  const [todayCount, setTodayCount]       = useState(0)
  const [upgrading, setUpgrading]         = useState(null)
  const [showDetails, setShowDetails]     = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason]   = useState('')
  const [isCanceling, setIsCanceling]     = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(null)
  const [currentDate, setCurrentDate]     = useState(null)
  const [openFaq, setOpenFaq]             = useState(null)
  const [customDays, setCustomDays]       = useState(30)

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
      if (!stored) { router.push('/restaurant-login'); return }
      const clinicData = JSON.parse(stored)

      const today = getISTDateString()

      const userRestaurants = JSON.parse(localStorage.getItem('tokenpe_user_businesses') || '[]')
      let queryParam = `clinicId=${clinicData.id}`
      if (userRestaurants.length > 0) {
        queryParam = `clinicIds=${userRestaurants.map(c => c.id).join(',')}`
      }

      const [freshRes, countRes] = await Promise.all([
        fetch(`/api/business/get?id=${clinicData.id}`),
        fetch(`/api/analytics/count?${queryParam}&date=${today}`)
      ])
      const freshData = freshRes.ok ? await freshRes.json() : null
      const countData = countRes.ok ? await countRes.json() : null

      if (freshData?.success && freshData.clinic) {
        setRestaurant(freshData.clinic)
        setIsPrimaryBranch(freshData.isPrimaryBranch !== false)
        setPrimaryBranchName(freshData.primaryBranchName)
        localStorage.setItem('tokenpe_business', JSON.stringify(freshData.clinic))
      } else {
        setRestaurant(clinicData)
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
          setRestaurant(fresh)
          localStorage.setItem('tokenpe_business', JSON.stringify(fresh))
          const isActivated = fresh.subscription_status === 'active' && fresh.plan_id === newPlanTier
          if (isActivated || attempts >= maxAttempts) {
            setUpgrading(null)
            if (isActivated) {
              const meta = PLAN_META[fresh.plan_id]
              setShowSuccessModal(meta?.name || fresh.plan_id)
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#fbbf24', '#10b981', '#7f1d1d'], zIndex: 10000 })
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

  const planId   = clinic?.plan_id || 'elite'
  const meta     = PLAN_META[planId] || PLAN_META.elite
  const planName = meta.name
  const subStatus = clinic?.subscription_status || 'trialing'

  const trialEnd       = clinic?.trial_ends_at ? new Date(clinic.trial_ends_at) : null
  const isTrial        = subStatus === 'trialing' && trialEnd && trialEnd > currentDate
  const isTrialExpired = subStatus === 'trialing' && trialEnd && trialEnd <= currentDate
  const isCanceled     = subStatus === 'canceled'
  const isCancelPending = subStatus === 'cancel_pending'
  const isActive       = subStatus === 'active'

  const planEndDate = clinic?.trial_ends_at ? new Date(clinic.trial_ends_at) : null

  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - (currentDate?.getTime() || 0)) / (1000 * 60 * 60 * 24)))
    : 0

  async function handleUpgrade(planTier) {
    if (upgrading) return
    setUpgrading(planTier)

    try {
      if (planTier === 'elite_custom') {
        const amount = customDays * 178
        const orderRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            clinicId: clinic.id,
            days: customDays,
            notes: { plan_tier: 'elite_custom', days: customDays }
          })
        })
        const orderData = await orderRes.json()
        if (!orderRes.ok || !orderData.success) {
          alert(orderData.error || 'Failed to initialize payment')
          setUpgrading(null)
          return
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'TokenPe',
          description: `Elite Custom Plan (${customDays} Days)`,
          order_id: orderData.orderId,
          prefill: {
            name: clinic?.name || '',
            email: clinic?.email || '',
            contact: clinic?.phone || ''
          },
          theme: { color: '#7f1d1d' },
          handler: function (response) {
            pollForUpdate(clinic.id, 'elite')
          },
          modal: {
            ondismiss: function () { setUpgrading(null) }
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
        return
      }

      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier, clinicId: clinic.id })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to initialize subscription')
        setUpgrading(null)
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'TokenPe',
        description: `${PLAN_META[tier]?.name || tier} Plan Subscription`,
        image: `${window.location.origin}/logo-light.svg`,
        prefill: { name: data.clinicName, email: data.clinicEmail, contact: data.businessPhone },
        theme: { color: '#fef3c7' },
        handler: () => pollForUpdate(clinic.id, tier),
        modal: { ondismiss: () => setUpgrading(null) }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error(err)
      alert('An unexpected error occurred. Please try again.')
      setUpgrading(null)
    }
  }

  async function executeCancel() {
    setIsCanceling(true)
    try {
      const res = await fetch('/api/razorpay/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, reason: cancelReason })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to cancel')

      const res2 = await fetch(`/api/business/get?id=${clinic.id}`)
      if (res2.ok) {
        const data2 = await res2.json()
        if (data2.success && data2.clinic) {
          setRestaurant(data2.clinic)
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
          setRestaurant(data2.clinic)
          localStorage.setItem('tokenpe_business', JSON.stringify(data2.clinic))
        }
        alert('Your subscription cancellation is scheduled. You retain full access until the end of your period.')
      } else {
        alert(data.error || 'Failed to cancel subscription')
      }
    } catch (err) {
      console.error(err)
      alert('An unexpected error occurred')
    }
    setIsCanceling(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#7f1d1d] rounded-full animate-spin"></div>
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

  const userRestaurants = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tokenpe_user_businesses') || '[]') : []
  const oldestRestaurant = userRestaurants.length > 0
    ? userRestaurants.reduce((oldest, c) => new Date(c.created_at) < new Date(oldest.created_at) ? c : oldest, userRestaurants[0])
    : clinic

  const trialEnd = oldestRestaurant?.trial_ends_at
    ? new Date(oldestRestaurant.trial_ends_at)
    : (oldestRestaurant?.created_at ? new Date(new Date(oldestRestaurant.created_at).getTime() + 7 * 24 * 60 * 60 * 1000) : null)

  const realDaysLeft    = trialEnd && currentDate ? Math.ceil((trialEnd - currentDate) / (1000 * 60 * 60 * 24)) : 0
  const daysLeft        = isTrial ? Math.max(0, realDaysLeft) : null
  const isTrialExpired  = isTrial && trialEnd && realDaysLeft < 0

  // Tier level map — normalise pro/professional
  const tierLevels = { starter: 1, pro: 2, professional: 2, elite: 3 }
  const currentLevel = tierLevels[planId] || 1

  // No downgrade support — only upgrades and reactivation

  const plans = [
    {
      tier: 'elite_monthly',
      label: 'Elite Monthly',
      price: '₹5,000',
      period: '/month',
      subnote: 'Standard monthly billing',
      badge: 'MOST COMMON',
      accent: '#fbbf24',
      borderClass: 'border-2 border-[#fbbf24]',
      features: [
        'Everything included',
        'Unlimited covers & guests/day',
        'WhatsApp SMS & AI Voice notes',
        '365 days full history & export',
        'Multi-branch management',
        'CRM & Broadcasts enabled'
      ]
    },
    {
      tier: 'elite_yearly',
      label: 'Elite Yearly',
      price: '₹50,000',
      period: '/year',
      subnote: '₹4,167/mo — 2 months FREE',
      badge: 'BEST VALUE — SAVE ₹10,000',
      accent: '#10b981',
      borderClass: 'border-2 border-[#10b981]',
      features: [
        'Everything in Monthly',
        '2 months FREE (vs monthly rate)',
        'Priority VIP Support',
        'All future updates included'
      ]
    },
    {
      tier: 'elite_custom',
      label: 'Elite Custom Duration',
      price: '₹178',
      period: '/day',
      subnote: `Total: ₹${(customDays * 178).toLocaleString('en-IN')} (${customDays} days)`,
      badge: 'FLEXIBLE DURATION',
      accent: '#a78bfa',
      borderClass: 'border-2 border-[#a78bfa]/60',
      features: [
        'Choose exact number of days',
        'All Elite features included',
        'Min 1 day, max 365 days',
        'Ideal for events & pop-ups',
        'Pay only for what you use'
      ]
    }
  ]

  const faqs = [
    { q: 'Can I change plans anytime?', a: 'Yes! Upgrades take effect immediately. To switch plan types, select any tier above.' },
    { q: "What's included in Elite?", a: 'Elite includes unlimited guest covers/day, branded WhatsApp alerts, AI voice notes in 10 languages, multi-branch switching, CRM broadcasts, and 365-day history analytics.' },
    { q: 'Can I cancel anytime?', a: 'Yes, cancel with one click anytime. You maintain full access until your period ends.' },
    { q: 'Do you offer refunds?', a: 'We do not issue partial refunds, but your service remains fully active until the end of your paid duration.' },
  ]

  if (loading) return (
    <div className="lovable-root flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-[#3f1515] border-t-[#fbbf24] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="lovable-root">

      {/* ── HEADER ── */}
      <header className="lovable-header" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button 
            onClick={() => router.push('/restaurant-dashboard')}
            className="lovable-btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <div className="lovable-supertitle">RESTAURANT | BILLING & SUBSCRIPTIONS</div>
        <h1 className="lovable-title">
          {clinic?.name || 'Restaurant'} <span>— Billing & Plans</span>
        </h1>
        <div className="lovable-subtitle">
          Manage your subscription tier, billing period, active features, and invoices.
        </div>
      </header>

      {/* ── CURRENT PLAN CARD ── */}
      <div style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', marginBottom: 28 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Active Subscription Status
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                {planName}
              </h2>
              
              {isTrial && !isTrialExpired && (
                <span style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Gift className="w-3.5 h-3.5" /> FREE TRIAL — {daysLeft} DAYS REMAINING
                </span>
              )}

              {isTrialExpired && (
                <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle className="w-3.5 h-3.5" /> TRIAL EXPIRED
                </span>
              )}

              {isActive && (
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                  ACTIVE
                </span>
              )}

              {isCanceled && (
                <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                  CANCELED
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
              {isTrialExpired
                ? <span style={{ color: '#ef4444', fontWeight: 700 }}>Your free trial expired on {trialEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Select a plan below to continue.</span>
                : isTrial
                  ? `Trial valid through ${trialEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. All Elite features enabled.`
                  : isCancelPending
                    ? <span style={{ color: '#ef4444', fontWeight: 600 }}>Cancellation scheduled — access remains active until {planEndDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.</span>
                    : isActive
                      ? <span style={{ color: '#10b981', fontWeight: 600 }}>Plan active. All features fully unlocked.</span>
                      : 'Checking plan status...'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isActive && !isCancelPending && (
              <button 
                onClick={() => setShowCancelModal(true)}
                className="lovable-btn-outline"
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', justifyContent: 'center' }}
              >
                Cancel Plan
              </button>
            )}

            <button 
              onClick={() => setShowDetails(true)}
              className="lovable-btn-outline"
              style={{ justifyContent: 'center' }}
            >
              View Feature Specs
            </button>
          </div>

        </div>
      </div>

      {/* ── PERFECTLY ALIGNED PLANS GRID SECTION ── */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles className="w-5 h-5 text-[#fbbf24]" /> Available Subscription Tiers
        </h2>

        {/* 3-Column Equal Height Flex/Grid Container */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'stretch' }}>
          {plans.map((plan) => {
            const isCurrent = (planId === plan.tier) && !isTrial && !isCanceled
            const isLoading = upgrading === plan.tier
            const isCustom  = plan.tier === 'elite_custom'

            return (
              <div 
                key={plan.tier} 
                style={{ 
                  position: 'relative',
                  background: 'var(--wine-deep)', 
                  border: isCurrent ? '2px solid var(--gold)' : '1px solid var(--border)', 
                  borderRadius: 16, 
                  padding: '28px 24px 24px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {/* Badge Top Tag */}
                {plan.badge && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.accent, color: '#1a0505', fontSize: '0.65rem', fontWeight: 900, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                    {plan.badge}
                  </div>
                )}

                {/* Top Section */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: plan.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    {plan.label}
                  </div>

                  {/* Price Header */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: 700, color: 'var(--foreground)' }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{plan.period}</span>
                  </div>

                  {/* Aligned Subnote Slot */}
                  <div style={{ minHeight: 24, fontSize: '0.78rem', fontWeight: 700, color: plan.tier === 'elite_yearly' ? '#10b981' : plan.tier === 'elite_custom' ? '#a78bfa' : 'var(--muted)', marginBottom: 16 }}>
                    {plan.subnote}
                  </div>

                  {/* Interactive Custom Day Picker (Only for Custom Card, else empty aligned spacer) */}
                  <div style={{ minHeight: isCustom ? 110 : 0, marginBottom: 16 }}>
                    {isCustom && (
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', padding: 12, borderRadius: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 6 }}>Select Number of Days:</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <button onClick={() => setCustomDays(d => Math.max(1, d - 1))} className="lovable-btn-outline" style={{ padding: '2px 8px', fontSize: '0.9rem' }}>-</button>
                          <input
                            type="number"
                            min={1} max={365}
                            value={customDays}
                            onChange={e => setCustomDays(Math.min(365, Math.max(1, parseInt(e.target.value) || 1)))}
                            style={{ width: 64, textAlign: 'center', background: 'var(--wine-deep)', border: '1px solid var(--border)', color: '#fef3c7', fontWeight: 700, padding: '4px', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }}
                          />
                          <button onClick={() => setCustomDays(d => Math.min(365, d + 1))} className="lovable-btn-outline" style={{ padding: '2px 8px', fontSize: '0.9rem' }}>+</button>
                        </div>

                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {[7, 14, 30, 90].map(d => (
                            <button key={d} onClick={() => setCustomDays(d)} className="lovable-btn-outline" style={{ padding: '2px 6px', fontSize: '0.68rem', borderColor: customDays === d ? plan.accent : 'var(--border)', color: customDays === d ? plan.accent : 'var(--muted)' }}>
                              {d}d
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features List (Flex Grow so CTA buttons stick to bottom) */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--foreground)' }}>
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: plan.accent }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button Pinned at Bottom */}
                <div style={{ marginTop: 'auto' }}>
                  <button
                    disabled={isCurrent || (!!upgrading && upgrading !== plan.tier)}
                    onClick={() => !isCurrent && !upgrading && handleUpgrade(plan.tier)}
                    className="lovable-btn-primary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: isCurrent ? 'rgba(255,255,255,0.08)' : plan.accent,
                      color: isCurrent ? 'var(--muted)' : '#1a0505',
                      opacity: (isCurrent || (!!upgrading && upgrading !== plan.tier)) ? 0.6 : 1,
                      cursor: (isCurrent || upgrading) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Processing Payment...' : isCurrent ? '✓ Current Active Plan' : `Select ${plan.label}`}
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      </div>

      {/* ── FAQ SECTION ── */}
      <div style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle className="w-5 h-5" /> Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'transparent', border: 'none', color: 'var(--foreground)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
              >
                <span>{faq.q}</span>
                <span style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--gold)' }}>▼</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 18px 14px 18px', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid var(--border)', pt: 10 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── DETAILS MODAL ── */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', width: '100%', maxWidth: 700, borderRadius: 20, padding: 32, position: 'relative', color: 'var(--foreground)' }}>
            <button onClick={() => setShowDetails(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
              <X className="w-6 h-6" />
            </button>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'var(--gold)', marginBottom: 8 }}>Feature Comparison</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 20 }}>Detailed breakdown of capabilities per subscription plan.</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--gold)' }}>
                  <th style={{ padding: '10px 14px' }}>Feature</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Elite Monthly</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Elite Yearly</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Daily Guest Covers', 'Unlimited', 'Unlimited'],
                  ['WhatsApp SMS Notifications', '✓ Included', '✓ Included'],
                  ['AI Voice Notes (10 languages)', '✓ Included', '✓ Included'],
                  ['Multi-Branch Switching', '✓ Included', '✓ Included'],
                  ['CRM Mass Broadcasts', '✓ Included', '✓ Included'],
                  ['History Log Access', '365 Days', '365 Days'],
                  ['VIP Dedicated Support', 'Standard', 'Priority VIP']
                ].map(([feat, m, y], idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{feat}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#fbbf24' }}>{m}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CANCEL MODAL ── */}
      {showCancelModal && (
        <div onClick={() => setShowCancelModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', width: '100%', maxWidth: 400, borderRadius: 20, padding: 28, color: 'var(--foreground)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>Cancel Subscription?</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 20 }}>
              You will retain full access to all features until <strong>{planEndDate ? planEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'end of period'}</strong>.
            </p>

            <select
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fef3c7', fontSize: '0.82rem', outline: 'none', marginBottom: 20 }}
            >
              <option value="">Select cancellation reason... (Optional)</option>
              <option value="too_expensive">Too expensive</option>
              <option value="missing_features">Missing features</option>
              <option value="other">Other reason</option>
            </select>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => setShowCancelModal(false)} disabled={isCanceling} className="lovable-btn-primary" style={{ justifyContent: 'center' }}>
                Keep My Subscription
              </button>
              <button onClick={executeCancel} disabled={isCanceling} className="lovable-btn-outline" style={{ justifyContent: 'center', color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}>
                {isCanceling ? 'Canceling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
