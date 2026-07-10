'use client'
import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import { CheckCircle2, XCircle, Megaphone, PlusCircle, SkipForward, Bell, Camera, MapPin, Pencil, Lock, Download, Printer, Star, Smartphone, Mic, Gift, AlertTriangle, Hourglass, RefreshCw, Sparkles, Plus, Copy, LogOut, Check, ChevronLeft, ChevronRight, Menu, Play, CheckCircle, Search, Edit2, X, PlusSquare, Settings, History, BarChart2, Headset, CreditCard, DoorOpen, DoorClosed, List, Pause, QrCode, Clock, Calendar, CalendarX, CalendarCheck } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getISTDateString, getISTYesterdayDateString } from '../../lib/supabase'
import confetti from 'canvas-confetti'
import CallNextButton from '../../components/CallNextButton'

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
    <div style={{ background: '#052e16', borderBottom: '1px solid #16a34a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 14 }}><CheckCircle2 className="inline-block w-4 h-4" /> Plan activated! Your clinic is now upgraded. All features are unlocked.</span>
      <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
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
  new: { bg: '#0F4C75', icon: <PlusCircle className="inline-block w-4 h-4" /> },
  call: { bg: '#065F46', icon: <Megaphone className="inline-block w-4 h-4" /> },
  done: { bg: '#065F46', icon: <CheckCircle2 className="inline-block w-4 h-4" /> },
  skip: { bg: '#92400E', icon: <SkipForward className="inline-block w-4 h-4" /> },
  notify: { bg: '#1E40AF', icon: <Bell className="inline-block w-4 h-4" /> },
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

  // QR reflects the live code (updates after save)
  const liveCode = codeSuccess ? codeInput : (clinic?.code || '')
  const waLink = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=JOIN%20${liveCode}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&data=${encodeURIComponent(waLink)}&color=7C3AED&bgcolor=ffffff&margin=24`

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
      const res = await fetch('/api/clinics/code', {
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
      localStorage.setItem('clinicCode', clean)
      onCodeUpdate(clean)
    }

    if (addressChanged) {
      // Save address via API
      await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, address: addressInput })
      })
      clinic.address = addressInput
    }

    // Update localStorage
    const stored = localStorage.getItem('tokenpe_clinic')
    if (stored) {
      try { localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), code: clean, address: addressInput })) } catch (_) { }
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
      // Re-using voice-notes bucket since it exists
      const { data, error } = await supabase.storage.from('voice-notes').upload(fileName, file, { upsert: true })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('voice-notes').getPublicUrl(fileName)
      await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, logo_url: publicUrl })
      })

      clinic.logo_url = publicUrl // mutate locally for immediate render
      const stored = localStorage.getItem('tokenpe_clinic')
      if (stored) {
        localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), logo_url: publicUrl }))
      }
    } catch (err) {
      alert('Error uploading logo: ' + err.message)
    }
    setUploadingLogo(false)
  }

  async function saveAddress() {
    setSavingAddress(true)
    try {
      const res = await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, address: addressInput })
      })
      if (res.ok) {
        setAddressSuccess(true)
        setTimeout(() => setAddressSuccess(false), 3000)
        clinic.address = addressInput
        const stored = localStorage.getItem('tokenpe_clinic')
        if (stored) {
          localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), address: addressInput }))
        }
      }
    } catch (e) { }
    setSavingAddress(false)
  }

  async function download() {
    setDownloading(true)
    try {
      const res = await fetch(qrUrl)
      const blob = await res.blob()

      if (!clinic?.logo_url) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `TokenPe-QR-${liveCode}.png`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        const imgUrl = URL.createObjectURL(blob)
        await new Promise(r => { img.onload = r; img.src = imgUrl })

        // Fetch logo as blob to bypass cross-origin canvas tainting issues
        const logoRes = await fetch(clinic.logo_url)
        const logoBlob = await logoRes.blob()
        const logoLocalUrl = URL.createObjectURL(logoBlob)

        const logo = new Image()
        logo.crossOrigin = 'Anonymous'
        await new Promise(r => { logo.onload = r; logo.src = logoLocalUrl })

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const logoSize = img.width * 0.22
        const x = (img.width - logoSize) / 2
        const y = (img.height - logoSize) / 2

        ctx.fillStyle = 'white'
        ctx.fillRect(x - 8, y - 8, logoSize + 16, logoSize + 16)
        ctx.drawImage(logo, x, y, logoSize, logoSize)

        const finalUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = finalUrl
        a.download = `TokenPe-QR-${liveCode}.png`
        a.click()
        URL.revokeObjectURL(imgUrl)
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
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',sans-serif;display:flex;align-items:center;
             justify-content:center;min-height:100vh;background:#fff}
        .card{width:320px;border:2.5px solid #065F46;border-radius:22px;
              padding:32px 24px;text-align:center}
        .logo{font-size:22px;font-weight:900;color:#065F46}
        .tag{font-size:10px;color:#94a3b8;margin-bottom:20px;letter-spacing:.5px}
        .name{font-size:17px;font-weight:800;color:#064E3B;margin-bottom:4px}
        .sub{font-size:12px;color:#64748b;margin-bottom:22px}
        img{width:220px;height:220px;border-radius:12px;border:1px solid #e2e8f0}
        hr{border:none;border-top:1px solid #f1f5f9;margin:18px 0}
        .how{font-size:13px;font-weight:700;color:#064E3B}
        .steps{font-size:11px;color:#64748b;margin-top:8px;line-height:2}
        .code-box{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#F0FDFA;border:1.5px dashed #5EEAD4;border-radius:10px;padding:8px 16px;margin-top:16px}
        .code-label{font-size:10px;font-weight:700;color:#065F46;text-transform:uppercase;letter-spacing:0.5px}
        .code-val{font-size:15px;font-weight:800;color:#064E3B;font-family:monospace;letter-spacing:1px}
      </style>
      </head><body>
      <div class="card">
        <div style="margin-bottom:12px;display:flex;justify-content:center">
          <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/logo-light.svg" style="height:44px;width:auto" />
        </div>
        <div class="name">${clinic?.name}</div>
        ${clinic?.address ? `<div style="font-size:11.5px;color:#64748b;margin-top:-2px;margin-bottom:8px;padding:0 10px;word-break:break-word;white-space:pre-wrap;line-height:1.4">${clinic.address}</div>` : ''}
        <div class="sub">Scan to join the OPD queue</div>
        <div style="position:relative; display:inline-block">
          <img src="${qrUrl}" />
          ${clinic?.logo_url ? `<img src="${clinic.logo_url}" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:50px; height:50px; border:none; border-radius:8px; padding:4px; background:white;" />` : ''}
        </div>
        <hr/>
        <div class="how"><Smartphone className="inline-block w-4 h-4" /> How to join</div>
        <div class="steps">
          1. Open WhatsApp on your phone<br/>
          2. Scan this QR code with camera<br/>
          3. Tap Send — get your token instantly
        </div>
        <div class="code-box">
          <span class="code-label">Clinic Code:</span>
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
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 400, textAlign: 'center', position: 'relative', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 18, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
          <img src="/logo-light.svg" alt="TokenPe Logo" style={{ height: '44px', width: 'auto' }} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#064E3B' }}>{clinic?.name}</div>
        {clinic?.address && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, marginBottom: 4, padding: '0 10px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{clinic.address}</div>}
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Scan to join the OPD queue</div>
        <div style={{ background: '#f8fafc', borderRadius: 16, padding: 14, display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: 14, position: 'relative' }}>
          <img src={qrUrl} alt="QR Code" style={{ width: 190, height: 190, borderRadius: 10, display: 'block' }} />
          {clinic?.logo_url && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: 4, borderRadius: 8 }}>
              <img src={clinic.logo_url} alt="Logo" style={{ width: 44, height: 44, borderRadius: 6, display: 'block' }} />
            </div>
          )}
        </div>

        {planId === 'elite' && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'inline-block', background: '#F0FDFA', color: '#065F46', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: uploadingLogo ? 'wait' : 'pointer', border: '1px dashed #5EEAD4' }}>
              {uploadingLogo ? 'Uploading...' : <><Camera className="inline-block w-4 h-4" /> Upload Center Logo</>}
              <input type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
          </div>
        )}

        <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '10px 14px', textAlign: 'left', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F4C75', marginBottom: 5 }}><Smartphone className="inline-block w-4 h-4" /> How patients join</div>
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.9 }}>
            1. Open WhatsApp → scan this QR<br />
            2. Tap Send — no typing needed<br />
            3. Pick language → get token + voice note <Mic className="inline-block w-4 h-4" />
          </div>
        </div>

        {/* ── Clinic Code Section ── */}
        <div style={{ marginBottom: 14 }}>
          {/* Code badge — always visible */}
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F0FDFA', border: '1.5px dashed #5EEAD4', borderRadius: 10, padding: '8px 16px', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5 }}>Clinic Code:</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#064E3B', fontFamily: 'monospace', letterSpacing: 2 }}>{liveCode}</span>
          </div>
          {codeSuccess && <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginBottom: 4 }}><CheckCircle2 className="inline-block w-4 h-4" /> Code updated! Your new QR is ready.</div>}

          {/* Plan-gated edit section */}
          {canEditCode ? (
            editingCode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <input
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCodeError('') }}
                  maxLength={12}
                  placeholder="e.g. DRSHARMA"
                  style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#064E3B', border: '2px solid #065F46', borderRadius: 9, padding: '9px 14px', width: '100%', outline: 'none', textAlign: 'center', background: '#faf5ff' }}
                />
                <input
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  maxLength={100}
                  placeholder="Clinic Address (Optional)"
                  style={{ fontSize: 13, color: '#064E3B', border: '2px solid #CCFBF1', borderRadius: 9, padding: '9px 14px', width: '100%', outline: 'none', textAlign: 'center', background: '#fff' }}
                />
                {codeError && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{codeError}</div>}
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <button onClick={saveCode} disabled={codeSaving} style={{ flex: 1, padding: '9px 0', background: 'linear-gradient(135deg,#065F46,#4F46E5)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: codeSaving ? 0.7 : 1 }}>
                    {codeSaving ? 'Saving...' : '✓ Save'}
                  </button>
                  <button onClick={() => { setEditingCode(false); setCodeInput(clinic?.code || ''); setAddressInput(clinic?.address || ''); setCodeError('') }} style={{ flex: 1, padding: '9px 0', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingCode(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#065F46', cursor: 'pointer', margin: '0 auto' }}>
                <Pencil className="inline-block w-4 h-4" /> Edit Code
              </button>
            )
          ) : (
            <button
              onClick={() => router.push('/dashboard/billing')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#92400e', cursor: 'pointer', margin: '0 auto', textAlign: 'center' }}
            >
              <Lock className="inline-block w-4 h-4" /> Custom Code — Upgrade to Pro
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={download} disabled={downloading} style={{ flex: 1, padding: '11px 0', background: 'linear-gradient(135deg,#065F46,#4F46E5)', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: downloading ? 0.7 : 1 }}>
            {downloaded ? <><CheckCircle2 className="inline-block w-4 h-4" /> Saved!</> : downloading ? 'Saving...' : <><Download className="inline-block w-4 h-4" /> Download PNG</>}
          </button>
          <button onClick={print} style={{ flex: 1, padding: '11px 0', background: 'white', color: '#065F46', border: '2px solid #065F46', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
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
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setGpsStatus('success') },
      err => { console.error(err); setGpsStatus('error') },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  async function handleSave() {
    const finalSpecialty = specialty === 'Other' ? (customSpecialty || 'Other') : specialty
    if (!city || !finalSpecialty) return alert("City and Specialty are required to be visible to patients.")
    if (!phone || phone.length < 10) return alert("A valid 10-digit WhatsApp number is required.")
    
    setSaving(true)
    try {
      const res = await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, specialty: finalSpecialty, city, area, phone, lat, lng })
      })
      if (res.ok) {
        onSuccess({ specialty: finalSpecialty, city, area, phone, lat, lng })
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
      <div style={{ background: '#064E3B', border: '1px solid #334155', borderRadius: 24, padding: 32, width: '100%', maxWidth: 440, color: 'white', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        {clinic?.phone !== '0000000000' && clinic?.specialty && clinic?.city && (
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 16, cursor: 'pointer' }}>✕</button>
        )}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}><Star className="inline-block w-4 h-4" /></div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0' }}>Complete Your Profile</h2>
          <p style={{ color: '#94A3B8', fontSize: 14, margin: 0, lineHeight: 1.5 }}>Fill in your details so patients can find you easily on the TokenPe clinic finder.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>Specialty *</label>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: 15 }}>
              <option value="General Physician" style={{ color: 'black' }}>General Physician</option>
              <option value="Pediatrician" style={{ color: 'black' }}>Pediatrician</option>
              <option value="Gynecologist" style={{ color: 'black' }}>Gynecologist</option>
              <option value="Dermatologist" style={{ color: 'black' }}>Dermatologist</option>
              <option value="Dentist" style={{ color: 'black' }}>Dentist</option>
              <option value="Orthopedic" style={{ color: 'black' }}>Orthopedic</option>
              <option value="Eye Specialist" style={{ color: 'black' }}>Eye Specialist</option>
              <option value="ENT Specialist" style={{ color: 'black' }}>ENT Specialist</option>
              <option value="Cardiologist" style={{ color: 'black' }}>Cardiologist</option>
              <option value="Physiotherapist" style={{ color: 'black' }}>Physiotherapist</option>
              <option value="Other" style={{ color: 'black' }}>Other (Type your own)</option>
            </select>
            {specialty === 'Other' && (
              <input 
                autoFocus
                value={customSpecialty} 
                onChange={e => setCustomSpecialty(e.target.value)} 
                placeholder="Type your specialty..." 
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: 15, marginTop: 10 }} 
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>City *</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: 15 }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>Local Area</label>
            <input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Andheri West" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: 15 }} />
          </div>

          {clinic?.phone === '0000000000' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>WhatsApp Number * (required for Queue)</label>
              <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit number" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: 15 }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 20 }}><MapPin className="inline-block w-4 h-4" /></span>
            <div style={{ flex: 1, fontSize: 13, color: '#94A3B8' }}>
              {gpsStatus === 'loading' ? 'Getting location...' : gpsStatus === 'success' ? <>Location secured <CheckCircle2 className="inline-block w-4 h-4" /></> : 'Location failed (Optional)'}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', cursor: saving ? 'wait' : 'pointer', marginTop: 8, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
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
  const [patients, setPatients] = useState([])
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])
  const [newPatientAlert, setNewPatientAlert] = useState(null)
  const newPatientAlertTimeoutRef = useRef(null)
  const localAddedPatientIdsRef = useRef(new Set())
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
      if (newPatientAlertTimeoutRef.current) {
        clearTimeout(newPatientAlertTimeoutRef.current)
      }
    }
  }, [])
  const [activeTab, setActiveTab] = useState('active')
  const [currentDate, setCurrentDate] = useState(() => getISTDateString())
  const [historyDate, setHistoryDate] = useState(() => getISTYesterdayDateString())
  const [historyPatients, setHistoryPatients] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newLang, setNewLang] = useState('hi')
  const [showQR, setShowQR] = useState(false)
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userClinics, setUserClinics] = useState([])
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [addingBranch, setAddingBranch] = useState(false)
  const [showManageBranches, setShowManageBranches] = useState(false)
  const [editingBranchId, setEditingBranchId] = useState(null)
  const [editingBranchName, setEditingBranchName] = useState('')
  const [managingBranch, setManagingBranch] = useState(false)
  const [closingClinic, setClosingClinic] = useState(false)
  const sounds = useSounds()

  // ── Load clinic from session (multi-clinic support) ─────────────────────
  useEffect(() => {
    async function loadClinic() {
      // ── Step 1: Paint UI instantly from localStorage cache ──────────────
      const cachedClinic = localStorage.getItem('tokenpe_clinic')

      try {
        const storedUserClinics = JSON.parse(localStorage.getItem('tokenpe_user_clinics')) || []
        setUserClinics(storedUserClinics)
      } catch (e) { }

      let parsedCache = null
      if (cachedClinic) {
        try {
          parsedCache = JSON.parse(cachedClinic)
          setClinic(parsedCache) // paint UI instantly from cache
          setLoading(false)     // skip loading spinner if we have cache
        } catch (e) { }
      }

      // ── Step 2: Refresh clinic from Supabase in background ──────────────
      try {
        const res = await fetch('/api/dashboard/init')
        if (!res.ok) throw new Error('Init failed')
        const data = await res.json()
        if (data.success && data.clinic) {
          localStorage.setItem('clinicCode', data.clinic.code)
          localStorage.setItem('clinicPhone', data.clinic.phone)
          localStorage.setItem('tokenpe_clinic', JSON.stringify(data.clinic))

          // Only trigger a re-render if something actually changed
          if (JSON.stringify(data.clinic) !== JSON.stringify(parsedCache)) {
            setClinic(data.clinic)
          }

          if (data.userClinics) {
            localStorage.setItem('tokenpe_user_clinics', JSON.stringify(data.userClinics))
            setUserClinics(data.userClinics)
          }

          if (!data.clinic.specialty || !data.clinic.city || data.clinic.phone === '0000000000') {
            setShowDiscovery(true)
          }
        }
      } catch (e) {
        if (!parsedCache) {
          localStorage.removeItem('clinicCode')
          localStorage.removeItem('clinicPhone')
          localStorage.removeItem('tokenpe_clinic')
          localStorage.removeItem('tokenpe_user_clinics')
          router.push('/login')
        }
      }
    }
    loadClinic()
  }, [])


  // ── Load patients when clinic ID or currentDate changes ─────────────────
  // Using clinic.id (not the whole clinic object) to avoid reloading on every
  // minor clinic state update (e.g. queue_paused toggle)
  const clinicId = clinic?.id
  useEffect(() => {
    if (!clinicId) return
    async function loadPatients() {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/get?date=${currentDate}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) setPatients(data.patients || [])
        }
      } catch (e) {
        console.error('Failed to fetch patients', e)
      }
      setLoading(false)
    }
    loadPatients()
  }, [clinicId, currentDate])

  // ── Polling ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!clinicId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/dashboard/get?date=${currentDate}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setPatients(prev => {
              const newPatients = data.patients || []
              // Find newly inserted patients for the notification
              const newAdds = newPatients.filter(np => {
                const isNew = !prev.some(p => p.id === np.id)
                const isLocal = localAddedPatientIdsRef.current.has(np.id)
                return isNew && !isLocal
              })
              if (newAdds.length > 0) {
                 sounds.newPatient()
                 setNewPatientAlert(newAdds[0])
                 if (newPatientAlertTimeoutRef.current) {
                   clearTimeout(newPatientAlertTimeoutRef.current)
                 }
                 newPatientAlertTimeoutRef.current = setTimeout(() => {
                   setNewPatientAlert(null)
                   newPatientAlertTimeoutRef.current = null
                 }, 5000)
                 addToast(`New patient joined: ${newAdds[0].name || maskPhone(newAdds[0].phone)} — ${newAdds[0].token}`, 'new')
              }
              return newPatients
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
          const res = await fetch(`/api/dashboard/get?date=${historyDate}`)
          if (res.ok) {
            const data = await res.json()
            if (data.success) setHistoryPatients(data.patients || [])
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
    setClinic(prev => ({ ...prev, code: newCode }))

    // Sync the new code into the userClinics array for the branch switcher
    setUserClinics(prevClinics => {
      const updated = prevClinics.map(c => c.id === clinic.id ? { ...c, code: newCode } : c)
      localStorage.setItem('tokenpe_user_clinics', JSON.stringify(updated))
      return updated
    })

    addToast(<><CheckCircle2 className="inline-block w-4 h-4" /> Clinic code updated to ${newCode}! Share it with your patients.</>, 'done')
  }

  // ── Smooth Branch Switcher (no reload) ─────────────────────────────────
  async function switchToBranch(targetClinic) {
    setMenuOpen(false)
    setShowAddBranch(false)
    if (targetClinic.id === clinic?.id) return

    // Optimistically switch UI immediately — no flash, no reload
    setClinic(targetClinic)
    setPatients([])
    setLoading(true)
    localStorage.setItem('clinicCode', targetClinic.code)
    localStorage.setItem('clinicPhone', targetClinic.phone)
    localStorage.setItem('tokenpe_clinic', JSON.stringify(targetClinic))
    addToast(<><CheckCircle2 className="inline-block w-4 h-4" /> Switched to ${targetClinic.name}</>, 'done')

    // Update session cookie and wait for it
    await fetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetClinicId: targetClinic.id })
    })

    // Fetch fresh patients for the new branch securely
    try {
      const res = await fetch(`/api/dashboard/get?date=${currentDate}`)
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
      const res = await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: branchId, name: editingBranchName })
      })
      const data = await res.json()
      if (data.success) {
        const updatedUserClinics = userClinics.map(c => c.id === branchId ? { ...c, name: editingBranchName } : c)
        setUserClinics(updatedUserClinics)
        localStorage.setItem('tokenpe_user_clinics', JSON.stringify(updatedUserClinics))
        if (clinic?.id === branchId) {
          const updatedClinic = { ...clinic, name: editingBranchName }
          setClinic(updatedClinic)
          localStorage.setItem('tokenpe_clinic', JSON.stringify(updatedClinic))
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
      const res = await fetch('/api/clinics/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: branchId })
      })
      const data = await res.json()
      if (data.success) {
        const updatedUserClinics = userClinics.filter(c => c.id !== branchId)
        setUserClinics(updatedUserClinics)
        localStorage.setItem('tokenpe_user_clinics', JSON.stringify(updatedUserClinics))
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

  // ── Logout ──────────────────────────────────────────────────────────────
  async function logout() {
    localStorage.removeItem('clinicCode')
    localStorage.removeItem('clinicPhone')
    localStorage.removeItem('tokenpe_clinic')
    localStorage.removeItem('tokenpe_user_clinics')
    await fetch('/api/auth/logout', { method: 'POST' })
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Toggle Pause ────────────────────────────────────────────────────────
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
      const res = await fetch('/api/clinic/pause', {
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

  // ── Close Clinic for Today ─────────────────────────────────────────────
  async function closeClinicForToday() {

    setMenuOpen(false)
    const previousDate = clinic.closed_today_date
    const today = getISTDateString()
    
    // OPTIMISTIC UI: Instantly switch state so there is no loading blink
    setClinic(prev => ({ ...prev, closed_today_date: today }))
    
    try {
      const res = await fetch('/api/clinic/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const stored = localStorage.getItem('tokenpe_clinic')
        if (stored) {
          try { localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), closed_today_date: today })) } catch (_) {}
        }
        addToast('🔴 Clinic closed for today.', 'notify')
      } else {
        // REVERT ON FAILURE
        setClinic(prev => ({ ...prev, closed_today_date: previousDate }))
        addToast(data.message || 'Failed to close clinic.', 'error')
      }
    } catch (err) {
      setClinic(prev => ({ ...prev, closed_today_date: previousDate }))
      addToast('Error closing clinic. Please try again.', 'error')
    }
  }

  // ── Re-open Clinic ────────────────────────────────────────────────────────
  async function reopenClinic() {
    setMenuOpen(false)
    const previousDate = clinic.closed_today_date
    
    // OPTIMISTIC UI: Instantly switch state so there is no delay
    setClinic(prev => ({ ...prev, closed_today_date: null }))
    
    try {
      const res = await fetch('/api/clinic/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const stored = localStorage.getItem('tokenpe_clinic')
        if (stored) {
          try { localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), closed_today_date: null })) } catch (_) {}
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

  // ── Actions ─────────────────────────────────────────────────────────────
  async function onUpdatePayment(patientId, updates) {
    // 1. Optimistic UI update: Find the patient in local state and apply updates
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...updates } : p))
    
    // 2. Persist update in database via API
    try {
      const res = await fetch('/api/queue/update-payment', {
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
      const res = await fetch(`/api/dashboard/get?date=${currentDate}`)
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
    addToast(`Calling ${next.name || next.token} — notifications & queue alerts sent!`, 'call')

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

    if (!res.ok) {
      addToast('Error calling next patient', 'error')
    }
  }

  async function markDone(patient) {
    // Optimistic UI Update
    setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, status: STATUS.DONE, completed_at: new Date().toISOString() } : p))
    sounds.done()
    addToast(`${patient.name || patient.token} consultation done`, 'done')

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

    if (!res.ok) {
      addToast('Error marking consultation done', 'error')
    }
  }

  async function skipPatient(patient) {
    // Optimistic UI Update
    setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, status: STATUS.SKIPPED } : p))
    sounds.skip()
    addToast(`${patient.name || patient.token} skipped`, 'skip')

    const res = await fetch('/api/queue/skip', {
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
    addToast(`🚨 Emergency Call: ${patient.name || patient.token} called next!`, 'call')

    try {
      const res = await fetch('/api/queue/next', {
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

    const res = await fetch('/api/queue/notify', {
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
          contact: data.clinicPhone,
        },
        theme: { color: '#065F46' },
        handler: async function (response) {
          const maxAttempts = 5
          let attempts = 0
          const poll = async () => {
            attempts++
            const res = await fetch(`/api/clinics/get?id=${clinic.id}`)
            let fresh = null
            if (res.ok) {
              const data = await res.json()
              if (data.success) fresh = data.clinic
            }
            if (fresh) {
              setClinic(fresh)
              localStorage.setItem('tokenpe_clinic', JSON.stringify(fresh))
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
      const res = await fetch('/api/queue/add', {
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

  // ── Computed ────────────────────────────────────────────────────────────
  const isClosedToday = !!clinic?.closed_today_date
  const waiting = patients.filter(p => p.status === STATUS.WAITING)
  const called = patients.filter(p => p.status === STATUS.CALLED)
  const done = patients.filter(p => p.status === STATUS.DONE)
  const activePatients = [...called, ...waiting]
  const displayPatients = activeTab === 'active' ? activePatients : done

  // ── Limits ──
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

  // ── Trial Expired Lockout ───────────────────────────────────────────────
  if (isTrialExpired) return (
    <div style={{ minHeight: '100vh', background: '#0a0514', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
        <div style={{ fontSize: 56, marginBottom: 24 }}><Hourglass className="inline-block w-4 h-4" /></div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Free Trial Ended</h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          We hope you loved TokenPe! Your 7-day Elite trial has expired. To continue using the dashboard and keep your clinic data safe, please choose a plan.
        </p>
        <button
          onClick={() => router.push('/dashboard/billing')}
          style={{ width: '100%', padding: '16px 24px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', marginBottom: 16, boxShadow: '0 8px 24px rgba(245,158,11,0.25)' }}
        >
          View Plans & Upgrade →
        </button>
        <button
          onClick={logout}
          style={{ width: '100%', padding: '12px 24px', background: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Sign Out
        </button>
        <p style={{ marginTop: 24, fontSize: 12, color: '#475569' }}>Need help? Email <a href="mailto:support@tokenpe.online" style={{ color: '#f59e0b' }}>support@tokenpe.online</a></p>
      </div>
    </div>
  )

  // ── Subscription Canceled / Account Locked ──────────────────────────────
  const isAccountLocked = clinic?.subscription_status === 'canceled' || clinic?.plan_id === 'canceled'
  if (isAccountLocked) return (
    <div style={{ minHeight: '100vh', background: '#0a0514', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}><Lock className="inline-block w-4 h-4" /></div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Account Paused</h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Your subscription has ended. Your patient data is safe — reactivate any plan to continue using TokenPe.
        </p>
        <button
          onClick={() => router.push('/dashboard/billing')}
          style={{ width: '100%', padding: '16px 24px', background: 'linear-gradient(135deg,#065F46,#4f46e5)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', marginBottom: 16, boxShadow: '0 8px 24px rgba(6,95,70,0.4)' }}
        >
          Reactivate Plan →
        </button>
        <button
          onClick={logout}
          style={{ width: '100%', padding: '12px 24px', background: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Sign Out
        </button>
        <p style={{ marginTop: 24, fontSize: 12, color: '#475569' }}>Questions? Email <a href="mailto:support@tokenpe.online" style={{ color: '#a78bfa' }}>support@tokenpe.online</a></p>
      </div>
    </div>
  )

  return (
    <div style={s.root}>
      {/* ── Upgrade Success Banner ── */}
      <Suspense fallback={null}>
        <UpgradeBanner />
      </Suspense>
      <style>{`
        .dash-header {
          background: linear-gradient(135deg,#065F46 0%,#064E3B 50%,#09524f 100%);
          padding: 0 24px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 32px rgba(6,95,70,0.25);
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

        .stat-chip {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 6px 14px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) inset;
        }

        .stat-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .desktop-only-logout {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-only-live {
          display: none;
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
            padding: 16px 24px !important;
            align-items: stretch;
            gap: 14px;
          }
          
          .header-top-row {
            width: 100%;
            justify-content: space-between;
            align-items: center;
          }
          
          .header-mobile-right {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .header-mid-row {
            width: 100%;
            display: flex;
            justify-content: center;
            gap: 12px;
            padding: 0 12px;
          }
          
          .header-bottom-row {
            width: 100%;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding-top: 12px;
            justify-content: space-between;
          }
          
          .stat-chip {
            flex: 1;
            max-width: 140px;
            padding: 8px 4px !important;
            flex-direction: column !important;
            justify-content: center;
            gap: 2px !important;
          }
          
          .stat-top {
            gap: 6px !important;
          }
          
          .stat-label {
            font-size: 0.65rem !important;
            line-height: 1;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          
          .mobile-only-live {
            display: block;
          }
          
          .desktop-only-logout {
            display: none;
          }
        }

        /* PATIENT CARD MOBILE TWEAKS */
        @media (max-width: 600px) {
          .patient-card {
            padding: 14px 16px !important;
          }
          .patient-card-actions {
            width: 100%;
            justify-content: flex-end;
            margin-top: 4px;
            padding-top: 14px;
            border-top: 1px solid #F1F5F9;
          }
          .action-bar-responsive {
            display: flex !important;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px !important;
            padding: 16px 24px !important;
          }
          .action-bar-responsive button {
            flex: 1;
            min-width: 130px;
            font-size: 0.78rem !important;
            padding: 10px 10px !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .action-bar-responsive .qr-hint-mobile {
            grid-column: 1 / -1;
            text-align: center;
          }
        }

        /* ── SMOOTH BUTTON PHYSICS (Dashboard-wide) ── */
        button {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.3s ease,
                      opacity 0.25s ease,
                      background 0.25s ease,
                      filter 0.25s ease !important;
          will-change: transform, box-shadow, filter;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.08);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        button:active:not(:disabled) {
          transform: scale(0.92) translateY(0) !important;
          filter: brightness(0.95);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .hamburger-btn:active {
          transform: scale(0.88) !important;
        }
        .dropdown-item {
          transition: background 0.14s ease, color 0.14s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1) !important;
        }
        .dropdown-item:active {
          transform: scale(0.96) !important;
        }

        /* DROPDOWN MENU STYLES */
        .dropdown-menu {
          position: fixed;
          top: 72px;
          right: 16px;
          background: #0f172a; /* Dark Navy Background */
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid #1e293b;
          border-radius: 14px;
          padding: 16px;
          width: 300px;
          max-height: calc(100vh - 90px);
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: slideDown 0.18s ease-out forwards;
          transform-origin: top right;
        }

        .dropdown-menu::-webkit-scrollbar {
          width: 6px;
        }
        .dropdown-menu::-webkit-scrollbar-track {
          background: transparent;
        }
        .dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .dropdown-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: scale(0.92) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .dropdown-item {
          background: transparent;
          color: #f1f5f9;
          border: none;
          padding: 8px 12px;
          border-radius: 10px;
          text-align: left;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s ease;
          width: 100%;
          font-family: inherit;
          position: relative;
        }

        .dropdown-item:hover, .dropdown-item:active {
          background: #1e293b;
          color: #fff;
        }

        .dropdown-item.active {
          background: #1e293b;
          color: #eab308;
          position: relative;
        }

        .dropdown-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: #eab308;
          border-radius: 0 4px 4px 0;
        }

        .menu-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e293b;
          flex-shrink: 0;
        }

        .dropdown-item:hover .menu-icon-wrapper {
          background: #334155;
        }

        .dropdown-item.active .menu-icon-wrapper {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
        }

        .dropdown-item.primary-action .menu-icon-wrapper {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        .dropdown-item.primary-action {
          background: #162842;
          margin-bottom: 4px;
        }

        .dropdown-item.danger-action {
          background: #162032;
          margin-top: 4px;
        }
        .dropdown-item.danger-action .menu-icon-wrapper {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .elite-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(234, 179, 8, 0.5);
          color: #eab308;
          margin-left: auto;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .menu-chevron {
          margin-left: auto;
          color: #94a3b8;
          opacity: 0.7;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 4px 8px;
        }

        .hamburger-btn {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .hamburger-btn:hover, .hamburger-btn:active {
          background: rgba(6,95,70, 0.3);
          border-color: rgba(6,95,70, 0.5);
        }

        @media (max-width: 960px) {
          .dropdown-menu {
            top: auto;
            bottom: auto;
            right: 12px;
          }
        }

        .reopen-banner-btn {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: #fff;
          border: 1px solid rgba(16,185,129,0.5);
          padding: 6px 18px;
          border-radius: 20px;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .reopen-banner-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 6px 16px rgba(16,185,129,0.5);
          border-color: rgba(255,255,255,0.4);
        }
        .reopen-banner-btn:active {
          transform: scale(0.97);
        }

        /* SPIN ANIMATION */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 0.8s linear infinite;
        }

        /* PAYMENTS VIEW TWEAKS */
        .payment-card {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease !important;
        }
        .payment-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.06) !important;
        }
        @media (max-width: 600px) {
          .payment-card {
            padding: 14px 16px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .payment-card > div {
            width: 100% !important;
            align-items: flex-start !important;
            text-align: left !important;
          }
        }
      `}</style>

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
            {userClinics.length > 1 && (
              <>
                <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>Switch Clinic</div>
                {userClinics.map(uc => (
                  <button key={uc.id} className="dropdown-item" style={{ background: uc.id === clinic?.id ? '#1e293b' : 'transparent', color: uc.id === clinic?.id ? '#6EE7B7' : '#94A3B8' }} onClick={() => switchToBranch(uc)}>
                    <div className="menu-icon-wrapper" style={{ background: uc.id === clinic?.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: uc.id === clinic?.id ? '#10b981' : '#64748b' }}>
                      {uc.id === clinic?.id ? '✓' : '○'}
                    </div>
                    {uc.name}
                  </button>
                ))}
                <div className="dropdown-divider" />
              </>
            )}

            {(clinic?.plan_id === 'elite' || clinic?.subscription_status === 'trialing') && userClinics.length < 3 && (
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
            
            <button className="dropdown-item" onClick={() => { router.push('/dashboard/analytics'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <BarChart2 className="w-5 h-5" />
              </div>
              Analytics
              <span className="elite-badge">Elite</span>
            </button>
            
            <button className="dropdown-item" onClick={() => { router.push('/dashboard/crm'); setMenuOpen(false); }}>
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
            
            <button className="dropdown-item" onClick={() => { router.push('/dashboard/billing'); setMenuOpen(false); }}>
              <div className="menu-icon-wrapper">
                <CreditCard className="w-5 h-5" />
              </div>
              Billing & Plan
            </button>

            <div className="dropdown-divider" style={{ margin: '8px 0' }} />

            {/* ── Close / Re-open Clinic — ALL plans ── */}
            {isClosedToday ? (
              <button
                className="dropdown-item danger-action"
                onClick={reopenClinic}
              >
                <div className="menu-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <span style={{ color: '#10b981' }}>Re-open Clinic Today</span>
                <span className="menu-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </button>
            ) : (
              <button
                className="dropdown-item danger-action"
                onClick={closeClinicForToday}
              >
                <div className="menu-icon-wrapper">
                  <CalendarX className="w-5 h-5" />
                </div>
                <span style={{ color: '#f87171' }}>Close Clinic for Today</span>
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
          <div onClick={e => e.stopPropagation()} style={{ background: '#065F46', borderRadius: 24, padding: '32px', width: '100%', maxWidth: 500, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800 }}>Manage Branches</h2>
              <button onClick={() => setShowManageBranches(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {userClinics.map(uc => (
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
                        <button disabled={managingBranch} onClick={() => handleSaveBranchEdit(uc.id)} style={{ background: '#10B981', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: managingBranch ? 0.7 : 1 }}>Save</button>
                        <button disabled={managingBranch} onClick={() => setEditingBranchId(null)} style={{ background: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'white', fontWeight: 600 }}>{uc.name} {clinic?.id === uc.id ? <span style={{ fontSize: '0.75rem', color: '#10B981', marginLeft: 8 }}>(Active)</span> : ''}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingBranchId(uc.id); setEditingBranchName(uc.name); }} style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '0.9rem' }}>Edit</button>
                        {userClinics.length > 1 && (
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
                    const res = await fetch('/api/clinics/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ clinicName: newBranchName, email: clinic.email, phone: clinic.phone })
                    })
                    const data = await res.json()
                    if (data.success) {
                      const updatedClinics = [...userClinics, data.clinic]
                      setUserClinics(updatedClinics)
                      localStorage.setItem('tokenpe_user_clinics', JSON.stringify(updatedClinics))
                      setAddingBranch(false)
                      // Smooth switch to new branch — no reload
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

      {/* ── Toasts ── */}
      <div style={s.toastContainer}>
        {toasts.map(t => (
          <div 
            key={t.id} 
            style={{ 
              ...s.toast, 
              background: TOAST_TYPES[t.type]?.bg || '#064E3B',
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

      {/* ── New Patient Banner ── */}
      {newPatientAlert && (
        <div style={{ ...s.banner, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={s.bannerDot} />
            <span><PlusCircle className="inline-block w-4 h-4" /> New patient joined!&nbsp;</span>
            <strong>{newPatientAlert.name || maskPhone(newPatientAlert.phone)} — {newPatientAlert.token}</strong>
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
            ×
          </button>
        </div>
      )}

      {/* ── QR Modal ── */}
      {showQR && <QRModal clinic={clinic} onClose={() => setShowQR(false)} onCodeUpdate={handleCodeUpdate} router={router} />}

      {/* ── Discovery Profile Modal ── */}
      {showDiscovery && (
        <DiscoveryProfileModal 
          clinic={clinic} 
          onClose={() => setShowDiscovery(false)}
          onSuccess={(updates) => {
            const updatedClinic = { ...clinic, ...updates }
            setClinic(updatedClinic)
            localStorage.setItem('tokenpe_clinic', JSON.stringify(updatedClinic))
            localStorage.setItem('clinicPhone', updatedClinic.phone)
            addToast('Profile completed! You are now visible to patients.', 'done')
          }}
        />
      )}

      {/* ── Trial Warning Banner ── */}
      {showTrialWarning && (
        <div style={{ background: daysLeft <= 3 ? '#DC2626' : 'rgba(6,95,70,0.15)', color: daysLeft <= 3 ? 'white' : '#5EEAD4', padding: '10px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, zIndex: 60, position: 'relative', borderBottom: daysLeft <= 3 ? 'none' : '1px solid rgba(6,95,70,0.3)' }}>
          {daysLeft <= 3 ? <><AlertTriangle className="inline-block w-4 h-4" /> Your</> : <><Sparkles className="inline-block w-4 h-4" /> You are on the</>} Elite Free Trial. Ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'} on {trialEnd?.toLocaleDateString('en-IN')}. <button onClick={() => router.push('/dashboard/billing')} style={{ background: daysLeft <= 3 ? 'white' : 'rgba(6,95,70,0.2)', color: daysLeft <= 3 ? '#DC2626' : '#fff', border: daysLeft <= 3 ? 'none' : '1px solid rgba(6,95,70,0.4)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, marginLeft: '10px', cursor: 'pointer' }}>Choose a Plan</button>
        </div>
      )}

      {/* ── Closed Today Banner ── */}
      {isClosedToday && (
        <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, zIndex: 60, position: 'relative', borderBottom: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', letterSpacing: '0.2px' }}>
          <span>🔴 Clinic is Closed for Today — No new patients will be accepted.</span>
          <button
            onClick={reopenClinic}
            className="reopen-banner-btn"
          >
            <span style={{ fontSize: '15px' }}><Sparkles className="inline-block w-4 h-4" /></span> Re-open Now
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="dash-header">
        <div className="header-top-row">
          <div style={{ ...s.headerLeft, flex: 1, minWidth: 0 }}>
            <img src="/logo.svg" alt="TokenPe" style={{ height: '36px', width: 'auto', flexShrink: 0 }} />
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '14px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Clinic Console</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clinic?.name}</div>
            </div>
          </div>

          {/* Mobile Right (only Hamburger) */}
          <div className="header-mobile-right">
            <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="header-mid-row">
          <div className="stat-chip">
            <div className="stat-top">
              <div style={{ ...s.chipDot, background: 'linear-gradient(135deg,#f97316,#fb923c)', boxShadow: '0 0 8px rgba(249,115,22,0.6)' }} />
              <span className="stat-num">{waiting.length}</span>
            </div>
            <span className="stat-label">Waiting</span>
          </div>
          <div className="stat-chip">
            <div className="stat-top">
              <div style={{ ...s.chipDot, background: 'linear-gradient(135deg,#10b981,#34d399)', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
              <span className="stat-num">{called.length}</span>
            </div>
            <span className="stat-label">With Doctor</span>
          </div>
          <div className="stat-chip">
            <div className="stat-top">
              <div style={{ ...s.chipDot, background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 0 8px rgba(99,102,241,0.6)' }} />
              <span className="stat-num">{done.length}</span>
            </div>
            <span className="stat-label">Done</span>
          </div>
        </div>

        <div className="header-bottom-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HeaderClock />
            <div className="mobile-only-live"><div style={s.liveBadge}><span style={s.liveDot} />LIVE</div></div>
          </div>
          <div className="desktop-only-logout">
            <div style={s.liveBadge}><span style={s.liveDot} />LIVE</div>
            <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

      </header>

      {/* ── Action Bar ── */}
      <div className="action-bar-responsive" style={s.actionBar}>
        <button style={s.btnQR} onClick={() => setShowQR(true)}><QrCode className="inline-block w-4 h-4 mr-1 mb-0.5" /> Generate QR</button>
        <button
          style={{ ...s.btnGhost, color: clinic?.queue_paused ? '#EF4444' : '#10B981', borderColor: clinic?.queue_paused ? '#FECACA' : '#A7F3D0', fontWeight: 700 }}
          onClick={togglePause}
        >
          {clinic?.queue_paused ? <><Pause className="inline-block w-4 h-4 mr-1 mb-0.5" /> Paused</> : <><Play className="inline-block w-4 h-4 mr-1 mb-0.5" /> Active</>}
        </button>
        <button
          style={{ ...s.btnAdd, opacity: isLimitReached || clinic?.queue_paused ? 0.5 : 1, cursor: isLimitReached || clinic?.queue_paused ? 'not-allowed' : 'pointer' }}
          onClick={() => {
            if (clinic?.queue_paused) {
              addToast('Queue is currently paused. Please unpause to add walk-ins.', 'error')
              return
            }
            if (isLimitReached) {
              addToast(`Daily limit of ${limit} reached. Upgrade to add more!`, 'error')
              return
            }
            setShowAddForm(!showAddForm)
          }}
        >
          {clinic?.queue_paused ? <><Pause className="inline-block w-4 h-4 mr-1 mb-0.5" /> Queue Paused</> : isLimitReached ? <><Lock className="inline-block w-4 h-4 mr-1 mb-0.5" /> Limit (${limit})</> : <><PlusCircle className="inline-block w-4 h-4 mr-1 mb-0.5" /> Walk-in</>}
        </button>
        <div className="flex-1 max-w-[200px]">
          <CallNextButton 
            onCall={callNext} 
            disabled={waiting.length === 0} 
            nextToken={waiting[0]?.token} 
          />
        </div>
        <div className="qr-hint-mobile" style={s.qrHint}><Smartphone className="inline-block w-4 h-4" /> Patients scan QR → WhatsApp → Auto joins queue</div>
      </div>

      {/* ── Add Walk-in Form ── */}
      {showAddForm && (
        <div style={s.addForm}>
          <div style={s.addFormTitle}><Plus className="inline-block w-4 h-4" /> Add Walk-in Patient</div>
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
          <List className="inline-block w-4 h-4 mr-1 mb-0.5" /> Active Queue ({activePatients.length})
        </button>
        <button style={{ ...s.tab, ...(activeTab === 'done' ? s.tabActive : {}) }} onClick={() => setActiveTab('done')}>
          <CheckCircle2 className="inline-block w-4 h-4 mr-1 mb-0.5" /> Completed ({done.length})
        </button>
        <button style={{ ...s.tab, ...(activeTab === 'payments' ? s.tabActive : {}) }} onClick={() => setActiveTab('payments')}>
          <CreditCard className="inline-block w-4 h-4 mr-1 mb-0.5" /> Payments
        </button>
      </div>

      {/* ── Patient List ── */}
      <div style={s.list}>
        {activeTab !== 'history' && activeTab !== 'payments' && displayPatients.length === 0 && (
          <div style={s.empty}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{activeTab === 'active' ? <Sparkles className="w-12 h-12 text-[#065F46]" /> : <CheckCircle className="w-12 h-12 text-[#94A3B8]" />}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065F46' }}>
              {activeTab === 'active' ? 'Queue is clear!' : 'No completed patients yet'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 6 }}>
              {activeTab === 'active' ? 'Add a walk-in or wait for WhatsApp joins' : ''}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ marginBottom: 16, background: 'white', padding: '16px 20px', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            {/* Row 1: Date picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#064E3B', whiteSpace: 'nowrap' }}>📅 Date:</label>
              <input
                type="date"
                value={historyDate}
                max={new Date().toISOString().split('T')[0]}
                min={
                  clinic?.plan_id === 'starter'
                    ? (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] })()
                    : clinic?.plan_id === 'pro'
                      ? (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] })()
                      : (() => { const d = new Date(); d.setDate(d.getDate() - 365); return d.toISOString().split('T')[0] })()
                }
                onChange={e => setHistoryDate(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', background: '#F8FAFC', color: '#065F46', fontWeight: 500 }}
              />
            </div>
            {/* Row 2: Search + Filter */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#94A3B8' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search name, phone, token..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', background: '#F8FAFC', color: '#065F46', fontWeight: 500, boxSizing: 'border-box' }}
                />
              </div>
              <select
                value={historyFilter}
                onChange={e => setHistoryFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', background: '#F8FAFC', color: '#065F46', fontWeight: 600, cursor: 'pointer', minWidth: 100 }}
              >
                <option value="all">All</option>
                <option value="done"><CheckCircle2 className="inline-block w-4 h-4" /> Done</option>
                <option value="waiting">🟡 Waiting</option>
                <option value="called">🟢 Called</option>
                <option value="skipped"><SkipForward className="inline-block w-4 h-4" /> Skipped</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'history' && loadingHistory && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b', fontWeight: 600 }}>Loading history...</div>
        )}

        {activeTab === 'history' && !loadingHistory && historyPatients.length === 0 && (
          <div style={s.empty}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <History className="w-12 h-12 text-[#94A3B8]" />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065F46' }}>No records found</div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 6 }}>Try selecting a different date</div>
          </div>
        )}

        {activeTab === 'history' && !loadingHistory && (() => {
          const q = historySearch.toLowerCase().trim()
          const filtered = historyPatients.filter(p => {
            const matchesFilter = historyFilter === 'all' || p.status === historyFilter
            const matchesSearch = !q ||
              (p.name || '').toLowerCase().includes(q) ||
              (p.phone || '').includes(q) ||
              (p.token || '').toLowerCase().includes(q)
            return matchesFilter && matchesSearch
          })
          if (filtered.length === 0 && historyPatients.length > 0) {
            return (
              <div style={{ textAlign: 'center', padding: '40px 24px', color: '#94A3B8' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Search className="w-10 h-10 text-[#94A3B8]" /></div>
                <div style={{ fontWeight: 600, color: '#64748B' }}>No matching patients</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Try a different search or filter</div>
              </div>
            )
          }
          return filtered.map(p => (
            <PatientCard key={p.id} patient={p} position={null} />
          ))
        })()}

        {activeTab === 'active' && called.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 20px 2px', margin: '8px 0 0' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', letterSpacing: '1.5px', textTransform: 'uppercase' }}>With Doctor Now</span>
          </div>
        )}
        {activeTab === 'active' && called.map(p => (
          <PatientCard key={p.id} patient={p} position={null}
            onDone={() => markDone(p)} onSkip={() => skipPatient(p)} onNotify={() => notifyPatient(p)}
          />
        ))}

        {activeTab === 'active' && waiting.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 20px 2px', margin: '16px 0 0' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F97316', boxShadow: '0 0 0 3px rgba(249,115,22,0.2)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F97316', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Waiting — {waiting.length} patient{waiting.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {activeTab === 'active' && waiting.map((p, idx) => (
          <PatientCard key={p.id} patient={p} position={idx + 1}
            onDone={() => markDone(p)} onSkip={() => skipPatient(p)} onNotify={() => notifyPatient(p)}
            onPriorityCall={() => priorityCall(p)}
          />
        ))}

        {activeTab === 'done' && done.map(p => (
          <PatientCard key={p.id} patient={p} position={null} />
        ))}

        {activeTab === 'payments' && (
          <PaymentsView
            patients={patients}
            onUpdatePayment={onUpdatePayment}
            addToast={addToast}
          />
        )}
      </div>

      {/* ── UPGRADE MODAL ── */}
      {showUpgradeModal && (
        <div onClick={() => setShowUpgradeModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0a0514', width: '100%', maxWidth: 700, borderRadius: 24, padding: '32px 24px', position: 'relative', border: '1px solid rgba(6,95,70,0.3)', color: '#fff' }}>
            <button onClick={() => setShowUpgradeModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>×</button>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}><AlertTriangle className="w-16 h-16 text-[#F87171] mx-auto" /></div>
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: '#f87171' }}>Daily Limit Reached!</h2>
              <p style={{ color: '#94a3b8', fontSize: 15 }}>You have reached the maximum number of patients allowed for your current plan today. Upgrade to instantly add more patients.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
              {clinic?.plan_id === 'starter' && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px solid #065F46', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>🥈</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>Pro Plan</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>₹999 <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>/mo</span></div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', color: '#cbd5e1', fontSize: 13, lineHeight: 1.8, flex: 1 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 className="w-4 h-4 text-[#065F46]" /> Up to 150 patients/day</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 className="w-4 h-4 text-[#065F46]" /> AI Voice Alerts</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 className="w-4 h-4 text-[#065F46]" /> Queue Pause feature</li>
                  </ul>
                  <button 
                    onClick={() => handleUpgrade('pro')}
                    disabled={!!upgrading}
                    style={{ width: '100%', padding: '12px', background: '#065F46', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: !!upgrading ? 'default' : 'pointer', opacity: upgrading ? 0.5 : 1 }}
                  >
                    {upgrading === 'pro' ? <><Hourglass className="inline-block w-4 h-4" /> Opening...</> : 'Upgrade to Pro'}
                  </button>
                </div>
              )}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>🥇</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>Elite Plan</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>₹1999 <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>/mo</span></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', color: '#cbd5e1', fontSize: 13, lineHeight: 1.8, flex: 1 }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Star className="w-4 h-4 text-[#F59E0B]" /> Unlimited patients</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Star className="w-4 h-4 text-[#F59E0B]" /> WhatsApp CRM Broadcasts</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Star className="w-4 h-4 text-[#F59E0B]" /> VIP Support</li>
                </ul>
                <button 
                  onClick={() => handleUpgrade('elite')}
                  disabled={!!upgrading}
                  style={{ width: '100%', padding: '12px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 12, fontWeight: 800, cursor: !!upgrading ? 'default' : 'pointer', opacity: upgrading ? 0.5 : 1 }}
                >
                  {upgrading === 'elite' ? <><Hourglass className="inline-block w-4 h-4" /> Opening...</> : 'Upgrade to Elite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL ── */}
      {showSuccessModal && (
        <div onClick={() => setShowSuccessModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, #065F46, #1e1b4b)', width: '100%', maxWidth: 440, borderRadius: 24, padding: '40px 32px', position: 'relative', border: '1px solid rgba(6,95,70,0.3)', color: '#fff', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(6,95,70,0.3)' }}>
            <div style={{ marginBottom: 16, animation: 'bounce 1s ease infinite', display: 'flex', justifyContent: 'center' }}><Sparkles className="w-16 h-16 text-[#065F46]" /></div>
            <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12, background: 'linear-gradient(to right, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Payment Successful!</h2>
            <p style={{ color: '#cbd5e1', marginBottom: 24, fontSize: 16, lineHeight: 1.6 }}>Your clinic has been upgraded to the <strong>{showSuccessModal} Plan</strong>! You can now resume adding patients to your queue.</p>
            <button
              onClick={() => setShowSuccessModal(null)}
              style={{ width: '100%', padding: '14px', background: '#065F46', color: 'white', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(6,95,70,0.4)' }}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PATIENT CARD ──────────────────────────────────────────────────────────
function PatientCard({ patient, position, onDone, onSkip, onNotify, onPriorityCall }) {
  const isWaiting = patient.status === STATUS.WAITING
  const isCalled = patient.status === STATUS.CALLED
  const isDone = patient.status === STATUS.DONE
  const isSkipped = patient.status === STATUS.SKIPPED
  const waitMins = Math.floor((new Date() - new Date(patient.joined_at)) / 60000)
  const joinedTime = new Date(patient.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  const completedTime = patient.completed_at ? new Date(patient.completed_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : null
  
  const statusConfig = {
    waiting: { color: '#F97316', bg: '#FFF7ED', border: '#FDBA74', label: 'Waiting' },
    called:  { color: '#10B981', bg: '#F0FDF4', border: '#6EE7B7', label: 'With Doctor' },
    done:    { color: '#6366F1', bg: '#EEF2FF', border: '#A5B4FC', label: 'Done' },
    skipped: { color: '#FB7185', bg: '#FFF1F2', border: '#FECDD3', label: 'Skipped' },
  }[patient.status] || { color: '#64748b', bg: '#F8FAFC', border: '#CBD5E1', label: patient.status }

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      marginBottom: 10,
      border: `1px solid ${statusConfig.border}`,
      boxShadow: isCalled ? '0 4px 20px rgba(16,185,129,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      opacity: isDone || isSkipped ? 0.72 : 1,
    }}>
      {/* Main info row */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Left: Token + Status */}
        <div style={{
          background: statusConfig.bg,
          borderRight: `1px solid ${statusConfig.border}`,
          minWidth: 68,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 6px',
          gap: 3,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: statusConfig.color, letterSpacing: '-0.5px' }}>{patient.token}</div>
          {position && <div style={{ fontSize: '0.6rem', fontWeight: 700, color: statusConfig.color, opacity: 0.75, textTransform: 'uppercase' }}>#{position}</div>}
          <div style={{
            fontSize: '0.58rem', fontWeight: 700, color: statusConfig.color,
            background: `${statusConfig.color}18`, border: `1px solid ${statusConfig.border}`,
            borderRadius: 20, padding: '2px 6px', marginTop: 3, textAlign: 'center', letterSpacing: 0.2,
          }}>{statusConfig.label}</div>
        </div>

        {/* Right: Info */}
        <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#065F46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
              {patient.name || 'Walk-in Patient'}
            </span>
            <span style={{ fontSize: '0.63rem', fontWeight: 700, color: '#065F46', background: '#F0FDFA', border: '1px solid #DDD6FE', borderRadius: 20, padding: '1px 7px', flexShrink: 0 }}>
              {LANG_NAMES[patient.language] || 'हिंदी'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', fontSize: '0.75rem', color: '#64748B' }}>
            <span><Smartphone className="inline-block w-4 h-4" /> +91 {maskPhone(patient.phone)}</span>
            <span><Clock className="inline-block w-4 h-4" /> {joinedTime}</span>
            {isWaiting && waitMins > 0 && <span style={{ color: waitMins > 20 ? '#EF4444' : '#F97316', fontWeight: 700 }}><Hourglass className="inline-block w-4 h-4" /> {waitMins}m</span>}
            {completedTime && <span><CheckCircle2 className="inline-block w-4 h-4" /> {completedTime}</span>}
            {position && <span style={{ color: '#065F46', fontWeight: 600 }}>~{position * 7}min est.</span>}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {(isWaiting || isCalled) && (
        <div style={{
          borderTop: `1px solid ${statusConfig.border}`,
          background: statusConfig.bg,
          display: 'flex', gap: 8, padding: '10px 12px', flexWrap: 'wrap',
        }}>
          {isCalled && (
            <button onClick={onDone} style={{ flex: 1, minWidth: 90, padding: '9px 12px', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Check className="w-4 h-4" /> Done</button>
          )}
          {isWaiting && onPriorityCall && (
            <button onClick={onPriorityCall} style={{ flex: 1, minWidth: 100, padding: '9px 12px', background: 'linear-gradient(135deg,#EF4444,#DC2626)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Megaphone className="w-4 h-4" /> Call Now</button>
          )}
          {isWaiting && (
            <button onClick={onNotify} style={{ flex: 1, minWidth: 80, padding: '9px 12px', background: 'white', color: '#1D4ED8', border: '1.5px solid #BFDBFE', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}><Bell className="inline-block w-4 h-4" /> Notify</button>
          )}
          {isWaiting && (
            <button onClick={onSkip} style={{ padding: '9px 14px', background: 'white', color: '#94A3B8', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}><SkipForward className="inline-block w-4 h-4" /> Skip</button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PAYMENTS VIEW ──────────────────────────────────────────────────────────
function PaymentsView({ patients, onUpdatePayment: externalOnUpdatePayment, addToast }) {
  const [globalPatients, setGlobalPatients] = useState([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)
  const [paymentSubTab, setPaymentSubTab] = useState('pending')
  const [paymentSearch, setPaymentSearch] = useState('')
  const [editingFeeId, setEditingFeeId] = useState(null)
  const [tempFeeTotal, setTempFeeTotal] = useState('')
  const [tempFeePaid, setTempFeePaid] = useState('')
  const [remindingId, setRemindingId] = useState(null)

  async function handleSendReminder(patient) {
    const billTotal = parseFloat(patient.fee_total) || 0
    if (billTotal <= 0) {
      addToast('Please set a Total Bill greater than 0 first', 'error')
      setEditingFeeId(patient.id)
      setTempFeeTotal('500')
      setTempFeePaid('0')
      return
    }

    if (!patient.phone || patient.phone === '0000000000') {
      addToast('Cannot send reminder: invalid phone number', 'error')
      return
    }

    setRemindingId(patient.id)
    try {
      const res = await fetch('/api/queue/remind-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        addToast(`Reminder sent to ${patient.name || patient.token}`, 'done')
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
      const url = query ? `/api/dashboard/payments?search=${encodeURIComponent(query)}` : '/api/dashboard/payments'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setGlobalPatients(data.patients || [])
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingGlobal(false)
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (paymentSearch.trim().length >= 3) {
        fetchPayments(paymentSearch)
      } else if (paymentSearch.trim() === '') {
        fetchPayments()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [paymentSearch])

  const onUpdatePayment = async (id, updates) => {
    // Optimistically update local state immediately
    setGlobalPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))

    // Call the API directly — do NOT delegate to parent's onUpdatePayment
    // which is tied to today's queue state and would cause a revert error
    try {
      const res = await fetch('/api/queue/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id, updates })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'API request failed')
      }
    } catch (e) {
      console.error('[PaymentsView onUpdatePayment Error]', e)
      addToast('Failed to save payment changes. Please try again.', 'error')
      // Revert optimistic update by re-fetching global data
      fetchPayments()
    }
  }

  // Sub-tab counters
  const pendingCount = globalPatients.filter(p => p.payment_status !== 'completed').length
  const completedCount = globalPatients.filter(p => p.payment_status === 'completed').length

  // Metrics (calculated dynamically from fetched records)
  const pendingAmountCompleted = globalPatients
    .filter(p => p.payment_status !== 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.fee_paid) || 0), 0)

  const pendingRemainingBalance = globalPatients
    .filter(p => p.payment_status !== 'completed')
    .reduce((sum, p) => sum + ((parseFloat(p.fee_total) || 0) - (parseFloat(p.fee_paid) || 0)), 0)

  const completedTransactionsDone = globalPatients
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.fee_paid) || 0), 0)

  // Real-time Search & Filter
  const filtered = globalPatients.filter(p => {
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
          placeholder="Search patient by name, phone, or token..."
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
              <div style={{ ...ps.metricValue, color: '#10B981' }}>₹{pendingAmountCompleted.toFixed(2)}</div>
            </div>
            <div style={ps.metricCard}>
              <div style={ps.metricTitle}>Pending: Remaining Balance</div>
              <div style={{ ...ps.metricValue, color: '#F43F5E' }}>₹{pendingRemainingBalance.toFixed(2)}</div>
            </div>
          </>
        ) : (
          <div style={{ ...ps.metricCard, flex: 1 }}>
            <div style={ps.metricTitle}>Total Transactions Done</div>
            <div style={{ ...ps.metricValue, color: '#10B981' }}>₹{completedTransactionsDone.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* ── Payments List ── */}
      <div style={ps.list}>
        {loadingGlobal ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b', fontWeight: 600 }}>Loading ledger...</div>
        ) : filtered.length === 0 ? (
          <div style={ps.emptyState}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>
              {paymentSubTab === 'pending' ? <Sparkles className="w-10 h-10 text-[#065F46] mx-auto" /> : <CheckCircle className="w-10 h-10 text-[#065F46] mx-auto" />}
            </div>
            <div style={{ fontWeight: 700, color: '#064E3B' }}>
              {paymentSubTab === 'pending' ? 'No pending payments!' : 'No completed receipts yet.'}
            </div>
            {paymentSearch && <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 4 }}>Try clearing your search query.</div>}
          </div>
        ) : (
          filtered.map(p => {
            const isEditing = editingFeeId === p.id
            const feeTotal = parseFloat(p.fee_total) || 0
            const feePaid = parseFloat(p.fee_paid) || 0
            const remaining = feeTotal - feePaid

            return (
              <div key={p.id} className="payment-card" style={ps.card}>
                <div style={{ ...ps.token, color: paymentSubTab === 'pending' ? '#F43F5E' : '#10B981' }}>
                  {p.token}
                </div>
                
                <div style={ps.cardInfo}>
                  <div style={ps.patientName}>
                    {p.name || 'Walk-in Patient'}
                    <span style={ps.langBadge}>{LANG_NAMES[p.language] || 'हिंदी'}</span>
                  </div>
                  <div style={ps.patientMeta}>
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
                        Paid: <strong style={{ color: '#10B981' }}>₹{feePaid}</strong>
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
                        {remindingId === p.id ? 'Sending...' : <><Bell className="inline-block w-4 h-4" /> Remind Patient</>}
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
    background: 'white',
    borderRadius: 14,
    padding: '2px 4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    border: '1px solid #E2E8F0',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1rem',
    color: '#94A3B8',
  },
  searchInput: {
    width: '100%',
    padding: '14px 14px 14px 44px',
    borderRadius: 12,
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    outline: 'none',
    color: '#064E3B',
    boxSizing: 'border-box',
  },
  subTabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: 8,
  },
  subTab: {
    padding: '10px 18px',
    border: 'none',
    background: 'transparent',
    color: '#64748B',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    borderRadius: 10,
    transition: 'all 0.2s',
  },
  subTabActivePending: {
    background: '#FFF1F2',
    color: '#E11D48',
  },
  subTabActiveCompleted: {
    background: '#ECFDF5',
    color: '#059669',
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
    background: 'white',
    borderRadius: 16,
    padding: '16px 20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
    border: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  metricTitle: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#94A3B8',
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
    background: 'white',
    borderRadius: 20,
    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
    border: '1px solid #F1F5F9',
  },
  card: {
    background: 'white',
    borderRadius: 16,
    padding: '16px 20px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    border: '1px solid #F1F5F9',
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
  patientName: {
    fontWeight: 700,
    color: '#065F46',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  langBadge: {
    background: '#F0FDFA',
    color: '#065F46',
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: '0.68rem',
    fontWeight: 700,
    border: '1px solid #DDD6FE',
  },
  patientMeta: {
    fontSize: '0.75rem',
    color: '#94A3B8',
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
    color: '#475569',
  },
  btnEdit: {
    background: '#F1F5F9',
    color: '#475569',
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
    background: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    border: '1px solid #E2E8F0',
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
    color: '#64748B',
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
    color: '#065F46',
  },
  editActions: {
    display: 'flex',
    gap: 6,
  },
  btnSave: {
    background: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnCancel: {
    background: '#64748B',
    color: 'white',
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
    background: 'linear-gradient(135deg, #10B981, #059669)',
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
    background: 'linear-gradient(135deg, #065F46, #4F46E5)',
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
    color: '#047857',
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
  root: { fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif", background: '#F1F5F9', minHeight: '100vh', width: '100%', maxWidth: 'none', margin: '0 auto' },
  loadingScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F1F5F9' },
  spinner: { width: 40, height: 40, border: '3px solid #E2E8F0', borderTop: '3px solid #065F46', borderRadius: '50%' },
  toastContainer: { position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 },
  toast: { padding: '12px 18px', borderRadius: 12, color: 'white', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', minWidth: 260 },
  banner: { background: 'linear-gradient(90deg,#065F4615,#06B6D415)', color: '#4F46E5', borderBottom: '1px solid #5EEAD450', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 600 },
  bannerDot: { width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.7)', flexShrink: 0 },
  header: { background: 'linear-gradient(135deg,#065F46 0%,#064E3B 50%,#09524f 100%)', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 32px rgba(6,95,70,0.3)', position: 'sticky', top: 0, zIndex: 50 },
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
  btnBilling: { background: 'rgba(6,95,70,0.2)', color: '#5EEAD4', border: '1px solid rgba(6,95,70,0.4)', padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  btnLogout: { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  actionBar: { background: 'white', padding: '12px 24px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', boxShadow: '0 1px 0 #E2E8F0' },
  btnQR: { background: '#065F46', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },
  btnAdd: { background: '#F0FDFA', color: '#065F46', border: '1px solid #DDD6FE', padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  btnCall: { background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' },
  btnGhost: { background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', padding: '10px 16px', borderRadius: 10, fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' },
  btnDone: { background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', color: '#065F46', border: '1px solid #A7F3D0', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  btnNotify: { background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', color: '#92400E', border: '1px solid #FDE68A', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  btnSkip: { background: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', color: '#9F1239', border: '1px solid #FECDD3', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  btnPriority: { background: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', color: '#DC2626', border: '1px solid #FCA5A5', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  qrHint: { marginLeft: 'auto', color: '#CBD5E1', fontSize: '0.75rem', fontStyle: 'italic' },
  addForm: { background: 'linear-gradient(135deg,#F0FDFA,#EFF6FF)', borderBottom: '1px solid #DDD6FE', padding: '16px 24px' },
  addFormTitle: { fontWeight: 700, color: '#064E3B', marginBottom: 12, fontSize: '0.88rem' },
  addFormRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '10px 14px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: '0.88rem', flex: 1, minWidth: 160, outline: 'none', background: 'white', color: '#065F46' },
  select: { padding: '10px 14px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: '0.88rem', background: 'white', cursor: 'pointer', color: '#065F46' },
  tabs: { display: 'flex', padding: '0 24px', background: 'white', borderBottom: '1px solid #F1F5F9', gap: 4 },
  tab: { padding: '15px 22px', border: 'none', background: 'transparent', color: '#94A3B8', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', borderBottom: '2px solid transparent', transition: 'color .15s' },
  tabActive: { color: '#065F46', borderBottom: '2px solid #065F46' },
  list: { padding: '12px 16px 80px' },
  sectionLabel: { padding: '16px 8px 8px', fontSize: '0.68rem', fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '1.2px', display: 'flex', alignItems: 'center', gap: 6 },
  card: { background: 'white', borderRadius: 16, padding: '18px 20px', marginBottom: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', transition: 'box-shadow .2s,transform .15s' },
  token: { fontWeight: 900, fontSize: '1.1rem', minWidth: 56, textAlign: 'center', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' },
  cardInfo: { flex: 1, minWidth: 0 },
  patientName: { fontWeight: 700, color: '#065F46', fontSize: '0.93rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  langBadge: { background: '#F0FDFA', color: '#065F46', padding: '2px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, border: '1px solid #DDD6FE' },
  patientMeta: { fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 },
  estWait: { fontSize: '0.72rem', color: '#64748B', marginTop: 3, fontWeight: 600 },
  cardActions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 },
  doneTag: { color: '#059669', fontWeight: 700, fontSize: '0.78rem', background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', padding: '5px 14px', borderRadius: 20, border: '1px solid #A7F3D0' },
  skipTag: { color: '#BE123C', fontWeight: 700, fontSize: '0.78rem', background: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', padding: '5px 14px', borderRadius: 20, border: '1px solid #FECDD3' },
  empty: { textAlign: 'center', padding: '80px 24px' },
}
