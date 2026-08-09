'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import {
  Layers, LayoutDashboard, History, BarChart2, Megaphone, CreditCard,
  HelpCircle, User, ArrowLeft, Plus, QrCode, Users, CheckCircle2, Trash2,
  RefreshCw, Copy, X, AlertTriangle, Building2, Sparkles, ExternalLink,
  ShieldCheck, ArrowRight, Check
} from 'lucide-react'

const BRANCH_PRESETS = [
  'Main Branch', 'Morning OPD Counter 1', 'Evening OPD Counter 2',
  'Emergency OPD', 'Pediatric Wing', 'Dental Care Counter',
  'Orthopedic Wing', 'Physiotherapy Center', 'Diagnostic Desk'
]

export default function ManageBranchesPage() {
  const router = useRouter()
  const [clinic, setClinic]             = useState(null)
  const [branches, setBranches]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [sbTooltip, setSbTooltip]       = useState(null)

  // Branch Stats
  const [branchStats, setBranchStats]   = useState({})
  
  // Create Branch Modal
  const [showCreate, setShowCreate]     = useState(false)
  const [branchName, setBranchName]     = useState('')
  const [specialty, setSpecialty]       = useState('General Physician')
  const [creating, setCreating]         = useState(false)
  const [createError, setCreateError]   = useState('')
  const [createSuccess, setCreateSuccess] = useState(null)

  // QR Modal & Copy Toast
  const [showQR, setShowQR]             = useState(null)
  const [copiedId, setCopiedId]         = useState(null)

  // Delete Branch Modal
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const loadBranches = useCallback(async () => {
    const stored = localStorage.getItem('tokenpe_clinic') || localStorage.getItem('tokenpe_business')
    if (!stored) { router.push('/login'); return }

    const c = JSON.parse(stored)
    setClinic(c)

    try {
      let freshClinic = c
      const res = await fetch(`/api/clinics/get?id=${c.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.clinic) freshClinic = data.clinic
      }
      setClinic(freshClinic)

      // Fetch all sibling branches sharing the same email
      let { data: siblings, error: sibErr } = await supabase
        .from('clinics')
        .select('id, name, code, email, phone, plan_id, subscription_status, created_at, specialty, city, area')
        .eq('email', freshClinic.email)
        .order('created_at', { ascending: true })

      if (!siblings || siblings.length === 0) {
        const { data: bSiblings } = await supabase
          .from('businesses')
          .select('id, name, code, email, phone, plan_id, subscription_status, created_at, specialty, city, area')
          .eq('email', freshClinic.email)
          .order('created_at', { ascending: true })
        if (bSiblings) siblings = bSiblings
      }

      const branchList = siblings || [freshClinic]
      setBranches(branchList)
      localStorage.setItem('tokenpe_user_businesses', JSON.stringify(branchList))

      // Load live queue stats for each branch
      const todayStr = new Date().toISOString().split('T')[0]
      const stats = {}

      await Promise.all(branchList.map(async (b) => {
        try {
          const [activeRes, doneRes] = await Promise.all([
            supabase.from('patients').select('id', { count: 'exact', head: true }).eq('clinic_id', b.id).eq('status', 'waiting'),
            supabase.from('patients').select('id', { count: 'exact', head: true }).eq('clinic_id', b.id).eq('status', 'done').gte('created_at', `${todayStr}T00:00:00+05:30`)
          ])
          stats[b.id] = {
            active: activeRes.count || 0,
            completed: doneRes.count || 0
          }
        } catch (e) {
          stats[b.id] = { active: 0, completed: 0 }
        }
      }))

      setBranchStats(stats)
    } catch (err) {
      console.error(err)
      setError('Failed to load clinic branches.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  async function handleCreateBranch(e) {
    e.preventDefault()
    if (!branchName.trim()) return
    setCreating(true)
    setCreateError('')
    setCreateSuccess(null)

    try {
      const res = await fetch('/api/clinics/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: branchName.trim(),
          phone: clinic.phone,
          email: clinic.email,
          specialty: specialty,
          parentPlanId: clinic.plan_id || 'elite',
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setCreateError(data.error || 'Failed to create branch.')
        setCreating(false)
        return
      }

      setCreateSuccess(data.clinic)
      setBranchName('')
      setShowCreate(false)
      await loadBranches()
    } catch (err) {
      setCreateError('Network error. Please try again.')
    }
    setCreating(false)
  }

  function handleSwitchBranch(b) {
    localStorage.setItem('tokenpe_clinic', JSON.stringify(b))
    localStorage.setItem('tokenpe_business', JSON.stringify(b))
    localStorage.setItem('clinicCode', b.code)
    localStorage.setItem('clinicPhone', b.phone)
    router.push('/dashboard')
  }

  async function handleDeleteBranch(b) {
    if (!b) return
    setDeleting(true)
    try {
      const res = await fetch('/api/clinics/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: b.id })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setConfirmDelete(null)
        if (b.id === clinic?.id) {
          // If deleted active branch, switch to remaining branch
          const remaining = branches.filter(x => x.id !== b.id)
          if (remaining.length > 0) {
            handleSwitchBranch(remaining[0])
            return
          }
        }
        await loadBranches()
      } else {
        alert(data.error || 'Failed to delete branch.')
      }
    } catch (err) {
      alert('Error deleting branch.')
    }
    setDeleting(false)
  }

  function copyJoinLink(b) {
    const url = `${window.location.origin}/j/${b.code}`
    navigator.clipboard.writeText(url)
    setCopiedId(b.id)
    setTimeout(() => setCopiedId(null), 2500)
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

  const totalActive = Object.values(branchStats).reduce((acc, curr) => acc + (curr.active || 0), 0)
  const totalCompleted = Object.values(branchStats).reduce((acc, curr) => acc + (curr.completed || 0), 0)

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

        .branch-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease !important;
        }
        .branch-card:hover {
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
                { label: 'Manage Branches', desc: 'Set up & switch between clinic locations under one account', icon: <Layers className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {}, active: true },
                { label: 'History', desc: 'Browse completed & past patient consultation records', icon: <History className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/history') },
                { label: 'Analytics & Reports', desc: 'Track peak OPD hours, average wait times, reason breakdowns, and patient-wise statistics.', icon: <BarChart2 className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/analytics') },
                { label: 'Broadcasting & CRM', desc: 'Send bulk WhatsApp alerts & manage patient relationships', icon: <Megaphone className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/crm') },
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
              <h1 className="text-xl sm:text-2xl font-black text-[#111827]">Multi-Branch Clinic Management</h1>
              <p className="text-sm text-[#6B7280]">Set up OPD counters, manage multiple clinic locations, and switch instantly between branches.</p>
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-[#065F46] hover:bg-[#044E3A] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add New Branch
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* ── OVERVIEW STATS STRIP ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#6B7280] uppercase tracking-wider">Total Branches</div>
                <div className="text-2xl font-black text-[#111827]">{branches.length}</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#6B7280] uppercase tracking-wider">Active Queue Patients</div>
                <div className="text-2xl font-black text-[#111827]">{totalActive}</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#F59E0B] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#6B7280] uppercase tracking-wider">Completed Today</div>
                <div className="text-2xl font-black text-[#111827]">{totalCompleted}</div>
              </div>
            </div>
          </div>

          {/* ── BRANCH CARDS GRID ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#065F46]" />
                <h2 className="text-lg font-black text-[#111827]">Your Clinic Locations</h2>
              </div>
              <span className="text-xs font-bold text-[#6B7280]">{branches.length} Location(s) Registered</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {branches.map((b) => {
                const isActive = b.id === clinic?.id
                const stats = branchStats[b.id] || { active: 0, completed: 0 }

                return (
                  <div
                    key={b.id}
                    className={`branch-card bg-white rounded-3xl p-6 border transition-all relative flex flex-col justify-between shadow-sm ${
                      isActive ? 'border-2 border-[#065F46] ring-4 ring-[#ECFDF5]' : 'border-[#E5E7EB]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute -top-3.5 right-6 bg-[#065F46] text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#A7F3D0]" /> Active Branch
                      </div>
                    )}

                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[10px] font-black text-[#065F46] uppercase tracking-wider bg-[#ECFDF5] px-2.5 py-0.5 rounded-md border border-[#A7F3D0] inline-block mb-1">
                            {b.specialty || 'General OPD'}
                          </span>
                          <h3 className="text-lg font-black text-[#111827]">{b.name}</h3>
                          {b.city && <p className="text-xs text-[#6B7280]">{b.area ? `${b.area}, ` : ''}{b.city}</p>}
                        </div>

                        <div className="bg-gray-50 border border-[#E2E8F0] px-2.5 py-1 rounded-xl text-right flex-shrink-0">
                          <div className="text-[9px] font-extrabold text-[#64748B] uppercase">Code</div>
                          <div className="text-xs font-mono font-black text-[#065F46]">{b.code}</div>
                        </div>
                      </div>

                      {/* Live OPD Metrics */}
                      <div className="grid grid-cols-2 gap-3 my-5">
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-2xl text-center">
                          <div className="text-[10px] font-bold text-[#64748B] uppercase">Waiting Now</div>
                          <div className="text-xl font-black text-[#065F46] mt-0.5">{stats.active}</div>
                        </div>

                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-2xl text-center">
                          <div className="text-[10px] font-bold text-[#64748B] uppercase">Done Today</div>
                          <div className="text-xl font-black text-[#111827] mt-0.5">{stats.completed}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                      <div className="flex items-center gap-2">
                        {!isActive ? (
                          <button
                            onClick={() => handleSwitchBranch(b)}
                            className="flex-1 py-2.5 bg-[#065F46] hover:bg-[#044E3A] text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span>Switch to Branch</span> <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="flex-1 py-2.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-xl font-bold text-xs text-center">
                            Current Active Session
                          </div>
                        )}

                        <button
                          onClick={() => setShowQR(b)}
                          className="p-2.5 bg-gray-50 border border-[#E2E8F0] text-[#374151] rounded-xl hover:bg-gray-100 transition-all flex items-center gap-1 text-xs font-bold"
                          title="Patient QR Code"
                        >
                          <QrCode className="w-4 h-4 text-[#065F46]" />
                          <span>QR Code</span>
                        </button>

                        {branches.length > 1 && (
                          <button
                            onClick={() => setConfirmDelete(b)}
                            className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                            title="Delete Branch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>

      {/* ── MODALS ── */}

      {/* Create Branch Modal */}
      {showCreate && (
        <div onClick={() => setShowCreate(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[500px] rounded-3xl p-6 sm:p-8 relative shadow-2xl">
            <button onClick={() => setShowCreate(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1 text-[#065F46]">
              <Building2 className="w-5 h-5" />
              <h3 className="text-xl font-black text-[#111827]">Add New Clinic Branch</h3>
            </div>
            <p className="text-xs text-[#6B7280] mb-6">Create a new OPD counter or secondary clinic location under your account.</p>

            {createError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {createError}
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Branch / OPD Name *</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  placeholder="e.g. City Clinic - Kothrud Branch"
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Preset Name Suggestions</label>
                <div className="flex flex-wrap gap-1.5">
                  {BRANCH_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBranchName(preset)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-[#ECFDF5] hover:text-[#065F46] text-[#64748B] rounded-lg text-[11px] font-bold transition-all border border-transparent hover:border-[#A7F3D0]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Specialty / OPD Type</label>
                <select
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                >
                  <option value="General Physician">General Physician</option>
                  <option value="Pediatrics & Child Care">Pediatrics & Child Care</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Dermatology & Skin">Dermatology & Skin</option>
                  <option value="Dental & Oral Care">Dental & Oral Care</option>
                  <option value="Gynecology & Obstetrics">Gynecology & Obstetrics</option>
                  <option value="ENT (Ear, Nose, Throat)">ENT (Ear, Nose, Throat)</option>
                  <option value="Ayurvedic Medicine">Ayurvedic Medicine</option>
                  <option value="Homeopathy">Homeopathy</option>
                </select>
              </div>

              <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3 rounded-2xl text-xs text-[#065F46] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#059669]" />
                <span>New branches automatically inherit your active Elite subscription plan and multi-doctor WhatsApp features.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 border border-[#E5E7EB] text-[#374151] rounded-xl font-bold text-xs hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 py-3 bg-[#065F46] text-white rounded-xl font-bold text-xs hover:bg-[#043E2E] shadow-sm flex items-center justify-center gap-1.5">
                  {creating ? 'Creating Branch...' : <><Plus className="w-4 h-4" /> Create Branch</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div onClick={() => setShowQR(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[400px] rounded-3xl p-6 sm:p-8 text-center relative shadow-2xl">
            <button onClick={() => setShowQR(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-[#ECFDF5] text-[#065F46] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#A7F3D0]">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-[#111827]">{showQR.name}</h3>
            <p className="text-xs text-[#6B7280] mb-5">Scan to join the OPD queue on WhatsApp</p>

            <div className="bg-white p-4 rounded-2xl border-2 border-[#A7F3D0] inline-block mb-4 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/j/${showQR.code}`)}`}
                alt="Patient QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-xs font-mono font-bold text-[#065F46] bg-[#ECFDF5] py-2 rounded-xl border border-[#A7F3D0]">
              Code: {showQR.code}
            </div>
          </div>
        </div>
      )}

      {/* Delete Branch Confirmation Modal */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[420px] rounded-3xl p-6 sm:p-8 text-center relative shadow-2xl">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-[#111827] mb-2">Delete Branch?</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-[#111827]">&quot;{confirmDelete.name}&quot;</strong>? This action cannot be undone and will remove associated queue records.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-[#E5E7EB] text-[#374151] rounded-xl font-bold text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDeleteBranch(confirmDelete)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                {deleting ? 'Deleting...' : <><Trash2 className="w-4 h-4" /> Delete Branch</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
