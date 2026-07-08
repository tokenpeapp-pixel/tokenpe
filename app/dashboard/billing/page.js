'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getISTDateString } from '../../../lib/supabase'
import confetti from 'canvas-confetti'

export default function BillingPage() {
  const router = useRouter()
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayCount, setTodayCount] = useState(0)
  const [upgrading, setUpgrading] = useState(null) // 'starter' | 'pro' | 'elite'
  const [showDetails, setShowDetails] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCanceling, setIsCanceling] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(null)

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

      setClinic(clinicData)
      setLoading(false)

      const today = getISTDateString()

      const [freshRes, countRes] = await Promise.all([
        fetch(`/api/clinics/get?id=${clinicData.id}`),
        fetch(`/api/analytics/count?clinicId=${clinicData.id}&date=${today}`)
      ])
      
      const freshData = freshRes.ok ? await freshRes.json() : null
      const countData = countRes.ok ? await countRes.json() : null

      if (freshData && freshData.success && freshData.clinic) {
        setClinic(freshData.clinic)
        localStorage.setItem('tokenpe_clinic', JSON.stringify(freshData.clinic))
      }
      setTodayCount((countData && countData.success ? countData.count : 0))
    }
    load()
  }, [router])

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
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan Subscription`,
        image: `${window.location.origin}/logo-light.svg`,
        prefill: {
          name: data.clinicName,
          email: data.clinicEmail,
          contact: data.clinicPhone,
        },
        theme: { color: '#0D9488' },
        handler: async function (response) {
          const maxAttempts = 5
          let attempts = 0
          const poll = async () => {
            attempts++
            const res = await fetch(`/api/clinics/get?id=${clinic.id}`)
            let fresh = null
            if (res.ok) {
              const data = await res.json()
              if (data.success) fresh = data.clinic
            }
            if (fresh) {
              setClinic(fresh)
              localStorage.setItem('tokenpe_clinic', JSON.stringify(fresh))
              if (fresh.current_period_end || attempts >= maxAttempts) {
                setUpgrading(null)
                if (fresh.current_period_end && fresh.plan_id !== 'canceled') {
                  setShowSuccessModal(fresh.plan_id.toUpperCase())
                  confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#0D9488', '#2DD4BF', '#059669', '#ffffff'],
                    zIndex: 10000
                  })
                }
                return
              }
            }
            if (attempts < maxAttempts) setTimeout(poll, 2000)
            else setUpgrading(null)
          }
          setTimeout(poll, 2000)
        },
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
  }, [clinic, upgrading])

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

      alert(`Subscription canceled.`)
      const res2 = await fetch(`/api/clinics/get?id=${clinic.id}`)
      let fresh = null
      if (res2.ok) {
        const data2 = await res2.json()
        if (data2.success) fresh = data2.clinic
      }
      if (fresh) {
        setClinic(fresh)
        localStorage.setItem('tokenpe_clinic', JSON.stringify(fresh))
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
      <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#0D9488] rounded-full animate-spin"></div>
    </div>
  )

  const planId = clinic?.plan_id || 'starter'
  const isTrial = clinic?.subscription_status === 'trialing'
  const isCancelPending = clinic?.subscription_status === 'cancel_at_period_end'
  const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
  const planName = planId === 'starter' ? 'Starter' : planId === 'pro' ? 'Pro' : 'Elite'
  const percentage = limit === Infinity ? 0 : Math.min((todayCount / limit) * 100, 100)

  const userClinics = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tokenpe_user_clinics') || '[]') : []
  const oldestClinic = userClinics.length > 0
    ? userClinics.reduce((oldest, c) => new Date(c.created_at) < new Date(oldest.created_at) ? c : oldest, userClinics[0])
    : clinic

  // Calculate trial end and days left
  const [currentDate, setCurrentDate] = useState(null)
  
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  const trialEnd = oldestClinic?.trial_ends_at
    ? new Date(oldestClinic.trial_ends_at)
    : (oldestClinic?.created_at ? new Date(new Date(oldestClinic.created_at).getTime() + 7 * 24 * 60 * 60 * 1000) : (currentDate ? new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null));

  const realDaysLeft = trialEnd && currentDate ? Math.ceil((trialEnd - currentDate) / (1000 * 60 * 60 * 24)) : 0
  const daysLeft = isTrial ? Math.max(0, realDaysLeft) : null
  const isTrialExpired = clinic?.subscription_status === 'trialing' && trialEnd && realDaysLeft < 0
  const isCanceled = clinic?.subscription_status === 'canceled'

  const plans = [
    {
      tier: 'starter', name: 'Starter', price: '₹499', emoji: '🥉',
      features: ['Up to 50 patients/day', 'Standard WhatsApp Alerts', 'Basic 7-day Analytics', 'Auto-Generated Clinic Code']
    },
    {
      tier: 'pro', name: 'Pro', price: '₹999', emoji: '🥈',
      features: ['Up to 150 patients/day', 'Branded WhatsApp Identity', 'Multilingual AI Voice Alerts', 'Queue Pause & Smart Wait Time', '30-Day History & Heatmap']
    },
    {
      tier: 'elite', name: 'Elite', price: '₹1999', emoji: '🥇',
      features: ['Unlimited patients/day', 'Report Download (PDF/CSV)', 'Multi-Clinic Management', 'VIP WhatsApp Support', 'CRM Broadcasts']
    }
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <div className="min-h-screen flex overflow-hidden bg-[#FAFAF8] font-sans text-[#111827]">
        
        {/* Main Content */}
        <main className="flex-grow overflow-y-auto h-screen relative">
          <div className="max-w-[1200px] mx-auto p-4 md:p-8">
            
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
              <div>
                <button onClick={() => router.push('/dashboard')} className="mb-4 text-[#0D9488] font-bold text-[13px] hover:underline flex items-center gap-1">
                  &larr; Back to Dashboard
                </button>
                <h1 className="text-2xl font-black text-[#111827]">Billing</h1>
                <p className="text-sm text-[#6B7280]">Manage your subscription, invoices and payment methods.</p>
              </div>
              <button onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#0D9488] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-teal-900/10 hover:opacity-90 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                <span className="material-symbols-outlined text-[18px]">upgrade</span>
                Upgrade Plan
              </button>
            </div>

            {/* Current Plan Card */}
            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-l-4 border-[#0D9488] pl-4 md:pl-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-black text-[#111827]">{planName} Plan</h2>
                    {isTrial && !isTrialExpired && <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded text-[10px] font-bold uppercase tracking-wider">Free Trial ({daysLeft} days)</span>}
                    {isTrialExpired && <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded text-[10px] font-bold uppercase tracking-wider">Trial Expired</span>}
                    {!isTrial && !isCanceled && <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded text-[10px] font-bold uppercase tracking-wider">Active</span>}
                    {isCanceled && <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded text-[10px] font-bold uppercase tracking-wider">Canceled</span>}
                  </div>
                  <p className="text-sm text-[#6B7280]">Advanced features for growing clinics</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[11px] text-[#9CA3AF] font-bold uppercase">{isCanceled ? 'Subscription Ended' : 'Next Billing Date'}</p>
                  <div className="flex items-center justify-between text-sm font-bold text-[#111827]">
                    <span>{clinic?.current_period_end ? new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : (isTrialExpired ? trialEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '---')}</span>
                    {!isTrialExpired && !isCanceled && <span className="text-[#0D9488]">{planName === 'Starter' ? '₹499' : planName === 'Pro' ? '₹999' : '₹1,999'}/mo</span>}
                  </div>
                  {!isCanceled && !isTrialExpired && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`relative inline-flex h-4 w-8 items-center rounded-full ${!isCancelPending ? 'bg-[#0D9488]' : 'bg-[#E5E7EB]'}`}>
                        <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${!isCancelPending ? 'translate-x-4' : 'translate-x-1'}`}></span>
                      </div>
                      <span className="text-xs text-[#6B7280]">
                        {isCancelPending ? 'Cancellation scheduled' : 'Auto-renewal enabled'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {clinic?.subscription_status === 'active' && !isCancelPending && (
                    <button onClick={() => setShowCancelModal(true)} disabled={!!upgrading} className="flex items-center justify-center gap-2 px-4 py-2 border border-[#FECACA] bg-[#FEF2F2] rounded-lg text-sm font-bold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors">
                      {upgrading === 'cancel' ? 'Canceling...' : 'Cancel Subscription'}
                    </button>
                  )}
                  <button onClick={() => setShowDetails(true)} className="flex items-center justify-center gap-2 px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-sm font-bold text-[#374151] hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-lg">description</span> View Plan Details
                  </button>
                </div>
              </div>
            </section>

            {/* Usage Section */}
            <section className="mb-10">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#111827] mb-4">
                <span className="material-symbols-outlined text-[#0D9488]">bar_chart</span> Usage this month
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Patients Stat */}
                <div className="bg-white p-4 border border-[#E5E7EB] rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#0D9488] text-lg">person</span>
                    </div>
                    <span className="text-xs font-bold text-[#6B7280]">Patients Today</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-[#111827]">{todayCount}</span>
                    <span className="text-[10px] text-[#9CA3AF]">/ {limit === Infinity ? '∞' : limit}</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${percentage >= 100 ? 'bg-[#DC2626]' : percentage >= 80 ? 'bg-[#F59E0B]' : 'bg-[#0D9488]'}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>

                {/* Dummy stats to match the design aesthetics (Optional placeholders) */}
                <div className="bg-white p-4 border border-[#E5E7EB] rounded-xl opacity-70">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600 text-lg">event</span>
                    </div>
                    <span className="text-xs font-bold text-[#6B7280]">Appointments</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-[#111827]">-</span>
                    <span className="text-[10px] text-[#9CA3AF]">Unlimited</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-full"></div>
                  </div>
                </div>

                <div className="bg-white p-4 border border-[#E5E7EB] rounded-xl opacity-70">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-600 text-lg">chat_bubble</span>
                    </div>
                    <span className="text-xs font-bold text-[#6B7280]">WhatsApp</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-[#111827]">-</span>
                    <span className="text-[10px] text-[#9CA3AF]">Unlimited</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-full"></div>
                  </div>
                </div>

                <div className="bg-white p-4 border border-[#E5E7EB] rounded-xl opacity-70">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-600 text-lg">campaign</span>
                    </div>
                    <span className="text-xs font-bold text-[#6B7280]">Voice Alerts</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-[#111827]">-</span>
                    <span className="text-[10px] text-[#9CA3AF]">Unlimited</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-full"></div>
                  </div>
                </div>

              </div>
            </section>

            {/* Plans Section */}
            <section className="mb-12" id="plans-section">
              <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#111827] mb-6">
                <span className="material-symbols-outlined text-[#0D9488]">inventory_2</span> Available plans
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => {
                  const tierLevels = { starter: 1, pro: 2, elite: 3 }
                  const currentLevel = tierLevels[planId] || 1
                  const planLevel = tierLevels[plan.tier]
                  
                  const isCurrent = planId === plan.tier && !isTrial
                  const isDowngrade = planLevel < currentLevel && !isTrial && !isCanceled
                  const canReactivate = isCurrent && (isCancelPending || isCanceled)

                  const isLoading = upgrading === plan.tier
                  const isDisabled = (isCurrent && !canReactivate) || isDowngrade || !!upgrading
                  const buttonText = isLoading ? '⏳ Processing...' : canReactivate ? '🔄 Reactivate Plan' : isCurrent ? '✓ Current Plan' : isDowngrade ? 'Cancel to downgrade' : `Upgrade to ${plan.name}`

                  if (plan.tier === 'starter') {
                    return (
                      <div key={plan.tier} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col hover:border-[#0D9488]/30 transition-all">
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase mb-1">Starter</span>
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-3xl font-black text-[#111827]">{plan.price}</span>
                          <span className="text-sm text-[#9CA3AF]">/mo</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-grow">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-[#4B5563]">
                              <span className="material-symbols-outlined text-[#D1D5DB] text-lg">radio_button_unchecked</span> {f}
                            </li>
                          ))}
                        </ul>
                        <button disabled={isDisabled} onClick={() => (!isCurrent || canReactivate) && !isDowngrade && handleUpgrade(plan.tier)} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${isDisabled ? 'bg-[#F3F4F6] text-[#9CA3AF]' : 'bg-[#0D9488] text-white hover:opacity-90 shadow-lg shadow-teal-900/10'}`}>
                          {buttonText}
                        </button>
                      </div>
                    )
                  }
                  
                  if (plan.tier === 'pro') {
                    return (
                      <div key={plan.tier} className="bg-white border-2 border-[#0D9488] rounded-2xl p-6 flex flex-col relative" style={{boxShadow: '0 0 0 4px rgba(13,148,136,0.06)'}}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0D9488] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
                        <span className="text-[10px] font-bold text-[#0D9488] uppercase mb-1">Professional</span>
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-3xl font-black text-[#111827]">{plan.price}</span>
                          <span className="text-sm text-[#9CA3AF]">/mo</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-grow">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-[#4B5563]">
                              <span className="material-symbols-outlined text-[#0D9488] text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span> {f}
                            </li>
                          ))}
                        </ul>
                        <button disabled={isDisabled} onClick={() => (!isCurrent || canReactivate) && !isDowngrade && handleUpgrade(plan.tier)} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${isDisabled ? 'bg-[#F3F4F6] text-[#9CA3AF] shadow-none' : 'bg-[#0D9488] text-white hover:opacity-90 shadow-lg shadow-teal-900/10'}`}>
                          {buttonText}
                        </button>
                      </div>
                    )
                  }

                  if (plan.tier === 'elite') {
                    return (
                      <div key={plan.tier} className="bg-[#FFFDF7] border border-[#FDE68A] rounded-2xl p-6 flex flex-col hover:border-[#F59E0B] transition-all">
                        <span className="text-[10px] font-bold text-[#F59E0B] uppercase mb-1">Elite</span>
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-3xl font-black text-[#111827]">{plan.price}</span>
                          <span className="text-sm text-[#9CA3AF]">/mo</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-grow">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-[#4B5563]">
                              <span className="material-symbols-outlined text-[#F59E0B] text-lg" style={{fontVariationSettings: "'FILL' 1"}}>stars</span> {f}
                            </li>
                          ))}
                        </ul>
                        <button disabled={isDisabled} onClick={() => (!isCurrent || canReactivate) && !isDowngrade && handleUpgrade(plan.tier)} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${isDisabled ? 'bg-[#F3F4F6] text-[#9CA3AF] shadow-none' : 'bg-[#F59E0B] text-[#111827] hover:opacity-90 shadow-lg shadow-amber-900/10'}`}>
                          {buttonText}
                        </button>
                      </div>
                    )
                  }
                })}
              </div>
            </section>
            
            {/* Billing History Placeholder */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[15px] font-bold text-[#111827]">Billing history</h3>
                <button className="text-[13px] font-bold text-[#0D9488]">Download All</button>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden text-sm p-8 text-center text-[#6B7280]">
                 No billing history available yet.
              </div>
            </section>
            
          </div>
        </main>

        {/* Right Panel */}
        <aside className="hidden lg:flex w-[280px] bg-white border-l border-[#E5E7EB] h-screen overflow-y-auto flex-shrink-0 flex-col">
          <div className="p-6 flex-grow">
            
            {/* Billing Timeline */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6 shadow-sm">
              <h4 className="text-[15px] font-bold text-[#111827] mb-4">Billing Timeline</h4>
              <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-[#E5E7EB]">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-[#0D9488] rounded-full"></div>
                  <p className="text-xs font-bold text-[#111827]">{planName} Active</p>
                  <p className="text-[10px] text-[#6B7280]">{clinic?.created_at ? new Date(clinic.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-white border-2 border-[#E5E7EB] rounded-full"></div>
                  <p className="text-xs font-bold text-[#6B7280]">Upcoming Renewal</p>
                  <p className="text-[10px] text-[#9CA3AF]">{clinic?.current_period_end ? new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '---'}</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h4 className="text-[11px] font-black text-[#111827] uppercase tracking-widest mb-4">Common Questions</h4>
              <div className="space-y-3">
                <div className="p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:border-[#0D9488]/30" onClick={() => setShowDetails(true)}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#111827]">Can I change plans?</span>
                    <span className="material-symbols-outlined text-xs text-[#9CA3AF]">expand_more</span>
                  </div>
                </div>
                <div className="p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:border-[#0D9488]/30" onClick={() => setShowDetails(true)}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#111827]">What&apos;s included in Pro?</span>
                    <span className="material-symbols-outlined text-xs text-[#9CA3AF]">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MODALS */}
      {/* Details Modal */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-10 relative shadow-2xl animate-in zoom-in duration-300">
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
                    <th className="px-4 py-4 text-center text-[#0D9488]">Pro</th>
                    <th className="px-4 py-4 text-center text-[#F59E0B]">Elite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
                  <tr>
                    <td className="px-6 py-4 font-bold">Daily Patient Limit</td>
                    <td className="px-4 py-4 text-center">50</td>
                    <td className="px-4 py-4 text-center font-bold">150</td>
                    <td className="px-4 py-4 text-center font-bold">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold">All WhatsApp Alerts</td>
                    <td className="px-4 py-4 text-center">Text only</td>
                    <td className="px-4 py-4 text-center">Text + AI Voice</td>
                    <td className="px-4 py-4 text-center">Text + AI Voice</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold">AI Voice Notes (10 langs)</td>
                    <td className="px-4 py-4 text-center text-gray-400">—</td>
                    <td className="px-4 py-4 text-center text-[#10B981] font-bold">✓</td>
                    <td className="px-4 py-4 text-center text-[#10B981] font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold">Patient Visit History</td>
                    <td className="px-4 py-4 text-center">7 Days</td>
                    <td className="px-4 py-4 text-center font-bold">30 Days</td>
                    <td className="px-4 py-4 text-center font-bold">365 Days</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold">Report Download</td>
                    <td className="px-4 py-4 text-center">7 Days</td>
                    <td className="px-4 py-4 text-center font-bold">30 Days</td>
                    <td className="px-4 py-4 text-center font-bold">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div onClick={() => setShowCancelModal(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[400px] rounded-3xl p-8 relative shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black text-[#111827] mb-2">Cancel Subscription?</h3>
            <p className="text-sm text-[#6B7280] mb-6">We&apos;re sorry to see you go. You will retain premium access until the end of your billing cycle.</p>
            
            <select
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full mb-6 p-3 border border-[#E5E7EB] rounded-xl text-sm focus:ring-[#0D9488] focus:border-[#0D9488] bg-gray-50 outline-none"
            >
              <option value="">Select a reason... (Optional)</option>
              <option value="too_expensive">Too expensive</option>
              <option value="missing_features">Missing features I need</option>
              <option value="hard_to_use">Too hard to use</option>
              <option value="not_enough_patients">Not getting enough patients</option>
              <option value="other">Other reason</option>
            </select>

            <div className="flex flex-col gap-3">
              <button onClick={() => setShowCancelModal(false)} disabled={isCanceling} className="w-full py-3 bg-[#0D9488] text-white rounded-xl font-bold shadow-sm hover:bg-[#0F766E] transition-colors">
                Keep my plan
              </button>
              <button onClick={executeCancel} disabled={isCanceling} className="w-full py-3 bg-transparent text-[#EF4444] border border-[#FECACA] rounded-xl font-bold hover:bg-[#FEF2F2] transition-colors">
                {isCanceling ? 'Canceling...' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div onClick={() => setShowSuccessModal(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl border border-[#0D9488]/20 animate-in zoom-in duration-500" style={{background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)'}}>
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-[#0D9488]">
              <span className="material-symbols-outlined text-[48px]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#0D9488] mb-2">Success!</h3>
            <p className="text-sm text-[#0D9488]/80 mb-8">Your subscription has been upgraded to {showSuccessModal}. The new features are now unlocked.</p>
            <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-[#0D9488] text-white rounded-xl font-bold shadow-lg shadow-teal-900/20 hover:opacity-90 transition-all">
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

    </>
  )
}
