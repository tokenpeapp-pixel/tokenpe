'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

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

export default function AnalyticsPage() {
  const router = useRouter()
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [lastPeriodPatients, setLastPeriodPatients] = useState([])
  const [dateRange, setDateRange] = useState('today') // today, 7, 30, 90, 180, 365, custom
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [aiInsights, setAiInsights] = useState(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [userClinics, setUserClinics] = useState([])

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) {
        router.push('/login')
        return
      }
      const c = JSON.parse(stored)
      setClinic(c)

      // Load all branches for the branch selector
      try {
        const storedClinics = localStorage.getItem('tokenpe_user_clinics')
        if (storedClinics) setUserClinics(JSON.parse(storedClinics))
      } catch (e) { /* ignore */ }
      
      // Default date range
      if (c.plan_id === 'starter') setDateRange('7')
      else if (c.plan_id === 'pro') setDateRange('30')
      else setDateRange('30') // Elite default to 30

      await fetchAnalytics(c, c.plan_id === 'starter' ? '7' : '30')
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
    let query = supabase.from('patients').select('*').eq('clinic_id', c.id).limit(100000)
    if (range === 'today') {
      query = query.eq('date', cutoffDate)
    } else {
      query = query.gte('date', cutoffDate).lte('date', endDate)
    }

    const { data: thisPeriodData } = await query

    // Fetch last period (for comparison)
    let lastPeriodData = []
    if (c.plan_id !== 'starter' && range !== 'today') {
      const prevEnd = new Date(cutoffDate)
      prevEnd.setDate(prevEnd.getDate() - 1)
      const prevStart = new Date(prevEnd)
      prevStart.setDate(prevStart.getDate() - days + 1)
      const lastCutoff = getISTDateString(prevStart)
      const lastEnd = getISTDateString(prevEnd)

      const { data } = await supabase.from('patients')
        .select('*')
        .eq('clinic_id', c.id)
        .gte('date', lastCutoff)
        .lte('date', lastEnd)
        .limit(100000)
      lastPeriodData = data || []
    }

    setPatients(thisPeriodData || [])
    setLastPeriodPatients(lastPeriodData)
    
    // Fetch AI insights for Elite
    if (c.plan_id === 'elite') {
      fetchAiInsights(thisPeriodData || [])
    }
    
    setLoading(false)
  }

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
  const todayStr = getISTDateString(new Date())
  const todayData = patients.filter(p => p.date === todayStr)
  
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

  // Section 4: Heatmap (Mon-Sun, 8AM-8PM)
  const heatmap = Array(7).fill(0).map(() => Array(13).fill(0))
  let heatmapMax = 0
  patients.forEach(p => {
    if(p.joined_at) {
      const d = new Date(p.joined_at)
      let day = d.getDay() - 1 // Mon=0, Sun=6
      if (day === -1) day = 6
      const hour = d.getHours()
      if (hour >= 8 && hour <= 20) {
        heatmap[day][hour-8]++
        if (heatmap[day][hour-8] > heatmapMax) heatmapMax = heatmap[day][hour-8]
      }
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
  const ratings = {5:0, 4:0, 3:0, 2:0, 1:0}
  let totalRating = 0
  let ratingCount = 0
  patients.forEach(p => {
    if(p.rating > 0) {
      ratings[p.rating] = (ratings[p.rating]||0)+1
      totalRating += p.rating
      ratingCount++
    }
  })
  const avgRating = ratingCount ? (totalRating/ratingCount).toFixed(1) : 0

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0F172A]">
      <div className="w-10 h-10 border-4 border-white/10 border-t-[#F59E0B] rounded-full animate-spin"></div>
    </div>
  )

  const isStarter = clinic?.plan_id === 'starter'
  const isPro = clinic?.plan_id === 'pro'
  const isElite = clinic?.plan_id === 'elite'

  const LockCard = ({ title, planRequired }) => (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0]">
      <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-sm">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">🔒</div>
        <h3 className="text-xl font-bold text-[#0F172A] mb-2">Unlock {title}</h3>
        <p className="text-slate-500 mb-6 text-sm">Upgrade to the {planRequired} plan to access advanced analytics and grow your clinic.</p>
        <button onClick={() => router.push('/dashboard/billing')} className="bg-[#10B981] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#059669]">
          Upgrade Now
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .shadow-sm, .shadow-xl { box-shadow: none !important; border: 1px solid #E2E8F0 !important; }
          .bg-white { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      
      {/* HEADER */}
      <div className="bg-[#0F172A] text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">←</button>
          <div>
            <div className="text-xs text-[#94A3B8] font-bold tracking-widest uppercase mb-1">Analytics Dashboard</div>
            <div className="text-2xl font-black">{clinic?.name}</div>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            {userClinics.length > 1 && (
              <select
                value={clinic?.id || ''}
                onChange={handleBranchChange}
                className="bg-[#7C3AED] border border-[#6D28D9] text-white px-4 py-2.5 rounded-xl font-semibold outline-none"
              >
                {userClinics.map(uc => (
                  <option key={uc.id} value={uc.id}>🏥 {uc.name}</option>
                ))}
              </select>
            )}
            <select 
              value={dateRange} 
              onChange={handleDateChange}
              className="bg-[#1E293B] border border-[#334155] text-white px-4 py-2.5 rounded-xl font-semibold outline-none"
            >
              <option value="today">Today Only</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days {isStarter ? '🔒' : ''}</option>
              <option value="90">Last 90 Days {isStarter || isPro ? '🔒' : ''}</option>
              <option value="180">Last 6 Months {!isElite ? '🔒' : ''}</option>
              <option value="365">Last 1 Year {!isElite ? '🔒' : ''}</option>
              <option value="custom">📅 Custom Range</option>
            </select>
            <button
              onClick={() => isStarter ? router.push('/dashboard/billing') : exportCSV()}
              className={`px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 ${isStarter ? 'bg-[#1E293B] text-[#94A3B8] cursor-not-allowed' : 'bg-[#10B981] text-white hover:bg-[#059669]'}`}
            >
              {isStarter ? '🔒 CSV Export' : '📥 CSV'}
            </button>
            <button
              onClick={() => isStarter ? router.push('/dashboard/billing') : window.print()}
              className={`px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 ${isStarter ? 'bg-[#1E293B] text-[#94A3B8] cursor-not-allowed' : 'bg-[#F59E0B] text-white hover:bg-[#D97706]'}`}
            >
              {isStarter ? '🔒 PDF Report' : '📄 PDF'}
            </button>
          </div>

          {/* Custom Date Range Picker */}
          {dateRange === 'custom' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#1E293B] border border-[#334155] p-3 rounded-xl">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[#94A3B8] text-xs font-bold whitespace-nowrap">FROM</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  max={customEnd || getISTDateString(new Date())}
                  min={(() => { const d = new Date(); d.setDate(d.getDate() - getMaxDays(clinic?.plan_id)); return getISTDateString(d) })()}
                  className="bg-[#0F172A] border border-[#475569] text-white px-3 py-2 rounded-lg text-sm font-semibold outline-none flex-1 min-w-0"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[#94A3B8] text-xs font-bold whitespace-nowrap">TO</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  min={customStart}
                  max={getISTDateString(new Date())}
                  className="bg-[#0F172A] border border-[#475569] text-white px-3 py-2 rounded-lg text-sm font-semibold outline-none flex-1 min-w-0"
                />
              </div>
              <button
                onClick={applyCustomRange}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2 rounded-lg font-bold text-sm whitespace-nowrap"
              >
                Apply ✓
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* PRINT HEADER ONLY */}
        <div className="hidden print:block mb-8 border-b-2 border-[#E2E8F0] pb-4">
          <h1 className="text-3xl font-black text-[#0F172A]">{clinic?.name}</h1>
          <p className="text-[#64748B] font-semibold">Analytics Report • Generated {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        {/* SEC 1: TODAY SNAPSHOT */}
        <div>
          <h2 className="text-xl font-black text-[#0F172A] mb-4">Today's Snapshot</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#F1F5F9] hover-card">
              <div className="text-[#64748B] text-xs font-bold uppercase tracking-wide mb-2">Patients Today</div>
              <div className="text-3xl font-black text-[#0F172A]">{todayTotal}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#F1F5F9] hover-card">
              <div className="text-[#64748B] text-xs font-bold uppercase tracking-wide mb-2">Avg Wait Time</div>
              <div className="text-3xl font-black text-[#F59E0B]">{todayAvgWait}<span className="text-sm font-medium text-[#94A3B8] ml-1">min</span></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#F1F5F9] hover-card">
              <div className="text-[#64748B] text-xs font-bold uppercase tracking-wide mb-2">Completed</div>
              <div className="text-3xl font-black text-[#10B981]">{todayCompletedPct}%</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#F1F5F9] hover-card">
              <div className="text-[#64748B] text-xs font-bold uppercase tracking-wide mb-2">Skipped</div>
              <div className="text-3xl font-black text-[#EF4444]">{todaySkipped}</div>
            </div>
          </div>
        </div>

        {/* SEC 2 & 3: INSIGHTS & PERFORMANCE */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] hover-card">
            <h2 className="text-lg font-black text-[#0F172A] mb-6">Patient Insights</h2>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-semibold">Total Patients</span>
                <span className="font-bold text-lg">{rangeTotal}</span>
              </div>
              <div className="w-full bg-[#F1F5F9] h-3 rounded-full overflow-hidden flex">
                <div style={{width: `${returningPct}%`}} className="bg-[#7C3AED] h-full"></div>
                <div style={{width: `${newPct}%`}} className="bg-[#38BDF8] h-full"></div>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#7C3AED]"></div><span className="font-semibold text-[#0F172A]">Returning ({returningPct}%)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#38BDF8]"></div><span className="font-semibold text-[#0F172A]">New ({newPct}%)</span></div>
              </div>
              <div className="pt-4 border-t border-[#F1F5F9] flex justify-between items-center">
                <span className="text-[#64748B] font-semibold">WhatsApp Joins</span>
                <span className="font-bold">{whatsappCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-semibold">Walk-ins</span>
                <span className="font-bold">{walkIns}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-semibold">Avg Patients/Day</span>
                <span className="font-bold">{avgPerDay}</span>
              </div>
            </div>
          </div>

          <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden hover-card">
            {isStarter && <LockCard title="Advanced Queue Analytics" planRequired="Pro" />}
            <div className={isStarter ? 'blur-sm select-none' : ''}>
              <h2 className="text-lg font-black text-[#0F172A] mb-6">Queue Performance</h2>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-semibold">Average Wait</span>
                <span className="font-bold text-[#F59E0B]">{rangeAvgWait} mins</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-semibold">Completed vs Skipped</span>
                <span className="font-bold text-[#10B981]">{rangeCompleted} <span className="text-[#94A3B8]">/</span> <span className="text-[#EF4444]">{rangeSkipped}</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-semibold">WhatsApp Alerts Sent</span>
                <span className="font-bold">{exactAlertsSent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-semibold">Voice Notes Generated</span>
                <span className="font-bold">{exactVoicesGenerated}</span>
              </div>
              <div className="pt-4 border-t border-[#F1F5F9] flex justify-between items-center">
                <span className="text-[#64748B] font-semibold">Peak Queue Size</span>
                <span className="font-bold text-xl">{heatmapMax}</span>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* SEC 4: HEATMAP */}
        <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden hover-card">
          {isStarter && <LockCard title="Busy Hour Heatmap" planRequired="Pro" />}
          <div className={isStarter ? 'blur-sm select-none' : ''}>
            <h2 className="text-lg font-black text-[#0F172A] mb-6">Busy Hour Heatmap</h2>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex mb-2">
                  <div className="w-12"></div>
                  {Array(13).fill(0).map((_,i) => (
                    <div key={i} className="flex-1 text-center text-xs font-bold text-[#94A3B8]">
                      {(i+8)%12||12}{i+8>=12?'p':'a'}
                    </div>
                  ))}
                </div>
                {daysOfWeek.map((day, dIdx) => (
                  <div key={day} className="flex items-center mb-1 gap-1">
                    <div className="w-12 text-xs font-bold text-[#64748B]">{day}</div>
                    {heatmap[dIdx].map((count, hIdx) => {
                      let opacity = 0.05
                      if (heatmapMax > 0 && count > 0) {
                        opacity = Math.max(0.15, count / heatmapMax)
                      }
                      return (
                        <div 
                          key={hIdx} 
                          title={`${count} patients`}
                          className="flex-1 h-8 rounded-sm transition-all hover:ring-2 hover:ring-[#0F172A]"
                          style={{ backgroundColor: count === 0 ? '#F1F5F9' : `rgba(16, 185, 129, ${opacity})` }}
                        ></div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEC 5 & 6 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden hover-card">
            {isStarter && <LockCard title="Language Analytics" planRequired="Pro" />}
            <div className={isStarter ? 'blur-sm select-none' : ''}>
              <h2 className="text-lg font-black text-[#0F172A] mb-6">Language Breakdown</h2>
              <div className="space-y-4">
                {sortedLangs.slice(0,5).map(([code, count]) => (
                  <div key={code}>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span>{langMap[code] || code}</span>
                      <span>{Math.round((count/rangeTotal)*100)}%</span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-2 rounded-full">
                      <div className="bg-[#7C3AED] h-full rounded-full" style={{width: `${(count/rangeTotal)*100}%`}}></div>
                    </div>
                  </div>
                ))}
                {sortedLangs.length === 0 && <div className="text-[#94A3B8] text-sm italic">No language data available.</div>}
              </div>
            </div>
          </div>

          <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden hover-card">
            {isStarter && <LockCard title="Monthly Comparison" planRequired="Pro" />}
            <div className={isStarter ? 'blur-sm select-none' : ''}>
              <h2 className="text-lg font-black text-[#0F172A] mb-6">Period Comparison</h2>
              {totalChange > 0 ? (
                <div className="bg-[#ECFDF5] text-[#065F46] p-3 rounded-xl text-sm font-bold mb-4 flex items-center gap-2">
                  <span>📈</span> Your clinic grew {totalChange}% this period!
                </div>
              ) : (
                <div className="bg-[#F8FAFC] text-[#64748B] p-3 rounded-xl text-sm font-bold mb-4">
                  Compare this period vs previous period
                </div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#94A3B8] border-b border-[#F1F5F9]">
                    <th className="pb-2 font-semibold">Metric</th>
                    <th className="pb-2 font-semibold text-right">Current</th>
                    <th className="pb-2 font-semibold text-right">Previous</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-[#0F172A]">
                  <tr className="border-b border-[#F1F5F9]">
                    <td className="py-3 text-[#64748B]">Total Patients</td>
                    <td className="py-3 text-right">{rangeTotal}</td>
                    <td className="py-3 text-right">{lastTotal}</td>
                  </tr>
                  <tr className="border-b border-[#F1F5F9]">
                    <td className="py-3 text-[#64748B]">Completed %</td>
                    <td className="py-3 text-right">{rangeTotal ? Math.round((rangeCompleted/rangeTotal)*100) : 0}%</td>
                    <td className="py-3 text-right">{lastCompletedPct}%</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#64748B]">Avg Wait Time</td>
                    <td className="py-3 text-right">{rangeAvgWait}m</td>
                    <td className="py-3 text-right">{lastAvgWait}m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SEC 7: FEEDBACK */}
        <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden hover-card">
          {!isElite && <LockCard title="Patient Feedback" planRequired="Elite" />}
          <div className={!isElite ? 'blur-sm select-none' : ''}>
            <h2 className="text-lg font-black text-[#0F172A] mb-6">Patient Feedback Summary</h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="text-center">
                <div className="text-6xl font-black text-[#F59E0B]">{avgRating}</div>
                <div className="flex gap-1 text-[#F59E0B] my-2 text-xl justify-center">
                  {'★★★★★'.split('').map((s,i) => <span key={i} className={i < Math.round(avgRating) ? '' : 'text-gray-200'}>{s}</span>)}
                </div>
                <div className="text-[#64748B] text-sm font-semibold">{ratingCount} reviews</div>
              </div>
              <div className="flex-1 w-full space-y-2">
                {[5,4,3,2,1].map(star => (
                  <div key={star} className="flex items-center gap-3 text-sm font-semibold">
                    <span className="w-12 text-[#64748B]">{star} stars</span>
                    <div className="flex-1 bg-[#F1F5F9] h-2 rounded-full">
                      <div className="bg-[#F59E0B] h-full rounded-full" style={{width: `${ratingCount ? (ratings[star]/ratingCount)*100 : 0}%`}}></div>
                    </div>
                    <span className="w-8 text-right text-[#0F172A]">{ratingCount ? Math.round((ratings[star]/ratingCount)*100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEC 8: AI INSIGHTS */}
        <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-1 rounded-2xl shadow-xl overflow-hidden hover-card">
          {!isElite && <LockCard title="Smart AI Insights" planRequired="Elite" />}
          <div className={`bg-[#0F172A] rounded-xl p-6 ${!isElite ? 'blur-sm select-none' : ''}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🧠</span>
              <h2 className="text-xl font-black text-white">TokenPe AI Insights</h2>
            </div>
            {loadingAi ? (
              <div className="text-[#94A3B8] font-semibold animate-pulse">Generating insights using Claude AI...</div>
            ) : aiInsights ? (
              <div className="grid md:grid-cols-3 gap-4">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-xl backdrop-blur-md">
                    <div className="text-2xl mb-3">{insight.icon}</div>
                    <p className="text-white text-sm font-semibold leading-relaxed">{insight.insight}</p>
                    <div className={`mt-4 text-xs font-bold uppercase tracking-wider ${insight.type==='positive'?'text-[#10B981]':insight.type==='warning'?'text-[#F59E0B]':'text-[#38BDF8]'}`}>
                      {insight.type}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[#94A3B8] font-semibold">Not enough data to generate insights yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
