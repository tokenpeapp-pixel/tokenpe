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
  const [patients, setPatients] = useState([])
  const [loadingAi, setLoadingAi] = useState(false)
  const [aiInsights, setAiInsights] = useState(null)
  const [userClinics, setUserClinics] = useState([])
  const [clinic, setClinic] = useState(null)
  const [dateRange, setDateRange] = useState('7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [lastPeriodPatients, setLastPeriodPatients] = useState([])
  const [overallFeedback, setOverallFeedback] = useState(null)
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
      const stored = typeof window !== 'undefined' ? localStorage.getItem('tokenpe_clinic') : null
      const school = stored ? JSON.parse(stored) : null
      const schoolId = school?.id

      let query = supabase.from('queue_entries').select('*')
      if (schoolId) query = query.eq('business_id', schoolId)
      if (date) query = query.eq('date', date)

      const { data, error } = await query
      if (!error && data) {
        setPatients(data)
      }
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
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
    if (p.joined_at) {
      const h = new Date(p.joined_at).getHours()
      if (h >= 7 && h <= 20) hourlyBuckets[h - 7]++
    }
  })

  const hours = ['7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm']
  const maxH = Math.max(...hourlyBuckets, 1)


  async function fetchAiInsights(data) {
    setLoadingAi(true)
    try {
      const totalPatients = data.length
      const waitTimes = data.filter(p => p.completed_at).map(p => Math.floor((new Date(p.completed_at) - new Date(p.joined_at)) / 60000))
      const avgWaitTime = waitTimes.length ? Math.round(waitTimes.reduce((a,b)=>a+b,0)/waitTimes.length) : 0
      
      // Calculate peak hour
      const hourCounts = {}
      data.forEach(p => {
        if(p.joined_at) {
          const h = new Date(p.joined_at).getHours()
          hourCounts[h] = (hourCounts[h]||0)+1
        }
      })
      let peakHour = 'N/A'
      let maxH = 0
      Object.keys(hourCounts).forEach(h => {
        if(hourCounts[h] > maxH) { maxH = hourCounts[h]; peakHour = h + ':00' }
      })

      const payload = { totalPatients, avgWaitTime, peakHour }
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (result.success) setAiInsights(result.insights)
    } catch(e) {
      console.error(e)
    }
    setLoadingAi(false)
  }

  // Plan-based max allowed lookback (in days)
  function getMaxDays(planId) {
    if (planId === 'starter') return 7
    if (planId === 'pro') return 30
    return 3650 // Elite: ~10 years
  }

  function handleBranchChange(e) {
    const selectedId = e.target.value
    const selected = userClinics.find(c => c.id === selectedId)
    if (!selected) return
    setClinic(selected)
    setPatients([])
    setLastPeriodPatients([])
    setAiInsights(null)
    const range = selected.plan_id === 'starter' ? '7' : '30'
    setDateRange(range)
    fetchAnalytics(selected, range)
  }

  function handleDateChange(e) {
    const val = e.target.value
    if (val === 'custom') {
      setDateRange('custom')
      // Pre-fill with sensible defaults
      const today = getISTDateString(new Date())
      const maxDays = getMaxDays(clinic.plan_id)
      const dAgo = new Date(); dAgo.setDate(dAgo.getDate() - Math.min(7, maxDays))
      setCustomStart(getISTDateString(dAgo))
      setCustomEnd(today)
      return
    }
    if (clinic.plan_id === 'starter' && val !== 'today' && val !== '7') return alert('Upgrade to Pro to view this date range.')
    if (clinic.plan_id === 'pro' && !['today','7','30'].includes(val)) return alert('Upgrade to Elite to view this date range.')
    setDateRange(val)
    fetchAnalytics(clinic, val)
  }

  function applyCustomRange() {
    if (!customStart || !customEnd) return alert('Please select both start and end dates.')
    if (customStart > customEnd) return alert('Start date cannot be after end date.')

    const maxDays = getMaxDays(clinic.plan_id)
    const today = new Date()
    const startD = new Date(customStart)
    const diffDays = Math.ceil((today - startD) / (1000 * 60 * 60 * 24))

    if (diffDays > maxDays) {
      const planName = clinic.plan_id === 'starter' ? 'Starter (7 days)' : 'Pro (30 days)'
      return alert(`Your ${planName} plan allows viewing up to ${maxDays} days of history. Upgrade to unlock more!`)
    }

    fetchAnalytics(clinic, 'custom', customStart, customEnd)
  }

  function exportCSV() {
    if (!patients.length) return alert('No patient data to export.')
    const headers = ['Date', 'Time Joined', 'Token', 'Patient Name', 'Phone', 'Status', 'Wait Time (Mins)']
    const rows = patients.map(p => {
      const waitTime = p.completed_at ? Math.floor((new Date(p.completed_at) - new Date(p.joined_at)) / 60000) : 'N/A'
      return [
        p.date,
        new Date(p.joined_at).toLocaleTimeString('en-IN'),
        p.token,
        `"${p.name || 'Walk-in'}"`,
        p.phone ? maskPhone(p.phone) : '',
        p.status.toUpperCase(),
        waitTime
      ]
    })
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${clinic?.name?.replace(/\s+/g, '_')}_Analytics.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- DATA PROCESSING ---
  const currentTodayStr = getISTDateString(new Date())
  const todayData = patients.filter(p => p.date === currentTodayStr)
  
  // Section 1: Today
  const todayTotal = todayData.length
  const todayCompleted = todayData.filter(p => p.status === 'done').length
  const todaySkipped = todayData.filter(p => p.status === 'skipped').length
  const todayWaitTimes = todayData.filter(p => p.completed_at).map(p => Math.floor((new Date(p.completed_at) - new Date(p.joined_at)) / 60000))
  const todayAvgWait = todayWaitTimes.length ? Math.round(todayWaitTimes.reduce((a,b)=>a+b,0)/todayWaitTimes.length) : 0
  const todayCompletedPct = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0

  // Section 2 & 3: Selected Range
  const rangeTotal = patients.length
  const rangeCompleted = patients.filter(p => p.status === 'done').length
  const rangeSkipped = patients.filter(p => p.status === 'skipped').length
  const rangeWaitTimes = patients.filter(p => p.completed_at).map(p => Math.floor((new Date(p.completed_at) - new Date(p.joined_at)) / 60000))
  const rangeAvgWait = rangeWaitTimes.length ? Math.round(rangeWaitTimes.reduce((a,b)=>a+b,0)/rangeWaitTimes.length) : 0
  
  const phoneCounts = {}
  let walkIns = 0
  let exactAlertsSent = 0
  let exactVoicesGenerated = 0
  
  patients.forEach(p => {
    if(p.phone) phoneCounts[p.phone] = (phoneCounts[p.phone]||0)+1
    if(!p.joined_at || p.is_manual) walkIns++
    
    if (p.phone && !p.is_manual) {
      // 1. Joined
      exactAlertsSent++
      if (clinic?.plan_id !== 'starter') exactVoicesGenerated++
      
      // 2. Called/Done/Skipped (they get a 'Now' or 'Skipped' alert)
      if (['called', 'done', 'skipped'].includes(p.status)) {
        exactAlertsSent++
        if (clinic?.plan_id !== 'starter') exactVoicesGenerated++
      }
      
      // 3. Done
      if (p.status === 'done') {
        exactAlertsSent++
        if (clinic?.plan_id !== 'starter') exactVoicesGenerated++
      }
    }
  })
  const returningCount = Object.values(phoneCounts).filter(c => c > 1).length
  const returningPct = rangeTotal ? Math.round((returningCount / rangeTotal) * 100) : 0
  const newPct = rangeTotal ? 100 - returningPct : 0
  const whatsappCount = rangeTotal - walkIns
  const daysInRange = dateRange === 'today' ? 1 : dateRange === 'custom' ? Math.max(1, Math.ceil((new Date(customEnd) - new Date(customStart)) / (1000 * 60 * 60 * 24)) + 1) : parseInt(dateRange)
  const avgPerDay = Math.round(rangeTotal / daysInRange)

  // Section 4: Heatmap (Mon-Sun, 24 Hours)
  const heatmap = Array(7).fill(0).map(() => Array(24).fill(0))
  let heatmapMax = 0
  patients.forEach(p => {
    if(p.joined_at) {
      const d = new Date(p.joined_at)
      let day = d.getDay() - 1 // Mon=0, Sun=6
      if (day === -1) day = 6
      const hour = d.getHours()
      heatmap[day][hour]++
      if (heatmap[day][hour] > heatmapMax) heatmapMax = heatmap[day][hour]
    }
  })
  const daysOfWeek = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  // Section 5: Language Breakdown
  const langCounts = {}
  patients.forEach(p => {
    const l = p.language || 'en'
    langCounts[l] = (langCounts[l]||0)+1
  })
  const langMap = { hi:'हिंदी', en:'English', mr:'मराठी', gu:'ગુજરાતી', pa:'ਪੰਜਾਬੀ', ta:'தமிழ்', te:'తెలుగు', bn:'বাংলা', kn:'ಕನ್ನಡ', ml:'മലയാളം' }
  const sortedLangs = Object.entries(langCounts).sort((a,b)=>b[1]-a[1])

  // Section 6: Monthly Comparison (only makes sense if > today)
  const lastTotal = lastPeriodPatients.length
  const lastCompleted = lastPeriodPatients.filter(p => p.status === 'done').length
  const lastCompletedPct = lastTotal ? Math.round((lastCompleted / lastTotal) * 100) : 0
  const lastWaitTimes = lastPeriodPatients.filter(p => p.completed_at).map(p => Math.floor((new Date(p.completed_at) - new Date(p.joined_at)) / 60000))
  const lastAvgWait = lastWaitTimes.length ? Math.round(lastWaitTimes.reduce((a,b)=>a+b,0)/lastWaitTimes.length) : 0
  
  const totalChange = lastTotal ? Math.round(((rangeTotal - lastTotal)/lastTotal)*100) : 0

  // Section 7: Feedback
  const ratings = overallFeedback?.ratings || {5:0, 4:0, 3:0, 2:0, 1:0}
  const avgRating = overallFeedback?.avgRating || "0.0"
  const ratingCount = overallFeedback?.ratingCount || 0

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#065F46]">
      <div className="w-10 h-10 border-4 border-white/10 border-t-[#F59E0B] rounded-full animate-spin"></div>
    </div>
  )

  const isStarter = clinic?.plan_id === 'starter'
  const isPro = clinic?.plan_id === 'pro'
  const isElite = clinic?.plan_id === 'elite'

  const LockCard = ({ title, planRequired }) => (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0]">
      <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-sm">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Lock className="w-6 h-6 text-slate-500" /></div>
        <h3 className="text-xl font-bold text-[#065F46] mb-2">Unlock {title}</h3>
        <p className="text-slate-500 mb-6 text-sm">Upgrade to the {planRequired} plan to access advanced analytics and grow your clinic.</p>
        <button onClick={() => router.push('/dashboard/billing')} className="bg-[#10B981] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#059669]">
          Upgrade Now
        </button>
      </div>
    </div>
  )

  const getSnapshotTitle = () => {
    if (dateRange === 'today') return "Today's Snapshot"
    if (dateRange === '7') return "7 Days Snapshot"
    if (dateRange === '30') return "30 Days Snapshot"
    if (dateRange === '90') return "90 Days Snapshot"
    if (dateRange === '180') return "6 Months Snapshot"
    if (dateRange === '365') return "1 Year Snapshot"
    if (dateRange === 'custom') {
      if (!customStart || !customEnd) return "Custom Period Snapshot"
      const formatOpts = { day: '2-digit', month: 'short', year: 'numeric' }
      const s = new Date(customStart).toLocaleDateString('en-IN', formatOpts)
      const e = new Date(customEnd).toLocaleDateString('en-IN', formatOpts)
      return `${s} - ${e} Snapshot`
    }
    return 'Period Snapshot'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(27,42,74,0.08)', padding: isMobile ? '10px 12px' : '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(27,42,74,0.06)' }}>
        <button onClick={() => router.push('/school-dashboard')} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#1B2A4A', fontWeight: 700, fontSize: '0.8rem' }}>
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
                ? lastUpdated ? `Live · last updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Loading...'
                : `Showing history for ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
              }
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 10 }}>
          {/* Date Picker */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0, background: '#FFFFFF', border: '1.5px solid #BFDBFE', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}>
            <div style={{ background: '#EFF6FF', padding: '7px 10px', display: 'flex', alignItems: 'center', borderRight: isMobile ? 'none' : '1px solid #BFDBFE' }}>
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
                minWidth: isMobile ? 30 : 130,
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
        <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '14px 12px' : '28px 20px' }}>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
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
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, overflowX: 'auto' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

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
