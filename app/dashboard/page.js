'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getISTDateString, getISTYesterdayDateString } from '../../lib/supabase'

// ─── SOUNDS ────────────────────────────────────────────────────────────────
function useSounds() {
  const audioCtx = useRef(null)
  function getCtx() {
    if (!audioCtx.current)
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    return audioCtx.current
  }
  function playTone(frequencies, type = 'sine', volume = 0.4) {
    const ctx = getCtx()
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = type
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(volume, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t)
      osc.stop(t + 0.4)
    })
  }
  return {
    newPatient: () => playTone([523.25, 659.25]),
    callNext: () => playTone([880, 1100], 'sine', 0.3),
    done: () => playTone([659.25, 523.25], 'sine', 0.25),
    skip: () => playTone([440], 'sine', 0.2),
    notify: () => playTone([700, 900], 'sine', 0.2),
  }
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const STATUS = { WAITING: 'waiting', CALLED: 'called', DONE: 'done', SKIPPED: 'skipped' }

const LANG_NAMES = {
  hi: 'हिंदी', ta: 'தமிழ்', te: 'తెలుగు', mr: 'मराठी',
  bn: 'বাংলা', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ', en: 'English'
}

const TOAST_TYPES = {
  new: { bg: '#0F4C75', icon: '🆕' },
  call: { bg: '#7C3AED', icon: '📢' },
  done: { bg: '#065F46', icon: '✅' },
  skip: { bg: '#92400E', icon: '⏭' },
  notify: { bg: '#1E40AF', icon: '🔔' },
  error: { bg: '#9F1239', icon: '❌' },
}

// ─── QR MODAL ──────────────────────────────────────────────────────────────
function QRModal({ clinic, onClose }) {
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const waLink = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=JOIN%20${clinic?.code}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(waLink)}&color=0F4C75&bgcolor=ffffff&margin=24`

  async function download() {
    setDownloading(true)
    const res = await fetch(qrUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TokenPe-QR-${clinic?.code}.png`
    a.click()
    URL.revokeObjectURL(url)
    setDownloading(false)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  function print() {
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>TokenPe QR — ${clinic?.name}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',sans-serif;display:flex;align-items:center;
             justify-content:center;min-height:100vh;background:#fff}
        .card{width:320px;border:2.5px solid #0F4C75;border-radius:22px;
              padding:32px 24px;text-align:center}
        .logo{font-size:22px;font-weight:900;color:#0F4C75}
        .tag{font-size:10px;color:#94a3b8;margin-bottom:20px;letter-spacing:.5px}
        .name{font-size:17px;font-weight:800;color:#1e293b;margin-bottom:4px}
        .sub{font-size:12px;color:#64748b;margin-bottom:22px}
        img{width:220px;height:220px;border-radius:12px;border:1px solid #e2e8f0}
        hr{border:none;border-top:1px solid #f1f5f9;margin:18px 0}
        .how{font-size:13px;font-weight:700;color:#1e293b}
        .steps{font-size:11px;color:#64748b;margin-top:8px;line-height:2}
        .code-box{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:10px;padding:8px 16px;margin-top:16px}
        .code-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}
        .code-val{font-size:15px;font-weight:800;color:#0F4C75;font-family:monospace;letter-spacing:1px}
      </style>
      </head><body>
      <div class="card">
        <div style="margin-bottom:12px;display:flex;justify-content:center">
          <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/logo-light.svg" style="height:44px;width:auto" />
        </div>
        <div class="name">${clinic?.name}</div>
        <div class="sub">Scan to join the OPD queue</div>
        <img src="${qrUrl}" />
        <hr/>
        <div class="how">📱 How to join</div>
        <div class="steps">
          1. Open WhatsApp on your phone<br/>
          2. Scan this QR code with camera<br/>
          3. Tap Send — get your token instantly
        </div>
        <div class="code-box">
          <span class="code-label">Clinic Code:</span>
          <span class="code-val">${clinic?.code}</span>
        </div>
      </div>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, padding: '36px 32px', width: '100%', maxWidth: 380, textAlign: 'center', position: 'relative', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 18, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <img src="/logo-light.svg" alt="TokenPe Logo" style={{ height: '48px', width: 'auto' }} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b' }}>{clinic?.name}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Scan to join the OPD queue</div>
        <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16, display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: 16 }}>
          <img src={qrUrl} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 10, display: 'block' }} />
        </div>
        <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '12px 16px', textAlign: 'left', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F4C75', marginBottom: 6 }}>📱 How patients join</div>
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.9 }}>
            1. Open WhatsApp → scan this QR<br />
            2. Tap Send — no typing needed<br />
            3. Pick language → get token + voice note 🎙️
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: 10, padding: '8px 16px', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Clinic Code:</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F4C75', fontFamily: 'monospace', letterSpacing: 1 }}>{clinic?.code}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={download} disabled={downloading} style={{ flex: 1, padding: '12px 0', background: '#0F4C75', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: downloading ? 0.7 : 1 }}>
            {downloaded ? '✅ Saved!' : downloading ? 'Saving...' : '⬇️ Download PNG'}
          </button>
          <button onClick={print} style={{ flex: 1, padding: '12px 0', background: 'white', color: '#0F4C75', border: '2px solid #0F4C75', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            🖨️ Print Card
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [patients, setPatients] = useState([])
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])
  const [newPatientAlert, setNewPatientAlert] = useState(null)
  const [activeTab, setActiveTab] = useState('active')
  const [currentDate, setCurrentDate] = useState(() => getISTDateString())
  const [historyDate, setHistoryDate] = useState(() => getISTYesterdayDateString())
  const [historyPatients, setHistoryPatients] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newLang, setNewLang] = useState('hi')
  const [time, setTime] = useState(new Date())
  const [showQR, setShowQR] = useState(false)
  const sounds = useSounds()

  // ── Load clinic from session (multi-clinic support) ─────────────────────
  useEffect(() => {
    async function loadClinic() {
      // Get clinic code from localStorage (set during login)
      let clinicCode = localStorage.getItem('clinicCode')

      if (!clinicCode) {
        // Fallback: Check if user is logged in via Supabase (e.g., Google OAuth redirect)
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const { data: clinicData, error: clinicError } = await supabase
            .from('clinics').select('*').eq('email', user.email).single()

          if (clinicData && !clinicError) {
            // Generate new clinic code on each login (invalidates old QR)
            const newCode = clinicData.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) + (Math.floor(Math.random() * 900) + 100)
            const { data: updated } = await supabase
              .from('clinics').update({ code: newCode }).eq('id', clinicData.id).select().single()
            const finalClinic = updated || clinicData
            localStorage.setItem('clinicCode', finalClinic.code)
            localStorage.setItem('clinicPhone', finalClinic.phone)
            localStorage.setItem('tokenpe_clinic', JSON.stringify(finalClinic))
            clinicCode = finalClinic.code
          } else {
            // Logged into Google, but email does not exist as a clinic in the clinics table
            await supabase.auth.signOut()
            router.push('/login?error=no_clinic')
            return
          }
        } else {
          // Not logged in — redirect to login
          router.push('/login')
          return
        }
      }

      const { data: clinicData, error } = await supabase
        .from('clinics').select('*').eq('code', clinicCode).single()

      if (error || !clinicData) {
        // Invalid clinic — clear and redirect
        localStorage.removeItem('clinicCode')
        localStorage.removeItem('clinicPhone')
        localStorage.removeItem('tokenpe_clinic')
        router.push('/login')
        return
      }

      setClinic(clinicData)
    }
    loadClinic()
  }, [])

  // ── Load patients when clinic or currentDate changes ───────────────────
  useEffect(() => {
    if (!clinic) return
    async function loadPatients() {
      setLoading(true)
      const { data: patientsData } = await supabase
        .from('patients').select('*')
        .eq('clinic_id', clinic.id)
        .eq('date', currentDate)
        .order('joined_at', { ascending: true })

      setPatients(patientsData || [])
      setLoading(false)
    }
    loadPatients()
  }, [clinic, currentDate])

  // ── Real-time ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!clinic) return
    const channel = supabase
      .channel('patients-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'patients',
        filter: `clinic_id=eq.${clinic.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.date === currentDate) {
            setPatients(prev => [...prev, payload.new])
            sounds.newPatient()
            setNewPatientAlert(payload.new)
            setTimeout(() => setNewPatientAlert(null), 5000)
            addToast(`New patient joined: ${payload.new.name || payload.new.phone} — ${payload.new.token}`, 'new')
          }
        }
        if (payload.eventType === 'UPDATE') {
          if (payload.new.date === currentDate) {
            setPatients(prev => {
              const exists = prev.some(p => p.id === payload.new.id)
              if (exists) {
                return prev.map(p => p.id === payload.new.id ? payload.new : p)
              } else {
                return [...prev, payload.new]
              }
            })
          }
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [clinic, currentDate])

  // ── Clock & Date Check ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date()
      setTime(now)
      const todayStr = getISTDateString()
      if (todayStr !== currentDate) {
        setCurrentDate(todayStr)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [currentDate])

  // ── Fetch History ───────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'history' && clinic) {
      async function fetchHistory() {
        setLoadingHistory(true)
        const { data } = await supabase
          .from('patients').select('*')
          .eq('clinic_id', clinic.id)
          .eq('date', historyDate)
          .order('joined_at', { ascending: true })
        setHistoryPatients(data || [])
        setLoadingHistory(false)
      }
      fetchHistory()
    }
  }, [activeTab, historyDate, clinic])

  // ── Toast system ────────────────────────────────────────────────────────
  function addToast(msg, type = 'done') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  // ── Logout ──────────────────────────────────────────────────────────────
  async function logout() {
    localStorage.removeItem('clinicCode')
    localStorage.removeItem('clinicPhone')
    localStorage.removeItem('tokenpe_clinic')
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  async function callNext() {
    const next = patients.find(p => p.status === STATUS.WAITING)
    if (!next) return

    // Call unified backend queue next API to process turn notifications and relative queue alerts!
    const res = await fetch('/api/queue/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId: clinic.id,
        clinicName: clinic.name,
        patientId: next.id,
        patientPhone: next.phone,
        patientName: next.name || 'Patient',
        token: next.token,
        language: next.language || 'en'
      })
    })

    if (res.ok) {
      sounds.callNext()
      addToast(`Calling ${next.name || next.token} — notifications & queue alerts sent!`, 'call')
    } else {
      addToast('Error calling next patient', 'error')
    }
  }

  async function markDone(patient) {
    const res = await fetch('/api/queue/done', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId: clinic.id,
        clinicName: clinic.name,
        patientId: patient.id,
        patientPhone: patient.phone,
        patientName: patient.name || 'Patient',
        token: patient.token,
        language: patient.language || 'en'
      })
    })

    if (res.ok) {
      sounds.done()
      addToast(`${patient.name || patient.token} consultation done`, 'done')
    } else {
      addToast('Error marking consultation done', 'error')
    }
  }

  async function skipPatient(patient) {
    await supabase.from('patients').update({ status: STATUS.SKIPPED }).eq('id', patient.id)
    sounds.skip()
    addToast(`${patient.name || patient.token} skipped`, 'skip')
  }

  async function notifyPatient(patient) {
    const res = await fetch('/api/queue/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicName: clinic.name,
        patientPhone: patient.phone,
        patientName: patient.name || 'Patient',
        token: patient.token,
        language: patient.language || 'en'
      })
    })

    if (res.ok) {
      sounds.notify()
      addToast(`Manual text & voice note alert sent to ${patient.name || patient.token}`, 'notify')
    } else {
      addToast('Error sending manual alert', 'error')
    }
  }

  async function addWalkIn() {
    if (!newPhone.trim()) return
    const token = `T${String(patients.length + 1).padStart(3, '0')}`
    const today = getISTDateString()
    await supabase.from('patients').insert({
      clinic_id: clinic.id, token,
      name: newName.trim() || null,
      phone: newPhone.trim(),
      language: newLang,
      status: STATUS.WAITING,
      amount_paid: 0,
      date: today,
      joined_at: new Date().toISOString(),
    })
    setNewName(''); setNewPhone(''); setNewLang('hi')
    setShowAddForm(false)
    addToast(`${newName || newPhone} added as ${token}`, 'new')
  }

  // ── Computed ────────────────────────────────────────────────────────────
  const waiting = patients.filter(p => p.status === STATUS.WAITING)
  const called = patients.filter(p => p.status === STATUS.CALLED)
  const done = patients.filter(p => p.status === STATUS.DONE)
  const activePatients = [...called, ...waiting]
  const displayPatients = activeTab === 'active' ? activePatients : done

  if (loading) return (
    <div style={s.loadingScreen}>
      <div style={s.spinner} />
      <p style={{ color: '#64748B', marginTop: 16 }}>Loading TokenPe...</p>
    </div>
  )

  return (
    <div style={s.root}>
      <style>{`
        .dash-header {
          background: linear-gradient(135deg,#0f0a2a 0%,#1a0b3b 50%,#0c1445 100%);
          padding: 0 24px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 32px rgba(124,58,237,0.25);
          position: sticky;
          top: 0;
          z-index: 50;
          gap: 12px;
        }

        .header-top-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-mobile-right {
          display: none;
        }

        .header-mid-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .header-bottom-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-num {
          color: #fff;
          font-weight: 800;
          font-size: 1rem;
        }

        .stat-label {
          color: rgba(255,255,255,0.45);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .desktop-only-logout {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-clock {
          color: rgba(255,255,255,0.6);
          font-weight: 600;
          font-size: 0.88rem;
          font-variant-numeric: tabular-nums;
        }

        /* RESPONSIVE DESIGN FOR TABLET & MOBILE */
        @media (max-width: 960px) {
          .dash-header {
            height: auto !important;
            flex-direction: column;
            padding: 16px !important;
            align-items: stretch;
            gap: 14px;
          }
          
          .header-top-row {
            width: 100%;
            justify-content: space-between;
          }
          
          .header-mobile-right {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .header-mid-row {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          
          .header-bottom-row {
            width: 100%;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding-top: 12px;
            justify-content: space-between;
          }
          
          .desktop-only-logout {
            display: none;
          }
        }
      `}</style>

      {/* ── Toasts ── */}
      <div style={s.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} style={{ ...s.toast, background: TOAST_TYPES[t.type]?.bg || '#1E293B' }}>
            {TOAST_TYPES[t.type]?.icon} {t.msg}
          </div>
        ))}
      </div>

      {/* ── New Patient Banner ── */}
      {newPatientAlert && (
        <div style={s.banner}>
          <div style={s.bannerDot} />
          🆕 New patient joined!&nbsp;
          <strong>{newPatientAlert.name || newPatientAlert.phone} — {newPatientAlert.token}</strong>
        </div>
      )}

      {/* ── QR Modal ── */}
      {showQR && <QRModal clinic={clinic} onClose={() => setShowQR(false)} />}

      {/* ── Header ── */}
      <header className="dash-header">
        <div className="header-top-row">
          <div style={s.headerLeft}>
            <img src="/logo.svg" alt="TokenPe" style={{ height: '36px', width: 'auto' }} />
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Clinic Console</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>{clinic?.name}</div>
            </div>
          </div>
          <div className="header-mobile-right">
            <div style={s.liveBadge}><span style={s.liveDot} />LIVE</div>
            <button onClick={logout} style={s.btnLogout}>Logout</button>
          </div>
        </div>
        
        <div className="header-mid-row">
          <div style={s.statChip}>
            <div style={{ ...s.chipDot, background: 'linear-gradient(135deg,#f97316,#fb923c)', boxShadow: '0 0 8px rgba(249,115,22,0.6)' }} />
            <span className="stat-num">{waiting.length}</span>
            <span className="stat-label">Waiting</span>
          </div>
          <div style={s.statChip}>
            <div style={{ ...s.chipDot, background: 'linear-gradient(135deg,#10b981,#34d399)', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
            <span className="stat-num">{called.length}</span>
            <span className="stat-label">With Doctor</span>
          </div>
          <div style={s.statChip}>
            <div style={{ ...s.chipDot, background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 0 8px rgba(99,102,241,0.6)' }} />
            <span className="stat-num">{done.length}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>

        <div className="header-bottom-row">
          <div className="header-clock">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="desktop-only-logout">
            <div style={s.liveBadge}><span style={s.liveDot} />LIVE</div>
            <button onClick={logout} style={s.btnLogout}>Logout</button>
          </div>
        </div>
      </header>

      {/* ── Action Bar ── */}
      <div style={s.actionBar}>
        <button style={s.btnQR} onClick={() => setShowQR(true)}>🔲 Generate QR</button>
        <button style={s.btnAdd} onClick={() => setShowAddForm(!showAddForm)}>+ Add Walk-in</button>
        <button
          style={{ ...s.btnCall, opacity: waiting.length === 0 ? 0.4 : 1 }}
          onClick={callNext}
          disabled={waiting.length === 0}
        >
          📢 Call Next {waiting.length > 0 ? `(${waiting[0]?.token})` : ''}
        </button>
        <div style={s.qrHint}>📱 Patients scan QR → WhatsApp → Auto joins queue</div>
      </div>

      {/* ── Add Walk-in Form ── */}
      {showAddForm && (
        <div style={s.addForm}>
          <div style={s.addFormTitle}>➕ Add Walk-in Patient</div>
          <div style={s.addFormRow}>
            <input style={s.input} placeholder="Patient Name (optional)" value={newName} onChange={e => setNewName(e.target.value)} />
            <input style={s.input} placeholder="WhatsApp Number *" value={newPhone} maxLength={10} onChange={e => setNewPhone(e.target.value.replace(/\D/g, ''))} />
            <select style={s.select} value={newLang} onChange={e => setNewLang(e.target.value)}>
              {Object.entries(LANG_NAMES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            <button style={s.btnAdd} onClick={addWalkIn}>Add to Queue</button>
            <button style={s.btnGhost} onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(activeTab === 'active' ? s.tabActive : {}) }} onClick={() => setActiveTab('active')}>
          Active Queue ({activePatients.length})
        </button>
        <button style={{ ...s.tab, ...(activeTab === 'done' ? s.tabActive : {}) }} onClick={() => setActiveTab('done')}>
          Completed ({done.length})
        </button>
        <button style={{ ...s.tab, ...(activeTab === 'history' ? s.tabActive : {}) }} onClick={() => setActiveTab('history')}>
          History
        </button>
      </div>

      {/* ── Patient List ── */}
      <div style={s.list}>
        {activeTab !== 'history' && displayPatients.length === 0 && (
          <div style={s.empty}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>{activeTab === 'active' ? '🎉' : '📋'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
              {activeTab === 'active' ? 'Queue is clear!' : 'No completed patients yet'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 6 }}>
              {activeTab === 'active' ? 'Add a walk-in or wait for WhatsApp joins' : ''}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, background: 'white', padding: '16px 20px', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>Select Date:</label>
            <input 
              type="date" 
              value={historyDate} 
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setHistoryDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', background: '#F8FAFC', color: '#0F172A', fontWeight: 500 }}
            />
          </div>
        )}

        {activeTab === 'history' && loadingHistory && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b', fontWeight: 600 }}>Loading history...</div>
        )}

        {activeTab === 'history' && !loadingHistory && historyPatients.length === 0 && (
          <div style={s.empty}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>No records found</div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 6 }}>Try selecting a different date</div>
          </div>
        )}

        {activeTab === 'history' && !loadingHistory && historyPatients.map(p => (
          <PatientCard key={p.id} patient={p} position={null} />
        ))}

        {activeTab === 'active' && called.length > 0 && <div style={s.sectionLabel}>🟢 With Doctor Now</div>}
        {activeTab === 'active' && called.map(p => (
          <PatientCard key={p.id} patient={p} position={null}
            onDone={() => markDone(p)} onSkip={() => skipPatient(p)} onNotify={() => notifyPatient(p)}
          />
        ))}

        {activeTab === 'active' && waiting.length > 0 && <div style={s.sectionLabel}>🟡 Waiting</div>}
        {activeTab === 'active' && waiting.map((p, idx) => (
          <PatientCard key={p.id} patient={p} position={idx + 1}
            onDone={() => markDone(p)} onSkip={() => skipPatient(p)} onNotify={() => notifyPatient(p)}
          />
        ))}

        {activeTab === 'done' && done.map(p => (
          <PatientCard key={p.id} patient={p} position={null} />
        ))}
      </div>
    </div>
  )
}

// ─── PATIENT CARD ──────────────────────────────────────────────────────────
function PatientCard({ patient, position, onDone, onSkip, onNotify }) {
  const isWaiting = patient.status === STATUS.WAITING
  const isCalled = patient.status === STATUS.CALLED
  const isDone = patient.status === STATUS.DONE
  const isSkipped = patient.status === STATUS.SKIPPED
  const waitMins = Math.floor((new Date() - new Date(patient.joined_at)) / 60000)
  const statusColor = { waiting: '#F97316', called: '#10B981', done: '#38BDF8', skipped: '#FB7185' }[patient.status]

  return (
    <div style={{ ...s.card, borderLeft: `4px solid ${statusColor}`, opacity: isDone || isSkipped ? 0.75 : 1 }}>
      <div style={{ ...s.token, color: statusColor }}>{patient.token}</div>
      <div style={s.cardInfo}>
        <div style={s.patientName}>
          {patient.name || 'Walk-in Patient'}
          <span style={s.langBadge}>{LANG_NAMES[patient.language] || 'हिंदी'}</span>
        </div>
        <div style={s.patientMeta}>
          📱 +91 {patient.phone} &nbsp;·&nbsp;
          ⏳ {waitMins}m &nbsp;·&nbsp;
          {position ? `#${position} in line` : patient.status.toUpperCase()}
        </div>
        {position && <div style={s.estWait}>Est. wait: ~{position * 7} mins</div>}
      </div>
      <div style={s.cardActions}>
        {isCalled && (
          <button style={s.btnDone} onClick={onDone}>✓ Done</button>
        )}
        {isWaiting && (
          <>
            <button style={s.btnNotify} onClick={onNotify}>🔔 Notify</button>
            <button style={s.btnSkip} onClick={onSkip}>⏭ Skip</button>
          </>
        )}
        {isDone && <span style={s.doneTag}>✅ Done</span>}
        {isSkipped && <span style={s.skipTag}>⏭ Skipped</span>}
      </div>
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  root: { fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif", background: '#F1F5F9', minHeight: '100vh', maxWidth: '1040px', margin: '0 auto' },
  loadingScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F1F5F9' },
  spinner: { width: 40, height: 40, border: '3px solid #E2E8F0', borderTop: '3px solid #7C3AED', borderRadius: '50%' },
  toastContainer: { position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 },
  toast: { padding: '12px 18px', borderRadius: 12, color: 'white', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', minWidth: 260 },
  banner: { background: 'linear-gradient(90deg,#7C3AED15,#06B6D415)', color: '#4F46E5', borderBottom: '1px solid #C4B5FD50', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 600 },
  bannerDot: { width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.7)', flexShrink: 0 },
  header: { background: 'linear-gradient(135deg,#0f0a2a 0%,#1a0b3b 50%,#0c1445 100%)', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 32px rgba(124,58,237,0.3)', position: 'sticky', top: 0, zIndex: 50 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  logoBox: {}, appName: {}, clinicSubName: {},
  headerCenter: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  statChip: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px', backdropFilter: 'blur(8px)' },
  chipDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  statPill: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  liveBadge: { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 20, padding: '4px 12px', color: '#34D399', fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1 },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' },
  clock: { color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' },
  btnLogout: { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  actionBar: { background: 'white', padding: '12px 24px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', boxShadow: '0 1px 0 #E2E8F0' },
  btnQR: { background: '#0F172A', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },
  btnAdd: { background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  btnCall: { background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' },
  btnGhost: { background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', padding: '10px 16px', borderRadius: 10, fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' },
  btnDone: { background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', color: '#065F46', border: '1px solid #A7F3D0', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  btnNotify: { background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', color: '#92400E', border: '1px solid #FDE68A', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  btnSkip: { background: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', color: '#9F1239', border: '1px solid #FECDD3', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  qrHint: { marginLeft: 'auto', color: '#CBD5E1', fontSize: '0.75rem', fontStyle: 'italic' },
  addForm: { background: 'linear-gradient(135deg,#F5F3FF,#EFF6FF)', borderBottom: '1px solid #DDD6FE', padding: '16px 24px' },
  addFormTitle: { fontWeight: 700, color: '#6D28D9', marginBottom: 12, fontSize: '0.88rem' },
  addFormRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '10px 14px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: '0.88rem', flex: 1, minWidth: 160, outline: 'none', background: 'white', color: '#0F172A' },
  select: { padding: '10px 14px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: '0.88rem', background: 'white', cursor: 'pointer', color: '#0F172A' },
  tabs: { display: 'flex', padding: '0 24px', background: 'white', borderBottom: '1px solid #F1F5F9', gap: 4 },
  tab: { padding: '15px 22px', border: 'none', background: 'transparent', color: '#94A3B8', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', borderBottom: '2px solid transparent', transition: 'color .15s' },
  tabActive: { color: '#7C3AED', borderBottom: '2px solid #7C3AED' },
  list: { padding: '12px 16px 80px' },
  sectionLabel: { padding: '16px 8px 8px', fontSize: '0.68rem', fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '1.2px', display: 'flex', alignItems: 'center', gap: 6 },
  card: { background: 'white', borderRadius: 16, padding: '18px 20px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', transition: 'box-shadow .2s,transform .15s' },
  token: { fontWeight: 900, fontSize: '1.1rem', minWidth: 56, textAlign: 'center', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' },
  cardInfo: { flex: 1, minWidth: 0 },
  patientName: { fontWeight: 700, color: '#0F172A', fontSize: '0.93rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  langBadge: { background: '#F5F3FF', color: '#7C3AED', padding: '2px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, border: '1px solid #DDD6FE' },
  patientMeta: { fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 },
  estWait: { fontSize: '0.72rem', color: '#64748B', marginTop: 3, fontWeight: 600 },
  cardActions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 },
  doneTag: { color: '#059669', fontWeight: 700, fontSize: '0.78rem', background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', padding: '5px 14px', borderRadius: 20, border: '1px solid #A7F3D0' },
  skipTag: { color: '#BE123C', fontWeight: 700, fontSize: '0.78rem', background: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', padding: '5px 14px', borderRadius: 20, border: '1px solid #FECDD3' },
  empty: { textAlign: 'center', padding: '80px 24px' },
}