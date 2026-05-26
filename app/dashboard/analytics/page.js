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

      if (c.plan_id !== 'elite') {
        // Not Elite -> Block access
        setLoading(false)
        return
      }

      await fetchAnalytics(c.id)
    }
    load()
  }, [router])

  // 2. Fetch Data
  async function fetchAnalytics(clinicId) {
    // Get last 30 days
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const thirtyDaysAgo = d.toISOString().split('T')[0]

    const { data } = await supabase
      .from('patients')
      .select('date, joined_at')
      .eq('clinic_id', clinicId)
      .gte('date', thirtyDaysAgo)

    if (data) {
      processData(data)
    } else {
      setLoading(false)
    }
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

  if (clinic?.plan_id !== 'elite') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: 'white', fontFamily: "'Inter',sans-serif", padding: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: 20 }}>🥇</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 10 }}>Elite Feature</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
            Monthly PDF Analytics is strictly available to Elite plan members. Upgrade to unlock deep clinic insights!
          </p>
          <button onClick={() => router.push('/dashboard/billing')} style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', width: '100%' }}>
            Upgrade to Elite
          </button>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', color: '#94A3B8', border: 'none', padding: '12px 24px', marginTop: 10, fontWeight: 600, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

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
        <button
          onClick={() => window.print()}
          style={{ background: '#F59E0B', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          📄 Download PDF
        </button>
      </div>

      <div className="container">
        {/* PDF HEADER (Hidden on web) */}
        <div className="print-header" style={{ display: 'none' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Monthly Performance Report</div>
          <div style={{ fontSize: '1.1rem', color: '#64748B', fontWeight: 500 }}>Clinic: <strong>{clinic.name}</strong></div>
          <div style={{ fontSize: '0.9rem', color: '#94A3B8', marginTop: 4 }}>Generated on: {new Date().toLocaleDateString('en-IN')}</div>
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
