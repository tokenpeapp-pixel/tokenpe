'use client'
import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import {
  Users, UserPlus, Clock, BarChart2, QrCode, Pencil, CreditCard,
  HelpCircle, LogOut, X, Menu, Check, CheckCircle2, ChevronDown,
  Download, Printer, AlertCircle, Plus, SkipForward, Bell, Loader2,
  GraduationCap, Search, RefreshCw, TrendingUp,
  Hash, ArrowRight, Pause, Play, FileText
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import QRCode from 'qrcode'

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0',
  navy: '#1E3A5F', navyLight: '#2D5282',
  accent: '#3B82F6', accentLight: '#DBEAFE',
  text: '#0F172A', textMuted: '#64748B', textLight: '#94A3B8',
  success: '#059669', successLight: '#D1FAE5',
  warning: '#D97706', warningLight: '#FEF3C7',
  danger: '#DC2626', dangerLight: '#FEE2E2',
}

const STATUS_CONFIG = {
  waiting: { label: 'Waiting', dot: '#D97706', bg: '#FEF3C7' },
  called:  { label: 'Called',  dot: '#3B82F6', bg: '#DBEAFE' },
  done:    { label: 'Done',    dot: '#059669', bg: '#D1FAE5' },
  skipped: { label: 'Skipped', dot: '#94A3B8', bg: '#E2E8F0' },
}

function getISTDate() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useSounds() {
  const ctx = useRef(null)
  function tone(freqs, vol = 0.25) {
    try {
      if (typeof window === 'undefined') return
      if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)()
      const ac = ctx.current
      freqs.forEach((f, i) => {
        const osc = ac.createOscillator()
        const g = ac.createGain()
        osc.connect(g); g.connect(ac.destination)
        osc.frequency.value = f; osc.type = 'sine'
        const t = ac.currentTime + i * 0.15
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(vol, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
        osc.start(t); osc.stop(t + 0.32)
      })
    } catch (_) {}
  }
  return {
    add:  () => tone([523, 659]),
    call: () => tone([880, 1100], 0.3),
    done: () => tone([659, 523], 0.2),
    skip: () => tone([440], 0.15),
  }
}

function useToasts() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])
  return { toasts, add }
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function ToastStack({ toasts }) {
  const colors = { info: C.navy, success: C.success, error: C.danger, warn: C.warning }
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: colors[t.type] || C.navy, color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', maxWidth: 320 }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

function TokenBadge({ token }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: C.navyLight, color: '#fff', fontFamily: 'monospace', fontWeight: 800, fontSize: 13, padding: '3px 10px', borderRadius: 6 }}>
      <Hash size={11} />{token}
    </span>
  )
}

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.waiting
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: C.text }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  )
}

function StatCard({ label, value, icon, color = C.navy, sub }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.textLight, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

function SectionHeader({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h2>
      {right}
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'primary', size = 'md', style: s = {}, type }) {
  const sz = size === 'sm' ? { fontSize: 12, padding: '5px 11px' } : { fontSize: 14, padding: '8px 15px' }
  const vs = {
    primary: { background: C.navy, color: '#fff', border: 'none' },
    success: { background: C.success, color: '#fff', border: 'none' },
    ghost:   { background: 'transparent', color: C.text, border: `1px solid ${C.border}` },
    danger:  { background: C.danger, color: '#fff', border: 'none' },
  }
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      fontWeight: 600, borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1, transition: 'opacity 0.15s', ...sz, ...vs[variant], ...s
    }}>
      {children}
    </button>
  )
}

function Inp({ label, required, style: s = {}, ...props }) {
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>
          {label}{required && <span style={{ color: C.danger }}>*</span>}
        </label>
      )}
      <input style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.surface, outline: 'none', boxSizing: 'border-box', ...s }} {...props} />
    </div>
  )
}

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: width, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4, borderRadius: 6, display: 'flex' }}><X size={17} /></button>
        </div>
        <div style={{ padding: '18px 20px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

// ─── QR Poster Modal ──────────────────────────────────────────────────────────
function QRPosterModal({ school, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const waNum = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919969701706'
  const code = school?.code || 'SCHOOL'
  const waLink = `https://wa.me/${waNum}?text=JOIN%20${code}`

  useEffect(() => {
    QRCode.toDataURL(waLink, { width: 300, margin: 2, color: { dark: C.navy, light: '#FFFFFF' } })
      .then(setQrDataUrl).catch(() => {})
  }, [waLink])

  function doPrint() {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>Queue QR - ${school?.name || 'School'}</title>
    <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;font-family:sans-serif}.card{background:#fff;border:2px solid #1E3A5F;border-radius:16px;padding:32px;text-align:center;width:320px}.name{font-size:18px;font-weight:800;color:#1E3A5F}.sub{font-size:12px;color:#64748B;margin:4px 0 18px}.steps{font-size:12px;color:#64748B;line-height:1.9;margin-top:12px;text-align:left}.code{background:#DBEAFE;border:1.5px dashed #3B82F6;border-radius:8px;padding:8px 16px;font-family:monospace;font-size:14px;font-weight:800;color:#1E3A5F;margin-top:14px;display:inline-block}</style>
    </head><body><div class="card"><div class="name">${school?.name || 'Institution'}</div><div class="sub">Scan to join the front-office queue</div>
    <img src="${qrDataUrl}" style="width:220px;height:220px;border-radius:10px;border:1px solid #e2e8f0"/>
    <div class="steps">1. Open WhatsApp<br/>2. Scan this QR code<br/>3. Get your token number instantly</div>
    <div class="code">Code: ${code}</div></div></body></html>`)
    w.document.close(); setTimeout(() => w.print(), 400)
  }

  return (
    <Modal title="Digital Queue QR Poster" onClose={onClose} width={420}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ background: C.navy, borderRadius: 12, padding: '20px 24px', marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#93C5FD', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{school?.name || 'Institution'}</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Scan to join the front-office queue</div>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR" style={{ width: 170, height: 170, borderRadius: 8, background: '#fff', padding: 8 }} />
            : <div style={{ width: 170, height: 170, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={22} color="#93C5FD" /></div>
          }
          <div style={{ color: '#93C5FD', fontSize: 11 }}>WhatsApp <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff' }}>JOIN {code}</span> to +{waNum}</div>
        </div>
        <div style={{ background: C.accentLight, borderRadius: 10, padding: '10px 14px', textAlign: 'left', marginBottom: 14, fontSize: 12, color: C.text, lineHeight: 1.7 }}>
          <strong>How visitors join:</strong> Open WhatsApp → Scan QR → Receive token on WhatsApp
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => { const a = document.createElement('a'); a.href = qrDataUrl; a.download = `QR-${code}.png`; a.click() }} disabled={!qrDataUrl} style={{ flex: 1 }}><Download size={14} /> Download</Btn>
          <Btn variant="ghost" onClick={doPrint} disabled={!qrDataUrl} style={{ flex: 1 }}><Printer size={14} /> Print</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ─── Add to Queue Modal ────────────────────────────────────────────────────────
const PURPOSES = ['General Enquiry', 'Admissions', 'Fee Payment', 'Principal Meeting', 'Document Collection', 'Staff Meeting', 'Library', 'Transport', 'Other']

function AddToQueueModal({ school, onClose, onAdded, toast }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [purpose, setPurpose] = useState('General Enquiry')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const addRes = await fetch('/api/queue/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: school.id, name: name.trim(), phone: phone.trim() || '0000000000', language: 'en', purpose })
      })
      const addData = await addRes.json()
      if (addData.success) { toast(`Token ${addData.patient.token} — ${name.trim()}`, 'success'); onAdded(addData.patient); onClose() }
      else toast(addData.message || 'Failed to add', 'error')
    } catch { toast('Network error', 'error') }
    setSaving(false)
  }

  return (
    <Modal title="Add Visitor to Queue" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="Full Name" required placeholder="Visitor / Student name" value={name} onChange={e => setName(e.target.value)} />
        <Inp label="Phone (Optional)" placeholder="10-digit mobile" type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>Purpose<span style={{ color: C.danger }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <select value={purpose} onChange={e => setPurpose(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.surface, outline: 'none', appearance: 'none' }}>
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn type="submit" disabled={saving || !name.trim()} style={{ flex: 1 }}>
            {saving ? 'Adding...' : <><Plus size={14} /> Add to Queue</>}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

// ─── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ school, onClose, onSaved, toast }) {
  const [name, setName] = useState(school?.name || '')
  const [city, setCity] = useState(school?.city || '')
  const [type, setType] = useState(school?.specialty || 'School')
  const [code, setCode] = useState(school?.code || '')
  const [logoUrl, setLogoUrl] = useState(school?.logo_url || '')
  const [saving, setSaving] = useState(false)
  const TYPES = ['School', 'College', 'University', 'Coaching Institute', 'Kindergarten', 'Training Center']

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const payload = { name: name.trim(), city: city.trim(), specialty: type, code: code.trim().toUpperCase(), logo_url: logoUrl.trim() }
      const res = await fetch('/api/school/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload })
      })
      if (res.ok) { toast('Profile updated', 'success'); onSaved(payload); onClose() }
      else toast('Failed to save', 'error')
    } catch { toast('Network error', 'error') }
    setSaving(false)
  }

  return (
    <Modal title="Edit Institute Profile" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="Institution Name" required value={name} onChange={e => setName(e.target.value)} />
        <Inp label="City" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" />
        <Inp label="Queue Code" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. SCHOOL" maxLength={12} />
        <Inp label="Logo URL" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
        
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>Institution Type</label>
          <div style={{ position: 'relative' }}>
            <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.surface, outline: 'none', appearance: 'none' }}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn type="submit" disabled={saving || !name.trim()} style={{ flex: 1 }}>{saving ? 'Saving...' : <><Check size={14} /> Save</>}</Btn>
        </div>
      </form>
    </Modal>
  )
}

// ─── Support Modal ────────────────────────────────────────────────────────────
function SupportModal({ onClose, toast }) {
  const [msg, setMsg] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!msg.trim()) return
    setSending(true)
    await new Promise(r => setTimeout(r, 900))
    setSent(true); setSending(false)
    setTimeout(() => { onClose(); toast('Support request sent', 'success') }, 1400)
  }

  if (sent) return (
    <Modal title="Support & Report Issue" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <CheckCircle2 size={40} color={C.success} style={{ marginBottom: 12 }} />
        <div style={{ fontWeight: 700, color: C.text }}>Message sent!</div>
        <div style={{ color: C.textMuted, fontSize: 13, marginTop: 6 }}>We will respond within 24 hours.</div>
      </div>
    </Modal>
  )

  return (
    <Modal title="Support & Report Issue" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="Your Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>Issue Description<span style={{ color: C.danger }}>*</span></label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder="Describe what happened..."
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn type="submit" disabled={sending || !msg.trim()} style={{ flex: 1 }}>{sending ? 'Sending...' : 'Send Report'}</Btn>
        </div>
      </form>
    </Modal>
  )
}

// ─── Live Queue Tab ────────────────────────────────────────────────────────────
function LiveQueueTab({ school, queue, setQueue, toast, sounds, onOpenAdd, paused }) {
  const [calling, setCalling] = useState(null)
  const [marking, setMarking] = useState(null)
  const waiting = queue.filter(q => q.status === 'waiting')
  const called  = queue.filter(q => q.status === 'called')
  const done    = queue.filter(q => q.status === 'done')

  async function callNext(entry) {
    setCalling(entry.id); sounds.call()
    try {
      const res = await fetch('/api/queue/next', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: school.id, clinicName: school.name, patientId: entry.id, patientPhone: entry.phone, patientName: entry.name, token: entry.token, language: 'en' })
      })
      if (res.ok) { setQueue(q => q.map(x => x.id === entry.id ? { ...x, status: 'called' } : x)); toast(`Called ${entry.name} — Token ${entry.token}`, 'info') }
      else toast('Failed to call', 'error')
    } catch { toast('Network error', 'error') }
    setCalling(null)
  }

  async function markDone(entry) {
    setMarking(entry.id); sounds.done()
    try {
      const res = await fetch('/api/queue/done', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: school.id, clinicName: school.name, patientId: entry.id, patientPhone: entry.phone, patientName: entry.name, token: entry.token, language: 'en' })
      })
      if (res.ok) { setQueue(q => q.map(x => x.id === entry.id ? { ...x, status: 'done' } : x)); toast(`${entry.name} — served`, 'success') }
      else toast('Failed to mark done', 'error')
    } catch { toast('Network error', 'error') }
    setMarking(null)
  }

  async function skipEntry(entry) {
    sounds.skip()
    try {
      await fetch('/api/queue/skip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: entry.id, businessId: school.id }) })
      setQueue(q => q.map(x => x.id === entry.id ? { ...x, status: 'skipped' } : x)); toast(`Skipped ${entry.name}`, 'warn')
    } catch { toast('Network error', 'error') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="Waiting"      value={waiting.length} icon={<Users size={18} color={C.warning} />}  color={C.warning} />
        <StatCard label="Being Served" value={called.length}  icon={<Bell size={18} color={C.accent} />}    color={C.accent} />
        <StatCard label="Served Today" value={done.length}    icon={<CheckCircle2 size={18} color={C.success} />} color={C.success} />
        <StatCard label="Total Today"  value={queue.length}   icon={<Hash size={18} color={C.navy} />}      color={C.navy} />
      </div>

      {/* Currently being served */}
      {called.length > 0 && (
        <div>
          <SectionHeader title="Now Being Served" />
          {called.map(entry => (
            <div key={entry.id} style={{ background: C.accentLight, border: `1.5px solid ${C.accent}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{entry.token}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{entry.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{entry.purpose || 'General Enquiry'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn size="sm" variant="success" onClick={() => markDone(entry)} disabled={marking === entry.id}>
                  <CheckCircle2 size={12} /> {marking === entry.id ? '...' : 'Done'}
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => skipEntry(entry)}><SkipForward size={12} /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Waiting list */}
      <div>
        <SectionHeader
          title={`Waiting Queue (${waiting.length})`}
          right={<Btn size="sm" onClick={onOpenAdd} disabled={paused}><Plus size={13} /> Add Visitor</Btn>}
        />
        {waiting.length === 0 ? (
          <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: '40px 20px', textAlign: 'center', color: C.textLight }}>
            <Users size={28} style={{ marginBottom: 10, opacity: 0.35 }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>No one waiting</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Share the QR poster or add visitors manually above</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {waiting.map((entry, idx) => (
              <div key={entry.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: idx === 0 ? C.navy : C.bg, color: idx === 0 ? '#fff' : C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <TokenBadge token={entry.token} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: C.text, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{entry.purpose || 'General Enquiry'}</div>
                </div>
                <span style={{ fontSize: 11, color: C.textLight, flexShrink: 0 }}>
                  {entry.joined_at ? new Date(entry.joined_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn size="sm" onClick={() => callNext(entry)} disabled={calling === entry.id}>
                    <Bell size={12} /> {calling === entry.id ? '...' : 'Call'}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => skipEntry(entry)}><SkipForward size={12} /></Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const [date, setDate] = useState(getISTDate())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchRec = useCallback(async (d) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/generic-dashboard/get?date=${d}`)
      const data = await res.json()
      if (data.success) setRecords(data.patients || [])
    } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchRec(date) }, [date, fetchRec])

  const filtered = records.filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.token?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 170px' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '8px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, outline: 'none', background: C.surface }} />
        </div>
        <div style={{ flex: '2 1 220px', position: 'relative' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>Search</label>
          <Search size={13} style={{ position: 'absolute', bottom: 11, left: 10, color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or token..."
            style={{ paddingLeft: 30, padding: '9px 12px 9px 30px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, outline: 'none', width: '100%', boxSizing: 'border-box', background: C.surface }} />
        </div>
        <Btn variant="ghost" onClick={() => fetchRec(date)} size="sm"><RefreshCw size={13} /> Refresh</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
        <StatCard label="Total"   value={records.length}                                  icon={<Hash size={15} color={C.navy} />}         color={C.navy} />
        <StatCard label="Served"  value={records.filter(r => r.status === 'done').length}    icon={<CheckCircle2 size={15} color={C.success} />} color={C.success} />
        <StatCard label="Skipped" value={records.filter(r => r.status === 'skipped').length} icon={<SkipForward size={15} color={C.warning} />}  color={C.warning} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight, fontSize: 13 }}>Loading records...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 20px', color: C.textLight, background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10 }}>
          <FileText size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 14 }}>No records found</div>
        </div>
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 85px 85px', padding: '9px 16px', background: C.bg, borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Token</span><span>Name</span><span>Purpose</span><span>Time</span><span>Status</span>
          </div>
          {filtered.map((r, i) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 85px 85px', padding: '10px 16px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', fontSize: 13 }}>
              <TokenBadge token={r.token} />
              <span style={{ fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <span style={{ color: C.textMuted, fontSize: 12 }}>{r.purpose || 'General Enquiry'}</span>
              <span style={{ color: C.textLight, fontSize: 12 }}>{r.joined_at ? new Date(r.joined_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Analytics Tab ─────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/generic-dashboard/get?date=${getISTDate()}`)
      .then(r => r.json())
      .then(d => { if (d.success) setRecords(d.patients || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const done    = records.filter(r => r.status === 'done')
  const waiting = records.filter(r => r.status === 'waiting')
  const avgWait = done.length > 0
    ? Math.round(done.reduce((acc, r) => !r.joined_at || !r.done_at ? acc : acc + (new Date(r.done_at) - new Date(r.joined_at)) / 60000, 0) / done.length)
    : 0

  const byPurpose = records.reduce((acc, r) => {
    const p = r.purpose || 'General Enquiry'
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {})
  const topPurposes = Object.entries(byPurpose).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxCount = topPurposes[0]?.[1] || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12 }}>
        <StatCard label="Total Today"  value={records.length} icon={<Hash size={18} color={C.navy} />}         color={C.navy} />
        <StatCard label="Served"       value={done.length}    icon={<CheckCircle2 size={18} color={C.success} />} color={C.success} />
        <StatCard label="Waiting"      value={waiting.length} icon={<Users size={18} color={C.warning} />}     color={C.warning} />
        <StatCard label="Avg Wait"     value={`${avgWait}m`}  icon={<Clock size={18} color={C.accent} />}      color={C.accent} sub="for completed" />
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
        <SectionHeader title="Visits by Purpose — Today" />
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: C.textLight }}>Loading...</div>
        ) : topPurposes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: C.textLight, fontSize: 13 }}>No data yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topPurposes.map(([purpose, count]) => (
              <div key={purpose}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{purpose}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{count}</span>
                </div>
                <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${(count / maxCount) * 100}%`, background: C.navy }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: C.accentLight, border: `1px solid ${C.accent}40`, borderRadius: 10, padding: '13px 16px', fontSize: 13, color: C.navy, display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendingUp size={15} />
        <span><strong>Upgrade to Pro</strong> for 7-day trends, per-hour breakdowns, and CSV export.</span>
      </div>
    </div>
  )
}

// ─── Hamburger Menu ────────────────────────────────────────────────────────────
function HamburgerMenu({ school, tab, setTab, onLogout, onModal, open, setOpen }) {
  const nav = [
    { section: 'Primary' },
    { id: 'queue',     label: 'Live Queue',              Icon: Users },
    { id: 'add',       label: 'Add to Queue',             Icon: UserPlus,  modal: true },
    { id: 'history',   label: 'Queue History',            Icon: Clock },
    { section: 'Reports' },
    { id: 'analytics', label: 'Analytics',                Icon: BarChart2 },
    { divider: true },
    { section: 'Settings' },
    { id: 'qr',        label: 'Digital Queue QR Poster',  Icon: QrCode,    modal: true },
    { id: 'profile',   label: 'Edit Institute Profile',   Icon: Pencil,    modal: true },
    { id: 'billing',   label: 'Billing Plans',            Icon: CreditCard, modal: true },
    { id: 'support',   label: 'Support & Report Issue',   Icon: HelpCircle, modal: true },
    { divider: true },
    { id: 'logout', label: 'Logout', Icon: LogOut, danger: true },
  ]

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 490 }} />}
      <nav style={{
        position: 'fixed', top: 0, right: open ? 0 : -272, bottom: 0, width: 260,
        background: C.surface, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', zIndex: 500,
        display: 'flex', flexDirection: 'column', transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1)'
      }}>
        {/* Header */}
        <div style={{ padding: '14px 14px 12px', background: C.navy, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={18} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{school?.name || 'Institution'}</div>
            <div style={{ color: '#93C5FD', fontSize: 10, marginTop: 1 }}>{school?.specialty || 'Front Office'}{school?.city ? ` • ${school.city}` : ''}</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 12px' }}>
          {nav.map((item, i) => {
            if (item.section) return (
              <div key={i} style={{ padding: '10px 10px 4px', fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.section}
              </div>
            )
            if (item.divider) return <div key={i} style={{ height: 1, background: C.border, margin: '6px 8px' }} />
            const { Icon } = item
            const isActive = !item.modal && !item.danger && tab === item.id
            return (
              <button key={item.id} onClick={() => {
                if (item.danger) { setOpen(false); onLogout() }
                else if (item.modal || item.id === 'add') { setOpen(false); onModal(item.id) }
                else { setTab(item.id); setOpen(false) }
              }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: isActive ? C.accentLight : 'transparent',
                color: item.danger ? C.danger : isActive ? C.navy : C.text,
                fontWeight: isActive ? 700 : 500, fontSize: 13, textAlign: 'left'
              }}>
                <Icon size={15} style={{ flexShrink: 0 }} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}

function ClockWidget() {
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() { setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })) }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return <div style={{ fontSize: 12, color: C.textMuted, fontFamily: 'monospace', fontWeight: 600 }}>{time}</div>
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
function SchoolDashboardInner() {
  const router = useRouter()
  const { toasts, add: toast } = useToasts()
  const sounds = useSounds()

  const [school, setSchool]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [queue, setQueue]         = useState([])
  const [tab, setTab]             = useState('queue')
  const [menuOpen, setMenuOpen]   = useState(false)
  const [modal, setModal]         = useState(null)
  const [paused, setPaused]       = useState(false)

  // Auth boot
  useEffect(() => {
    async function boot() {
      try {
        const cached = localStorage.getItem('tokenpe_school_business')
        if (cached) { try { setSchool(JSON.parse(cached)) } catch (_) {} }
        const res = await fetch('/api/business-auth/me?vertical=school')
        const data = await res.json()
        if (!data.authenticated || !data.clinic) { router.push('/school-login'); return }
        setSchool(data.clinic)
        localStorage.setItem('tokenpe_school_business', JSON.stringify(data.clinic))
      } catch (e) { console.warn('[school]', e) }
      finally { setLoading(false) }
    }
    boot()
  }, [])

  // Queue realtime sync
  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/generic-dashboard/get?date=${getISTDate()}`)
      const data = await res.json()
      if (data.success) setQueue(data.patients || [])
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (!school) return
    loadQueue()
    
    const channel = supabase.channel(`queue_school_${school.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries', filter: `business_id=eq.${school.id}` }, () => {
        loadQueue()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [school, loadQueue])

  async function logout() {
    localStorage.removeItem('tokenpe_school_business')
    await fetch('/api/business-auth/logout', { method: 'POST' }).catch(() => {})
    await supabase.auth.signOut().catch(() => {})
    router.push('/school-login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: 'center', color: C.textMuted }}>
        <GraduationCap size={36} color={C.navy} style={{ marginBottom: 14 }} />
        <div style={{ fontWeight: 600 }}>Loading dashboard...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 2px; }
        button { font-family: inherit; }
      `}</style>

      {/* Topbar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 400,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.navy, lineHeight: 1.1 }}>{school?.name || 'Institution'}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{school?.specialty || 'Front Office'}{school?.city ? ` · ${school.city}` : ''}</div>
          </div>
        </div>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
          {[
            { id: 'queue',     label: 'Live Queue', I: Users },
            { id: 'history',   label: 'History',    I: Clock },
            { id: 'analytics', label: 'Analytics',  I: BarChart2 },
          ].map(({ id, label, I }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === id ? 700 : 500,
              background: tab === id ? C.accentLight : 'transparent',
              color: tab === id ? C.navy : C.textMuted,
            }}>
              <I size={14} />{label}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ClockWidget />

          <button onClick={() => { setPaused(p => !p); toast(paused ? 'Queue resumed' : 'Queue paused', 'info') }} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7,
            border: `1px solid ${paused ? C.danger : C.border}`,
            background: paused ? C.dangerLight : 'transparent',
            color: paused ? C.danger : C.textMuted,
            cursor: 'pointer', fontSize: 12, fontWeight: 600
          }}>
            {paused ? <><Play size={12} />Resume</> : <><Pause size={12} />Pause</>}
          </button>

          <button onClick={() => setModal('add')} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 13px', borderRadius: 7, border: 'none',
            background: C.navy, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600
          }}>
            <UserPlus size={13} />Add
          </button>

          <button onClick={() => setMenuOpen(o => !o)} style={{
            width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`,
            background: menuOpen ? C.accentLight : 'transparent', color: C.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <Menu size={17} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '22px 18px' }}>
        {paused && (
          <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}30`, borderRadius: 10, padding: '10px 15px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.danger, fontWeight: 600 }}>
            <AlertCircle size={15} />Queue is paused — visitors are not being admitted
            <button onClick={() => { setPaused(false); toast('Queue resumed', 'success') }} style={{ marginLeft: 'auto', background: C.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Resume</button>
          </div>
        )}

        {tab === 'queue'     && <LiveQueueTab school={school} queue={queue} setQueue={setQueue} toast={toast} sounds={sounds} onOpenAdd={() => setModal('add')} paused={paused} />}
        {tab === 'history'   && <HistoryTab />}
        {tab === 'analytics' && <AnalyticsTab />}
      </main>

      {/* Side menu */}
      <HamburgerMenu school={school} tab={tab} setTab={setTab} onLogout={logout} onModal={setModal} open={menuOpen} setOpen={setMenuOpen} />

      {/* Modals */}
      {modal === 'qr'      && <QRPosterModal school={school} onClose={() => setModal(null)} />}
      {modal === 'add'     && <AddToQueueModal school={school} onClose={() => setModal(null)} onAdded={e => { setQueue(q => [...q, e]); sounds.add() }} toast={toast} />}
      {modal === 'profile' && <EditProfileModal school={school} onClose={() => setModal(null)} onSaved={u => setSchool(s => ({ ...s, ...u }))} toast={toast} />}
      {modal === 'support' && <SupportModal onClose={() => setModal(null)} toast={toast} />}
      {modal === 'billing' && (
        <Modal title="Billing Plans" onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CreditCard size={34} color={C.navy} style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>Current Plan</div>
            <div style={{ display: 'inline-block', background: C.accentLight, color: C.navy, padding: '5px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, marginBottom: 14 }}>
              {school?.plan_id === 'pro' ? 'Pro' : school?.plan_id === 'elite' ? 'Elite' : 'Starter'}
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 270, margin: '0 auto 18px' }}>
              Upgrade to Pro for unlimited tokens, WhatsApp notifications, and full analytics.
            </div>
            <Btn style={{ width: '100%' }} onClick={() => { setModal(null); router.push('/school-dashboard/billing') }}>
              View Plans <ArrowRight size={13} />
            </Btn>
          </div>
        </Modal>
      )}

      <ToastStack toasts={toasts} />
    </div>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function SchoolDashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: 'sans-serif', color: '#64748B' }}>
        <div style={{ textAlign: 'center' }}>
          <GraduationCap size={30} color="#1E3A5F" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 600 }}>Loading...</div>
        </div>
      </div>
    }>
      <SchoolDashboardInner />
    </Suspense>
  )
}
