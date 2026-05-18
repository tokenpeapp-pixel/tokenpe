'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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
        .code{font-size:10px;color:#cbd5e1;margin-top:16px;letter-spacing:1px}
      </style>
      </head><body>
      <div class="card">
        <div class="logo">🏥 TokenPe</div>
        <div class="tag">YOUR TOKEN. YOUR TIME.</div>
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
        <div class="code">Clinic Code: ${clinic?.code}</div>
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
        <div style={{ fontSize: 22, fontWeight: 900, color: '#0F4C75' }}>🏥 TokenPe</div>
        <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: .5, marginBottom: 14 }}>YOUR TOKEN. YOUR TIME.</div>
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
        <div style={{ fontSize: 10, color: '#cbd5e1', letterSpacing: 1, marginBottom: 20 }}>CLINIC CODE: {clinic?.code}</div>
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
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newLang, setNewLang] = useState('hi')
  const [time, setTime] = useState(new Date())
  const [showQR, setShowQR] = useState(false)
  const sounds = useSounds()

  // ── Load clinic from session (multi-clinic support) ─────────────────────
  useEffect(() => {
    async function load() {
      // Get clinic code from localStorage (set during login)
      const clinicCode = localStorage.getItem('clinicCode')

      if (!clinicCode) {
        // Not logged in — redirect to login
        router.push('/login')
        return
      }

      const { data: clinicData, error } = await supabase
        .from('clinics').select('*').eq('code', clinicCode).single()

      if (error || !clinicData) {
        // Invalid clinic — clear and redirect
        localStorage.removeItem('clinicCode')
        router.push('/login')
        return
      }

      setClinic(clinicData)

      const today = new Date().toISOString().split('T')[0]
      const { data: patientsData } = await supabase
        .from('patients').select('*')
        .eq('clinic_id', clinicData.id)
        .eq('date', today)
        .order('joined_at', { ascending: true })

      setPatients(patientsData || [])
      setLoading(false)
    }
    load()
  }, [])

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
          setPatients(prev => [...prev, payload.new])
          sounds.newPatient()
          setNewPatientAlert(payload.new)
          setTimeout(() => setNewPatientAlert(null), 5000)
          addToast(`New patient joined: ${payload.new.name || payload.new.phone} — ${payload.new.token}`, 'new')
        }
        if (payload.eventType === 'UPDATE') {
          setPatients(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [clinic])

  // ── Clock ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Toast system ────────────────────────────────────────────────────────
  function addToast(msg, type = 'done') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  // ── Logout ──────────────────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem('clinicCode')
    localStorage.removeItem('clinicPhone')
    router.push('/login')
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  async function callNext() {
    const next = patients.find(p => p.status === STATUS.WAITING)
    if (!next) return
    await supabase.from('patients').update({ status: STATUS.CALLED }).eq('id', next.id)
    sounds.callNext()
    addToast(`Calling ${next.name || next.token} — voice note sent!`, 'call')
    await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: next.phone, language: next.language, event: 'now', token: next.token, clinicName: clinic.name })
    })
  }

  async function markDone(patient) {
    await supabase.from('patients').update({ status: STATUS.DONE }).eq('id', patient.id)
    sounds.done()
    addToast(`${patient.name || patient.token} consultation done`, 'done')
    await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: patient.phone, language: patient.language, event: 'done', token: patient.token, clinicName: clinic.name })
    })
  }

  async function skipPatient(patient) {
    await supabase.from('patients').update({ status: STATUS.SKIPPED }).eq('id', patient.id)
    sounds.skip()
    addToast(`${patient.name || patient.token} skipped`, 'skip')
  }

  async function notifyPatient(patient) {
    sounds.notify()
    addToast(`Almost-turn voice note sent to ${patient.name || patient.token}`, 'notify')
    await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: patient.phone, language: patient.language, event: 'soon', token: patient.token, clinicName: clinic.name })
    })
  }

  async function addWalkIn() {
    if (!newPhone.trim()) return
    const token = `T${String(patients.length + 1).padStart(3, '0')}`
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('patients').insert({
      clinic_id: clinic.id, token,
      name: newName.trim() || null,
      phone: newPhone.trim(),
      language: newLang,
      status: STATUS.WAITING,
      amount_paid: 0,
      date: today,
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
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoBox}>🏥</div>
          <div>
            <div style={s.appName}>TokenPe</div>
            <div style={s.clinicSubName}>{clinic?.name}</div>
          </div>
        </div>
        <div style={s.headerCenter}>
          <div style={s.statPill}>
            <span style={{ ...s.dot, background: '#F97316' }} />
            <strong>{waiting.length}</strong>&nbsp;Waiting
          </div>
          <div style={s.statPill}>
            <span style={{ ...s.dot, background: '#10B981' }} />
            <strong>{called.length}</strong>&nbsp;With Doctor
          </div>
          <div style={s.statPill}>
            <span style={{ ...s.dot, background: '#38BDF8' }} />
            <strong>{done.length}</strong>&nbsp;Done
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.liveBadge}><span style={s.liveDot} />LIVE</div>
          <div style={s.clock}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <button onClick={logout} style={s.btnLogout}>Logout</button>
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
      </div>

      {/* ── Patient List ── */}
      <div style={s.list}>
        {displayPatients.length === 0 && (
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

// ─── STYLES ────────────────────────────────────────────────────────────────
const s = {
  root: { fontFamily: "'DM Sans','Segoe UI',sans-serif", background: '#F0F4F8', minHeight: '100vh', maxWidth: '980px', margin: '0 auto' },
  loadingScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  spinner: { width: 40, height: 40, border: '4px solid #E2E8F0', borderTop: '4px solid #0F4C75', borderRadius: '50%' },
  toastContainer: { position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 },
  toast: { padding: '12px 18px', borderRadius: 10, color: 'white', fontWeight: 600, fontSize: '0.88rem', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 280 },
  banner: { background: 'linear-gradient(135deg,#0F4C75,#1B6CA8)', color: 'white', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' },
  bannerDot: { width: 10, height: 10, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 0 4px rgba(74,222,128,0.3)', flexShrink: 0 },
  header: { background: 'linear-gradient(135deg,#0F4C75 0%,#1B6CA8 100%)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(15,76,117,0.3)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logoBox: { fontSize: '2rem' },
  appName: { color: 'white', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.5px' },
  clinicSubName: { color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', marginTop: 2 },
  headerCenter: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  statPill: { background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '6px 14px', color: 'white', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  liveBadge: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', color: 'white', fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' },
  clock: { color: 'white', fontWeight: 600, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' },
  btnLogout: { background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  actionBar: { background: 'white', padding: '14px 24px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #E2E8F0' },
  btnQR: { background: '#1e293b', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' },
  btnAdd: { background: '#0F4C75', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnCall: { background: '#10B981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' },
  btnGhost: { background: 'transparent', color: '#64748B', border: '1px solid #CBD5E1', padding: '10px 16px', borderRadius: 8, fontWeight: 500, fontSize: '0.88rem', cursor: 'pointer' },
  btnDone: { background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '7px 14px', borderRadius: 7, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  btnNotify: { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '7px 14px', borderRadius: 7, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  btnSkip: { background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3', padding: '7px 14px', borderRadius: 7, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  qrHint: { marginLeft: 'auto', color: '#94A3B8', fontSize: '0.78rem', fontStyle: 'italic' },
  addForm: { background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', padding: '16px 24px' },
  addFormTitle: { fontWeight: 700, color: '#1E40AF', marginBottom: 12, fontSize: '0.9rem' },
  addFormRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: '0.9rem', flex: 1, minWidth: 160, outline: 'none', background: 'white' },
  select: { padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: '0.9rem', background: 'white', cursor: 'pointer' },
  tabs: { display: 'flex', padding: '16px 24px 0', background: 'white', borderBottom: '1px solid #E2E8F0', gap: 4 },
  tab: { padding: '10px 20px', border: 'none', background: 'transparent', color: '#64748B', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', borderBottom: '3px solid transparent', borderRadius: '8px 8px 0 0' },
  tabActive: { color: '#0F4C75', borderBottom: '3px solid #0F4C75', background: '#F0F9FF' },
  list: { padding: '8px 16px 40px' },
  sectionLabel: { padding: '12px 8px 6px', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  card: { background: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  token: { fontWeight: 800, fontSize: '1.1rem', minWidth: 52, textAlign: 'center' },
  cardInfo: { flex: 1 },
  patientName: { fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  langBadge: { background: '#F0F9FF', color: '#0369A1', padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600 },
  patientMeta: { fontSize: '0.78rem', color: '#94A3B8', marginTop: 4 },
  estWait: { fontSize: '0.72rem', color: '#64748B', marginTop: 2 },
  cardActions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  doneTag: { color: '#065F46', fontWeight: 600, fontSize: '0.82rem' },
  skipTag: { color: '#9F1239', fontWeight: 600, fontSize: '0.82rem' },
  empty: { textAlign: 'center', padding: '60px 24px' },
}