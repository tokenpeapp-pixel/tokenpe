'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, TrendingUp, Users, Clock, ChevronLeft, Calendar, Activity, Star, Zap, RefreshCw, AlertTriangle } from 'lucide-react'
import { supabase, getISTDateString } from '../../../lib/supabase'

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedDate, setSelectedDate] = useState(getISTDateString()) // "YYYY-MM-DD"

  // Raw data
  const [historyToday, setHistoryToday] = useState([])
  const [queueToday, setQueueToday] = useState([])
  const [queueAllTime, setQueueAllTime] = useState([])

  // Computed stats
  const [stats, setStats] = useState({
    totalServedToday: 0,
    completedToday: 0,
    cancelledToday: 0,
    currentInQueue: 0,
    peakHour: 'N/A',
    avgWaitMin: 0,
    satisfactionRate: 0,
    totalAllTime: 0,
  })
  const [hourlyBuckets, setHourlyBuckets] = useState(Array(14).fill(0)) // 7am–8pm
  const [reasonBreakdown, setReasonBreakdown] = useState([])
  const [gradeBreakdown, setGradeBreakdown] = useState([])

  const loadData = useCallback(async (dateStr) => {
    try {
      const stored = localStorage.getItem('tokenpe_clinic')
      const clinic = stored ? JSON.parse(stored) : null
      const schoolId = clinic?.id

      if (!schoolId || schoolId === 'demo-school-id') {
        setError('No school found. Please log in again.')
        setLoading(false)
        return
      }

      const targetDate = dateStr || getISTDateString()
      const startOfDay = `${targetDate}T00:00:00+05:30`
      const endOfDay = `${targetDate}T23:59:59+05:30`

      // ── 1. Fetch today's school_history (completed/cancelled) ──
      const { data: histData, error: histErr } = await supabase
        .from('school_history')
        .select('id, student_name, grade_class, time_label, status, created_at, completed_at, guardian_name')
        .eq('school_id', schoolId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: true })

      if (histErr) throw histErr
      const history = histData || []
      setHistoryToday(history)

      // ── 2. Fetch today's queue entries (all statuses) ──
      const { data: qData } = await supabase
        .from('school_queue')
        .select('id, name, status, created_at, completed_at, notes, phone')
        .eq('school_id', schoolId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: true })
      const queue = qData || []
      setQueueToday(queue)

      // Also fetch all-time total from queues table
      const { count: allTimeCount } = await supabase
        .from('school_queue')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
      setQueueAllTime(allTimeCount || 0)

      // ── 3. Compute stats ──
      const allEntries = [...history, ...queue.filter(q => !history.find(h => h.id === q.id))]

      const completed = history.filter(h => h.status === 'done').length
      const cancelled = [...history, ...queue].filter(r => r.status === 'cancelled').length
      const currentWaiting = queue.filter(q => q.status === 'waiting' || q.status === 'with_staff').length
      const totalToday = Math.max(history.length, queue.length)

      // Hourly buckets: 7am = index 0, 8pm = index 13
      const buckets = Array(14).fill(0)
      const allCreated = [...history, ...queue]
      allCreated.forEach(r => {
        if (!r.created_at) return
        // Parse IST hour
        const d = new Date(r.created_at)
        const istHour = (d.getUTCHours() + 5 + Math.floor((d.getUTCMinutes() + 30) / 60)) % 24
        const idx = istHour - 7
        if (idx >= 0 && idx < 14) buckets[idx]++
      })
      setHourlyBuckets(buckets)

      // Peak hour
      const peakIdx = buckets.indexOf(Math.max(...buckets))
      const peakHourRaw = peakIdx + 7
      const peakHour = buckets[peakIdx] > 0
        ? `${peakHourRaw > 12 ? peakHourRaw - 12 : peakHourRaw}:00 ${peakHourRaw >= 12 ? 'PM' : 'AM'}`
        : 'N/A'

      // Avg wait time (completed_at - created_at where both exist)
      const waitTimes = history
        .filter(h => h.completed_at && h.created_at)
        .map(h => (new Date(h.completed_at) - new Date(h.created_at)) / 60000)
        .filter(m => m > 0 && m < 120)
      const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : null

      // Satisfaction = completed / (completed + cancelled) * 100
      const satisfaction = (completed + cancelled) > 0
        ? Math.round((completed / (completed + cancelled)) * 100)
        : null

      setStats({
        totalServedToday: totalToday,
        completedToday: completed,
        cancelledToday: cancelled,
        currentInQueue: currentWaiting,
        peakHour,
        avgWaitMin: avgWait,
        satisfactionRate: satisfaction,
        totalAllTime: allTimeCount || 0,
      })

      // ── 4. Reason breakdown ──
      const reasonMap = {}
      queue.forEach(q => {
        const raw = q.notes || ''
        const reason = raw.includes('|') ? raw.split('|')[1]?.trim() : (raw || 'General')
        reasonMap[reason] = (reasonMap[reason] || 0) + 1
      })
      const reasonArr = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      setReasonBreakdown(reasonArr)

      // ── 5. Grade breakdown ──
      const gradeMap = {}
      history.forEach(h => {
        const g = h.grade_class || 'Unknown'
        gradeMap[g] = (gradeMap[g] || 0) + 1
      })
      queue.forEach(q => {
        const raw = q.notes || ''
        const g = raw.includes('|') ? raw.split('|')[0]?.trim() : 'Unknown'
        if (g) gradeMap[g] = (gradeMap[g] || 0) + 1
      })
      const gradeArr = Object.entries(gradeMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
      setGradeBreakdown(gradeArr)

      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Analytics load error:', err)
      setError('Failed to load analytics data. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  const todayStr = getISTDateString()
  const isToday = selectedDate === todayStr

  useEffect(() => {
    setLoading(true)
    loadData(selectedDate)
    if (!isToday) return // no auto-refresh for past dates
    const interval = setInterval(() => loadData(selectedDate), 30000)
    return () => clearInterval(interval)
  }, [selectedDate, loadData, isToday])

  const hours = ['7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm']
  const maxH = Math.max(...hourlyBuckets, 1)

  const kpiCards = [
    {
      label: 'Served Today',
      value: stats.totalServedToday,
      icon: <Users size={18} />,
      color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE',
      sub: `${stats.currentInQueue} currently in queue`,
    },
    {
      label: 'Completed',
      value: stats.completedToday,
      icon: <Activity size={18} />,
      color: '#059669', bg: '#ECFDF5', border: '#A7F3D0',
      sub: stats.totalServedToday > 0 ? `${Math.round((stats.completedToday / stats.totalServedToday) * 100)}% completion rate` : 'No data yet',
    },
    {
      label: 'Avg. Wait Time',
      value: stats.avgWaitMin !== null ? `${stats.avgWaitMin}m` : '—',
      icon: <Clock size={18} />,
      color: '#D97706', bg: '#FFFBEB', border: '#FDE68A',
      sub: stats.avgWaitMin !== null ? (stats.avgWaitMin <= 10 ? '✓ Within target' : '↑ Above 10min target') : 'Insufficient data',
    },
    {
      label: 'Peak Hour',
      value: stats.peakHour,
      icon: <Zap size={18} />,
      color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
      sub: `${Math.max(...hourlyBuckets)} at busiest`,
    },
    {
      label: 'Satisfaction',
      value: stats.satisfactionRate !== null ? `${stats.satisfactionRate}%` : '—',
      icon: <Star size={18} />,
      color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8',
      sub: 'Completed vs cancelled ratio',
    },
    {
      label: 'Cancelled',
      value: stats.cancelledToday,
      icon: <TrendingUp size={18} />,
      color: '#DC2626', bg: '#FEF2F2', border: '#FECACA',
      sub: stats.totalServedToday > 0 ? `${Math.round((stats.cancelledToday / stats.totalServedToday) * 100)}% drop-off rate` : 'No data yet',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(27,42,74,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(27,42,74,0.06)' }}>
        <button onClick={() => router.push('/school-dashboard')} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#1B2A4A', fontWeight: 700, fontSize: '0.8rem' }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #2563EB 100%)', borderRadius: 8, padding: 8 }}>
            <BarChart2 size={18} color="#FFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A' }}>Campus Analytics & Reports</div>
            <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600 }}>
              {isToday
                ? lastUpdated ? `Live · last updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Loading...'
                : `Showing history for ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
              }
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
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
          {/* Today shortcut */}
          {!isToday && (
            <button onClick={() => setSelectedDate(todayStr)} style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: '#2563EB' }}>
              Today
            </button>
          )}
          <button onClick={() => { setLoading(true); loadData(selectedDate) }} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#5A6E85', fontSize: '0.75rem', fontWeight: 700 }}>
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
          <button onClick={() => { setLoading(true); loadData() }} style={{ marginTop: 12, background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit' }}>Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 20px' }}>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 24 }}>
            {kpiCards.map((k, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: `1.5px solid ${k.border}`, borderRadius: 10, padding: '16px 18px', boxShadow: '0 4px 12px rgba(27,42,74,0.05)' }}>
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
          <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '22px 24px', boxShadow: '0 4px 16px rgba(27,42,74,0.06)', marginBottom: 20 }}>
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
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
                {hourlyBuckets.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    {v > 0 && <div style={{ fontSize: '0.58rem', fontWeight: 800, color: v === Math.max(...hourlyBuckets) ? '#2563EB' : '#94A3B8' }}>{v}</div>}
                    <div style={{
                      width: '100%', borderRadius: '4px 4px 0 0',
                      height: `${Math.max((v / maxH) * 130, v > 0 ? 4 : 2)}px`,
                      background: v === Math.max(...hourlyBuckets)
                        ? 'linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)'
                        : v > 0 ? 'linear-gradient(180deg, #93C5FD 0%, #BFDBFE 100%)' : '#F1F5F9',
                      transition: 'height 0.6s ease',
                      boxShadow: v === Math.max(...hourlyBuckets) ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'
                    }} />
                    <div style={{ fontSize: '0.55rem', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>{hours[i]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Grid: Reason + Grade breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Reason Breakdown */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '20px 22px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)' }}>
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
            <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '20px 22px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.95rem', color: '#1B2A4A', marginBottom: 16 }}>By Class / Grade</div>
              {gradeBreakdown.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, padding: '12px 0' }}>No data yet</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {gradeBreakdown.map(([grade, count], i) => {
                    const colors = ['#EFF6FF|#2563EB', '#ECFDF5|#059669', '#FEF3C7|#D97706', '#F5F3FF|#7C3AED', '#FDF2F8|#DB2777', '#FEF2F2|#DC2626']
                    const [bgColor, textColor] = colors[i % colors.length].split('|')
                    return (
                      <div key={i} style={{ background: bgColor, border: `1px solid ${textColor}33`, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
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
