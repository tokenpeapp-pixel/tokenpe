'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AnalyticsPage() {
  const router = useRouter()
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    busiestDay: 'N/A',
    peakHour: 'N/A',
    dailyData: []
  })
  const [dateRange, setDateRange] = useState('30')
  const [avgRating, setAvgRating] = useState(0)

  // 1. Load Clinic & Check Plan
  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) {
        router.push('/login')
        return
      }

      const c = JSON.parse(stored)
      setClinic(c)

      // Automatically force 7-days for starter plan, or 30-days for pro/elite if not already set.
      if (c.plan_id === 'starter') {
        setDateRange('7')
      }

      await fetchAnalytics(c.id, c.plan_id === 'starter' ? '7' : dateRange)
    }
    load()
  }, [router])

  // 2. Fetch Data
  async function fetchAnalytics(clinicId, range = dateRange) {
    // Get date based on range
    const d = new Date()
    d.setDate(d.getDate() - parseInt(range))
    const cutoffDate = d.toISOString().split('T')[0]

    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('date', cutoffDate)
      .order('date', { ascending: false })
      .order('joined_at', { ascending: false })

    if (data) {
      setPatients(data)
      processData(data)
      
      const rated = data.filter(p => p.rating > 0)
      if (rated.length > 0) {
        const sum = rated.reduce((acc, p) => acc + p.rating, 0)
        setAvgRating((sum / rated.length).toFixed(1))
      }
    } else {
      setLoading(false)
    }
  }

  // 2.5 Export CSV
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
        p.phone,
        p.status.toUpperCase(),
        waitTime
      ]
    })

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${clinic.name.replace(/\s+/g, '_')}_30Day_Report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 3. Crunch Numbers
  function processData(data) {
    const total = data.length

    // Busiest Day
    const dayCounts = {}
    data.forEach(p => {
      dayCounts[p.date] = (dayCounts[p.date] || 0) + 1
    })

    let maxDayCount = 0
    let busiestDate = 'N/A'
    Object.keys(dayCounts).forEach(d => {
      if (dayCounts[d] > maxDayCount) {
        maxDayCount = dayCounts[d]
        busiestDate = d
      }
    })

    const formattedBusiest = busiestDate !== 'N/A'
      ? new Date(busiestDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
      : 'N/A'

    // Peak Hour
    const hourCounts = {}
    data.forEach(p => {
      if (p.joined_at) {
        const h = new Date(p.joined_at).getHours()
        hourCounts[h] = (hourCounts[h] || 0) + 1
      }
    })

    let maxHourCount = 0
    let peakHourStr = 'N/A'
    Object.keys(hourCounts).forEach(h => {
      if (hourCounts[h] > maxHourCount) {
        maxHourCount = hourCounts[h]
        const hr = parseInt(h)
        const ampm = hr >= 12 ? 'PM' : 'AM'
        const hr12 = hr % 12 || 12
        peakHourStr = `${hr12}:00 ${ampm}`
      }
    })

    // Prepare Daily Data for Chart (last 7 days to keep it clean)
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' })
      chartData.push({
        label,
        count: dayCounts[dateStr] || 0
      })
    }

    setStats({
      total,
      busiestDay: formattedBusiest,
      peakHour: peakHourStr,
      dailyData: chartData
    })
    setLoading(false)
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
      <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Removed strict Elite blocker; Analytics now open to all (with varying limits)

  // Calculate Max for Chart Scaling
  const maxChartVal = Math.max(...stats.dailyData.map(d => d.count), 1)

  return (
    <div className="analytics-root">
      <style>{`
        .analytics-root {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: 'Inter', sans-serif;
          color: #0F172A;
        }
        
        /* Print Styles - Crucial for the PDF generator */
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-header { display: block !important; border-bottom: 2px solid #F1F5F9; padding-bottom: 20px; margin-bottom: 30px; }
          .report-card { box-shadow: none !important; border: 1px solid #E2E8F0 !important; break-inside: avoid; }
          .chart-bar { background: #0F172A !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .stat-value { color: #000 !important; }
        }

        .header {
          background: #0F172A;
          color: white;
          padding: 20px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.03);
          border: 1px solid #F1F5F9;
        }

        .chart-container {
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.03);
          border: 1px solid #F1F5F9;
          margin-bottom: 40px;
        }

        .bar-wrap {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          height: 200px;
          padding-top: 20px;
          margin-top: 20px;
          border-bottom: 2px solid #E2E8F0;
        }

        .bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .chart-bar {
          width: 100%;
          max-width: 48px;
          background: linear-gradient(180deg, #F59E0B, #D97706);
          border-radius: 6px 6px 0 0;
          transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bar-label {
          font-size: 0.8rem;
          color: #64748B;
          font-weight: 600;
          margin-top: 8px;
        }
      `}</style>

      {/* WEB HEADER (Hidden in PDF) */}
      <div className="header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ←
          </button>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Analytics</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{clinic.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            value={dateRange} 
            onChange={(e) => {
              if (clinic?.plan_id === 'starter' && e.target.value !== '7') return
              if (clinic?.plan_id === 'pro' && parseInt(e.target.value) > 30) return
              setDateRange(e.target.value)
              setLoading(true)
              fetchAnalytics(clinic.id, e.target.value)
            }}
            style={{ background: '#1E293B', color: 'white', border: '1px solid #334155', padding: '10px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
          >
            <option value="7">Last 7 Days (Starter)</option>
            {clinic?.plan_id !== 'starter' && <option value="30">Last 30 Days (Pro)</option>}
            {clinic?.plan_id === 'elite' && <option value="180">Last 6 Months (Elite)</option>}
            {clinic?.plan_id === 'elite' && <option value="365">Last 1 Year (Elite)</option>}
          </select>

          <button
            onClick={() => clinic?.plan_id === 'starter' ? router.push('/dashboard/billing') : exportCSV()}
            style={{ background: clinic?.plan_id === 'starter' ? '#334155' : '#10B981', color: clinic?.plan_id === 'starter' ? '#94A3B8' : 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: clinic?.plan_id === 'starter' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {clinic?.plan_id === 'starter' ? '🔒 CSV Export (Pro)' : '📥 Export CSV'}
          </button>
          <button
            onClick={() => clinic?.plan_id === 'starter' ? router.push('/dashboard/billing') : window.print()}
            style={{ background: clinic?.plan_id === 'starter' ? '#334155' : '#F59E0B', color: clinic?.plan_id === 'starter' ? '#94A3B8' : '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: clinic?.plan_id === 'starter' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {clinic?.plan_id === 'starter' ? '🔒 PDF Report (Pro)' : '📄 Download PDF'}
          </button>
        </div>
      </div>

      <div className="container">
        {/* PDF HEADER (Hidden on web) */}
        <div className="print-header" style={{ display: 'none' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Monthly Performance Report</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '1.1rem', color: '#64748B', fontWeight: 500 }}>Clinic: <strong>{clinic.name}</strong></div>
              <div style={{ fontSize: '0.9rem', color: '#94A3B8', marginTop: 4 }}>Generated on: {new Date().toLocaleDateString('en-IN')}</div>
            </div>
            {avgRating > 0 && (
              <div style={{ background: '#FEF3C7', padding: '10px 16px', borderRadius: 12, border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#B45309' }}>{avgRating}</span>
                <span style={{ fontSize: '1.1rem', color: '#F59E0B' }}>★</span>
                <span style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600, marginLeft: 4 }}>Patient Rating</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 32 }} className="no-print">
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>30-Day Overview</h1>
          <p style={{ color: '#64748B' }}>Insights to help you optimize clinic operations and staff scheduling.</p>
        </div>

        {/* STATS GRID */}
        <div className="stat-grid">
          <div className="stat-card report-card">
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>👥</div>
            <div style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Total Patients</div>
            <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>{stats.total}</div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 8 }}>In the last 30 days</div>
          </div>

          <div className="stat-card report-card">
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔥</div>
            <div style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Busiest Day</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginTop: 12 }}>{stats.busiestDay}</div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 10 }}>Highest footfall recorded</div>
          </div>

          <div className="stat-card report-card">
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏰</div>
            <div style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Peak Hour</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginTop: 12 }}>{stats.peakHour}</div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 10 }}>Most queue joins occurred</div>
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="chart-container report-card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Last 7 Days Trend</h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: 4 }}>Patient volume over the past week.</p>

          <div className="bar-wrap">
            {stats.dailyData.map((d, i) => {
              const heightPct = (d.count / maxChartVal) * 100;
              return (
                <div key={i} className="bar-col">
                  <div style={{ fontSize:'0.8rem', color:'#0F172A', fontWeight:700 }}>{d.count > 0 ? d.count : ''}</div>
                  <div className="chart-bar" style={{ height: `${Math.max(heightPct, 2)}%` }}></div>
                  <div className="bar-label">{d.label}</div>
                </div>
          )
            })}
        </div>
      </div>

      {/* PDF FOOTER */}
      <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 20, borderTop: '1px solid #E2E8F0', color: '#94A3B8', fontSize: '0.85rem' }} className="report-card">
        Confidential report automatically generated by <strong>TokenPe Elite</strong>.
      </div>
    </div>
    </div >
  )
}
