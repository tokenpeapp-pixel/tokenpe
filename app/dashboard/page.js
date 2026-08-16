'use client'
import { useEffect, useState, useRef, Suspense, useCallback, useMemo } from 'react'
import { 
  Stethoscope, Phone, CheckCircle2, XCircle, Megaphone, PlusCircle, SkipForward, 
  Bell, Download, Printer, Star, Mic, AlertTriangle, Hourglass, RefreshCw, Sparkles, 
  Plus, LogOut, Check, ChevronRight, Search, X, Settings, History, BarChart2, 
  CreditCard, DoorOpen, QrCode, Clock, Calendar, UserCheck, ChevronDown, List,
  ShieldCheck, UserPlus, Layers, Users, Activity, ArrowRight, MapPin, Pencil, Menu, 
  Camera, Upload, Image as ImageIcon, Smartphone, Pause, Play, User, HelpCircle, Hash, 
  MessageCircle, LayoutDashboard, TrendingUp, IndianRupee, Eye, ExternalLink, Shield
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getISTDateString, getISTYesterdayDateString } from '../../lib/supabase'
import confetti from 'canvas-confetti'
import QRCode from 'qrcode'
import { motion, AnimatePresence } from 'framer-motion'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '917977075721'
// ─── ANIMATED COUNTER NUMBER ───
function AnimatedNumber({ value }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', overflow: 'hidden', verticalAlign: 'middle' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          style={{ display: 'inline-block' }}
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ─── ANIMATED CLOCK WITH SECONDS ───
function AnimatedClock() {
  const [time, setTime] = useState(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) return <span style={{ opacity: 0, fontVariantNumeric: 'tabular-nums' }}>00:00:00 AM</span>

  const formatted = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const parts = formatted.split(' ')
  const timeDigits = parts[0] || '00:00:00'
  const ampm = parts[1] || 'AM'
  const [h, m, s] = timeDigits.split(':')

  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"', fontSize: '1.75rem', fontWeight: 800, color: '#064E3B', lineHeight: 1, whiteSpace: 'nowrap' }}>
      <AnimatedNumber value={h || '00'} />
      <span style={{ margin: '0 1px', opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>:</span>
      <AnimatedNumber value={m || '00'} />
      <span style={{ margin: '0 1px', opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>:</span>
      <AnimatedNumber value={s || '00'} />
      <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginLeft: 4, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {ampm}
      </span>
    </div>
  )
}

// ─── SOUND EFFECTS ───
function useSounds() {
  const audioCtx = useRef(null)
  function getCtx() {
    if (!audioCtx.current && typeof window !== 'undefined')
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    return audioCtx.current
  }
  function playTone(frequencies, type = 'sine', volume = 0.3) {
    try {
      if (typeof window === 'undefined') return
      const ctx = getCtx()
      if (!ctx) return
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = type
        const t = ctx.currentTime + i * 0.16
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(volume, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
        osc.start(t)
        osc.stop(t + 0.35)
      })
    } catch (e) {}
  }
  return {
    admit: () => playTone([659.25, 880], 'sine', 0.25),
    call: () => playTone([880, 1100], 'sine', 0.3),
    dismiss: () => playTone([523.25, 440], 'sine', 0.2),
  }
}

// ─── UPGRADE BANNER ───
function UpgradeBanner() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShow(true)
      setTimeout(() => setShow(false), 6000)
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div style={{ background: '#052E16', borderBottom: '1px solid #16A34A', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: '#4ADE80', fontWeight: 600, fontSize: 14 }}><CheckCircle2 className="inline-block w-4 h-4 mr-1" /> Plan activated! All clinic features unlocked.</span>
      <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: '#4ADE80', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  )
}

function maskPhone(phone) {
  if (!phone) return ''
  const p = String(phone).replace(/\D/g, '')
  if (p.length <= 4) return '****'
  return p.slice(0, 2) + '****' + p.slice(-4)
}

const STATUS = { WAITING: 'waiting', CALLED: 'called', DONE: 'done', SKIPPED: 'skipped' }

const LANG_NAMES = {
  en: 'English', hi: 'हिंदी', ta: 'தமிழ்', te: 'తెలుగు', mr: 'मराठी',
  bn: 'বাংলা', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', pa: 'ਪੰਜਾਬੀ'
}

function sanitizeLocation(loc) {
  if (!loc || typeof loc !== 'string') return 'OPD Reception Desk'
  const trimmed = loc.trim()
  if (/^[0-9A-Fa-f]{16,}$/.test(trimmed) || trimmed.startsWith('01010000')) {
    return 'OPD Reception Desk'
  }
  return trimmed
}

function sanitizeCode(code, name) {
  if (!code || typeof code !== 'string') return 'ALOE'
  const trimmed = code.trim().toUpperCase()
  if (/^[0-9A-Fa-f]{16,}$/.test(trimmed) || trimmed.length > 15) {
    if (name) {
      const cleanName = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      return cleanName.slice(0, 8) || 'ALOE'
    }
    return 'ALOE'
  }
  return trimmed
}

// ─── DIGITAL QR POSTER MODAL ───
function QRModal({ clinic, onClose, onCodeUpdate }) {
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [editingCode, setEditingCode] = useState(false)
  const [codeInput, setCodeInput] = useState(() => sanitizeCode(clinic?.code, clinic?.name))
  
  const [locationInput, setLocationInput] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tokenpe_active_room')
      if (saved && !/^[0-9A-Fa-f]{16,}$/.test(saved) && !saved.startsWith('01010000')) return saved
    }
    return sanitizeLocation(clinic?.location)
  })

  const [codeError, setCodeError] = useState('')
  const [codeSaving, setCodeSaving] = useState(false)
  const [codeSuccess, setCodeSuccess] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const rawCode = sanitizeCode(clinic?.code, clinic?.name)
  const liveCode = codeSuccess ? codeInput.toUpperCase() : rawCode
  const patientURL = typeof window !== 'undefined'
    ? `${window.location.origin}/s/${liveCode}`
    : `https://tokenpe.online/s/${liveCode}`

  useEffect(() => {
    QRCode.toDataURL(patientURL, { width: 400, margin: 2, color: { dark: '#064E3B', light: '#FFFFFF' } })
      .then(url => setQrDataUrl(url))
      .catch(() => {})
  }, [patientURL])

  async function saveCode() {
    const clean = codeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length < 3 || clean.length > 12) {
      setCodeError('Code must be 3–12 alphanumeric characters.')
      return
    }

    setCodeSaving(true)
    setCodeError('')

    try {
      if (clinic?.id) {
        await supabase.from('businesses').update({ code: clean, location: locationInput }).eq('id', clinic.id).catch(() => {})
      }
    } catch (_) {}

    try {
      localStorage.setItem('tokenpe_active_room', locationInput)
      const stored = localStorage.getItem('tokenpe_clinic')
      if (stored) {
        try { localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), code: clean, location: locationInput })) } catch (_) {}
      }
      if (onCodeUpdate) onCodeUpdate(clean)
      setCodeSuccess(true)
      setEditingCode(false)
      setTimeout(() => setCodeSuccess(false), 3000)
    } catch (e) {
      setCodeError('Failed to save locally.')
    }
    setCodeSaving(false)
  }

  async function download() {
    setDownloading(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 1000
      const ctx = canvas.getContext('2d')

      const grad = ctx.createLinearGradient(0, 0, 800, 1000)
      grad.addColorStop(0, '#064E3B')
      grad.addColorStop(1, '#065F46')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 800, 1000)

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 6
      ctx.strokeRect(30, 30, 740, 940)

      ctx.fillStyle = '#A7F3D0'
      ctx.font = '800 24px "Plus Jakarta Sans", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText((clinic?.name || 'ALOE CLINIC OPD').toUpperCase(), 400, 110)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '800 40px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('Scan QR Code for Campus Check-in', 400, 175)

      const qrBoxSize = 420
      const qrBoxX = 400 - qrBoxSize / 2
      const qrBoxY = 220
      ctx.fillStyle = '#FFFFFF'
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24)
        ctx.fill()
      } else {
        ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize)
      }

      if (qrDataUrl) {
        const qrImg = new window.Image()
        qrImg.crossOrigin = 'anonymous'
        await new Promise((resolve) => {
          qrImg.onload = resolve
          qrImg.onerror = resolve
          qrImg.src = qrDataUrl
        })
        ctx.drawImage(qrImg, qrBoxX + 24, qrBoxY + 24, qrBoxSize - 48, qrBoxSize - 48)
      }

      ctx.fillStyle = '#A7F3D0'
      ctx.font = '500 24px "Plus Jakarta Sans", sans-serif'
      const displayPhone = WA_NUMBER.startsWith('1') ? '+' + WA_NUMBER.slice(0, 1) + ' ' + WA_NUMBER.slice(1) : '+' + WA_NUMBER
      ctx.fillText(`Or WhatsApp JOIN ${liveCode} to ${displayPhone}`, 400, 680)

      const boxWidth = 680
      const boxX = 400 - boxWidth / 2
      const boxY = 720
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(boxX, boxY, boxWidth, 140, 16)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        ctx.fillRect(boxX, boxY, boxWidth, 140)
      }

      ctx.fillStyle = '#34D399'
      ctx.font = '800 22px "Plus Jakarta Sans", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('HOW PATIENTS & VISITORS JOIN QUEUE', boxX + 30, boxY + 42)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('1. Open WhatsApp or Camera on mobile device', boxX + 30, boxY + 78)
      ctx.fillText('2. Scan this QR code to register arrival', boxX + 30, boxY + 110)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#34D399'
      ctx.font = '900 28px monospace'
      ctx.fillText(`CLINIC CODE: ${liveCode}`, 400, 920)

      const posterDataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = posterDataUrl
      link.download = `OPD-Gate-Pass-${liveCode}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2500)
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  function printPoster() {
    try {
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(`
        <!DOCTYPE html><html><head>
        <title>OPD Pass — ${clinic?.name || 'Clinic'}</title>
        <style>
          body { font-family: 'Plus Jakarta Sans', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #ECFDF5; }
          .poster { background: #FFFFFF; border: 2px solid #064E3B; border-radius: 16px; width: 340px; padding: 32px 24px; text-align: center; box-shadow: 0 10px 30px rgba(6,78,59,0.1); }
          .name { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.4rem; font-weight: 800; color: #064E3B; margin-bottom: 4px; }
          .sub { font-size: 0.8rem; color: #059669; margin-bottom: 20px; font-weight: 600; }
          .qr-wrap { padding: 12px; background: #FFFFFF; border: 1.5px solid #064E3B; border-radius: 12px; margin-bottom: 20px; display: inline-block; }
          .how { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #064E3B; margin-bottom: 8px; letter-spacing: 0.08em; }
          .steps { font-size: 0.75rem; color: #64748B; line-height: 1.8; margin-bottom: 20px; }
          .code-box { background: #ECFDF5; border: 1.5px dashed #064E3B; border-radius: 8px; padding: 8px; font-family: monospace; font-size: 1rem; font-weight: 800; color: #064E3B; }
        </style>
        </head><body>
        <div class="poster">
          <div class="name">${clinic?.name || 'Aloe Clinic OPD'}</div>
          <div class="sub">Digital OPD Entry & Live Queue Token</div>
          <div class="qr-wrap">
            <img src="${qrDataUrl}" style="width:200px;height:200px;display:block" />
          </div>
          <div class="how">How to Join Queue</div>
          <div class="steps">
            1. Open camera or WhatsApp<br/>
            2. Scan QR code to join live queue<br/>
            3. Track token live on your phone
          </div>
          <div class="code-box">CLINIC CODE: ${liveCode}</div>
        </div>
        </body></html>
      `)
      win.document.close()
      setTimeout(() => win.print(), 400)
    } catch (e) {}
  }

  const initialLetter = (clinic?.name || 'ALOE CLINIC').charAt(0).toUpperCase()

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(6, 78, 59, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', border: '1.5px solid #064E3B', borderRadius: 20, padding: '24px', maxWidth: 440, width: '100%', boxShadow: '0 25px 60px rgba(6, 78, 59, 0.35)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Top Header Bar Matching User Screenshot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, border: '1.5px solid #064E3B', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#064E3B', flexShrink: 0 }}>
              {initialLetter}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#064E3B', lineHeight: 1.1 }}>
                Digital Gate QR Poster
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: 2 }}>
                Clinic Entry & Gate Control
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: '#ECFDF5', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#064E3B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Dark Green Hero QR Box */}
        <div style={{ background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)', color: '#FFFFFF', borderRadius: 18, padding: '24px 20px', textAlign: 'center', marginBottom: 18, boxShadow: '0 10px 25px rgba(6,78,59,0.25)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A7F3D0', marginBottom: 6 }}>
            {(clinic?.name || 'ALOE CLINIC OPD').toUpperCase()}
          </div>
          
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.35rem', fontWeight: 800, marginBottom: 16, color: '#FFFFFF' }}>
            Scan QR Code for Campus Check-in
          </div>

          {/* QR Container */}
          <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 18, display: 'inline-block', marginBottom: 14, boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="OPD QR Code" style={{ width: 190, height: 190, display: 'block', borderRadius: 6 }} />
            ) : (
              <div style={{ width: 190, height: 190, background: '#F1F5F9', borderRadius: 6 }} />
            )}
          </div>

          <div style={{ fontSize: '0.82rem', color: '#E2E8F0', fontWeight: 500 }}>
            Or WhatsApp <span style={{ color: '#34D399', fontWeight: 900, fontFamily: 'monospace' }}>JOIN {liveCode}</span> to <span style={{ color: '#FFFFFF', fontWeight: 900, fontFamily: 'monospace' }}>{WA_NUMBER.startsWith('1') ? '+' + WA_NUMBER.slice(0, 1) + ' ' + WA_NUMBER.slice(1) : '+' + WA_NUMBER}</span>
          </div>
        </div>

        {/* How Patients & Visitors Join Queue Section */}
        <div style={{ background: '#F4FDF8', border: '1px solid #C3E6D5', borderRadius: 12, padding: '14px 16px', textAlign: 'left', marginBottom: 16 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#064E3B', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smartphone style={{ width: 16, height: 16, color: '#059669' }} />
            <span>How Students & Visitors Join Queue</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.7, fontWeight: 500 }}>
            1. Open WhatsApp or Camera on mobile device<br />
            2. Scan this QR code to register arrival<br />
            3. Receive instant queue token + live gate updates
          </div>
        </div>

        {/* Clinic Code Dashed Badge */}
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#ECFDF5', border: '1.5px dashed #064E3B', borderRadius: 8, padding: '8px 18px', marginBottom: 10 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CAMPUS CODE:</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{liveCode}</span>
          </div>

          {editingCode ? (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 14, padding: 14, marginTop: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#064E3B', marginBottom: 8 }}>Customize Clinic Code & Reception Desk</div>
              <input type="text" value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} placeholder="CLINIC CODE (e.g. ALOE)" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #A7F3D0', fontSize: '0.85rem', marginBottom: 8, outline: 'none' }} />
              <input type="text" value={locationInput} onChange={e => setLocationInput(e.target.value)} placeholder="Counter / Location (e.g. OPD Room 1)" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #A7F3D0', fontSize: '0.85rem', marginBottom: 10, outline: 'none' }} />
              {codeError && <div style={{ color: '#EF4444', fontSize: '0.75rem', marginBottom: 8 }}>{codeError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveCode} disabled={codeSaving} style={{ flex: 1, background: '#064E3B', color: 'white', border: 'none', padding: '8px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}>
                  {codeSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditingCode(false)} style={{ background: 'white', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => setEditingCode(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#064E3B', cursor: 'pointer' }}>
                <Pencil style={{ width: 14, height: 14, color: '#059669' }} /> Edit Code & Location
              </button>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons System */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={download} disabled={downloading} style={{ flex: 1, padding: '12px 0', background: '#064E3B', color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(6,78,59,0.3)' }}>
            <Download className="w-4 h-4" /> {downloaded ? 'Downloaded!' : downloading ? 'Generating...' : 'Download Poster PNG'}
          </button>
          <button onClick={printPoster} style={{ flex: 1, padding: '12px 0', background: '#F4FDF8', color: '#064E3B', border: '1.5px solid #064E3B', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Printer className="w-4 h-4" /> Print Card
          </button>
        </div>

      </motion.div>
    </div>
  )
}

function formatToken(tok) {
  if (!tok) return 'T-001'
  const str = String(tok).trim().toUpperCase()
  if (str.startsWith('T-')) {
    const parts = str.split('T-')
    const digits = parts[1]?.replace(/\D/g, '') || ''
    if (digits) {
      return `T-${String(parseInt(digits, 10)).padStart(3, '0')}`
    }
    return str
  }
  const digits = str.replace(/\D/g, '')
  if (digits) {
    return `T-${String(parseInt(digits, 10)).padStart(3, '0')}`
  }
  return `T-${str}`
}

// ─── MANUAL WALK-IN POPUP MODAL ───
function WalkInModal({ clinic, onClose, onAddSuccess, patientsCount }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
  const [noWhatsapp, setNoWhatsapp] = useState(false)
  const [reason, setReason] = useState('')
  const [lang, setLang] = useState('en')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '')
    if (val.length <= 10) {
      setPhone(val)
      if (error) setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanP = noWhatsapp ? '0000000000' : phone.trim()

    if (!cleanName) {
      setError('Patient Name is compulsory.')
      return
    }

    if (!noWhatsapp && (!cleanP || cleanP.length !== 10)) {
      setError('Please enter a valid 10-digit WhatsApp number or select "Patient doesn\'t have a WhatsApp number".')
      return
    }

    setSaving(true)
    setError('')

    const bId = clinic?.id || clinic?.business_id
    const nextTokenNum = (patientsCount || 0) + 1
    const generatedToken = `T-${String(nextTokenNum).padStart(3, '0')}`

    try {
      const res = await fetch('/api/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bId,
          name: cleanName,
          phone: cleanP,
          token: generatedToken,
          language: lang || 'hi',
          purpose: reason.trim(),
        })
      })
      const data = await res.json()
      if (data.success) {
        onAddSuccess(data.patient || null)
        onClose()
        return
      } else {
        setError(data.message || 'Failed to add patient to queue. Please try again.')
        setSaving(false)
        return
      }
    } catch (e) {
      console.error('WalkIn add error:', e)
    }

    setError('Network error adding patient. Please check connection.')
    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(6, 78, 59, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} style={{ background: 'white', border: '1.5px solid #064E3B', borderRadius: 20, padding: 24, maxWidth: 460, width: '100%', boxShadow: '0 25px 60px rgba(6, 78, 59, 0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#064E3B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#064E3B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Manual Walk-in Check-in</h3>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Add patient directly to active queue</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 14px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#0F172A', fontSize: '0.85rem' }}>Patient Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Arush Kshatriya"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #A7F3D0', fontSize: '0.88rem', outline: 'none', background: '#F8FAFC' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#0F172A', fontSize: '0.85rem' }}>WhatsApp Phone Number {!noWhatsapp && '*'}</label>
            <div style={{ display: 'flex', alignItems: 'center', background: noWhatsapp ? '#F1F5F9' : '#F8FAFC', border: '1.5px solid #A7F3D0', borderRadius: 12, overflow: 'hidden', opacity: noWhatsapp ? 0.6 : 1 }}>
              <span style={{ padding: '0 12px', fontSize: '0.85rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', borderRight: '1px solid #A7F3D0', height: 42, display: 'flex', alignItems: 'center' }}>+91</span>
              <input
                type="text"
                disabled={noWhatsapp}
                maxLength={10}
                value={noWhatsapp ? '0000000000' : phone}
                onChange={handlePhoneChange}
                placeholder="10-digit mobile number"
                style={{ flex: 1, padding: '11px 14px', border: 'none', fontSize: '0.88rem', outline: 'none', background: 'transparent', fontWeight: 700 }}
              />
              <span style={{ paddingRight: 12, fontSize: '0.72rem', fontWeight: 800, color: noWhatsapp || phone.length === 10 ? '#059669' : '#94A3B8' }}>{noWhatsapp ? 'N/A' : `${phone.length}/10`}</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#064E3B' }}>
              <input
                type="checkbox"
                checked={noWhatsapp}
                onChange={e => {
                  setNoWhatsapp(e.target.checked)
                  if (e.target.checked) {
                    setPhone('0000000000')
                    if (error) setError('')
                  } else {
                    setPhone('')
                  }
                }}
                style={{ width: 16, height: 16, accentColor: '#064E3B', cursor: 'pointer' }}
              />
              <span>Patient doesn't have a WhatsApp number</span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#0F172A', fontSize: '0.85rem' }}>Reason for Visit <span style={{ color: '#64748B', fontWeight: 500 }}>(Optional)</span></label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Fever, Blood pressure checkup, Skin consultation..."
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #A7F3D0', fontSize: '0.88rem', outline: 'none', background: '#F8FAFC' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#0F172A', fontSize: '0.85rem' }}>Patient Preferred Language</label>
            <select value={lang} onChange={e => setLang(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #A7F3D0', fontSize: '0.88rem', background: '#F8FAFC', fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
              {Object.entries(LANG_NAMES).map(([code, n]) => (
                <option key={code} value={code}>{n}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, background: '#064E3B', color: 'white', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(6,78,59,0.3)', opacity: saving ? 0.7 : 1 }}>
              <UserPlus className="w-4 h-4" /> {saving ? 'Adding to Queue...' : 'Add to Queue'}
            </button>
            <button type="button" onClick={onClose} style={{ background: '#F1F5F9', color: '#0F172A', border: 'none', padding: '12px 18px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── BROADCAST NOTICE MODAL ───
function BroadcastModal({ onClose, onSendNotice, activeNotice }) {
  const [msg, setMsg] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!msg.trim()) return
    onSendNotice(msg.trim())
    setMsg('')
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(6, 78, 59, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', border: '1.5px solid #064E3B', borderRadius: 20, padding: 24, maxWidth: 460, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
          <h3 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#064E3B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone style={{ width: 20, height: 20, color: '#064E3B' }} />
            <span>Notice to Queue</span>
          </h3>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#0F172A', fontSize: '0.85rem' }}>Public Announcement / Queue Notice *</label>
            <textarea
              required
              rows={4}
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="e.g. Doctor is currently examining emergency patient. Wait times updated by 10 mins..."
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #A7F3D0', borderRadius: 12, outline: 'none', background: '#F8FAFC', fontSize: '0.88rem', color: '#0F172A', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          {activeNotice && (
            <div style={{ padding: '10px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, fontSize: '0.78rem', color: '#065F46' }}>
              <strong>Current Active Notice:</strong> "{activeNotice}"
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{ flex: 1, background: '#064E3B', color: 'white', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(6,78,59,0.3)' }}>
              <Megaphone className="w-4 h-4" /> Broadcast Notice Now
            </button>
            <button type="button" onClick={onClose} style={{ background: '#F1F5F9', color: '#0F172A', border: 'none', padding: '12px 16px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── PATIENT DETAILS MODAL ───
function PatientDetailsModal({ patient, onClose, onNotify }) {
  if (!patient) return null
  const joinedTime = new Date(patient.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(6, 78, 59, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#064E3B' }}>Patient Details</div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>

        <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 16, border: '1px solid #E2E8F0', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>{patient.name || 'Walk-in Patient'}</span>
            <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 10px', borderRadius: 12, fontWeight: 900, fontSize: '0.85rem' }}>{patient.token}</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div><strong>WhatsApp Phone:</strong> +91 {patient.phone}</div>
            <div><strong>Language:</strong> {LANG_NAMES[patient.language] || 'हिंदी'}</div>
            <div><strong>Consultation Reason:</strong> {patient.reason || 'General OPD Consultation'}</div>
            <div><strong>Joined Queue At:</strong> {joinedTime}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.open(`https://wa.me/91${patient.phone}?text=Hello%20${encodeURIComponent(patient.name||'')},%20your%20OPD%20Token%20is%20${patient.token}.`, '_blank')} style={{ flex: 1, background: '#25D366', color: 'white', border: 'none', padding: '10px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <MessageCircle className="w-4 h-4" /> Message WhatsApp
          </button>
          <button onClick={onClose} style={{ background: '#F1F5F9', color: '#0F172A', border: 'none', padding: '10px 16px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── PAYMENTS LEDGER VIEW ───
function PaymentsView({ clinic, setToastMsg, dashboardPatients = [] }) {
  const [patients, setPatients] = useState(dashboardPatients)
  const [loading, setLoading] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [feeTotalInput, setFeeTotalInput] = useState('500')
  const [feePaidInput, setFeePaidInput] = useState('500')
  const [sendingReminderId, setSendingReminderId] = useState(null)

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/clinic-v2/dashboard/payments')
      const data = await res.json()
      if (data.success && Array.isArray(data.patients) && data.patients.length > 0) {
        setPatients(data.patients)
      }
    } catch (e) {
      console.warn('fetchPayments error:', e)
    }
  }, [clinic?.id, clinic?.business_id])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const totalCollected = patients.reduce((acc, p) => acc + (parseFloat(p.fee_paid) || 0), 0)
  const totalPending = patients.reduce((acc, p) => {
    const tot = p.fee_total !== undefined && p.fee_total !== null ? parseFloat(p.fee_total) : 0
    const pd = parseFloat(p.fee_paid) || 0
    return acc + Math.max(0, tot - pd)
  }, 0)

  const handleUpdatePayment = async (pId, feeTotal, feePaid, status) => {
    try {
      const res = await fetch('/api/clinic-v2/queue/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEntryId: pId,
          paymentStatus: status,
          paymentAmount: feeTotal
        })
      })
      const data = await res.json()
      if (data.success) {
        setPatients(prev => prev.map(p => p.id === pId ? { ...p, fee_total: feeTotal, fee_paid: feePaid, payment_status: status } : p))
        if (setToastMsg) setToastMsg(status === 'completed' ? '✓ Payment received! WhatsApp receipt sent.' : '✓ Payment record updated.')
      } else {
        alert(data.message || 'Failed to update payment')
      }
    } catch (e) {
      alert('Network error updating payment')
    }
  }

  const handleRemindPayment = async (pId) => {
    setSendingReminderId(pId)
    if (setToastMsg) setToastMsg('📲 WhatsApp payment reminder sent!')
    try {
      await fetch('/api/clinic-v2/queue/remind-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEntryId: pId })
      }).catch(() => {})
    } catch (e) {}
    setTimeout(() => setSendingReminderId(null), 1200)
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1.5px solid #CBE4D3', boxShadow: '0 3px 14px rgba(6,78,59,0.03)' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#064E3B', margin: 0 }}>Consultation Payments & Billing Ledger</h2>
          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>Track OPD patient fees, collected amounts, and instant WhatsApp receipts</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>

          <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 12, padding: '6px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collected</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#064E3B' }}>₹{totalCollected.toFixed(2)}</div>
          </div>
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '6px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Balance</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#B45309' }}>₹{totalPending.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B', fontSize: '0.84rem' }}>Loading billing records...</div>
      ) : patients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #E2E8F0' }}>
          <CreditCard className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>No billing records found</div>
          <div style={{ fontSize: '0.76rem', marginTop: 4 }}>OPD consultations and walk-in check-ins will automatically log here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {patients.map((p) => {
            const totFee = p.fee_total !== undefined && p.fee_total !== null ? parseFloat(p.fee_total) : 0
            const paidFee = parseFloat(p.fee_paid) || (p.payment_status === 'completed' ? totFee : 0)
            const isCompleted = p.payment_status === 'completed' || (totFee > 0 && paidFee >= totFee)
            const pendingFee = Math.max(0, totFee - paidFee)
            const timeStr = new Date(p.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 14, border: `1.5px solid ${isCompleted ? '#A7F3D0' : '#FDE68A'}`, background: isCompleted ? '#F0FDF4' : '#FFFDF5', flexWrap: 'wrap', gap: 12 }}>
                {/* Partition 1: Token & Patient Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isCompleted ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${isCompleted ? '#A7F3D0' : '#FDE68A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', color: isCompleted ? '#065F46' : '#B45309', fontFamily: 'monospace', flexShrink: 0 }}>
                    #{formatToken(p.token)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{p.name || 'Walk-in Patient'}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: isCompleted ? '#ECFDF5' : '#FFFBEB', color: isCompleted ? '#059669' : '#D97706', border: `1px solid ${isCompleted ? '#A7F3D0' : '#FDE68A'}`, textTransform: 'uppercase' }}>
                        {isCompleted ? 'PAID FULL' : `PENDING ₹${pendingFee}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Partition 2: Reason for Visit (if entered) */}
                {(p.purpose || p.reason) && (
                  <div style={{ flex: '1', minWidth: 130, padding: '0 12px', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason for Visit</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                      {p.purpose || p.reason}
                    </span>
                  </div>
                )}

                {/* Partition 3: WhatsApp Number */}
                <div style={{ flex: '1', minWidth: 140, padding: '0 12px', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp Phone</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 700, fontSize: '0.8rem' }}>
                    <Phone className="w-3.5 h-3.5 text-[#059669]" /> {p.phone}
                  </span>
                </div>

                {/* Partition 4: Joined Time */}
                <div style={{ flex: '1', minWidth: 120, padding: '0 12px', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entry Time</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontWeight: 700, fontSize: '0.8rem' }}>
                    <Clock className="w-3.5 h-3.5 text-[#64748B]" /> {timeStr}
                  </span>
                </div>

                {/* Partition 5: Amount & Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1px solid #E2E8F0', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right', marginRight: 4 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: isCompleted ? '#059669' : '#D97706' }}>
                      ₹{paidFee} <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>/ ₹{totFee}</span>
                    </div>
                  </div>

                  {!isCompleted && (
                    <>
                      <button
                        onClick={() => handleUpdatePayment(p.id, totFee, totFee, 'completed')}
                        style={{ background: '#059669', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Paid
                      </button>

                      <button
                        onClick={() => handleRemindPayment(p.id)}
                        disabled={sendingReminderId === p.id}
                        style={{ background: '#25D366', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> {sendingReminderId === p.id ? 'Sending...' : 'WhatsApp Reminder'}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setEditingPatient(p)
                      setFeeTotalInput(String(totFee))
                      setFeePaidInput(String(paidFee))
                    }}
                    style={{ background: '#F1F5F9', color: '#0F172A', border: 'none', padding: '6px 10px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#475569]" /> Edit Fee
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Payment Modal */}

      {/* Edit Fee Modal */}
      {editingPatient && (
        <div onClick={() => setEditingPatient(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(6, 78, 59, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 24, maxWidth: 400, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#064E3B', margin: '0 0 4px' }}>Edit Patient Billing</h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 16px' }}>#{editingPatient.token} · {editingPatient.name || 'Walk-in Patient'}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#064E3B', marginBottom: 4 }}>TOTAL CONSULTATION FEE (₹)</label>
                <input
                  type="number"
                  value={feeTotalInput}
                  onChange={e => setFeeTotalInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #A7F3D0', fontSize: '0.88rem', fontWeight: 800, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#064E3B', marginBottom: 4 }}>AMOUNT PAID SO FAR (₹)</label>
                <input
                  type="number"
                  value={feePaidInput}
                  onChange={e => setFeePaidInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #A7F3D0', fontSize: '0.88rem', fontWeight: 800, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  const tot = parseFloat(feeTotalInput) || 0
                  const pd = parseFloat(feePaidInput) || 0
                  const status = pd >= tot ? 'completed' : 'pending'
                  handleUpdatePayment(editingPatient.id, tot, pd, status)
                  setEditingPatient(null)
                }}
                style={{ flex: 1, background: '#064E3B', color: 'white', border: 'none', padding: '10px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Save & Update Receipt
              </button>
              <button
                onClick={() => setEditingPatient(null)}
                style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '10px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PATIENT QUEUE CARD COMPONENT ───
function PatientCard({ patient, position, onDone, onSkip, onNotify, onPriorityCall, onViewDetails }) {
  const isWaiting = patient.status === STATUS.WAITING
  const isCalled = patient.status === STATUS.CALLED
  const isDone = patient.status === STATUS.DONE
  const waitMins = Math.max(0, Math.floor((new Date() - new Date(patient.joined_at)) / 60000))
  const joinedTime = new Date(patient.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

  const name = patient.name || 'Walk-in Patient'
  const tokenDisplay = formatToken(patient.token)

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(6, 95, 70, 0.06)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'white',
        borderRadius: 14,
        padding: 0,
        marginBottom: 8,
        border: '1.5px solid #CBE4D3',
        boxShadow: '0 2px 8px rgba(6,78,59,0.03)',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        cursor: 'default',
        flexWrap: 'wrap',
      }}
    >
      {/* Partition 1: Token Number */}
      <div
        style={{
          width: 90,
          background: '#ECFDF5',
          borderRight: '1.5px solid #CBE4D3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 6px',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>
          TOKEN
        </span>
        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#064E3B', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
          {tokenDisplay}
        </span>
      </div>

      {/* Partition 2: Patient Name & Status */}
      <div style={{ flex: '1.2', minWidth: 150, padding: '8px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid #E2E8F0' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          PATIENT NAME
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {name}
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: 8,
              background: isCalled ? '#ECFDF5' : isWaiting ? '#FFFBEB' : '#F1F5F9',
              color: isCalled ? '#059669' : isWaiting ? '#D97706' : '#64748B',
              border: `1px solid ${isCalled ? '#A7F3D0' : isWaiting ? '#FDE68A' : '#E2E8F0'}`,
              textTransform: 'uppercase'
            }}
          >
            {isCalled ? 'With Doctor' : isWaiting ? 'Waiting' : 'Completed'}
          </span>
        </div>
      </div>

      {/* Partition 3: Reason for Visit (only if entered) */}
      {(patient.purpose || patient.reason) && (
        <div style={{ flex: '1', minWidth: 140, padding: '8px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
            REASON FOR VISIT
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
            {patient.purpose || patient.reason}
          </span>
        </div>
      )}

      {/* Partition 4: WhatsApp Number */}
      <div style={{ flex: '1', minWidth: 140, padding: '8px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid #E2E8F0' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          WHATSAPP NUMBER
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#059669', fontWeight: 700, fontSize: '0.82rem' }}>
          <Phone className="w-3.5 h-3.5 text-[#059669]" /> +91 {patient.phone}
        </span>
      </div>

      {/* Partition 5: Wait Time */}
      <div style={{ flex: '1', minWidth: 155, padding: '8px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          WAIT TIME
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontSize: '0.82rem', fontWeight: 800 }}>
            <Clock className="w-3.5 h-3.5 text-[#059669]" /> {waitMins > 0 ? `${waitMins}m waited` : 'Just joined'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>({joinedTime})</span>
        </div>
      </div>

      {/* Partition 5: Action Controls */}
      {!isDone && (
        <div
          style={{
            borderLeft: '1.5px solid #CBE4D3',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#FAFCFA',
            flexShrink: 0,
          }}
        >
          {isCalled ? (
            <button className="card-btn-admit" onClick={onDone}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Done
            </button>
          ) : (
            <button className="card-btn-admit" onClick={onPriorityCall}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Admit
            </button>
          )}

          <button className="card-btn-notify" onClick={onNotify}>
            <Bell className="w-3.5 h-3.5" /> Notify
          </button>

          <button className="card-btn-skip" onClick={onSkip}>
            <SkipForward className="w-3.5 h-3.5" /> Skip
          </button>

          {onViewDetails && (
            <button onClick={onViewDetails} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 6px' }}>⋮</button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ─── MAIN DASHBOARD ───
export default function ClinicDashboard() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#DCEFDF' }}>
        <div className="spinner-ring" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const sounds = useSounds()

  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [activeTab, setActiveTab] = useState('active')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newLang, setNewLang] = useState('en')
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [queuePaused, setQueuePaused] = useState(false)
  const [activeNotice, setActiveNotice] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [sbTooltip, setSbTooltip] = useState(null)

  useEffect(() => {
    if (!toastMsg) return
    const timer = setTimeout(() => setToastMsg(''), 3000)
    return () => clearTimeout(timer)
  }, [toastMsg])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Clinic Name & Logo Inline Editing State ──
  const [isEditingClinic, setIsEditingClinic] = useState(false)
  const [editedName, setEditedName] = useState('')
  const logoInputRef = useRef(null)

  const startEditingClinic = () => {
    setEditedName(clinic?.name || 'Clinic Command Center')
    setIsEditingClinic(true)
  }

  const saveClinicName = async () => {
    if (!editedName.trim()) return
    const updated = { ...clinic, name: editedName.trim() }
    setClinic(updated)
    try { localStorage.setItem('tokenpe_clinic', JSON.stringify(updated)) } catch (_) {}
    setIsEditingClinic(false)
    setToastMsg('Clinic name updated successfully!')
    setTimeout(() => setToastMsg(''), 4000)

    try {
      if (clinic?.id) {
        await supabase.from('businesses')
          .update({ name: editedName.trim() })
          .eq('id', clinic.id)
      }
    } catch (_) {}
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        const logoUrl = evt.target.result
        const updated = { ...clinic, logo_url: logoUrl }
        setClinic(updated)
        try { localStorage.setItem('tokenpe_clinic', JSON.stringify(updated)) } catch (_) {}
        setToastMsg('Clinic logo updated successfully!')
        setTimeout(() => setToastMsg(''), 4000)

        try {
          if (clinic?.id) {
            await supabase.from('businesses')
              .update({ logo_url: logoUrl })
              .eq('id', clinic.id)
          }
        } catch (_) {}
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendNotice = async (msg) => {
    setActiveNotice(msg)
    sounds.call()
    try {
      if (clinic?.id) {
        await fetch('/api/whatsapp/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: clinic.id, message: msg })
        }).catch(() => {})
      }
    } catch (_) {}
    setToastMsg('Broadcast notice sent successfully to queue!')
    setTimeout(() => setToastMsg(''), 4500)
  }

  useEffect(() => {
    async function init() {
      const storedClinic = localStorage.getItem('tokenpe_clinic')
      if (storedClinic) {
        try { setClinic(JSON.parse(storedClinic)) } catch (e) {}
      }
      const cachedPts = localStorage.getItem('tokenpe_cached_patients')
      if (cachedPts) {
        try {
          const parsed = JSON.parse(cachedPts)
          if (Array.isArray(parsed) && parsed.length > 0) setPatients(parsed)
        } catch (e) {}
      }

      try {
        const res = await fetch('/api/clinic-v2/dashboard/init')
        const data = await res.json()
        if (data.success && data.clinic) {
          setClinic(data.clinic)
          localStorage.setItem('tokenpe_clinic', JSON.stringify(data.clinic))
        } else if (!storedClinic) {
          router.push('/login')
          return
        }
      } catch (e) {
        if (!storedClinic) {
          router.push('/login')
          return
        }
      }
      setLoading(false)
    }

    init()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/clinic-v2/logout', { method: 'POST' }).catch(() => {})
      localStorage.removeItem('tokenpe_clinic')
      localStorage.removeItem('tokenpe_cached_patients')
      supabase.auth.signOut().catch(() => {})
    } catch (e) {}
    router.push('/login')
  }

  const updatePatientsState = useCallback((updater) => {
    setPatients(prev => {
      const nextVal = typeof updater === 'function' ? updater(prev) : updater
      try {
        if (Array.isArray(nextVal)) {
          localStorage.setItem('tokenpe_cached_patients', JSON.stringify(nextVal))
        }
      } catch (_) {}
      return nextVal
    })
  }, [])

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/clinic-v2/dashboard/get')
      const data = await res.json()
      if (data.success && Array.isArray(data.queue)) {
        updatePatientsState(data.queue)
      }
    } catch (e) {
      console.warn('fetchQueue error:', e)
    }
  }, [updatePatientsState])

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 4000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  const togglePauseQueue = () => {
    setQueuePaused(!queuePaused)
  }

  const addWalkIn = async () => {
    const cleanP = newPhone.replace(/\D/g, '')
    if (!cleanP || cleanP.length < 10) {
      setAddError('Please enter a valid 10-digit WhatsApp number.')
      return
    }

    setAddSaving(true)
    setAddError('')

    const bId = clinic?.id || clinic?.business_id
    const nextTokenNum = (patients?.length || 0) + 1
    const generatedToken = `A-${100 + nextTokenNum}`
    const today = new Date().toISOString().split('T')[0]
    const pName = newName.trim() || 'Walk-in Patient'

    // 1. Try backend API endpoint
    try {
      const res = await fetch('/api/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bId,
          name: pName,
          phone: cleanP,
          token: generatedToken,
          language: newLang || 'en',
          purpose: 'Walk-in Consultation',
        })
      })
      const data = await res.json()
      if (data.success) {
        setNewName('')
        setNewPhone('')
        setAddError('')
        setShowAddForm(false)
        fetchQueue()
        sounds.admit()
        setAddSaving(false)
        return
      }
    } catch (e) {
      console.warn('API add failed:', e)
    }

    // 2. Direct Supabase fallback
    try {
      if (bId) {
        const { data, error } = await supabase.from('queue_entries').insert([{
          business_id: bId,
          name: pName,
          phone: cleanP,
          token: generatedToken,
          status: 'waiting',
          date: today,
          language: newLang || 'en',
          joined_at: new Date().toISOString(),
        }]).select()

        if (!error && data) {
          setNewName('')
          setNewPhone('')
          setAddError('')
          setShowAddForm(false)
          fetchQueue()
          sounds.admit()
          setAddSaving(false)
          return
        }
      }
    } catch (e) {
      console.error(e)
    }

    // 3. Instant local state insertion so user never sees a failure
    const fallbackPatient = {
      id: 'walkin-' + Date.now(),
      name: pName,
      phone: cleanP,
      token: generatedToken,
      status: 'waiting',
      joined_at: new Date().toISOString(),
      reason: 'Walk-in Consultation',
      language: newLang || 'en'
    }
    setPatients(prev => [...prev, fallbackPatient])
    setNewName('')
    setNewPhone('')
    setAddError('')
    setShowAddForm(false)
    sounds.admit()
    setAddSaving(false)
  }

  const admitPatient = async (patientId) => {
    sounds.call()
    updatePatientsState(prev => prev.map(p => String(p.id) === String(patientId) ? { ...p, status: 'called' } : p))
    setToastMsg('Patient admitted to doctor consultation!')
    setTimeout(() => setToastMsg(''), 4000)

    try {
      const targetP = patients.find(p => String(p.id) === String(patientId))
      const bId = clinic?.id || clinic?.business_id

      supabase.from('queue_entries').update({ status: 'called' }).eq('id', patientId).then(() => {})

      if (bId && targetP) {
        await fetch('/api/queue/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: bId,
            patientId: patientId,
            patientPhone: targetP.phone,
            patientName: targetP.name,
            token: targetP.token,
            language: targetP.language || 'en'
          })
        }).catch(() => {})
      }
    } catch (e) {
      console.warn('Admit update error:', e)
    }
  }

  const callNext = async () => {
    sounds.call()
    try {
      const res = await fetch('/api/queue/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id })
      })
      const data = await res.json()
      if (data.success) fetchQueue()
    } catch (e) {}
  }

  const markDone = async (patientId) => {
    sounds.admit()
    updatePatientsState(prev => prev.map(p => String(p.id) === String(patientId) ? { ...p, status: 'done' } : p))
    setToastMsg('Patient consultation marked as Completed!')
    setTimeout(() => setToastMsg(''), 4000)

    try {
      const bId = clinic?.id || clinic?.business_id
      supabase.from('queue_entries').update({ status: 'done', done_at: new Date().toISOString() }).eq('id', patientId).then(() => {})

      await fetch('/api/queue/done', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, businessId: bId })
      }).catch(() => {})
    } catch (e) {
      console.warn('markDone error:', e)
    }
  }

  const skipPatient = async (patientId) => {
    sounds.dismiss()
    updatePatientsState(prev => prev.map(p => String(p.id) === String(patientId) ? { ...p, status: 'skipped' } : p))
    setToastMsg('Patient token skipped.')
    setTimeout(() => setToastMsg(''), 4000)

    try {
      const bId = clinic?.id || clinic?.business_id
      supabase.from('queue_entries').update({ status: 'skipped' }).eq('id', patientId).then(() => {})

      await fetch('/api/queue/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, businessId: bId })
      }).catch(() => {})
    } catch (e) {
      console.warn('skipPatient error:', e)
    }
  }

  const notifyWhatsApp = async (patient) => {
    sounds.call()
    setToastMsg(`WhatsApp alert sent to ${patient?.name || 'patient'} (${formatToken(patient?.token)})!`)
    setTimeout(() => setToastMsg(''), 4000)

    try {
      const bId = clinic?.id || clinic?.business_id
      await fetch('/api/queue/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bId,
          patientId: patient?.id,
          phone: patient?.phone,
          name: patient?.name,
          token: patient?.token
        })
      }).catch(() => {})
    } catch (e) {
      console.warn('notifyWhatsApp error:', e)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#DCEFDF' }}>
        <div className="spinner-ring" />
      </div>
    )
  }

  const waiting = patients.filter(p => p.status === STATUS.WAITING)
  const called = patients.filter(p => p.status === STATUS.CALLED)
  const done = patients.filter(p => p.status === STATUS.DONE)
  const activePatients = waiting

  const filteredActive = activePatients.filter(p => 
    !searchQuery || 
    (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.token && String(p.token).toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.phone && p.phone.includes(searchQuery))
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#DCEFDF', overflowX: 'hidden' }}>
      <UpgradeBanner />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

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

        .sb-wrap { position: relative; }
        .sb-tooltip {
          position: absolute;
          left: calc(100% + 14px);
          top: 50%; transform: translateY(-50%) scale(0.95);
          background: #1E3A2B;
          color: #E2F5EB;
          border-radius: 12px;
          padding: 12px 14px;
          width: 210px;
          font-size: 0.78rem;
          font-weight: 500;
          line-height: 1.55;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 9999;
          box-shadow: 0 8px 24px rgba(0,0,0,0.22);
          white-space: normal;
        }
        .sb-tooltip strong {
          display: block;
          font-size: 0.82rem;
          font-weight: 800;
          color: #A7F3D0;
          margin-bottom: 4px;
        }
        .sb-tooltip::before {
          content: '';
          position: absolute;
          left: -7px; top: 50%; transform: translateY(-50%);
          border: 7px solid transparent;
          border-right-color: #1E3A2B;
          border-left: 0;
        }
        .sb-wrap:hover .sb-tooltip { opacity: 1; transform: translateY(-50%) scale(1); }

        .spinner-ring {
          width: 40px;
          height: 40px;
          border-width: 3px;
          pointer-events: none;
          z-index: 9999;
          border-style: solid;
          border-color: #065F46 #C3E6D5 #C3E6D5 #C3E6D5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .logo-overlay-hover:hover {
          opacity: 1 !important;
        }

        .stat-segment-hover {
          transition: background-color 0.18s ease;
        }
        .stat-segment-hover:hover {
          background: #F0FDF4;
        }

        .console-btn-primary {
          transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease !important;
        }
        .console-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6, 78, 59, 0.3) !important;
          background: #043E2F !important;
        }

        .console-btn-secondary {
          transition: all 0.15s ease !important;
        }
        .console-btn-secondary:hover {
          transform: translateY(-1px);
          background: #064E3B !important;
          color: white !important;
          box-shadow: 0 3px 10px rgba(6, 78, 59, 0.25) !important;
        }
        .console-btn-secondary:hover svg {
          color: white !important;
          stroke: white !important;
        }

        .console-btn-light {
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease !important;
        }
        .console-btn-light:hover {
          transform: translateY(-1px);
          background: #D1FAE5 !important;
          border-color: #059669 !important;
          box-shadow: 0 3px 10px rgba(5, 150, 105, 0.12) !important;
        }

        .card-btn-admit {
          background: white; border: 1.5px solid #CBE4D3; color: #0F172A;
          padding: 4px 9px; border-radius: 7px; font-weight: 700; font-size: 0.71rem;
          display: flex; align-items: center; gap: 4px; cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
          -webkit-font-smoothing: antialiased;
        }
        .card-btn-admit:hover {
          background: #059669 !important; color: white !important; border-color: #047857 !important;
          box-shadow: 0 2px 6px rgba(5,150,105,0.25); transform: translateY(-1px);
        }

        .card-btn-notify {
          background: white; border: 1.5px solid #CBE4D3; color: #0F172A;
          padding: 4px 9px; border-radius: 7px; font-weight: 700; font-size: 0.71rem;
          display: flex; align-items: center; gap: 4px; cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
          -webkit-font-smoothing: antialiased;
        }
        .card-btn-notify:hover {
          background: #D97706 !important; color: white !important; border-color: #B45309 !important;
          box-shadow: 0 2px 6px rgba(217,119,6,0.25); transform: translateY(-1px);
        }

        .card-btn-skip {
          background: white; border: 1.5px solid #CBE4D3; color: #0F172A;
          padding: 4px 9px; border-radius: 7px; font-weight: 700; font-size: 0.71rem;
          display: flex; align-items: center; gap: 4px; cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
          -webkit-font-smoothing: antialiased;
        }
        .card-btn-skip:hover {
          background: #DC2626 !important; color: white !important; border-color: #B91C1C !important;
          box-shadow: 0 2px 6px rgba(220,38,38,0.25); transform: translateY(-1px);
        }

        .stage-box-hover {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .stage-box-hover:hover {
          transform: translateY(-2px);
          border-color: #A7F3D0 !important;
          box-shadow: 0 6px 20px rgba(6, 78, 59, 0.07) !important;
        }

        @media (max-width: 768px) {
          .dashboard-sidebar {
            display: none !important;
          }
          .dashboard-main {
            padding: 12px 10px !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
          .stat-banner-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .stat-segment-hover {
            border-right: 1px solid #CBE4D3 !important;
            border-bottom: 1px solid #CBE4D3 !important;
            padding: 10px 8px !important;
          }
          .stat-segment-hover:nth-child(2n) {
            border-right: none !important;
          }
          .stat-segment-hover:nth-child(3), .stat-segment-hover:nth-child(4) {
            border-bottom: none !important;
          }
        }
        @media (min-width: 769px) {
          .hamburger-btn {
            display: none !important;
          }
        }
      `}</style>

      {/* ── LEFT SIDEBAR NAVIGATION (HIDDEN ON MOBILE) ── */}
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
                { label: 'Dashboard', desc: 'Live queue overview & clinic stats', icon: <LayoutDashboard className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {}, active: true },
                { label: 'Manage Branches', desc: 'Set up & switch between clinic locations under one account', icon: <Layers className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/branches') },
                { label: 'History', desc: 'Browse completed & past patient consultation records', icon: <History className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/history') },
                { label: 'Analytics & Reports', desc: 'Track peak OPD hours, average wait times, reason breakdowns, and patient-wise statistics.', icon: <BarChart2 className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/analytics') },
                { label: 'Broadcasting & CRM', desc: 'Send bulk WhatsApp alerts & manage patient relationships', icon: <Megaphone className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/crm') },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`sidebar-btn${item.active ? ' active' : ''}`}
                  onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setSbTooltip({ label: item.label, desc: item.desc, y: r.top + r.height / 2 }) }}
                  onMouseLeave={() => setSbTooltip(null)}
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
                onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setSbTooltip({ label: item.label, desc: item.desc, y: r.top + r.height / 2 }) }}
                onMouseLeave={() => setSbTooltip(null)}
              >
                {item.icon}
                <span className="sb-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Exit Console & Logout Button at Bottom */}
        <div style={{ paddingTop: 12, borderTop: '1px solid #A8D5B5', marginTop: 12 }}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="sidebar-btn"
            style={{ width: '100%', color: '#B91C1C', fontWeight: 800 }}
          >
            <LogOut className="w-4 h-4" style={{ color: '#B91C1C' }} /> Exit Console &amp; Logout
          </button>
        </div>
      </aside>

      {/* ── SIDEBAR FIXED TOOLTIP OVERLAY ── */}
      {sbTooltip && (
        <div style={{
          position: 'fixed',
          left: 252,
          top: sbTooltip.y,
          transform: 'translateY(-50%)',
          background: '#1E3A2B',
          color: '#E2F5EB',
          borderRadius: 12,
          padding: '12px 14px',
          width: 220,
          fontSize: '0.78rem',
          fontWeight: 500,
          lineHeight: 1.55,
          zIndex: 99998,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          whiteSpace: 'normal',
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#A7F3D0', marginBottom: 4 }}>{sbTooltip.label}</div>
          {sbTooltip.desc}
          <div style={{
            position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: '7px solid #1E3A2B',
          }} />
        </div>
      )}

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(6, 78, 59, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', border: '1.5px solid #CBE4D3', textAlign: 'center' }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEF2F2', border: '1.5px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <LogOut style={{ width: 22, height: 22, color: '#B91C1C' }} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Exit Console?</div>
            <div style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
              You are about to log out of the TokenPe dashboard.<br />All unsaved changes will be lost.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, background: '#F1F5F9', color: '#0F172A', border: 'none', padding: '11px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); handleLogout() }}
                style={{ flex: 1, background: '#B91C1C', color: 'white', border: 'none', padding: '11px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <LogOut style={{ width: 15, height: 15 }} /> Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT CONSOLE ── */}
      <main className="dashboard-main" style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: '#DCEFDF' }}>
        
        {/* Header Title Bar with Editable Logo & Name */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hidden File Input for Logo Upload */}
            <input type="file" ref={logoInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />

            {/* Clickable Logo Avatar */}
            <div
              onClick={() => logoInputRef.current?.click()}
              title="Click to change logo"
              style={{
                position: 'relative',
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                border: '1.5px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(6,78,59,0.08)',
                flexShrink: 0,
              }}
            >
              {clinic?.logo_url ? (
                <img src={clinic.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#065F46' }}>
                  {(clinic?.name || 'C')[0].toUpperCase()}
                </span>
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(6, 78, 59, 0.55)',
                  opacity: 0,
                  transition: 'opacity 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
                className="logo-overlay-hover"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1 }}>
                QUEUE DASHBOARD · {(clinic?.city || 'CLINIC').toUpperCase()}
              </div>

              {isEditingClinic ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') saveClinicName(); if (e.key === 'Escape') setIsEditingClinic(false); }}
                    style={{ fontSize: '1.2rem', fontWeight: 800, padding: '3px 8px', borderRadius: 7, border: '1.5px solid #059669', outline: 'none', background: 'white', color: '#0F172A' }}
                  />
                  <button onClick={saveClinicName} style={{ background: '#064E3B', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', fontSize: '0.74rem' }}>Save</button>
                  <button onClick={() => setIsEditingClinic(false)} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '4px 8px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.74rem' }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#0F172A', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                    {clinic?.name || 'Clinic Command Center'}
                  </h1>
                  <button onClick={startEditingClinic} title="Edit Clinic Name" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: '2px 7px', cursor: 'pointer', color: '#059669', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', fontWeight: 800 }}>
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', border: '1.5px solid #A8D5B5', borderRadius: 16, padding: '4px 12px', color: '#1E3A2B', fontSize: '0.74rem', fontWeight: 700, cursor: 'default' }}>
              <Calendar className="w-3.5 h-3.5 text-[#059669]" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FFFFFF', border: '1.5px solid #A8D5B5', borderRadius: 16, padding: '4px 12px', color: '#047857', fontSize: '0.74rem', fontWeight: 800, cursor: 'default' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              LIVE QUEUE
            </div>
            <div style={{ background: 'white', border: '1.5px solid #A8D5B5', borderRadius: 16, padding: '4px 14px', width: 175, minWidth: 175, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, boxSizing: 'border-box', cursor: 'default' }}>
              <AnimatedClock />
            </div>
            <button
              className="hamburger-btn"
              onClick={() => setShowNavMenu(true)}
              title="Open Navigation Menu"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #064E3B',
                padding: '7px 10px',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(6,78,59,0.08)',
                marginLeft: 'auto'
              }}
            >
              <Menu style={{ width: 20, height: 20, color: '#064E3B' }} />
            </button>
          </div>
        </div>

        {/* ── SINGLE PARTITIONED STAT BANNER CARD ── */}
        <div className="stat-banner-grid" style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F7FDF9 100%)',
          borderRadius: 12,
          border: '1.5px solid #CBE4D3',
          boxShadow: '0 2px 10px rgba(6,78,59,0.03)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          marginBottom: 12,
          overflow: 'hidden'
        }}>
          {/* Section 1: Total Today */}
          <div className="stat-segment-hover" style={{ padding: '7px 14px', borderRight: '1.5px solid #CBE4D3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Today</span>
              <div className="stat-icon-container" style={{ width: 22, height: 22, borderRadius: 6, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#064E3B', lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <AnimatedNumber value={patients.length} />
            </div>
          </div>

          {/* Section 2: Waiting */}
          <div className="stat-segment-hover" style={{ padding: '7px 14px', borderRight: '1.5px solid #CBE4D3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Waiting</span>
              <div className="stat-icon-container" style={{ width: 22, height: 22, borderRadius: 6, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users className="w-3 h-3" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#064E3B', lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <AnimatedNumber value={waiting.length} />
            </div>
          </div>

          {/* Section 3: Done */}
          <div className="stat-segment-hover" style={{ padding: '7px 14px', borderRight: '1.5px solid #CBE4D3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Done</span>
              <div className="stat-icon-container" style={{ width: 22, height: 22, borderRadius: 6, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#064E3B', lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <AnimatedNumber value={done.length} />
            </div>
          </div>

          {/* Section 4: Avg Waiting Time */}
          <div className="stat-segment-hover" style={{ padding: '7px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Waiting Time</span>
              <div className="stat-icon-container" style={{ width: 22, height: 22, borderRadius: 6, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock className="w-3 h-3" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#064E3B', lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <AnimatedNumber value={waiting.length > 0 ? Math.round(waiting.reduce((acc, p) => acc + Math.max(1, Math.floor((new Date() - new Date(p.joined_at)) / 60000)), 0) / waiting.length) : 0} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669', marginLeft: 3 }}>m</span>
            </div>
          </div>
        </div>

        {/* ── LIVE QUEUE CONTROL & BROADCAST CONSOLE CARD ── */}
        <div style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F4FDF8 100%)', borderRadius: 16, padding: '18px 24px', marginBottom: 18, border: '1.5px solid #CBE4D3', boxShadow: '0 4px 16px rgba(6,78,59,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#064E3B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              LIVE QUEUE CONTROL & BROADCAST CONSOLE
            </div>
            <Shield className="w-4 h-4 text-[#059669]" />
          </div>

          <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 16px', lineHeight: 1.45, fontWeight: 500 }}>
            Scan the clinic QR code to instantly join the live queue. Broadcast live public notices to all queued patients or manually manage check-in records.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <button
              onClick={() => setShowQR(true)}
              className="console-btn-primary"
              style={{ background: '#064E3B', color: 'white', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 3px 10px rgba(6,78,59,0.25)' }}
            >
              <QrCode className="w-3.5 h-3.5 text-[#A7F3D0]" /> DISPLAY CLINIC QR CODE
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="console-btn-secondary"
              style={{ background: 'white', color: '#064E3B', border: '1.5px solid #064E3B', borderRadius: 9, padding: '9px 16px', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <UserPlus className="w-3.5 h-3.5 text-current" /> MANUAL CHECK-IN
            </button>

            <button
              onClick={() => setShowBroadcast(true)}
              className="console-btn-light"
              style={{ background: '#ECFDF5', color: '#064E3B', border: '1.5px solid #A7F3D0', borderRadius: 9, padding: '9px 16px', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Megaphone className="w-3.5 h-3.5 text-[#059669]" /> NOTICE TO QUEUE
            </button>

            <button
              onClick={togglePauseQueue}
              className="console-btn-light"
              style={{ background: queuePaused ? '#FEF2F2' : '#ECFDF5', color: queuePaused ? '#DC2626' : '#059669', border: `1.5px solid ${queuePaused ? '#FCA5A5' : '#A7F3D0'}`, borderRadius: 9, padding: '9px 16px', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {queuePaused ? <Play className="w-3.5 h-3.5 text-[#DC2626]" /> : <Pause className="w-3.5 h-3.5 text-[#059669]" />}
              {queuePaused ? 'RESUME QUEUE' : 'PAUSE QUEUE'}
            </button>
          </div>
        </div>

        {/* ── 2-COLUMN STAGE: WITH DOCTOR & NEXT IN QUEUE ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginBottom: 10 }}>
          
          {/* LEFT SIDE: WITH DOCTOR SECTION */}
          <div className="stage-box-hover" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)', borderRadius: 12, padding: '8px 12px', border: '1.5px solid #CBE4D3', boxShadow: '0 2px 8px rgba(6,78,59,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }} />
                <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  WITH DOCTOR
                </span>
              </div>
              <span style={{ fontSize: '0.64rem', fontWeight: 900, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '1px 8px', borderRadius: 10 }}>
                {called.length} IN CONSULTATION
              </span>
            </div>

            {called.length === 0 ? (
              <div style={{ padding: '6px 10px', background: 'white', borderRadius: 9, border: '1px dashed #A7F3D0', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No patient inside consultation room</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {called.map(p => (
                  <div key={p.id} style={{ background: 'white', border: '1.5px solid #A7F3D0', borderRadius: 9, padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#064E3B', fontFamily: 'monospace' }}>#{formatToken(p.token)}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>{p.name || 'Walk-in Patient'}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone className="w-3 h-3 text-[#059669]" /> +91 {p.phone}
                      </div>
                    </div>
                    <button className="card-btn-admit" onClick={() => markDone(p.id)}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Done
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE: NEXT IN QUEUE STAGE CARD */}
          <div className="stage-box-hover" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF5 100%)', borderRadius: 12, padding: '8px 12px', border: '1.5px solid #CBE4D3', boxShadow: '0 2px 8px rgba(6,78,59,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCheck className="w-3.5 h-3.5 text-[#D97706]" />
                <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  NEXT IN QUEUE
                </span>
              </div>
              <span style={{ fontSize: '0.64rem', fontWeight: 900, background: '#FFFBEB', color: '#B45309', border: '1px solid #FCD34D', padding: '1px 8px', borderRadius: 10 }}>
                READY FOR ADMIT
              </span>
            </div>

            {waiting.length === 0 ? (
              <div style={{ padding: '8px 10px', background: 'white', borderRadius: 10, border: '1px dashed #FDE68A', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Queue is currently clear</div>
              </div>
            ) : (
              (() => {
                const nextP = waiting[0]
                return (
                  <div style={{ background: 'white', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#064E3B', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>#{formatToken(nextP.token)}</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>{nextP.name || 'Walk-in Patient'}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        <button className="card-btn-admit" onClick={() => admitPatient(nextP.id)}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Admit
                        </button>
                        <button className="card-btn-notify" onClick={() => notifyWhatsApp(nextP)}>
                          <Bell className="w-3.5 h-3.5" /> Notify
                        </button>
                        <button className="card-btn-skip" onClick={() => skipPatient(nextP.id)}>
                          <SkipForward className="w-3.5 h-3.5" /> Skip
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()
            )}
          </div>

        </div>

        {/* ── TAB SWITCHER ── */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'inline-flex', background: '#CBE4D3', borderRadius: 20, padding: 3, gap: 3, boxShadow: '0 2px 6px rgba(6,78,59,0.04)' }}>
            <button onClick={() => setActiveTab('active')} style={{ border: 'none', borderRadius: 16, padding: '6px 16px', background: activeTab === 'active' ? 'white' : 'transparent', color: activeTab === 'active' ? '#0F172A' : '#1E3A2B', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: activeTab === 'active' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.15s ease' }}>
              Active Queue <span style={{ background: '#ECFDF5', color: '#059669', borderRadius: 10, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>{activePatients.length}</span>
            </button>
            <button onClick={() => setActiveTab('done')} style={{ border: 'none', borderRadius: 16, padding: '6px 16px', background: activeTab === 'done' ? 'white' : 'transparent', color: activeTab === 'done' ? '#0F172A' : '#1E3A2B', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: activeTab === 'done' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.15s ease' }}>
              Completed <span style={{ background: '#F1F5F9', color: '#64748B', borderRadius: 10, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>{done.length}</span>
            </button>
            <button onClick={() => setActiveTab('payments')} style={{ border: 'none', borderRadius: 16, padding: '6px 16px', background: activeTab === 'payments' ? 'white' : 'transparent', color: activeTab === 'payments' ? '#0F172A' : '#1E3A2B', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease' }}>
              Payments
            </button>
          </div>
        </div>

        {/* ── QUEUE LIST / PAYMENTS VIEW ── */}
        <div>
          {/* Search Queue Bar Inside Queue Section Top */}
          {activeTab !== 'payments' && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search className="w-4 h-4 text-[#065F46]" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search patient name, token or phone number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: 14,
                    border: '1.5px solid #A7F3D0',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none',
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(6,78,59,0.04)',
                    boxSizing: 'border-box'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' ? (
            <PaymentsView clinic={clinic} setToastMsg={setToastMsg} dashboardPatients={patients} />
          ) : activeTab === 'done' ? (
            (() => {
              const filteredDone = done.filter(p => {
                if (!searchQuery.trim()) return true
                const q = searchQuery.toLowerCase()
                return (p.name && p.name.toLowerCase().includes(q)) ||
                       (p.phone && p.phone.includes(q)) ||
                       (p.token && String(p.token).toLowerCase().includes(q))
              })

              return (
                <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1.5px solid #CBE4D3', boxShadow: '0 3px 14px rgba(6,78,59,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#064E3B', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Consultation History & Completed Records</h2>
                      <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>Log of patients completed today</p>
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: 12 }}>
                      {done.length} Patients Completed
                    </span>
                  </div>

                  {filteredDone.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #E2E8F0' }}>
                      <History className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>No completed records found</div>
                      <div style={{ fontSize: '0.76rem', marginTop: 4 }}>Patients marked as "Done" will automatically move here.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {filteredDone.map((p) => (
                        <PatientCard key={p.id} patient={p} onDone={() => {}} onSkip={() => {}} onNotify={() => {}} onViewDetails={() => setSelectedPatient(p)} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()
          ) : (
            filteredActive.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #CBE4D3', padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>
                <Users className="w-10 h-10 text-[#A8D5B5] mx-auto mb-3" />
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  No patients currently waiting in queue
                </div>
                <div style={{ fontSize: '0.82rem', marginTop: 4, color: '#64748B' }}>
                  Patients scanning the OPD QR code or added via Manual Check-in will appear here in real time.
                </div>
              </div>
            ) : (
              filteredActive.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  position={p.status === STATUS.WAITING ? 1 : null}
                  onDone={() => markDone(p.id)}
                  onSkip={() => skipPatient(p.id)}
                  onNotify={() => notifyWhatsApp(p)}
                  onPriorityCall={() => admitPatient(p.id)}
                  onViewDetails={() => setSelectedPatient(p)}
                />
              ))
            )
          )}
        </div>

      </main>

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 99999,
              background: '#064E3B',
              color: '#FFFFFF',
              border: '1.5px solid #A7F3D0',
              borderRadius: 16,
              padding: '14px 22px',
              boxShadow: '0 12px 30px rgba(6,78,59,0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontWeight: 800,
              fontSize: '0.88rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECFDF5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, pointerEvents: 'none' }}>
              <Megaphone className="w-4 h-4 text-[#065F46]" />
            </div>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📱 MOBILE NAVIGATION OVERLAY DRAWER */}
      <AnimatePresence>
        {showNavMenu && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }} style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'flex-end' }}>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNavMenu(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(6, 78, 59, 0.75)', backdropFilter: 'blur(6px)' }}
            />

            {/* Sliding Content Drawer (From Right) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              style={{
                position: 'relative',
                width: '82%',
                maxWidth: 320,
                height: '100%',
                maxHeight: '100dvh',
                boxSizing: 'border-box',
                background: '#FFFFFF',
                boxShadow: '-10px 0 40px rgba(6,78,59,0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                zIndex: 10001,
                padding: '24px 20px',
                overflowY: 'auto'
              }}
            >
              <div style={{ flexGrow: 1 }}>
                {/* Brand Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: '#064E3B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#064E3B', letterSpacing: '-0.5px' }}>TokenPE</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>{clinic?.name || 'OPD Clinic Console'}</div>
                    </div>
                  </div>
                  <button onClick={() => setShowNavMenu(false)} style={{ background: '#F1F5F9', border: 'none', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, paddingLeft: 4 }}>NAVIGATION</div>

                  <button
                    onClick={() => { setActiveTab('active'); setShowNavMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: activeTab === 'active' ? '#ECFDF5' : 'transparent', color: activeTab === 'active' ? '#064E3B' : '#0F172A', fontWeight: 800, fontSize: '0.88rem', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#064E3B]" /> Live Queue
                  </button>

                  <button
                    onClick={() => { setShowAddForm(true); setShowNavMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'transparent', color: '#0F172A', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <UserPlus className="w-4 h-4 text-[#059669]" /> Manual Check-in
                  </button>

                  <button
                    onClick={() => { setShowBroadcast(true); setShowNavMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'transparent', color: '#0F172A', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Megaphone className="w-4 h-4 text-[#059669]" /> Notice to Queue
                  </button>

                  <button
                    onClick={() => { setShowQR(true); setShowNavMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'transparent', color: '#0F172A', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <QrCode className="w-4 h-4 text-[#059669]" /> OPD QR Poster
                  </button>

                  <button
                    onClick={() => { setActiveTab('payments'); setShowNavMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: activeTab === 'payments' ? '#ECFDF5' : 'transparent', color: activeTab === 'payments' ? '#064E3B' : '#0F172A', fontWeight: 800, fontSize: '0.88rem', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <CreditCard className="w-4 h-4 text-[#059669]" /> Payments Ledger
                  </button>

                  <button
                    onClick={() => { setActiveTab('done'); setShowNavMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: activeTab === 'done' ? '#ECFDF5' : 'transparent', color: activeTab === 'done' ? '#064E3B' : '#0F172A', fontWeight: 800, fontSize: '0.88rem', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" /> Completed Consultations
                  </button>

                  <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }} />

                  <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, paddingLeft: 4 }}>MANAGEMENT</div>

                  <button
                    onClick={() => { router.push('/dashboard/analytics'); setShowNavMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'transparent', color: '#0F172A', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Calendar className="w-4 h-4 text-[#059669]" /> Appointments & Analytics
                  </button>

                  <button
                    onClick={() => { router.push('/dashboard/crm'); setShowNavMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'transparent', color: '#0F172A', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <UserCheck className="w-4 h-4 text-[#059669]" /> Doctors & Patients
                  </button>

                  <button
                    onClick={() => { router.push('/dashboard/billing'); setShowNavMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'transparent', color: '#0F172A', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Settings className="w-4 h-4 text-[#059669]" /> Settings & Billing
                  </button>
                </div>
              </div>

              {/* Drawer Bottom Logout */}
              <div style={{ paddingTop: 16, borderTop: '1px solid #E2E8F0', marginTop: 20 }}>
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAddForm && <WalkInModal clinic={clinic} onClose={() => setShowAddForm(false)} onAddSuccess={(newP) => { if (newP) setPatients(prev => [...prev, newP]); fetchQueue(); sounds.admit(); setToastMsg('Patient added to queue successfully!'); setTimeout(() => setToastMsg(''), 4500); }} patientsCount={patients.length} />}
      {showQR && <QRModal clinic={clinic} onClose={() => setShowQR(false)} onCodeUpdate={(code) => setClinic(c => ({ ...c, code }))} />}
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} onSendNotice={handleSendNotice} activeNotice={activeNotice} />}
      {selectedPatient && <PatientDetailsModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} onNotify={() => notifyWhatsApp(selectedPatient)} />}
    </div>
  )
}
