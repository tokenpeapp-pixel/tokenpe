'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, TrendingUp, Users, Clock, ChevronLeft, Calendar, Activity, RefreshCw, AlertTriangle } from 'lucide-react'
import { supabase, getISTDateString } from '../../../lib/supabase'

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedDate, setSelectedDate] = useState(getISTDateString())
  const [patients, setPatients] = useState([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const todayStr = getISTDateString()
  const isToday = selectedDate === todayStr

  const loadData = useCallback(async (date) => {
    try {
      setLoading(true)
      const stored = typeof window !== 'undefined' ? (localStorage.getItem('tokenpe_school_business') || localStorage.getItem('tokenpe_business') || localStorage.getItem('tokenpe_clinic')) : null
      const school = stored ? JSON.parse(stored) : null
      const schoolId = school?.id

      if (!schoolId) {
        setError('No school found. Please log in.')
        setLoading(false)
        return
      }

      const [queueRes, historyRes] = await Promise.all([
        supabase.from('school_queue').select('*').eq('school_id', schoolId),
        supabase.from('school_history').select('*').eq('school_id', schoolId)
      ])

      let combined = []
      if (queueRes.data) combined.push(...queueRes.data)
      if (historyRes.data) combined.push(...historyRes.data)

      if (date) {
        combined = combined.filter(p => {
          const itemDate = p.created_at ? p.created_at.split('T')[0] : ''
          return itemDate === date || p.date === date
        })
      }

      setPatients(combined)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
      setError('Failed to load analytics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadData(selectedDate)
    if (!isToday) return
    const interval = setInterval(() => loadData(selectedDate), 30000)
    return () => clearInterval(interval)
  }, [selectedDate, loadData, isToday])

  const hourlyBuckets = new Array(14).fill(0)
  patients.forEach(p => {
    const timeField = p.joined_at || p.created_at
    if (timeField) {
      const h = new Date(timeField).getHours()
      if (h >= 7 && h <= 20) hourlyBuckets[h - 7]++
    }
  })
  const hours = ['7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm']
  const maxH = Math.max(...hourlyBuckets, 1)

  const completedToday = patients.filter(p => p.status === 'done' || p.status === 'completed').length
  const waitingToday = patients.filter(p => p.status === 'waiting' || p.status === 'with_staff').length
  const totalServedToday = patients.length
  
  const waitTimes = patients
    .filter(p => p.completed_at && p.joined_at)
    .map(p => Math.floor((new Date(p.completed_at) - new Date(p.joined_at)) / 60000))
    .filter(t => t >= 0)
  
  const avgWaitMin = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0

  const stats = {
    totalServedToday,
    completedToday,
    waitingToday,
    avgWaitMin
  }

  const kpiCards = [
    { label: 'Total Check-ins', value: totalServedToday, sub: 'Total students today', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: <Users size={18} /> },
    { label: 'Completed', value: completedToday, sub: 'Consultations finished', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: <TrendingUp size={18} /> },
    { label: 'In Queue', value: waitingToday, sub: 'Currently waiting', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', icon: <Activity size={18} /> },
    { label: 'Avg Wait Time', value: `${avgWaitMin} min`, sub: 'From check-in to completion', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: <Clock size={18} /> },
  ]

  const reasonMap = {}
  patients.forEach(p => {
    const r = p.reason || 'Arrival'
    reasonMap[r] = (reasonMap[r] || 0) + 1
  })
  const reasonBreakdown = Object.entries(reasonMap).sort((a, b) => b[1] - a[1])

  const gradeMap = {}
  patients.forEach(p => {
    const g = p.grade_class || p.grade || 'General'
    gradeMap[g] = (gradeMap[g] || 0) + 1
  })
  const gradeBreakdown = Object.entries(gradeMap).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      <style>{`
        .analytics-card {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .analytics-card:hover {
          transform: translateY(-3px) scale(1.008) !important;
          box-shadow: 0 10px 30px rgba(27, 42, 74, 0.1) !important;
        }
        .chart-bar {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .chart-bar:hover {
          filter: brightness(1.15) !important;
          transform: scaleY(1.05) !important;
        }
        .hover-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .hover-btn:hover {
          transform: translateY(-1.5px) !important;
          box-shadow: 0 4px 14px rgba(27, 42, 74, 0.15) !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(27,42,74,0.08)', padding: isMobile ? '10px 12px' : '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(27,42,74,0.06)' }}>
        <button onClick={() => router.push('/school-dashboard')} className="hover-btn" style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#1B2A4A', fontWeight: 700, fontSize: '0.8rem' }}>
          <ChevronLeft size={16} />{isMobile ? null : ' Back'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #2563EB 100%)', borderRadius: 8, padding: 8 }}>
            <BarChart2 size={18} color="#FFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A' }}>Campus Analytics & Reports</div>
            <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600, display: isMobile ? 'none' : 'block' }}>
              {isToday
                ? lastUpdated ? `Live · last updated ${lastUpdated}` : 'Loading...'
                : `Showing history for ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
              }
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 10 }}>
          {/* Date Picker */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0, background: '#FFFFFF', border: '1.5px solid #BFDBFE', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}>
            <div style={{ background: '#EFF6FF', padding: '7px 10px', display: 'flex', alignItems: 'center', borderRight: '1px solid #BFDBFE' }}>
              <Calendar size={14} color="#2563EB" />
            </div>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={e => { if (e.target.value) setSelectedDate(e.target.value) }}
              style={{
                border: 'none', outline: 'none', padding: '7px 12px',
                fontSize: '0.78rem', fontWeight: 700, color: '#1D4ED8',
                background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                minWidth: 130,
              }}
            />
          </div>
          {!isToday && (
            <button onClick={() => setSelectedDate(todayStr)} className="hover-btn" style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: '#2563EB' }}>
              Today
            </button>
          )}
          <button onClick={() => { setLoading(true); loadData(selectedDate) }} className="hover-btn" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#5A6E85', fontSize: '0.75rem', fontWeight: 700 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ marginTop: 14, color: '#5A6E85', fontWeight: 600, fontSize: '0.88rem' }}>Loading live analytics...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && error && (
        <div style={{ maxWidth: 500, margin: '60px auto', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '24px 28px', textAlign: 'center' }}>
          <AlertTriangle size={32} color="#DC2626" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>{error}</div>
          <button onClick={() => { setLoading(true); loadData(selectedDate) }} className="hover-btn" style={{ marginTop: 12, background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', font: 700, fontSize: '0.82rem', fontFamily: 'inherit' }}>Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '14px 12px' : '28px 20px' }}>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {kpiCards.map((k, i) => (
              <div key={i} className="analytics-card" style={{ background: '#FFFFFF', border: `1.5px solid ${k.border}`, borderRadius: 10, padding: '16px 18px', boxShadow: '0 4px 12px rgba(27,42,74,0.05)', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ background: k.bg, color: k.color, borderRadius: 8, padding: 7, display: 'flex' }}>{k.icon}</div>
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.65rem', fontWeight: 700, color: '#1B2A4A', lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: '0.65rem', color: '#5A6E85', fontWeight: 800, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 500, marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Hourly Traffic Bar Chart */}
          <div className="analytics-card" style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '22px 24px', boxShadow: '0 4px 16px rgba(27,42,74,0.06)', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: '#1B2A4A' }}>Hourly Footfall</div>
                <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600, marginTop: 2 }}>Live queue volume by hour — today</div>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isToday ? '#2563EB' : '#5A6E85', background: isToday ? '#EFF6FF' : '#F1F5F9', border: `1px solid ${isToday ? '#BFDBFE' : '#E2E8F0'}`, padding: '4px 10px', borderRadius: 6 }}>{isToday ? 'LIVE' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
            </div>
            {hourlyBuckets.every(v => v === 0) ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600 }}>No queue activity recorded yet today</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, overflowX: 'auto' }}>
                {hourlyBuckets.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    {v > 0 && <div style={{ fontSize: '0.58rem', fontWeight: 800, color: v === Math.max(...hourlyBuckets) ? '#2563EB' : '#94A3B8' }}>{v}</div>}
                    <div className="chart-bar" style={{
                      width: '100%', borderRadius: '4px 4px 0 0',
                      height: `${Math.max((v / maxH) * 130, v > 0 ? 4 : 2)}px`,
                      background: v === Math.max(...hourlyBuckets)
                        ? 'linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)'
                        : v > 0 ? 'linear-gradient(180deg, #93C5FD 0%, #BFDBFE 100%)' : '#F1F5F9',
                      boxShadow: v === Math.max(...hourlyBuckets) ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'
                    }} />
                    <div style={{ fontSize: '0.55rem', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>{hours[i]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Grid: Reason + Grade breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

            {/* Reason Breakdown */}
            <div className="analytics-card" style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '20px 22px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.95rem', color: '#1B2A4A', marginBottom: 16 }}>Visit Reasons</div>
              {reasonBreakdown.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, padding: '12px 0' }}>No data yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reasonBreakdown.map(([reason, count], i) => {
                    const maxR = reasonBreakdown[0][1]
                    const pct = Math.round((count / maxR) * 100)
                    const colors = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777']
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>{reason}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: colors[i % colors.length] }}>{count}</span>
                        </div>
                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: 99, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Grade Breakdown */}
            <div className="analytics-card" style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '20px 22px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.95rem', color: '#1B2A4A', marginBottom: 16 }}>By Class / Grade</div>
              {gradeBreakdown.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, padding: '12px 0' }}>No data yet</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {gradeBreakdown.map(([grade, count], i) => {
                    const colors = ['#EFF6FF|#2563EB', '#ECFDF5|#059669', '#FEF3C7|#D97706', '#F5F3FF|#7C3AED', '#FDF2F8|#DB2777', '#FEF2F2|#DC2626']
                    const [bgColor, textColor] = colors[i % colors.length].split('|')
                    return (
                      <div key={i} className="hover-btn" style={{ background: bgColor, border: `1px solid ${textColor}33`, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: textColor }}>{grade}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: textColor, background: `${textColor}22`, padding: '1px 7px', borderRadius: 4 }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Completion rate bar */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5A6E85' }}>Overall Completion Rate</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669' }}>
                    {stats.totalServedToday > 0 ? `${Math.round((stats.completedToday / stats.totalServedToday) * 100)}%` : '—'}
                  </span>
                </div>
                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${stats.totalServedToday > 0 ? Math.round((stats.completedToday / stats.totalServedToday) * 100) : 0}%`,
                    background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
                    borderRadius: 99, transition: 'width 1s ease'
                  }} />
                </div>
              </div>
            </div>

          </div>

          {/* Auto-refresh note */}
          <div style={{ textAlign: 'center', marginTop: 20, color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
            {isToday ? '↻ Auto-refreshes every 30 seconds · Data source: live Supabase DB' : `📅 Viewing historical data for ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
          </div>

        </div>
      )}
    </div>
  )
}
