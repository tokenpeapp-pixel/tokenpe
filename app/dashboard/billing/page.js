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

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) { router.push('/login'); return }
      const clinicData = JSON.parse(stored)

      // Always fetch fresh from Supabase for latest plan info
      const { data: fresh } = await supabase
        .from('clinics').select('*').eq('id', clinicData.id).single()
      const finalData = fresh || clinicData
      setClinic(finalData)
      localStorage.setItem('tokenpe_clinic', JSON.stringify(finalData))

      const today = getISTDateString()
      const { count } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', finalData.id).eq('date', today)
      setTodayCount(count || 0)
      setLoading(false)
    }
    load()
  }, [router])

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [])

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
        image: '/logo.svg',
        prefill: {
          name: data.clinicName,
          email: data.clinicEmail,
          contact: data.clinicPhone,
        },
        theme: { color: '#7C3AED' },
        handler: async function (response) {
          // Payment captured — refresh clinic from DB (webhook will update it)
          setTimeout(async () => {
            const { data: fresh } = await supabase
              .from('clinics').select('*').eq('id', clinic.id).single()
            if (fresh) {
              setClinic(fresh)
              localStorage.setItem('tokenpe_clinic', JSON.stringify(fresh))
            }
            setUpgrading(null)
          }, 2500)
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

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0514' }}>
      <div style={{ width:40, height:40, border:'4px solid rgba(255,255,255,0.1)', borderTopColor:'#7c3aed', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const planId = clinic?.plan_id || 'starter'
  const isTrial = clinic?.subscription_status === 'trialing'
  const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
  const planName = planId === 'starter' ? 'Starter' : planId === 'pro' ? 'Pro' : 'Elite'
  const percentage = limit === Infinity ? 0 : Math.min((todayCount / limit) * 100, 100)

  const trialEnd = clinic.trial_ends_at
    ? new Date(clinic.trial_ends_at)
    : (clinic.created_at ? new Date(new Date(clinic.created_at).getTime() + 14 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  
  const daysLeft = isTrial
    ? Math.max(0, Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  const plans = [
    {
      tier: 'starter', name: 'Starter', price: '₹499', emoji: '🥉',
      features: ['Up to 50 patients/day', 'WhatsApp Text Alerts', '7 Days History', 'Auto-generated Clinic Code'],
      btnColor: 'rgba(255,255,255,0.1)', textColor: '#fff', glow: 'none', popular: false
    },
    {
      tier: 'pro', name: 'Pro', price: '₹999', emoji: '🥈',
      features: ['Up to 150 patients/day', '🎙️ Sarvam AI Voice Notes', '30 Days History', 'Custom Clinic Code (e.g. DRSHARMA)', 'Priority Email Support'],
      btnColor: '#7c3aed', textColor: '#fff', glow: '0 8px 24px rgba(124,58,237,0.5)', popular: true
    },
    {
      tier: 'elite', name: 'Elite', price: '₹1999', emoji: '🥇',
      features: ['Unlimited patients/day', '🎙️ Priority AI Voice Routing', 'Unlimited History + Excel Export', 'Custom Clinic Code', '👥 Receptionist Staff Accounts', '📢 Patient Broadcasts (CRM)'],
      btnColor: '#f59e0b', textColor: '#000', glow: '0 8px 24px rgba(245,158,11,0.4)', popular: false
    }
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#0a0514', color:'#fff', fontFamily:"'Inter',sans-serif" }}>
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
        <div style={{ display:'flex', alignItems:'center', gap:16, overflow: 'hidden' }}>
          <img src="/logo.svg" alt="TokenPe" style={{ height:32, flexShrink: 0 }} onError={e => e.target.style.display='none'} />
          <div className="header-title">Billing & Subscription</div>
        </div>
        <button className="back-btn" onClick={() => router.push('/dashboard')} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', padding:'10px 16px', borderRadius:8, cursor:'pointer', fontWeight:600 }}>
          ← Back to Dashboard
        </button>
      </header>

      <main style={{ maxWidth:1040, margin:'0 auto', padding:'40px 24px' }}>
        {/* CURRENT PLAN CARD */}
        <section style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:24, padding:32, marginBottom:40 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:24 }}>
            <div>
              <div style={{ fontSize:13, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1.5, fontWeight:700, marginBottom:8 }}>Current Plan</div>
              <div style={{ fontSize:36, fontWeight:900, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                {planName}
                {isTrial && (
                  <span style={{ fontSize:13, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', padding:'4px 12px', borderRadius:20, fontWeight:800, letterSpacing:0.5 }}>
                    🎁 FREE TRIAL — {daysLeft} days left
                  </span>
                )}
                {!isTrial && <span style={{ fontSize:13, background:'rgba(16,185,129,0.2)', color:'#34d399', border:'1px solid rgba(16,185,129,0.3)', padding:'4px 12px', borderRadius:20, fontWeight:700 }}>ACTIVE</span>}
              </div>
              <div style={{ color:'#cbd5e1', marginTop:10, fontSize:15, lineHeight:1.7 }}>
                {isTrial
                  ? `Trial ends on ${trialEnd.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}. Upgrade now to keep your features!`
                  : `Your ${planName} plan renews on ${clinic.current_period_end ? new Date(clinic.current_period_end).toLocaleDateString('en-IN') : 'N/A'}.`}
              </div>
            </div>

            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:20, padding:24, width:'100%', maxWidth:360, border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                <span style={{ color:'#cbd5e1', fontWeight:600 }}>Today's Usage</span>
                <span style={{ color:'#fff', fontWeight:800 }}>{todayCount} / {limit === Infinity ? '∞' : limit}</span>
              </div>
              <div style={{ width:'100%', height:10, background:'rgba(255,255,255,0.08)', borderRadius:10, overflow:'hidden' }}>
                <div style={{ width:`${percentage}%`, height:'100%', background: percentage > 90 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#8b5cf6,#3b82f6)', borderRadius:10, transition:'width 0.6s ease' }} />
              </div>
              {percentage >= 80 && (
                <div style={{ color: percentage >= 100 ? '#ef4444' : '#f59e0b', fontSize:13, marginTop:10, fontWeight:600 }}>
                  {percentage >= 100 ? '🔒 Daily limit reached — upgrade to add more patients!' : `⚠️ ${Math.round(percentage)}% of daily limit used`}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <h2 style={{ fontSize:26, fontWeight:900, marginBottom:8, textAlign:'center', letterSpacing:'-0.5px' }}>
          {isTrial ? 'Choose Your Plan Before Trial Ends' : 'Upgrade Your Plan'}
        </h2>
        <p style={{ textAlign:'center', color:'#64748b', marginBottom:36, fontSize:15 }}>All plans auto-renew monthly. Cancel anytime.</p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
          {plans.map(plan => {
            const isCurrent = planId === plan.tier && !isTrial
            const isLoading = upgrading === plan.tier
            return (
              <div key={plan.tier} style={{ background: plan.popular ? 'linear-gradient(180deg,rgba(124,58,237,0.12) 0%,rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.02)', border: plan.popular ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:32, display:'flex', flexDirection:'column', position:'relative' }}>
                {plan.popular && <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'#7c3aed', color:'#fff', padding:'4px 16px', borderRadius:20, fontSize:12, fontWeight:800, letterSpacing:1, whiteSpace:'nowrap' }}>MOST POPULAR</div>}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:24 }}>{plan.emoji}</span>
                  <span style={{ fontSize:20, fontWeight:800, color: plan.tier === 'pro' ? '#a78bfa' : plan.tier === 'elite' ? '#fbbf24' : '#fff' }}>{plan.name}</span>
                  {isCurrent && <span style={{ fontSize:11, background:'rgba(16,185,129,0.2)', color:'#34d399', border:'1px solid rgba(16,185,129,0.3)', padding:'2px 10px', borderRadius:20, fontWeight:700 }}>CURRENT</span>}
                </div>
                <div style={{ fontSize:38, fontWeight:900, marginBottom:24 }}>{plan.price} <span style={{ fontSize:16, color:'#64748b', fontWeight:500 }}>/mo</span></div>
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 32px 0', color:'#cbd5e1', fontSize:14, lineHeight:2.1, flex:1 }}>
                  {plan.features.map(f => <li key={f}>✔️ {f}</li>)}
                </ul>
                <button
                  onClick={() => !isCurrent && handleUpgrade(plan.tier)}
                  disabled={isCurrent || !!upgrading}
                  style={{ width:'100%', padding:'15px 24px', background: isCurrent ? 'rgba(255,255,255,0.05)' : plan.btnColor, color: isCurrent ? '#64748b' : plan.textColor, border: isCurrent ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius:14, fontWeight:800, fontSize:15, cursor: isCurrent ? 'default' : 'pointer', boxShadow: isCurrent ? 'none' : plan.glow, opacity: upgrading && upgrading !== plan.tier ? 0.5 : 1, transition:'transform 0.15s,box-shadow 0.15s' }}
                >
                  {isLoading ? '⏳ Opening checkout...' : isCurrent ? '✓ Current Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* FOOTER NOTE */}
        <div style={{ textAlign:'center', marginTop:40, color:'#475569', fontSize:13 }}>
          🔒 Secure payments powered by Razorpay &nbsp;·&nbsp; No credit card stored by TokenPe &nbsp;·&nbsp; Cancel anytime
        </div>
      </main>
    </div>
  )
}
