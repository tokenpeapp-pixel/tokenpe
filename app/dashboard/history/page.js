'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  History, Search, Calendar, Phone, Clock, User, CheckCircle2, XCircle, Users,
  ArrowLeft, Download, Filter, RefreshCw, Layers, LayoutDashboard, 
  BarChart2, Megaphone, CreditCard, HelpCircle, LogOut, ChevronDown 
} from 'lucide-react'

function getISTDateString(date = new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1000
  const istDate = new Date(date.getTime() + istOffset)
  return istDate.toISOString().split('T')[0]
}

function formatToken(t) {
  if (!t) return '00'
  const str = String(t)
  if (str.startsWith('A-')) return str.substring(2)
  return str.padStart(2, '0')
}

function formatDateDMY(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

export default function HistoryPage() {
  const router = useRouter()
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [rangePreset, setRangePreset] = useState('today') // 'today', '7', '30', '365', 'custom'
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'done', 'cancelled', 'waiting'
  const [sbTooltip, setSbTooltip] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const fetchHistory = useCallback(async (clinicId, preset, cStart, cEnd) => {
    setLoading(true)
    try {
      const targetClinic = clinicId || clinic?.id || clinic?.business_id
      const res = await fetch(`/api/dashboard/history?clinicId=${targetClinic || ''}&preset=${preset || 'today'}&customStart=${cStart || ''}&customEnd=${cEnd || ''}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.patients)) {
        setPatients(data.patients)
      } else {
        setPatients([])
      }
    } catch (err) {
      console.error('History fetch error:', err)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [clinic?.id, clinic?.business_id])

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) {
        router.push('/login')
        return
      }
      const c = JSON.parse(stored)
      setClinic(c)
      await fetchHistory(c.id || c.business_id, rangePreset, customStart, customEnd)
    }
    load()
  }, [router, rangePreset, customStart, customEnd, fetchHistory])

  const handleLogout = async () => {
    try {
      await fetch('/api/business-auth/logout', { method: 'POST' }).catch(() => {})
      localStorage.removeItem('tokenpe_clinic')
      localStorage.removeItem('tokenpe_cached_patients')
      supabase.auth.signOut().catch(() => {})
    } catch (e) {}
    router.push('/login')
  }

  // Summary Metrics
  const totalRecordsCount = patients.length
  const completedCount = patients.filter(p => p.status === 'done' || p.status === 'completed').length
  const cancelledCount = patients.filter(p => p.status === 'skipped' || p.status === 'cancelled').length

  // Filtered List based on Search & Status dropdown
  const filteredPatients = patients.filter(p => {
    // Status Filter
    if (statusFilter === 'done' && !(p.status === 'done' || p.status === 'completed')) return false
    if (statusFilter === 'cancelled' && !(p.status === 'skipped' || p.status === 'cancelled')) return false
    if (statusFilter === 'waiting' && !(p.status === 'waiting' || p.status === 'called' || p.status === 'next')) return false

    // Search Query
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (p.name && p.name.toLowerCase().includes(q)) ||
           (p.phone && p.phone.includes(q)) ||
           (p.token && String(p.token).toLowerCase().includes(q)) ||
           (p.purpose && p.purpose.toLowerCase().includes(q)) ||
           (p.reason && p.reason.toLowerCase().includes(q))
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F8FAFC', overflowX: 'hidden' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .sidebar-btn {
          display: flex; align-items: center; gap: 10px; padding: 10px 14px;
          border-radius: 12px; background: transparent; color: #1E3A2B;
          font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer;
          width: 100%; text-align: left; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap; overflow: hidden;
        }
        .sidebar-btn:hover {
          background: #BFE3CD; color: #064E3B; padding-left: 20px;
          box-shadow: 0 4px 12px rgba(6,78,59,0.08);
        }
        .sidebar-btn.active {
          background: #BFE3CD; color: #064E3B; font-weight: 800;
          box-shadow: inset 3px 0 0 #064E3B;
        }
        .sidebar-btn .sb-label { font-weight: 700; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .range-pill {
          padding: 8px 16px; border-radius: 10px; font-size: 0.82rem; font-weight: 700;
          border: 1px solid #CBD5E1; background: white; color: #475569; cursor: pointer;
          transition: all 0.2s ease;
        }
        .range-pill:hover:not(.active) {
          background: #F1F5F9; color: #0F172A; border-color: #94A3B8; transform: translateY(-1px);
        }
        .range-pill.active {
          background: #1E293B; color: white; border-color: #1E293B; font-weight: 800;
          box-shadow: 0 4px 12px rgba(30,41,59,0.15);
        }

        .metric-card-hover {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .metric-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06) !important;
        }

        .history-row-hover {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .history-row-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(6, 78, 59, 0.06) !important;
        }

        .btn-more-details {
          transition: all 0.18s ease !important;
        }
        .btn-more-details:hover {
          background: #064E3B !important;
          color: #FFFFFF !important;
          border-color: #064E3B !important;
          box-shadow: 0 3px 10px rgba(6, 78, 59, 0.2) !important;
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
                { label: 'History', desc: 'Browse completed & past patient consultation records', icon: <History className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {}, active: true },
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

        {/* Exit Console & Logout Button at Bottom */}
        <div style={{ paddingTop: 12, borderTop: '1px solid #A8D5B5', marginTop: 12 }}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="sidebar-btn"
            style={{ width: '100%', color: '#B91C1C', fontWeight: 800 }}
          >
            <LogOut className="w-4 h-4" style={{ color: '#B91C1C' }} /> Exit Console &amp; Logout
          </button>
        </div>
      </aside>

      {/* ── SIDEBAR FIXED TOOLTIP OVERLAY ── */}
      {sbTooltip && (
        <div style={{
          position: 'fixed',
          left: 252,
          top: sbTooltip.y,
          transform: 'translateY(-50%)',
          background: '#1E3A2B',
          color: '#E2F5EB',
          borderRadius: 12,
          padding: '12px 14px',
          width: 220,
          fontSize: '0.78rem',
          fontWeight: 500,
          lineHeight: 1.55,
          zIndex: 99998,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          whiteSpace: 'normal',
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#A7F3D0', marginBottom: 4 }}>{sbTooltip.label}</div>
          {sbTooltip.desc}
          <div style={{
            position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: '7px solid #1E3A2B',
          }} />
        </div>
      )}

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(6, 78, 59, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', border: '1.5px solid #CBE4D3', textAlign: 'center' }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEF2F2', border: '1.5px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <LogOut style={{ width: 22, height: 22, color: '#B91C1C' }} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Exit Console?</div>
            <div style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
              You are about to log out of the TokenPe dashboard.<br />All unsaved changes will be lost.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, background: '#F1F5F9', color: '#0F172A', border: 'none', padding: '11px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); handleLogout() }}
                style={{ flex: 1, background: '#B91C1C', color: 'white', border: 'none', padding: '11px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <LogOut style={{ width: 15, height: 15 }} /> Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT CONSOLE ── */}
      <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', background: '#F8FAFC' }}>
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1.5px solid #CBD5E1', padding: '8px 16px', borderRadius: 12, fontWeight: 800, color: '#0F172A', fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Live Dashboard
          </button>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
            {clinic?.name || 'Clinic Command Center'}
          </div>
        </div>

        {/* ── TOP METRIC SUMMARY CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Card 1: Total Records */}
          <div className="metric-card-hover" style={{ background: '#FFFFFF', borderRadius: 16, padding: '20px 24px', border: '1.5px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(59,130,246,0.03)', cursor: 'default' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E293B', lineHeight: 1.1 }}>{totalRecordsCount}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>TOTAL RECORDS</div>
            </div>
          </div>

          {/* Card 2: Completed */}
          <div className="metric-card-hover" style={{ background: '#FFFFFF', borderRadius: 16, padding: '20px 24px', border: '1.5px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(34,197,94,0.03)', cursor: 'default' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', flexShrink: 0 }}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E293B', lineHeight: 1.1 }}>{completedCount}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>COMPLETED</div>
            </div>
          </div>

          {/* Card 3: Cancelled / Skipped */}
          <div className="metric-card-hover" style={{ background: '#FFFFFF', borderRadius: 16, padding: '20px 24px', border: '1.5px solid #FECACA', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(239,68,68,0.03)', cursor: 'default' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}>
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E293B', lineHeight: 1.1 }}>{cancelledCount}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>CANCELLED / SKIPPED</div>
            </div>
          </div>
        </div>

        {/* ── FILTER & SEARCH CONTROL BAR (Inspo layout) ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '14px 20px', border: '1px solid #E2E8F0', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Date Range Preset Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setRangePreset('today')} className={`range-pill ${rangePreset === 'today' ? 'active' : ''}`}>Today</button>
            <button onClick={() => setRangePreset('7')} className={`range-pill ${rangePreset === '7' ? 'active' : ''}`}>7 Days</button>
            <button onClick={() => setRangePreset('30')} className={`range-pill ${rangePreset === '30' ? 'active' : ''}`}>30 Days</button>
            <button onClick={() => setRangePreset('365')} className={`range-pill ${rangePreset === '365' ? 'active' : ''}`}>365 Days</button>

            {/* Custom Range Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #CBD5E1', borderRadius: 10, padding: '6px 12px' }}>
              <Calendar className="w-4 h-4 text-[#64748B]" />
              <select
                value={rangePreset === 'custom' ? 'custom' : ''}
                onChange={e => {
                  if (e.target.value === 'custom') setRangePreset('custom')
                }}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.82rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                <option value="">Custom Range...</option>
                <option value="custom">Select Dates</option>
              </select>
            </div>

            {rangePreset === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.78rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.78rem', fontWeight: 700 }}
                />
              </div>
            )}
          </div>

          {/* Right Side: Search Input & Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1', minWidth: 260, justifyContent: 'flex-end' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search className="w-4 h-4 text-[#94A3B8]" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search patient name, token, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none',
                  background: '#F8FAFC',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* All Status Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  appearance: 'none',
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '9px 34px 9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Status</option>
                <option value="done">Completed Only</option>
                <option value="cancelled">Cancelled / Skipped</option>
                <option value="waiting">Waiting / Active</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#64748B]" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* ── HISTORY RECORDS LIST ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B', fontSize: '0.88rem' }}>
            <RefreshCw className="w-6 h-6 text-[#059669] animate-spin mx-auto mb-2" />
            Loading history records...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B', background: 'white', borderRadius: 16, border: '1px dashed #CBD5E1' }}>
            <History className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>No matching records found</div>
            <div style={{ fontSize: '0.78rem', marginTop: 4 }}>Try adjusting your date range preset or clear search filters.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredPatients.map(p => {
              const totFee = p.fee_total !== undefined && p.fee_total !== null ? parseFloat(p.fee_total) : 0
              const paidFee = parseFloat(p.fee_paid) || (p.payment_status === 'completed' ? totFee : 0)
              const isPaid = p.payment_status === 'completed' || (totFee > 0 && paidFee >= totFee)
              const isCompleted = p.status === 'done' || p.status === 'completed'
              const isSkipped = p.status === 'skipped' || p.status === 'cancelled'
              const timeStr = new Date(p.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

              return (
                <div key={p.id} className="history-row-hover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderRadius: 14, border: `1.5px solid ${isCompleted ? '#A7F3D0' : isSkipped ? '#FECACA' : '#E2E8F0'}`, background: isCompleted ? '#F0FDF4' : isSkipped ? '#FEF2F2' : '#FFFFFF', flexWrap: 'wrap', gap: 12 }}>
                  {/* Token & Patient Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 200 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: isCompleted ? '#ECFDF5' : isSkipped ? '#FEE2E2' : '#F8FAFC', border: `1px solid ${isCompleted ? '#A7F3D0' : isSkipped ? '#FECACA' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: isCompleted ? '#065F46' : isSkipped ? '#DC2626' : '#475569', fontFamily: 'monospace', flexShrink: 0 }}>
                      #{formatToken(p.token)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F172A' }}>{p.name || 'Walk-in Patient'}</span>
                        <span style={{ fontSize: '0.64rem', fontWeight: 900, padding: '2px 8px', borderRadius: 8, background: isCompleted ? '#ECFDF5' : isSkipped ? '#FEE2E2' : '#F1F5F9', color: isCompleted ? '#059669' : isSkipped ? '#DC2626' : '#64748B', border: `1px solid ${isCompleted ? '#A7F3D0' : isSkipped ? '#FECACA' : '#E2E8F0'}`, textTransform: 'uppercase' }}>
                          {isCompleted ? 'COMPLETED' : isSkipped ? 'CANCELLED' : p.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reason (if entered) */}
                  {(p.purpose || p.reason) && (
                    <div style={{ flex: '1', minWidth: 140, padding: '0 14px', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason for Visit</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                        {p.purpose || p.reason}
                      </span>
                    </div>
                  )}

                  {/* Phone */}
                  <div style={{ flex: '1', minWidth: 140, padding: '0 14px', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp Phone</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 700, fontSize: '0.82rem' }}>
                      <Phone className="w-3.5 h-3.5 text-[#059669]" /> {p.phone}
                    </span>
                  </div>

                  {/* Time & Date */}
                  <div style={{ flex: '1', minWidth: 140, padding: '0 14px', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entry Date &amp; Time</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontWeight: 700, fontSize: '0.82rem' }}>
                      <Clock className="w-3.5 h-3.5 text-[#64748B]" /> {formatDateDMY(p.date)} · {timeStr}
                    </span>
                  </div>

                  {/* Payment Info & Details Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 14, borderLeft: '1px solid #E2E8F0', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Fee Paid</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 900, color: isPaid ? '#059669' : '#D97706' }}>
                        ₹{paidFee} <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>/ ₹{totFee}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedPatient(p)}
                      className="btn-more-details"
                      style={{ background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      More Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── PATIENT FULL DETAILS MODAL ── */}
      {selectedPatient && (
        <div onClick={() => setSelectedPatient(null)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(6, 78, 59, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, maxWidth: 460, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#064E3B' }}>Patient Consultation Details</div>
              <button onClick={() => setSelectedPatient(null)} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>×</button>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 18, border: '1px solid #E2E8F0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>{selectedPatient.name || 'Walk-in Patient'}</div>
                </div>
                <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: 12, fontWeight: 900, fontSize: '0.9rem', fontFamily: 'monospace' }}>
                  #{formatToken(selectedPatient.token)}
                </span>
              </div>

              <div style={{ fontSize: '0.84rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#64748B' }}>WhatsApp Mobile:</strong>
                  <span style={{ fontWeight: 800, color: '#059669' }}>+91 {selectedPatient.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#64748B' }}>Visit Status:</strong>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', color: selectedPatient.status === 'done' ? '#059669' : '#DC2626' }}>{selectedPatient.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#64748B' }}>Entry Date:</strong>
                  <span style={{ fontWeight: 700 }}>{formatDateDMY(selectedPatient.date)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#64748B' }}>Check-in Time:</strong>
                  <span style={{ fontWeight: 700 }}>{new Date(selectedPatient.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#64748B' }}>Reason for Visit:</strong>
                  <span style={{ fontWeight: 700, color: (selectedPatient.purpose || selectedPatient.reason) ? '#0F172A' : '#94A3B8' }}>{selectedPatient.purpose || selectedPatient.reason || 'None Specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#64748B' }}>Preferred Language:</strong>
                  <span style={{ fontWeight: 700 }}>{selectedPatient.language || 'hi'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: 10, marginTop: 4 }}>
                  <strong style={{ color: '#64748B' }}>Billing Status:</strong>
                  <span style={{ fontWeight: 900, color: selectedPatient.payment_status === 'completed' ? '#059669' : '#D97706' }}>
                    {selectedPatient.payment_status === 'completed' ? 'PAID FULL' : 'PENDING'} (₹{selectedPatient.fee_paid || 0} / ₹{selectedPatient.fee_total || 0})
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              style={{ width: '100%', background: '#064E3B', color: 'white', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
