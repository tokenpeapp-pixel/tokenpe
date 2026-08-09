'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Lock, Download, Printer, Rocket, Building, Calendar, Trophy, Brain, TrendingUp, Users, Clock, Repeat, UserPlus, MessageCircle, Footprints, CheckCircle2, Bell, Mic, UsersRound, Sparkles, AlertTriangle, Lightbulb, Zap, LayoutDashboard, Layers, History, BarChart2, Megaphone, CreditCard, HelpCircle, User } from 'lucide-react'

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
  const [overallFeedback, setOverallFeedback] = useState(null)
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
        router.push('/business-login')
        return
      }
      let c = JSON.parse(stored)

      // Fetch fresh clinic details from Supabase if available
      try {
        const { data: freshClinic } = await supabase.from('clinics').select('*').eq('id', c.id).single()
        if (freshClinic) {
          c = { ...c, ...freshClinic }
          localStorage.setItem('tokenpe_clinic', JSON.stringify(c))
        }
      } catch (e) {}

      setClinic(c)

      // Load all branches for the branch selector
      try {
        const storedClinics = localStorage.getItem('tokenpe_user_businesses')
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

    const targetClinic = c.id || c.business_id
    const preset = range === 'custom' ? 'custom' : range

    let thisPeriodData = []
    try {
      const res = await fetch(`/api/dashboard/history?clinicId=${targetClinic || ''}&preset=${preset || '30'}&customStart=${cStart || ''}&customEnd=${cEnd || ''}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.patients)) {
          thisPeriodData = data.patients
        }
      }
    } catch(e) {}

    // Fallback: If selected date range returned 0 patients, fetch all patients for clinic so completed patients are never lost
    if ((!thisPeriodData || thisPeriodData.length === 0) && range !== 'custom') {
      try {
        const resFb = await fetch(`/api/dashboard/history?clinicId=${targetClinic || ''}&preset=365`)
        if (resFb.ok) {
          const dataFb = await resFb.json()
          if (dataFb.success && Array.isArray(dataFb.patients) && dataFb.patients.length > 0) {
            thisPeriodData = dataFb.patients
          }
        }
      } catch (e) {}
    }

    // Direct Supabase fallback for null clinic_id / unlinked entries
    if (!thisPeriodData || thisPeriodData.length === 0) {
      try {
        const { data: dbPatients } = await supabase
          .from('patients')
          .select('*')
          .or(`clinic_id.eq.${targetClinic},clinic_id.is.null`)
          .order('joined_at', { ascending: false })
        if (dbPatients && dbPatients.length > 0) {
          thisPeriodData = dbPatients
        }
      } catch (e) {}
    }

    // Fetch last period comparison data
    let lastPeriodData = []
    if (c.plan_id !== 'starter' && range !== 'today') {
      try {
        const res2 = await fetch(`/api/dashboard/history?clinicId=${targetClinic || ''}&preset=365`)
        if (res2.ok) {
          const data2 = await res2.json()
          if (data2.success && Array.isArray(data2.patients)) {
            lastPeriodData = data2.patients
          }
        }
      } catch(e) {}
    }

    setPatients(thisPeriodData || [])
    setLastPeriodPatients(lastPeriodData || [])

    // Fetch overall feedback
    try {
      const resFeedback = await fetch(`/api/analytics/feedback?clinicId=${targetClinic}`)
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
  const todayCompleted = todayData.filter(p => p.status === 'done' || p.status === 'completed').length
  const todaySkipped = todayData.filter(p => p.status === 'skipped' || p.status === 'cancelled').length
  const todayWaitTimes = todayData
    .filter(p => (p.status === 'done' || p.status === 'completed'))
    .map(p => {
      const endT = p.completed_at || p.updated_at
      const startT = p.joined_at || p.created_at
      if (endT && startT) {
        const diff = Math.floor((new Date(endT) - new Date(startT)) / 60000)
        return diff > 0 ? diff : 0
      }
      return 0
    })
    .filter(w => w > 0)
  const todayAvgWait = todayWaitTimes.length ? Math.round(todayWaitTimes.reduce((a,b)=>a+b,0)/todayWaitTimes.length) : 0
  const todayCompletedPct = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0

  // Section 2 & 3: Selected Range
  const rangeTotal = patients.length
  const rangeCompleted = patients.filter(p => p.status === 'done' || p.status === 'completed').length
  const rangeSkipped = patients.filter(p => p.status === 'skipped' || p.status === 'cancelled').length
  const rangeWaitTimes = patients
    .filter(p => (p.status === 'done' || p.status === 'completed'))
    .map(p => {
      const endT = p.completed_at || p.updated_at
      const startT = p.joined_at || p.created_at
      if (endT && startT) {
        const diff = Math.floor((new Date(endT) - new Date(startT)) / 60000)
        return diff > 0 ? diff : 0
      }
      return 0
    })
    .filter(w => w > 0)
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

  // Section 6: Period Comparison (Today vs Yesterday / This Week vs Last Week / This Month vs Last Month)
  const yD = new Date()
  yD.setDate(yD.getDate() - 1)
  const yesterdayStr = getISTDateString(yD)

  const d7Date = new Date()
  d7Date.setDate(d7Date.getDate() - 7)
  const d7Str = getISTDateString(d7Date)

  const d14Date = new Date()
  d14Date.setDate(d14Date.getDate() - 14)
  const d14Str = getISTDateString(d14Date)

  const d30Date = new Date()
  d30Date.setDate(d30Date.getDate() - 30)
  const d30Str = getISTDateString(d30Date)

  const d60Date = new Date()
  d60Date.setDate(d60Date.getDate() - 60)
  const d60Str = getISTDateString(d60Date)

  let compCurrentPatients = []
  let compPrevPatients = []

  if (dateRange === 'today') {
    compCurrentPatients = patients.filter(p => p.date === todayStr)
    compPrevPatients = patients.filter(p => p.date === yesterdayStr)
  } else if (dateRange === '7') {
    compCurrentPatients = patients.filter(p => p.date >= d7Str)
    compPrevPatients = patients.filter(p => p.date < d7Str && p.date >= d14Str)
  } else if (dateRange === '30') {
    compCurrentPatients = patients.filter(p => p.date >= d30Str)
    compPrevPatients = patients.filter(p => p.date < d30Str && p.date >= d60Str)
  } else {
    compCurrentPatients = patients
    compPrevPatients = lastPeriodPatients.length ? lastPeriodPatients : []
  }

  // 1. Total Patients
  const currTotal = compCurrentPatients.length
  const prevTotal = compPrevPatients.length

  // 2. Completed %
  const currCompleted = compCurrentPatients.filter(p => p.status === 'done' || p.status === 'completed').length
  const currCompletedPct = currTotal ? Math.round((currCompleted / currTotal) * 100) : 0
  const prevCompleted = compPrevPatients.filter(p => p.status === 'done' || p.status === 'completed').length
  const prevCompletedPct = prevTotal ? Math.round((prevCompleted / prevTotal) * 100) : 0

  // 3. Avg Wait Time
  const currWaitTimes = compCurrentPatients
    .filter(p => p.status === 'done' || p.status === 'completed')
    .map(p => {
      const endT = p.completed_at || p.updated_at
      const startT = p.joined_at || p.created_at
      if (endT && startT) {
        const diff = Math.floor((new Date(endT) - new Date(startT)) / 60000)
        return diff > 0 ? diff : 0
      }
      return 0
    })
    .filter(w => w > 0)
  const currAvgWait = currWaitTimes.length ? Math.round(currWaitTimes.reduce((a,b)=>a+b,0)/currWaitTimes.length) : 0

  const prevWaitTimes = compPrevPatients
    .filter(p => p.status === 'done' || p.status === 'completed')
    .map(p => {
      const endT = p.completed_at || p.updated_at
      const startT = p.joined_at || p.created_at
      if (endT && startT) {
        const diff = Math.floor((new Date(endT) - new Date(startT)) / 60000)
        return diff > 0 ? diff : 0
      }
      return 0
    })
    .filter(w => w > 0)
  const prevAvgWait = prevWaitTimes.length ? Math.round(prevWaitTimes.reduce((a,b)=>a+b,0)/prevWaitTimes.length) : 0

  // 4. Skipped
  const currSkipped = compCurrentPatients.filter(p => p.status === 'skipped' || p.status === 'cancelled').length
  const prevSkipped = compPrevPatients.filter(p => p.status === 'skipped' || p.status === 'cancelled').length

  const getComparisonHeader = () => {
    if (dateRange === 'today') return { title: 'Today vs Yesterday', desc: 'Compare today’s consultation stats with yesterday', colCurr: 'TODAY', colPrev: 'YESTERDAY' }
    if (dateRange === '7') return { title: 'This Week vs Last Week', desc: 'Compare the last 7 days vs prior 7 days', colCurr: 'THIS WEEK', colPrev: 'PREV WEEK' }
    if (dateRange === '30') return { title: 'This Month vs Last Month', desc: 'Compare the last 30 days vs prior 30 days', colCurr: 'THIS MONTH', colPrev: 'PREV MONTH' }
    return { title: 'Period Comparison', desc: 'Compare this period vs previous period', colCurr: 'CURRENT', colPrev: 'PREVIOUS' }
  }

  const lastTotal = prevTotal
  const lastCompletedPct = prevCompletedPct
  const lastAvgWait = prevAvgWait
  const diffTotalPct = prevTotal > 0 ? Math.round(((currTotal - prevTotal) / prevTotal) * 100) : null
  const diffWaitTime = prevAvgWait > 0 ? currAvgWait - prevAvgWait : null
  const diffCompletedPct = prevTotal > 0 ? currCompletedPct - prevCompletedPct : null
  const diffSkippedVal = prevTotal > 0 ? currSkipped - prevSkipped : null

  // Section 7: Feedback
  const ratings = overallFeedback?.ratings || {5:0, 4:0, 3:0, 2:0, 1:0}
  const avgRating = overallFeedback?.avgRating || "0.0"
  const ratingCount = overallFeedback?.ratingCount || 0

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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: '#F2F7F2', overflowX: 'hidden' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Inter:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          background-color: #F2F7F2 !important;
          color: #1A2E22 !important;
        }

        .analytics-card {
          background: #FFFFFF;
          border: 1px solid #E1EBE2;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(6, 78, 59, 0.03);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .analytics-card:hover {
          box-shadow: 0 8px 24px rgba(6, 78, 59, 0.06);
          border-color: #C3DBC7;
        }

        .range-tab-btn {
          padding: 7px 16px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #718E7A;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .range-tab-btn:hover {
          color: #2D6A4F;
          background: rgba(132, 176, 103, 0.1);
        }
        .range-tab-btn.active {
          background: #84B067;
          color: #FFFFFF;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(132, 176, 103, 0.3);
        }

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

        @media print {
          body { background: white !important; }
          .no-print, .dashboard-sidebar { display: none !important; }
          .shadow-sm, .shadow-xl { box-shadow: none !important; border: 1px solid #E2E8F0 !important; }
          .bg-white { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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
                { label: 'Analytics & Reports', desc: 'Track peak OPD hours, average wait times, reason breakdowns, and patient-wise statistics.', icon: <BarChart2 className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {}, active: true },
                { label: 'Broadcasting & CRM', desc: 'Send bulk WhatsApp alerts & manage patient relationships', icon: <Megaphone className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/crm') },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`sidebar-btn${item.active ? ' active' : ''}`}
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
              >
                {item.icon}
                <span className="sb-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-screen pb-20 font-sans overflow-y-auto">
        {/* HEADER */}
        <div style={{ padding: '32px 32px 16px' }}>
          {/* Top Row: Subtitle + Title + Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#84B067', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {(clinic?.name || clinic?.business_name || 'TokenPe Clinic').toUpperCase()} · {(clinic?.location || clinic?.city || clinic?.address || 'Bengaluru').toUpperCase()}
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F291B', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
                Analytics Dashboard
              </h1>
              <p style={{ fontSize: '0.84rem', color: '#718E7A', margin: '4px 0 0', fontWeight: 500 }}>
                Queue performance, patient mix and AI-generated observations.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => isStarter ? router.push('/dashboard/billing') : exportCSV()}
                style={{ background: '#FFFFFF', color: '#2D6A4F', border: '1px solid #D8E5DA', padding: '7px 16px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}
              >
                <Download className="w-3.5 h-3.5 text-[#2D6A4F]" /> CSV
              </button>

              <button
                onClick={() => isStarter ? router.push('/dashboard/billing') : window.print()}
                style={{ background: '#FFFFFF', color: '#2D6A4F', border: '1px solid #D8E5DA', padding: '7px 16px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}
              >
                <Printer className="w-3.5 h-3.5 text-[#2D6A4F]" /> PDF
              </button>
            </div>
          </div>

          {/* Bottom Row: Range Tab Pills Bar */}
          <div style={{ background: '#FFFFFF', borderRadius: 28, padding: '5px 8px', border: '1px solid #E1EBE2', display: 'flex', alignItems: 'center', gap: 4, width: '100%', overflowX: 'auto', boxShadow: '0 2px 10px rgba(6,78,59,0.02)' }}>
            {[
              { id: 'today', label: 'Today Only' },
              { id: '7', label: 'Last 7 Days' },
              { id: '30', label: 'Last 30 Days' },
              { id: '90', label: 'Last 90 Days' },
              { id: '180', label: 'Last 6 Months' },
              { id: '365', label: 'Last 1 Year' },
              { id: 'custom', label: 'Custom Range' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'custom') {
                    setDateRange('custom')
                  } else {
                    handleDateChange({ target: { value: tab.id } })
                  }
                }}
                className={`range-tab-btn ${dateRange === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          {dateRange === 'custom' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#064E3B] border border-[#022C22] p-3 rounded-xl mt-3">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[#CCFBF1] text-xs font-bold whitespace-nowrap">FROM</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  max={customEnd || getISTDateString(new Date())}
                  min={(() => { const d = new Date(); d.setDate(d.getDate() - getMaxDays(clinic?.plan_id)); return getISTDateString(d) })()}
                  className="bg-[#065F46] border border-[#022C22] text-white px-3 py-2 rounded-lg text-sm font-semibold outline-none flex-1 min-w-0"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[#CCFBF1] text-xs font-bold whitespace-nowrap">TO</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  min={customStart}
                  max={getISTDateString(new Date())}
                  className="bg-[#065F46] border border-[#022C22] text-white px-3 py-2 rounded-lg text-sm font-semibold outline-none flex-1 min-w-0"
                />
              </div>
              <button
                onClick={applyCustomRange}
                className="bg-[#065F46] hover:bg-[#064E3B] text-white px-5 py-2 rounded-lg font-bold text-sm whitespace-nowrap"
              >
                Apply ✓
              </button>
            </div>
          )}
        </div>

        <div className="w-full mx-auto px-8 pb-8 space-y-6">
        
        {/* PRINT HEADER ONLY */}
        <div className="hidden print:block mb-8 border-b-2 border-[#E2E8F0] pb-4">
          <h1 className="text-3xl font-black text-[#065F46]">{clinic?.name || clinic?.business_name || 'TokenPe Clinic'}</h1>
          <p className="text-[#64748B] font-semibold">Analytics Report • Generated {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        {/* SEC 1: PERIOD SNAPSHOT */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#6A8A74', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {getSnapshotTitle().toUpperCase()}
            </div>
            <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 800 }}>
              Updated Just Now
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Patients */}
            <div className="analytics-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5A7563' }}>Patients</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EFF7F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F' }}>
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F291B', lineHeight: 1 }}>{rangeTotal}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: diffTotalPct === null ? '#5A7563' : diffTotalPct >= 0 ? '#16A34A' : '#DC2626', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{diffTotalPct === null ? 'Live patient count' : `${diffTotalPct >= 0 ? '↑ +' : '↓ '}${diffTotalPct}% vs previous`}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Avg Wait Time */}
            <div className="analytics-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5A7563' }}>Avg Wait Time</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F291B', lineHeight: 1 }}>
                  {rangeAvgWait}<span style={{ fontSize: '1rem', fontWeight: 800, color: '#5A7563', marginLeft: 2 }}>min</span>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: diffWaitTime === null ? '#5A7563' : diffWaitTime <= 0 ? '#16A34A' : '#DC2626', marginTop: 6 }}>
                  {diffWaitTime === null ? 'Average queue wait time' : `${diffWaitTime <= 0 ? '↓ ' : '↑ +'}${diffWaitTime}min vs previous`}
                </div>
              </div>
            </div>

            {/* Card 3: Completed */}
            <div className="analytics-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5A7563' }}>Completed</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F291B', lineHeight: 1 }}>
                  {rangeTotal ? Math.round((rangeCompleted / rangeTotal) * 100) : 0}%
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: diffCompletedPct === null ? '#5A7563' : diffCompletedPct >= 0 ? '#16A34A' : '#DC2626', marginTop: 6 }}>
                  {diffCompletedPct === null ? 'Consultation completion rate' : `${diffCompletedPct >= 0 ? '↑ +' : '↓ '}${diffCompletedPct}% vs previous`}
                </div>
              </div>
            </div>

            {/* Card 4: Skipped */}
            <div className="analytics-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5A7563' }}>Skipped</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                  <Trophy className="w-4 h-4 text-[#DC2626]" />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F291B', lineHeight: 1 }}>{rangeSkipped}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: diffSkippedVal === null ? '#5A7563' : diffSkippedVal <= 0 ? '#16A34A' : '#DC2626', marginTop: 6 }}>
                  {diffSkippedVal === null ? 'Skipped or no-show count' : `${diffSkippedVal >= 0 ? '+' : ''}${diffSkippedVal} vs previous`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEC 2 & 3: INSIGHTS & PERFORMANCE */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="analytics-card p-6">
            <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F291B', marginBottom: 20 }}>Patient Insights</h2>
            
            {/* Top Box: Returning vs New Progress Bars */}
            <div style={{ background: '#F7FAF7', border: '1px solid #E5EFE6', borderRadius: 14, padding: 18, marginBottom: 20 }}>
              {/* Returning */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                    <Repeat className="w-4 h-4 text-[#5A7563]" /> Returning
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F291B' }}>{returningPct}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#E2EFE3', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${returningPct}%`, height: '100%', background: '#84B067', borderRadius: 99 }}></div>
                </div>
              </div>

              {/* New */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                    <UserPlus className="w-4 h-4 text-[#5A7563]" /> New
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F291B' }}>{newPct}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#E2EFE3', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${newPct}%`, height: '100%', background: '#84B067', borderRadius: 99 }}></div>
                </div>
              </div>
            </div>

            {/* List items with Lucide icons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #F0F5F1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                  <Users className="w-4 h-4 text-[#5A7563]" /> Total Patients
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F291B' }}>{rangeTotal.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #F0F5F1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                  <MessageCircle className="w-4 h-4 text-[#5A7563]" /> WhatsApp Joins
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F291B' }}>{whatsappCount.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #F0F5F1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                  <Footprints className="w-4 h-4 text-[#5A7563]" /> Walk-ins
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F291B' }}>{walkIns.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                  <TrendingUp className="w-4 h-4 text-[#5A7563]" /> Avg Patients/Day
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F291B' }}>{avgPerDay.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="relative analytics-card p-6 overflow-hidden">
            {isStarter && <LockCard title="Advanced Queue Analytics" planRequired="Elite" />}
            <div className={isStarter ? 'blur-sm select-none' : ''}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F291B', marginBottom: 20 }}>Queue Performance</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #F0F5F1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                    <Clock className="w-4 h-4 text-[#5A7563]" /> Average Wait
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F291B' }}>{rangeAvgWait} mins</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #F0F5F1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                    <CheckCircle2 className="w-4 h-4 text-[#5A7563]" /> Completed vs Skipped
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F291B' }}>
                    {rangeCompleted.toLocaleString('en-IN')} / {rangeSkipped.toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #F0F5F1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                    <Bell className="w-4 h-4 text-[#5A7563]" /> WhatsApp Alerts Sent
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F291B' }}>{exactAlertsSent.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #F0F5F1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                    <Mic className="w-4 h-4 text-[#5A7563]" /> Voice Notes Generated
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F291B' }}>{exactVoicesGenerated.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>
                    <UsersRound className="w-4 h-4 text-[#5A7563]" /> Peak Queue Size
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F291B' }}>{heatmapMax}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEC 4: HEATMAP */}
        <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden hover-card">
          {isStarter && <LockCard title="Busy Hour Heatmap" planRequired="Pro" />}
          <div className={isStarter ? 'blur-sm select-none' : ''}>
            <h2 className="text-lg font-black text-[#065F46] mb-6">Busy Hour Heatmap</h2>
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="min-w-[800px] pr-4">
                <div className="flex mb-2">
                  <div className="w-12"></div>
                  {Array(24).fill(0).map((_,i) => (
                    <div key={i} className="flex-1 text-center text-xs font-bold text-[#94A3B8]">
                      {i === 0 ? '12a' : i < 12 ? i+'a' : i === 12 ? '12p' : (i-12)+'p'}
                    </div>
                  ))}
                </div>
                {daysOfWeek.map((day, dIdx) => (
                  <div key={day} className="flex items-center mb-1 gap-1">
                    <div className="w-12 text-xs font-bold text-[#64748B]">{day}</div>
                    {heatmap[dIdx].map((count, hIdx) => {
                      let bgColor = '#EBF3EC' // 0 patients
                      if (heatmapMax > 0 && count > 0) {
                        const normalizedMax = Math.max(heatmapMax, 6)
                        const ratio = count / normalizedMax
                        
                        if (ratio >= 0.75) {
                          bgColor = '#2D6A4F' // Dark olive green for peak
                        } else if (ratio >= 0.35) {
                          bgColor = '#52B788' // Medium olive green
                        } else {
                          bgColor = '#B7E4C7' // Light green
                        }
                      }
                      return (
                        <div 
                          key={hIdx} 
                          title={`${day} ${hIdx}:00 - ${count} patients`}
                          className="flex-1 h-8 rounded-sm transition-all hover:ring-2 hover:ring-[#2D6A4F]"
                          style={{ backgroundColor: bgColor }}
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
              <h2 className="text-lg font-black text-[#065F46] mb-6">Language Breakdown</h2>
              <div className="space-y-4">
                {sortedLangs.slice(0,5).map(([code, count]) => (
                  <div key={code}>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span>{langMap[code] || code}</span>
                      <span>{Math.round((count/rangeTotal)*100)}%</span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-2 rounded-full">
                      <div className="bg-[#065F46] h-full rounded-full" style={{width: `${(count/rangeTotal)*100}%`}}></div>
                    </div>
                  </div>
                ))}
                {sortedLangs.length === 0 && <div className="text-[#94A3B8] text-sm italic">No language data available.</div>}
              </div>
            </div>
          </div>

          <div className="relative analytics-card p-6 overflow-hidden">
            {isStarter && <LockCard title="Monthly Comparison" planRequired="Pro" />}
            <div className={isStarter ? 'blur-sm select-none' : ''}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F291B', marginBottom: 4 }}>{getComparisonHeader().title}</h2>
              <p style={{ fontSize: '0.8rem', color: '#5A7563', marginBottom: 20, fontWeight: 500 }}>
                {getComparisonHeader().desc}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 900, color: '#5A7563', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: 10 }}>
                <span>METRIC</span>
                <div style={{ display: 'flex', gap: 40 }}>
                  <span style={{ width: 60, textAlign: 'right' }}>{getComparisonHeader().colCurr}</span>
                  <span style={{ width: 60, textAlign: 'right' }}>{getComparisonHeader().colPrev}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #F0F5F1' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>Total Patients</span>
                  <div style={{ display: 'flex', gap: 40, fontSize: '0.88rem', fontWeight: 800 }}>
                    <span style={{ width: 60, textAlign: 'right', color: '#2D6A4F' }}>{currTotal.toLocaleString('en-IN')}</span>
                    <span style={{ width: 60, textAlign: 'right', color: '#5A7563' }}>{prevTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #F0F5F1' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>Completed %</span>
                  <div style={{ display: 'flex', gap: 40, fontSize: '0.88rem', fontWeight: 800 }}>
                    <span style={{ width: 60, textAlign: 'right', color: '#2D6A4F' }}>{currCompletedPct}%</span>
                    <span style={{ width: 60, textAlign: 'right', color: '#5A7563' }}>{prevCompletedPct}%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #F0F5F1' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>Avg Wait Time</span>
                  <div style={{ display: 'flex', gap: 40, fontSize: '0.88rem', fontWeight: 800 }}>
                    <span style={{ width: 60, textAlign: 'right', color: '#2D6A4F' }}>{currAvgWait}m</span>
                    <span style={{ width: 60, textAlign: 'right', color: '#5A7563' }}>{prevAvgWait}m</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#5A7563' }}>Skipped</span>
                  <div style={{ display: 'flex', gap: 40, fontSize: '0.88rem', fontWeight: 800 }}>
                    <span style={{ width: 60, textAlign: 'right', color: '#DC2626' }}>{currSkipped}</span>
                    <span style={{ width: 60, textAlign: 'right', color: '#5A7563' }}>{prevSkipped}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEC 7: FEEDBACK */}
        <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden hover-card">
          {!isElite && <LockCard title="Patient Feedback" planRequired="Elite" />}
          <div className={!isElite ? 'blur-sm select-none' : ''}>
            <h2 className="text-lg font-black text-[#065F46] mb-6">Patient Feedback Summary</h2>
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
                    <span className="w-8 text-right text-[#065F46]">{ratingCount ? Math.round((ratings[star]/ratingCount)*100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEC 8: AI INSIGHTS */}
        <div className="relative analytics-card p-6 overflow-hidden">
          {!isElite && <LockCard title="Smart AI Insights" planRequired="Elite" />}
          <div className={!isElite ? 'blur-sm select-none' : ''}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
                  <Sparkles className="w-5 h-5 text-[#166534]" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F291B', margin: 0 }}>TokenPe AI Insights</h2>
                  <p style={{ fontSize: '0.76rem', color: '#5A7563', margin: 0, fontWeight: 600 }}>Automated real-time queue intelligence</p>
                </div>
              </div>
            </div>

            {loadingAi ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#5A7563', fontSize: '0.85rem', fontWeight: 700 }}>
                <Sparkles className="w-6 h-6 text-[#2D6A4F] animate-spin mx-auto mb-2" />
                Calculating insights from consultation metrics...
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Insight 1: Patient Traffic & Peak Hour */}
                <div className="analytics-card" style={{ padding: 20, background: '#F7FAF7', border: '1px solid #E5EFE6', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PEAK DEMAND</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#0F291B', fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
                    {rangeTotal > 0
                      ? `Patient traffic reaches highest volume with an average of ${avgPerDay} consultations/day.`
                      : 'Not enough consultation data in selected period to calculate peak volume.'}
                  </p>
                  <div style={{ marginTop: 14, fontSize: '0.72rem', fontWeight: 800, color: '#166534' }}>
                    REAL-TIME STATS
                  </div>
                </div>

                {/* Insight 2: Wait Time Optimization */}
                <div className="analytics-card" style={{ padding: 20, background: '#FFFDF5', border: '1px solid #FDE68A', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WAIT EFFICIENCY</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#0F291B', fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
                    {rangeAvgWait > 0
                      ? `Average consultation wait time is ${rangeAvgWait} mins across ${rangeTotal} registered patients.`
                      : 'Wait time tracking active. Data updates dynamically with new check-ins.'}
                  </p>
                  <div style={{ marginTop: 14, fontSize: '0.72rem', fontWeight: 800, color: '#D97706' }}>
                    QUEUE OPTIMIZATION
                  </div>
                </div>

                {/* Insight 3: Retention & WhatsApp Adoption */}
                <div className="analytics-card" style={{ padding: 20, background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369A1' }}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PATIENT ADOPTION</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#0F291B', fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
                    {returningPct > 0
                      ? `${returningPct}% of patients are returning visitors. WhatsApp alerts sent: ${exactAlertsSent}.`
                      : `WhatsApp joins count: ${whatsappCount} patients out of ${rangeTotal} total entries.`}
                  </p>
                  <div style={{ marginTop: 14, fontSize: '0.72rem', fontWeight: 800, color: '#0284C7' }}>
                    PATIENT RETENTION
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)
}
