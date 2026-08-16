'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  Trophy, Building, CheckCircle2, Users, Megaphone, Camera, Rocket, RefreshCw, Pill, Star,
  LayoutDashboard, Layers, History, BarChart2, CreditCard, HelpCircle, User, ArrowLeft,
  MessageSquare, Send, Sparkles, AlertCircle
} from 'lucide-react'

export default function CRMPage() {
  const router = useRouter()
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [totalPatients, setTotalPatients] = useState(0)
  const [medsReachable, setMedsReachable] = useState(0)
  const [recallReachable, setRecallReachable] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [recentFeedbacks, setRecentFeedbacks] = useState([])
  
  const [welcomeMsg, setWelcomeMsg] = useState('')
  const [savingWelcome, setSavingWelcome] = useState(false)
  const [welcomeSuccess, setWelcomeSuccess] = useState(false)

  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastImage, setBroadcastImage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState(false)

  // Smart Follow-ups Config
  const [followupRecall, setFollowupRecall] = useState(false)
  const [followupMeds, setFollowupMeds] = useState(false)
  const [savingFollowups, setSavingFollowups] = useState(false)
  const [userClinics, setUserClinics] = useState([])
  const [sbTooltip, setSbTooltip] = useState(null)

  async function loadCRMStats(clinicObj) {
    if (!clinicObj || !clinicObj.id) return
    try {
      const statsRes = await fetch(`/api/crm/stats?clinicId=${clinicObj.id}`)
      const stats = await statsRes.json()
      if (stats.success) {
        setTotalPatients(stats.totalPatients || 0)
        setMedsReachable(stats.medsReachable || 0)
        setRecallReachable(stats.recallReachable || 0)
        setAvgRating(stats.avgRating || 0)
        setRecentFeedbacks(stats.recentFeedbacks || [])
      }
    } catch (err) {
      console.error('Failed to fetch CRM stats:', err)
    }
  }

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) { router.push('/business-login'); return }

      const c = JSON.parse(stored)
      
      let freshClinic = null
      try {
        const res = await fetch(`/api/clinics/get?id=${c.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) freshClinic = data.clinic
        }
      } catch (e) {}
      
      const finalClinic = freshClinic || c
      
      setClinic(finalClinic)
      setWelcomeMsg(finalClinic.welcome_message || '')
      setFollowupRecall(finalClinic.smart_recall_enabled || false)
      setFollowupMeds(finalClinic.smart_meds_enabled || false)

      try {
        const storedClinics = localStorage.getItem('tokenpe_user_businesses')
        if (storedClinics) setUserClinics(JSON.parse(storedClinics))
      } catch (e) { /* ignore */ }

      await loadCRMStats(finalClinic)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleBranchChange(e) {
    const selectedId = e.target.value
    const selected = userClinics.find(c => c.id === selectedId)
    if (!selected) return
    setLoading(true)
    
    let freshClinic = null
    try {
      const res = await fetch(`/api/clinics/get?id=${selected.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) freshClinic = data.clinic
      }
    } catch (e) {}
    
    const finalClinic = freshClinic || selected
    
    setClinic(finalClinic)
    setWelcomeMsg(finalClinic.welcome_message || '')
    setFollowupRecall(finalClinic.smart_recall_enabled || false)
    setFollowupMeds(finalClinic.smart_meds_enabled || false)
    setTotalPatients(0)
    setMedsReachable(0)
    setRecallReachable(0)
    setAvgRating(0)
    setRecentFeedbacks([])
    
    await loadCRMStats(finalClinic)
    setLoading(false)
  }

  async function saveWelcomeMessage() {
    setSavingWelcome(true)
    setWelcomeSuccess(false)
    try {
      const res = await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, welcomeMessage: welcomeMsg })
      })
      if (res.ok) {
        setWelcomeSuccess(true)
        setTimeout(() => setWelcomeSuccess(false), 3000)
        const updated = { ...clinic, welcome_message: welcomeMsg }
        setClinic(updated)
        localStorage.setItem('tokenpe_clinic', JSON.stringify(updated))
      }
    } catch (err) {
      alert('Error saving welcome message')
    }
    setSavingWelcome(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const fileName = `broadcasts/${clinic.id}_${Date.now()}.png`
      const { data, error } = await supabase.storage.from('voice-notes').upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('voice-notes').getPublicUrl(fileName)
      setBroadcastImage(publicUrl)
    } catch(err) {
      alert('Error uploading image: ' + err.message)
    }
    setUploadingImage(false)
  }

  async function sendBroadcast() {
    if (!broadcastMsg.trim() && !broadcastImage) return alert('Please enter a message or upload an image.')
    if (!confirm(`Are you sure you want to send this broadcast to ${totalPatients} patients?`)) return

    setSendingBroadcast(true)
    setBroadcastSuccess(false)
    
    try {
      const res = await fetch('/api/clinic-v2/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMsg || ' ', imageUrl: broadcastImage })
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setBroadcastSuccess(true)
        setBroadcastMsg('')
        setBroadcastImage('')
        setTimeout(() => setBroadcastSuccess(false), 5000)
      } else {
        alert(data.error || 'Failed to send broadcast')
      }
    } catch (err) {
      alert('Error sending broadcast')
    }
    setSendingBroadcast(false)
  }

  async function saveFollowupConfig(field, value) {
    setSavingFollowups(true)
    try {
      const payload = { clinicId: clinic.id }
      if (field === 'recall') payload.smartRecallEnabled = value
      if (field === 'meds') payload.smartMedsEnabled = value
      
      const res = await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        if (field === 'recall') setFollowupRecall(value)
        if (field === 'meds') setFollowupMeds(value)
        
        const updates = field === 'recall' ? { smart_recall_enabled: value } : { smart_meds_enabled: value }
        const stored = localStorage.getItem('tokenpe_clinic')
        if (stored) {
          localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), ...updates }))
        }
      } else {
        alert(data.error || 'Failed to save follow-up configuration')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving configuration')
    }
    setSavingFollowups(false)
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

  const isEliteOrTrial = clinic?.plan_id === 'elite' || clinic?.subscription_status === 'trialing'

  if (clinic?.plan_id !== 'elite' && clinic?.subscription_status !== 'trialing') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F2F7F2' }}>
        {/* Sidebar */}
        <aside className="dashboard-sidebar" style={{ width: 240, background: '#CBE4D3', borderRight: '1px solid #A8D5B5', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
          <div style={{ padding: '0 4px', marginBottom: 28 }}>
            <img src="/logo-light.svg" alt="TokenPe" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          </div>
        </aside>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] p-8 rounded-3xl text-center max-w-md w-full shadow-lg">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={36} />
            </div>
            <h2 className="text-2xl font-black text-[#111827] mb-2">Elite Feature</h2>
            <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
              Patient CRM and Smart WhatsApp Follow-ups are available on the Elite plan. Upgrade your clinic to start engaging patients!
            </p>
            <button onClick={() => router.push('/dashboard/billing')} className="w-full bg-[#065F46] hover:bg-[#044E3A] text-white py-3 rounded-xl font-bold mb-3 transition-all shadow-md">
              Upgrade Subscription Plan
            </button>
            <button onClick={() => router.push('/dashboard')} className="w-full bg-transparent text-[#6B7280] py-2 rounded-xl font-bold hover:text-[#111827]">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

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

        .crm-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease !important;
        }
        .crm-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 12px 30px rgba(6, 95, 70, 0.08) !important;
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
                { label: 'Manage Branches', desc: 'Set up & switch between clinic locations under one account', icon: <Layers className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/branches') },
                { label: 'History', desc: 'Browse completed & past patient consultation records', icon: <History className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/history') },
                { label: 'Analytics & Reports', desc: 'Track peak OPD hours, average wait times, reason breakdowns, and patient-wise statistics.', icon: <BarChart2 className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/analytics') },
                { label: 'Broadcasting & CRM', desc: 'Send bulk WhatsApp alerts & manage patient relationships', icon: <Megaphone className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {}, active: true },
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

          {/* Divider */}
          <div style={{ height: 1, background: '#A8D5B5', margin: '14px 8px' }} />

          {/* Nav Group: Account */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Billing & Plans', desc: 'Manage your TokenPe subscription & plan features', icon: <CreditCard className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/billing') },
              { label: 'Help & Support', desc: 'Report bugs, raise issues & get in touch with our team', icon: <HelpCircle className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/help') },
              { label: 'Edit Profile', desc: 'Update clinic name, contact info & branding', icon: <User className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/profile') },
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
      </aside>

      {/* Floating Hover Tooltip */}
      {sbTooltip && (
        <div style={{ position: 'fixed', left: 248, top: sbTooltip.y, transform: 'translateY(-50%)', background: '#0F291B', color: '#FFFFFF', padding: '10px 14px', borderRadius: 10, fontSize: '0.78rem', zIndex: 99999, pointerEvents: 'none', maxWidth: 220, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 800, marginBottom: 2, color: '#A7F3D0' }}>{sbTooltip.label}</div>
          <div style={{ fontSize: '0.72rem', color: '#D1FAE5', lineHeight: 1.3 }}>{sbTooltip.desc}</div>
        </div>
      )}

      {/* ── Main Content Container ── */}
      <main className="flex-grow lg:overflow-y-auto lg:h-screen">
        <div className="max-w-[1040px] mx-auto p-4 sm:p-6 lg:p-10 space-y-8">

          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button onClick={() => router.push('/dashboard')} className="mb-2 text-[#065F46] font-bold text-[13px] hover:underline flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-[#111827]">Broadcasting & Patient CRM</h1>
              <p className="text-sm text-[#6B7280]">Engage with your OPD patients, configure WhatsApp welcomes, and trigger automated recalls.</p>
            </div>

            {userClinics.length > 1 && (
              <select
                value={clinic?.id || ''}
                onChange={handleBranchChange}
                className="bg-white border border-[#A8D5B5] text-[#065F46] px-4 py-2 rounded-xl font-bold outline-none text-xs shadow-sm"
              >
                {userClinics.map(uc => (
                  <option key={uc.id} value={uc.id}>{uc.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* ── CRM METRICS OVERVIEW STRIP ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#6B7280] uppercase tracking-wider">Reachable Patients</div>
                <div className="text-2xl font-black text-[#111827]">{totalPatients}</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#6B7280] uppercase tracking-wider">Active Reminders</div>
                <div className="text-sm font-bold text-[#059669]">
                  {followupRecall || followupMeds ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">

            {/* ── 1. PERSONALIZED WELCOME MESSAGE ── */}
            <div className="crm-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E5E7EB] relative overflow-hidden">
              {!isEliteOrTrial && (
                <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                  <Trophy size={36} className="text-amber-500 mb-2" />
                  <h3 className="text-lg font-black text-[#111827] mb-1">Elite Feature</h3>
                  <p className="text-[#6B7280] text-xs mb-4 font-medium max-w-sm">Upgrade to Elite to configure automated personalized WhatsApp welcome messages.</p>
                  <button onClick={() => router.push('/dashboard/billing')} className="bg-[#065F46] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md">Upgrade to Elite</button>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-[#065F46]" />
                <h2 className="text-lg font-black text-[#111827]">Personalized WhatsApp Welcome Message</h2>
              </div>
              <p className="text-[#6B7280] text-xs mb-5">This message will automatically be included in the WhatsApp receipt sent to patients when they join your queue.</p>
              
              <textarea
                value={welcomeMsg}
                onChange={e => setWelcomeMsg(e.target.value)}
                placeholder="e.g. Welcome to Dr. Sharma Clinic! Please take a seat in the AC lounge. Free Wi-Fi password is: clinic123"
                className="w-full min-h-[100px] p-4 rounded-2xl border border-[#CBD5E1] outline-none text-xs font-medium resize-y mb-4 focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all"
              />
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={saveWelcomeMessage}
                  disabled={savingWelcome}
                  className={`bg-[#065F46] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${savingWelcome ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#044E3A]'}`}
                >
                  {savingWelcome ? 'Saving...' : 'Save Welcome Message'}
                </button>
                {welcomeSuccess && (
                  <span className="text-[#10B981] font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Saved successfully!
                  </span>
                )}
              </div>
            </div>

            {/* ── 2. WHATSAPP BULK BROADCAST ── */}
            <div className="crm-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E5E7EB] relative overflow-hidden">
              {!isEliteOrTrial && (
                <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                  <Rocket size={36} className="text-[#065F46] mb-2" />
                  <h3 className="text-lg font-black text-[#111827] mb-1">Elite Feature</h3>
                  <p className="text-[#6B7280] text-xs mb-4 font-medium max-w-sm">Upgrade to Elite to send mass WhatsApp broadcasts to your patients.</p>
                  <button onClick={() => router.push('/dashboard/billing')} className="bg-[#065F46] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md">Upgrade to Elite</button>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="w-5 h-5 text-[#065F46]" />
                    <h2 className="text-lg font-black text-[#111827]">WhatsApp Bulk Broadcast</h2>
                  </div>
                  <p className="text-[#6B7280] text-xs">Send instant updates, clinic announcements, or holiday alerts to your OPD patients.</p>
                </div>
                <div className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {totalPatients} Reachable Patients
                </div>
              </div>

              <textarea
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="e.g. Clinic Update: Dr. Sharma will be available for special morning consultations this Sunday. Free health checkup camp for seniors!"
                className="w-full min-h-[120px] p-4 rounded-2xl border border-[#CBD5E1] outline-none text-xs font-medium resize-y mb-4 focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all"
              />

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-5 text-xs text-[#92400E] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span><strong>Official WhatsApp API Notice:</strong> Messages are delivered directly through official TokenPe API channels. Avoid promotional spam to protect your clinic account health.</span>
              </div>
              
              {broadcastImage && (
                <div className="relative inline-block mb-5">
                  <img src={broadcastImage} alt="Broadcast Attachment" className="w-32 h-32 object-cover rounded-2xl border border-[#CBD5E1] shadow-sm" />
                  <button onClick={() => setBroadcastImage('')} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shadow-md">×</button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button 
                  onClick={sendBroadcast}
                  disabled={sendingBroadcast || totalPatients === 0 || (!broadcastMsg && !broadcastImage)}
                  className={`bg-[#065F46] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center shadow-md transition-all ${(sendingBroadcast || totalPatients === 0 || (!broadcastMsg && !broadcastImage)) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#044E3A]'}`}
                >
                  {sendingBroadcast ? 'Sending...' : <><Send className="w-4 h-4 mr-1.5" /> Send Broadcast</>}
                </button>
                
                <label className={`flex items-center gap-2 text-[#065F46] font-bold text-xs bg-[#ECFDF5] px-4 py-2.5 rounded-xl border border-dashed border-[#A7F3D0] transition-all ${uploadingImage ? 'cursor-wait opacity-70' : 'cursor-pointer hover:bg-teal-100'}`}>
                  {uploadingImage ? 'Uploading Image...' : <><Camera className="w-4 h-4" /> Attach Flyer Image</>}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>

                {broadcastSuccess && (
                  <span className="text-[#10B981] font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Broadcast queued successfully!
                  </span>
                )}
              </div>
            </div>

            {/* ── 3. SMART FOLLOW-UPS ── */}
            <div className="crm-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E5E7EB]">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-5 h-5 text-[#065F46]" />
                <h2 className="text-lg font-black text-[#111827]">Automated Patient Retention & Follow-ups</h2>
              </div>
              <p className="text-[#6B7280] text-xs mb-6">Automate your consultation follow-ups with intelligent WhatsApp reminders.</p>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[#065F46] flex items-center gap-1">90-Day Routine Recall <RefreshCw className="w-3.5 h-3.5" /></h3>
                      <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-2.5 py-0.5 rounded-full text-[10px] font-bold">{recallReachable} Reachable Today</span>
                    </div>
                    <p className="text-xs text-[#64748B]">Sends an automated friendly check-up reminder to patients 90 days after consultation.</p>
                  </div>
                  <label className="relative inline-block w-11 h-6 flex-shrink-0 cursor-pointer">
                    <input type="checkbox" checked={followupRecall} onChange={e => saveFollowupConfig('recall', e.target.checked)} disabled={savingFollowups} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#065F46]"></div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[#065F46] flex items-center gap-1">Medicine Reminders <Pill className="w-3.5 h-3.5" /></h3>
                      <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-2.5 py-0.5 rounded-full text-[10px] font-bold">{medsReachable} Reachable Today</span>
                    </div>
                    <p className="text-xs text-[#64748B]">Sends a "Did you start your prescription medicines?" check-in 3 days post-visit.</p>
                  </div>
                  <label className="relative inline-block w-11 h-6 flex-shrink-0 cursor-pointer">
                    <input type="checkbox" checked={followupMeds} onChange={e => saveFollowupConfig('meds', e.target.checked)} disabled={savingFollowups} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#065F46]"></div>
                  </label>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
