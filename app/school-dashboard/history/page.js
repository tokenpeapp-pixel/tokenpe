'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getISTDateString } from '../../../lib/supabase'
import {
  ChevronLeft, History, Calendar, Search, Filter,
  Clock, GraduationCap, Phone, CheckCircle2, XCircle,
  RefreshCw, Download, ChevronDown, Users
} from 'lucide-react'

const S = { fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }

const QUICK_RANGES = [
  { label: 'Today',    days: 0  },
  { label: '7 Days',   days: 7  },
  { label: '30 Days',  days: 30 },
  { label: '365 Days', days: 365 },
]

function getDateRange(days, customStart, customEnd) {
  const pad = n => String(n).padStart(2, '0')
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  if (customStart && customEnd) {
    return { start: `${customStart}T00:00:00+05:30`, end: `${customEnd}T23:59:59+05:30` }
  }
  const today = new Date()
  const end = fmt(today)
  if (days === 0) {
    const todayStr = getISTDateString()
    return { start: `${todayStr}T00:00:00+05:30`, end: `${todayStr}T23:59:59+05:30` }
  }
  const start = new Date(today)
  start.setDate(start.getDate() - days + 1)
  return { start: `${fmt(start)}T00:00:00+05:30`, end: `${end}T23:59:59+05:30` }
}

export default function HistoryPage() {
  const router = useRouter()

  const [records, setRecords]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [lastUpdated, setLastUpdated]   = useState(null)

  // Filters
  const [activeRange, setActiveRange]   = useState(0) // index into QUICK_RANGES (0=Today)
  const [customStart, setCustomStart]   = useState('')
  const [customEnd, setCustomEnd]       = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'done' | 'cancelled'

  // Stats derived from records
  const totalCount      = records.length
  const completedCount  = records.filter(r => r.status === 'done').length
  const cancelledCount  = records.filter(r => r.status === 'cancelled').length

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadHistory = useCallback(async (days, cStart, cEnd) => {
    setLoading(true)
    setError(null)
    try {
      const stored = localStorage.getItem('tokenpe_clinic')
      const clinic = stored ? JSON.parse(stored) : null
      const schoolId = clinic?.id
      if (!schoolId) { setError('No school found. Please log in.'); setLoading(false); return }

      const { start, end } = getDateRange(days, cStart, cEnd)

      const { data, error: fetchErr } = await supabase
        .from('school_history')
        .select('id, student_name, grade_class, guardian_name, time_label, status, created_at, completed_at')
        .eq('school_id', schoolId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .limit(500)

      if (fetchErr) throw fetchErr
      setRecords(data || [])
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
      setError('Failed to load history. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load on mount and whenever range changes
  useEffect(() => {
    if (customStart && customEnd) {
      loadHistory(null, customStart, customEnd)
    } else {
      loadHistory(QUICK_RANGES[activeRange].days)
    }
  }, [activeRange, customStart, customEnd, loadHistory])

  function applyCustomRange() {
    if (!customStart || !customEnd) return
    if (customStart > customEnd) return alert('Start date must be before end date')
    setActiveRange(-1) // deselect quick range
    setShowCalendar(false)
    loadHistory(null, customStart, customEnd)
  }

  function selectQuickRange(idx) {
    setActiveRange(idx)
    setCustomStart('')
    setCustomEnd('')
    setShowCalendar(false)
  }

  // Client-side search + status filter
  const filtered = records.filter(r => {
    const matchSearch =
      !search ||
      r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.grade_class?.toLowerCase().includes(search.toLowerCase()) ||
      r.guardian_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'all' ||
      r.status === statusFilter
    return matchSearch && matchStatus
  })

  // Export CSV
  function exportCSV() {
    if (!filtered.length) return
    const rows = [
      ['Name', 'Class/Grade', 'Guardian', 'Status', 'Time', 'Date'],
      ...filtered.map(r => [
        r.student_name || '',
        r.grade_class || '',
        r.guardian_name || '',
        r.status || '',
        r.time_label || '',
        r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '',
      ])
    ]
    const csv = rows.map(row => row.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `dismissal-history-${getISTDateString()}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const todayStr = getISTDateString()

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', ...S }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* ── HEADER ── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(27,42,74,0.08)', padding: isMobile ? '10px 12px' : '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(27,42,74,0.06)' }}>
        <button onClick={() => router.push('/school-dashboard')} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#1B2A4A', fontWeight: 700, fontSize: '0.8rem' }}>
          <ChevronLeft size={16} />{isMobile ? null : ' Back'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #059669 100%)', borderRadius: 8, padding: 8 }}>
            <History size={18} color="#FFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A' }}>Dismissal History</div>
            <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600, display: isMobile ? 'none' : 'block' }}>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading…'}
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={() => loadHistory(activeRange >= 0 ? QUICK_RANGES[activeRange].days : null, customStart, customEnd)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#5A6E85', fontWeight: 700, fontSize: '0.75rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={!filtered.length} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1B2A4A', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: filtered.length ? 'pointer' : 'not-allowed', color: '#FFF', fontWeight: 700, fontSize: '0.75rem', opacity: filtered.length ? 1 : 0.5 }}>
            <Download size={13} />{isMobile ? null : ' Export CSV'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '14px 12px' : '22px 20px' }}>

        {/* ── KPI STRIP ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Records', value: totalCount,     color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: <Users size={16}/> },
            { label: 'Completed',     value: completedCount, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: <CheckCircle2 size={16}/> },
            { label: 'Cancelled',     value: cancelledCount, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: <XCircle size={16}/> },
          ].map((k, i) => (
            <div key={i} style={{ background: '#FFFFFF', border: `1.5px solid ${k.border}`, borderRadius: 10, padding: isMobile ? '8px' : '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 12px rgba(27,42,74,0.04)' }}>
              <div style={{ background: k.bg, color: k.color, borderRadius: 8, padding: 8, display: 'flex', flexShrink: 0 }}>{k.icon}</div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.7rem', fontWeight: 700, color: '#1B2A4A', lineHeight: 1 }}>{loading ? '—' : k.value}</div>
                <div style={{ fontSize: '0.65rem', color: '#5A6E85', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTERS ROW ── */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>

          {/* Quick range buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {QUICK_RANGES.map((r, i) => (
              <button key={i} onClick={() => selectQuickRange(i)} style={{
                padding: '6px 14px', borderRadius: 7, border: `1.5px solid ${activeRange === i ? '#1B2A4A' : '#E2E8F0'}`,
                background: activeRange === i ? '#1B2A4A' : '#F8FAFC',
                color: activeRange === i ? '#FFF' : '#5A6E85',
                fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease',
              }}>
                {isMobile ? r.label.replace(' Days', 'D').replace(' Today', 'Today') : r.label}
              </button>
            ))}
          </div>

          {/* Custom date picker */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowCalendar(!showCalendar)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 7, border: `1.5px solid ${activeRange === -1 ? '#2563EB' : '#E2E8F0'}`, background: activeRange === -1 ? '#EFF6FF' : '#F8FAFC', color: activeRange === -1 ? '#2563EB' : '#5A6E85', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Calendar size={13} />
              {activeRange === -1 && customStart ? `${customStart} → ${customEnd}` : 'Custom Range'}
              <ChevronDown size={12} />
            </button>

            {showCalendar && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 100, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '16px 18px', boxShadow: '0 12px 32px rgba(27,42,74,0.12)', minWidth: 280 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1B2A4A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Select Date Range</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#5A6E85', marginBottom: 5 }}>FROM</div>
                    <input type="date" value={customStart} max={todayStr} onChange={e => setCustomStart(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: '0.82rem', color: '#1B2A4A', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#5A6E85', marginBottom: 5 }}>TO</div>
                    <input type="date" value={customEnd} max={todayStr} min={customStart} onChange={e => setCustomEnd(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 7, fontSize: '0.82rem', color: '#1B2A4A', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={applyCustomRange} disabled={!customStart || !customEnd} style={{ flex: 1, padding: '8px 0', background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 7, fontWeight: 800, fontSize: '0.8rem', cursor: (!customStart || !customEnd) ? 'not-allowed' : 'pointer', opacity: (!customStart || !customEnd) ? 0.5 : 1, fontFamily: 'inherit' }}>
                    Apply
                  </button>
                  <button onClick={() => setShowCalendar(false)} style={{ padding: '8px 14px', background: '#F1F5F9', color: '#5A6E85', border: '1px solid #E2E8F0', borderRadius: 7, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: '#E2E8F0', flexShrink: 0 }} />

          {/* Search */}
          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, grade, guardian…" style={{ width: '100%', padding: '7px 12px 7px 30px', border: '1.5px solid #E2E8F0', borderRadius: 7, outline: 'none', background: '#F8FAFC', fontSize: '0.82rem', color: '#1B2A4A', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 7, padding: '0 10px', height: 34 }}>
            <Filter size={12} color="#5A6E85" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '0.8rem', color: '#1B2A4A', fontWeight: 700, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              <option value="all">All Status</option>
              <option value="done">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* ── RECORDS TABLE / CARDS ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ display: 'inline-block', width: 34, height: 34, border: '3px solid #E2E8F0', borderTopColor: '#1B2A4A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ marginTop: 14, color: '#5A6E85', fontWeight: 600, fontSize: '0.85rem' }}>Loading records…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, color: '#DC2626', fontWeight: 700 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: 12, color: '#5A6E85', fontWeight: 600 }}>
            <History size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div>No records found for this period</div>
            <div style={{ fontSize: '0.78rem', marginTop: 6, fontWeight: 500 }}>Try selecting a wider date range or clearing the search</div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(27,42,74,0.06)' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 120px 90px 100px', gap: 0, padding: '12px 18px', background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
              {['#', 'Student', 'Class / Grade', 'Guardian', 'Time', 'Status'].map((h, i) => (
                <div key={i} style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 10 }}>
                  {filtered.map((r, idx) => {
                    const isDone = r.status === 'done'
                    const isCancelled = r.status === 'cancelled'
                    return (
                      <div key={r.id} style={{ background: idx%2===0?'#FFF':'#FAFBFD', border: '1px solid #F1F5F9', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 8 }}>
                          <div style={{ fontFamily:'Playfair Display, serif', fontWeight:700, fontSize:'0.95rem', color:'#1B2A4A' }}>{r.student_name}</div>
                          {isDone ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: '0.68rem', fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>
                              <CheckCircle2 size={10} /> Completed
                            </span>
                          ) : isCancelled ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.68rem', fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>
                              <XCircle size={10} /> Cancelled
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8' }}>{r.status || '—'}</span>
                          )}
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                          <div style={{ fontSize:'0.75rem', color:'#5A6E85', display: 'flex', alignItems: 'center', gap: 4 }}><GraduationCap size={12}/> {r.grade_class||'—'}</div>
                          <div style={{ fontSize:'0.75rem', color:'#5A6E85', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/> {r.time_label||'—'}</div>
                          <div style={{ fontSize:'0.75rem', color:'#5A6E85', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12}/> {r.guardian_name||'—'}</div>
                          <div style={{ fontSize:'0.75rem', color:'#94A3B8' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : ''}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                filtered.map((r, idx) => {
                const isDone      = r.status === 'done'
                const isCancelled = r.status === 'cancelled'
                const dateLabel   = r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''
                return (
                  <div key={r.id} style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 120px 120px 90px 100px', gap: 0,
                    padding: '13px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                    alignItems: 'center', transition: 'background 0.1s',
                    background: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFD',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F0F7FF'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#FFFFFF' : '#FAFBFD'}
                  >
                    {/* # */}
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>

                    {/* Name + date */}
                    <div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.95rem', color: '#1B2A4A' }}>{r.student_name || '—'}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{dateLabel}</div>
                    </div>

                    {/* Grade */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GraduationCap size={12} color="#7C3AED" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: 5 }}>{r.grade_class || '—'}</span>
                    </div>

                    {/* Guardian */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={11} color="#5A6E85" />
                      <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600, fontFamily: 'monospace' }}>{r.guardian_name || '—'}</span>
                    </div>

                    {/* Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={11} color="#5A6E85" />
                      <span style={{ fontSize: '0.78rem', color: '#5A6E85', fontWeight: 700, fontFamily: 'monospace' }}>{r.time_label || (r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—')}</span>
                    </div>

                    {/* Status badge */}
                    <div>
                      {isDone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: '0.68rem', fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>
                          <CheckCircle2 size={10} /> Completed
                        </span>
                      ) : isCancelled ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.68rem', fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>
                          <XCircle size={10} /> Cancelled
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8' }}>{r.status || '—'}</span>
                      )}
                    </div>
                  </div>
                )
              })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 18px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Showing {filtered.length} of {totalCount} records</span>
              <span>Sorted: newest first · max 500 records</span>
            </div>
          </div>
        )}
      </div>

      {/* Close calendar on outside click */}
      {showCalendar && <div onClick={() => setShowCalendar(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
    </div>
  )
}
