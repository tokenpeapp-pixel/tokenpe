'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getISTDateString } from '../../../lib/supabase'

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

  useEffect(() => {
    // Inject Razorpay eagerly so it's ready before user clicks Upgrade
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

      // Show cached clinic instantly, then refresh in background in parallel
      setClinic(clinicData)
      setLoading(false)

      const today = getISTDateString()

      // Fetch fresh clinic + today count in parallel
      const [freshResult, countResult] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', clinicData.id).single(),
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicData.id).eq('date', today)
      ])

      if (freshResult.data) {
        setClinic(freshResult.data)
        localStorage.setItem('tokenpe_clinic', JSON.stringify(freshResult.data))
      }
      setTodayCount(countResult.count || 0)
    }
    load()
  }, [router])


  const handleUpgrade = useCallback(async (tier) => {
    if (!clinic || upgrading) return
    setUpgrading(tier)

    try {
      // 1. Create subscription on our server
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, planTier: tier })
      })
      const data = await res.json()
      if (!res.ok || !data.subscriptionId) throw new Error(data.error || 'Failed to create subscription')

      // 2. Open Razorpay checkout
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
        theme: { color: '#7C3AED' },
        handler: async function (response) {
          // Payment captured — poll DB until webhook sets current_period_end (up to 10s)
          const maxAttempts = 5
          let attempts = 0
          const poll = async () => {
            attempts++
            const { data: fresh } = await supabase
              .from('clinics').select('*').eq('id', clinic.id).single()
            if (fresh) {
              setClinic(fresh)
              localStorage.setItem('tokenpe_clinic', JSON.stringify(fresh))
              // Stop polling once webhook has set the plan end date
              if (fresh.current_period_end || attempts >= maxAttempts) {
                setUpgrading(null)
                if (fresh.current_period_end && fresh.plan_id !== 'starter' && fresh.plan_id !== 'canceled') {
                  alert(`🎉 Payment Successful! Your clinic has been upgraded to the ${fresh.plan_id.toUpperCase()} Plan. All features are now unlocked!`)
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

      alert(`Subscription canceled. You will retain access to your ${planName} plan features until the end of your current billing period.`)
      const { data: fresh } = await supabase.from('clinics').select('*').eq('id', clinic.id).single()
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0514' }}>
      <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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

  const trialEnd = oldestClinic?.trial_ends_at
    ? new Date(oldestClinic.trial_ends_at)
    : (oldestClinic?.created_at ? new Date(new Date(oldestClinic.created_at).getTime() + 14 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

  const realDaysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0
  const daysLeft = isTrial ? Math.max(0, realDaysLeft) : null
  const isTrialExpired = clinic?.subscription_status === 'trialing' && trialEnd && realDaysLeft < 0

  const plans = [
    {
      tier: 'starter', name: 'Starter', price: '₹499', emoji: '🥉',
      features: ['Up to 50 patients/day', 'Standard WhatsApp Alerts', 'Basic 7-day Analytics', 'Auto-Generated Clinic Code'],
      btnColor: 'linear-gradient(135deg, #0ea5e9, #2563eb)', textColor: '#fff', glow: '0 8px 24px rgba(14,165,233,0.3)', popular: false
    },
    {
      tier: 'pro', name: 'Pro', price: '₹999', emoji: '🥈',
      features: ['Up to 150 patients/day', 'Branded WhatsApp Identity', 'Multilingual AI Voice Alerts', 'Queue Pause & Smart Wait Time', '30-Day History & Heatmap'],
      btnColor: '#7c3aed', textColor: '#fff', glow: '0 8px 24px rgba(124,58,237,0.5)', popular: true
    },
    {
      tier: 'elite', name: 'Elite', price: '₹1999', emoji: '🥇',
      features: ['Unlimited patients/day', 'Monthly PDF Analytics Report', 'Multi-Clinic Management', 'VIP WhatsApp Support', 'CRM Broadcasts'],
      btnColor: '#f59e0b', textColor: '#000', glow: '0 8px 24px rgba(245,158,11,0.4)', popular: false
    }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0514', color: '#fff', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        .billing-header {
          background: linear-gradient(135deg,#0f0a2a 0%,#1a0b3b 50%,#0c1445 100%);
          padding: 0 24px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(124,58,237,0.2);
        }
        .header-title {
          border-left: 1px solid rgba(255,255,255,0.2);
          padding-left: 16px;
          font-size: 18px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 600px) {
          .billing-header {
            flex-direction: column;
            height: auto;
            padding: 16px;
            gap: 16px;
            align-items: stretch;
          }
          .header-title {
            font-size: 16px;
          }
          .back-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="billing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, overflow: 'hidden' }}>
          <img src="/logo.svg" alt="TokenPe" style={{ height: 32, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
          <div className="header-title">Billing & Subscription</div>
        </div>
        <button className="back-btn" onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Dashboard
        </button>
      </header>

      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 24px' }}>
        {/* CURRENT PLAN CARD */}
        <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 24, padding: 32, marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>Current Plan</div>
              <div style={{ fontSize: 36, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {planName}
                {isTrial && !isTrialExpired && (
                  <span style={{ fontSize: 13, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontWeight: 800, letterSpacing: 0.5 }}>
                    🎁 FREE TRIAL — {daysLeft} days left
                  </span>
                )}
                {isTrialExpired && (
                  <span style={{ fontSize: 13, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontWeight: 800, letterSpacing: 0.5 }}>
                    ⚠️ TRIAL EXPIRED
                  </span>
                )}
                {!isTrial && <span style={{ fontSize: 13, background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 12px', borderRadius: 20, fontWeight: 700 }}>ACTIVE</span>}
              </div>
              <div style={{ color: '#cbd5e1', marginTop: 10, fontSize: 15, lineHeight: 1.7 }}>
                {isTrialExpired
                  ? <span style={{ color: '#f87171', fontWeight: 600 }}>Your free trial expired on {trialEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Please choose a paid plan below to restore access to your dashboard.</span>
                  : isTrial
                    ? `Trial ends on ${trialEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Upgrade now to keep your features!`
                    : isCancelPending && clinic.current_period_end
                      ? <span style={{ color: '#f87171' }}>⚠️ Cancellation scheduled — full access until <strong>{new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. No further charges.</span>
                      : clinic.current_period_end
                        ? <>Next billing date: <strong style={{ color: '#a78bfa' }}>{new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> · Auto-renews at {planName === 'Starter' ? '₹499' : planName === 'Pro' ? '₹999' : '₹1,999'}/mo</>
                        : <span style={{ color: '#64748b', fontSize: 13 }}>⏳ Confirming billing date... (may take a few seconds)</span>}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Today's Usage</span>
                <span style={{ color: '#fff', fontWeight: 800 }}>{todayCount} / {limit === Infinity ? '∞' : limit}</span>
              </div>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ width: `${percentage}%`, height: '100%', background: percentage > 90 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#8b5cf6,#3b82f6)', borderRadius: 10, transition: 'width 0.6s ease' }} />
              </div>
              {percentage >= 80 && (
                <div style={{ color: percentage >= 100 ? '#ef4444' : '#f59e0b', fontSize: 13, marginTop: 10, fontWeight: 600 }}>
                  {percentage >= 100 ? '🔒 Daily limit reached — upgrade to add more patients!' : `⚠️ ${Math.round(percentage)}% of daily limit used`}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, textAlign: 'center', letterSpacing: '-0.5px' }}>
          {isTrial ? 'Choose Your Plan Before Trial Ends' : 'Upgrade Your Plan'}
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 36, fontSize: 15 }}>All plans auto-renew monthly. Cancel anytime.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
          {plans.map(plan => {
            const isCurrent = planId === plan.tier && !isTrial
            const canReactivate = isCurrent && isCancelPending && plan.tier !== 'starter'
            const isLoading = upgrading === plan.tier
            const isDisabled = (isCurrent && !canReactivate) || !!upgrading
            return (
              <div key={plan.tier} className="hover-card" style={{ background: plan.popular ? 'linear-gradient(180deg,rgba(124,58,237,0.12) 0%,rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.02)', border: plan.popular ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {plan.popular && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 800, letterSpacing: 1, whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{plan.emoji}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: plan.tier === 'pro' ? '#a78bfa' : plan.tier === 'elite' ? '#fbbf24' : '#fff' }}>{plan.name}</span>
                  {isCurrent && <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>CURRENT</span>}
                </div>
                <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 24 }}>{plan.price} <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>/mo</span></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: '#cbd5e1', fontSize: 14, lineHeight: 2.1, flex: 1 }}>
                  {plan.features.map(f => <li key={f}>✔️ {f}</li>)}
                </ul>
                {!isCurrent && (
                  <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 12, lineHeight: 1.4 }}>
                    {isTrial
                      ? `Your trial ends without any auto-charge. Choose this plan to continue.`
                      : `Renews monthly at ${plan.price}/mo automatically. Cancel anytime from this page.`}
                  </div>
                )}
                <button
                  onClick={() => (!isCurrent || canReactivate) && handleUpgrade(plan.tier)}
                  disabled={isDisabled}
                  style={{ width: '100%', padding: '15px 24px', background: (isCurrent && !canReactivate) ? 'rgba(255,255,255,0.05)' : plan.btnColor, color: (isCurrent && !canReactivate) ? '#64748b' : plan.textColor, border: (isCurrent && !canReactivate) ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: (isCurrent && !canReactivate) ? 'default' : 'pointer', boxShadow: (isCurrent && !canReactivate) ? 'none' : plan.glow, opacity: upgrading && upgrading !== plan.tier ? 0.5 : 1 }}
                >
                  {isLoading ? '⏳ Opening checkout...' : canReactivate ? '🔄 Reactivate Plan' : isCurrent ? '✓ Current Plan' : `Upgrade to ${plan.name}`}
                </button>
                {isCurrent && plan.tier !== 'starter' && !isTrial && !isCancelPending && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={!!upgrading}
                    style={{ width: '100%', padding: '12px 24px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 12, transition: 'all 0.2s', opacity: upgrading ? 0.5 : 1 }}
                  >
                    {upgrading === 'cancel' ? 'Canceling...' : 'Cancel Subscription'}
                  </button>
                )}
                {isCurrent && plan.tier !== 'starter' && !isTrial && isCancelPending && (
                  <div style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 13, color: '#f87171', textAlign: 'center' }}>
                    ✅ Cancellation scheduled — no further charges
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* DETAILS LINK */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button onClick={() => setShowDetails(true)} style={{ background: "none", border: "none", color: "#a78bfa", fontSize: "15px", fontWeight: "700", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4 }}>
            📄 View Detailed Feature Breakdown & Terms
          </button>
        </div>

        {/* FOOTER NOTE */}
        <div style={{ textAlign: 'center', marginTop: 40, color: '#475569', fontSize: 13 }}>
          🔒 Secure payments powered by Razorpay &nbsp;·&nbsp; No credit card stored by TokenPe &nbsp;·&nbsp; Cancel anytime
        </div>
      </main>

      {/* MODAL */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0f172a", width: "100%", maxWidth: 800, maxHeight: "90vh", overflowY: "auto", borderRadius: 24, padding: "40px 32px", position: "relative", margin: "auto", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <button onClick={() => setShowDetails(false)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", width: 36, height: 36, borderRadius: "50%", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-1px" }}>Detailed Feature Breakdown</h2>
            <p style={{ color: "#94a3b8", marginBottom: 32 }}>A comprehensive look at what's included in every TokenPe subscription tier.</p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "16px 8px", color: "#fff", width: "40%" }}>Feature</th>
                    <th style={{ textAlign: "center", padding: "16px 8px", color: "#94a3b8" }}>Starter</th>
                    <th style={{ textAlign: "center", padding: "16px 8px", color: "#a78bfa", fontWeight: 800 }}>Pro</th>
                    <th style={{ textAlign: "center", padding: "16px 8px", color: "#fbbf24", fontWeight: 800 }}>Elite</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 14, color: "#cbd5e1" }}>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Daily Patient Limit</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>50</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>150</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 700 }}>Unlimited</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>All WhatsApp Alerts</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Text only</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Text + AI Voice</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Text + AI Voice</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>AI Voice Notes (10 languages)</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Clinic Code</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Auto-generated</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>Custom (DRSHARMA)</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>Custom (CITYHOSP)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>QR Card</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Basic</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Name + Address</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Name + Address + Logo</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Queue Pause Button</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Patient Visit History</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>7 Days</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>30 Days</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 700 }}>365 Days</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Smart Wait Time Prediction</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Busy Hour Heatmap</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Personalized Welcome Message</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Multi-Location (3 clinics)</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Patient Feedback & Star Rating</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>CRM Broadcasts</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Smart Patient Follow-ups</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Monthly PDF Report</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#475569" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#34d399", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Dashboard Analytics</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>7 Days</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>30 Days + Heatmap</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>Unlimited + Excel Export</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Support</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Email</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Priority Email & Chat</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>Dedicated WhatsApp Support</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
              <strong>Terms of Subscription:</strong> All plans automatically renew monthly. You can cancel your subscription at any time from the billing dashboard. The free trial is available for 14 days and provides full access to Elite features. After the trial, you must choose a plan to continue service, otherwise access to the platform will be temporarily locked to protect your data.
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {showCancelModal && (
        <div onClick={() => setShowCancelModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0f172a", width: "100%", maxWidth: 440, borderRadius: 24, padding: "32px", position: "relative", margin: "auto", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Cancel Subscription</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 14 }}>We're sad to see you go! You will retain premium access until the end of your billing cycle, after which your account will be securely locked until a new plan is chosen. Could you let us know why you're leaving? (Optional)</p>

            <select
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', marginBottom: 24, fontSize: 14 }}
            >
              <option value="" style={{ color: 'black' }}>Select a reason...</option>
              <option value="too_expensive" style={{ color: 'black' }}>Too expensive</option>
              <option value="missing_features" style={{ color: 'black' }}>Missing features I need</option>
              <option value="hard_to_use" style={{ color: 'black' }}>Too hard to use</option>
              <option value="not_enough_patients" style={{ color: 'black' }}>Not getting enough patients</option>
              <option value="other" style={{ color: 'black' }}>Other reason</option>
            </select>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={executeCancel}
                disabled={isCanceling}
                style={{ flex: 1, padding: '12px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: isCanceling ? 'not-allowed' : 'pointer', opacity: isCanceling ? 0.7 : 1 }}
              >
                {isCanceling ? 'Canceling...' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: isCanceling ? 'not-allowed' : 'pointer', opacity: isCanceling ? 0.7 : 1 }}
              >
                Keep My Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: 60, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "24px", flexWrap: "wrap" }}>
          <a href="/privacy" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: "600", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Privacy Policy</a>
          <a href="/terms" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: "600", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Terms of Service</a>
          <a href="mailto:tokenpe.online@gmail.com" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: "600", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Contact Support</a>
        </div>
        <div style={{ fontSize: "13px", opacity: 0.7 }}>
          Made with ❤️ from TokenPe <br />
          &copy; {new Date().getFullYear()} TokenPe. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
