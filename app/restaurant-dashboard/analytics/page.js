'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../lovable.css'
import { Lock, Download, Printer, Rocket, Building, Calendar, Trophy, Brain, TrendingUp, ArrowLeft, RefreshCw, BarChart2 } from 'lucide-react'

// ─── PHONE MASKING (Privacy) ────────────────────────────────────────────────
function maskPhone(phone) {
  if (!phone) return ''
  const p = String(phone).replace(/\D/g, '')
  if (p.length <= 4) return '****'
  return p.slice(0, 2) + '****' + p.slice(-4)
}

// Helper to get IST Date
function getISTDateString(date = new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1000
  const istDate = new Date(date.getTime() + istOffset)
  return istDate.toISOString().split('T')[0]
}

function getMaxDays(planId) {
  if (planId === 'starter') return 7
  if (planId === 'pro') return 30
  return 365
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [clinic, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guests, setGuests] = useState([])
  const [lastPeriodGuests, setLastPeriodGuests] = useState([])
  const [overallFeedback, setOverallFeedback] = useState(null)
  const [dateRange, setDateRange] = useState('today') // today, 7, 30, 90, 180, 365, custom
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [userRestaurants, setUserRestaurants] = useState([])

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_business')
      if (!stored) {
        router.push('/restaurant-login')
        return
      }
      const c = JSON.parse(stored)
      setRestaurant(c)

      try {
        const storedRestaurants = localStorage.getItem('tokenpe_user_businesses')
        if (storedRestaurants) setUserRestaurants(JSON.parse(storedRestaurants))
      } catch (e) { }
      
      const defaultRange = c.plan_id === 'starter' ? '7' : '30'
      setDateRange(defaultRange)
      await fetchAnalytics(c, defaultRange)
    }
    load()
  }, [router])

  async function fetchAnalytics(c, range, cStart, cEnd) {
    setLoading(true)

    let cutoffDate, endDate
    let days = 0

    if (range === 'custom' && cStart && cEnd) {
      cutoffDate = cStart
      endDate = cEnd
      days = Math.max(1, Math.ceil((new Date(cEnd) - new Date(cStart)) / (1000 * 60 * 60 * 24)) + 1)
    } else if (range === 'today') {
      cutoffDate = getISTDateString(new Date())
      endDate = cutoffDate
      days = 1
    } else {
      days = parseInt(range)
      const d = new Date()
      d.setDate(d.getDate() - days)
      cutoffDate = getISTDateString(d)
      endDate = getISTDateString(new Date())
    }

    // Fetch this period
    let url = `/api/generic-analytics/get?clinicId=${c.id}&startDate=${cutoffDate}`
    if (range !== 'today') {
      url += `&endDate=${endDate}`
    }
    let thisPeriodData = []
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (data.success) thisPeriodData = data.data || []
      }
    } catch(e) {}

    let lastPeriodData = []
    if (c.plan_id !== 'starter' && range !== 'today') {
      const lEndD = new Date(cutoffDate)
      lEndD.setDate(lEndD.getDate() - 1)
      const lStartD = new Date(lEndD)
      lStartD.setDate(lStartD.getDate() - days)
      
      const lStart = getISTDateString(lStartD)
      const lEnd = getISTDateString(lEndD)
      try {
        const res2 = await fetch(`/api/generic-analytics/get?clinicId=${c.id}&startDate=${lastCutoff}&endDate=${lastEnd}`)
        if (res2.ok) {
          const data2 = await res2.json()
          if (data2.success) lastPeriodData = data2.data || []
        }
      } catch(e) {}
    }

    setGuests(thisPeriodData)
    setLastPeriodGuests(lastPeriodData)
    
    // Fetch overall feedback
    try {
      const resFeedback = await fetch(`/api/generic-analytics/feedback?clinicId=${c.id}`)
      if (resFeedback.ok) {
        const fbData = await resFeedback.json()
        if (fbData.success) setOverallFeedback(fbData.feedback)
      }
    } catch(e) {}
    
    // Fetch AI insights for Elite
    if (c.plan_id === 'elite') {
      fetchAiInsights(thisPeriodData || [])
    }
    
    setLoading(false)
  }

  function handleBranchChange(e) {
    const selectedId = e.target.value
    const selected = userRestaurants.find(c => c.id === selectedId)
    if (!selected) return
    setRestaurant(selected)
    setGuests([])
    setLastPeriodGuests([])
    const range = selected.plan_id === 'starter' ? '7' : '30'
    setDateRange(range)
    fetchAnalytics(selected, range)
  }

  function handleDateChange(e) {
    const val = e.target.value
    if (val === 'custom') {
      setDateRange('custom')
      const today = getISTDateString(new Date())
      const maxDays = getMaxDays(clinic?.plan_id)
      const dAgo = new Date(); dAgo.setDate(dAgo.getDate() - Math.min(7, maxDays))
      setCustomStart(getISTDateString(dAgo))
      setCustomEnd(today)
      return
    }
    if (clinic?.plan_id === 'starter' && val !== 'today' && val !== '7') return alert('Upgrade to Pro to view this date range.')
    if (clinic?.plan_id === 'pro' && !['today','7','30'].includes(val)) return alert('Upgrade to Elite to view this date range.')
    setDateRange(val)
    fetchAnalytics(clinic, val)
  }

  function applyCustomRange() {
    if (!customStart || !customEnd) return alert('Please select both start and end dates.')
    if (customStart > customEnd) return alert('Start date cannot be after end date.')

    const maxDays = getMaxDays(clinic?.plan_id)
    const today = new Date()
    const startD = new Date(customStart)
    const diffDays = Math.ceil((today - startD) / (1000 * 60 * 60 * 24))

    if (diffDays > maxDays) {
      const planName = clinic?.plan_id === 'starter' ? 'Starter (7 days)' : 'Pro (30 days)'
      return alert(`Your ${planName} plan allows viewing up to ${maxDays} days of history. Upgrade to unlock more!`)
    }

    fetchAnalytics(clinic, 'custom', customStart, customEnd)
  }

  function exportCSV() {
    if (!guests.length) return alert('No guest data to export.')
    const headers = ['Date', 'Time Joined', 'Token', 'Guest Name', 'Phone', 'Status', 'Wait Time (Mins)']
    const rows = guests.map(p => {
      const waitTime = p.completed_at ? Math.floor((new Date(p.completed_at) - new Date(p.joined_at)) / 60000) : 'N/A'
      return [
        p.date,
        new Date(p.joined_at).toLocaleTimeString('en-IN'),
        p.token,
        `"${p.name || 'Walk-in'}"`,
        p.phone ? maskPhone(p.phone) : '',
        (p.status || '').toUpperCase(),
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
  const todayStr = getISTDateString(new Date())
  const todayData = guests.filter(p => p.date === todayStr)
  
  const rangeTotal = guests.length
  const rangeCompleted = guests.filter(p => p.status === 'done' || p.status === 'completed').length
  const rangeSkipped = guests.filter(p => p.status === 'skipped').length
  const rangeWaitTimes = guests.filter(p => p.completed_at).map(p => Math.floor((new Date(p.completed_at) - new Date(p.joined_at)) / 60000))
  const rangeAvgWait = rangeWaitTimes.length ? Math.round(rangeWaitTimes.reduce((a,b)=>a+b,0)/rangeWaitTimes.length) : 0
  
  const phoneCounts = {}
  let walkIns = 0
  let exactAlertsSent = 0
  let exactVoicesGenerated = 0
  
  guests.forEach(p => {
    if(p.phone) phoneCounts[p.phone] = (phoneCounts[p.phone]||0)+1
    if(!p.joined_at || p.is_manual) walkIns++
    
    if (p.phone && !p.is_manual) {
      exactAlertsSent++
      if (clinic?.plan_id !== 'starter') exactVoicesGenerated++
      if (['called', 'done', 'completed', 'skipped'].includes(p.status)) {
        exactAlertsSent++
        if (clinic?.plan_id !== 'starter') exactVoicesGenerated++
      }
    }
  })
  const returningCount = Object.values(phoneCounts).filter(c => c > 1).length
  const returningPct = rangeTotal ? Math.round((returningCount / rangeTotal) * 100) : 0
  const newPct = rangeTotal ? 100 - returningPct : 0
  const whatsappCount = rangeTotal - walkIns
  const daysInRange = dateRange === 'today' ? 1 : dateRange === 'custom' ? Math.max(1, Math.ceil((new Date(customEnd) - new Date(customStart)) / (1000 * 60 * 60 * 24)) + 1) : parseInt(dateRange) || 1
  const avgPerDay = Math.round(rangeTotal / daysInRange)

  // Heatmap (Mon-Sun, 24 Hours)
  const heatmap = Array(7).fill(0).map(() => Array(24).fill(0))
  let heatmapMax = 0
  guests.forEach(p => {
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

  // Language Breakdown
  const langCounts = {}
  guests.forEach(p => {
    const l = p.language || 'en'
    langCounts[l] = (langCounts[l]||0)+1
  })
  const langMap = { hi:'हिंदी', en:'English', mr:'मराठी', gu:'ગુજરાતી', pa:'ਪੰਜਾਬੀ', ta:'தமிழ்', te:'తెలుగు', bn:'বাংলা', kn:'<ctrl42><ctrl42><ctrl42> Malayalam' }
  const sortedLangs = Object.entries(langCounts).sort((a,b)=>b[1]-a[1])

  if (loading) return (
    <div className="lovable-root flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-[#3f1515] border-t-[#fbbf24] rounded-full animate-spin"></div>
    </div>
  )

  const isStarter = clinic?.plan_id === 'starter'
  const isPro = clinic?.plan_id === 'pro'
  const isElite = clinic?.plan_id === 'elite'

  const LockCard = ({ title, planRequired }) => (
    <div className="absolute inset-0 bg-[#0f0505]/80 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-2xl p-6 text-center border border-[#3f1515]">
      <div className="w-12 h-12 bg-[#2a0a0a] border border-[#fbbf24]/30 rounded-full flex items-center justify-center mb-3">
        <Lock className="w-6 h-6 text-[#fbbf24]" />
      </div>
      <h3 className="text-lg font-black text-[#f9fafb] mb-1">Unlock {title}</h3>
      <p className="text-xs text-[#a1a1aa] mb-4 max-w-xs">Upgrade to the {planRequired} plan to access advanced analytics & reporting.</p>
      <button onClick={() => router.push('/restaurant-dashboard/billing')} className="lovable-btn-primary">
        Upgrade Now
      </button>
    </div>
  )

  const getSnapshotTitle = () => {
    if (dateRange === 'today') return "Today's Snapshot"
    if (dateRange === '7') return "7 Days Snapshot"
    if (dateRange === '30') return "30 Days Snapshot"
    if (dateRange === '90') return "90 Days Snapshot"
    if (dateRange === '180') return "6 Months Snapshot"
    if (dateRange === '365') return "1 Year Snapshot"
    return "Custom Period Snapshot"
  }

  return (
    <div className="lovable-root">
      
      {/* ── HEADER ── */}
      <header className="lovable-header" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => router.push('/restaurant-dashboard')}
              className="lovable-btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {userRestaurants.length > 1 && (
              <select
                value={clinic?.id || ''}
                onChange={handleBranchChange}
                style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', color: 'var(--foreground)', padding: '8px 14px', borderRadius: 8, fontSize: '0.8rem', outline: 'none' }}
              >
                {userRestaurants.map(uc => (
                  <option key={uc.id} value={uc.id}>{uc.name}</option>
                ))}
              </select>
            )}

            <select 
              value={dateRange} 
              onChange={handleDateChange}
              style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', color: 'var(--foreground)', padding: '8px 14px', borderRadius: 8, fontSize: '0.8rem', outline: 'none', fontWeight: 600 }}
            >
              <option value="today">Today Only</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days {isStarter ? '(Locked)' : ''}</option>
              <option value="90">Last 90 Days {isStarter || isPro ? '(Locked)' : ''}</option>
              <option value="180">Last 6 Months {!isElite ? '(Locked)' : ''}</option>
              <option value="365">Last 1 Year {!isElite ? '(Locked)' : ''}</option>
              <option value="custom">Custom Range</option>
            </select>

            <button
              onClick={() => isStarter ? router.push('/restaurant-dashboard/billing') : exportCSV()}
              className="lovable-btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              {isStarter ? <><Lock className="w-3.5 h-3.5" /> CSV Export</> : <><Download className="w-3.5 h-3.5 text-[#fbbf24]" /> Export CSV</>}
            </button>

            <button
              onClick={() => isStarter ? router.push('/restaurant-dashboard/billing') : window.print()}
              className="lovable-btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              {isStarter ? <><Lock className="w-3.5 h-3.5" /> Print PDF</> : <><Printer className="w-3.5 h-3.5 text-[#fbbf24]" /> Print PDF</>}
            </button>
          </div>
        </div>

        <div className="lovable-supertitle">RESTAURANT | ANALYTICS & REPORTS</div>
        <h1 className="lovable-title">
          {clinic?.name || 'Restaurant'} <span>— Performance Reports</span>
        </h1>
        <div className="lovable-subtitle">
          In-depth queue performance, guest frequency, peak hours heatmap, and language distribution.
        </div>
      </header>

      {/* Custom Date Picker */}
      {dateRange === 'custom' && (
        <div style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>FROM:</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              max={customEnd || getISTDateString(new Date())}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fef3c7', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>TO:</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              min={customStart}
              max={getISTDateString(new Date())}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fef3c7', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <button onClick={applyCustomRange} className="lovable-btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
            Apply Filter
          </button>
        </div>
      )}

      {/* ── STATS ROW ── */}
      <div className="lovable-stats-row">
        <div className="lovable-stat-block">
          <div className="lovable-stat-title"><span>I.</span> TOTAL GUESTS</div>
          <div className="lovable-stat-value">{rangeTotal}</div>
          <div className="lovable-stat-sub">{getSnapshotTitle()}</div>
        </div>

        <div className="lovable-stat-block">
          <div className="lovable-stat-title"><span>II.</span> AVG WAIT TIME</div>
          <div className="lovable-stat-value" style={{ color: 'var(--gold)' }}>{rangeAvgWait}<span style={{ fontSize: '1.2rem', marginLeft: 4 }}>min</span></div>
          <div className="lovable-stat-sub">per cover average</div>
        </div>

        <div className="lovable-stat-block">
          <div className="lovable-stat-title"><span>III.</span> COMPLETION RATE</div>
          <div className="lovable-stat-value" style={{ color: '#10b981' }}>{rangeTotal ? Math.round((rangeCompleted / rangeTotal) * 100) : 0}%</div>
          <div className="lovable-stat-sub">{rangeCompleted} tables completed</div>
        </div>

        <div className="lovable-stat-block">
          <div className="lovable-stat-title"><span>IV.</span> SKIPPED</div>
          <div className="lovable-stat-value" style={{ color: '#ef4444' }}>{rangeSkipped}</div>
          <div className="lovable-stat-sub">unresponsive covers</div>
        </div>
      </div>

      {/* ── INSIGHTS & PERFORMANCE GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 28 }}>
        
        {/* Guest Insights */}
        <div style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 20 }}>Guest Frequency</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--muted)' }}>Total Covers</span>
              <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{rangeTotal}</span>
            </div>

            <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.4)', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${returningPct}%`, background: 'var(--gold)' }} />
              <div style={{ width: `${newPct}%`, background: '#38bdf8' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                <span>Returning ({returningPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                <span>New ({newPct}%)</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', pt: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>WhatsApp QR Joins</span>
                <span style={{ fontWeight: 700 }}>{whatsappCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Walk-in Manual Entries</span>
                <span style={{ fontWeight: 700 }}>{walkIns}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Avg Guests / Day</span>
                <span style={{ fontWeight: 700 }}>{avgPerDay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Performance */}
        <div style={{ position: 'relative', background: 'var(--wine-deep)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>
          {isStarter && <LockCard title="Advanced Queue Performance" planRequired="Pro" />}
          <div className={isStarter ? 'blur-sm select-none' : ''}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 20 }}>Queue Efficiency</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Average Wait Duration</span>
                <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{rangeAvgWait} mins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Completed vs Skipped</span>
                <span style={{ fontWeight: 700 }}><span style={{ color: '#10b981' }}>{rangeCompleted}</span> / <span style={{ color: '#ef4444' }}>{rangeSkipped}</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>WhatsApp SMS Alerts Sent</span>
                <span style={{ fontWeight: 700 }}>{exactAlertsSent}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>AI Voice Alerts Triggered</span>
                <span style={{ fontWeight: 700 }}>{exactVoicesGenerated}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', pt: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)' }}>Peak Hourly Volume</span>
                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)' }}>{heatmapMax} covers</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── HEATMAP SECTION ── */}
      <div style={{ position: 'relative', background: 'var(--wine-deep)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>
        {isStarter && <LockCard title="Busy Hour Heatmap" planRequired="Pro" />}
        <div className={isStarter ? 'blur-sm select-none' : ''}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 16 }}>Busy Hour Heatmap (Day × Hour)</h2>
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ minWidth: 750 }}>
              <div style={{ display: 'flex', marginBottom: 6 }}>
                <div style={{ width: 44 }} />
                {Array(24).fill(0).map((_,i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)' }}>
                    {i === 0 ? '12a' : i < 12 ? i+'a' : i === 12 ? '12p' : (i-12)+'p'}
                  </div>
                ))}
              </div>
              {daysOfWeek.map((day, dIdx) => (
                <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 4 }}>
                  <div style={{ width: 44, fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)' }}>{day}</div>
                  {heatmap[dIdx].map((count, hIdx) => {
                    let bg = 'rgba(0,0,0,0.3)'
                    if (heatmapMax > 0 && count > 0) {
                      const ratio = count / Math.max(heatmapMax, 5)
                      if (ratio >= 0.75) bg = '#ef4444' // Heavy peak (red)
                      else if (ratio >= 0.4) bg = '#f59e0b' // Medium (amber)
                      else bg = 'rgba(212, 163, 115, 0.4)' // Light (gold)
                    }
                    return (
                      <div 
                        key={hIdx} 
                        style={{ flex: 1, height: 26, borderRadius: 4, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: count > 0 ? '#fff' : 'transparent' }}
                        title={`${day} ${hIdx}:00 — ${count} guests`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
