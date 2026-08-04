'use client'
import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import { Phone, ChefHat, Wine, Utensils, Coffee, CheckCircle2, XCircle, Megaphone, PlusCircle, SkipForward, Bell, Camera, MapPin, Pencil, Lock, Download, Printer, Star, Smartphone, Mic, Gift, AlertTriangle, Hourglass, RefreshCw, Sparkles, Plus, Copy, LogOut, Check, ChevronLeft, ChevronRight, Menu, Play, CheckCircle, Search, Edit2, X, PlusSquare, Settings, History, BarChart2, Headset, CreditCard, DoorOpen, DoorClosed, List, Pause, QrCode, Clock, Calendar, CalendarX, CalendarCheck, UserCheck, ChevronDown } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getISTDateString, getISTYesterdayDateString } from '../../lib/supabase'
import confetti from 'canvas-confetti'
import CallNextButton from '../../components/CallNextButton'
import QRCode from 'qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import './lovable.css'

// ─── ANIMATED COUNTER (Framer Motion) ────────────────────────────────────────
function AnimatedNumber({ value }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', overflow: 'hidden', verticalAlign: 'middle', padding: '0 2px' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: 28, opacity: 0, scale: 0.75, filter: 'blur(3px)' }}
          animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ y: -28, opacity: 0, scale: 0.75, filter: 'blur(3px)' }}
          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
          style={{ display: 'inline-block' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ─── UPGRADE BANNER (Suspense wrapped to prevent Next.js build errors) ────────
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
    <div style={{ background: '#280a0a', borderBottom: '1px solid #4a0a0a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: 14 }}><CheckCircle2 className="inline-block w-4 h-4" /> Plan activated! Your restaurant is now upgraded. All features are unlocked.</span>
      <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  )
}

// ─── PHONE MASKING (Privacy) ────────────────────────────────────────────────
function maskPhone(phone) {
  if (!phone) return ''
  const p = String(phone).replace(/\D/g, '')
  if (p.length <= 4) return '****'
  return p.slice(0, 2) + '****' + p.slice(-4)
}

// ─── SOUNDS ────────────────────────────────────────────────────────────────
function useSounds() {
  const audioCtx = useRef(null)
  function getCtx() {
    if (!audioCtx.current)
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    return audioCtx.current
  }
  function playTone(frequencies, type = 'sine', volume = 0.4) {
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
        const t = ctx.currentTime + i * 0.18
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(volume, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
        osc.start(t)
        osc.stop(t + 0.4)
      })
    } catch (e) {
      console.warn("AudioContext tone playback failed:", e)
    }
  }
  return {
    newGuest: () => playTone([523.25, 659.25]),
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
  new: { bg: '#4a0a0a', icon: <PlusCircle className="inline-block w-4 h-4" /> },
  call: { bg: '#7f1d1d', icon: <Megaphone className="inline-block w-4 h-4" /> },
  done: { bg: '#7f1d1d', icon: <CheckCircle2 className="inline-block w-4 h-4" /> },
  skip: { bg: '#92400E', icon: <SkipForward className="inline-block w-4 h-4" /> },
  notify: { bg: '#7f1d1d', icon: <Bell className="inline-block w-4 h-4" /> },
  error: { bg: '#9F1239', icon: <XCircle className="inline-block w-4 h-4" /> },
}

// ─── QR MODAL ──────────────────────────────────────────────────────────────────────
function QRModal({ clinic, onClose, onCodeUpdate, router }) {
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [editingCode, setEditingCode] = useState(false)
  const [codeInput, setCodeInput] = useState(clinic?.code || '')
  const [addressInput, setAddressInput] = useState(clinic?.address || '')
  const [codeError, setCodeError] = useState('')
  const [codeSaving, setCodeSaving] = useState(false)
  const [codeSuccess, setCodeSuccess] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressSuccess, setAddressSuccess] = useState(false)

  const planId = clinic?.plan_id || 'starter'
  const canEditCode = planId === 'pro' || planId === 'elite' || planId === 'trialing' || clinic?.subscription_status === 'trialing'

  const [qrDataUrl, setQrDataUrl] = useState('')

  // QR reflects the live code (updates after save)
  const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || clinic?.phone || clinic?.whatsapp_number || '919876543210'
  const waNumber = String(rawNumber).replace(/[^0-9]/g, '')
  const validWaNumber = waNumber.length >= 10 ? waNumber : '919876543210'
  const liveCode = codeSuccess ? codeInput : (clinic?.code || 'TOKEN')
  const waLink = `https://wa.me/${validWaNumber}?text=JOIN%20${liveCode}`
  const fallbackQrUrl = `https://quickchart.io/qr?size=400&text=${encodeURIComponent(waLink)}`

  useEffect(() => {
    if (waLink) {
      QRCode.toDataURL(waLink, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Client QR generation failed:', err))
    }
  }, [waLink])

  const activeQrUrl = qrDataUrl || fallbackQrUrl

  async function saveCode() {
    const clean = codeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length < 3 || clean.length > 12) {
      setCodeError('Code must be 3–12 alphanumeric characters.')
      return
    }

    const codeChanged = clean !== clinic?.code
    const addressChanged = addressInput !== clinic?.address

    if (!codeChanged && !addressChanged) {
      setEditingCode(false)
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
      const fileName = `logos/${clinic.id}_${Date.now()}.png`
      const { data, error } = await supabase.storage.from('voice-notes').upload(fileName, file, { upsert: true })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('voice-notes').getPublicUrl(fileName)
      await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, logo_url: publicUrl })
      })

      clinic.logo_url = publicUrl
      const stored = localStorage.getItem('tokenpe_business')
      if (stored) {
        localStorage.setItem('tokenpe_business', JSON.stringify({ ...JSON.parse(stored), logo_url: publicUrl }))
      }
    } catch (err) {
      alert('Error uploading logo: ' + err.message)
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
      if (activeQrUrl) {
        const a = document.createElement('a')
        a.href = activeQrUrl
        a.download = `TokenPe-QR-${liveCode}.png`
        a.click()
      }
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  function print() {
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>TokenPe QR — ${clinic?.name}</title>
      </head><body>
      <div class="card">
        <div style="margin-bottom:12px;display:flex;justify-content:center">
          <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/logo-light.svg" style="height:44px;width:auto" />
        </div>
        <div class="name">${clinic?.name}</div>
        ${clinic?.address ? `<div style="font-size:11.5px;color:#64748b;margin-top:-2px;margin-bottom:8px;padding:0 10px;word-break:break-word;white-space:pre-wrap;line-height:1.4">${clinic.address}</div>` : ''}
        <div class="sub">Scan to join the Dining queue</div>
        <div style="position:relative; display:inline-block">
          <img src="${activeQrUrl}" style="width:220px;height:220px" />
          ${clinic?.logo_url ? `<img src="${clinic.logo_url}" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:50px; height:50px; border:none; border-radius:8px; padding:4px; background:#1a0505;" />` : ''}
        </div>
        <hr/>
        <div class="how">How to join</div>
        <div class="steps">
          1. Open WhatsApp on your phone<br/>
          2. Scan this QR code with camera<br/>
          3. Tap Send — get your token instantly
        </div>
        <div class="code-box">
          <span class="code-label">Restaurant Code:</span>
          <span class="code-val">${liveCode}</span>
        </div>
      </div>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 20 }}>
      <div className="qr-modal-scroll" onClick={e => e.stopPropagation()} style={{ background: '#1a0505', borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 400, textAlign: 'center', position: 'relative', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: '#380505', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 18, cursor: 'pointer', color: '#d4d4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
          <img src="/logo-light.svg" alt="TokenPe Logo" style={{ height: '44px', width: 'auto' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fef3c7', fontFamily: '"Playfair Display", serif', letterSpacing: '0px' }}>{clinic?.name}</div>
        {clinic?.address && <div style={{ fontSize: 11.5, color: '#d4d4d8', marginTop: 2, marginBottom: 4, padding: '0 10px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{clinic.address}</div>}
        <div style={{ fontSize: 12, color: '#d4d4d8', marginBottom: 16 }}>Scan to join the Dining queue</div>
        <div style={{ background: '#280a0a', borderRadius: 16, padding: 14, display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: 14, position: 'relative' }}>
          <img src={activeQrUrl} alt="QR Code" onError={(e) => { e.target.src = fallbackQrUrl }} style={{ width: 190, height: 190, borderRadius: 10, display: 'block', background: '#ffffff' }} />
          {clinic?.logo_url && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1a0505', padding: 4, borderRadius: 8 }}>
              <img src={clinic.logo_url} alt="Logo" style={{ width: 44, height: 44, borderRadius: 6, display: 'block' }} />
            </div>
          )}
        </div>

        {planId === 'elite' && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'inline-block', background: 'rgba(251,191,36,0.1)', color: '#fef3c7', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: uploadingLogo ? 'wait' : 'pointer', border: '1px dashed #fcd34d' }}>
              {uploadingLogo ? 'Uploading...' : <><Camera className="inline-block w-4 h-4" /> Upload Center Logo</>}
              <input type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
          </div>
        )}

        <div style={{ background: 'rgba(251,191,36,0.1)', borderRadius: 12, padding: '10px 14px', textAlign: 'left', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fef3c7', marginBottom: 5 }}><Smartphone className="inline-block w-4 h-4" /> How guests join</div>
          <div style={{ fontSize: 11, color: '#fcd34d', lineHeight: 1.9 }}>
            1. Open WhatsApp → scan this QR<br />
            2. Tap Send — no typing needed<br />
            3. Pick language → get token + voice note <Mic className="inline-block w-4 h-4" />
          </div>
        </div>

        {/* ── Restaurant Code Section ── */}
        <div style={{ marginBottom: 14 }}>
          {/* Code badge — always visible */}
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(251,191,36,0.1)', border: '1.5px dashed #fcd34d', borderRadius: 10, padding: '8px 16px', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fef3c7', textTransform: 'uppercase', letterSpacing: 0.5 }}>Restaurant Code:</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace', letterSpacing: 2 }}>{liveCode}</span>
          </div>
          {codeSuccess && <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, marginBottom: 4 }}><CheckCircle2 className="inline-block w-4 h-4" /> Code updated! Your new QR is ready.</div>}

          {/* Plan-gated edit section */}
          {canEditCode ? (
            editingCode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <input
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCodeError('') }}
                  maxLength={12}
                  placeholder="e.g. BISTRO24"
                  style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#fbbf24', border: '2px solid rgba(251,191,36,0.3)', borderRadius: 9, padding: '9px 14px', width: '100%', outline: 'none', textAlign: 'center', background: 'rgba(251,191,36,0.05)' }}
                />
                <input
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  maxLength={100}
                  placeholder="Restaurant Address (Optional)"
                  style={{ fontSize: 13, color: '#fef3c7', border: '2px solid rgba(251,191,36,0.3)', borderRadius: 9, padding: '9px 14px', width: '100%', outline: 'none', textAlign: 'center', background: 'rgba(251,191,36,0.05)' }}
                />
                {codeError && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{codeError}</div>}
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <button onClick={saveCode} disabled={codeSaving} style={{ flex: 1, padding: '9px 0', background: 'linear-gradient(135deg,#fbbf24,#d97706)', color: '#4a0a0a', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: codeSaving ? 0.7 : 1 }}>
                    {codeSaving ? 'Saving...' : '✓ Save'}
                  </button>
                  <button onClick={() => { setEditingCode(false); setCodeInput(clinic?.code || ''); setAddressInput(clinic?.address || ''); setCodeError('') }} style={{ flex: 1, padding: '9px 0', background: 'transparent', color: '#fbbf24', border: '1px solid #fbbf24', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingCode(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#fef3c7', cursor: 'pointer', margin: '0 auto' }}>
                <Pencil className="inline-block w-4 h-4" /> Edit Code
              </button>
            )
          ) : (
            <button
              onClick={() => router.push('/restaurant-dashboard/billing')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#92400e', cursor: 'pointer', margin: '0 auto', textAlign: 'center' }}
            >
              <Lock className="inline-block w-4 h-4" /> Custom Code — Upgrade to Pro
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={download} disabled={downloading} style={{ flex: 1, padding: '11px 0', background: 'linear-gradient(135deg,#fbbf24,#d97706)', color: '#4a0a0a', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: downloading ? 0.7 : 1 }}>
            {downloaded ? <><CheckCircle2 className="inline-block w-4 h-4" /> Saved!</> : downloading ? 'Saving...' : <><Download className="inline-block w-4 h-4" /> Download PNG</>}
          </button>
          <button onClick={print} style={{ flex: 1, padding: '11px 0', background: 'transparent', color: '#fbbf24', border: '2px solid #fbbf24', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Printer className="inline-block w-4 h-4" /> Print Card
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DISCOVERY PROFILE MODAL ─────────────────────────────────────────────────────────
function DiscoveryProfileModal({ clinic, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false)
  const [clinicName, setRestaurantName] = useState(clinic?.name || '')
  const [specialty, setSpecialty] = useState(clinic?.specialty || 'General Physician')
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [city, setCity] = useState(clinic?.city || '')
  const [area, setArea] = useState(clinic?.area || '')
  const [phone, setPhone] = useState(clinic?.phone === '0000000000' ? '' : clinic?.phone || '')
  const [gpsStatus, setGpsStatus] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    // eslint-disable-next-line
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setGpsStatus('success') },
      err => { console.error(err); setGpsStatus('error') },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  async function handleSave() {
    const finalSpecialty = specialty === 'Other' ? (customSpecialty || 'Other') : specialty
    if (!clinicName || !city || !finalSpecialty) return alert("Restaurant Name, City and Specialty are required to be visible to guests.")
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
      alert("Error: " + e.message)
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div className="discovery-modal-container" style={{ backgroundColor: '#09090b', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15), transparent 70%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 440, maxHeight: '90vh', color: 'white', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflowY: 'auto', fontFamily: "var(--font-geist-sans), sans-serif" }}>
        
        

        {clinic?.phone !== '0000000000' && clinic?.specialty && clinic?.city && (
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 16, cursor: 'pointer', zIndex: 10 }}>✕</button>
        )}
        <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><UserCheck size={48} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' }} /></div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0' }}>Complete Your Profile</h2>
          <p style={{ color: '#fbbf24', fontSize: 14, margin: 0, lineHeight: 1.5 }}>Fill in your details so guests can find you easily on the TokenPe restaurant finder.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', marginBottom: 6 }}>Restaurant&apos;s Name *</label>
            <input value={clinicName} onChange={e => setRestaurantName(e.target.value)} placeholder="e.g. Apollo Restaurant" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#280a0a', border: '1px solid #cbd5e1', color: '#fef3c7', outline: 'none', fontSize: 15 }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', marginBottom: 6 }}>Specialty *</label>
            <div style={{ position: 'relative' }}>
              <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#280a0a', border: '1px solid #cbd5e1', color: '#fef3c7', outline: 'none', fontSize: 15, appearance: 'none', cursor: 'pointer' }}>
                <option value="General Physician">General Physician</option>
                <option value="Pediatrician">Pediatrician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Dentist">Dentist</option>
                <option value="Orthopedic">Orthopedic</option>
                <option value="Eye Specialist">Eye Specialist</option>
                <option value="ENT Specialist">ENT Specialist</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Physiotherapist">Physiotherapist</option>
                <option value="Other">Other (Type your own)</option>
              </select>
              <ChevronDown size={18} color="#d4d4d8" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            {specialty === 'Other' && (
              <input 
                autoFocus
                value={customSpecialty} 
                onChange={e => setCustomSpecialty(e.target.value)} 
                placeholder="Type your specialty..." 
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#280a0a', border: '1px solid #cbd5e1', color: '#fef3c7', outline: 'none', fontSize: 15, marginTop: 10 }} 
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', marginBottom: 6 }}>City *</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#280a0a', border: '1px solid #cbd5e1', color: '#fef3c7', outline: 'none', fontSize: 15 }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', marginBottom: 6 }}>Local Area</label>
            <input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Andheri West, Bandra" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#280a0a', border: '1px solid #cbd5e1', color: '#fef3c7', outline: 'none', fontSize: 15 }} />
            <div style={{ marginTop: 6, fontSize: 13, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
              {gpsStatus === 'loading' ? <span style={{ color: '#fbbf24' }}>Getting location...</span> : gpsStatus === 'success' ? <><CheckCircle2 size={14} /> <span>Location secured</span></> : <span style={{ color: '#fbbf24' }}>Location failed (Optional)</span>}
            </div>
          </div>

          {clinic?.phone === '0000000000' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', marginBottom: 6 }}>WhatsApp Number * (required for Queue)</label>
              <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit number" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#280a0a', border: '1px solid #cbd5e1', color: '#fef3c7', outline: 'none', fontSize: 15 }} />
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 14, borderRadius: 12, background: '#d97706', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', cursor: saving ? 'wait' : 'pointer', marginTop: 8, boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)', transition: 'background 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.background = '#fbbf24'} onMouseOut={(e) => e.currentTarget.style.background = '#d97706'}>
            {saving ? 'Saving Profile...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── HEADER CLOCK (Isolated to prevent root re-renders) ────────────────────
function HeaderClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return <div className="header-clock">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [guests, setGuests] = useState([])
  const [clinic, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])
  const [newGuestAlert, setNewGuestAlert] = useState(null)
  const newGuestAlertTimeoutRef = useRef(null)
  const localAddedGuestIdsRef = useRef(new Set())
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgrading, setUpgrading] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(null)

  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-js')) {
      const script = document.createElement('script')
      script.id = 'razorpay-checkout-js'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.head.appendChild(script)
    }
    return () => {
      if (newGuestAlertTimeoutRef.current) {
        clearTimeout(newGuestAlertTimeoutRef.current)
      }
    }
  }, [])
  const [activeTab, setActiveTab] = useState('active')
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(() => getISTDateString())
  const [historyDate, setHistoryDate] = useState(() => getISTYesterdayDateString())
  const [historyGuests, setHistoryGuests] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newLang, setNewLang] = useState('en')
  const [newPartySize, setNewPartySize] = useState('2')
  const [showQR, setShowQR] = useState(false)
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userRestaurants, setUserRestaurants] = useState([])
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [addingBranch, setAddingBranch] = useState(false)
  const [showManageBranches, setShowManageBranches] = useState(false)
  const [editingBranchId, setEditingBranchId] = useState(null)
  const [editingBranchName, setEditingBranchName] = useState('')
  const [managingBranch, setManagingBranch] = useState(false)
  const [closingRestaurant, setClosingRestaurant] = useState(false)
  const sounds = useSounds()

  // ── Load restaurant from session (multi-clinic support) ─────────────────────
  useEffect(() => {
    async function loadRestaurant() {
      // ── Step 1: Paint UI instantly from localStorage cache ──────────────
      const cachedRestaurant = localStorage.getItem('tokenpe_business')

      try {
        const storedUserRestaurants = JSON.parse(localStorage.getItem('tokenpe_user_businesses')) || []
        setUserRestaurants(storedUserRestaurants)
      } catch (e) { }

      let parsedCache = null
      if (cachedRestaurant) {
        try {
          parsedCache = JSON.parse(cachedRestaurant)
          setRestaurant(parsedCache) // paint UI instantly from cache
          setLoading(false)     // skip loading spinner if we have cache
        } catch (e) { }
      }

      // ── Step 2: Refresh restaurant from Supabase in background ──────────────
      try {
        const res = await fetch('/api/generic-dashboard/init')
        if (!res.ok) throw new Error('Init failed')
        const data = await res.json()
        if (data.success && data.clinic) {
          localStorage.setItem('businessCode', data.clinic.code)
          localStorage.setItem('businessPhone', data.clinic.phone)
          localStorage.setItem('tokenpe_business', JSON.stringify(data.clinic))

          // Only trigger a re-render if something actually changed
          if (JSON.stringify(data.clinic) !== JSON.stringify(parsedCache)) {
            setRestaurant(data.clinic)
          }

          if (data.userRestaurants) {
            localStorage.setItem('tokenpe_user_businesses', JSON.stringify(data.userRestaurants))
            setUserRestaurants(data.userRestaurants)
          }

          if (!data.clinic.specialty || !data.clinic.city || data.clinic.phone === '0000000000') {
            setShowDiscovery(true)
          }
        }
      } catch (e) {
        if (!parsedCache) {
          localStorage.removeItem('businessCode')
          localStorage.removeItem('businessPhone')
          localStorage.removeItem('tokenpe_business')
          localStorage.removeItem('tokenpe_user_businesses')
          router.push('/restaurant-login')
        }
      }
    }
    loadRestaurant()
  }, [])


  // ── Load guests when restaurant ID or currentDate changes ─────────────────
  // Using clinic.id (not the whole restaurant object) to avoid reloading on every
  // minor restaurant state update (e.g. queue_paused toggle)
  const clinicId = clinic?.id
  useEffect(() => {
    if (!clinicId) return
    async function loadGuests() {
      setLoading(true)
      try {
        const res = await fetch(`/api/generic-dashboard/get?date=${currentDate}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) setGuests(data.patients || data.guests || [])
        }
      } catch (e) {
        console.error('Failed to fetch guests', e)
      }
      setLoading(false)
    }
    loadGuests()
  }, [clinicId, currentDate])

  // ── Polling ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!clinicId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generic-dashboard/get?date=${currentDate}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setGuests(prev => {
              const newGuests = data.patients || data.guests || []
              // Find newly inserted guests for the notification
              const newAdds = newGuests.filter(np => {
                const isNew = !prev.some(p => p.id === np.id)
                const isLocal = localAddedGuestIdsRef.current.has(np.id)
                return isNew && !isLocal
              })
              if (newAdds.length > 0) {
                 sounds.newGuest()
                 setNewGuestAlert(newAdds[0])
                 if (newGuestAlertTimeoutRef.current) {
                   clearTimeout(newGuestAlertTimeoutRef.current)
                 }
                 newGuestAlertTimeoutRef.current = setTimeout(() => {
                   setNewGuestAlert(null)
                   newGuestAlertTimeoutRef.current = null
                 }, 5000)
                 addToast(`New guest joined: ${newAdds[0].name || maskPhone(newAdds[0].phone)} — ${newAdds[0].token}`, 'new')
              }
              return newGuests
            })
          }
        }
      } catch (e) { }
    }, 5000)
    return () => clearInterval(interval)
  }, [clinicId, currentDate])

  // ── Date Check ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      const todayStr = getISTDateString()
      if (todayStr !== currentDate) {
        setCurrentDate(todayStr)
      }
    }, 60000) // Check once a minute
    return () => clearInterval(t)
  }, [currentDate])

  // ── Fetch History ───────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'history' && clinic) {
      async function fetchHistory() {
        setLoadingHistory(true)
        try {
          const res = await fetch(`/api/generic-dashboard/get?date=${historyDate}`)
          if (res.ok) {
            const data = await res.json()
            if (data.success) setHistoryGuests(data.patients || data.guests || [])
          }
        } catch (e) { }
        setLoadingHistory(false)
      }
      fetchHistory()
    }
  }, [activeTab, historyDate, clinic])

  // ── Toast system ────────────────────────────────────────────────────────
  function addToast(msg, type = 'done') {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  // ── Code Update Callback ─────────────────────────────────────
  function handleCodeUpdate(newCode) {
    setRestaurant(prev => ({ ...prev, code: newCode }))

    // Sync the new code into the userRestaurants array for the branch switcher
    setUserRestaurants(prevRestaurants => {
      const updated = prevRestaurants.map(c => c.id === clinic.id ? { ...c, code: newCode } : c)
      localStorage.setItem('tokenpe_user_businesses', JSON.stringify(updated))
      return updated
    })

    addToast(`Restaurant code updated to ${newCode}! Share it with your guests.`, 'done')
  }

  // ── Smooth Branch Switcher (no reload) ─────────────────────────────────
  async function switchToBranch(targetRestaurant) {
    setMenuOpen(false)
    setShowAddBranch(false)
    if (targetRestaurant.id === clinic?.id) return

    // Optimistically switch UI immediately — no flash, no reload
    setRestaurant(targetRestaurant)
    setGuests([])
    setLoading(true)
    localStorage.setItem('businessCode', targetRestaurant.code)
    localStorage.setItem('businessPhone', targetRestaurant.phone)
    localStorage.setItem('tokenpe_business', JSON.stringify(targetRestaurant))
    addToast(`Switched to ${targetRestaurant.name}`, 'done')

    // Update session cookie and wait for it
    await fetch('/api/business-auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRestaurantId: targetRestaurant.id })
    })

    // Fetch fresh guests for the new branch securely
    try {
      const res = await fetch(`/api/generic-dashboard/get?date=${currentDate}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) setGuests(data.patients || data.guests || [])
      }
    } catch (e) { }
    setLoading(false)

    // Show Discovery Profile if the new branch is missing details
    if (!targetRestaurant.specialty || !targetRestaurant.city || targetRestaurant.phone === '0000000000') {
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
        const updatedUserRestaurants = userRestaurants.map(c => c.id === branchId ? { ...c, name: editingBranchName } : c)
        setUserRestaurants(updatedUserRestaurants)
        localStorage.setItem('tokenpe_user_businesses', JSON.stringify(updatedUserRestaurants))
        if (clinic?.id === branchId) {
          const updatedRestaurant = { ...clinic, name: editingBranchName }
          setRestaurant(updatedRestaurant)
          localStorage.setItem('tokenpe_business', JSON.stringify(updatedRestaurant))
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
        const updatedUserRestaurants = userRestaurants.filter(c => c.id !== branchId)
        setUserRestaurants(updatedUserRestaurants)
        localStorage.setItem('tokenpe_user_businesses', JSON.stringify(updatedUserRestaurants))
        addToast('Branch deleted successfully', 'done')
        if (clinic?.id === branchId) {
          await switchToBranch(updatedUserRestaurants[0])
        }
      } else {
        addToast(data.error || 'Failed to delete branch', 'error')
      }
    } catch (e) {
      addToast('Error deleting branch', 'error')
    }
    setManagingBranch(false)
  }

  // ── Logout ──────────────────────────────────────────────────────────────
  async function logout() {
    localStorage.removeItem('businessCode')
    localStorage.removeItem('businessPhone')
    localStorage.removeItem('tokenpe_business')
    localStorage.removeItem('tokenpe_user_businesses')
    await fetch('/api/business-auth/logout', { method: 'POST' })
    await supabase.auth.signOut()
    router.push('/restaurant-login')
  }

  // ── Toggle Pause ────────────────────────────────────────────────────────
  async function togglePause() {
    if (clinic.plan_id === 'starter') {
      addToast('Queue pause is a Pro feature. Please upgrade.', 'error')
      return
    }
    const newStatus = !clinic.queue_paused
    // Optimistic UI update for instant feedback
    setRestaurant(prev => ({ ...prev, queue_paused: newStatus }))
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
      setRestaurant(prev => ({ ...prev, queue_paused: !newStatus }))
      addToast('Failed to pause queue. Reverted state.', 'error')
    }
  }

  // ── Close Restaurant for Today ─────────────────────────────────────────────
  async function closeRestaurantForToday() {

    setMenuOpen(false)
    const previousDate = clinic.closed_today_date
    const today = getISTDateString()
    
    // OPTIMISTIC UI: Instantly switch state so there is no loading blink
    setRestaurant(prev => ({ ...prev, closed_today_date: today }))
    
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
        addToast('🔴 Restaurant closed for today.', 'notify')
      } else {
        // REVERT ON FAILURE
        setRestaurant(prev => ({ ...prev, closed_today_date: previousDate }))
        addToast(data.message || 'Failed to close clinic.', 'error')
      }
    } catch (err) {
      setRestaurant(prev => ({ ...prev, closed_today_date: previousDate }))
      addToast('Error closing clinic. Please try again.', 'error')
    }
  }

  // ── Re-open Restaurant ────────────────────────────────────────────────────────
  async function reopenRestaurant() {
    setMenuOpen(false)
    const previousDate = clinic.closed_today_date
    
    // OPTIMISTIC UI: Instantly switch state so there is no delay
    setRestaurant(prev => ({ ...prev, closed_today_date: null }))
    
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
        addToast(<><CheckCircle2 className="inline-block w-4 h-4" /> Restaurant is now Open again!</>, 'done')
      } else {
        // REVERT ON FAILURE
        setRestaurant(prev => ({ ...prev, closed_today_date: previousDate }))
        addToast(data.message || 'Failed to re-open clinic.', 'error')
      }
    } catch (err) {
      setRestaurant(prev => ({ ...prev, closed_today_date: previousDate }))
      addToast('Error re-opening clinic. Please try again.', 'error')
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  async function onUpdatePayment(guestId, updates) {
    // 1. Optimistic UI update: Find the guest in local state and apply updates
    setGuests(prev => prev.map(p => p.id === guestId ? { ...p, ...updates } : p))
    
    // 2. Persist update in database via API
    try {
      const res = await fetch('/api/generic-queue/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, updates })
      })
      if (!res.ok) {
        throw new Error('API request failed')
      }
    } catch (e) {
      console.error('[onUpdatePayment Error]', e)
      addToast('Failed to save payment changes. Reverting...', 'error')
      
      // Revert local state by refetching guests
      const res = await fetch(`/api/generic-dashboard/get?date=${currentDate}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) setGuests(data.patients || data.guests || [])
      }
    }
  }

  async function callNext() {
    const next = guests.find(p => p.status === STATUS.WAITING)
    if (!next) return

    // Optimistic UI Update
    setGuests(prev => prev.map(p => p.id === next.id ? { ...p, status: STATUS.CALLED } : p))
    sounds.callNext()
    addToast(`Calling ${next.name || next.token} — notifications & queue alerts sent!`, 'call')

    // Call unified backend queue next API to process turn notifications and relative queue alerts!
    const res = await fetch('/api/generic-queue/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId: clinic.id,
        clinicName: clinic.name,
        patientId: next.id,
        patientPhone: next.phone,
        patientName: next.name || 'Guest',
        token: next.token,
        language: next.language || 'en'
      })
    })

    if (!res.ok) {
      addToast('Error calling next guest', 'error')
      // Revert optimistic update
      setGuests(prev => prev.map(p => p.id === next.id ? { ...p, status: STATUS.WAITING } : p))
    }
  }

  async function markDone(guestOrId) {
    const targetId = typeof guestOrId === 'object' ? guestOrId?.id : guestOrId
    if (!targetId) return

    const targetGuest = typeof guestOrId === 'object' ? guestOrId : guests.find(g => g.id === targetId)
    const displayName = targetGuest?.name || targetGuest?.token || 'Guest'

    // Optimistic UI Update
    setGuests(prev => prev.map(p => p.id === targetId ? { ...p, status: STATUS.DONE, completed_at: new Date().toISOString() } : p))
    sounds.done()
    addToast(`${displayName} meal completed, table cleared`, 'done')

    try {
      const res = await fetch('/api/generic-queue/done', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic?.id,
          clinicName: clinic?.name,
          patientId: targetId,
          patientPhone: targetGuest?.phone,
          patientName: targetGuest?.name || 'Guest',
          token: targetGuest?.token,
          language: targetGuest?.language || 'en'
        })
      })

      if (!res.ok) {
        addToast('Error marking meal completed, table cleared', 'error')
        // Revert optimistic update
        setGuests(prev => prev.map(p => p.id === targetId ? { ...p, status: STATUS.CALLED, completed_at: null } : p))
      }
    } catch (err) {
      addToast('Error marking meal completed, table cleared', 'error')
      setGuests(prev => prev.map(p => p.id === targetId ? { ...p, status: STATUS.CALLED, completed_at: null } : p))
    }
  }

  async function skipGuest(guestOrId) {
    const targetId = typeof guestOrId === 'object' ? guestOrId?.id : guestOrId
    if (!targetId) return

    const targetGuest = typeof guestOrId === 'object' ? guestOrId : guests.find(g => g.id === targetId)
    const displayName = targetGuest?.name || targetGuest?.token || 'Guest'

    // Optimistic UI Update
    setGuests(prev => prev.map(p => p.id === targetId ? { ...p, status: STATUS.SKIPPED } : p))
    sounds.skip()
    addToast(`${displayName} skipped`, 'skip')

    try {
      const res = await fetch('/api/generic-queue/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: targetId })
      })

      if (!res.ok) {
        addToast('Error skipping guest', 'error')
        // Revert optimistic update
        setGuests(prev => prev.map(p => p.id === targetId ? { ...p, status: STATUS.WAITING } : p))
      }
    } catch (err) {
      addToast('Error skipping guest', 'error')
      setGuests(prev => prev.map(p => p.id === targetId ? { ...p, status: STATUS.WAITING } : p))
    }
  }

  async function priorityCall(guest) {
    if (!guest) return

    // Optimistic UI Update
    setGuests(prev => prev.map(p => p.id === guest.id ? { ...p, status: STATUS.CALLED } : p))
    sounds.callNext()
    addToast(`🚨 Emergency Call: ${guest.name || guest.token} called next!`, 'call')

    try {
      const res = await fetch('/api/generic-queue/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic.id,
          clinicName: clinic.name,
          patientId: guest.id,
          patientPhone: guest.phone,
          patientName: guest.name || 'Guest',
          token: guest.token,
          language: guest.language || 'en'
        })
      })

      if (!res.ok) {
        throw new Error('API failed')
      }
    } catch (e) {
      console.error(e)
      addToast('Error calling priority guest', 'error')
      // Revert optimistic update
      setGuests(prev => prev.map(p => p.id === guest.id ? { ...p, status: STATUS.WAITING } : p))
    }
  }

  async function notifyGuest(guest) {
    // Optimistic UI Update
    sounds.notify()
    addToast(`Manual text & voice note alert sent to ${guest.name || guest.token}`, 'notify')

    const res = await fetch('/api/generic-queue/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId: clinic.id,
        clinicName: clinic.name,
        patientPhone: guest.phone,
        patientName: guest.name || 'Guest',
        token: guest.token,
        language: guest.language || 'en'
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
        body: JSON.stringify({ clinicId: clinic.id, planTier: tier })
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
        theme: { color: '#fef3c7' },
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
              setRestaurant(fresh)
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
                    colors: ['#7f1d1d', '#fbbf24', '#f59e0b', '#3b82f6'],
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

  const [addingWalkin, setAddingWalkin] = useState(false)
  
  async function addWalkIn() {
    const cleanPhone = newPhone.replace(/\D/g, '')
    if (cleanPhone.length !== 10) {
      addToast('Please enter a valid 10-digit mobile number.', 'error')
      return
    }
    if (addingWalkin) return

    if (isClosedToday) {
      addToast('Restaurant is closed for today. No new guests can be added.', 'error')
      return
    }

    if (clinic?.queue_paused) {
      addToast('Queue is currently paused. Please unpause to add guests.', 'error')
      return
    }

    const planId = clinic?.plan_id || 'starter'
    const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
    if (guests.length >= limit) {
      setShowUpgradeModal(true)
      return
    }

    const token = `T${String(guests.length + 1).padStart(3, '0')}`
    setAddingWalkin(true)

    try {
      const res = await fetch('/api/generic-queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic.id,
          name: newName.trim() || null,
          phone: newPhone.trim(),
          token: token,
          language: newLang || 'en',
          partySize: newPartySize
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to add walk-in')

      const addedGuest = result.patient || result.guest;
      if (addedGuest) {
        if (addedGuest.id) localAddedGuestIdsRef.current.add(addedGuest.id)
        setGuests(prev => [...prev, addedGuest])
      }

      setNewName(''); setNewPhone(''); setNewLang('en'); setNewPartySize('2')
      setShowAddForm(false)
      addToast(`${newName || newPhone} added as ${token}`, 'new')

    } catch (err) {
      console.error(err)
      addToast('Error adding walk-in guest', 'error')
    } finally {
      setAddingWalkin(false)
    }
  }

  // ── Computed ────────────────────────────────────────────────────────────
  const isClosedToday = !!clinic?.closed_today_date
  const waiting = guests.filter(p => p.status === STATUS.WAITING)
  const called = guests.filter(p => p.status === STATUS.CALLED)
  const done = guests.filter(p => p.status === STATUS.DONE)

  // Dynamic average wait — computed from guests who have both joined_at and completed_at
  const avgWaitMins = (() => {
    const completed = done.filter(g => g.joined_at && g.completed_at)
    if (completed.length === 0) return null
    const totalMs = completed.reduce((sum, g) => {
      return sum + (new Date(g.completed_at) - new Date(g.joined_at))
    }, 0)
    return Math.round(totalMs / completed.length / 60000)
  })()
  const activeGuests = [...called, ...waiting]
  const displayGuests = activeTab === 'active' ? activeGuests : done

  // ── Limits ──
  const planId = clinic?.plan_id || 'starter'
  const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
  const isLimitReached = guests.length >= limit
  const oldestRestaurant = userRestaurants?.length > 0
    ? userRestaurants.reduce((oldest, c) => new Date(c.created_at) < new Date(oldest.created_at) ? c : oldest, userRestaurants[0])
    : clinic

  const trialEnd = oldestRestaurant?.trial_ends_at ? new Date(oldestRestaurant.trial_ends_at) : null
  const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0
  const showTrialWarning = oldestRestaurant?.subscription_status === 'trialing' && trialEnd && daysLeft <= 3 && daysLeft >= 0
  const isTrialExpired = oldestRestaurant?.subscription_status === 'trialing' && trialEnd && daysLeft < 0

  // Only show full-screen loader if we have no cached restaurant to show
  if (loading && !clinic) return (
    <div style={s.loadingScreen}>
      <div className="spinner" style={s.spinner} />
      <p style={{ color: '#d4d4d8', marginTop: 16 }}>Loading TokenPe...</p>
    </div>
  )

  // ── Trial Expired Lockout ───────────────────────────────────────────────
  if (isTrialExpired) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15), transparent 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #fbbf24, #d97706)' }} />
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}><Hourglass size={56} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 15px rgba(16,185,129,0.3))' }} /></div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fef3c7', marginBottom: 12 }}>Free Trial Ended</h1>
        <p style={{ color: '#fbbf24', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          We hope you loved TokenPe! Your 7-day Elite trial has expired. To continue using the dashboard and keep your restaurant data safe, please choose a plan.
        </p>
        <button
          onClick={() => router.push('/restaurant-dashboard/billing')}
          style={{ width: '100%', padding: '16px 24px', background: '#d97706', color: '#fef3c7', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', marginBottom: 16, boxShadow: '0 4px 14px 0 rgba(5, 150, 105, 0.4)', transition: 'all 0.2s ease' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.6)'; e.currentTarget.style.background = '#fbbf24' }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(5, 150, 105, 0.4)'; e.currentTarget.style.background = '#d97706' }}
        >
          View Plans & Upgrade →
        </button>
        <button
          onClick={logout}
          style={{ width: '100%', padding: '12px 24px', background: 'transparent', color: '#fbbf24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s ease' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          Sign Out
        </button>
        <p style={{ marginTop: 24, fontSize: 12, color: '#fcd34d' }}>Need help? Email <a href="mailto:tokenpe.online@gmail.com" style={{ color: '#fbbf24', fontWeight: 500 }}>tokenpe.online@gmail.com</a></p>
      </div>
    </div>
  )

  // ── Subscription Canceled / Account Locked ──────────────────────────────
  const isAccountLocked = clinic?.subscription_status === 'canceled' || clinic?.plan_id === 'canceled'
  if (isAccountLocked) return (
    <div style={{ minHeight: '100vh', background: '#0a0514', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}><Lock className="inline-block w-4 h-4" /></div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fef3c7', marginBottom: 12 }}>Account Paused</h1>
        <p style={{ color: '#fbbf24', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Your subscription has ended. Your guest data is safe — reactivate any plan to continue using TokenPe.
        </p>
        <button
          onClick={() => router.push('/restaurant-dashboard/billing')}
          style={{ width: '100%', padding: '16px 24px', background: 'linear-gradient(135deg,#7f1d1d,#b91c1c)', color: '#fef3c7', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', marginBottom: 16, boxShadow: '0 8px 24px rgba(251,191,36,0.3)' }}
        >
          Reactivate Plan →
        </button>
        <button
          onClick={logout}
          style={{ width: '100%', padding: '12px 24px', background: 'transparent', color: '#d4d4d8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Sign Out
        </button>
        <p style={{ marginTop: 24, fontSize: 12, color: '#fcd34d' }}>Questions? Email <a href="mailto:support@tokenpe.online" style={{ color: '#a78bfa' }}>support@tokenpe.online</a></p>
      </div>
    </div>
  )

  return (
    <div className="lovable-root">
      <div className="ghost-element"></div>
      {/* ── Upgrade Success Banner ── */}
      <Suspense fallback={null}>
        <UpgradeBanner />
      </Suspense>
      

      {/* ── Menu Overlay + Dropdown (fixed portal, outside header) ── */}
      {menuOpen && (
        <>
          {/* Click-away overlay - z-index BELOW dropdown */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          />
          {/* Dropdown - z-index ABOVE overlay */}
          <div className="dropdown-menu">
            {userRestaurants.length > 1 && (
              <>
                <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1 }}>Switch Restaurant</div>
                {userRestaurants.map(uc => (
                  <button key={uc.id} className="dropdown-item" style={{ background: uc.id === clinic?.id ? '#fef3c7' : 'transparent', color: uc.id === clinic?.id ? '#6EE7B7' : '#a1a1aa' }} onClick={() => switchToBranch(uc)}>
                    <div className="menu-icon-wrapper" style={{ background: uc.id === clinic?.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: uc.id === clinic?.id ? '#fbbf24' : '#d4d4d8' }}>
                      {uc.id === clinic?.id ? '✓' : '○'}
                    </div>
                    {uc.name}
                  </button>
                ))}
                <div className="dropdown-divider" />
              </>
            )}

            {(clinic?.plan_id === 'elite' || clinic?.subscription_status === 'trialing') && userRestaurants.length < 3 && (
              <button className="dropdown-item primary-action" onClick={() => { setShowAddBranch(true); setMenuOpen(false); }}>
                <div className="menu-icon-wrapper">
                  <Plus className="w-5 h-5" />
                </div>
                Add New Branch
              </button>
            )}

            <button className="dropdown-item active" onClick={() => { setShowManageBranches(true); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <Settings className="w-5 h-5" />
              </div>
              Manage Branches
              <span className="menu-chevron">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </button>

            <div className="dropdown-divider" style={{ margin: '8px 0' }} />

            <button className="dropdown-item" onClick={() => { setActiveTab('history'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <History className="w-5 h-5" />
              </div>
              History
            </button>
            
            <button className="dropdown-item" onClick={() => { router.push('/restaurant-dashboard/analytics'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <BarChart2 className="w-5 h-5" />
              </div>
              Analytics
              <span className="elite-badge">Elite</span>
            </button>
            
            <button className="dropdown-item" onClick={() => { router.push('/restaurant-dashboard/crm'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <Megaphone className="w-5 h-5" />
              </div>
              CRM & Broadcasts
              <span className="elite-badge">Elite</span>
            </button>

            {clinic?.plan_id === 'elite' ? (
              <button className="dropdown-item" onClick={() => { window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'}?text=Hi%20VIP%20Support!`, '_blank'); setMenuOpen(false); }}>
                <div className="menu-icon-wrapper">
                  <Headset className="w-5 h-5" />
                </div>
                VIP Support
                <span className="elite-badge">Elite</span>
              </button>
            ) : clinic?.plan_id === 'pro' ? (
              <button className="dropdown-item" onClick={() => { window.open('mailto:tokenpe.online@gmail.com', '_blank'); setMenuOpen(false); }}>
                <div className="menu-icon-wrapper">
                  <span style={{ fontSize: '1.2rem' }}>⭐</span>
                </div>
                Priority Support
              </button>
            ) : (
              <button className="dropdown-item" onClick={() => { window.open('mailto:tokenpe.online@gmail.com', '_blank'); setMenuOpen(false); }}>
                <div className="menu-icon-wrapper">
                  <span style={{ fontSize: '1.2rem' }}>✉️</span>
                </div>
                Standard Support
              </button>
            )}
            
            <button className="dropdown-item" onClick={() => { router.push('/restaurant-dashboard/billing'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <CreditCard className="w-5 h-5" />
              </div>
              Billing & Plan
            </button>

            <div className="dropdown-divider" style={{ margin: '8px 0' }} />

            {/* ── Close / Re-open Restaurant — ALL plans ── */}
            {isClosedToday ? (
              <button
                className="dropdown-item danger-action"
                onClick={reopenRestaurant}
              >
                <div className="menu-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#fbbf24' }}>
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <span style={{ color: '#fbbf24' }}>Re-open Restaurant Today</span>
                <span className="menu-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </button>
            ) : (
              <button
                className="dropdown-item danger-action"
                onClick={closeRestaurantForToday}
              >
                <div className="menu-icon-wrapper">
                  <CalendarX className="w-5 h-5" />
                </div>
                <span style={{ color: '#f87171' }}>Close Restaurant for Today</span>
                <span className="menu-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </button>
            )}
            
            <div className="dropdown-divider" />
            
            <button className="dropdown-item" onClick={() => { logout(); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <LogOut className="w-5 h-5" />
              </div>
              Logout
            </button>
          </div>
        </>
      )}

      {/* ── Manage Branches Modal ── */}
      {showManageBranches && (
        <div onClick={() => setShowManageBranches(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#7f1d1d', borderRadius: 24, padding: '32px', width: '100%', maxWidth: 500, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800 }}>Manage Branches</h2>
              <button onClick={() => setShowManageBranches(false)} style={{ background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {userRestaurants.map(uc => (
                <div key={uc.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {editingBranchId === uc.id ? (
                    <>
                      <input
                        autoFocus
                        value={editingBranchName}
                        onChange={e => setEditingBranchName(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button disabled={managingBranch} onClick={() => handleSaveBranchEdit(uc.id)} style={{ background: '#fbbf24', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: managingBranch ? 0.7 : 1 }}>Save</button>
                        <button disabled={managingBranch} onClick={() => setEditingBranchId(null)} style={{ background: 'transparent', color: '#fbbf24', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'white', fontWeight: 600 }}>{uc.name} {clinic?.id === uc.id ? <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginLeft: 8 }}>(Active)</span> : ''}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingBranchId(uc.id); setEditingBranchName(uc.name); }} style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '0.9rem' }}>Edit</button>
                        {userRestaurants.length > 1 && (
                          <button onClick={() => handleDeleteBranch(uc.id)} disabled={managingBranch} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: managingBranch ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: managingBranch ? 0.5 : 1 }}>Delete</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="ghost-element"></div>
      {/* ── Upgrade Success Banner ── */}
      <Suspense fallback={null}>
        <UpgradeBanner />
      </Suspense>
      

      {/* ── Menu Overlay + Dropdown (fixed portal, outside header) ── */}
      {menuOpen && (
        <>
          {/* Click-away overlay - z-index BELOW dropdown */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          />
          {/* Dropdown - z-index ABOVE overlay */}
          <div className="dropdown-menu">
            {userRestaurants.length > 1 && (
              <>
                <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1 }}>Switch Restaurant</div>
                {userRestaurants.map(uc => (
                  <button key={uc.id} className="dropdown-item" style={{ background: uc.id === clinic?.id ? '#fef3c7' : 'transparent', color: uc.id === clinic?.id ? '#6EE7B7' : '#a1a1aa' }} onClick={() => switchToBranch(uc)}>
                    <div className="menu-icon-wrapper" style={{ background: uc.id === clinic?.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: uc.id === clinic?.id ? '#fbbf24' : '#d4d4d8' }}>
                      {uc.id === clinic?.id ? '✓' : '○'}
                    </div>
                    {uc.name}
                  </button>
                ))}
                <div className="dropdown-divider" />
              </>
            )}

            {(clinic?.plan_id === 'elite' || clinic?.subscription_status === 'trialing') && userRestaurants.length < 3 && (
              <button className="dropdown-item primary-action" onClick={() => { setShowAddBranch(true); setMenuOpen(false); }}>
                <div className="menu-icon-wrapper">
                  <Plus className="w-5 h-5" />
                </div>
                Add New Branch
              </button>
            )}

            <button className="dropdown-item active" onClick={() => { setShowManageBranches(true); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <Settings className="w-5 h-5" />
              </div>
              Manage Branches
              <span className="menu-chevron">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </button>

            <div className="dropdown-divider" style={{ margin: '8px 0' }} />

            <button className="dropdown-item" onClick={() => { setActiveTab('history'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <History className="w-5 h-5" />
              </div>
              History
            </button>
            
            <button className="dropdown-item" onClick={() => { router.push('/restaurant-dashboard/analytics'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <BarChart2 className="w-5 h-5" />
              </div>
              Analytics
              <span className="elite-badge">Elite</span>
            </button>
            
            <button className="dropdown-item" onClick={() => { router.push('/restaurant-dashboard/crm'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <Megaphone className="w-5 h-5" />
              </div>
              CRM & Broadcasts
              <span className="elite-badge">Elite</span>
            </button>

            {clinic?.plan_id === 'elite' ? (
              <button className="dropdown-item" onClick={() => { window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'}?text=Hi%20VIP%20Support!`, '_blank'); setMenuOpen(false); }}>
                <div className="menu-icon-wrapper">
                  <Headset className="w-5 h-5" />
                </div>
                VIP Support
                <span className="elite-badge">Elite</span>
              </button>
            ) : clinic?.plan_id === 'pro' ? (
              <button className="dropdown-item" onClick={() => { window.open('mailto:tokenpe.online@gmail.com', '_blank'); setMenuOpen(false); }}>
                <div className="menu-icon-wrapper">
                  <span style={{ fontSize: '1.2rem' }}>⭐</span>
                </div>
                Priority Support
              </button>
            ) : (
              <button className="dropdown-item" onClick={() => { window.open('mailto:tokenpe.online@gmail.com', '_blank'); setMenuOpen(false); }}>
                <div className="menu-icon-wrapper">
                  <span style={{ fontSize: '1.2rem' }}>✉️</span>
                </div>
                Standard Support
              </button>
            )}
            
            <button className="dropdown-item" onClick={() => { router.push('/restaurant-dashboard/billing'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <CreditCard className="w-5 h-5" />
              </div>
              Billing & Plan
            </button>

            <div className="dropdown-divider" style={{ margin: '8px 0' }} />

            {/* ── Close / Re-open Restaurant — ALL plans ── */}
            {isClosedToday ? (
              <button
                className="dropdown-item danger-action"
                onClick={reopenRestaurant}
              >
                <div className="menu-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#fbbf24' }}>
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <span style={{ color: '#fbbf24' }}>Re-open Restaurant Today</span>
                <span className="menu-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </button>
            ) : (
              <button
                className="dropdown-item danger-action"
                onClick={closeRestaurantForToday}
              >
                <div className="menu-icon-wrapper">
                  <CalendarX className="w-5 h-5" />
                </div>
                <span style={{ color: '#f87171' }}>Close Restaurant for Today</span>
                <span className="menu-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </button>
            )}
            
            <div className="dropdown-divider" />
            
            <button className="dropdown-item" onClick={() => { logout(); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <LogOut className="w-5 h-5" />
              </div>
              Logout
            </button>
          </div>
        </>
      )}

      {/* ── Manage Branches Modal ── */}
      {showManageBranches && (
        <div onClick={() => setShowManageBranches(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#7f1d1d', borderRadius: 24, padding: '32px', width: '100%', maxWidth: 500, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800 }}>Manage Branches</h2>
              <button onClick={() => setShowManageBranches(false)} style={{ background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {userRestaurants.map(uc => (
                <div key={uc.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {editingBranchId === uc.id ? (
                    <>
                      <input
                        autoFocus
                        value={editingBranchName}
                        onChange={e => setEditingBranchName(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button disabled={managingBranch} onClick={() => handleSaveBranchEdit(uc.id)} style={{ background: '#fbbf24', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: managingBranch ? 0.7 : 1 }}>Save</button>
                        <button disabled={managingBranch} onClick={() => setEditingBranchId(null)} style={{ background: 'transparent', color: '#fbbf24', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'white', fontWeight: 600 }}>{uc.name} {clinic?.id === uc.id ? <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginLeft: 8 }}>(Active)</span> : ''}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingBranchId(uc.id); setEditingBranchName(uc.name); }} style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '0.9rem' }}>Edit</button>
                        {userRestaurants.length > 1 && (
                          <button onClick={() => handleDeleteBranch(uc.id)} disabled={managingBranch} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: managingBranch ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: managingBranch ? 0.5 : 1 }}>Delete</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Add New Branch Modal ── */}
      {showAddBranch && (
        <div onClick={() => setShowAddBranch(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#7f1d1d', borderRadius: 24, padding: '32px', width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>Add New Branch</h2>
            <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: 20 }}>As an Elite user, you can manage up to 3 clinics under one login.</p>
            <input
              autoFocus
              value={newBranchName}
              onChange={e => setNewBranchName(e.target.value)}
              placeholder="e.g. Downtown Branch"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', marginBottom: 20, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button disabled={addingBranch} onClick={handleAddBranch} style={{ flex: 1, background: '#fbbf24', color: '#000', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', opacity: addingBranch ? 0.7 : 1 }}>Add Branch</button>
              <button onClick={() => setShowAddBranch(false)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Modal ── */}
      {showQR && <QRModal clinic={clinic} onClose={() => setShowQR(false)} onCodeUpdate={handleCodeUpdate} router={router} />}

      {/* ── Walk-in Add Form Modal ── */}
      {showAddForm && (
        <div onClick={() => setShowAddForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--wine-deep)', width: '100%', maxWidth: 440, borderRadius: 16, padding: '28px 24px', border: '1px solid var(--border)', color: 'var(--foreground)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', position: 'relative' }}>
            <button onClick={() => setShowAddForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--foreground)', marginTop: 0, marginBottom: 4 }}>Add Walk-in Guest</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 20 }}>Enter guest details to add them directly into the waiting queue.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Guest Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={newPhone}
                  maxLength={10}
                  onChange={e => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Number of Guests</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newPartySize}
                    onChange={e => setNewPartySize(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Language</label>
                  <select
                    value={newLang}
                    onChange={e => setNewLang(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  >
                    {['en', 'hi', 'mr', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'pa'].map(code => (
                      <option key={code} value={code} style={{ background: '#1c0d10' }}>
                        {code === 'en' ? 'English' : `${LANG_NAMES[code]} (${code.toUpperCase()})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addWalkIn}
                  disabled={newPhone.replace(/\D/g, '').length !== 10 || addingWalkin}
                  style={{ flex: 2, padding: '10px', borderRadius: 8, background: 'var(--gold)', color: 'var(--background)', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: newPhone.replace(/\D/g, '').length === 10 && !addingWalkin ? 'pointer' : 'not-allowed', opacity: newPhone.replace(/\D/g, '').length === 10 && !addingWalkin ? 1 : 0.5 }}
                >
                  {addingWalkin ? 'Adding...' : 'Add to Queue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toasts ── */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div 
            key={t.id} 
            style={{ 
              background: t.type === 'error' ? '#EF4444' : '#10B981', 
              color: 'white', 
              padding: '12px 20px', 
              borderRadius: 12, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 12
            }}
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
              ×
            </button>
          </div>
        ))}
      </div>

      {/* ── New Guest Banner ── */}
      {newGuestAlert && (
        <div style={{ ...s.banner, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={s.bannerDot} />
            <span><PlusCircle className="inline-block w-4 h-4" /> New guest joined!&nbsp;</span>
            <strong>{newGuestAlert.name || maskPhone(newGuestAlert.phone)} — {newGuestAlert.token}</strong>
          </div>
          <button 
            onClick={() => {
              setNewGuestAlert(null)
              if (newGuestAlertTimeoutRef.current) {
                clearTimeout(newGuestAlertTimeoutRef.current)
                newGuestAlertTimeoutRef.current = null
              }
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#b91c1c', 
              cursor: 'pointer', 
              fontSize: 18, 
              fontWeight: 'bold',
              lineHeight: 1,
              padding: '0 4px',
              marginLeft: '12px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Discovery Modal ── */}
      {showDiscovery && (
        <DiscoveryModal 
          onClose={() => setShowDiscovery(false)}
          onSuccess={(updates) => {
            const updatedRestaurant = { ...clinic, ...updates }
            setRestaurant(updatedRestaurant)
            localStorage.setItem('tokenpe_business', JSON.stringify(updatedRestaurant))
            localStorage.setItem('businessPhone', updatedRestaurant.phone)
            addToast('Profile completed! You are now visible to guests.', 'done')
          }}
        />
      )}

      {/* ── Trial Warning Banner ── */}
      {showTrialWarning && (
        <div style={{ background: daysLeft <= 3 ? '#DC2626' : 'rgba(6,95,70,0.15)', color: daysLeft <= 3 ? 'white' : '#fcd34d', padding: '10px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, zIndex: 60, position: 'relative', borderBottom: daysLeft <= 3 ? 'none' : '1px solid rgba(127,29,29,0.5)' }}>
          {daysLeft <= 3 ? <><AlertTriangle className="inline-block w-4 h-4" /> Your</> : <><Sparkles className="inline-block w-4 h-4" /> You are on the</>} Elite Free Trial. Ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'} on {trialEnd?.toLocaleDateString('en-IN')}. <button onClick={() => router.push('/restaurant-dashboard/billing')} style={{ background: daysLeft <= 3 ? 'white' : 'rgba(127,29,29,0.3)', color: daysLeft <= 3 ? '#DC2626' : 'rgba(255, 255, 255, 0.03)', border: daysLeft <= 3 ? 'none' : '1px solid rgba(251,191,36,0.3)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, marginLeft: '10px', cursor: 'pointer' }}>Choose a Plan</button>
        </div>
      )}

      {/* ── Closed Today Banner ── */}
      {isClosedToday && (
        <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, zIndex: 60, position: 'relative', borderBottom: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', letterSpacing: '0.2px' }}>
          <span>🔴 Restaurant is Closed for Today — No new guests will be accepted.</span>
          <button
            onClick={reopenRestaurant}
            className="reopen-banner-btn"
          >
            <span style={{ fontSize: '15px' }}><Sparkles className="inline-block w-4 h-4" /></span> Re-open Now
          </button>
        </div>
      )}

      {/* ── Header ── */}
      
      <header className="lovable-header">
        <div className="lovable-header-right">
          <div className="lovable-clock">
            <span className="lovable-live">● LIVE</span>
            <HeaderClock />
          </div>
          <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: '#D4A373', cursor: 'pointer' }}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <div className="lovable-supertitle">RESTAURANT | FRONT OF HOUSE</div>
        <h1 className="lovable-title">{clinic?.name || 'Dummy Resto'} <span>— {(() => { const h = new Date().getHours(); if (h < 12) return 'a morning'; if (h < 17) return 'an afternoon'; if (h < 21) return 'an evening'; return 'a late night'; })()}</span></h1>
        <div className="lovable-subtitle">{(() => { const h = new Date().getHours(); if (h < 12) return "A quiet console for guests, tables and the morning's pace."; if (h < 17) return "A quiet console for guests, tables and the afternoon's flow."; if (h < 21) return "A quiet console for guests, tables and the evening's rhythm."; return "A quiet console for guests, tables and the night's rhythm."; })()}</div>
      </header>

      <div className="lovable-stats-row">
        <div className="lovable-stat-block">
          <div className="lovable-stat-title"><span>I.</span> WAITING</div>
          <div className="lovable-stat-value"><AnimatedNumber value={waiting.length} /></div>
          <div className="lovable-stat-sub">guests currently waiting</div>
        </div>
        <div className="lovable-stat-block">
          <div className="lovable-stat-title"><span>II.</span> OCCUPIED</div>
          <div className="lovable-stat-value"><AnimatedNumber value={called.length} /></div>
          <div className="lovable-stat-sub">tables seated</div>
        </div>
        <div className="lovable-stat-block">
          <div className="lovable-stat-title"><span>III.</span> CLEARED TODAY</div>
          <div className="lovable-stat-value"><AnimatedNumber value={done.length} /></div>
          <div className="lovable-stat-sub">{avgWaitMins !== null ? `avg ${avgWaitMins} min per cover` : 'no covers yet'}</div>
        </div>
        <div className="lovable-stat-block">
          <div className="lovable-stat-title"><span>IV.</span> AVERAGE WAIT</div>
          <div className="lovable-stat-value"><AnimatedNumber value={avgWaitMins !== null ? `${avgWaitMins}'` : '—'} /></div>
          <div className="lovable-stat-sub">{waiting.length > 0 ? `${waiting.length} guest${waiting.length > 1 ? 's' : ''} in queue` : 'queue is clear'}</div>
        </div>
      </div>

      <div className="lovable-actions-row">
        <div className="lovable-actions-left">
          <button className="lovable-btn-outline" onClick={() => setShowQR(true)}>
            <QrCode className="w-4 h-4" /> Generate QR
          </button>
          <button className="lovable-btn-outline" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4" /> Walk-in
          </button>
          <div className="lovable-actions-text">Guests scan the QR — WhatsApp seats them in the queue.</div>
        </div>
        <button className="lovable-btn-primary" onClick={callNext} disabled={waiting.length === 0} style={{ opacity: waiting.length === 0 ? 0.5 : 1 }}>
          Call next - {waiting[0]?.token || 'None'}
        </button>
      </div>

      <div className="lovable-tabs">
        <button className={`lovable-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          Active queue <span className="lovable-tab-count">(<AnimatedNumber value={waiting.length} />)</span>
        </button>
        <button className={`lovable-tab ${activeTab === 'done' ? 'active' : ''}`} onClick={() => setActiveTab('done')}>
          Cleared tables <span className="lovable-tab-count">(<AnimatedNumber value={done.length} />)</span>
        </button>
        <button className={`lovable-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          Payments
        </button>
      </div>

      {activeTab === 'active' && (
        <div className="lovable-grid">
          {/* Left Column */}
          <div>
            <div className="lovable-col-header">
              I. Waiting <span>— {waiting.length} GUESTS</span>
            </div>
            {waiting.map((g, idx) => (
              <GuestCard key={g.id} guest={g} position={idx + 1} onSkip={() => skipGuest(g)} onNotify={() => notifyGuest(g)} onPriorityCall={() => priorityCall(g)} />
            ))}
            {waiting.length === 0 && <div style={{ color: '#A08C8C', fontStyle: 'italic', padding: 20 }}>No waiting guests.</div>}
          </div>
          
          {/* Right Column */}
          <div>
            <div className="lovable-col-header">
              II. Occupied <span>— {called.length} GUESTS</span>
            </div>
            {called.map(g => (
              <GuestCard key={g.id} guest={g} onDone={() => markDone(g)} />
            ))}
            {called.length === 0 && <div style={{ color: '#A08C8C', fontStyle: 'italic', padding: 20, marginBottom: 40 }}>No occupied tables.</div>}

          </div>
        </div>
      )}
      
      {activeTab === 'done' && (
        <div className="lovable-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div>
             <div className="lovable-col-header">Cleared Today <span>— {done.length} TABLES</span></div>
             {done.map((g) => <GuestCard key={g.id} guest={g} />)}
          </div>
        </div>
      )}
      
      {activeTab === 'payments' && <PaymentsView guests={guests} />}

      {showSuccessModal && (
        <div onClick={() => setShowSuccessModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, #7f1d1d, #1e1b4b)', width: '100%', maxWidth: 440, borderRadius: 24, padding: '40px 32px', position: 'relative', border: '1px solid rgba(127,29,29,0.5)', color: '#fef3c7', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(127,29,29,0.5)' }}>
            <div style={{ marginBottom: 16, animation: 'bounce 1s ease infinite', display: 'flex', justifyContent: 'center' }}><Sparkles className="w-16 h-16 text-[#fbbf24]" /></div>
            
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fef3c7', marginBottom: 12, background: 'linear-gradient(to right, #fbbf24, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Payment Successful!</h2>
            <p style={{ color: '#5c0c0c', marginBottom: 24, fontSize: 16, lineHeight: 1.6 }}>Your restaurant has been upgraded to the <strong>{showSuccessModal} Plan</strong>! You can now resume adding guests to your queue.</p>
            <button
              onClick={() => setShowSuccessModal(null)}
              style={{ width: '100%', padding: '14px', background: '#7f1d1d', color: 'white', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(251,191,36,0.3)' }}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── GUEST CARD ──────────────────────────────────────────────────────────
function GuestCard({ guest, position, onDone, onSkip, onNotify, onPriorityCall }) {
  const paxMatch = guest.name?.match(/^(.*?) \((\d+) pax\)$/)
  const displayName = paxMatch ? (paxMatch[1] || 'Walk-in Guest') : (guest.name || 'Walk-in Guest')
  const pax = paxMatch ? paxMatch[2] : null

  const isWaiting = guest.status === 'waiting'
  const isCalled = guest.status === 'called'
  const isDone = guest.status === 'done' || guest.status === 'completed'
  const waitMins = Math.floor((new Date() - new Date(guest.joined_at)) / 60000)
  const joinedTime = new Date(guest.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  const completedTime = guest.completed_at ? new Date(guest.completed_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : null

  if (isDone) {
    return (
      <div className="nsc-card">
        <div className="nsc-info">
          <div className="nsc-top">
            <span className="nsc-token">{guest.token}</span>
            <span className="nsc-done-label">CLEARED</span>
          </div>
          <div className="nsc-middle">
            <span className="nsc-name">{displayName}</span>
            {pax && <span className="nsc-guests">{pax} guests</span>}
          </div>
          <div className="nsc-bottom">
            {joinedTime && <span>arrived {joinedTime}</span>}
            {completedTime && <span>cleared {completedTime}</span>}
            {guest.phone && <span> +91 {maskPhone(guest.phone)}</span>}
          </div>
        </div>
      </div>
    )
  }

  if (isWaiting) {
    // Waiting guest: row-style with rank
    return (
      <div className="ngc-card">
        {position && (
          <div className="ngc-rank">
            <div className="ngc-rank-num">#{position}</div>
            <div className="ngc-rank-label">{position === 1 ? 'NEXT UP' : 'IN LINE'}</div>
          </div>
        )}
        <div className="ngc-info">
          <div className="ngc-name-row">
            <span className="ngc-name">{displayName}</span>
            <span className="ngc-status-badge">WAITING</span>
            <span className="ngc-token">{guest.token}</span>
            {pax && <span className="ngc-guests-badge">{pax} guests</span>}
          </div>
          <div className="ngc-meta">
            <span>{joinedTime}</span>
            {waitMins > 0 && <><span className="ngc-meta-sep">|</span><span style={{ color: waitMins > 20 ? '#EF4444' : '#A08C8C' }}>waited {waitMins} min</span></>}
            {guest.phone && <><span className="ngc-meta-sep">|</span><span>+91 {maskPhone(guest.phone)}</span></>}
          </div>
        </div>
        <div className="ngc-actions">
          {onPriorityCall && (
            <button className="ngc-btn ngc-priority-call" onClick={onPriorityCall}>
              <Megaphone className="w-3.5 h-3.5" /> Priority Call
            </button>
          )}
          <div className="ngc-secondary-actions">
            {onNotify && <button className="ngc-btn ngc-outline" onClick={onNotify}><Bell className="w-3.5 h-3.5" /> Notify</button>}
            {onSkip && <button className="ngc-btn ngc-outline" onClick={onSkip}><SkipForward className="w-3.5 h-3.5" /> Skip</button>}
          </div>
        </div>
      </div>
    )
  }

  // Seated/Called guest: card style
  return (
    <div className="nsc-card">
      <div className="nsc-info">
        <div className="nsc-top">
          <span className="nsc-token">{guest.token}</span>
          <span className="nsc-label">Seated</span>
          {LANG_NAMES[guest.language] && <span style={{ fontSize: '0.62rem', color: '#7A5C5C' }}>{LANG_NAMES[guest.language]}</span>}
        </div>
        <div className="nsc-middle">
          <span className="nsc-name">{displayName}</span>
          {pax && <span className="nsc-guests">{pax} guests</span>}
        </div>
        <div className="nsc-bottom">
          {joinedTime && <span>arrived {joinedTime}</span>}
          {waitMins > 0 && <span> seated {waitMins} min ago</span>}
          {guest.phone && <span> +91 {maskPhone(guest.phone)}</span>}
        </div>
      </div>
      {onDone && (
        <button className="nsc-clear-btn" onClick={onDone}>
          <Check className="w-3.5 h-3.5" /> Clear table
        </button>
      )}
    </div>
  )
}

// ─── PAYMENTS VIEW ──────────────────────────────────────────────────────────
function PaymentsView({ guests, onUpdatePayment: externalOnUpdatePayment, addToast }) {
  const [globalGuests, setGlobalGuests] = useState([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)
  const [paymentSubTab, setPaymentSubTab] = useState('pending')
  const [paymentSearch, setPaymentSearch] = useState('')
  const [editingFeeId, setEditingFeeId] = useState(null)
  const [tempFeeTotal, setTempFeeTotal] = useState('')
  const [tempFeePaid, setTempFeePaid] = useState('')
  const [remindingId, setRemindingId] = useState(null)

  async function handleSendReminder(guest) {
    const billTotal = parseFloat(guest.fee_total) || 0
    if (billTotal <= 0) {
      addToast('Please set a Total Bill greater than 0 first', 'error')
      setEditingFeeId(guest.id)
      setTempFeeTotal('500')
      setTempFeePaid('0')
      return
    }

    if (!guest.phone || guest.phone === '0000000000') {
      addToast('Cannot send reminder: invalid phone number', 'error')
      return
    }

    setRemindingId(guest.id)
    try {
      const res = await fetch('/api/generic-queue/remind-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: guest.id })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        addToast(`Reminder sent to ${guest.name || guest.token}`, 'done')
      } else {
        throw new Error(data.message || 'Failed to send reminder')
      }
    } catch (err) {
      console.error(err)
      addToast(err.message || 'Error sending reminder', 'error')
    } finally {
      setRemindingId(null)
    }
  }

  const fetchPayments = async (query = '') => {
    setLoadingGlobal(true)
    try {
      const url = query ? `/api/generic-dashboard/payments?search=${encodeURIComponent(query)}` : '/api/generic-dashboard/payments'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setGlobalGuests(data.patients || data.guests || [])
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingGlobal(false)
  }

  useEffect(() => {
    // eslint-disable-next-line
    fetchPayments()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (paymentSearch.trim().length >= 3) {
        fetchPayments(paymentSearch)
      } else if (paymentSearch.trim() === '') {
        // eslint-disable-next-line
    fetchPayments()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [paymentSearch])

  const onUpdatePayment = async (id, updates) => {
    // Optimistically update local state immediately
    setGlobalGuests(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))

    // Call the API directly — do NOT delegate to parent's onUpdatePayment
    // which is tied to today's queue state and would cause a revert error
    try {
      const res = await fetch('/api/generic-queue/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: id, updates })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'API request failed')
      }
    } catch (e) {
      console.error('[PaymentsView onUpdatePayment Error]', e)
      addToast('Failed to save payment changes. Please try again.', 'error')
      // Revert optimistic update by re-fetching global data
      // eslint-disable-next-line
    fetchPayments()
    }
  }

  // Sub-tab counters
  const pendingCount = globalGuests.filter(p => p.payment_status !== 'completed').length
  const completedCount = globalGuests.filter(p => p.payment_status === 'completed').length

  // Metrics (calculated dynamically from fetched records)
  const pendingAmountCompleted = globalGuests
    .filter(p => p.payment_status !== 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.fee_paid) || 0), 0)

  const pendingRemainingBalance = globalGuests
    .filter(p => p.payment_status !== 'completed')
    .reduce((sum, p) => sum + ((parseFloat(p.fee_total) || 0) - (parseFloat(p.fee_paid) || 0)), 0)

  const completedTransactionsDone = globalGuests
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.fee_paid) || 0), 0)

  // Real-time Search & Filter
  const filtered = globalGuests.filter(p => {
    const matchesSubTab = paymentSubTab === 'pending'
      ? p.payment_status !== 'completed'
      : p.payment_status === 'completed'

    const q = paymentSearch.toLowerCase().trim()
    const matchesSearch = !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q) ||
      (p.token || '').toLowerCase().includes(q)

    return matchesSubTab && matchesSearch
  })

  return (
    <div style={ps.container}>
      {/* ── Search Bar ── */}
      <div style={ps.searchContainer}>
        <span style={ps.searchIcon}><Search className="w-4 h-4 text-[#94A3B8]" /></span>
        <input
          type="text"
          placeholder="Search guest by name, phone, or token..."
          value={paymentSearch}
          onChange={e => setPaymentSearch(e.target.value)}
          style={ps.searchInput}
        />
      </div>

      {/* ── Sub-Tabs Navigation ── */}
      <div style={ps.subTabs}>
        <button
          onClick={() => { setPaymentSubTab('pending'); setEditingFeeId(null); }}
          style={{
            ...ps.subTab,
            ...(paymentSubTab === 'pending' ? ps.subTabActivePending : {})
          }}
        >
          <AlertTriangle className="inline-block w-4 h-4" /> Pending Payments ({pendingCount})
        </button>
        <button
          onClick={() => { setPaymentSubTab('completed'); setEditingFeeId(null); }}
          style={{
            ...ps.subTab,
            ...(paymentSubTab === 'completed' ? ps.subTabActiveCompleted : {})
          }}
        >
          <CheckCircle2 className="inline-block w-4 h-4" /> Completed Receipts ({completedCount})
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div style={ps.metricsRow}>
        {paymentSubTab === 'pending' ? (
          <>
            <div style={ps.metricCard}>
              <div style={ps.metricTitle}>Pending: Amount Completed</div>
              <div style={{ ...ps.metricValue, color: '#fbbf24' }}>₹{pendingAmountCompleted.toFixed(2)}</div>
            </div>
            <div style={ps.metricCard}>
              <div style={ps.metricTitle}>Pending: Remaining Balance</div>
              <div style={{ ...ps.metricValue, color: '#F43F5E' }}>₹{pendingRemainingBalance.toFixed(2)}</div>
            </div>
          </>
        ) : (
          <div style={{ ...ps.metricCard, flex: 1 }}>
            <div style={ps.metricTitle}>Total Transactions Done</div>
            <div style={{ ...ps.metricValue, color: '#fbbf24' }}>₹{completedTransactionsDone.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* ── Payments List ── */}
      <div style={ps.list}>
        {loadingGlobal ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#d4d4d8', fontWeight: 600 }}>Loading ledger...</div>
        ) : filtered.length === 0 ? (
          <div style={ps.emptyState}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>
              {paymentSubTab === 'pending' ? <Sparkles className="w-10 h-10 text-[#fbbf24] mx-auto" /> : <CheckCircle className="w-10 h-10 text-[#fbbf24] mx-auto" />}
            </div>
            <div style={{ fontWeight: 700, color: '#fef3c7' }}>
              {paymentSubTab === 'pending' ? 'No pending payments!' : 'No completed receipts yet.'}
            </div>
            {paymentSearch && <div style={{ fontSize: '0.85rem', color: '#fbbf24', marginTop: 4 }}>Try clearing your search query.</div>}
          </div>
        ) : (
          filtered.map(p => {
            const isEditing = editingFeeId === p.id
            const feeTotal = parseFloat(p.fee_total) || 0
            const feePaid = parseFloat(p.fee_paid) || 0
            const remaining = feeTotal - feePaid

            return (
              <div key={p.id} className="payment-card" style={ps.card}>
                <div style={{ ...ps.token, color: paymentSubTab === 'pending' ? '#F43F5E' : '#fbbf24' }}>
                  {p.token}
                </div>
                
                <div style={ps.cardInfo}>
                  <div style={ps.guestName}>
                    {p.name || 'Walk-in Guest'}
                    <span style={ps.langBadge}>{LANG_NAMES[p.language] || 'हिंदी'}</span>
                  </div>
                  <div style={ps.guestMeta}>
                    <Smartphone className="inline-block w-4 h-4" /> +91 {maskPhone(p.phone)} &nbsp;·&nbsp; 📅 {p.date}
                  </div>

                  {/* Fee Details Area */}
                  {isEditing ? (
                    <div style={ps.editRow} onClick={e => e.stopPropagation()}>
                      <div style={ps.inputGroup}>
                        <label style={ps.inputLabel}>Total Bill (₹)</label>
                        <input
                          type="number"
                          value={tempFeeTotal}
                          onChange={e => setTempFeeTotal(e.target.value)}
                          style={ps.editInput}
                          placeholder="e.g. 500"
                        />
                      </div>
                      <div style={ps.inputGroup}>
                        <label style={ps.inputLabel}>Paid So Far (₹)</label>
                        <input
                          type="number"
                          value={tempFeePaid}
                          onChange={e => setTempFeePaid(e.target.value)}
                          style={ps.editInput}
                          placeholder="e.g. 200"
                        />
                      </div>
                      <div style={ps.editActions}>
                        <button
                          onClick={() => {
                            const newTotal = parseFloat(tempFeeTotal) || 0
                            const newPaid = parseFloat(tempFeePaid) || 0
                            if (newPaid > newTotal) {
                              addToast('Amount paid cannot exceed total bill', 'error')
                              return
                            }
                            
                            const newStatus = (newTotal > 0 && newPaid >= newTotal) ? 'completed' : 'pending'
                            
                            onUpdatePayment(p.id, {
                              fee_total: newTotal,
                              fee_paid: newPaid,
                              payment_status: newStatus
                            })
                            setEditingFeeId(null)
                          }}
                          style={ps.btnSave}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFeeId(null)}
                          style={ps.btnCancel}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={ps.feeStatusRow}>
                      <span style={ps.feeLabel}>
                        Bill: <strong>₹{feeTotal}</strong>
                      </span>
                      <span style={ps.feeLabel}>
                        Paid: <strong style={{ color: '#fbbf24' }}>₹{feePaid}</strong>
                      </span>
                      {paymentSubTab === 'pending' && (
                        <button
                          onClick={() => {
                            setEditingFeeId(p.id)
                            setTempFeeTotal(p.fee_total || '0')
                            setTempFeePaid(p.fee_paid || '0')
                          }}
                          style={ps.btnEdit}
                          title="Edit Fee"
                        >
                          <Pencil className="inline-block w-4 h-4" /> Edit Fee
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions / Status Right Side */}
                <div style={ps.cardActions}>
                  {paymentSubTab === 'pending' ? (
                    <>
                      <div style={ps.remainingBadge}>
                        Due: ₹{remaining.toFixed(2)}
                      </div>
                      <button
                        onClick={() => {
                          const billTotal = parseFloat(p.fee_total) || 0
                          if (billTotal <= 0) {
                            addToast('Please set a Total Bill greater than 0 first', 'error')
                            setEditingFeeId(p.id)
                            setTempFeeTotal('500')
                            setTempFeePaid('0')
                            return
                          }
                          onUpdatePayment(p.id, {
                            fee_paid: billTotal,
                            payment_status: 'completed'
                          })
                        }}
                        style={ps.btnClearBalance}
                      >
                        Clear Balance
                      </button>
                      <button
                        onClick={() => handleSendReminder(p)}
                        disabled={remindingId === p.id}
                        style={{
                          ...ps.btnRemind,
                          opacity: remindingId === p.id ? 0.6 : 1,
                          cursor: remindingId === p.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {remindingId === p.id ? 'Sending...' : <><Bell className="inline-block w-4 h-4" /> Remind Guest</>}
                      </button>
                    </>
                  ) : (
                    <div style={ps.completedTag}>
                      <CheckCircle2 className="inline-block w-4 h-4" /> Paid / Completed
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── PAYMENTS STYLES ────────────────────────────────────────────────────────
const ps = {
  container: {
    padding: '8px 0 40px',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 20,
    background: '#1a0505',
    borderRadius: 14,
    padding: '2px 4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1rem',
    color: '#fbbf24',
  },
  searchInput: {
    width: '100%',
    padding: '14px 14px 14px 44px',
    borderRadius: 12,
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    outline: 'none',
    color: '#fef3c7',
    boxSizing: 'border-box',
  },
  subTabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    borderBottom: '1px solid rgba(251, 191, 36, 0.2)',
    paddingBottom: 8,
  },
  subTab: {
    padding: '10px 18px',
    border: 'none',
    background: 'transparent',
    color: '#d4d4d8',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    borderRadius: 10,
    transition: 'all 0.2s',
  },
  subTabActivePending: {
    background: 'rgba(249, 115, 22, 0.15)',
    color: '#f97316',
  },
  subTabActiveCompleted: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
  },
  metricsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    background: '#1a0505',
    borderRadius: 16,
    padding: '16px 20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  metricTitle: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metricValue: {
    fontSize: '1.4rem',
    fontWeight: 900,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 24px',
    background: '#1a0505',
    borderRadius: 20,
    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
  },
  card: {
    background: '#1a0505',
    borderRadius: 16,
    padding: '16px 20px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    transition: 'transform 0.15s, box-shadow 0.2s',
  },
  token: {
    fontWeight: 900,
    fontSize: '1.15rem',
    minWidth: 50,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
  cardInfo: {
    flex: 2,
    minWidth: 200,
  },
  guestName: {
    fontWeight: 700,
    color: '#fef3c7',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  langBadge: {
    background: 'rgba(251,191,36,0.1)',
    color: '#fef3c7',
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: '0.68rem',
    fontWeight: 700,
    border: '1px solid rgba(251,191,36,0.3)',
  },
  guestMeta: {
    fontSize: '0.75rem',
    color: '#fbbf24',
    marginTop: 4,
    marginBottom: 8,
  },
  feeStatusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  feeLabel: {
    fontSize: '0.8rem',
    color: '#fcd34d',
  },
  btnEdit: {
    background: 'linear-gradient(135deg, #1f0303 0%, #4a0a0a 100%)',
    color: '#fcd34d',
    border: 'none',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  editRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginTop: 8,
    background: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(12px)',
    padding: 10,
    borderRadius: 10,
    border: '1px solid rgba(251, 191, 36, 0.2)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
    minWidth: 80,
  },
  inputLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#d4d4d8',
    textTransform: 'uppercase',
  },
  editInput: {
    padding: '6px 8px',
    borderRadius: 6,
    border: '1.5px solid #CBD5E1',
    fontSize: '0.8rem',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#fef3c7',
  },
  editActions: {
    display: 'flex',
    gap: 6,
  },
  btnSave: {
    background: '#fbbf24',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnCancel: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#d4d4d8',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cardActions: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 140,
  },
  remainingBadge: {
    background: '#FFE4E6',
    color: '#E11D48',
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: '0.75rem',
    fontWeight: 800,
    border: '1px solid #FECDD3',
  },
  btnClearBalance: {
    background: 'linear-gradient(135deg, #fbbf24, #d97706)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
  },
  btnRemind: {
    background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 10px rgba(6,95,70, 0.2)',
  },
  completedTag: {
    color: '#b45309',
    fontWeight: 700,
    fontSize: '0.78rem',
    background: '#D1FAE5',
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid #A7F3D0',
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
  },
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  root: { fontFamily: "var(--font-geist-sans), sans-serif", background: 'linear-gradient(135deg, #1f0303 0%, #4a0a0a 100%)', minHeight: '100vh', width: '100%', maxWidth: 'none', margin: '0 auto' },
  loadingScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #1f0303 0%, #4a0a0a 100%)' },
  spinner: { width: 40, height: 40, border: '3px solid rgba(251, 191, 36, 0.2)', borderTop: '3px solid #7f1d1d', borderRadius: '50%' },
  toastContainer: { position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 },
  toast: { padding: '12px 18px', borderRadius: 12, color: 'white', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', minWidth: 260 },
  banner: { background: 'linear-gradient(90deg,#7f1d1d15,#06B6D415)', color: '#b91c1c', borderBottom: '1px solid #fcd34d50', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 600 },
  bannerDot: { width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px rgba(251,191,36,0.7)', flexShrink: 0 },
  header: { background: 'linear-gradient(135deg, #7f1d1d 0%, #280a0a 100%)', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 32px rgba(127,29,29,0.5)', position: 'sticky', top: 0, zIndex: 50 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  logoBox: {}, appName: {}, clinicSubName: {},
  headerCenter: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  statChip: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px', backdropFilter: 'blur(8px)' },
  chipDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  statPill: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  liveBadge: { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 20, padding: '4px 12px', color: '#fcd34d', fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1 },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', boxShadow: '0 0 6px #fbbf24' },
  clock: { color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' },
  btnBilling: { background: 'rgba(127,29,29,0.3)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.3)', padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  btnLogout: { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  actionBar: { background: '#1a0505', padding: '12px 24px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid rgba(251, 191, 36, 0.2)', flexWrap: 'wrap', boxShadow: '0 1px 0 rgba(251, 191, 36, 0.2)' },
  btnQR: { background: '#7f1d1d', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },
  btnAdd: { background: '#fbbf24', color: '#4a0a0a', border: '1px solid #d97706', padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  btnCall: { background: 'linear-gradient(135deg,#fbbf24,#d97706)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' },
  btnGhost: { background: 'transparent', color: '#fbbf24', border: '1px solid #fbbf24', padding: '10px 16px', borderRadius: 10, fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' },
  btnDone: { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  btnNotify: { background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  btnSkip: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  btnPriority: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  qrHint: { marginLeft: 'auto', color: '#d4d4d8', fontSize: '0.75rem', fontStyle: 'italic' },
  addForm: { background: 'linear-gradient(135deg,#280a0a,#1f0303)', borderBottom: '1px solid rgba(251,191,36,0.2)', padding: '16px 24px' },
  addFormTitle: { fontWeight: 700, color: '#fef3c7', marginBottom: 12, fontSize: '0.88rem' },
  addFormRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '10px 14px', borderRadius: 9, border: '1.5px solid rgba(251, 191, 36, 0.2)', fontSize: '0.88rem', flex: 1, minWidth: 160, outline: 'none', background: '#1a0505', color: '#fef3c7' },
  select: { padding: '10px 14px', borderRadius: 9, border: '1.5px solid rgba(251, 191, 36, 0.2)', fontSize: '0.88rem', background: '#1a0505', cursor: 'pointer', color: '#fef3c7' },
  tabs: { display: 'flex', padding: '0 24px', background: '#1a0505', borderBottom: '1px solid rgba(251,191,36,0.2)', gap: 4 },
  tab: { padding: '15px 22px', border: 'none', background: 'transparent', color: 'rgba(251, 191, 36, 0.6)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', borderBottom: '3px solid transparent', transition: 'all .2s' },
  tabActive: { color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', borderBottom: '3px solid #fbbf24', borderRadius: '8px 8px 0 0' },
  list: { padding: '12px 16px 80px' },
  card: { background: '#1f0505', borderRadius: 20, padding: 18, marginBottom: 12, border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  guestName: { fontWeight: 700, color: '#fef3c7', fontSize: '0.93rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  langBadge: { background: 'rgba(251,191,36,0.1)', color: '#fcd34d', padding: '2px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, border: '1px solid rgba(251,191,36,0.3)' },
  guestMeta: { fontSize: '0.75rem', color: '#fbbf24', marginTop: 4 },
  estWait: { fontSize: '0.72rem', color: '#d4d4d8', marginTop: 3, fontWeight: 600 },
  cardActions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 },
  doneTag: { color: '#10b981', fontWeight: 700, fontSize: '0.78rem', background: 'rgba(16,185,129,0.1)', padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.3)' },
  skipTag: { color: '#ef4444', fontWeight: 700, fontSize: '0.78rem', background: 'rgba(239,68,68,0.1)', padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.3)' },
  empty: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 24px', position: 'relative', overflow: 'hidden', borderRadius: 24 },
}
