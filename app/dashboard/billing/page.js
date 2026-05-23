'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getISTDateString } from '../../../lib/supabase'

export default function BillingPage() {
  const router = useRouter()
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayCount, setTodayCount] = useState(0)

  useEffect(() => {
    async function load() {
      const clinicCode = localStorage.getItem('clinicCode')
      if (!clinicCode) {
        router.push('/login')
        return
      }

      const { data: clinicData, error } = await supabase
        .from('clinics').select('*').eq('code', clinicCode).single()

      if (error || !clinicData) {
        router.push('/login')
        return
      }

      setClinic(clinicData)

      // Get today's patient count
      const today = getISTDateString()
      const { count } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicData.id)
        .eq('date', today)

      setTodayCount(count || 0)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0514' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const planId = clinic?.plan_id || 'starter'
  const isTrial = clinic?.subscription_status === 'trialing'
  
  let limit = 50
  let planName = 'Starter'
  if (planId === 'pro') { limit = 150; planName = 'Pro' }
  if (planId === 'elite') { limit = Infinity; planName = 'Elite' }

  const percentage = limit === Infinity ? 0 : Math.min((todayCount / limit) * 100, 100)

  function handleUpgrade(tier) {
    alert(`Razorpay integration coming soon! You selected the ${tier} plan.`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0514', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg,#0f0a2a 0%,#1a0b3b 50%,#0c1445 100%)', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/logo-light.svg" alt="TokenPe" style={{ height: 32 }} />
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 16, fontSize: 18, fontWeight: 700 }}>Billing & Subscription</div>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Dashboard
        </button>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        {/* CURRENT PLAN SECTION */}
        <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 24, padding: 32, marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>Current Plan</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                {planName}
                {isTrial && <span style={{ fontSize: 14, background: '#f59e0b', color: '#fff', padding: '4px 10px', borderRadius: 20, fontWeight: 700, letterSpacing: 0.5 }}>14-DAY FREE TRIAL</span>}
              </div>
              <div style={{ color: '#cbd5e1', marginTop: 8 }}>
                {isTrial 
                  ? `Your free trial of the Elite plan ends on ${new Date(clinic.trial_ends_at).toLocaleDateString()}.` 
                  : `Your subscription is currently ${clinic.subscription_status || 'active'}.`}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Today's Usage</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{todayCount} / {limit === Infinity ? 'Unlimited' : limit}</span>
              </div>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ 
                  width: `${percentage}%`, 
                  height: '100%', 
                  background: percentage > 90 ? '#ef4444' : 'linear-gradient(90deg, #8b5cf6, #3b82f6)', 
                  borderRadius: 10,
                  transition: 'width 0.5s ease'
                }} />
              </div>
              {percentage >= 100 && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 12, fontWeight: 600 }}>Limit Reached! Please upgrade to add more.</div>}
            </div>
          </div>
        </section>

        {/* PRICING TIERS */}
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>Upgrade Your Plan</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          
          {/* STARTER */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Starter</div>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>₹499 <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: '#cbd5e1', fontSize: 15, lineHeight: 2, flex: 1 }}>
              <li>✔️ Up to 50 patients/day</li>
              <li>✔️ WhatsApp Text Alerts</li>
              <li>✔️ 7 Days History</li>
              <li>✔️ Auto-generated Clinic Code</li>
            </ul>
            <button onClick={() => handleUpgrade('starter')} style={{ width: '100%', padding: 16, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Select Starter</button>
          </div>

          {/* PRO */}
          <div style={{ background: 'linear-gradient(180deg, rgba(124,58,237,0.1) 0%, rgba(255,255,255,0.02) 100%)', border: '2px solid #7c3aed', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Most Popular</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#a78bfa' }}>Pro</div>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>₹999 <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: '#cbd5e1', fontSize: 15, lineHeight: 2, flex: 1 }}>
              <li>✔️ Up to 150 patients/day</li>
              <li>✔️ 🎙️ <strong>Sarvam AI Voice Notes</strong></li>
              <li>✔️ 30 Days History</li>
              <li>✔️ <strong>Custom Clinic Code</strong> (e.g. DRSHARMA)</li>
            </ul>
            <button onClick={() => handleUpgrade('pro')} style={{ width: '100%', padding: 16, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>Upgrade to Pro</button>
          </div>

          {/* ELITE */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#fbbf24' }}>Elite <span style={{ fontSize: 12, opacity: 0.7 }}>(Clinic OS)</span></div>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>₹1999 <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: '#cbd5e1', fontSize: 15, lineHeight: 2, flex: 1 }}>
              <li>✔️ <strong>Unlimited patients/day</strong></li>
              <li>✔️ 🎙️ Priority AI Voice Routing</li>
              <li>✔️ Unlimited History + Excel Export</li>
              <li>✔️ Receptionist Staff Accounts</li>
              <li>✔️ Patient Broadcasts (CRM)</li>
            </ul>
            <button onClick={() => handleUpgrade('elite')} style={{ width: '100%', padding: 16, background: '#fbbf24', color: '#000', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Upgrade to Elite</button>
          </div>

        </div>
      </main>
    </div>
  )
}
