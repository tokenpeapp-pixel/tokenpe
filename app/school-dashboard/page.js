'use client'
import { useEffect, useState, useRef } from 'react'
import { 
  GraduationCap, Phone, CheckCircle2, XCircle, Megaphone, PlusCircle, SkipForward, 
  Bell, Download, Printer, Star, Mic, AlertTriangle, Hourglass, RefreshCw, Sparkles, 
  Plus, LogOut, Check, ChevronRight, Search, X, Settings, History, BarChart2, 
  CreditCard, DoorOpen, QrCode, Clock, Calendar, UserCheck, ChevronDown,
  Building, ShieldCheck, UserPlus, Layers, Users, Activity, ArrowRight, MapPin, Pencil, Menu, Camera, Upload, Image as ImageIcon, Smartphone, Pause, Play, User, HelpCircle, Hash
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getISTDateString } from '../../lib/supabase'
import confetti from 'canvas-confetti'
import QRCode from 'qrcode'
import { motion, AnimatePresence } from 'framer-motion'

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

// ─── ANIMATED CLOCK WITH SECONDS & SMOOTH TRANSITIONS ───
function AnimatedClock() {
  const [time, setTime] = useState(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) return <span style={{ opacity: 0 }}>00:00:00 AM</span>

  const formatted = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const parts = formatted.split(' ')
  const timeDigits = parts[0] || '00:00:00'
  const ampm = parts[1] || 'AM'
  const [h, m, s] = timeDigits.split(':')

  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, fontFamily: "'Playfair Display', serif", fontSize: '1.9rem', fontWeight: 700, color: '#1B2A4A', lineHeight: 1 }}>
      <AnimatedNumber value={h || '00'} />
      <span style={{ margin: '0 1px', opacity: 0.6 }}>:</span>
      <AnimatedNumber value={m || '00'} />
      <span style={{ margin: '0 1px', opacity: 0.6 }}>:</span>
      <AnimatedNumber value={s || '00'} />
      <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginLeft: 6, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

// ─── FULL FEATURED QR POSTER MODAL (RESTAURANT GENERATOR LOGIC + SCHOOL NAVY THEME) ───
function QRModal({ clinic, onClose, onCodeUpdate }) {
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [editingCode, setEditingCode] = useState(false)
  const [codeInput, setCodeInput] = useState(clinic?.code || '')
  
  const [locationInput, setLocationInput] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tokenpe_active_room')
      if (saved) return saved
    }
    const raw = clinic?.location || ''
    if (raw.length > 25 && /^[0-9A-F]+$/i.test(raw)) return 'Main Gate / Reception'
    return raw || 'Main Gate / Reception'
  })

  const [codeError, setCodeError] = useState('')
  const [codeSaving, setCodeSaving] = useState(false)
  const [codeSuccess, setCodeSuccess] = useState(false)

  const [qrDataUrl, setQrDataUrl] = useState('')
  const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919969701706'
  const waNumber = String(rawNumber).replace(/[^0-9]/g, '')
  const validWaNumber = waNumber.length >= 10 ? waNumber : '919969701706'
  const liveCode = codeSuccess ? codeInput : (clinic?.code || 'SCHOOL')
  const waLink = `https://wa.me/${validWaNumber}?text=JOIN%20${liveCode}`

  useEffect(() => {
    if (waLink) {
      QRCode.toDataURL(waLink, { width: 400, margin: 2, color: { dark: '#1B2A4A', light: '#FFFFFF' } })
        .then(url => setQrDataUrl(url))
        .catch(() => setQrDataUrl(`https://quickchart.io/qr?size=400&text=${encodeURIComponent(waLink)}`))
    }
  }, [waLink])

  async function saveCode() {
    const clean = codeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length < 3 || clean.length > 12) {
      setCodeError('Code must be 3–12 alphanumeric characters.')
      return
    }

    setCodeSaving(true)
    setCodeError('')

    try {
      if (clinic?.id && clinic.id !== 'demo-school-id') {
        await supabase.from('schools').update({ code: clean, location: locationInput }).eq('id', clinic.id).catch(() => {})
        await supabase.from('public_schools').update({ code: clean, location: locationInput }).eq('id', clinic.id).catch(() => {})
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

      // 1. Background gradient (Navy Academic Theme)
      const grad = ctx.createLinearGradient(0, 0, 800, 1000)
      grad.addColorStop(0, '#1B2A4A')
      grad.addColorStop(1, '#24365C')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 800, 1000)

      // Outer gold/light frame line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
      ctx.lineWidth = 6
      ctx.strokeRect(30, 30, 740, 940)

      // 2. School / Institute Name (Top)
      ctx.fillStyle = '#7FA8D9'
      ctx.font = '800 24px "Plus Jakarta Sans", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText((clinic?.name || 'ASHBOURNE ACADEMY').toUpperCase(), 400, 110)

      // Headline Text
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '700 42px "Playfair Display", Georgia, serif'
      ctx.fillText('Scan QR Code for Campus Check-in', 400, 175)

      // 3. Draw White Rounded Card Box for QR Code
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

      // Draw Base QR Code
      if (qrDataUrl) {
        const qrImg = new window.Image()
        qrImg.crossOrigin = 'anonymous'
        await new Promise((resolve) => {
          qrImg.onload = resolve
          qrImg.onerror = resolve
          qrImg.src = qrDataUrl
        })
        ctx.drawImage(qrImg, qrBoxX + 24, qrBoxY + 24, qrBoxSize - 48, qrBoxSize - 48)

        // Draw Center Logo Crest Overlaid on QR Code
        const logoUrl = clinic?.logo_url
        if (logoUrl) {
          const logoImg = new window.Image()
          logoImg.crossOrigin = 'anonymous'
          await new Promise((resolve) => {
            logoImg.onload = resolve
            logoImg.onerror = resolve
            logoImg.src = logoUrl
          })
          const logoSize = 90
          const logoX = 400 - logoSize / 2
          const logoY = qrBoxY + qrBoxSize / 2 - logoSize / 2

          // White Border Frame around Center Crest Logo
          ctx.fillStyle = '#FFFFFF'
          if (ctx.roundRect) {
            ctx.beginPath()
            ctx.roundRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16, 14)
            ctx.fill()
            ctx.strokeStyle = '#1B2A4A'
            ctx.lineWidth = 3
            ctx.stroke()
          } else {
            ctx.fillRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16)
          }

          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
        }
      }

      // 4. WhatsApp JOIN Text
      ctx.fillStyle = '#A8C5E8'
      ctx.font = '500 24px "Plus Jakarta Sans", sans-serif'
      ctx.fillText(`Or WhatsApp JOIN ${liveCode} to +${validWaNumber}`, 400, 680)

      // 5. "How Students & Visitors Join Queue" Instruction Card Box
      const boxWidth = 680
      const boxX = 400 - boxWidth / 2
      const boxY = 720
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(boxX, boxY, boxWidth, 140, 16)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        ctx.fillRect(boxX, boxY, boxWidth, 140)
      }

      ctx.fillStyle = '#38BDF8'
      ctx.font = '800 22px "Plus Jakarta Sans", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('HOW STUDENTS & VISITORS JOIN QUEUE', boxX + 30, boxY + 42)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('1. Open WhatsApp or Camera on mobile device', boxX + 30, boxY + 78)
      ctx.fillText('2. Scan QR code to join live queue instantly', boxX + 30, boxY + 110)

      // 6. Bottom Campus Code Badge
      ctx.textAlign = 'center'
      ctx.fillStyle = '#38BDF8'
      ctx.font = '900 28px monospace'
      ctx.fillText(`CAMPUS CODE: ${liveCode}`, 400, 920)

      // Trigger Download of Full Poster PNG Image
      const posterDataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = posterDataUrl
      link.download = `Gate-Pass-Poster-${liveCode}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2500)
    } catch (e) {
      console.error('Poster generation error:', e)
    }
    setDownloading(false)
  }

  function printPoster() {
    try {
      const win = window.open('', '_blank')
      if (!win) {
        alert('Please allow popups to print gate poster.')
        return
      }
      const logoUrl = clinic?.logo_url
      win.document.write(`
        <!DOCTYPE html><html><head>
        <title>Gate Pass QR — ${clinic?.name || 'School'}</title>
        <style>
          body { font-family: 'Plus Jakarta Sans', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #F4F7FB; }
          .poster { background: #FFFFFF; border: 2px solid #1B2A4A; border-radius: 16px; width: 340px; padding: 32px 24px; text-align: center; box-shadow: 0 10px 30px rgba(27,42,74,0.1); }
          .logo-box { width: 52px; height: 52px; border: 1.5px solid #1B2A4A; border-radius: 10px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #1B2A4A; overflow: hidden; background: #FFFFFF; }
          .name { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; color: #1B2A4A; margin-bottom: 4px; }
          .sub { font-size: 0.8rem; color: #5A6E85; margin-bottom: 20px; font-weight: 600; }
          .qr-wrap { position: relative; display: inline-block; padding: 12px; background: #FFFFFF; border: 1.5px solid #1B2A4A; border-radius: 12px; margin-bottom: 20px; }
          .how { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #1B2A4A; margin-bottom: 8px; letter-spacing: 0.08em; }
          .steps { font-size: 0.75rem; color: #5A6E85; line-height: 1.8; margin-bottom: 20px; }
          .code-box { background: #EFF4FA; border: 1.5px dashed #1B2A4A; border-radius: 8px; padding: 8px; font-family: monospace; font-size: 1rem; font-weight: 800; color: #1B2A4A; }
        </style>
        </head><body>
        <div class="poster">
          <div class="logo-box">
            ${logoUrl ? `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover;display:block" />` : (clinic?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div class="name">${clinic?.name || 'Ashbourne Academy'}</div>
          <div class="sub">Digital Campus Check-in & Gate Pass</div>
          <div class="qr-wrap">
            <img src="${qrDataUrl}" style="width:200px;height:200px;display:block" />
            ${logoUrl ? `
              <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#FFFFFF; padding:3px; border-radius:8px; border:1.5px solid #1B2A4A; box-shadow:0 4px 10px rgba(0,0,0,0.15)">
                <img src="${logoUrl}" style="width:44px; height:44px; border-radius:6px; object-fit:cover; display:block" />
              </div>
            ` : ''}
          </div>
          <div class="how">How to Join Queue</div>
          <div class="steps">
            1. Open camera or WhatsApp<br/>
            2. Scan QR code to join live queue<br/>
            3. Get instant digital check-in token
          </div>
          <div class="code-box">CAMPUS CODE: ${liveCode}</div>
        </div>
        </body></html>
      `)
      win.document.close()
      setTimeout(() => win.print(), 400)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(27, 42, 74, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', border: '1.5px solid #1B2A4A', borderRadius: 16, padding: '22px 24px', maxWidth: 440, width: '100%', boxShadow: '0 25px 60px rgba(27, 42, 74, 0.35)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: '#EFF4FA', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', color: '#1B2A4A', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <X style={{ width: 16, height: 16 }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
          <div style={{ width: 34, height: 34, border: '1.5px solid #1B2A4A', borderRadius: 6, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', fontWeight: 700, color: '#1B2A4A', overflow: 'hidden' }}>
            {clinic?.logo_url ? <img src={clinic.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (clinic?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Playfair Display, serif', color: '#1B2A4A', lineHeight: 1.2 }}>Digital Gate QR Poster</h3>
            <div style={{ fontSize: '0.74rem', color: '#5A6E85', fontWeight: 600 }}>Campus Entry & Gate Control</div>
          </div>
        </div>

        {/* Poster Navy Card */}
        <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #24365C 100%)', color: '#FFFFFF', borderRadius: 12, padding: '16px 18px', textAlign: 'center', marginBottom: 14, boxShadow: '0 6px 20px rgba(27, 42, 74, 0.18)' }}>
          <div style={{ fontSize: '0.64rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7FA8D9', marginBottom: 4 }}>
            {clinic?.name || 'ASHBOURNE ACADEMY'}
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, color: '#FFFFFF' }}>
            Scan QR Code for Campus Check-in
          </div>

          <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 10, display: 'inline-block', marginBottom: 10, position: 'relative', border: '1.5px solid rgba(255,255,255,0.2)' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Gate QR Code" style={{ width: 155, height: 155, display: 'block', borderRadius: 6 }} />
            ) : (
              <div style={{ width: 155, height: 155, background: '#EFF4FA', borderRadius: 6 }} />
            )}
            {clinic?.logo_url && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#FFFFFF', padding: 3, borderRadius: 6, border: '1.5px solid #1B2A4A', boxShadow: '0 3px 10px rgba(0,0,0,0.18)' }}>
                <img src={clinic.logo_url} alt="Logo Crest" style={{ width: 38, height: 38, borderRadius: 4, objectFit: 'cover', display: 'block' }} />
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#A8C5E8', fontWeight: 500 }}>
            Or WhatsApp <span style={{ fontFamily: 'monospace', color: '#38BDF8', fontWeight: 800 }}>JOIN {liveCode}</span> to <span style={{ fontFamily: 'monospace', color: '#FFFFFF', fontWeight: 800 }}>+{validWaNumber}</span>
          </div>
        </div>

        {/* How to Join Instructions */}
        <div style={{ background: '#F4F7FB', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', textAlign: 'left', marginBottom: 14 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1B2A4A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Smartphone style={{ width: 14, height: 14, color: '#0284C7' }} />
            <span>How Students & Visitors Join Queue</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#5A6E85', lineHeight: 1.7, fontWeight: 500 }}>
            1. Open WhatsApp or Camera on mobile device<br />
            2. Scan this QR code to register arrival<br />
            3. Receive instant queue token + live gate updates
          </div>
        </div>

        {/* Campus Code Badge & Edit Section */}
        <div style={{ marginBottom: 14, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#EFF4FA', border: '1.5px dashed #1B2A4A', borderRadius: 8, padding: '7px 16px', marginBottom: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1B2A4A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Campus Code:</span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0284C7', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{liveCode}</span>
          </div>

          {codeSuccess && (
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginBottom: 6 }}>
              ✓ Code updated! New QR generated.
            </div>
          )}

          {editingCode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#1B2A4A', marginBottom: 2, textAlign: 'left' }}>Custom Campus Code</label>
                <input
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCodeError('') }}
                  maxLength={12}
                  placeholder="Campus Code (e.g. ASHBOURNE)"
                  style={{ fontFamily: 'monospace', fontSize: '0.92rem', fontWeight: 700, letterSpacing: '0.08em', color: '#1B2A4A', border: '1.5px solid #1B2A4A', borderRadius: 6, padding: '8px 12px', width: '100%', outline: 'none', textAlign: 'center', background: '#F4F7FB' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#1B2A4A', marginBottom: 2, textAlign: 'left' }}>Active Room / Location</label>
                <input
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  maxLength={100}
                  placeholder="Active Class / Room / Cell (e.g. Room 101, Science Cell A)"
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1B2A4A', border: '1.5px solid #CBD5E1', borderRadius: 6, padding: '8px 12px', width: '100%', outline: 'none', textAlign: 'center', background: '#F4F7FB' }}
                />
              </div>

              {codeError && <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>{codeError}</div>}
              
              <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 2 }}>
                <button type="button" onClick={saveCode} disabled={codeSaving} style={{ flex: 1, padding: '9px 0', background: '#1B2A4A', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', opacity: codeSaving ? 0.7 : 1 }}>
                  {codeSaving ? 'Saving...' : '✓ Save Code'}
                </button>
                <button type="button" onClick={() => { setEditingCode(false); setCodeInput(clinic?.code || ''); setCodeError('') }} style={{ flex: 1, padding: '9px 0', background: 'transparent', color: '#1B2A4A', border: '1px solid #1B2A4A', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setEditingCode(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F4F7FB', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#1B2A4A', cursor: 'pointer', margin: '4px auto 0' }}>
              <Pencil style={{ width: 13, height: 13, color: '#0284C7' }} /> Edit Code & Location
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            type="button"
            onClick={download} 
            disabled={downloading} 
            style={{ flex: 1, padding: '11px 0', background: '#1B2A4A', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(27, 42, 74, 0.15)', opacity: downloading ? 0.7 : 1 }}
          >
            {downloaded ? (
              <><CheckCircle2 style={{ width: 16, height: 16, color: '#34D399' }} /> Saved!</>
            ) : downloading ? (
              'Generating...'
            ) : (
              <><Download style={{ width: 16, height: 16 }} /> Download Poster PNG</>
            )}
          </button>
          <button 
            type="button"
            onClick={printPoster} 
            style={{ flex: 1, padding: '11px 0', background: '#EFF4FA', color: '#1B2A4A', border: '1.5px solid #1B2A4A', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Printer style={{ width: 16, height: 16 }} /> Print Card
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── MAIN SCHOOL COMMAND CENTER PAGE ───
export default function SchoolCommandCenter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTabFromUrl = searchParams.get('tab') || 'arrivals'

  const [tab, setTab] = useState(activeTabFromUrl)
  const [clinic, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [queuePaused, setQueuePaused] = useState(false)

  async function togglePauseQueue() {
    const nextState = !queuePaused
    setQueuePaused(nextState)
    if (clinic?.id && clinic.id !== 'demo-school-id') {
      try {
        await supabase.from('schools').update({ queue_paused: nextState }).eq('id', clinic.id).catch(() => {})
        await supabase.from('public_schools').update({ queue_paused: nextState }).eq('id', clinic.id).catch(() => {})
      } catch (err) {
        console.warn('Toggle pause queue error:', err)
      }
    }
  }

  // Form input states
  const [studentName, setStudentName] = useState('')
  const [gradeClass, setGradeClass] = useState('')
  const [reason, setReason] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [activeRoom, setActiveRoom] = useState('Room 101 / Main Gate')

  function handleRoomChange(e) {
    const val = e.target.value
    setActiveRoom(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenpe_active_room', val)
      if (clinic?.id && clinic.id !== 'demo-school-id') {
        supabase.from('schools').update({ location: val }).eq('id', clinic.id).then(() => {}).catch(() => {})
        supabase.from('public_schools').update({ location: val }).eq('id', clinic.id).then(() => {}).catch(() => {})
      }
    }
  }

  // Edit School Name, Subtitle & Logo states
  const [showEditSchoolModal, setShowEditSchoolModal] = useState(false)
  const [newSchoolNameInput, setNewSchoolNameInput] = useState('')
  const [schoolSubtitle, setSchoolSubtitle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tokenpe_school_subtitle') || 'Campus Operations & Gate Control Console'
    }
    return 'Campus Operations & Gate Control Console'
  })
  const [schoolCity, setSchoolCity] = useState('')
  const [showNavMenu, setShowNavMenu] = useState(false)
  const fileInputRef = useRef(null)
  const modalFileInputRef = useRef(null)
  const [schoolLogo, setSchoolLogo] = useState(null)

  // Broadcast Notice to All Queue States
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastMsgText, setBroadcastMsgText] = useState('')
  const [activeNotice, setActiveNotice] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('tokenpe_active_notice') || ''
    return ''
  })

  // Skip / Remove Confirmation Modal State
  const [skipTarget, setSkipTarget] = useState(null)

  async function confirmRemoveFromQueue(id) {
    if (!id) return
    try { if (sounds?.admit) sounds.admit() } catch (e) {}
    const updatedQueue = arrivals.filter(a => a.id !== id)
    const reRanked = updatedQueue.map((item, idx) => ({ ...item, rank: String(idx + 1).padStart(2, '0') }))
    setArrivals(reRanked)
    try { localStorage.setItem('tokenpe_school_queue', JSON.stringify(reRanked)) } catch (e) {}
    try {
      const schoolId = await getRealSchoolId()
      if (schoolId && schoolId !== 'demo-school-id') {
        await supabase.from('school_queue').update({ status: 'cancelled' }).eq('id', id).catch(() => {})
      }
    } catch (e) {}
    setSkipTarget(null)
  }

  async function handleSendBroadcastNotice(e) {
    e.preventDefault()
    if (!broadcastMsgText.trim()) return
    const msg = broadcastMsgText.trim()
    setActiveNotice(msg)
    try {
      if (sounds?.call) sounds.call()
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } })
      localStorage.setItem('tokenpe_active_notice', msg)
      if (clinic?.id && clinic.id !== 'demo-school-id') {
        await supabase.from('schools').update({ active_notice: msg }).eq('id', clinic.id).catch(() => {})
        await supabase.from('public_schools').update({ active_notice: msg }).eq('id', clinic.id).catch(() => {})
      }
    } catch (err) {}
    setShowBroadcastModal(false)
    setBroadcastMsgText('')
    alert(`📢 Notice Broadcast Sent to Queue:\n\n"${msg}"`)
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo image size must be under 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const base64Logo = evt.target.result
      setSchoolLogo(base64Logo)
      const updatedClinic = { ...clinic, logo_url: base64Logo }
      setSchool(updatedClinic)
      try {
        localStorage.setItem('tokenpe_clinic', JSON.stringify(updatedClinic))
        if (clinic?.id && clinic.id !== 'demo-school-id') {
          await supabase.from('schools').update({ logo_url: base64Logo }).eq('id', clinic.id).catch(() => {})
          await supabase.from('public_schools').update({ logo_url: base64Logo }).eq('id', clinic.id).catch(() => {})
        }
      } catch (err) {}
    }
    reader.readAsDataURL(file)
  }

  async function saveSchoolName(e) {
    e.preventDefault()
    if (!newSchoolNameInput.trim()) return
    const updatedName = newSchoolNameInput.trim()
    const updatedCity = schoolCity.trim()
    const updatedClinic = { ...clinic, name: updatedName, specialty: schoolSubtitle, city: updatedCity, logo_url: schoolLogo || clinic?.logo_url }
    setSchool(updatedClinic)
    try {
      localStorage.setItem('tokenpe_clinic', JSON.stringify(updatedClinic))
      localStorage.setItem('tokenpe_school_subtitle', schoolSubtitle)
      if (clinic?.id && clinic.id !== 'demo-school-id') {
        await supabase.from('schools').update({ name: updatedName, specialty: schoolSubtitle, city: updatedCity, logo_url: schoolLogo || clinic?.logo_url }).eq('id', clinic.id).catch(() => {})
        await supabase.from('public_schools').update({ name: updatedName, city: updatedCity, logo_url: schoolLogo || clinic?.logo_url }).eq('id', clinic.id).catch(() => {})
      }
    } catch (err) {}
    setShowEditSchoolModal(false)
  }

  async function handleLogout() {
    try {
      localStorage.clear()
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      await supabase.auth.signOut().catch(() => {})
    } catch (e) {}
    window.location.href = '/school-login?logged_out=true'
  }

  const sounds = useSounds()

  // State Definitions (100% Real Database Driven)
  const [arrivals, setArrivals] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [dismissals, setDismissals] = useState([])
  const [studentDirectory, setStudentDirectory] = useState([])
  const [withStaff, setWithStaff] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tokenpe_with_staff_queue')
        return stored ? JSON.parse(stored) : []
      } catch (e) { return [] }
    }
    return []
  })

  // Helper to ensure we have a valid real Supabase school ID for all DB operations
  async function getRealSchoolId() {
    if (clinic?.id && clinic.id !== 'demo-school-id') return clinic.id
    try {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.id && parsed.id !== 'demo-school-id') {
          setSchool(parsed)
          return parsed.id
        }
      }
    } catch (_) {}

    try {
      const { data: dbSchool } = await supabase.from('schools').select('*').limit(1).maybeSingle()
      if (dbSchool) {
        setSchool(dbSchool)
        try { localStorage.setItem('tokenpe_clinic', JSON.stringify(dbSchool)) } catch (_) {}
        return dbSchool.id
      }
    } catch (e) {}

    try {
      const { data: dbPub } = await supabase.from('public_schools').select('*').limit(1).maybeSingle()
      if (dbPub) {
        setSchool(dbPub)
        try { localStorage.setItem('tokenpe_clinic', JSON.stringify(dbPub)) } catch (_) {}
        return dbPub.id
      }
    } catch (e) {}

    return clinic?.id
  }

  // ── 1. DYNAMIC INITIALIZATION & REAL DB FETCH ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedRoom = localStorage.getItem('tokenpe_active_room')
    if (savedRoom) setActiveRoom(savedRoom)

    const stored = localStorage.getItem('tokenpe_clinic')
    let currentSchool = null

    if (stored) {
      try {
        currentSchool = JSON.parse(stored)
        setSchool(currentSchool)
      } catch (e) {}
    } else {
      currentSchool = { id: 'demo-school-id', name: 'Ashbourne Academy', code: 'ASHBOURNE', city: 'Karnataka' }
      setSchool(currentSchool)
    }

    if (currentSchool?.logo_url) setSchoolLogo(currentSchool.logo_url)

    // Real DB fetch from Supabase
    async function loadDynamicData() {
      try {
        let targetId = currentSchool?.id
        if (!targetId || targetId === 'demo-school-id') {
          const { data: dbSchool } = await supabase.from('schools').select('*').limit(1).maybeSingle()
          if (dbSchool) {
            currentSchool = dbSchool
            targetId = dbSchool.id
            setSchool(dbSchool)
            if (dbSchool.logo_url) setSchoolLogo(dbSchool.logo_url)
            if (dbSchool.location && !localStorage.getItem('tokenpe_active_room')) {
              setActiveRoom(dbSchool.location)
              localStorage.setItem('tokenpe_active_room', dbSchool.location)
            }
            localStorage.setItem('tokenpe_clinic', JSON.stringify(dbSchool))
          } else {
            const { data: dbPub } = await supabase.from('public_schools').select('*').limit(1).maybeSingle()
            if (dbPub) {
              currentSchool = dbPub
              targetId = dbPub.id
              setSchool(dbPub)
              if (dbPub.logo_url) setSchoolLogo(dbPub.logo_url)
              if (dbPub.location && !localStorage.getItem('tokenpe_active_room')) {
                setActiveRoom(dbPub.location)
                localStorage.setItem('tokenpe_active_room', dbPub.location)
              }
              localStorage.setItem('tokenpe_clinic', JSON.stringify(dbPub))
            }
          }
        } else {
          const { data: dbSchool } = await supabase.from('schools').select('*').eq('id', targetId).maybeSingle()
          if (dbSchool) {
            setSchool(dbSchool)
            currentSchool = dbSchool
            if (dbSchool.logo_url) setSchoolLogo(dbSchool.logo_url)
            if (dbSchool.location && !localStorage.getItem('tokenpe_active_room')) {
              setActiveRoom(dbSchool.location)
              localStorage.setItem('tokenpe_active_room', dbSchool.location)
            }
            localStorage.setItem('tokenpe_clinic', JSON.stringify(dbSchool))
          } else {
            const { data: dbPub } = await supabase.from('public_schools').select('*').eq('id', targetId).maybeSingle()
            if (dbPub) {
              setSchool(dbPub)
              currentSchool = dbPub
              if (dbPub.logo_url) setSchoolLogo(dbPub.logo_url)
              if (dbPub.location && !localStorage.getItem('tokenpe_active_room')) {
                setActiveRoom(dbPub.location)
                localStorage.setItem('tokenpe_active_room', dbPub.location)
              }
              localStorage.setItem('tokenpe_clinic', JSON.stringify(dbPub))
            }
          }
        }

        if (targetId && targetId !== 'demo-school-id') {
          // Fetch Live Queue from school_queue or queues
          const { data: queueData } = await supabase
            .from('school_queue')
            .select('*')
            .eq('school_id', targetId)
            .eq('status', 'waiting')
            .order('created_at', { ascending: true })

          let fetchedQueue = []
          if (queueData && queueData.length > 0) {
            fetchedQueue = queueData.map((q, i) => ({
              id: q.id,
              rank: q.token || String(i + 1).padStart(2, '0'),
              name: q.student_name,
              grade: q.grade_class || 'General',
              reason: q.reason || 'Arrival',
              guardian: q.guardian_name || '',
              wait: q.wait_time || "1'",
              status: q.status || 'waiting',
              time: q.joined_at ? new Date(q.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00'
            }))
          } else {
            // Check unified queues table
            const { data: unifiedData } = await supabase
              .from('queues')
              .select('*')
              .eq('clinic_id', targetId)
              .eq('status', 'waiting')
              .order('created_at', { ascending: true })

            if (unifiedData && unifiedData.length > 0) {
              fetchedQueue = unifiedData.map((q, i) => ({
                id: q.id,
                rank: String(i + 1).padStart(2, '0'),
                name: q.name,
                grade: q.notes ? q.notes.split('|')[0]?.trim() : 'General',
                reason: q.notes ? q.notes.split('|')[1]?.trim() : 'Arrival',
                guardian: q.phone || '',
                wait: "1'",
                status: 'waiting',
                time: q.created_at ? new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00'
              }))
            }
          }

          let localSaved = []
          try {
            const storedQ = localStorage.getItem('tokenpe_school_queue')
            if (storedQ) localSaved = JSON.parse(storedQ)
          } catch (e) {}

          if (fetchedQueue.length > 0) {
            setArrivals(fetchedQueue)
            try { localStorage.setItem('tokenpe_school_queue', JSON.stringify(fetchedQueue)) } catch (e) {}
          } else if (localSaved.length > 0) {
            setArrivals(localSaved)
          } else {
            setArrivals([])
          }

          // Fetch Dismissal History
          const { data: historyData } = await supabase
            .from('school_history')
            .select('*')
            .eq('school_id', targetId)
            .order('completed_at', { descending: true })
            .limit(20)

          if (historyData && historyData.length > 0) {
            const mappedHistory = historyData.map(h => ({
              id: h.id,
              name: h.student_name,
              grade: h.grade_class,
              guardian: `Guardian: ${h.guardian_name || 'Parent'}`,
              time: h.time_label || '12:15'
            }))
            setDismissals(mappedHistory)
          }

          // Fetch Classrooms
          const { data: classData } = await supabase
            .from('school_classrooms')
            .select('*')
            .eq('school_id', targetId)

          if (classData && classData.length > 0) {
            const mappedClasses = classData.map(c => ({
              code: c.code,
              title: c.subject_title,
              teacher: c.teacher_name,
              grade: c.grade,
              count: c.student_count || 0,
              capacity: c.capacity || 30,
              pct: c.occupancy_pct || Math.round(((c.student_count || 0) / (c.capacity || 30)) * 100)
            }))
            setClassrooms(mappedClasses)
          }

          // Fetch Student Directory
          const { data: studentsData } = await supabase
            .from('school_students')
            .select('*')
            .eq('school_id', targetId)

          if (studentsData) setStudentDirectory(studentsData)
        }
      } catch (err) {
        console.warn('Supabase real DB load:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDynamicData()

    // ── Real-time polling every 4s for queue updates ──
    const interval = setInterval(loadDynamicData, 4000)
    return () => clearInterval(interval)
  }, [])

  // ── 2. DYNAMIC ADMIT FUNCTION (MOVES TO WITH STAFF SECTION) ──
  async function handleAdmit(id) {
    try { sounds.admit() } catch (e) {}
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } })
    const target = arrivals.find(a => a.id === id) || (nextInQueue && nextInQueue.id === id ? nextInQueue : null)
    if (target) {
      const updatedArrivals = arrivals.filter(a => a.id !== target.id)
      setArrivals(updatedArrivals)
      try { localStorage.setItem('tokenpe_school_queue', JSON.stringify(updatedArrivals)) } catch (e) {}

      // Move student into WITH STAFF section
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const staffEntry = { ...target, admitTime: timeStr, status: 'with_staff' }
      const updatedWithStaff = [staffEntry, ...withStaff.filter(s => s.id !== target.id)]
      setWithStaff(updatedWithStaff)
      try { localStorage.setItem('tokenpe_with_staff_queue', JSON.stringify(updatedWithStaff)) } catch (e) {}

      // DB Dynamic Updates
      try {
        const schoolId = await getRealSchoolId()
        if (schoolId && schoolId !== 'demo-school-id') {
          await supabase.from('school_queue').update({ status: 'with_staff' }).eq('id', target.id).catch(() => {})
        }
      } catch (e) {
        console.warn('DB Admit Error:', e)
      }
    }
  }

  // ── 2a2. COMPLETE CONSULTATION (MOVES FROM WITH STAFF TO DISMISSED) ──
  async function handleCompleteStaff(id) {
    try { sounds.admit() } catch (e) {}
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } })
    const target = withStaff.find(s => s.id === id)
    if (target) {
      const updatedWithStaff = withStaff.filter(s => s.id !== id)
      setWithStaff(updatedWithStaff)
      try { localStorage.setItem('tokenpe_with_staff_queue', JSON.stringify(updatedWithStaff)) } catch (e) {}

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setDismissals(prev => [{ name: target.name, grade: target.grade, guardian: `Guardian: ${target.guardian || 'N/A'}`, time: timeStr }, ...prev])

      // DB Dynamic Updates
      try {
        const schoolId = await getRealSchoolId()
        if (schoolId && schoolId !== 'demo-school-id') {
          await supabase.from('school_queue').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id).catch(() => {})
          await supabase.from('queues').update({ status: 'done' }).eq('clinic_id', schoolId).eq('name', target.name).catch(() => {})
          await supabase.from('school_history').insert({
            school_id: schoolId,
            student_name: target.name,
            grade_class: target.grade,
            guardian_name: target.guardian,
            time_label: timeStr,
            status: 'done'
          }).catch(() => {})
        }
      } catch (e) {
        console.warn('DB Complete Staff Error:', e)
      }
    }
  }

  // ── 2b. DYNAMIC NOTIFY FUNCTION (NO REDIRECT, SHOW TOAST POPUP) ──
  const [notifyToast, setNotifyToast] = useState(null)

  function handleNotify(idOrObj) {
    const target = (typeof idOrObj === 'object' && idOrObj !== null) 
      ? idOrObj 
      : (arrivals.find(a => a.id === idOrObj) || (nextInQueue && nextInQueue.id === idOrObj ? nextInQueue : null))
    
    if (target) {
      try { if (sounds?.call) sounds.call() } catch (e) {}
      setNotifyToast(`Member notified to be ready! (${target.name} • ${target.grade || 'General'})`)
      setTimeout(() => setNotifyToast(null), 3500)
    }
  }

  // ── 2c. DYNAMIC SKIP FUNCTION (TRIGGER CONFIRMATION MODAL TO REMOVE) ──
  function handleSkip(idOrObj) {
    if (typeof idOrObj === 'object' && idOrObj !== null) {
      setSkipTarget(idOrObj)
    } else {
      const target = arrivals.find(a => a.id === idOrObj)
      if (target) setSkipTarget(target)
    }
  }

  // ── 3. DYNAMIC MANUAL CHECK-IN ──
  async function handleManualCheckIn(e) {
    e.preventDefault()
    if (!studentName.trim()) return
    sounds.call()

    const currentLocal = (() => {
      try {
        const storedQ = localStorage.getItem('tokenpe_school_queue')
        return storedQ ? JSON.parse(storedQ) : arrivals
      } catch (e) { return arrivals }
    })()

    const rankStr = String(currentLocal.length + 1).padStart(2, '0')
    const savedName = studentName.trim()
    const savedGrade = gradeClass.trim() || 'General'
    const savedReason = reason.trim() || 'Arrival'
    const savedGuardian = guardianName.trim()

    const newEntry = {
      id: String(Date.now()),
      rank: rankStr,
      name: savedName,
      grade: savedGrade,
      reason: savedReason,
      guardian: savedGuardian,
      wait: "1'",
      status: 'waiting',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updatedQueue = [newEntry, ...currentLocal]
    setArrivals(updatedQueue)
    try { localStorage.setItem('tokenpe_school_queue', JSON.stringify(updatedQueue)) } catch (e) {}

    setStudentName('')
    setGradeClass('')
    setReason('')
    setGuardianName('')
    setShowAddModal(false)

    // DB Dynamic Insert into Supabase
    try {
      const realId = await getRealSchoolId()
      if (realId && realId !== 'demo-school-id') {
        // 1. Insert into school_queue
        await supabase.from('school_queue').insert({
          school_id: realId,
          clinic_id: realId,
          token: rankStr,
          student_name: savedName,
          grade_class: savedGrade,
          reason: savedReason,
          guardian_name: savedGuardian,
          wait_time: "1'",
          status: 'waiting',
          joined_at: new Date().toISOString()
        }).catch(() => {})

        // 2. Also insert into unified queues table for universal compatibility
        await supabase.from('queues').insert({
          clinic_id: realId,
          name: savedName,
          phone: savedGuardian || '',
          party_size: 1,
          status: 'waiting',
          notes: `${savedGrade} | ${savedReason}`
        }).catch(() => {})
      }
    } catch (err) {
      console.warn('DB Insert Error:', err)
    }
  }

  const nextInQueue = arrivals[0]

  if (loading) {
    return (
      <div style={{ background: '#EFF4FA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #1B2A4A', borderTopColor: '#7FA8D9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --acc-bg: #DCEBFE;
          --acc-surface: #FFFFFF;
          --acc-navy: #1B2A4A;
          --acc-navy-light: #24365C;
          --acc-sky: #3B82F6;
          --acc-sky-light: #93C5FD;
          --acc-border: rgba(27, 42, 74, 0.14);
          --acc-line: rgba(27, 42, 74, 0.08);
          --acc-muted: #475569;
        }

        .cmd-root {
          background-color: #DCEBFE !important;
          color: var(--acc-navy);
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          padding: 24px 40px 48px;
          box-sizing: border-box;
        }

        /* ── TOP METADATA CONTROL STRIP ── */
        .cmd-meta-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid var(--acc-border);
          border-radius: 8px;
          padding: 12px 24px;
          margin-bottom: 28px;
          box-shadow: 0 2px 8px rgba(27, 42, 74, 0.06), 0 1px 2px rgba(27, 42, 74, 0.04);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          -webkit-font-smoothing: antialiased;
        }
        .cmd-meta-bar:hover {
          box-shadow: 0 4px 14px rgba(27, 42, 74, 0.09);
          border-color: rgba(127, 168, 217, 0.45);
        }
        .cmd-meta-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .cmd-meta-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--acc-navy);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cmd-meta-school-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .cmd-meta-school-btn:hover {
          background: #F4F7FB;
        }
        .cmd-meta-school-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--acc-navy);
          line-height: 1;
          letter-spacing: -0.01em;
        }
        .cmd-meta-pill-input {
          background: #F4F7FB;
          border: 1.5px solid rgba(27, 42, 74, 0.18);
          border-radius: 6px;
          padding: 6px 14px 6px 32px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--acc-navy);
          outline: none;
          min-width: 220px;
          box-shadow: inset 0 1px 2px rgba(27, 42, 74, 0.03);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cmd-meta-pill-input:focus {
          background: #FFFFFF;
          border-color: var(--acc-navy);
          box-shadow: 0 0 0 3px rgba(27, 42, 74, 0.08);
        }

        /* ── HEADER ── */
        .cmd-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 28px;
        }
        .cmd-brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cmd-logo-box {
          width: 56px;
          height: 56px;
          border: 1.5px solid var(--acc-navy);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--acc-navy);
          background: #FFFFFF;
          box-shadow: 0 2px 8px rgba(27, 42, 74, 0.08);
          position: relative;
          cursor: pointer;
          overflow: hidden;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cmd-logo-box:hover {
          border-color: #0284C7;
          box-shadow: 0 6px 18px rgba(27, 42, 74, 0.15);
          transform: translateY(-1px);
        }
        .cmd-logo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .cmd-logo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(27, 42, 74, 0.75);
          backdrop-filter: blur(2px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.2s ease;
          border-radius: 10px;
          color: #FFFFFF;
        }
        .cmd-logo-box:hover .cmd-logo-overlay {
          opacity: 1;
        }
        .cmd-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.3rem;
          font-weight: 700;
          margin: 0;
          color: var(--acc-navy);
          line-height: 1.1;
        }
        .cmd-clock {
          font-family: 'Playfair Display', serif;
          font-size: 1.9rem;
          font-weight: 700;
          color: var(--acc-navy);
          text-align: right;
          line-height: 1;
        }
        .cmd-clock-sub {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--acc-sky);
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        /* Live dot pulse */
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7FA8D9;
          box-shadow: 0 0 8px #7FA8D9;
          animation: pulse-live 1.8s infinite;
        }
        @keyframes pulse-live {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.5; }
        }

        /* ── STATS ROW (ELEVATED HERO NUMBERS) ── */
        .cmd-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        .cmd-stat-card {
          background: #FFFFFF;
          border: 1px solid var(--acc-border);
          border-radius: 8px;
          padding: 20px 24px;
          box-shadow: 0 2px 8px rgba(27, 42, 74, 0.06), 0 1px 2px rgba(27, 42, 74, 0.04);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cmd-stat-card:hover {
          transform: translateY(-2px) scale(1.005);
          box-shadow: 0 8px 24px rgba(27, 42, 74, 0.1);
          border-color: rgba(127, 168, 217, 0.5);
        }
        
        .cmd-stat-tag {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--acc-navy);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cmd-stat-tag span {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          color: var(--acc-sky);
          font-size: 0.9rem;
          font-weight: 600;
        }
        .cmd-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 3.2rem;
          font-weight: 700;
          line-height: 1;
          color: var(--acc-navy);
          margin-bottom: 6px;
        }
        .cmd-stat-underline {
          height: 2.5px;
          width: 36px;
          background: linear-gradient(90deg, #1B2A4A 0%, #7FA8D9 100%);
          border-radius: 2px;
          margin-top: 6px;
          margin-bottom: 8px;
        }
        .cmd-stat-sub {
          font-size: 0.74rem;
          color: var(--acc-muted);
          font-style: italic;
        }

        /* ── ADMISSIONS & NEXT QUEUE HERO CARDS ── */
        .cmd-hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          margin-bottom: 36px;
        }
        .cmd-card {
          background: #FFFFFF;
          border: 1px solid var(--acc-border);
          border-radius: 8px;
          padding: 26px;
          box-shadow: 0 2px 8px rgba(27, 42, 74, 0.06), 0 1px 2px rgba(27, 42, 74, 0.04);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cmd-card:hover {
          transform: translateY(-2px) scale(1.005);
          box-shadow: 0 8px 24px rgba(27, 42, 74, 0.1);
        }
        .cmd-card-next {
          background: linear-gradient(135deg, #FFFFFF 0%, #F4F7FB 100%);
          border: 1.5px solid #7FA8D9;
          box-shadow: 0 6px 20px rgba(27, 42, 74, 0.08), 0 0 15px rgba(127, 168, 217, 0.2);
        }

        .cmd-card-tag {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--acc-navy);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cmd-card-desc {
          font-size: 0.88rem;
          color: var(--acc-navy);
          line-height: 1.55;
          margin-bottom: 24px;
          font-weight: 500;
        }
        .cmd-btn-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cmd-btn-solid {
          background: linear-gradient(135deg, #1B2A4A 0%, #24365C 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          padding: 11px 20px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(27, 42, 74, 0.25);
        }
        .cmd-btn-solid:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 18px rgba(27, 42, 74, 0.35);
          filter: brightness(1.1);
        }
        .cmd-btn-solid:active {
          transform: translateY(0) scale(0.98);
        }

        .cmd-btn-outline {
          background: #FFFFFF;
          color: var(--acc-navy);
          border: 1px solid rgba(27, 42, 74, 0.22);
          border-radius: 6px;
          padding: 11px 20px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cmd-btn-outline:hover {
          background: rgba(127, 168, 217, 0.12);
          border-color: var(--acc-navy);
          transform: translateY(-1.5px);
        }
        .cmd-btn-outline:active {
          transform: translateY(0) scale(0.98);
        }

        /* ── TABS ── */
        .cmd-tabs {
          display: flex;
          gap: 28px;
          border-bottom: 1.5px solid var(--acc-border);
          margin-bottom: 28px;
        }
        .cmd-tab {
          background: none;
          border: none;
          padding: 0 4px 12px 4px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--acc-muted);
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          transition: all 0.2s ease;
        }
        .cmd-tab:hover {
          color: var(--acc-navy);
          border-bottom-color: var(--acc-sky);
        }
        .cmd-tab.active {
          color: var(--acc-navy);
          border-bottom-color: var(--acc-navy);
        }

        /* ── DUAL SECTION GRID ── */
        .cmd-split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-bottom: 40px;
        }
        .cmd-sec-card {
          background: #FFFFFF;
          border: 1px solid var(--acc-border);
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(27, 42, 74, 0.06);
        }
        .cmd-sec-title {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--acc-navy);
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--acc-line);
        }

        /* Table Arrivals */
        .cmd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }
        .cmd-table th {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--acc-muted);
          text-align: left;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--acc-line);
        }
        .cmd-table td {
          padding: 12px 6px;
          border-bottom: 1px solid var(--acc-line);
          vertical-align: middle;
          transition: background 0.18s;
        }
        .cmd-table tr:hover td {
          background: rgba(127, 168, 217, 0.08);
        }

        /* Classroom list */
        .cmd-class-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 8px;
          border-bottom: 1px solid var(--acc-line);
          transition: background 0.18s;
          border-radius: 6px;
        }
        .cmd-class-row:hover {
          background: rgba(127, 168, 217, 0.08);
        }
        .cmd-class-code {
          font-family: monospace;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--acc-navy);
          width: 65px;
        }
        .cmd-class-name {
          font-family: 'Playfair Display', serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--acc-navy);
        }
        .cmd-class-sub {
          font-size: 0.72rem;
          color: var(--acc-muted);
        }
        .cmd-progress-bg {
          width: 110px;
          height: 6px;
          background: #E2E8F0;
          border-radius: 3px;
          overflow: hidden;
          margin-top: 6px;
        }
        .cmd-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1B2A4A 0%, #7FA8D9 100%);
          border-radius: 3px;
          transition: width 0.8s ease-out;
        }

        /* Bottom Section Grid */
        .cmd-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-top: 12px;
        }

        /* Footer */
        .cmd-footer {
          margin-top: 40px;
          border-top: 1px solid var(--acc-line);
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--acc-muted);
          font-style: italic;
        }

        .cmd-brand-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .cmd-subtitle-line {
          font-size: 0.82rem;
          font-weight: 600;
          color: #5A6E85;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          flex-wrap: wrap;
        }
        .cmd-header-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        @media (max-width: 900px) {
          .cmd-root { padding: 16px 12px; }
          .cmd-stats-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .cmd-hero-grid, .cmd-split-grid, .cmd-bottom-grid { grid-template-columns: 1fr; gap: 16px; }
        }

        @media (max-width: 640px) {
          .cmd-desktop-only { display: none !important; }
          .cmd-root { padding: 12px 10px; }
          .cmd-meta-bar {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
          }
          .cmd-meta-pill-input {
            min-width: 120px;
            max-width: 155px;
            padding: 5px 8px 5px 26px;
            font-size: 0.72rem;
          }
          .cmd-header {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            margin-bottom: 20px;
          }
          .cmd-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }
          .cmd-logo-box {
            width: 44px;
            height: 44px;
            font-size: 1.4rem;
            border-radius: 9px;
            flex-shrink: 0;
          }
          .cmd-title {
            font-size: 1.18rem !important;
            line-height: 1.25 !important;
          }
          .cmd-subtitle-line {
            font-size: 0.72rem;
            margin-top: 2px;
          }
          .cmd-header-right {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding-top: 10px;
            border-top: 1px solid rgba(27, 42, 74, 0.08);
          }
          .cmd-clock {
            font-size: 1.35rem;
            text-align: left;
          }
          .cmd-clock-sub {
            justify-content: flex-start;
          }
          .cmd-stats-row { grid-template-columns: 1fr 1fr !important; gap: 8px !important; margin-bottom: 16px !important; }
          .cmd-stat-card { padding: 10px 10px !important; }
          .cmd-stat-tag { font-size: 0.56rem !important; letter-spacing: 0.05em !important; margin-bottom: 4px !important; }
          .cmd-stat-val { font-size: 1.45rem !important; margin-bottom: 2px !important; }
          .cmd-stat-underline { margin-top: 2px !important; margin-bottom: 4px !important; width: 28px !important; }
          .cmd-stat-sub { font-size: 0.65rem !important; }
          .cmd-hero-grid { margin-bottom: 18px !important; gap: 12px !important; }
          .cmd-card { padding: 14px 14px !important; }
          .cmd-card-desc { font-size: 0.78rem !important; margin-bottom: 10px !important; line-height: 1.4 !important; }
          .cmd-card-tag { margin-bottom: 8px !important; font-size: 0.6rem !important; }
          .cmd-sec-card { padding: 14px 14px !important; margin-bottom: 16px !important; }
          .cmd-btn-group { flex-direction: column; width: 100%; gap: 6px !important; }
          .cmd-btn-group button, .cmd-btn-solid, .cmd-btn-outline { width: 100%; justify-content: center; text-align: center; padding: 9px 12px !important; }
          .cmd-card-actions { flex-direction: row; gap: 6px !important; }
          .btn-admit, .btn-notify, .btn-skip { flex: 1; padding: 8px 6px !important; font-size: 0.68rem !important; }
          .cmd-tabs { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; width: 100% !important; gap: 6px !important; margin-bottom: 16px !important; overflow: hidden !important; border-bottom: 1.5px solid var(--acc-border) !important; }
          .cmd-tab { padding: 6px 4px !important; text-align: center !important; justify-content: center !important; display: flex !important; flex-direction: column !important; align-items: center !important; }
          .cmd-tab-title { font-size: 0.68rem !important; letter-spacing: 0.03em !important; line-height: 1.15 !important; }
          .cmd-tab-sub { font-size: 0.6rem !important; margin-top: 2px !important; }
        }

        /* ── 3 ACTION BUTTON SYSTEM (ADMIT, NOTIFY, SKIP) ── */
        .cmd-card-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        .btn-admit {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }
        .btn-admit:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 18px rgba(5, 150, 105, 0.38);
          filter: brightness(1.08);
        }
        .btn-admit:active {
          transform: translateY(0) scale(0.97);
        }

        .btn-notify {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #FEF3C7;
          color: #D97706;
          border: 1.5px solid #F59E0B;
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-notify:hover {
          background: #FDE68A;
          border-color: #D97706;
          transform: translateY(-1.5px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
        }
        .btn-notify:active {
          transform: translateY(0) scale(0.97);
        }

        .btn-skip {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #F1F5F9;
          color: #475569;
          border: 1.5px solid #CBD5E1;
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-skip:hover {
          background: #FEE2E2 !important;
          color: #DC2626 !important;
          border-color: #FCA5A5 !important;
          transform: translateY(-1.5px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
        }
        .btn-skip:active {
          transform: translateY(0) scale(0.97);
        }

        /* Bigger Table Action Buttons */
        .btn-admit-sm {
          padding: 8px 16px !important;
          font-size: 0.78rem !important;
          font-weight: 800 !important;
          background: #059669 !important;
          color: #FFF !important;
          border: none !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          letter-spacing: 0.02em !important;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25) !important;
        }
        .btn-admit-sm:hover { background: #047857 !important; transform: translateY(-1.5px) !important; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.38) !important; }
        .btn-admit-sm:active { transform: scale(0.97) !important; }

        .btn-notify-sm {
          padding: 8px 16px !important;
          font-size: 0.78rem !important;
          font-weight: 800 !important;
          background: #FEF3C7 !important;
          color: #D97706 !important;
          border: 1.5px solid #F59E0B !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          letter-spacing: 0.02em !important;
        }
        .btn-notify-sm:hover { background: #FDE68A !important; border-color: #D97706 !important; transform: translateY(-1.5px) !important; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25) !important; }
        .btn-notify-sm:active { transform: scale(0.97) !important; }

        .btn-skip-sm {
          padding: 8px 16px !important;
          font-size: 0.78rem !important;
          font-weight: 800 !important;
          background: #F1F5F9 !important;
          color: #475569 !important;
          border: 1.5px solid #CBD5E1 !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          letter-spacing: 0.02em !important;
        }
        .btn-skip-sm:hover { background: #FEE2E2 !important; color: #DC2626 !important; border-color: #FCA5A5 !important; transform: translateY(-1.5px) !important; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2) !important; }
        .btn-skip-sm:active { transform: scale(0.97) !important; }
      `}</style>

      {/* ── MODAL: MANUAL CHECK-IN ── */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(27, 42, 74, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} style={{ background: '#FFFFFF', border: '1.5px solid #1B2A4A', borderRadius: 8, padding: 26, maxWidth: 440, width: '100%', boxShadow: '0 20px 50px rgba(27, 42, 74, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1B2A4A' }}>Manual Student Check-in</h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6E85' }}><X style={{ width: 18, height: 18 }} /></button>
              </div>

              <form onSubmit={handleManualCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 4, color: '#1B2A4A' }}>Student Name *</label>
                  <input type="text" required value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="e.g. Arush Kshatriya" style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F4F7FB' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 4, color: '#1B2A4A' }}>Grade/Section/Branch</label>
                  <input type="text" value={gradeClass} onChange={e => setGradeClass(e.target.value)} placeholder="e.g. Grade 8-B / FY-CS" style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F4F7FB' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 4, color: '#1B2A4A' }}>Check-in Reason</label>
                  <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Admission / Fee / PTM" style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F4F7FB' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 4, color: '#1B2A4A' }}>WhatsApp Number</label>
                  <input type="tel" maxLength={10} value={guardianName} onChange={e => setGuardianName(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="e.g. 9876543210" style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F4F7FB' }} />
                </div>
                <button type="submit" className="cmd-btn-solid" style={{ marginTop: 8, padding: '12px 20px' }}>Confirm Check-in →</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: EDIT SCHOOL NAME & LOGO ── */}
      <AnimatePresence>
        {showEditSchoolModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(27, 42, 74, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} style={{ background: '#FFFFFF', border: '1.5px solid #1B2A4A', borderRadius: 8, padding: 26, maxWidth: 440, width: '100%', boxShadow: '0 20px 50px rgba(27, 42, 74, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1B2A4A' }}>School Identity & Crest</h3>
                <button onClick={() => setShowEditSchoolModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6E85' }}><X style={{ width: 18, height: 18 }} /></button>
              </div>

              <form onSubmit={saveSchoolName} style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#1B2A4A' }}>Official School Name *</label>
                  <input type="text" required value={newSchoolNameInput} onChange={e => setNewSchoolNameInput(e.target.value)} placeholder="e.g. Ashbourne Academy, Delhi Public School" style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F4F7FB', fontSize: '0.9rem', fontWeight: 700, color: '#1B2A4A' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#1B2A4A' }}>School Tagline / Subtitle Description</label>
                  <input type="text" value={schoolSubtitle} onChange={e => setSchoolSubtitle(e.target.value)} placeholder="e.g. Campus Operations & Gate Control Console" style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F4F7FB', fontSize: '0.85rem', color: '#1B2A4A' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#1B2A4A' }}>City / Campus Location</label>
                  <input type="text" value={schoolCity} onChange={e => setSchoolCity(e.target.value)} placeholder="e.g. Mumbai, New Delhi, Bengaluru" style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F4F7FB', fontSize: '0.85rem', color: '#1B2A4A' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#1B2A4A' }}>School / Institute Crest Logo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F4F7FB', border: '1px solid #CBD5E1', borderRadius: 8, padding: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 6, border: '1.5px solid #1B2A4A', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {schoolLogo || clinic?.logo_url ? (
                        <img src={schoolLogo || clinic.logo_url} alt="Crest Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
                      ) : (
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#1B2A4A' }}>{(newSchoolNameInput || 'A').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <button type="button" onClick={() => modalFileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#FFFFFF', border: '1px solid #1B2A4A', color: '#1B2A4A', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                        <Upload style={{ width: 14, height: 14, color: '#0284C7' }} />
                        <span>Upload Crest Image</span>
                      </button>
                      <input type="file" ref={modalFileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
                      <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: 4 }}>PNG, JPG, SVG or WebP up to 5MB</div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="cmd-btn-solid" style={{ padding: '12px 20px', marginTop: 4 }}>Save Changes →</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: BROADCAST NOTICE TO QUEUE ── */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(27, 42, 74, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} style={{ background: '#FFFFFF', border: '1.5px solid #1B2A4A', borderRadius: 8, padding: 26, maxWidth: 460, width: '100%', boxShadow: '0 20px 50px rgba(27, 42, 74, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1B2A4A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Megaphone style={{ width: 18, height: 18, color: '#3B82F6' }} />
                  <span>Broadcast Notice to Queue</span>
                </h3>
                <button onClick={() => setShowBroadcastModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6E85' }}><X style={{ width: 18, height: 18 }} /></button>
              </div>

              <form onSubmit={handleSendBroadcastNotice} style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#1B2A4A' }}>Announcement Message / Public Notice *</label>
                  <textarea
                    required
                    rows={4}
                    value={broadcastMsgText}
                    onChange={e => setBroadcastMsgText(e.target.value)}
                    placeholder="e.g. Campus gates are open for Grade 8 PTM. Please have your student tokens ready..."
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F4F7FB', fontSize: '0.88rem', color: '#1B2A4A', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
                {activeNotice && (
                  <div style={{ padding: '8px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: '0.75rem', color: '#1E40AF' }}>
                    <strong>Active Live Notice:</strong> "{activeNotice}"
                  </div>
                )}
                <button type="submit" className="cmd-btn-solid" style={{ padding: '12px 20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
                  <Megaphone style={{ width: 16, height: 16 }} />
                  <span>Broadcast Notice Now →</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: CONFIRM SKIP / REMOVE FROM QUEUE ── */}
      <AnimatePresence>
        {skipTarget && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(27, 42, 74, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} style={{ background: '#FFFFFF', border: '1.5px solid #1B2A4A', borderRadius: 10, padding: 24, maxWidth: 420, width: '100%', boxShadow: '0 20px 50px rgba(27, 42, 74, 0.3)', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <AlertTriangle style={{ width: 26, height: 26 }} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1B2A4A' }}>
                Skip & Remove from Queue?
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#5A6E85', margin: '0 0 20px', lineHeight: 1.45 }}>
                Are you sure you want to remove <strong>"{skipTarget.name}"</strong> ({skipTarget.grade}) from the active queue? This will cancel their token.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setSkipTarget(null)} className="cmd-btn-outline" style={{ flex: 1, padding: '10px 14px', fontSize: '0.8rem', fontWeight: 700 }}>
                  Cancel
                </button>
                <button type="button" onClick={() => confirmRemoveFromQueue(skipTarget.id)} className="cmd-btn-solid" style={{ flex: 1, padding: '10px 14px', fontSize: '0.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)', color: '#FFF', border: 'none' }}>
                  Yes, Remove →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── NOTIFICATION TOAST BANNER (MEMBER NOTIFIED TO BE READY) ── */}
      <AnimatePresence>
        {notifyToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              background: '#FFFFFF',
              color: '#1B2A4A',
              border: '1.5px solid #F59E0B',
              borderRadius: 8,
              padding: '12px 18px',
              boxShadow: '0 12px 36px rgba(27, 42, 74, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            <div style={{ background: '#FEF3C7', color: '#D97706', borderRadius: '50%', padding: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div style={{ color: '#D97706', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Notification Alert</div>
              <div style={{ color: '#1B2A4A', fontSize: '0.86rem', fontWeight: 700 }}>{notifyToast}</div>
            </div>
            <button onClick={() => setNotifyToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', marginLeft: 8 }}><X style={{ width: 16, height: 16 }} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .drawer-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          background: transparent;
          border-left: 3.5px solid transparent;
          color: #1B2A4A;
          font-weight: 600;
          font-size: 0.86rem;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .drawer-nav-item:hover {
          background: #F4F7FB;
          border-left-color: #CBD5E1;
        }
        .drawer-nav-item.active {
          background: #EFF4FA;
          border-left-color: #1B2A4A;
          color: #1B2A4A;
          font-weight: 700;
        }
        .drawer-icon-badge {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          background: #EFF4FA;
          color: #1B2A4A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 150ms ease;
        }
        .drawer-nav-item:hover .drawer-icon-badge {
          transform: scale(1.04);
        }

        .drawer-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 10px;
          transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .drawer-logout-btn:hover {
          background: #FEE2E2;
          border-color: #FCA5A5;
        }

        .cmd-btn-solid, .cmd-btn-outline, .cmd-tab, .cmd-stat-card, .cmd-card {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .cmd-btn-solid:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(27, 42, 74, 0.25);
        }
        .cmd-btn-outline:hover {
          background: #F8FAFC;
          border-color: #1B2A4A;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="cmd-root">
        {/* ── TOP CONTROL STRIP ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="cmd-meta-bar">
          {/* Left Group: Live Date */}
          <div className="cmd-meta-group">
            <div className="cmd-meta-label">
              <Calendar style={{ width: 14, height: 14, color: '#3B82F6' }} />
              <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Center Group: Serif Identity Anchor (Desktop Only to prevent mobile duplicate repeat) */}
          <div 
            onClick={() => { setNewSchoolNameInput(clinic?.name || 'Ashbourne Academy'); setShowEditSchoolModal(true); }}
            className="cmd-meta-school-btn cmd-desktop-only"
            title="Click to edit official school name & logo"
          >
            <Building style={{ width: 15, height: 15, color: '#3B82F6' }} />
            <span className="cmd-meta-school-title">{clinic?.name || 'Ashbourne Academy'}</span>
            <Pencil style={{ width: 12, height: 12, color: '#3B82F6', marginLeft: 2 }} />
          </div>

          {/* Right Group: Active Queue Location Refined Input Pill */}
          <div className="cmd-meta-group">
            <span className="cmd-meta-label" style={{ color: '#5A6E85' }}>LOCATION:</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MapPin style={{ width: 14, height: 14, color: '#3B82F6', position: 'absolute', left: 10, pointerEvents: 'none' }} />
              <input
                type="text"
                value={activeRoom}
                onChange={handleRoomChange}
                placeholder="Active room / Gate..."
                className="cmd-meta-pill-input"
              />
            </div>
          </div>
        </motion.div>

        {/* ── HEADER ── */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="cmd-header">
          <div className="cmd-brand">
            <div 
              className="cmd-logo-box" 
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload School Crest / Logo"
            >
              {schoolLogo || clinic?.logo_url ? (
                <img 
                  src={schoolLogo || clinic.logo_url} 
                  alt="School Crest Logo" 
                />
              ) : (
                <span>{(clinic?.name || 'A').charAt(0).toUpperCase()}</span>
              )}
              <div className="cmd-logo-overlay">
                <Camera style={{ width: 15, height: 15, color: '#FFFFFF' }} />
                <span style={{ fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase' }}>LOGO</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
            <div className="cmd-brand-info">
              <h1 
                className="cmd-title" 
                onClick={() => { setNewSchoolNameInput(clinic?.name || 'Ashbourne Academy'); setSchoolCity(clinic?.city || ''); setShowEditSchoolModal(true); }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                title="Click to edit school name & city"
              >
                <span>{clinic?.name || 'Ashbourne Academy'}</span>
                <Pencil style={{ width: 15, height: 15, color: '#7FA8D9', display: 'inline-block' }} />
              </h1>
              <div 
                className="cmd-subtitle-line"
                onClick={() => { setNewSchoolNameInput(clinic?.name || 'Ashbourne Academy'); setSchoolCity(clinic?.city || ''); setShowEditSchoolModal(true); }}
                title="Click to edit description tagline & city"
              >
                <span>{schoolSubtitle || clinic?.specialty || 'Campus Operations & Gate Control Console'}</span>
                {clinic?.city && <><span style={{ opacity: 0.45 }}>•</span><span style={{ fontWeight: 700, color: '#1B2A4A' }}>{clinic.city}</span></>}
              </div>
            </div>
          </div>

          <div className="cmd-header-right">
            <div className="cmd-clock">
              <AnimatedClock />
              <div className="cmd-clock-sub">
                <span className="live-dot" /> SESSION ACTIVE • TERM II
              </div>
            </div>
            <button 
              className="hamburger-btn" 
              onClick={() => setShowNavMenu(!showNavMenu)}
              title="Open Navigation Menu"
              style={{ background: '#FFFFFF', border: '1.5px solid #1B2A4A', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(27,42,74,0.06)' }}
            >
              <Menu style={{ width: 22, height: 22, color: '#1B2A4A' }} />
            </button>
          </div>
        </motion.header>

        {/* ── STATS ROW (ELEVATED HERO CARDS) ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="cmd-stats-row">
          {/* Card 1 */}
          <div className="cmd-stat-card">
            <div className="cmd-stat-tag">
              AWAITING CHECK-IN
              <Users className="w-3.5 h-3.5 text-[#7FA8D9]" />
            </div>
            <div className="cmd-stat-val"><AnimatedNumber value={arrivals.length} /></div>
            <div className="cmd-stat-underline" />
            <div className="cmd-stat-sub">at the front desk</div>
          </div>

          {/* Card 2 */}
          <div className="cmd-stat-card">
            <div className="cmd-stat-tag">
              WITH STAFF
              <UserCheck className="w-3.5 h-3.5 text-[#7FA8D9]" />
            </div>
            <div className="cmd-stat-val">
              <AnimatedNumber value={withStaff.length} />
            </div>
            <div className="cmd-stat-underline" />
            <div className="cmd-stat-sub">
              {withStaff.length > 0 ? `${withStaff.length} active consultation${withStaff.length > 1 ? 's' : ''}` : 'no active consultations'}
            </div>
          </div>

          {/* Card 3 */}
          <div className="cmd-stat-card">
            <div className="cmd-stat-tag">
              COMPLETED TODAY
              <UserCheck className="w-3.5 h-3.5 text-[#7FA8D9]" />
            </div>
            <div className="cmd-stat-val"><AnimatedNumber value={dismissals.length} /></div>
            <div className="cmd-stat-underline" />
            <div className="cmd-stat-sub">consultations completed</div>
          </div>

          {/* Card 4 */}
          <div className="cmd-stat-card">
            <div className="cmd-stat-tag">
              PEOPLE IN QUEUE
              <Clock className="w-3.5 h-3.5 text-[#7FA8D9]" />
            </div>
            <div className="cmd-stat-val">
              <AnimatedNumber value={arrivals.length} />
            </div>
            <div className="cmd-stat-underline" />
            <div className="cmd-stat-sub">{arrivals.length > 0 ? `${arrivals.length} student${arrivals.length > 1 ? 's' : ''} in queue` : 'queue is clear'}</div>
          </div>
        </motion.div>

        {/* ── LIVE QUEUE CONTROL (FULL WIDTH HERO CARD) ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} style={{ marginBottom: 24 }}>
          <div className="cmd-card" style={{ width: '100%' }}>
            <div className="cmd-card-tag">
              <span>LIVE QUEUE CONTROL & BROADCAST CONSOLE</span>
              <ShieldCheck className="w-4 h-4 text-[#7FA8D9]" />
            </div>
            <div className="cmd-card-desc" style={{ marginBottom: 16 }}>
              Scan the campus QR code to instantly join the live queue. Broadcast live public notices to all queued students & parents or manually manage check-in records.
            </div>
            {activeNotice && (
              <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: 8, marginBottom: 16, fontSize: '0.8rem', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Megaphone style={{ width: 16, height: 16, color: '#2563EB', flexShrink: 0 }} />
                  <span><strong>Active Notice:</strong> "{activeNotice}"</span>
                </div>
                <button onClick={() => { setActiveNotice(''); localStorage.removeItem('tokenpe_active_notice'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '0.72rem', fontWeight: 700 }}>Clear Notice</button>
              </div>
            )}
            <div className="cmd-btn-group">
              <button className="cmd-btn-solid" onClick={() => setShowQR(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <QrCode style={{ width: 15, height: 15 }} />
                <span>Display Campus QR Code</span>
              </button>
              <button className="cmd-btn-outline" onClick={() => setShowAddModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <UserPlus style={{ width: 14, height: 14 }} />
                <span>Manual Check-in</span>
              </button>
              <button className="cmd-btn-outline" onClick={() => setShowBroadcastModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: '#3B82F6', color: '#1D4ED8', background: '#EFF6FF', fontWeight: 700 }}>
                <Megaphone style={{ width: 15, height: 15, color: '#2563EB' }} />
                <span>Broadcast Notice to Queue</span>
              </button>
              {queuePaused ? (
                <button className="cmd-btn-outline" onClick={togglePauseQueue} title="Click to resume queue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: '#EF4444', color: '#DC2626', background: '#FEF2F2', fontWeight: 700 }}>
                  <Pause style={{ width: 14, height: 14, color: '#EF4444' }} />
                  <span>Queue is paused</span>
                </button>
              ) : (
                <button className="cmd-btn-outline" onClick={togglePauseQueue} title="Click to pause queue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: '#10B981', color: '#059669', background: '#ECFDF5', fontWeight: 700 }}>
                  <Play style={{ width: 14, height: 14, color: '#10B981' }} />
                  <span>Queue is active</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── TABS (ARRIVALS & COMPLETED ONLY) ── */}
        <div className="cmd-tabs">
          <button className={`cmd-tab ${tab === 'arrivals' ? 'active' : ''}`} onClick={() => setTab('arrivals')}>
            <span className="cmd-tab-title">ARRIVALS</span>
            <span className="cmd-tab-sub">({arrivals.length})</span>
          </button>
          <button className={`cmd-tab ${tab === 'dismissals' ? 'active' : ''}`} onClick={() => setTab('dismissals')}>
            <span className="cmd-tab-title">COMPLETED</span>
            <span className="cmd-tab-sub">({dismissals.length})</span>
          </button>
        </div>

        {/* ── AWAITING CHECK-IN & ACTIVE CONSULTATION HERO ROW (ARRIVALS TAB ONLY) ── */}
        {tab === 'arrivals' && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          {/* 2-Column Split: Left = WITH STAFF, Right = NEXT IN QUEUE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
            
            {/* Left Half: WITH STAFF SECTION */}
            <div className="cmd-card" style={{ border: '2.5px solid #059669', background: 'linear-gradient(135deg, #FFFFFF 0%, #ECFDF5 100%)', boxShadow: '0 10px 30px rgba(5, 150, 105, 0.12)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="cmd-card-tag" style={{ marginBottom: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#047857', fontSize: '0.75rem' }}>
                    <span className="live-dot" style={{ background: '#10B981', boxShadow: '0 0 8px #10B981' }} /> ACTIVE CONSULTATION • WITH STAFF
                  </span>
                  <span style={{ fontSize: '0.6rem', background: '#059669', color: '#FFF', padding: '3px 8px', borderRadius: 4, fontWeight: 800 }}>({withStaff.length}) ACTIVE</span>
                </div>

                {withStaff.length === 0 ? (
                  <div style={{ color: '#059669', fontSize: '0.85rem', padding: '24px 16px', fontWeight: 600, textAlign: 'center', background: '#FFFFFF', borderRadius: 8, border: '1px dashed #A7F3D0' }}>
                    No members currently in consultation with staff
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                    {withStaff.map((s) => (
                      <div key={s.id} style={{ background: '#FFFFFF', border: '1.5px solid #A7F3D0', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div>
                          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', fontWeight: 700, color: '#1B2A4A' }}>{s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, marginTop: 2 }}>{s.grade || 'General'} • {s.reason || 'Consultation'}</div>
                        </div>
                        <button
                          onClick={() => handleCompleteStaff(s.id)}
                          className="btn-admit-sm"
                          style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
                          title="Mark session complete and send to Dismissed"
                        >
                          <CheckCircle2 style={{ width: 15, height: 15 }} />
                          <span>Done</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Half: NEXT IN QUEUE CARD */}
            <div className="cmd-card cmd-card-next" style={{ border: '2.5px solid #1B2A4A', background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF4FA 100%)', boxShadow: '0 10px 30px rgba(27, 42, 74, 0.12), 0 0 0 1px rgba(127, 168, 217, 0.4)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="cmd-card-tag" style={{ marginBottom: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#1B2A4A', fontSize: '0.75rem' }}>
                    <span className="live-dot" /> 1ST IN LINE • IMMEDIATE ADMIT
                  </span>
                  <span style={{ fontSize: '0.6rem', background: '#1B2A4A', color: '#FFF', padding: '3px 8px', borderRadius: 4, fontWeight: 800 }}>NEXT IN QUEUE</span>
                </div>
                {nextInQueue ? (
                  <div>
                    {/* Clean 3-Field Grid: Name, Class, Reason */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.12)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>STUDENT NAME</span>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: '#1B2A4A' }}>{nextInQueue.name}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>CLASS / GRADE</span>
                        <span style={{ fontWeight: 700, color: '#1B2A4A', fontSize: '0.88rem' }}>{nextInQueue.grade || '—'}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>REASON</span>
                        <span style={{ fontWeight: 700, color: '#1B2A4A', fontSize: '0.88rem' }}>{nextInQueue.reason || 'Arrival'}</span>
                      </div>
                    </div>

                    <div className="cmd-card-actions">
                      <button className="btn-admit" onClick={() => handleAdmit(nextInQueue.id)} title="Admit Student to Staff Consultation">
                        <CheckCircle2 style={{ width: 14, height: 14 }} />
                        <span>Admit</span>
                      </button>
                      <button className="btn-notify" onClick={() => handleNotify(nextInQueue)} title="Notify Guardian via In-App Alert">
                        <Bell style={{ width: 14, height: 14 }} />
                        <span>Notify</span>
                      </button>
                      <button className="btn-skip" onClick={() => handleSkip(nextInQueue)} title="Remove student from queue">
                        <XCircle style={{ width: 14, height: 14 }} />
                        <span>Skip</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#5A6E85', fontSize: '0.85rem', padding: '24px 16px', fontWeight: 600, textAlign: 'center', background: '#FFFFFF', borderRadius: 8, border: '1px dashed #CBD5E1' }}>No students currently awaiting admission in queue</div>
                )}
              </div>
            </div>

          </div>
          <div className="cmd-sec-card" style={{ marginBottom: 28 }}>
            <div className="cmd-sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span>AWAITING CHECK-IN ({arrivals.length} STUDENTS)</span>
              <span style={{ fontSize: '0.72rem', color: '#5A6E85', textTransform: 'none', fontWeight: 600 }}>Active Queue Records</span>
            </div>

            {arrivals.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#5A6E85', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1' }}>
                No students currently awaiting check-in
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {arrivals.map((a, idx) => (
                  <div
                    key={a.id}
                    className="cmd-card"
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid rgba(27, 42, 74, 0.12)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      boxShadow: '0 4px 14px rgba(27, 42, 74, 0.05)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Info Grid with Labeled Headings & Lucide Icons */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px 14px', marginBottom: 14, background: '#F8FAFC', padding: '12px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <Hash style={{ width: 11, height: 11, color: '#3B82F6' }} /> S.NO.
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1B2A4A', fontSize: '0.92rem', background: '#E2E8F0', padding: '2px 8px', borderRadius: 4, display: 'inline-block' }}>
                          #{a.rank}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <User style={{ width: 11, height: 11, color: '#3B82F6' }} /> STUDENT NAME
                        </span>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: '#1B2A4A' }}>{a.name}</span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <GraduationCap style={{ width: 11, height: 11, color: '#3B82F6' }} /> CLASS / GRADE
                        </span>
                        <span style={{ fontWeight: 700, color: '#1B2A4A', fontSize: '0.88rem' }}>{a.grade || '—'}</span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <HelpCircle style={{ width: 11, height: 11, color: '#3B82F6' }} /> REASON
                        </span>
                        <span style={{ fontWeight: 700, color: '#0284C7', fontSize: '0.88rem' }}>{a.reason || 'Arrival'}</span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <Phone style={{ width: 11, height: 11, color: '#3B82F6' }} /> CONTACT NUMBER
                        </span>
                        <span style={{ fontWeight: 700, color: '#1B2A4A', fontFamily: 'monospace', fontSize: '0.85rem' }}>{a.guardian || '—'}</span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <Clock style={{ width: 11, height: 11, color: '#3B82F6' }} /> JOIN TIME
                        </span>
                        <span style={{ fontWeight: 700, color: '#1B2A4A', fontFamily: 'monospace', fontSize: '0.85rem' }}>{a.time || 'Just now'}</span>
                      </div>
                    </div>

                    {/* Action Buttons with Lucide Icons */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button onClick={() => handleAdmit(a.id)} className="btn-admit-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Admit Student">
                        <CheckCircle2 style={{ width: 15, height: 15 }} />
                        <span>Admit</span>
                      </button>
                      <button onClick={() => handleNotify(a.id)} className="btn-notify-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Notify Guardian via WhatsApp/SMS">
                        <Bell style={{ width: 15, height: 15 }} />
                        <span>Notify</span>
                      </button>
                      <button onClick={() => handleSkip(a)} className="btn-skip-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Remove from Queue">
                        <XCircle style={{ width: 15, height: 15 }} />
                        <span>Skip</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>}

        {/* ── COMPLETED TAB VIEW ── */}
        {tab === 'dismissals' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: 28 }}>
            <div className="cmd-sec-card">
              <div className="cmd-sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span>COMPLETED RECORDS ({dismissals.length} STUDENTS)</span>
                <span style={{ fontSize: '0.72rem', color: '#5A6E85', textTransform: 'none', fontWeight: 600 }}>Completed Consultations Today</span>
              </div>
              {dismissals.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#5A6E85', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1' }}>
                  No completed records logged today
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {dismissals.map((d, idx) => (
                    <div key={idx} style={{ padding: '12px 16px', background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(27,42,74,0.04)' }}>
                      <div>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', fontWeight: 700, color: '#1B2A4A' }}>{d.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#5A6E85', marginTop: 2 }}>{d.grade || 'General'} • {d.guardian || 'N/A'}</div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 8px', borderRadius: 6 }}>
                        {d.time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* QR MODAL */}
      {showQR && <QRModal clinic={clinic} onClose={() => setShowQR(false)} />}

      {/* NAVIGATION DRAWER MODAL (PREMIUM NAVY & SERIF DESIGN SYSTEM) */}
      <AnimatePresence>
        {showNavMenu && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end', background: 'rgba(27, 42, 74, 0.35)', backdropFilter: 'blur(6px)' }} onClick={() => setShowNavMenu(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 380 }} style={{ width: 340, background: '#FFFFFF', height: '100%', padding: '18px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '-8px 0 36px rgba(27,42,74,0.18)' }} onClick={e => e.stopPropagation()}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {/* 5. TOP HEADER AREA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(27, 42, 74, 0.08)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 9, background: '#1B2A4A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: '1.15rem', overflow: 'hidden', boxShadow: '0 2px 8px rgba(27, 42, 74, 0.15)' }}>
                      {schoolLogo || clinic?.logo_url ? (
                        <img src={schoolLogo || clinic.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (clinic?.name || 'A').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      {/* 2. TYPOGRAPHY: Playfair Display Serif School Name */}
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', fontWeight: 700, color: '#1B2A4A', lineHeight: 1.2 }}>{clinic?.name || 'Ashbourne Academy'}</div>
                      {/* Code Tag: Styled in Navy Accent Monospace Pill */}
                      <div style={{ fontSize: '0.7rem', color: '#5A6E85', fontWeight: 600, marginTop: 2 }}>
                        Code: <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1B2A4A', background: '#EFF4FA', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>{clinic?.code || 'ASHBOURNE'}</span>
                      </div>
                    </div>
                  </div>
                  {/* Ghost Close Button */}
                  <button onClick={() => setShowNavMenu(false)} style={{ background: '#EFF4FA', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B2A4A', transition: 'all 150ms ease' }} onMouseOver={e => e.currentTarget.style.background = '#E2E8F0'} onMouseOut={e => e.currentTarget.style.background = '#EFF4FA'} title="Close Menu">
                    <X size={17} strokeWidth={2.2} />
                  </button>
                </div>

                {/* 2. TYPOGRAPHY: Section Label in Small-Caps Letter-Spaced Style */}
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5A6E85', marginBottom: 10, paddingLeft: 4, flexShrink: 0 }}>
                  NAVIGATION & SERVICES
                </div>

                {/* SCROLLABLE MENU ITEMS LIST */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 2 }}>
                  <button onClick={() => { setTab('arrivals'); setShowNavMenu(false); }} className={`drawer-nav-item ${tab === 'arrivals' ? 'active' : ''}`}>
                    <div className="drawer-icon-badge"><Users size={17} strokeWidth={2} /></div>
                    <span className="drawer-item-title">Arrivals & Live Queue</span>
                  </button>

                  <button onClick={() => { setTab('classrooms'); setShowNavMenu(false); }} className={`drawer-nav-item ${tab === 'classrooms' ? 'active' : ''}`}>
                    <div className="drawer-icon-badge"><DoorOpen size={17} strokeWidth={2} /></div>
                    <span className="drawer-item-title">Classrooms in Session</span>
                  </button>

                  <button onClick={() => { setTab('dismissals'); setShowNavMenu(false); }} className={`drawer-nav-item ${tab === 'dismissals' ? 'active' : ''}`}>
                    <div className="drawer-icon-badge"><UserCheck size={17} strokeWidth={2} /></div>
                    <span className="drawer-item-title">Dismissal History</span>
                  </button>

                  <button onClick={() => { router.push('/school-dashboard/analytics'); setShowNavMenu(false); }} className="drawer-nav-item">
                    <div className="drawer-icon-badge"><BarChart2 size={17} strokeWidth={2} /></div>
                    <span className="drawer-item-title">Campus Analytics & Reports</span>
                  </button>

                  <button onClick={() => { router.push('/school-dashboard/crm'); setShowNavMenu(false); }} className="drawer-nav-item">
                    <div className="drawer-icon-badge"><UserPlus size={17} strokeWidth={2} /></div>
                    <span className="drawer-item-title">Broadcasting & CRM</span>
                  </button>

                  <button onClick={() => { router.push('/school-dashboard/billing'); setShowNavMenu(false); }} className="drawer-nav-item">
                    <div className="drawer-icon-badge"><CreditCard size={17} strokeWidth={2} /></div>
                    <span className="drawer-item-title">Billing Plans</span>
                  </button>

                  {/* Subtle thin grey divider */}
                  <div style={{ height: 1, background: 'rgba(27, 42, 74, 0.08)', margin: '6px 0', flexShrink: 0 }} />

                  <button onClick={() => { setShowQR(true); setShowNavMenu(false); }} className="drawer-nav-item">
                    <div className="drawer-icon-badge"><QrCode size={17} strokeWidth={2} /></div>
                    <span className="drawer-item-title">Digital Gate QR Poster</span>
                  </button>

                  <button onClick={() => { setNewSchoolNameInput(clinic?.name || 'Ashbourne Academy'); setShowEditSchoolModal(true); setShowNavMenu(false); }} className="drawer-nav-item">
                    <div className="drawer-icon-badge"><Pencil size={17} strokeWidth={2} /></div>
                    <span className="drawer-item-title">Edit School Profile</span>
                  </button>
                </div>
              </div>

              {/* 4. LOGOUT BUTTON: Subdued light red background with dashboard matching button styling */}
              <button onClick={handleLogout} className="drawer-logout-btn">
                <LogOut size={17} strokeWidth={2.2} /> <span>Exit Console & Logout</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
