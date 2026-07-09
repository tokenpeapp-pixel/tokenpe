'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getISTDateString } from '../../../lib/supabase'
import confetti from 'canvas-confetti'
import { Gift, AlertTriangle, Hourglass, RefreshCw, CheckCircle2 } from 'lucide-react'

const PLAN_META = {
  starter:      { name: 'Starter', price: '₹499',   priceNum: 499,  limit: 50,       color: '#6B7280' },
  pro:          { name: 'Pro',     price: '₹999',   priceNum: 999,  limit: 150,      color: '#065F46' },
  professional: { name: 'Pro',     price: '₹999',   priceNum: 999,  limit: 150,      color: '#065F46' },
  elite:        { name: 'Elite',   price: '₹1,999', priceNum: 1999, limit: Infinity, color: '#F59E0B' },
}

export default function BillingPage() {
  const router = useRouter()
  const [clinic, setClinic]               = useState(null)
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
  const [isPrimaryBranch, setIsPrimaryBranch] = useState(true)
  const [primaryBranchName, setPrimaryBranchName] = useState(null)

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
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) { router.push('/login'); return }
      const clinicData = JSON.parse(stored)

      const today = getISTDateString()

      const userClinics = JSON.parse(localStorage.getItem('tokenpe_user_clinics') || '[]')
      let queryParam = `clinicId=${clinicData.id}`
      if (userClinics.length > 0) {
        queryParam = `clinicIds=${userClinics.map(c => c.id).join(',')}`
      }

      const [freshRes, countRes] = await Promise.all([
        fetch(`/api/clinics/get?id=${clinicData.id}`),
        fetch(`/api/analytics/count?${queryParam}&date=${today}`)
      ])
      const freshData = freshRes.ok ? await freshRes.json() : null
      const countData = countRes.ok ? await countRes.json() : null

      if (freshData?.success && freshData.clinic) {
        setClinic(freshData.clinic)
        setIsPrimaryBranch(freshData.isPrimaryBranch !== false)
        setPrimaryBranchName(freshData.primaryBranchName)
        localStorage.setItem('tokenpe_clinic', JSON.stringify(freshData.clinic))
      } else {
        // fallback to cached data if API fails
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
      const res = await fetch(`/api/clinics/get?id=${clinicId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.clinic) {
          const fresh = data.clinic
          setClinic(fresh)
          localStorage.setItem('tokenpe_clinic', JSON.stringify(fresh))
          const isActivated = fresh.subscription_status === 'active' && fresh.plan_id === newPlanTier
          if (isActivated || attempts >= maxAttempts) {
            setUpgrading(null)
            if (isActivated) {
              const meta = PLAN_META[fresh.plan_id]
              setShowSuccessModal(meta?.name || fresh.plan_id)
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#065F46', '#2DD4BF', '#059669', '#ffffff'], zIndex: 10000 })
            }
            return
          }
        }
      }
      if (attempts < maxAttempts) setTimeout(poll, 2000)
      else setUpgrading(null)
    }
    setTimeout(poll, 2000)
  }, [])

  const handleUpgrade = useCallback(async (tier) => {
    if (!clinic || upgrading) return
    setUpgrading(tier)
    try {
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, planTier: tier })
      })
      const data = await res.json()
      if (!res.ok || !data.subscriptionId) throw new Error(data.error || 'Failed to create subscription')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'TokenPe',
        description: `${PLAN_META[tier]?.name || tier} Plan Subscription`,
        image: `${window.location.origin}/logo-light.svg`,
        prefill: { name: data.clinicName, email: data.clinicEmail, contact: data.clinicPhone },
        theme: { color: '#065F46' },
        handler: () => pollForUpdate(clinic.id, tier),
        modal: { ondismiss: () => setUpgrading(null) }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        alert(`Payment failed: ${resp.error.description}`)
        setUpgrading(null)
      })
      rzp.open()
    } catch (err) {
      alert(`Error: ${err.message}`)
      setUpgrading(null)
    }
  }, [clinic, upgrading, pollForUpdate])

  const executeCancel = async () => {
    setIsCanceling(true)
    try {
      setUpgrading('cancel')
      const res = await fetch('/api/razorpay/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, reason: cancelReason })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to cancel')

      const res2 = await fetch(`/api/clinics/get?id=${clinic.id}`)
      if (res2.ok) {
        const data2 = await res2.json()
        if (data2.success && data2.clinic) {
          setClinic(data2.clinic)
          localStorage.setItem('tokenpe_clinic', JSON.stringify(data2.clinic))
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

  const userClinics = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tokenpe_user_clinics') || '[]') : []
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
      tier: 'starter', label: 'Starter', price: '₹499',
      features: ['Up to 50 patients/day', 'Standard WhatsApp Alerts', 'Basic 7-day Analytics', 'Auto-Generated Clinic Code'],
      checkColor: '#6B7280', accent: '#6B7280'
    },
    {
      tier: 'pro', label: 'Pro', price: '₹999',
      features: ['Up to 150 patients/day', 'Branded WhatsApp Identity', 'Multilingual AI Voice Alerts', 'Queue Pause & Smart Wait Time', '30-Day History & Heatmap'],
      checkColor: '#065F46', accent: '#065F46', featured: true
    },
    {
      tier: 'elite', label: 'Elite', price: '₹1,999',
      features: ['Unlimited patients/day', 'Report Download (PDF/CSV)', 'Multi-Clinic Management', 'VIP WhatsApp Support', 'CRM Broadcasts'],
      checkColor: '#F59E0B', accent: '#F59E0B'
    }
  ]

  const faqs = [
    { q: 'Can I change plans?', a: 'Yes! You can upgrade anytime. Upgrades are immediate. To downgrade, cancel your current subscription first and then subscribe to the new plan.' },
    { q: "What's included in Pro?", a: 'Pro includes up to 150 patients/day, branded WhatsApp alerts, AI voice notes in 10 languages, queue pause functionality, and 30-day analytics heatmap.' },
    { q: 'Can I cancel anytime?', a: 'Yes. You can cancel at any time from the billing page. You retain full access until the end of your current billing period. No refunds are provided for partial periods.' },
    { q: 'Do you offer refunds?', a: 'We do not offer refunds for partial billing periods. However, you can use the service until your billing period ends after cancellation.' },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFAF8] font-sans text-[#111827]">

        {/* ── Main Content ── */}
        <main className="flex-grow lg:overflow-y-auto lg:h-screen">
          <div className="max-w-[900px] mx-auto p-4 sm:p-6 lg:p-8">

            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
              <div>
                <button onClick={() => router.push('/dashboard')} className="mb-3 text-[#065F46] font-bold text-[13px] hover:underline flex items-center gap-1">
                  ← Back to Dashboard
                </button>
                <h1 className="text-xl sm:text-2xl font-black text-[#111827]">Billing</h1>
                <p className="text-sm text-[#6B7280]">Manage your subscription, invoices and payment methods.</p>
              </div>
              {/* Only show Upgrade Plan if user is not already on elite or is cancelled */}
              {(planId !== 'elite' || isCanceled || isTrial) && (
                <button
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-[#065F46] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-teal-900/10 hover:opacity-90 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">upgrade</span>
                  Upgrade Plan
                </button>
              )}
            </div>

            {/* ── Current Plan Card ── */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 mb-8 shadow-sm">
              {/* Label */}
              <p className="text-[11px] font-black text-[#9CA3AF] uppercase tracking-widest mb-3">Current Plan</p>

              <div className="flex flex-col sm:flex-row sm:items-start gap-6">

                {/* Left — Plan name + status + price */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-xl sm:text-2xl font-black text-[#111827]">{planName}</h2>
                    {isTrial && !isTrialExpired && (
                      <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full text-[11px] font-extrabold tracking-wide shadow-sm">
                        <Gift className="inline-block w-4 h-4 mr-1 mb-0.5" /> FREE TRIAL — {daysLeft} days left
                      </span>
                    )}
                    {isTrialExpired && (
                      <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full text-[11px] font-extrabold tracking-wide shadow-sm">
                        <AlertTriangle className="inline-block w-4 h-4 mr-1 mb-0.5" /> TRIAL EXPIRED
                      </span>
                    )}
                    {!isTrial && !isCanceled && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[11px] font-bold tracking-wide">
                        ACTIVE
                      </span>
                    )}
                    {isCanceled && (
                      <span className="px-3 py-1 bg-red-50 text-red-500 border border-red-200 rounded-full text-[11px] font-bold tracking-wide">
                        CANCELED
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-[#6B7280] mt-3 leading-relaxed">
                    {isTrialExpired
                      ? <span className="text-red-500 font-bold">Your free trial expired on {trialEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Please choose a paid plan below to restore access to your dashboard.</span>
                      : isTrial
                        ? `Trial ends on ${trialEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Upgrade now to keep your features!`
                        : isCanceled
                          ? <span className="text-red-500 font-bold">Subscription ended. Please reactivate a plan to restore service.</span>
                          : isCancelPending && clinic?.current_period_end
                            ? <span className="text-red-500 font-medium"><AlertTriangle className="inline-block w-4 h-4 mr-1 mb-0.5" /> Cancellation scheduled — full access until <strong>{new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. No further charges.</span>
                            : clinic?.current_period_end
                              ? <>Next billing date: <strong className="text-indigo-600">{new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> · Auto-renews at {planName === 'Starter' ? '₹499' : planName === 'Pro' ? '₹999' : '₹1,999'}/mo</>
                              : <span className="text-gray-500 text-xs"><Hourglass className="inline-block w-3 h-3 mr-1" /> Confirming billing date... (may take a few seconds)</span>}
                  </div>
                </div>

                {/* Middle — Next billing date + auto-renewal toggle */}
                {!isCanceled && !isTrialExpired && (
                  <div className="sm:text-center sm:min-w-[170px]">
                    <p className="text-[11px] text-[#9CA3AF] font-bold uppercase mb-1">{isCancelPending ? 'Access Until' : 'Next Billing Date'}</p>
                    <p className="text-base sm:text-lg font-black text-[#111827] mb-2">
                      {clinic?.current_period_end
                        ? new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : (isTrial ? (trialEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) ?? '---') : '---')}
                    </p>
                    <div className="flex items-center sm:justify-center gap-2">
                      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${!isCancelPending ? 'bg-[#065F46]' : 'bg-[#E5E7EB]'}`}>
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${!isCancelPending ? 'translate-x-[18px]' : 'translate-x-1'}`}></span>
                      </div>
                      <span className="text-xs font-semibold text-[#6B7280]">Auto renewal {!isCancelPending ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                )}

                {/* Right — Action buttons */}
                <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[180px]">
                  {upgrading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-bold">
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                      Processing...
                    </div>
                  ) : (
                    <>
                      {isActive && !isCancelPending && (
                        <button
                          onClick={() => setShowCancelModal(true)}
                          disabled={!!upgrading}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold text-[#EF4444] hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-base">cancel</span>
                          Cancel Plan
                        </button>
                      )}
                      {isCancelPending && (
                        <button
                          onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#065F46] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors"
                        >
                          <><RefreshCw className="inline-block w-4 h-4 mr-1" /> Reactivate Subscription</>
                        </button>
                      )}
                      <button
                        onClick={() => setShowDetails(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold text-[#374151] hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">description</span>
                        View Plan Details
                      </button>
                    </>
                  )}
                </div>

              </div>
            </section>

            {/* ── Usage Section ── */}
            <section className="mb-10">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#111827] mb-4">
                <span className="material-symbols-outlined text-[#065F46]">bar_chart</span> Daily Usage
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Patients Today */}
                <div className="bg-white p-4 border border-[#E5E7EB] rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#065F46] text-lg">person</span>
                    </div>
                    <span className="text-xs font-bold text-[#6B7280]">Patients Today</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-[#111827]">{todayCount}</span>
                    <span className="text-[10px] text-[#9CA3AF]">/ {planLimit === Infinity ? '∞' : planLimit}</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${percentage >= 100 ? 'bg-[#DC2626]' : percentage >= 80 ? 'bg-[#F59E0B]' : 'bg-[#065F46]'}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>

              </div>
            </section>

            {/* ── Plans Section ── */}
            <section className="mb-12" id="plans-section">
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#111827] mb-6">
                <span className="material-symbols-outlined text-[#065F46]">inventory_2</span> Available plans
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const planLevel   = tierLevels[plan.tier]
                  const isCurrent   = currentLevel === planLevel && !isTrial && !isCanceled
                  const isLower     = planLevel < currentLevel && !isTrial && !isCanceled
                  const canReact    = isCurrent && isCancelPending
                  const isLoading   = upgrading === plan.tier

                  // Button label
                  let btnLabel = `Upgrade to ${plan.label}`
                  if (isLoading)                  btnLabel = <><Hourglass className="inline-block w-4 h-4 mr-1" /> Processing...</>
                  else if (canReact)              btnLabel = <><RefreshCw className="inline-block w-4 h-4 mr-1" /> Reactivate</>
                  else if (isCurrent)             btnLabel = <><CheckCircle2 className="inline-block w-4 h-4 mr-1" /> Current Plan</>
                  else if (isTrial || isCanceled) btnLabel = `Subscribe – ${plan.price}/mo`

                  const btnDisabled = (isCurrent && !canReact) || (!!upgrading && upgrading !== plan.tier)
                  const btnActive   = !btnDisabled
                  // isLower plans: no action button rendered

                  const cardBorder = plan.featured
                    ? 'border-2 border-[#065F46]'
                    : plan.tier === 'elite'
                    ? 'border border-[#FDE68A]'
                    : 'border border-[#E5E7EB]'

                  const cardBg = plan.tier === 'elite' ? 'bg-[#FFFDF7]' : 'bg-white'

                  const btnClass = btnActive
                    ? plan.tier === 'elite'
                      ? 'bg-[#F59E0B] text-[#111827] hover:opacity-90 shadow-lg shadow-amber-900/10'
                      : 'bg-[#065F46] text-white hover:opacity-90 shadow-lg shadow-teal-900/10'
                    : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'

                  return (
                    <div key={plan.tier} className={`${cardBg} ${cardBorder} rounded-2xl p-6 flex flex-col relative transition-all`}
                      style={plan.featured ? { boxShadow: '0 0 0 4px rgba(6,95,70,0.06)' } : {}}>

                      {plan.featured && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#065F46] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          Most Popular
                        </div>
                      )}

                      {isCurrent && !isCancelPending && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded-full text-[9px] font-black uppercase tracking-wider">
                          Current
                        </div>
                      )}

                      <span className="text-[10px] font-bold uppercase mb-1" style={{ color: plan.accent }}>{plan.label}</span>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-3xl font-black text-[#111827]">{plan.price}</span>
                        <span className="text-sm text-[#9CA3AF]">/mo</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-grow">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-[#4B5563]">
                            {plan.tier === 'elite'
                              ? <span className="material-symbols-outlined text-[#F59E0B] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                              : plan.featured
                              ? <span className="material-symbols-outlined text-[#065F46] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              : <span className="material-symbols-outlined text-[#D1D5DB] text-lg">radio_button_unchecked</span>
                            }
                            {f}
                          </li>
                        ))}
                      </ul>

                      {!isLower && (
                        <button
                          disabled={btnDisabled}
                          onClick={() => !btnDisabled && handleUpgrade(plan.tier)}
                          className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${btnClass}`}
                        >
                          {btnLabel}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── Billing History ── */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[15px] font-bold text-[#111827]">Billing history</h3>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden text-sm p-8 text-center text-[#6B7280]">
                No billing history available yet.
              </div>
            </section>

          </div>

          {/* ── Mobile-only: Sidebar content below billing history ── */}
          <div className="lg:hidden px-4 sm:px-6 pb-8 space-y-6">

            {/* Billing Timeline */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <h4 className="text-[15px] font-bold text-[#111827] mb-4">Billing Timeline</h4>
              <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-[#E5E7EB]">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-[#065F46] rounded-full"></div>
                  <p className="text-xs font-bold text-[#111827]">{planName} {isTrial ? 'Trial' : isActive ? 'Active' : isCancelPending ? 'Ending' : 'Inactive'}</p>
                  <p className="text-[10px] text-[#6B7280]">
                    {clinic?.created_at ? new Date(clinic.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                  </p>
                </div>
                {clinic?.current_period_end && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-white border-2 border-[#E5E7EB] rounded-full"></div>
                    <p className="text-xs font-bold text-[#6B7280]">{isCancelPending ? 'Access Ends' : 'Upcoming Renewal'}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h4 className="text-[11px] font-black text-[#111827] uppercase tracking-widest mb-4">Common Questions</h4>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-bold text-[#111827] pr-2">{faq.q}</span>
                      <span className="material-symbols-outlined text-sm text-[#9CA3AF] flex-shrink-0 transition-transform" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-xs text-[#6B7280] leading-relaxed border-t border-[#E5E7EB] pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <a href="mailto:tokenpe.online@gmail.com" className="mt-4 flex items-center gap-2 p-4 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#065F46] hover:bg-teal-50 transition-colors">
                <span className="material-symbols-outlined text-base">headset_mic</span>
                Contact Support
              </a>
            </div>
          </div>

        </main>

        <aside className="hidden lg:flex w-[280px] bg-white border-l border-[#E5E7EB] h-screen overflow-y-auto flex-shrink-0 flex-col">
          <div className="p-6 flex-grow">

            {/* Billing Timeline */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6 shadow-sm">
              <h4 className="text-[15px] font-bold text-[#111827] mb-4">Billing Timeline</h4>
              <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-[#E5E7EB]">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-[#065F46] rounded-full"></div>
                  <p className="text-xs font-bold text-[#111827]">{planName} {isTrial ? 'Trial' : isActive ? 'Active' : isCancelPending ? 'Ending' : 'Inactive'}</p>
                  <p className="text-[10px] text-[#6B7280]">
                    {clinic?.created_at ? new Date(clinic.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                  </p>
                </div>
                {clinic?.current_period_end && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-white border-2 border-[#E5E7EB] rounded-full"></div>
                    <p className="text-xs font-bold text-[#6B7280]">{isCancelPending ? 'Access Ends' : 'Upcoming Renewal'}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h4 className="text-[11px] font-black text-[#111827] uppercase tracking-widest mb-4">Common Questions</h4>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-[#E5E7EB] rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[11px] font-bold text-[#111827] pr-2">{faq.q}</span>
                      <span className="material-symbols-outlined text-xs text-[#9CA3AF] flex-shrink-0 transition-transform" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                    </button>
                    {openFaq === i && (
                      <div className="px-3 pb-3 text-[10px] text-[#6B7280] leading-relaxed border-t border-[#E5E7EB] pt-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Contact Support */}
              <a href="mailto:tokenpe.online@gmail.com" className="mt-6 flex items-center gap-2 p-3 border border-[#E5E7EB] rounded-xl text-[11px] font-bold text-[#065F46] hover:bg-teal-50 transition-colors">
                <span className="material-symbols-outlined text-base">headset_mic</span>
                Contact Support
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MODALS ── */}

      {/* Details Modal */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-10 relative shadow-2xl">
            <button onClick={() => setShowDetails(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-[#111827] mb-2 tracking-tight">Detailed Feature Breakdown</h2>
            <p className="text-[#6B7280] mb-8">A comprehensive look at what&apos;s included in every TokenPe subscription tier.</p>

            <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
              <table className="w-full min-w-[600px] text-sm text-left">
                <thead className="bg-[#F9FAFB] text-[#6B7280] text-xs uppercase font-bold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-6 py-4 w-2/5">Feature</th>
                    <th className="px-4 py-4 text-center">Starter</th>
                    <th className="px-4 py-4 text-center text-[#065F46]">Pro</th>
                    <th className="px-4 py-4 text-center text-[#F59E0B]">Elite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
                  {[
                    ['Daily Patient Limit', '50', '150', 'Unlimited'],
                    ['WhatsApp Alerts', 'Text only', 'Text + AI Voice', 'Text + AI Voice'],
                    ['AI Voice Notes (10 langs)', '—', '✓', '✓'],
                    ['Patient Visit History', '7 Days', '30 Days', '365 Days'],
                    ['Report Download', '7 Days', '30 Days', 'Unlimited'],
                    ['Multi-Clinic Management', '—', '—', '✓'],
                    ['CRM Broadcasts', '—', '—', '✓'],
                    ['VIP WhatsApp Support', '—', '—', '✓'],
                  ].map(([feature, s, p, e]) => (
                    <tr key={feature}>
                      <td className="px-6 py-4 font-bold">{feature}</td>
                      <td className="px-4 py-4 text-center text-[#6B7280]">{s}</td>
                      <td className="px-4 py-4 text-center font-bold text-[#065F46]">{p}</td>
                      <td className="px-4 py-4 text-center font-bold text-[#F59E0B]">{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div onClick={() => setShowCancelModal(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[400px] rounded-3xl p-8 relative shadow-2xl">
            <h3 className="text-xl font-black text-[#111827] mb-2">Cancel Subscription?</h3>
            <p className="text-sm text-[#6B7280] mb-6">We&apos;re sorry to see you go. You will retain full access until <strong>{clinic?.current_period_end ? new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'end of billing period'}</strong>.</p>

            <select
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full mb-6 p-3 border border-[#E5E7EB] rounded-xl text-sm bg-gray-50 outline-none focus:border-[#065F46]"
            >
              <option value="">Select a reason... (Optional)</option>
              <option value="too_expensive">Too expensive</option>
              <option value="missing_features">Missing features I need</option>
              <option value="hard_to_use">Too hard to use</option>
              <option value="not_enough_patients">Not getting enough patients</option>
              <option value="other">Other reason</option>
            </select>

            <div className="flex flex-col gap-3">
              <button onClick={() => setShowCancelModal(false)} disabled={isCanceling} className="w-full py-3 bg-[#065F46] text-white rounded-xl font-bold shadow-sm hover:bg-[#064E3B] transition-colors disabled:opacity-60">
                Keep my plan
              </button>
              <button onClick={executeCancel} disabled={isCanceling} className="w-full py-3 bg-transparent text-[#EF4444] border border-[#FECACA] rounded-xl font-bold hover:bg-[#FEF2F2] transition-colors disabled:opacity-60">
                {isCanceling ? 'Canceling...' : 'Yes, cancel subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div onClick={() => setShowSuccessModal(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl border border-[#065F46]/20" style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)' }}>
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-[#065F46]">
              <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#065F46] mb-2">You&apos;re all set!</h3>
            <p className="text-sm text-[#065F46]/80 mb-8">
              Your <strong>{showSuccessModal}</strong> plan is now active. All features are unlocked.
            </p>
            <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-[#065F46] text-white rounded-xl font-bold shadow-lg shadow-teal-900/20 hover:opacity-90 transition-all">
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  )
}
