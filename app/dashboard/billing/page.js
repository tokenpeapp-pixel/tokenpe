'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getISTDateString } from '../../../lib/supabase'
import confetti from 'canvas-confetti'
import { 
  Gift, AlertTriangle, Hourglass, RefreshCw, CheckCircle2,
  LayoutDashboard, Layers, History, BarChart2, Megaphone, CreditCard, HelpCircle, User,
  Sparkles, Check, ChevronDown, ShieldCheck, Zap, Headphones, Building2, Star, ArrowUpRight, X, Lock,
  ArrowRight, CheckCircle, Circle, ArrowLeft, Download, FileText, Calendar, Plus, Minus
} from 'lucide-react'

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
  const [sbTooltip, setSbTooltip]         = useState(null)

  // Custom Days State for Elite Custom Duration
  const [customDays, setCustomDays]             = useState(30)
  const [showCustomModal, setShowCustomModal]   = useState(false)
  const [customBranchCount, setCustomBranchCount] = useState('5-10')
  const [customReqNotes, setCustomReqNotes]     = useState('')
  const [customSubmitted, setCustomSubmitted]   = useState(false)

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

      const userClinics = JSON.parse(localStorage.getItem('tokenpe_user_businesses') || '[]')
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

  const handleUpgrade = useCallback(async (tier, cycle = 'monthly', days = 30) => {
    if (!clinic || upgrading) return
    setUpgrading(`${tier}_${cycle}`)
    try {
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: clinic.id, planTier: tier, billingCycle: cycle, customDays: days })
      })
      const data = await res.json()
      if (!res.ok || !data.subscriptionId) throw new Error(data.error || 'Failed to create subscription')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'TokenPe',
        description: `${PLAN_META[tier]?.name || tier} Plan (${cycle.toUpperCase()})`,
        image: `${window.location.origin}/logo-light.svg`,
        prefill: { name: data.clinicName, email: data.clinicEmail, contact: data.businessPhone },
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

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    setCustomSubmitted(true)
    setTimeout(() => {
      setShowCustomModal(false)
      setCustomSubmitted(false)
      setCustomReqNotes('')
    }, 2500)
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F2F7F2' }}>
      <aside className="dashboard-sidebar" style={{ width: 240, background: '#CBE4D3', borderRight: '1px solid #A8D5B5', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh' }}>
        <div style={{ padding: '0 4px', marginBottom: 28 }}>
          <img src="/logo-light.svg" alt="TokenPe" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-10 h-10 border-4 border-[#C3DBC7] border-t-[#2D6A4F] rounded-full animate-spin"></div>
      </div>
    </div>
  )

  // ── Derived state ──────────────────────────────────────────────────────────
  const planId       = clinic?.plan_id || 'starter'
  const planMeta     = PLAN_META[planId] || PLAN_META['starter']
  const planName     = planMeta.name

  const status          = clinic?.subscription_status || 'trialing'
  const isTrial         = status === 'trialing'
  const isActive        = status === 'active'
  const isCanceled      = status === 'canceled'

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

  const faqs = [
    { q: 'Can I change or upgrade my plan anytime?', a: 'Yes! You can upgrade anytime. Upgrades take effect immediately upon payment confirmation. If you want to downgrade, simply cancel your current subscription and choose another tier.' },
    { q: 'What is included in the Elite Custom Duration plan?', a: 'The Elite Custom Duration plan unlocks 100% of Elite features (unlimited OPD tokens, WhatsApp AI voice notes, CRM broadcasting, multi-branch support) for the exact number of days you select, starting at ₹178/day.' },
    { q: 'Can I cancel my subscription anytime?', a: 'Yes! You can cancel at any time directly from this page. You retain full access to all Elite features until the end of your current active billing period.' },
    { q: 'Do you offer refunds for unused days?', a: 'We do not provide pro-rated refunds for partial periods. However, your account retains full active access until the end of your prepaid days.' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: '#F2F7F2', overflowX: 'hidden' }}>
      <style jsx global>{`
        .sidebar-btn {
          display: flex !important;
          align-items: center !important;
          flex-direction: row !important;
          gap: 10px !important;
          padding: 10px 14px !important;
          border-radius: 12px !important;
          background: transparent;
          color: #1E3A2B !important;
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          border: none !important;
          cursor: pointer !important;
          width: 100% !important;
          text-align: left !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          white-space: nowrap !important;
          overflow: hidden !important;
        }
        .sidebar-btn:hover {
          background: #BFE3CD !important;
          color: #064E3B !important;
          padding-left: 20px !important;
          box-shadow: 0 4px 12px rgba(6,78,59,0.08) !important;
        }
        .sidebar-btn.active {
          background: #BFE3CD !important;
          color: #064E3B !important;
          font-weight: 800 !important;
          box-shadow: inset 3px 0 0 #064E3B !important;
        }
        .sidebar-btn .sb-label {
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .plan-card-hover {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease !important;
          will-change: transform;
        }
        .plan-card-hover:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 45px rgba(6, 95, 70, 0.12), 0 0 0 2px rgba(16, 185, 129, 0.3) !important;
        }
        .plan-card-amber:hover {
          box-shadow: 0 20px 45px rgba(217, 119, 6, 0.14), 0 0 0 2px rgba(217, 119, 6, 0.3) !important;
        }

        .plan-btn-hover {
          transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), filter 0.18s ease, box-shadow 0.18s ease !important;
        }
        .plan-btn-hover:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.01) !important;
          filter: brightness(1.06) !important;
          box-shadow: 0 8px 24px rgba(6, 95, 70, 0.25) !important;
        }
        .plan-btn-hover:active:not(:disabled) {
          transform: scale(0.97) !important;
        }

        .banner-hover {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease !important;
        }
        .banner-hover:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 24px 50px rgba(5, 46, 32, 0.3) !important;
        }

        .day-btn-hover {
          transition: all 0.15s ease !important;
        }
        .day-btn-hover:hover {
          transform: scale(1.05) !important;
        }

        .faq-card-item {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .faq-card-item:hover {
          border-color: #065F46 !important;
          box-shadow: 0 8px 20px rgba(6, 95, 70, 0.08) !important;
        }
      `}</style>
      
      {/* ── LEFT SIDEBAR NAVIGATION ── */}
      <aside className="dashboard-sidebar" style={{ width: 240, background: '#CBE4D3', borderRight: '1px solid #A8D5B5', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'visible' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', overflowX: 'hidden', flex: 1, paddingBottom: 8 }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', marginBottom: 28 }}>
            <img src="/logo-light.svg" alt="TokenPe" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Nav Group: Console */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1E3A2B', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 6 }}>Console</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Dashboard', desc: 'Live queue overview & clinic stats', icon: <LayoutDashboard className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard') },
                { label: 'Manage Branches', desc: 'Set up & switch between clinic locations under one account', icon: <Layers className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {} },
                { label: 'History', desc: 'Browse completed & past patient consultation records', icon: <History className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/history') },
                { label: 'Analytics & Reports', desc: 'Track peak OPD hours, average wait times, reason breakdowns, and patient-wise statistics.', icon: <BarChart2 className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/analytics') },
                { label: 'Broadcasting & CRM', desc: 'Send bulk WhatsApp alerts & manage patient relationships', icon: <Megaphone className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/crm') },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="sidebar-btn"
                  onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setSbTooltip({ label: item.label, desc: item.desc, y: r.top + r.height / 2 }) }}
                  onMouseLeave={() => setSbTooltip(null)}
                >
                  {item.icon}
                  <span className="sb-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#A8D5B5', margin: '14px 8px' }} />

          {/* Nav Group: Account */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Billing & Plans', desc: 'Manage your TokenPe subscription & plan features', icon: <CreditCard className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {}, active: true },
              { label: 'Help & Support', desc: 'Report bugs, raise issues & get in touch with our team', icon: <HelpCircle className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {} },
              { label: 'Edit Profile', desc: 'Update clinic name, contact info & branding', icon: <User className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {} },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`sidebar-btn${item.active ? ' active' : ''}`}
                onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setSbTooltip({ label: item.label, desc: item.desc, y: r.top + r.height / 2 }) }}
                onMouseLeave={() => setSbTooltip(null)}
              >
                {item.icon}
                <span className="sb-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Floating Hover Tooltip */}
      {sbTooltip && (
        <div style={{ position: 'fixed', left: 248, top: sbTooltip.y, transform: 'translateY(-50%)', background: '#0F291B', color: '#FFFFFF', padding: '10px 14px', borderRadius: 10, fontSize: '0.78rem', zIndex: 99999, pointerEvents: 'none', maxWidth: 220, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 800, marginBottom: 2, color: '#A7F3D0' }}>{sbTooltip.label}</div>
          <div style={{ fontSize: '0.72rem', color: '#D1FAE5', lineHeight: 1.3 }}>{sbTooltip.desc}</div>
        </div>
      )}

      {/* ── Main Content (Full Width View) ── */}
      <main className="flex-grow lg:overflow-y-auto lg:h-screen">
        <div className="max-w-[1040px] mx-auto p-4 sm:p-6 lg:p-10">

          {/* Top Back Navigation */}
          <div className="mb-6">
            <button onClick={() => router.push('/dashboard')} className="text-[#065F46] font-bold text-[13px] hover:underline flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </div>

          {/* ── 1. ACTIVE SUBSCRIPTION STATUS BANNER (Dark Green Theme) ── */}
          <section className="banner-hover bg-gradient-to-br from-[#052E20] via-[#0A3F2C] to-[#042A1D] text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden border border-[#0A4B35]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="text-[11px] font-black text-[#F59E0B] uppercase tracking-widest mb-2">
                  ACTIVE SUBSCRIPTION STATUS
                </div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{planName}</h2>
                  {isTrial && !isTrialExpired && (
                    <span className="px-3.5 py-1 bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                      <Gift className="w-3.5 h-3.5" /> FREE TRIAL — {daysLeft} DAYS LEFT
                    </span>
                  )}
                  {isActive && (
                    <span className="px-3.5 py-1 bg-emerald-500/20 text-[#A7F3D0] border border-[#10B981]/40 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE SUBSCRIPTION
                    </span>
                  )}
                  {isCanceled && (
                    <span className="px-3.5 py-1 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                      CANCELED
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-teal-100/90 font-medium">
                  {isTrial 
                    ? `Trial valid through ${trialEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. All ${planName} features enabled.` 
                    : `Subscribed through ${new Date(clinic?.current_period_end || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
                </p>
              </div>

              <button
                onClick={() => setShowDetails(true)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-center flex-shrink-0 backdrop-blur-sm"
              >
                <FileText className="w-4 h-4 text-emerald-300" /> View Feature Specs
              </button>
            </div>
          </section>

          {/* ── 2. AVAILABLE SUBSCRIPTION TIERS SECTION ── */}
          <section className="mb-12" id="plans-section">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg sm:text-xl font-black text-[#111827]">Available Subscription Tiers</h3>
            </div>

            {/* ── THE 3 ELITE SUBSCRIPTION CARDS (Exact match to reference UI) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* ── CARD 1: ELITE MONTHLY PLAN ── */}
              <div className="plan-card-hover plan-card-amber bg-white border border-[#E5E7EB] rounded-3xl p-6 flex flex-col relative shadow-sm transition-all">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D97706] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  MOST COMMON
                </div>

                <div className="mt-2 mb-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#D97706]">
                    ELITE MONTHLY
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black text-[#111827]">₹5,000</span>
                    <span className="text-sm font-semibold text-[#6B7280]">/month</span>
                  </div>
                  <div className="text-xs font-bold text-[#D97706] mt-1">
                    Standard monthly billing
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    'Unlimited tokens & patients/day',
                    'WhatsApp SMS & AI Voice alerts',
                    '365-day full history & export',
                    'OPD Analytics dashboard',
                    'Patient Directory (CRM)',
                    'Multi-branch management'
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#374151] font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={upgrading === 'elite_monthly'}
                  onClick={() => handleUpgrade('elite', 'monthly')}
                  className="plan-btn-hover w-full py-3 bg-[#D97706] text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  Select Elite Monthly
                </button>
              </div>

              {/* ── CARD 2: ELITE YEARLY PLAN (BEST VALUE) ── */}
              <div className="plan-card-hover bg-white border-2 border-[#10B981] rounded-3xl p-6 flex flex-col relative shadow-lg shadow-emerald-900/5 transition-all">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#059669] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  BEST VALUE — SAVE ₹10,000
                </div>

                <div className="mt-2 mb-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#059669]">
                    ELITE YEARLY
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black text-[#111827]">₹50,000</span>
                    <span className="text-sm font-semibold text-[#6B7280]">/year</span>
                  </div>
                  <div className="text-xs font-bold text-[#059669] mt-1">
                    ₹4,167/mo — 2 months FREE
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start gap-2 text-xs text-[#374151] font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                    <span>Everything in Monthly</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#374151] font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                    <span>2 months FREE vs monthly rate</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#374151] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                    <span>Priority VIP Support</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#374151] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                    <span>All future updates included</span>
                  </li>
                </ul>

                <button
                  disabled={upgrading === 'elite_yearly'}
                  onClick={() => handleUpgrade('elite', 'yearly')}
                  className="plan-btn-hover w-full py-3 bg-[#059669] text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  Select Elite Yearly
                </button>
              </div>

              {/* ── CARD 3: ELITE CUSTOM DURATION PLAN (GREEN / MINT THEME) ── */}
              <div className="plan-card-hover bg-white border border-[#E5E7EB] rounded-3xl p-6 flex flex-col relative shadow-sm transition-all">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#065F46] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  FLEXIBLE DURATION
                </div>

                <div className="mt-2 mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#065F46]">
                    ELITE CUSTOM DURATION
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black text-[#111827]">₹178</span>
                    <span className="text-sm font-semibold text-[#6B7280]">/day</span>
                  </div>
                  <div className="text-xs font-bold text-[#065F46] mt-1">
                    Total: ₹{(178 * customDays).toLocaleString('en-IN')} ({customDays} days)
                  </div>
                </div>

                {/* Interactive Days Control Box */}
                <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-3.5 mb-5">
                  <div className="text-[11px] font-bold text-[#065F46] mb-2">Select Number of Days:</div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <button
                      onClick={() => setCustomDays(d => Math.max(1, d - 1))}
                      className="day-btn-hover w-8 h-8 rounded-lg bg-white border border-[#A7F3D0] text-[#065F46] font-extrabold flex items-center justify-center hover:bg-teal-50 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={e => setCustomDays(Math.min(365, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="flex-1 text-center py-1 bg-white border border-[#A7F3D0] rounded-lg text-sm font-black text-[#065F46] outline-none"
                    />
                    <button
                      onClick={() => setCustomDays(d => Math.min(365, d + 1))}
                      className="day-btn-hover w-8 h-8 rounded-lg bg-white border border-[#A7F3D0] text-[#065F46] font-extrabold flex items-center justify-center hover:bg-teal-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[7, 14, 30, 90].map(d => (
                      <button
                        key={d}
                        onClick={() => setCustomDays(d)}
                        className={`day-btn-hover py-1 rounded-md text-[10px] font-bold transition-all ${customDays === d ? 'bg-[#065F46] text-white shadow-sm' : 'bg-white text-[#065F46] border border-[#A7F3D0] hover:bg-teal-50'}`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-grow">
                  <li className="flex items-start gap-2 text-xs text-[#374151] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#065F46] flex-shrink-0 mt-0.5" />
                    <span>Choose exact number of days</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#374151] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#065F46] flex-shrink-0 mt-0.5" />
                    <span>All Elite features included</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#374151] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#065F46] flex-shrink-0 mt-0.5" />
                    <span>Min 1 day, max 365 days</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#374151] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#065F46] flex-shrink-0 mt-0.5" />
                    <span>Ideal for events & OPD camps</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#374151] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#065F46] flex-shrink-0 mt-0.5" />
                    <span>Pay only for what you use</span>
                  </li>
                </ul>

                <button
                  disabled={upgrading === 'elite_custom'}
                  onClick={() => handleUpgrade('elite', 'custom', customDays)}
                  className="plan-btn-hover w-full py-3 bg-[#065F46] text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  Select Elite Custom Duration
                </button>
              </div>

            </div>
          </section>

          {/* ── 3. FREQUENTLY ASKED QUESTIONS (FAQ Accordion with Hover & Click Effects) ── */}
          <section className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#065F46]" />
                <h3 className="text-lg sm:text-xl font-black text-[#111827]">Frequently Asked Questions</h3>
              </div>
              <a 
                href="mailto:tokenpe.online@gmail.com" 
                className="text-xs font-bold text-[#065F46] hover:underline flex items-center gap-1.5 bg-[#ECFDF5] px-4 py-2 rounded-full border border-[#A7F3D0] transition-all hover:bg-teal-100 self-start sm:self-auto"
              >
                <Headphones className="w-4 h-4" /> Contact Support
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i
                return (
                  <div 
                    key={i} 
                    className={`faq-card-item bg-white border rounded-2xl transition-all duration-200 overflow-hidden ${
                      isOpen 
                        ? 'border-[#065F46] shadow-md bg-[#F0FDF4]/50' 
                        : 'border-[#E5E7EB] hover:border-[#A7F3D0]'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex justify-between items-center p-5 text-left transition-all active:scale-[0.99]"
                    >
                      <span className={`text-sm font-bold transition-colors pr-2 ${isOpen ? 'text-[#065F46]' : 'text-[#111827]'}`}>
                        {faq.q}
                      </span>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isOpen ? 'bg-[#065F46] text-white rotate-180' : 'bg-gray-100 text-[#6B7280]'
                      }`}>
                        <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-[#4B5563] leading-relaxed border-t border-[#E5E7EB]/60 pt-3.5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── 4. ENTERPRISE CUSTOM PLAN BANNER ── */}
          <section className="mb-12">
            <div className="banner-hover bg-gradient-to-br from-[#065F46] to-[#043E2E] text-white rounded-3xl p-8 shadow-xl border border-[#065F46] relative overflow-hidden">
              <div className="max-w-2xl relative z-10">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="px-3 py-1 bg-[#10B981]/30 text-[#A7F3D0] border border-[#10B981]/40 rounded-full text-xs font-black uppercase tracking-wider">
                    Enterprise & Hospital Chains
                  </span>
                  <span className="px-3.5 py-1 bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/50 rounded-full text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
                    COMING SOON
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-3 text-white">Custom OPD Infrastructure & Multi-Branch Networks</h3>
                <p className="text-sm text-teal-100/90 mb-6 leading-relaxed">
                  Designed specifically for multi-doctor polyclinics, hospital networks, and regional healthcare groups requiring dedicated servers, custom EMR integrations, and tailored SLAs.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {[
                    'Unlimited Doctors & Branch Locations',
                    'Custom WhatsApp EMR & API Integrations',
                    'Dedicated 24/7 Account Manager & Priority Tech Support',
                    'Custom White-Label OPD Branding & TV Displays',
                    'HIPAA & Local Healthcare Data Compliance',
                    'On-Premise or Private Cloud Dedicated Deployment'
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-teal-50">
                      <CheckCircle2 className="w-4 h-4 text-[#A7F3D0] flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowCustomModal(true)}
                    className="px-6 py-3 bg-white text-[#065F46] font-bold text-sm rounded-xl shadow-lg hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4" /> Request Custom Enterprise Quote
                  </button>
                  <a
                    href="https://wa.me/917715951068?text=Hi%20TokenPe%20Team%2C%20I%20want%20to%20inquire%20about%20Custom%20Enterprise%20Plan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-[#10B981]/30 border border-[#A7F3D0]/40 text-white font-bold text-sm rounded-xl hover:bg-[#10B981]/40 transition-all flex items-center justify-center gap-2"
                  >
                    <Headphones className="w-4 h-4" /> Chat with Sales Team
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ── 5. BILLING HISTORY ── */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-bold text-[#111827]">Billing History & Invoices</h3>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden text-sm p-8 text-center text-[#6B7280]">
              No past invoice receipts found.
            </div>
          </section>

        </div>
      </main>

      {/* ── MODALS ── */}

      {/* Custom Enterprise Request Modal */}
      {showCustomModal && (
        <div onClick={() => setShowCustomModal(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[480px] rounded-3xl p-6 sm:p-8 relative shadow-2xl">
            <button onClick={() => setShowCustomModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            {customSubmitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-[#DCFCE7] text-[#166534] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#065F46] mb-2">Quote Request Submitted!</h3>
                <p className="text-xs text-[#6B7280]">Our Enterprise account executive will contact you shortly via email or phone.</p>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit}>
                <div className="flex items-center gap-2 mb-2 text-[#065F46]">
                  <Building2 className="w-5 h-5" />
                  <h3 className="text-xl font-black text-[#111827]">Request Custom Enterprise Quote</h3>
                </div>
                <p className="text-xs text-[#6B7280] mb-6">Tell us about your multi-branch or hospital setup.</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">Clinic / Branch Count</label>
                    <select
                      value={customBranchCount}
                      onChange={e => setCustomBranchCount(e.target.value)}
                      className="w-full p-2.5 border border-[#E5E7EB] rounded-xl text-xs bg-gray-50 outline-none focus:border-[#065F46]"
                    >
                      <option value="2-5">2 to 5 Clinics</option>
                      <option value="5-10">5 to 10 Clinics</option>
                      <option value="10-25">10 to 25 Clinics / Hospitals</option>
                      <option value="25+">25+ Enterprise Network</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">Custom Requirements / Notes</label>
                    <textarea
                      rows={3}
                      value={customReqNotes}
                      onChange={e => setCustomReqNotes(e.target.value)}
                      placeholder="Specify custom WhatsApp templates, EMR API needs, dedicated server hosting, etc..."
                      className="w-full p-2.5 border border-[#E5E7EB] rounded-xl text-xs bg-gray-50 outline-none focus:border-[#065F46]"
                    ></textarea>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCustomModal(false)} className="flex-1 py-2.5 border border-[#E5E7EB] text-[#374151] rounded-xl font-bold text-xs hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#065F46] text-white rounded-xl font-bold text-xs hover:bg-[#043E2E] shadow-sm">
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-10 relative shadow-2xl">
            <button onClick={() => setShowDetails(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X className="w-4 h-4" />
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
              <CheckCircle2 className="w-12 h-12 text-[#065F46]" />
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
    </div>
  )
}
