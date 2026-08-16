'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import ClinicSidebar from '../../../components/ClinicSidebar'
import { 
  History, Search, Calendar, Phone, Clock, User, CheckCircle2, XCircle, Users,
  ArrowLeft, Download, Filter, RefreshCw, Layers, LayoutDashboard, 
  BarChart2, Megaphone, CreditCard, HelpCircle, LogOut, ChevronDown, X 
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8FAFC] font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <ClinicSidebar clinic={clinic} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .range-pill {
          min-height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 700;
          border: 1px solid #CBD5E1;
          background: white;
          color: #475569;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .range-pill:hover:not(.active) {
          background: #F1F5F9; color: #0F172A; border-color: #94A3B8; transform: translateY(-1px);
        }
        .range-pill.active {
          background: #065F46; color: white; border-color: #065F46; font-weight: 800;
          box-shadow: 0 4px 14px rgba(6, 95, 70, 0.25);
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

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          className="fixed inset-0 z-[99999] bg-[#064E3B]/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl border border-[#CBE4D3] text-center"
          >
            <div className="w-13 h-13 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-5 h-5 text-red-700" />
            </div>
            <div className="text-lg font-black text-[#0F172A] mb-1.5">Exit Console?</div>
            <div className="text-xs text-[#64748B] mb-6 leading-relaxed">
              You are about to log out of the TokenPe dashboard.<br />All unsaved changes will be lost.
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-100 text-[#0F172A] border-none py-2.5 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); handleLogout() }}
                className="flex-1 bg-red-700 text-white border-none py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT CONSOLE ── */}
      <main className="flex-1 p-4 sm:p-6 lg:p-9 overflow-y-auto bg-[#F8FAFC]">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 bg-white border border-[#CBD5E1] px-4 py-2 rounded-xl font-extrabold text-[#0F172A] text-xs shadow-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Live Dashboard
          </button>
          <div className="text-lg font-black text-[#0F172A]">
            {clinic?.name || 'Clinic Command Center'}
          </div>
        </div>

        {/* ── TOP METRIC SUMMARY CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Card 1: Total Records */}
          <div className="metric-card-hover bg-white rounded-2xl p-5 border border-[#DBEAFE] flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#1E293B] leading-none">{totalRecordsCount}</div>
              <div className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mt-1">TOTAL RECORDS</div>
            </div>
          </div>

          {/* Card 2: Completed */}
          <div className="metric-card-hover bg-white rounded-2xl p-5 border border-[#BBF7D0] flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#1E293B] leading-none">{completedCount}</div>
              <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider mt-1">COMPLETED</div>
            </div>
          </div>

          {/* Card 3: Cancelled / Skipped */}
          <div className="metric-card-hover bg-white rounded-2xl p-5 border border-[#FECACA] flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#1E293B] leading-none">{cancelledCount}</div>
              <div className="text-[10px] font-extrabold text-red-800 uppercase tracking-wider mt-1">CANCELLED / SKIPPED</div>
            </div>
          </div>
        </div>

        {/* ── FILTER & SEARCH CONTROL BAR (Mobile-Optimized) ── */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] mb-5 shadow-sm space-y-3">
          {/* Row 1: Horizontal Swipeable Date Range Carousel (Touch Friendly 44px min-height) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setRangePreset('today')} className={`range-pill ${rangePreset === 'today' ? 'active' : ''}`}>
              Today
            </button>
            <button onClick={() => setRangePreset('7')} className={`range-pill ${rangePreset === '7' ? 'active' : ''}`}>
              7 Days
            </button>
            <button onClick={() => setRangePreset('30')} className={`range-pill ${rangePreset === '30' ? 'active' : ''}`}>
              30 Days
            </button>
            <button onClick={() => setRangePreset('365')} className={`range-pill ${rangePreset === '365' ? 'active' : ''}`}>
              365 Days
            </button>

            {/* Custom Range Selector */}
            <div className={`range-pill gap-1.5 ${rangePreset === 'custom' ? 'active' : ''}`}>
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <select
                value={rangePreset === 'custom' ? 'custom' : ''}
                onChange={e => {
                  if (e.target.value === 'custom') setRangePreset('custom')
                }}
                className="border-none bg-transparent outline-none text-xs font-bold cursor-pointer text-inherit"
              >
                <option value="" className="text-[#111827]">Custom Range...</option>
                <option value="custom" className="text-[#111827]">Select Dates</option>
              </select>
            </div>
          </div>

          {/* Custom Date Pickers (if custom selected) */}
          {rangePreset === 'custom' && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9] flex-wrap">
              <span className="text-xs font-bold text-[#64748B]">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#111827] bg-gray-50 flex-1 min-w-[130px]"
              />
              <span className="text-xs font-bold text-[#64748B]">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#111827] bg-gray-50 flex-1 min-w-[130px]"
              />
            </div>
          )}

          {/* Row 2: Search Input & Status Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-[#F1F5F9]">
            {/* Search Input */}
            <div className="relative flex-1 min-h-[44px]">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient name, token, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-full min-h-[44px] pl-10 pr-9 rounded-xl border border-[#E2E8F0] text-xs sm:text-sm font-semibold outline-none focus:border-[#065F46] bg-[#F8FAFC] text-[#111827]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#111827]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* All Status Dropdown */}
            <div className="relative min-h-[44px] sm:w-[170px]">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full h-full min-h-[44px] appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-4 pr-9 text-xs sm:text-sm font-extrabold text-[#0F172A] cursor-pointer outline-none focus:border-[#065F46]"
              >
                <option value="all">All Status</option>
                <option value="done">Completed Only</option>
                <option value="cancelled">Cancelled / Skipped</option>
                <option value="waiting">Waiting / Active</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── HISTORY RECORDS LIST ── */}
        {loading ? (
          <div className="text-center py-16 text-xs text-[#64748B]">
            <RefreshCw className="w-6 h-6 text-[#059669] animate-spin mx-auto mb-2" />
            Loading history records...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#64748B] bg-white rounded-2xl border border-dashed border-[#CBD5E1]">
            <History className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
            <div className="font-extrabold text-[#0F172A] text-sm">No matching records found</div>
            <div className="mt-1">Try adjusting your date range preset or clear search filters.</div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredPatients.map(p => {
              const totFee = p.fee_total !== undefined && p.fee_total !== null ? parseFloat(p.fee_total) : 0
              const paidFee = parseFloat(p.fee_paid) || (p.payment_status === 'completed' ? totFee : 0)
              const isPaid = p.payment_status === 'completed' || (totFee > 0 && paidFee >= totFee)
              const isCompleted = p.status === 'done' || p.status === 'completed'
              const isSkipped = p.status === 'skipped' || p.status === 'cancelled'
              const timeStr = new Date(p.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

              return (
                <div key={p.id} className={`history-row-hover flex items-center justify-between p-3.5 rounded-2xl border flex-wrap gap-3 ${isCompleted ? 'bg-[#F0FDF4] border-[#A7F3D0]' : isSkipped ? 'bg-[#FEF2F2] border-[#FECACA]' : 'bg-white border-[#E2E8F0]'}`}>
                  {/* Token & Patient Name */}
                  <div className="flex items-center gap-3.5 min-w-[200px]">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm font-mono flex-shrink-0 ${isCompleted ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' : isSkipped ? 'bg-[#FEE2E2] border-[#FECACA] text-red-600' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'}`}>
                      #{formatToken(p.token)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-[#0F172A]">{p.name || 'Walk-in Patient'}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border text-center uppercase ${isCompleted ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]' : isSkipped ? 'bg-[#FEE2E2] text-red-600 border-[#FECACA]' : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'}`}>
                          {isCompleted ? 'COMPLETED' : isSkipped ? 'CANCELLED' : p.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reason (if entered) */}
                  {(p.purpose || p.reason) && (
                    <div className="flex-1 min-w-[140px] px-3.5 border-l border-[#E2E8F0] flex flex-col justify-center">
                      <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Reason for Visit</span>
                      <span className="text-xs font-bold text-[#0F172A] truncate max-w-[160px]">
                        {p.purpose || p.reason}
                      </span>
                    </div>
                  )}

                  {/* Phone */}
                  <div className="flex-1 min-w-[140px] px-3.5 border-l border-[#E2E8F0] flex flex-col justify-center">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">WhatsApp Phone</span>
                    <span className="flex items-center gap-1 text-[#059669] font-bold text-xs">
                      <Phone className="w-3.5 h-3.5 text-[#059669]" /> {p.phone}
                    </span>
                  </div>

                  {/* Time & Date */}
                  <div className="flex-1 min-w-[140px] px-3.5 border-l border-[#E2E8F0] flex flex-col justify-center">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Entry Date &amp; Time</span>
                    <span className="flex items-center gap-1 text-[#475569] font-bold text-xs">
                      <Clock className="w-3.5 h-3.5 text-[#64748B]" /> {formatDateDMY(p.date)} · {timeStr}
                    </span>
                  </div>

                  {/* Payment Info & Details Button */}
                  <div className="flex items-center gap-3 pl-3.5 border-l border-[#E2E8F0] flex-shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">Fee Paid</span>
                      <span className={`text-sm font-black ${isPaid ? 'text-[#059669]' : 'text-amber-600'}`}>
                        ₹{paidFee} <span className="text-[10px] text-[#64748B] font-semibold">/ ₹{totFee}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedPatient(p)}
                      className="btn-more-details bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
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
        <div onClick={() => setSelectedPatient(null)} className="fixed inset-0 z-[99999] bg-[#064E3B]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#CBD5E1]">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-black text-[#064E3B]">Patient Consultation Details</div>
              <button onClick={() => setSelectedPatient(null)} className="bg-[#F1F5F9] border-none w-8 h-8 rounded-full font-bold text-sm">×</button>
            </div>

            <div className="bg-[#F8FAFC] rounded-xl p-4.5 border border-[#E2E8F0] mb-5">
              <div className="flex justify-between items-center mb-3 border-b border-[#E2E8F0] pb-2.5">
                <div>
                  <div className="text-lg font-black text-[#0F172A]">{selectedPatient.name || 'Walk-in Patient'}</div>
                </div>
                <span className="bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-3 py-1 rounded-xl font-black text-sm font-mono">
                  #{formatToken(selectedPatient.token)}
                </span>
              </div>

              <div className="text-xs text-[#334151] space-y-2.5">
                <div className="flex justify-between">
                  <strong className="text-[#64748B]">WhatsApp Mobile:</strong>
                  <span className="font-extrabold text-[#059669]">+91 {selectedPatient.phone}</span>
                </div>
                <div className="flex justify-between">
                  <strong className="text-[#64748B]">Visit Status:</strong>
                  <span className={`font-extrabold uppercase ${selectedPatient.status === 'done' ? 'text-[#059669]' : 'text-red-600'}`}>{selectedPatient.status}</span>
                </div>
                <div className="flex justify-between">
                  <strong className="text-[#64748B]">Entry Date:</strong>
                  <span className="font-bold">{formatDateDMY(selectedPatient.date)}</span>
                </div>
                <div className="flex justify-between">
                  <strong className="text-[#64748B]">Check-in Time:</strong>
                  <span className="font-bold">{new Date(selectedPatient.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>
                <div className="flex justify-between">
                  <strong className="text-[#64748B]">Reason for Visit:</strong>
                  <span className={`font-bold ${(selectedPatient.purpose || selectedPatient.reason) ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{selectedPatient.purpose || selectedPatient.reason || 'None Specified'}</span>
                </div>
                <div className="flex justify-between">
                  <strong className="text-[#64748B]">Preferred Language:</strong>
                  <span className="font-bold">{selectedPatient.language || 'hi'}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-[#CBD5E1] pt-2.5 mt-1">
                  <strong className="text-[#64748B]">Billing Status:</strong>
                  <span className={`font-black ${selectedPatient.payment_status === 'completed' ? 'text-[#059669]' : 'text-amber-600'}`}>
                    {selectedPatient.payment_status === 'completed' ? 'PAID FULL' : 'PENDING'} (₹{selectedPatient.fee_paid || 0} / ₹{selectedPatient.fee_total || 0})
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              className="w-full bg-[#064E3B] text-white border-none py-3 rounded-xl font-extrabold text-xs shadow-sm hover:bg-[#043E2E] transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
