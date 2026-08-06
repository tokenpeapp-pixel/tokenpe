'use client'
import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from 'react'
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

// â”€â”€â”€ ANIMATED COUNTER NUMBER â”€â”€â”€
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

// â”€â”€â”€ ANIMATED CLOCK WITH SECONDS & SMOOTH TRANSITIONS â”€â”€â”€
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

// â”€â”€â”€ SOUND EFFECTS â”€â”€â”€
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

// â”€â”€â”€ FULL FEATURED QR POSTER MODAL (RESTAURANT GENERATOR LOGIC + SCHOOL NAVY THEME) â”€â”€â”€
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
      setCodeError('Code must be 3â€“12 alphanumeric characters.')
      return
    }

    setCodeSaving(true)
    setCodeError('')

    if (codeChanged) {
      // Check uniqueness via API
      const res = await fetch('/api/business/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic?.id, newCode: clean })
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        setCodeError(result.message || 'Failed to save. You might not have permission.')
        setCodeSaving(false)
        return
      }
      localStorage.setItem('businessCode', clean)
      onCodeUpdate(clean)
    }

    if (addressChanged) {
      // Save address via API
      await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, address: addressInput })
      })
      clinic.address = addressInput
    }

    // Update localStorage
    const stored = localStorage.getItem('tokenpe_business')
    if (stored) {
      try { localStorage.setItem('tokenpe_business', JSON.stringify({ ...JSON.parse(stored), code: clean, address: addressInput })) } catch (_) { }
    }

    setCodeSaving(false)
    setCodeSuccess(true)
    setEditingCode(false)
    setTimeout(() => setCodeSuccess(false), 4000)
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const { data: { publicUrl } } = supabase.storage.from('voice-notes').getPublicUrl(fileName)
      await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, logo_url: publicUrl })
      })

      clinic.logo_url = publicUrl // mutate locally for immediate render
      const stored = localStorage.getItem('tokenpe_business')
      if (stored) {
        localStorage.setItem('tokenpe_business', JSON.stringify({ ...JSON.parse(stored), logo_url: publicUrl }))
      }
      if (onCodeUpdate) onCodeUpdate(clean)
      setCodeSuccess(true)
      setEditingCode(false)
      setTimeout(() => setCodeSuccess(false), 3000)
    } catch (e) {
      setCodeError('Failed to save locally.')
    }
    setUploadingLogo(false)
  }

  async function saveAddress() {
    setSavingAddress(true)
    try {
      const res = await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, address: addressInput })
      })
      if (res.ok) {
        setAddressSuccess(true)
        setTimeout(() => setAddressSuccess(false), 3000)
        clinic.address = addressInput
        const stored = localStorage.getItem('tokenpe_business')
        if (stored) {
          localStorage.setItem('tokenpe_business', JSON.stringify({ ...JSON.parse(stored), address: addressInput }))
        }
      }
    } catch (e) { }
    setSavingAddress(false)
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
        <title>Gate Pass QR â€” ${clinic?.name || 'School'}</title>
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
              âœ“ Code updated! New QR generated.
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
                  {codeSaving ? 'Saving...' : 'âœ“ Save Code'}
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
function SchoolCommandCenterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTabFromUrl = searchParams.get('tab') || 'arrivals'

  const [tab, setTab] = useState(activeTabFromUrl)
  const [clinic, setSchool] = useState(null)
  const setClinic = setSchool   // alias so all existing setClinic() calls work
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [queuePaused, setQueuePaused] = useState(false)

  // ── Queue / patient state ──────────────────────────────────────────────────
  const [patients, setPatients] = useState([])
  const [userClinics, setUserClinics] = useState([])
  const [toasts, setToasts] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyPatients, setHistoryPatients] = useState([])
  const [newPatientAlert, setNewPatientAlert] = useState(null)
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')

  // ── Upgrade / billing state ────────────────────────────────────────────────
  const [upgrading, setUpgrading] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(null)

  // ── Branch management state ────────────────────────────────────────────────
  const [showManageBranches, setShowManageBranches] = useState(false)
  const [editingBranchId, setEditingBranchId] = useState(null)
  const [editingBranchName, setEditingBranchName] = useState('')
  const [newBranchName, setNewBranchName] = useState('')
  const [addingBranch, setAddingBranch] = useState(false)
  const [managingBranch, setManagingBranch] = useState(false)
  const [closingClinic, setClosingClinic] = useState(false)

  // ── Profile complete modal state ───────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [clinicName, setClinicName] = useState(null)
  const [specialty, setSpecialty] = useState(null)
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [city, setCity] = useState(null)
  const [area, setArea] = useState(null)
  const [phone, setPhone] = useState(null)
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)

  async function handleSave() {
    const finalSpecialty = specialty === 'Other' ? (customSpecialty || 'Other') : specialty
    if (!clinicName || !city || !finalSpecialty) return alert("Clinic Name, City and Specialty are required to be visible to patients.")
    if (!phone || phone.length < 10) return alert("A valid 10-digit WhatsApp number is required.")
    
    setSaving(true)
    try {
      const res = await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, name: clinicName, specialty: finalSpecialty, city, area, phone, lat, lng })
      })
      if (res.ok) {
        onSuccess({ name: clinicName, specialty: finalSpecialty, city, area, phone, lat, lng })
        onClose()
      } else {
        alert("Failed to save profile.")
      }
    } catch (e) {
      console.error(e)
      alert('An error occurred. Please try again.')
    }
    setSaving(false)
  }

  // Form input states
  const [studentName, setStudentName] = useState('')
  const [gradeClass, setGradeClass] = useState('')
  const [reason, setReason] = useState('')
  const [activeRoom, setActiveRoom] = useState('Room 101 / Main Gate')
  const [locationNoticeToast, setLocationNoticeToast] = useState(null)
  
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  })
  const [historyDate, setHistoryDate] = useState(() => {
    const d = new Date()
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  })

  function handleRoomChange(e) {
    setActiveRoom(e.target.value)
  }

  function saveLocation() {
    const val = activeRoom.trim() || 'Main Gate / Reception'
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokenpe_active_room', val)
      if (clinic?.id && clinic.id !== 'demo-school-id') {
        // Write via authenticated API route — never directly from anon client
        fetch('/api/school/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: { location: val } })
        }).catch(() => {})
      }
    }
    setLocationNoticeToast('✓ Location updated successfully!')
    if (window._locToastTimer) clearTimeout(window._locToastTimer)
    window._locToastTimer = setTimeout(() => setLocationNoticeToast(null), 3000)
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
      if (clinic?.id && clinic.id !== 'demo-school-id') {
        await fetch('/api/school/queue-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId: id })
        }).catch(() => {})
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
        await fetch('/api/school/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: { active_notice: msg } })
        }).catch(() => {})
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
        localStorage.setItem('tokenpe_school_business', JSON.stringify(updatedClinic))
        if (clinic?.id && clinic.id !== 'demo-school-id') {
          await fetch('/api/school/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: { logo_url: base64Logo } })
          }).catch(() => {})
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
      localStorage.setItem('tokenpe_school_business', JSON.stringify(updatedClinic))
      localStorage.setItem('tokenpe_school_subtitle', schoolSubtitle)
      if (clinic?.id && clinic.id !== 'demo-school-id') {
        await fetch('/api/school/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: { name: updatedName, specialty: schoolSubtitle, city: updatedCity, logo_url: schoolLogo || clinic?.logo_url } })
        }).catch(() => {})
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

  // Support Modal State
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [supportMessage, setSupportMessage]     = useState('')
  const [supportEmail, setSupportEmail]         = useState('')
  const [sendingSupport, setSendingSupport]     = useState(false)
  const [supportSent, setSupportSent]           = useState(false)

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

  function getRealSchoolId() {
    return clinic?.id
  }

  // ── 1. DYNAMIC INITIALIZATION & SERVER-AUTH VERIFICATION ──
  // NOTE: localStorage is used only as a fast paint cache.
  // The server session (/api/business-auth/me?vertical=school) is the ONLY
  // authoritative source of which school account is active.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedRoom = localStorage.getItem('tokenpe_active_room')
    if (savedRoom) setActiveRoom(savedRoom)

    // Fast paint: show cached data immediately (paint cache only, not auth source)
    const stored = localStorage.getItem('tokenpe_school_business')
    if (stored) {
      try {
        const cached = JSON.parse(stored)
        setSchool(cached)
        if (cached?.logo_url) setSchoolLogo(cached.logo_url)
      } catch (_) {}
    }

    // Always re-verify session on mount with vertical guard.
    // If the session belongs to a different vertical (or doesn't exist),
    // the API returns { authenticated: false } and we redirect to school-login.
    async function verifyAndLoad() {
      try {
        const res = await fetch('/api/business-auth/me?vertical=school')
        
        if (!res.ok) {
          console.warn(`[school-dashboard] API returned status ${res.status}`)
          // Fall through to redirect logic below
        }

        const data = res.ok ? await res.json() : { authenticated: false }

        if (!data.authenticated || !data.clinic) {
          // No valid school session — clear any stale cache and redirect
          localStorage.removeItem('tokenpe_school_business')
          router.push('/school-login')
          return
        }

        // Server confirmed a valid school session
        const schoolData = data.clinic
        setSchool(schoolData)
        if (schoolData.logo_url) setSchoolLogo(schoolData.logo_url)
        if (schoolData.location && !localStorage.getItem('tokenpe_active_room')) {
          setActiveRoom(schoolData.location)
          localStorage.setItem('tokenpe_active_room', schoolData.location)
        }
        // Populate userClinics from localStorage (branch switcher) or seed with current school
        try {
          const storedBranches = localStorage.getItem('tokenpe_user_businesses')
          const branches = storedBranches ? JSON.parse(storedBranches) : [schoolData]
          setUserClinics(branches)
        } catch (_) {
          setUserClinics([schoolData])
        }
        // Update the paint cache with fresh server data
        localStorage.setItem('tokenpe_school_business', JSON.stringify(schoolData))
      } catch (err) {
        console.warn('[school-dashboard] Auth verify error:', err)
        // Network error — do not redirect; keep cached paint so dashboard stays usable offline
      } finally {
        setLoading(false)
      }
    }

    verifyAndLoad()

    // ── Lightweight polling every 30s to refresh session/school data ──
    const interval = setInterval(verifyAndLoad, 30000)
    return () => clearInterval(interval)
  }, [])

  // â”€â”€ 2. DYNAMIC ADMIT FUNCTION (MOVES TO WITH STAFF SECTION) â”€â”€
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
        const res = await fetch(`/api/generic-dashboard/get?date=${currentDate}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) setPatients(data.patients || [])
        }
      } catch (e) {
        console.warn('DB Admit Error:', e)
      }
    }
  }

  // â”€â”€ 2a2. COMPLETE CONSULTATION (MOVES FROM WITH STAFF TO DISMISSED) â”€â”€
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
        const res = await fetch('/api/business/complete-patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: id, clinicId: clinic.id })
        })
        if (res.ok) {
          const res2 = await fetch(`/api/generic-dashboard/get?date=${currentDate}`)
          if (res2.ok) {
            const data2 = await res2.json()
            if (data2.success) setPatients(data2.patients || [])
          }
        }
      } catch (e) {
        console.warn('DB Complete Staff Error:', e)
      }
    }
  }

  // â”€â”€ Fetch History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (tab === 'history' && clinic) {
      async function fetchHistory() {
        setLoadingHistory(true)
        try {
          const res = await fetch(`/api/generic-dashboard/get?date=${historyDate}`)
          if (res.ok) {
            const data = await res.json()
            if (data.success) setHistoryPatients(data.patients || [])
          }
        } catch (e) { }
        setLoadingHistory(false)
      }
      fetchHistory()
    }
  }, [tab, historyDate, clinic])

  // â”€â”€ Toast system â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function addToast(msg, type = 'done') {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  // â”€â”€ Code Update Callback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handleCodeUpdate(newCode) {
    setClinic(prev => ({ ...prev, code: newCode }))

    // Sync the new code into the userClinics array for the branch switcher
    setUserClinics(prevClinics => {
      const updated = prevClinics.map(c => c.id === clinic.id ? { ...c, code: newCode } : c)
      localStorage.setItem('tokenpe_user_businesses', JSON.stringify(updated))
      return updated
    })

    addToast(`Clinic code updated to ${newCode}! Share it with your patients.`, 'done')
  }

  // â”€â”€ Smooth Branch Switcher (no reload) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function switchToBranch(targetClinic) {
    setMenuOpen(false)
    setShowAddBranch(false)
    if (targetClinic.id === clinic?.id) return

    // Optimistically switch UI immediately â€” no flash, no reload
    setClinic(targetClinic)
    setPatients([])
    setLoading(true)
    localStorage.setItem('businessCode', targetClinic.code)
    localStorage.setItem('businessPhone', targetClinic.phone)
    localStorage.setItem('tokenpe_business', JSON.stringify(targetClinic))
    addToast(`Switched to ${targetClinic.name}`, 'done')

    // Update session cookie and wait for it
    await fetch('/api/business-auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetClinicId: targetClinic.id })
    })

    // Fetch fresh patients for the new branch securely
    try {
      const res = await fetch(`/api/generic-dashboard/get?date=${currentDate}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) setPatients(data.patients || [])
      }
    } catch (e) { }
    setLoading(false)

    // Show Discovery Profile if the new branch is missing details
    if (!targetClinic.specialty || !targetClinic.city || targetClinic.phone === '0000000000') {
      setShowDiscovery(true)
    }
  }

  async function handleSaveBranchEdit(branchId) {
    if (!editingBranchName.trim()) return
    setManagingBranch(true)
    try {
      const res = await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: branchId, name: editingBranchName })
      })
      const data = await res.json()
      if (data.success) {
        const updatedUserClinics = userClinics.map(c => c.id === branchId ? { ...c, name: editingBranchName } : c)
        setUserClinics(updatedUserClinics)
        localStorage.setItem('tokenpe_user_businesses', JSON.stringify(updatedUserClinics))
        if (clinic?.id === branchId) {
          const updatedClinic = { ...clinic, name: editingBranchName }
          setClinic(updatedClinic)
          localStorage.setItem('tokenpe_business', JSON.stringify(updatedClinic))
        }
        setEditingBranchId(null)
      } else {
        alert(data.error || 'Failed to update branch')
      }
    } catch (e) {
      alert('Error updating branch')
    }
    setManagingBranch(false)
  }

  async function handleDeleteBranch(branchId) {
    // Use a toast-based confirmation instead of a browser confirm dialog
    addToast('Deleting branch...', 'notify')
    setManagingBranch(true)
    try {
      const res = await fetch('/api/business/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: branchId })
      })
      const data = await res.json()
      if (data.success) {
        const updatedUserClinics = userClinics.filter(c => c.id !== branchId)
        setUserClinics(updatedUserClinics)
        localStorage.setItem('tokenpe_user_businesses', JSON.stringify(updatedUserClinics))
        addToast('Branch deleted successfully', 'done')
        if (clinic?.id === branchId) {
          await switchToBranch(updatedUserClinics[0])
        }
      } else {
        addToast(data.error || 'Failed to delete branch', 'error')
      }
    } catch (e) {
      addToast('Error deleting branch', 'error')
    }
    setManagingBranch(false)
  }

  // â”€â”€ Logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function logout() {
    const vertical = localStorage.getItem('tokenpe_vertical')
    localStorage.removeItem('businessCode')
    localStorage.removeItem('businessPhone')
    localStorage.removeItem('tokenpe_business')
    localStorage.removeItem('tokenpe_user_businesses')
    await fetch('/api/business-auth/logout', { method: 'POST' })
    await supabase.auth.signOut()
    
    if (vertical === 'salon') router.push('/salon-login')
    else if (vertical === 'restaurant') router.push('/restaurant-login')
    else if (vertical === 'school') router.push('/school-login')
    else if (vertical === 'other') router.push('/business-login')
    else router.push('/school-login')
  }

  // â”€â”€ Toggle Pause â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function togglePause() {
    if (clinic.plan_id === 'starter') {
      addToast('Queue pause is a Pro feature. Please upgrade.', 'error')
      return
    }
    const newStatus = !clinic.queue_paused
    // Optimistic UI update for instant feedback
    setClinic(prev => ({ ...prev, queue_paused: newStatus }))
    addToast(newStatus ? 'Queue is now PAUSED' : 'Queue is now ACTIVE', newStatus ? 'notify' : 'done')

    // Attempt DB update in background via backend API
    try {
      const res = await fetch('/api/business/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, queuePaused: newStatus })
      })

      if (!res.ok) {
        throw new Error('Failed to toggle pause')
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error)
      // Revert the state if the API call fails
      setClinic(prev => ({ ...prev, queue_paused: !newStatus }))
      addToast('Failed to pause queue. Reverted state.', 'error')
    }
  }

  // â”€â”€ 2c. DYNAMIC SKIP FUNCTION (TRIGGER CONFIRMATION MODAL TO REMOVE) â”€â”€
  function handleSkip(idOrObj) {
    if (typeof idOrObj === 'object' && idOrObj !== null) {
      setSkipTarget(idOrObj)
    } else {
      const target = arrivals.find(a => a.id === idOrObj)
      if (target) setSkipTarget(target)
    }
  }

  // â”€â”€ 3. DYNAMIC MANUAL CHECK-IN â”€â”€
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
      const res = await fetch('/api/business/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const stored = localStorage.getItem('tokenpe_business')
        if (stored) {
          try { localStorage.setItem('tokenpe_business', JSON.stringify({ ...JSON.parse(stored), closed_today_date: today })) } catch (_) {}
        }
        addToast('ðŸ”´ Clinic closed for today.', 'notify')
      } else {
        // REVERT ON FAILURE
        setClinic(prev => ({ ...prev, closed_today_date: previousDate }))
        addToast(data.message || 'Failed to close clinic.', 'error')
      }
    } catch (err) {
      console.warn('DB Insert Error:', err)
    }
  }

  // â”€â”€ Re-open Clinic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function reopenClinic() {
    setMenuOpen(false)
    const previousDate = clinic.closed_today_date
    
    // OPTIMISTIC UI: Instantly switch state so there is no delay
    setClinic(prev => ({ ...prev, closed_today_date: null }))
    
    try {
      const res = await fetch('/api/business/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const stored = localStorage.getItem('tokenpe_business')
        if (stored) {
          try { localStorage.setItem('tokenpe_business', JSON.stringify({ ...JSON.parse(stored), closed_today_date: null })) } catch (_) {}
        }
        addToast(<><CheckCircle2 className="inline-block w-4 h-4" /> Clinic is now Open again!</>, 'done')
      } else {
        // REVERT ON FAILURE
        setClinic(prev => ({ ...prev, closed_today_date: previousDate }))
        addToast(data.message || 'Failed to re-open clinic.', 'error')
      }
    } catch (err) {
      setClinic(prev => ({ ...prev, closed_today_date: previousDate }))
      addToast('Error re-opening clinic. Please try again.', 'error')
    }
  }

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function onUpdatePayment(patientId, updates) {
    // 1. Optimistic UI update: Find the patient in local state and apply updates
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...updates } : p))
    
    // 2. Persist update in database via API
    try {
      const res = await fetch('/api/generic-queue/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, updates })
      })
      if (!res.ok) {
        throw new Error('API request failed')
      }
    } catch (e) {
      console.error('[onUpdatePayment Error]', e)
      addToast('Failed to save payment changes. Reverting...', 'error')
      
      // Revert local state by refetching patients
      const res = await fetch(`/api/generic-dashboard/get?date=${currentDate}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) setPatients(data.patients || [])
      }
    }
  }

  async function callNext() {
    const next = patients.find(p => p.status === STATUS.WAITING)
    if (!next) return

    // Optimistic UI Update
    setPatients(prev => prev.map(p => p.id === next.id ? { ...p, status: STATUS.CALLED } : p))
    sounds.callNext()
    addToast(`Calling ${next.name || next.token} â€” notifications & queue alerts sent!`, 'call')

    // Call unified backend queue next API to process turn notifications and relative queue alerts!
    const res = await fetch('/api/generic-queue/next', {
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

    if (!res.ok) {
      addToast('Error calling next patient', 'error')
    }
  }

  async function markDone(patient) {
    // Optimistic UI Update
    setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, status: STATUS.DONE, completed_at: new Date().toISOString() } : p))
    sounds.done()
    addToast(`${patient.name || patient.token} consultation done`, 'done')

    const res = await fetch('/api/generic-queue/done', {
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

    if (!res.ok) {
      addToast('Error marking consultation done', 'error')
    }
  }

  async function skipPatient(patient) {
    // Optimistic UI Update
    setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, status: STATUS.SKIPPED } : p))
    sounds.skip()
    addToast(`${patient.name || patient.token} skipped`, 'skip')

    const res = await fetch('/api/generic-queue/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id })
    })

    if (!res.ok) {
      addToast('Error skipping patient', 'error')
      // Revert optimistic update
      setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, status: STATUS.WAITING } : p))
    }
  }

  async function priorityCall(patient) {
    if (!patient) return

    // Optimistic UI Update
    setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, status: STATUS.CALLED } : p))
    sounds.callNext()
    addToast(`ðŸš¨ Emergency Call: ${patient.name || patient.token} called next!`, 'call')

    try {
      const res = await fetch('/api/generic-queue/next', {
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

      if (!res.ok) {
        throw new Error('API failed')
      }
    } catch (e) {
      console.error(e)
      addToast('Error calling priority patient', 'error')
      // Revert optimistic update
      setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, status: STATUS.WAITING } : p))
    }
  }

  async function notifyPatient(patient) {
    // Optimistic UI Update
    sounds.notify()
    addToast(`Manual text & voice note alert sent to ${patient.name || patient.token}`, 'notify')

    const res = await fetch('/api/generic-queue/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId: clinic.id,
        clinicName: clinic.name,
        patientPhone: patient.phone,
        patientName: patient.name || 'Patient',
        token: patient.token,
        language: patient.language || 'en'
      })
    })

    if (!res.ok) {
      addToast('Error sending manual alert', 'error')
    }
  }

  const handleUpgrade = useCallback(async (tier) => {
    if (!clinic || upgrading) return
    setUpgrading(tier)

    try {
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: clinic.id, planTier: tier })
      })
      const data = await res.json()
      if (!res.ok || !data.subscriptionId) throw new Error(data.error || 'Failed to create subscription')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'TokenPe',
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan Subscription`,
        image: `${window.location.origin}/logo-light.svg`,
        prefill: {
          name: data.clinicName,
          email: data.clinicEmail,
          contact: data.businessPhone,
        },
        theme: { color: '#065F46' },
        handler: async function (response) {
          const maxAttempts = 5
          let attempts = 0
          const poll = async () => {
            attempts++
            const res = await fetch(`/api/business/get?id=${clinic.id}`)
            let fresh = null
            if (res.ok) {
              const data = await res.json()
              if (data.success) fresh = data.clinic
            }
            if (fresh) {
              setClinic(fresh)
              localStorage.setItem('tokenpe_business', JSON.stringify(fresh))
              if (fresh.current_period_end || attempts >= maxAttempts) {
                setUpgrading(null)
                setShowUpgradeModal(false)
                if (fresh.current_period_end && fresh.plan_id !== 'starter' && fresh.plan_id !== 'canceled') {
                  setShowSuccessModal(fresh.plan_id.toUpperCase())
                  confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#065F46', '#10b981', '#f59e0b', '#3b82f6'],
                    zIndex: 10000
                  })
                }
                return
              }
            }
            if (attempts < maxAttempts) setTimeout(poll, 2000)
            else {
              setUpgrading(null)
              setShowUpgradeModal(false)
            }
          }
          setTimeout(poll, 2000)
        },
        modal: { ondismiss: () => setUpgrading(null) }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        addToast(`Payment failed: ${resp.error.description}`, 'error')
        setUpgrading(null)
      })
      rzp.open()

    } catch (err) {
      addToast(`Error: ${err.message}`, 'error')
      setUpgrading(null)
    }
  }, [clinic, upgrading])

  async function addWalkIn() {
    if (!newPhone.trim()) return

    if (isClosedToday) {
      addToast('Clinic is closed for today. No new patients can be added.', 'error')
      return
    }

    if (clinic?.queue_paused) {
      addToast('Queue is currently paused. Please unpause to add patients.', 'error')
      return
    }

    const planId = clinic?.plan_id || 'starter'
    const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
    if (patients.length >= limit) {
      setShowUpgradeModal(true)
      return
    }

    const token = `T${String(patients.length + 1).padStart(3, '0')}`

    try {
      const res = await fetch('/api/generic-queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic.id,
          name: newName.trim() || null,
          phone: newPhone.trim(),
          token: token,
          language: newLang || 'hi'
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to add walk-in')

      if (result.patient?.id) {
        localAddedPatientIdsRef.current.add(result.patient.id)
      }

      setNewName(''); setNewPhone(''); setNewLang('hi')
      setShowAddForm(false)
      addToast(`${newName || newPhone} added as ${token}`, 'new')

      // Note: Supabase realtime subscription will pick up the new patient 
      // and update the patients list automatically, just like it did before.
    } catch (err) {
      console.error(err)
      addToast('Error adding walk-in patient', 'error')
    }
  }

  // â”€â”€ Computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const isClosedToday = !!clinic?.closed_today_date
  const waiting = patients.filter(p => p.status === STATUS.WAITING)
  const called = patients.filter(p => p.status === STATUS.CALLED)
  const done = patients.filter(p => p.status === STATUS.DONE)
  const activePatients = [...called, ...waiting]
  const displayPatients = tab === 'active' ? activePatients : done

  // â”€â”€ Limits â”€â”€
  const planId = clinic?.plan_id || 'starter'
  const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
  const isLimitReached = patients.length >= limit
  const oldestClinic = userClinics?.length > 0
    ? userClinics.reduce((oldest, c) => new Date(c.created_at) < new Date(oldest.created_at) ? c : oldest, userClinics[0])
    : clinic

  const trialEnd = oldestClinic?.trial_ends_at ? new Date(oldestClinic.trial_ends_at) : null
  const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0
  const showTrialWarning = oldestClinic?.subscription_status === 'trialing' && trialEnd && daysLeft <= 3 && daysLeft >= 0
  const isTrialExpired = oldestClinic?.subscription_status === 'trialing' && trialEnd && daysLeft < 0

  // Only show full-screen loader if we have no cached clinic to show
  if (loading && !clinic) return (
    <div style={s.loadingScreen}>
      <div className="spinner" style={s.spinner} />
      <p style={{ color: '#64748B', marginTop: 16 }}>Loading TokenPe...</p>
    </div>
  )

  // â”€â”€ Trial Expired Lockout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isTrialExpired) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15), transparent 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}><Hourglass size={56} color="#10b981" style={{ filter: 'drop-shadow(0 0 15px rgba(16,185,129,0.3))' }} /></div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Free Trial Ended</h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          We hope you loved TokenPe! Your 7-day Elite trial has expired. To continue using the dashboard and keep your clinic data safe, please choose a plan.
        </p>
        <button
          onClick={() => router.push('/dashboard/billing')}
          style={{ width: '100%', padding: '16px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', marginBottom: 16, boxShadow: '0 4px 14px 0 rgba(5, 150, 105, 0.4)', transition: 'all 0.2s ease' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.6)'; e.currentTarget.style.background = '#10b981' }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(5, 150, 105, 0.4)'; e.currentTarget.style.background = '#059669' }}
        >
          View Plans & Upgrade â†’
        </button>
        <button
          onClick={logout}
          style={{ width: '100%', padding: '12px 24px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s ease' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          Sign Out
        </button>
        <p style={{ marginTop: 24, fontSize: 12, color: '#475569' }}>Need help? Email <a href="mailto:tokenpe.online@gmail.com" style={{ color: '#10b981', fontWeight: 500 }}>tokenpe.online@gmail.com</a></p>
      </div>
    </div>
  )

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

        /* â”€â”€ TOP METADATA CONTROL STRIP â”€â”€ */
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

        /* â”€â”€ HEADER â”€â”€ */
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

        /* â”€â”€ STATS ROW (ELEVATED HERO NUMBERS) â”€â”€ */
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

        /* â”€â”€ ADMISSIONS & NEXT QUEUE HERO CARDS â”€â”€ */
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

        /* â”€â”€ TABS â”€â”€ */
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

        /* â”€â”€ DUAL SECTION GRID â”€â”€ */
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

        /* â”€â”€ 3 ACTION BUTTON SYSTEM (ADMIT, NOTIFY, SKIP) â”€â”€ */
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

      {/* â”€â”€ MODAL: MANUAL CHECK-IN â”€â”€ */}
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
                <button type="submit" className="cmd-btn-solid" style={{ marginTop: 8, padding: '12px 20px' }}>Confirm Check-in â†’</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* â”€â”€ MODAL: EDIT SCHOOL NAME & LOGO â”€â”€ */}
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

                <button type="submit" className="cmd-btn-solid" style={{ padding: '12px 20px', marginTop: 4 }}>Save Changes â†’</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* â”€â”€ MODAL: BROADCAST NOTICE TO QUEUE â”€â”€ */}
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
                  <span>Broadcast Notice Now â†’</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* â”€â”€ MODAL: CONFIRM SKIP / REMOVE FROM QUEUE â”€â”€ */}
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
                  Yes, Remove â†’
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* â”€â”€ NOTIFICATION TOAST BANNER (MEMBER NOTIFIED TO BE READY) â”€â”€ */}
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
        {/* Toast Popup Notification for Location update */}
        <AnimatePresence>
          {locationNoticeToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              style={{
                position: 'fixed',
                top: 24,
                right: 24,
                zIndex: 99999,
                background: '#10B981',
                color: '#FFFFFF',
                padding: '12px 22px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.88rem',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid #059669'
              }}
            >
              <CheckCircle2 style={{ width: 20, height: 20, color: '#FFFFFF' }} />
              <span>Location updated successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TOP CONTROL STRIP ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="cmd-meta-bar">
          {/* Left Group: Live Date */}
          <div className="cmd-meta-group">
            <div className="cmd-meta-label">
              <Calendar style={{ width: 14, height: 14, color: '#3B82F6' }} />
              <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Center Group: Serif Identity Anchor (Desktop Only) */}
          <div 
            onClick={() => { setNewSchoolNameInput(clinic?.name || 'Ashbourne Academy'); setShowEditSchoolModal(true); }}
            className="cmd-meta-school-btn cmd-desktop-only"
            title="Click to edit official school name & logo"
          >
            <Building style={{ width: 15, height: 15, color: '#3B82F6' }} />
            <span className="cmd-meta-school-title">{clinic?.name || 'Ashbourne Academy'}</span>
            <Pencil style={{ width: 12, height: 12, color: '#3B82F6', marginLeft: 2 }} />
          </div>

          {/* Right Group: Active Queue Location Input Pill */}
          <div className="cmd-meta-group">
            <span className="cmd-meta-label" style={{ color: '#5A6E85' }}>LOCATION:</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MapPin style={{ width: 14, height: 14, color: '#3B82F6', position: 'absolute', left: 10, pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={activeRoom}
                  onChange={handleRoomChange}
                  onKeyDown={e => { if (e.key === 'Enter') saveLocation(); }}
                  placeholder="Active room / Gate..."
                  className="cmd-meta-pill-input"
                />
              </div>
              <button
                type="button"
                onClick={saveLocation}
                style={{
                  background: 'linear-gradient(135deg, #1B2A4A, #24365C)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(27, 42, 74, 0.15)',
                  transition: 'all 0.2s ease'
                }}
                title="Click to save updated location"
              >
                Save
              </button>
            </div>
          </div>
        </motion.div>

      {/* â”€â”€ Add New Branch Modal â”€â”€ */}
      {showAddBranch && (
        <div onClick={() => setShowAddBranch(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#065F46', borderRadius: 24, padding: '32px', width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>Add New Branch</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: 20 }}>As an Elite user, you can manage up to 3 clinics under one login.</p>
            <input
              autoFocus
              placeholder="E.g. City Hospital - South Branch"
              value={newBranchName}
              onChange={e => setNewBranchName(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={async () => {
                  if (!newBranchName.trim()) return
                  setAddingBranch(true)
                  try {
                    const res = await fetch('/api/business/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ clinicName: newBranchName, email: clinic.email, phone: clinic.phone })
                    })
                    const data = await res.json()
                    if (data.success) {
                      const updatedClinics = [...userClinics, data.clinic]
                      setUserClinics(updatedClinics)
                      localStorage.setItem('tokenpe_user_businesses', JSON.stringify(updatedClinics))
                      setAddingBranch(false)
                      // Smooth switch to new branch â€” no reload
                      await switchToBranch(data.clinic)
                    } else {
                      alert(data.error || 'Failed to create branch')
                      setAddingBranch(false)
                    }
                  } catch (e) {
                    alert('Error creating branch')
                    setAddingBranch(false)
                  }
                }}
                disabled={addingBranch}
                style={{ flex: 1, background: '#10B981', color: '#000', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, cursor: addingBranch ? 'not-allowed' : 'pointer', opacity: addingBranch ? 0.7 : 1 }}
              >
                {addingBranch ? 'Creating...' : 'Create Branch'}
              </button>
              <button onClick={() => setShowAddBranch(false)} style={{ flex: 1, background: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Toasts â”€â”€ */}
      <div style={s.toastContainer}>
        {toasts.map(t => (
          <div 
            onClick={() => { setNewSchoolNameInput(clinic?.name || 'Ashbourne Academy'); setShowEditSchoolModal(true); }}
            className="cmd-meta-school-btn cmd-desktop-only"
            title="Click to edit official school name & logo"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{TOAST_TYPES[t.type]?.icon}</span>
              <span>{t.msg}</span>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255,255,255,0.7)', 
                cursor: 'pointer', 
                fontSize: 18,
                fontWeight: 'bold',
                padding: '0 4px',
                lineHeight: 1
              }}
            >
              Ã—
            </button>
          </div>
        ))}
      </div>

      {/* â”€â”€ New Patient Banner â”€â”€ */}
      {newPatientAlert && (
        <div style={{ ...s.banner, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={s.bannerDot} />
            <span><PlusCircle className="inline-block w-4 h-4" /> New patient joined!&nbsp;</span>
            <strong>{newPatientAlert.name || maskPhone(newPatientAlert.phone)} â€” {newPatientAlert.token}</strong>
          </div>
          <button 
            onClick={() => {
              setNewPatientAlert(null)
              if (newPatientAlertTimeoutRef.current) {
                clearTimeout(newPatientAlertTimeoutRef.current)
                newPatientAlertTimeoutRef.current = null
              }
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#4F46E5', 
              cursor: 'pointer', 
              fontSize: 18, 
              fontWeight: 'bold',
              lineHeight: 1,
              padding: '0 4px',
              marginLeft: '12px'
            }}
          >
            Ã—
          </button>
        </div>
      )}

      {/* â”€â”€ QR Modal â”€â”€ */}
      {showQR && <QRModal clinic={clinic} onClose={() => setShowQR(false)} onCodeUpdate={handleCodeUpdate} router={router} />}

      {/* â”€â”€ Discovery Profile Modal â”€â”€ */}
      {showDiscovery && (
        <DiscoveryProfileModal 
          clinic={clinic} 
          onClose={() => setShowDiscovery(false)}
          onSuccess={(updates) => {
            const updatedClinic = { ...clinic, ...updates }
            setClinic(updatedClinic)
            localStorage.setItem('tokenpe_business', JSON.stringify(updatedClinic))
            localStorage.setItem('businessPhone', updatedClinic.phone)
            addToast('Profile completed! You are now visible to patients.', 'done')
          }}
        />
      )}

      {/* â”€â”€ Trial Warning Banner â”€â”€ */}
      {showTrialWarning && (
        <div style={{ background: daysLeft <= 3 ? '#DC2626' : 'rgba(6,95,70,0.15)', color: daysLeft <= 3 ? 'white' : '#5EEAD4', padding: '10px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, zIndex: 60, position: 'relative', borderBottom: daysLeft <= 3 ? 'none' : '1px solid rgba(6,95,70,0.3)' }}>
          {daysLeft <= 3 ? <><AlertTriangle className="inline-block w-4 h-4" /> Your</> : <><Sparkles className="inline-block w-4 h-4" /> You are on the</>} Elite Free Trial. Ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'} on {trialEnd?.toLocaleDateString('en-IN')}. <button onClick={() => router.push('/dashboard/billing')} style={{ background: daysLeft <= 3 ? 'white' : 'rgba(6,95,70,0.2)', color: daysLeft <= 3 ? '#DC2626' : '#fff', border: daysLeft <= 3 ? 'none' : '1px solid rgba(6,95,70,0.4)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, marginLeft: '10px', cursor: 'pointer' }}>Choose a Plan</button>
        </div>
      )}

      {/* â”€â”€ Closed Today Banner â”€â”€ */}
      {isClosedToday && (
        <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, zIndex: 60, position: 'relative', borderBottom: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', letterSpacing: '0.2px' }}>
          <span>ðŸ”´ Clinic is Closed for Today â€” No new patients will be accepted.</span>
          <button
            onClick={reopenClinic}
            className="reopen-banner-btn"
          >
            <span style={{ fontSize: '15px' }}><Sparkles className="inline-block w-4 h-4" /></span> Re-open Now
          </button>
        </div>
      )}

        {/* â”€â”€ HEADER â”€â”€ */}
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
                {clinic?.city && <><span style={{ opacity: 0.45 }}>â€¢</span><span style={{ fontWeight: 700, color: '#1B2A4A' }}>{clinic.city}</span></>}
              </div>
            </div>
          </div>

          <div className="cmd-header-right">
            <div className="cmd-clock">
              <AnimatedClock />
              <div className="cmd-clock-sub">
                <span className="live-dot" /> SESSION ACTIVE â€¢ TERM II
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

        {/*  STATS ROW  */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} style={{ marginBottom: 24 }}>
          <div className="cmd-stats-row">

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
        </div>
        </motion.div>

        {/* â”€â”€ LIVE QUEUE CONTROL (FULL WIDTH HERO CARD) â”€â”€ */}
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

        {/* â”€â”€ TABS (ARRIVALS & COMPLETED ONLY) â”€â”€ */}
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

        {/* â”€â”€ AWAITING CHECK-IN & ACTIVE CONSULTATION HERO ROW (ARRIVALS TAB ONLY) â”€â”€ */}
        {tab === 'arrivals' && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          {/* 2-Column Split: Left = WITH STAFF, Right = NEXT IN QUEUE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
            
            {/* Left Half: WITH STAFF SECTION */}
            <div className="cmd-card" style={{ border: '2.5px solid #059669', background: 'linear-gradient(135deg, #FFFFFF 0%, #ECFDF5 100%)', boxShadow: '0 10px 30px rgba(5, 150, 105, 0.12)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="cmd-card-tag" style={{ marginBottom: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#047857', fontSize: '0.75rem' }}>
                    <span className="live-dot" style={{ background: '#10B981', boxShadow: '0 0 8px #10B981' }} /> ACTIVE CONSULTATION â€¢ WITH STAFF
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
                          <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, marginTop: 2 }}>{s.grade || 'General'} â€¢ {s.reason || 'Consultation'}</div>
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
                    <span className="live-dot" /> 1ST IN LINE â€¢ IMMEDIATE ADMIT
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
                        <span style={{ fontWeight: 700, color: '#1B2A4A', fontSize: '0.88rem' }}>{nextInQueue.grade || 'â€”'}</span>
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
                        <span style={{ fontWeight: 700, color: '#1B2A4A', fontSize: '0.88rem' }}>{a.grade || 'â€”'}</span>
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
                        <span style={{ fontWeight: 700, color: '#1B2A4A', fontFamily: 'monospace', fontSize: '0.85rem' }}>{a.guardian || 'â€”'}</span>
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

        {/* â”€â”€ COMPLETED TAB VIEW â”€â”€ */}
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
                        <div style={{ fontSize: '0.75rem', color: '#5A6E85', marginTop: 2 }}>{d.grade || 'General'} â€¢ {d.guardian || 'N/A'}</div>
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

      {/* DRAWER TOOLTIP HOVER STYLES */}
      <style>{`
        .drawer-item-wrapper {
          position: relative;
        }
        .drawer-hover-tooltip {
          opacity: 0;
          visibility: hidden;
          position: absolute;
          left: -220px;
          top: 50%;
          transform: translateY(-50%);
          width: 200px;
          background: #1B2A4A;
          color: #FFFFFF;
          font-size: 0.73rem;
          line-height: 1.45;
          padding: 10px 14px;
          border-radius: 10px;
          box-shadow: 0 12px 30px rgba(27, 42, 74, 0.35);
          z-index: 99999;
          pointer-events: none;
          border: 1px solid rgba(255, 255, 255, 0.18);
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }
        .drawer-hover-tooltip strong {
          color: #60A5FA;
          display: block;
          margin-bottom: 3px;
          font-size: 0.78rem;
          font-weight: 700;
        }
        .drawer-hover-tooltip::after {
          content: '';
          position: absolute;
          right: -7px;
          top: 50%;
          transform: translateY(-50%);
          border-width: 6px 0 6px 7px;
          border-style: solid;
          border-color: transparent transparent transparent #1B2A4A;
        }
        .drawer-item-wrapper:hover .drawer-hover-tooltip {
          opacity: 1;
          visibility: visible;
        }
        @media (max-width: 768px) {
          .drawer-hover-tooltip {
            display: none !important;
          }
        }
      `}</style>

      {/* QR MODAL */}
      {showQR && <QRModal clinic={clinic} onClose={() => setShowQR(false)} />}

      {/* SUPPORT & REPORT ISSUE MODAL */}
      {showSupportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(27,42,74,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowSupportModal(false)}>
          <div style={{ background: '#FFFFFF', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(27,42,74,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 10, color: '#2563EB', display: 'flex' }}>
                  <HelpCircle size={20} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: '#1B2A4A' }}>Support & Report Issue</div>
                  <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600 }}>We&apos;re here to help! Get in touch with our tech team.</div>
                </div>
              </div>
              <button onClick={() => setShowSupportModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 7, padding: 7, cursor: 'pointer', color: '#5A6E85' }}><X size={16} /></button>
            </div>

            {supportSent ? (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '50%', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#059669' }}>
                  <CheckCircle2 size={28} />
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A', marginBottom: 6 }}>Ticket Received!</div>
                <div style={{ fontSize: '0.8rem', color: '#5A6E85', lineHeight: 1.6, marginBottom: 20 }}>
                  Our team has been notified. We'll reach out to <strong>{supportEmail}</strong> shortly.
                </div>
                <button onClick={() => setShowSupportModal(false)} style={{ width: '100%', padding: '11px 0', background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!supportMessage.trim()) return
                setSendingSupport(true)
                try {
                  await supabase.from('support_tickets').insert({
                    school_id: clinic?.id,
                    school_name: clinic?.name,
                    email: supportEmail,
                    message: supportMessage,
                    created_at: new Date().toISOString()
                  }).catch(() => {})
                } catch (err) {}
                setSendingSupport(false)
                setSupportSent(true)
              }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#1B2A4A', marginBottom: 6 }}>Your Email *</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={e => setSupportEmail(e.target.value)}
                    required
                    placeholder="admin@school.com"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, outline: 'none', fontSize: '0.85rem', color: '#1B2A4A', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#1B2A4A', marginBottom: 6 }}>Describe the Issue / Request *</label>
                  <textarea
                    value={supportMessage}
                    onChange={e => setSupportMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe what went wrong or what you need help with…"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, outline: 'none', fontSize: '0.85rem', color: '#1B2A4A', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
                  />
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Phone size={16} color="#059669" />
                  <div style={{ fontSize: '0.75rem', color: '#5A6E85' }}>
                    Need immediate assistance? WhatsApp us directly at <strong style={{ color: '#1B2A4A' }}>+91 73033 82377</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setShowSupportModal(false)} style={{ flex: 1, padding: '11px 0', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, color: '#5A6E85', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" disabled={sendingSupport || !supportMessage.trim()} style={{ flex: 2, padding: '11px 0', background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#FFF', fontWeight: 800, fontSize: '0.85rem', cursor: (sendingSupport || !supportMessage.trim()) ? 'not-allowed' : 'pointer', opacity: (sendingSupport || !supportMessage.trim()) ? 0.6 : 1, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(27,42,74,0.2)' }}>
                    {sendingSupport ? 'Submitting…' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* NAVIGATION DRAWER MODAL (PREMIUM NAVY & SERIF DESIGN SYSTEM) */}
      <AnimatePresence>
        {showNavMenu && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end', background: 'rgba(27, 42, 74, 0.35)', backdropFilter: 'blur(6px)' }} onClick={() => setShowNavMenu(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 380 }} style={{ width: 340, background: '#FFFFFF', height: '100%', padding: '18px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '-8px 0 36px rgba(27,42,74,0.18)', overflow: 'visible' }} onClick={e => e.stopPropagation()}>
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

                {/* SCROLLABLE MENU ITEMS LIST WITH HOVER POPUP TOOLTIPS */}
                <div style={{ flex: 1, overflowY: 'visible', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 4 }}>
                  
                  {/* Item 1: Arrivals */}
                  <div className="drawer-item-wrapper">
                    <button onClick={() => { setTab('arrivals'); setShowNavMenu(false); }} className={`drawer-nav-item ${tab === 'arrivals' ? 'active' : ''}`} style={{ width: '100%' }}>
                      <div className="drawer-icon-badge"><Users size={17} strokeWidth={2} /></div>
                      <span className="drawer-item-title">Arrivals & Live Queue</span>
                    </button>
                    <div className="drawer-hover-tooltip">
                      <strong>Arrivals & Live Queue</strong>
                      Monitor live student check-ins, call students, notify parents via WhatsApp, and manage active waiting lists.
                    </div>
                  </div>

                  {/* Item 2: Classrooms */}
                  <div className="drawer-item-wrapper">
                    <button onClick={() => { router.push('/school-dashboard/classrooms'); setShowNavMenu(false); }} className="drawer-nav-item" style={{ width: '100%' }}>
                      <div className="drawer-icon-badge"><DoorOpen size={17} strokeWidth={2} /></div>
                      <span className="drawer-item-title">Classrooms in Session</span>
                    </button>
                    <div className="drawer-hover-tooltip">
                      <strong>Classrooms in Session</strong>
                      Manage separate multi-queues for Admissions, Library, Accounts & Medical Rooms under one campus account.
                    </div>
                  </div>

                  {/* Item 3: Dismissal History */}
                  <div className="drawer-item-wrapper">
                    <button onClick={() => { router.push('/school-dashboard/history'); setShowNavMenu(false); }} className="drawer-nav-item" style={{ width: '100%' }}>
                      <div className="drawer-icon-badge"><UserCheck size={17} strokeWidth={2} /></div>
                      <span className="drawer-item-title">Dismissal History</span>
                    </button>
                    <div className="drawer-hover-tooltip">
                      <strong>Dismissal History</strong>
                      Search and export past student dismissal logs, custom date ranges (Today, 7D, 30D, 365D), and CSV reports.
                    </div>
                  </div>

                  {/* Item 4: Analytics */}
                  <div className="drawer-item-wrapper">
                    <button onClick={() => { router.push('/school-dashboard/analytics'); setShowNavMenu(false); }} className="drawer-nav-item" style={{ width: '100%' }}>
                      <div className="drawer-icon-badge"><BarChart2 size={17} strokeWidth={2} /></div>
                      <span className="drawer-item-title">Campus Analytics & Reports</span>
                    </button>
                    <div className="drawer-hover-tooltip">
                      <strong>Campus Analytics & Reports</strong>
                      Track peak check-in hours, average wait times, reason breakdowns, and grade-wise statistics.
                    </div>
                  </div>

                  {/* Item 5: Broadcasting & CRM */}
                  <div className="drawer-item-wrapper">
                    <button onClick={() => { router.push('/school-dashboard/crm'); setShowNavMenu(false); }} className="drawer-nav-item" style={{ width: '100%' }}>
                      <div className="drawer-icon-badge"><UserPlus size={17} strokeWidth={2} /></div>
                      <span className="drawer-item-title">Broadcasting & CRM</span>
                    </button>
                    <div className="drawer-hover-tooltip">
                      <strong>Broadcasting & CRM</strong>
                      Send mass WhatsApp notices, exam flyers & announcements to all students, plus custom welcome auto-replies.
                    </div>
                  </div>

                  {/* Item 6: Billing */}
                  <div className="drawer-item-wrapper">
                    <button onClick={() => { router.push('/school-dashboard/billing'); setShowNavMenu(false); }} className="drawer-nav-item" style={{ width: '100%' }}>
                      <div className="drawer-icon-badge"><CreditCard size={17} strokeWidth={2} /></div>
                      <span className="drawer-item-title">Billing Plans</span>
                    </button>
                    <div className="drawer-hover-tooltip">
                      <strong>Billing Plans</strong>
                      View current subscription status, upgrade to Elite for multi-queues & broadcasts, or manage renewals.
                    </div>
                  </div>

                  {/* Item 7: Support */}
                  <div className="drawer-item-wrapper">
                    <button onClick={() => { setSupportEmail(clinic?.email || ''); setSupportMessage(''); setSupportSent(false); setShowSupportModal(true); setShowNavMenu(false); }} className="drawer-nav-item" style={{ width: '100%' }}>
                      <div className="drawer-icon-badge"><HelpCircle size={17} strokeWidth={2} /></div>
                      <span className="drawer-item-title">Support & Report Issue</span>
                    </button>
                    <div className="drawer-hover-tooltip">
                      <strong>Support & Report Issue</strong>
                      Submit technical support tickets directly to our engineering team or get instant WhatsApp assistance.
                    </div>
                  </div>

                  {/* Subtle thin grey divider */}
                  <div style={{ height: 1, background: 'rgba(27, 42, 74, 0.08)', margin: '4px 0', flexShrink: 0 }} />

                  {/* Item 8: Digital Gate QR */}
                  <div className="drawer-item-wrapper">
                    <button onClick={() => { setShowQR(true); setShowNavMenu(false); }} className="drawer-nav-item" style={{ width: '100%' }}>
                      <div className="drawer-icon-badge"><QrCode size={17} strokeWidth={2} /></div>
                      <span className="drawer-item-title">Digital Gate QR Poster</span>
                    </button>
                    <div className="drawer-hover-tooltip">
                      <strong>Digital Gate QR Poster</strong>
                      View, customize, and print your campus entrance QR poster for instant student WhatsApp check-in.
                    </div>
                  </div>

                  {/* Item 9: Edit School Profile */}
                  <div className="drawer-item-wrapper">
                    <button onClick={() => { setNewSchoolNameInput(clinic?.name || 'Ashbourne Academy'); setShowEditSchoolModal(true); setShowNavMenu(false); }} className="drawer-nav-item" style={{ width: '100%' }}>
                      <div className="drawer-icon-badge"><Pencil size={17} strokeWidth={2} /></div>
                      <span className="drawer-item-title">Edit School Profile</span>
                    </button>
                    <div className="drawer-hover-tooltip">
                      <strong>Edit School Profile</strong>
                      Update your institution&apos;s name, city location, logo, and sub-heading preferences.
                    </div>
                  </div>
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

export default function SchoolDashboardPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F4F7FB', color: '#1B2A4A', fontFamily: 'sans-serif', fontWeight: 600 }}>Loading Dashboard...</div>}>
      <SchoolCommandCenterInner />
    </Suspense>
  )
}
