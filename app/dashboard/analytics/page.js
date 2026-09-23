'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import ClinicSidebar from '../../../components/ClinicSidebar'
import { 
  Lock, Download, Printer, Rocket, Building, Calendar, Trophy, Brain, 
  TrendingUp, Users, Clock, Repeat, UserPlus, MessageCircle, Footprints, 
  CheckCircle2, Bell, Mic, UsersRound, Sparkles, AlertTriangle, Lightbulb, 
  Zap, LayoutDashboard, Layers, History, BarChart2, Megaphone, CreditCard, 
  HelpCircle, User, ChevronDown, X 
} from 'lucide-react'

const DATE_RANGE_OPTIONS = [
  { id: 'today', label: 'Today Only', desc: 'Today’s consultation data' },
  { id: '7', label: 'Last 7 Days', desc: 'Past 1 week history' },
  { id: '30', label: 'Last 30 Days', desc: 'Past 1 month history' },
  { id: '90', label: 'Last 90 Days', desc: 'Past 3 months history' },
  { id: '180', label: 'Last 6 Months', desc: 'Past 6 months history' },
  { id: '365', label: 'Last 1 Year', desc: 'Past 12 months history' },
  { id: 'custom', label: 'Custom Range', desc: 'Select custom start & end dates' },
]

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
  const [showMobileDateSheet, setShowMobileDateSheet] = useState(false)

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
        const { data: freshClinic } = await supabase.from('businesses').select('*').eq('id', c.id).single()
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
      exactAlertsSent++
      if (clinic?.plan_id !== 'starter') exactVoicesGenerated++
      
      if (['called', 'done', 'skipped'].includes(p.status)) {
        exactAlertsSent++
        if (clinic?.plan_id !== 'starter') exactVoicesGenerated++
      }
      
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

  // Section 6: Period Comparison
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

  const diffTotalPct = prevTotal > 0 ? Math.round(((currTotal - prevTotal) / prevTotal) * 100) : null
  const diffWaitTime = prevAvgWait > 0 ? currAvgWait - prevAvgWait : null
  const diffCompletedPct = prevTotal > 0 ? currCompletedPct - prevCompletedPct : null
  const diffSkippedVal = prevTotal > 0 ? currSkipped - prevSkipped : null

  // Section 7: Feedback
  const ratings = overallFeedback?.ratings || {5:0, 4:0, 3:0, 2:0, 1:0}
  const avgRating = overallFeedback?.avgRating || "0.0"
  const ratingCount = overallFeedback?.ratingCount || 0

  if (loading) return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F2F7F2] font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <ClinicSidebar clinic={clinic} />
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-8">
        <div className="w-10 h-10 border-4 border-[#C3DBC7] border-t-[#2D6A4F] rounded-full animate-spin"></div>
      </div>
    </div>
  )

  const isStarter = clinic?.plan_id === 'starter'
  const isPro = clinic?.plan_id === 'pro'
  const isElite = clinic?.plan_id === 'elite'

  const LockCard = ({ title, planRequired }) => (
    <div className="absolute inset-0 bg-white/75 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0]">
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

  const getCleanLocation = () => {
    if (clinic?.city && typeof clinic.city === 'string' && !clinic.city.startsWith('010100')) return clinic.city.toUpperCase()
    if (clinic?.address && typeof clinic.address === 'string' && !clinic.address.startsWith('010100')) return clinic.address.toUpperCase()
    if (clinic?.location && typeof clinic.location === 'string' && !clinic.location.startsWith('010100')) return clinic.location.toUpperCase()
    return 'CLINIC'
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F2F7F2] font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <ClinicSidebar clinic={clinic} />

      <style jsx global>{`
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
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 24px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #5A7563;
          background: #F4F8F4;
          border: 1px solid transparent;
          cursor: pointer;
          white-space: nowrap !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          -webkit-tap-highlight-color: transparent;
        }
        .range-tab-btn:hover {
          color: #0F291B;
          background: #E5EFE6;
          border-color: #C3DBC7;
        }
        .range-tab-btn.active {
          background: #84B067;
          color: #FFFFFF;
          font-weight: 800;
          border-color: #719E55;
          box-shadow: 0 4px 14px rgba(132, 176, 103, 0.35);
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-screen pb-20 font-sans overflow-y-auto">
        {/* HEADER */}
        <div className="p-4 sm:p-6 lg:p-8 lg:pb-4">
          {/* Top Row: Subtitle + Title + Action Buttons */}
          <div className="flex justify-between items-start mb-5 flex-wrap gap-4">
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#84B067', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {(clinic?.name || clinic?.business_name || 'TokenPe Clinic').toUpperCase()} · {getCleanLocation()}
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

          {/* Bottom Row: Date Range Filter Bar */}
          <div className="bg-white rounded-2xl sm:rounded-[28px] p-2 border border-[#E1EBE2] shadow-sm">
            {/* Mobile Bottom Sheet & Quick Snap Carousel Trigger (< 640px) */}
            <div className="flex sm:hidden flex-col gap-2 w-full">
              <button
                onClick={() => setShowMobileDateSheet(true)}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#84B067] text-white rounded-xl font-extrabold text-sm flex items-center justify-between shadow-md active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white" />
                  <span className="whitespace-nowrap">Filter: {DATE_RANGE_OPTIONS.find(o => o.id === dateRange)?.label || 'Select'}</span>
                </div>
                <div className="flex items-center gap-1 text-xs bg-[#6E9B53] px-2.5 py-1 rounded-lg">
                  <span>Change</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white" />
                </div>
              </button>

              {/* Horizontal Swipeable Scroll Row with 44px Targets & 8px Gaps */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pt-1 pb-0.5">
                {DATE_RANGE_OPTIONS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'custom') {
                        setDateRange('custom')
                        setShowMobileDateSheet(true)
                      } else {
                        handleDateChange({ target: { value: tab.id } })
                      }
                    }}
                    className={`range-tab-btn snap-start flex-shrink-0 ${dateRange === tab.id ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop / Tablet Inline Pill Bar (>= 640px) */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 w-full">
              {DATE_RANGE_OPTIONS.map(tab => (
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
          </div>

          {/* MOBILE BOTTOM SHEET MODAL */}
          {showMobileDateSheet && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col gap-4">
                {/* Handle Bar */}
                <div className="w-12 h-1.5 bg-[#CBD5E1] rounded-full mx-auto mb-1"></div>

                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0F291B]">Select Date Range</h3>
                    <p className="text-xs text-[#718E7A] font-medium">Choose a period to filter analytics</p>
                  </div>
                  <button 
                    onClick={() => setShowMobileDateSheet(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Single-Column Stacked List (44px min tap targets, 8px gaps) */}
                <div className="flex flex-col gap-2 my-1">
                  {DATE_RANGE_OPTIONS.map(opt => {
                    const isActive = dateRange === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === 'custom') {
                            setDateRange('custom')
                          } else {
                            handleDateChange({ target: { value: opt.id } })
                            setShowMobileDateSheet(false)
                          }
                        }}
                        className={`w-full min-h-[44px] py-3 px-4 rounded-2xl flex items-center justify-between text-left transition-all border ${
                          isActive 
                            ? 'bg-[#84B067] text-white border-[#719E55] font-bold shadow-md' 
                            : 'bg-[#F7FAF7] text-[#0F291B] border-[#E1EBE2] hover:bg-[#E5EFE6] font-semibold'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold leading-tight whitespace-nowrap">{opt.label}</span>
                          <span className={`text-[11px] ${isActive ? 'text-emerald-100' : 'text-[#718E7A]'}`}>{opt.desc}</span>
                        </div>
                        {isActive && <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 ml-2" />}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Range Inputs if selected */}
                {dateRange === 'custom' && (
                  <div className="bg-[#064E3B] p-4 rounded-2xl text-white flex flex-col gap-3">
                    <div className="text-xs font-extrabold text-[#CCFBF1] uppercase tracking-wider">Custom Date Window</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#A7F3D0] font-bold block mb-1">FROM</label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={e => setCustomStart(e.target.value)}
                          max={customEnd || getISTDateString(new Date())}
                          className="w-full min-h-[44px] bg-[#065F46] border border-[#047857] text-white px-3 py-2 rounded-xl text-sm font-semibold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#A7F3D0] font-bold block mb-1">TO</label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={e => setCustomEnd(e.target.value)}
                          min={customStart}
                          max={getISTDateString(new Date())}
                          className="w-full min-h-[44px] bg-[#065F46] border border-[#047857] text-white px-3 py-2 rounded-xl text-sm font-semibold outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        applyCustomRange()
                        setShowMobileDateSheet(false)
                      }}
                      className="w-full min-h-[44px] bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl text-sm transition-all mt-1 shadow-lg"
                    >
                      Apply Custom Filter ✓
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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

        <div className="w-full mx-auto p-4 sm:p-6 lg:px-8 lg:pb-8 space-y-6">
        
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Patients */}
            <div className="analytics-card p-3.5 sm:p-5 flex flex-col justify-between">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5A7563' }}>Patients</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EFF7F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F' }}>
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F291B', lineHeight: 1 }}>{rangeTotal}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: diffTotalPct === null ? '#5A7563' : diffTotalPct >= 0 ? '#16A34A' : '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{diffTotalPct === null ? 'Live count' : `${diffTotalPct >= 0 ? '↑ +' : '↓ '}${diffTotalPct}%`}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Avg Wait Time */}
            <div className="analytics-card p-3.5 sm:p-5 flex flex-col justify-between">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5A7563' }}>Avg Wait</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F291B', lineHeight: 1 }}>
                  {rangeAvgWait}<span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#5A7563', marginLeft: 2 }}>min</span>
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: diffWaitTime === null ? '#5A7563' : diffWaitTime <= 0 ? '#16A34A' : '#DC2626', marginTop: 4 }}>
                  {diffWaitTime === null ? 'Average wait' : `${diffWaitTime <= 0 ? '↓ ' : '↑ +'}${diffWaitTime}min`}
                </div>
              </div>
            </div>

            {/* Card 3: Completed */}
            <div className="analytics-card p-3.5 sm:p-5 flex flex-col justify-between">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5A7563' }}>Completed</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F291B', lineHeight: 1 }}>
                  {rangeTotal ? Math.round((rangeCompleted / rangeTotal) * 100) : 0}%
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: diffCompletedPct === null ? '#5A7563' : diffCompletedPct >= 0 ? '#16A34A' : '#DC2626', marginTop: 4 }}>
                  {diffCompletedPct === null ? 'Completion rate' : `${diffCompletedPct >= 0 ? '↑ +' : '↓ '}${diffCompletedPct}%`}
                </div>
              </div>
            </div>

            {/* Card 4: Skipped */}
            <div className="analytics-card p-3.5 sm:p-5 flex flex-col justify-between">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5A7563' }}>Skipped</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                  <Trophy className="w-4 h-4 text-[#DC2626]" />
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F291B', lineHeight: 1 }}>{rangeSkipped}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: diffSkippedVal === null ? '#5A7563' : diffSkippedVal <= 0 ? '#16A34A' : '#DC2626', marginTop: 4 }}>
                  {diffSkippedVal === null ? 'No-show count' : `${diffSkippedVal >= 0 ? '+' : ''}${diffSkippedVal}`}
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
        <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden analytics-card">
          {isStarter && <LockCard title="Busy Hour Heatmap" planRequired="Pro" />}
          <div className={isStarter ? 'blur-sm select-none' : ''}>
            <h2 className="text-lg font-black text-[#0F291B] mb-6">Busy Hour Heatmap</h2>
            <div className="overflow-x-auto pb-4 no-scrollbar">
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
          <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden analytics-card">
            {isStarter && <LockCard title="Language Analytics" planRequired="Pro" />}
            <div className={isStarter ? 'blur-sm select-none' : ''}>
              <h2 className="text-lg font-black text-[#0F291B] mb-6">Language Breakdown</h2>
              <div className="space-y-4">
                {sortedLangs.slice(0,5).map(([code, count]) => (
                  <div key={code}>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span>{langMap[code] || code}</span>
                      <span>{Math.round((count/rangeTotal)*100)}%</span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-2 rounded-full">
                      <div className="bg-[#84B067] h-full rounded-full" style={{width: `${(count/rangeTotal)*100}%`}}></div>
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
        <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-[#F1F5F9] overflow-hidden analytics-card">
          {!isElite && <LockCard title="Patient Feedback" planRequired="Elite" />}
          <div className={!isElite ? 'blur-sm select-none' : ''}>
            <h2 className="text-lg font-black text-[#0F291B] mb-6">Patient Feedback Summary</h2>
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
