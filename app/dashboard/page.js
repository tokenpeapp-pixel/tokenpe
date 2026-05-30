'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getISTDateString, getISTYesterdayDateString } from '../../lib/supabase'

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
    if (clean === clinic?.code) { setEditingCode(false); return }
    setCodeSaving(true)
    setCodeError('')
    // Check uniqueness
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
    // Update localStorage
    const stored = localStorage.getItem('tokenpe_clinic')
    if (stored) {
      try { localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), code: clean, address: addressInput })) } catch (_) { }
    }
    localStorage.setItem('clinicCode', clean)
    // Save address directly via supabase
    await supabase.from('clinics').update({ address: addressInput }).eq('id', clinic.id)
    clinic.address = addressInput

    onCodeUpdate(clean)
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
      await supabase.from('clinics').update({ logo_url: publicUrl }).eq('id', clinic.id)

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
        .card{width:320px;border:2.5px solid #7C3AED;border-radius:22px;
              padding:32px 24px;text-align:center}
        .logo{font-size:22px;font-weight:900;color:#7C3AED}
        .tag{font-size:10px;color:#94a3b8;margin-bottom:20px;letter-spacing:.5px}
        .name{font-size:17px;font-weight:800;color:#1e293b;margin-bottom:4px}
        .sub{font-size:12px;color:#64748b;margin-bottom:22px}
        img{width:220px;height:220px;border-radius:12px;border:1px solid #e2e8f0}
        hr{border:none;border-top:1px solid #f1f5f9;margin:18px 0}
        .how{font-size:13px;font-weight:700;color:#1e293b}
        .steps{font-size:11px;color:#64748b;margin-top:8px;line-height:2}
        .code-box{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#f5f3ff;border:1.5px dashed #c4b5fd;border-radius:10px;padding:8px 16px;margin-top:16px}
        .code-label{font-size:10px;font-weight:700;color:#7C3AED;text-transform:uppercase;letter-spacing:0.5px}
        .code-val{font-size:15px;font-weight:800;color:#6d28d9;font-family:monospace;letter-spacing:1px}
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
        <div class="how">📱 How to join</div>
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
        <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b' }}>{clinic?.name}</div>
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
            <label style={{ display: 'inline-block', background: '#F5F3FF', color: '#7C3AED', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: uploadingLogo ? 'wait' : 'pointer', border: '1px dashed #C4B5FD' }}>
              {uploadingLogo ? 'Uploading...' : '📸 Upload Center Logo'}
              <input type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
          </div>
        )}

        <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '10px 14px', textAlign: 'left', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F4C75', marginBottom: 5 }}>📱 How patients join</div>
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.9 }}>
            1. Open WhatsApp → scan this QR<br />
            2. Tap Send — no typing needed<br />
            3. Pick language → get token + voice note 🎤
          </div>
        </div>

        {/* ── Clinic Code Section ── */}
        <div style={{ marginBottom: 14 }}>
          {/* Code badge — always visible */}
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f5f3ff', border: '1.5px dashed #c4b5fd', borderRadius: 10, padding: '8px 16px', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5 }}>Clinic Code:</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#6d28d9', fontFamily: 'monospace', letterSpacing: 2 }}>{liveCode}</span>
          </div>
          {codeSuccess && <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginBottom: 4 }}>✅ Code updated! Your new QR is ready.</div>}

          {/* Plan-gated edit section */}
          {canEditCode ? (
            editingCode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <input
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCodeError('') }}
                  maxLength={12}
                  placeholder="e.g. DRSHARMA"
                  style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#6d28d9', border: '2px solid #7C3AED', borderRadius: 9, padding: '9px 14px', width: '100%', outline: 'none', textAlign: 'center', background: '#faf5ff' }}
                />
                <input
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  maxLength={100}
                  placeholder="Clinic Address (Optional)"
                  style={{ fontSize: 13, color: '#1e293b', border: '2px solid #ede9fe', borderRadius: 9, padding: '9px 14px', width: '100%', outline: 'none', textAlign: 'center', background: '#fff' }}
                />
                {codeError && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{codeError}</div>}
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <button onClick={saveCode} disabled={codeSaving} style={{ flex: 1, padding: '9px 0', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: codeSaving ? 0.7 : 1 }}>
                    {codeSaving ? 'Saving...' : '✓ Save'}
                  </button>
                  <button onClick={() => { setEditingCode(false); setCodeInput(clinic?.code || ''); setAddressInput(clinic?.address || ''); setCodeError('') }} style={{ flex: 1, padding: '9px 0', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingCode(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#7C3AED', cursor: 'pointer', margin: '0 auto' }}>
                ✏️ Edit Code
              </button>
            )
          ) : (
            <button
              onClick={() => router.push('/dashboard/billing')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#92400e', cursor: 'pointer', margin: '0 auto', textAlign: 'center' }}
            >
              🔒 Custom Code — Upgrade to Pro
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={download} disabled={downloading} style={{ flex: 1, padding: '11px 0', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: downloading ? 0.7 : 1 }}>
            {downloaded ? '✅ Saved!' : downloading ? 'Saving...' : '⬇️ Download PNG'}
          </button>
          <button onClick={print} style={{ flex: 1, padding: '11px 0', background: 'white', color: '#7C3AED', border: '2px solid #7C3AED', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
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
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newLang, setNewLang] = useState('hi')
  const [time, setTime] = useState(new Date())
  const [showQR, setShowQR] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userClinics, setUserClinics] = useState([])
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [addingBranch, setAddingBranch] = useState(false)
  const sounds = useSounds()

  // ── Load clinic from session (multi-clinic support) ─────────────────────
  useEffect(() => {
    async function loadClinic() {
      // ── Step 1: Paint UI instantly from localStorage cache ──────────────
      let clinicCode = localStorage.getItem('clinicCode')
      const cachedClinic = localStorage.getItem('tokenpe_clinic')

      try {
        const storedUserClinics = JSON.parse(localStorage.getItem('tokenpe_user_clinics')) || []
        setUserClinics(storedUserClinics)
      } catch (e) { }

      // Show cached clinic immediately so UI is visible right away
      if (cachedClinic) {
        try {
          const parsed = JSON.parse(cachedClinic)
          setClinic(parsed) // paint UI instantly from cache
        } catch (e) { }
      }

      if (!clinicCode) {
        // Fallback: Check if user is logged in via Supabase (e.g., Google OAuth redirect)
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const { data: clinics, error: clinicError } = await supabase
            .from('clinics').select('*').eq('email', user.email).order('created_at', { ascending: true })

          if (clinics && clinics.length > 0 && !clinicError) {
            const clinicData = clinics[0]
            setUserClinics(clinics)
            localStorage.setItem('tokenpe_user_clinics', JSON.stringify(clinics))
            const finalClinic = clinicData
            localStorage.setItem('clinicCode', finalClinic.code)
            localStorage.setItem('clinicPhone', finalClinic.phone)
            localStorage.setItem('tokenpe_clinic', JSON.stringify(finalClinic))
            clinicCode = finalClinic.code
          } else {
            await supabase.auth.signOut()
            router.push('/login?error=no_clinic')
            return
          }
        } else {
          if (!cachedClinic) { router.push('/login'); return }
        }
      }

      // ── Step 2: Refresh clinic from Supabase in background ──────────────
      if (clinicCode) {
        const { data: freshClinic, error } = await supabase
          .from('clinics').select('*').eq('code', clinicCode).single()

        if (error || !freshClinic) {
          // Only redirect if we also have no cached clinic to show
          if (!cachedClinic) {
            localStorage.removeItem('clinicCode')
            localStorage.removeItem('clinicPhone')
            localStorage.removeItem('tokenpe_clinic')
            router.push('/login')
          }
          return
        }

        // Update cache + state silently in background
        localStorage.setItem('tokenpe_clinic', JSON.stringify(freshClinic))
        setClinic(freshClinic)
      }
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
            addToast(`New patient joined: ${payload.new.name || maskPhone(payload.new.phone)} — ${payload.new.token}`, 'new')
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

  // ── Code Update Callback ─────────────────────────────────────
  function handleCodeUpdate(newCode) {
    setClinic(prev => ({ ...prev, code: newCode }))
    
    // Sync the new code into the userClinics array for the branch switcher
    setUserClinics(prevClinics => {
      const updated = prevClinics.map(c => c.id === clinic.id ? { ...c, code: newCode } : c)
      localStorage.setItem('tokenpe_user_clinics', JSON.stringify(updated))
      return updated
    })

    addToast(`✅ Clinic code updated to ${newCode}! Share it with your patients.`, 'done')
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

    // Update session cookie in background (don't await — keep UI fast)
    fetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetClinicId: targetClinic.id })
    })

    // Fetch fresh patients for the new branch
    const { data: patientsData } = await supabase
      .from('patients').select('*')
      .eq('clinic_id', targetClinic.id)
      .eq('date', currentDate)
      .order('joined_at', { ascending: true })
    setPatients(patientsData || [])
    setLoading(false)
    addToast(`✅ Switched to ${targetClinic.name}`, 'done')
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

  // ── Actions ─────────────────────────────────────────────────────────────
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

  async function addWalkIn() {
    if (!newPhone.trim()) return

    if (clinic?.queue_paused) {
      addToast('Queue is currently paused. Please unpause to add patients.', 'error')
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
  const waiting = patients.filter(p => p.status === STATUS.WAITING)
  const called = patients.filter(p => p.status === STATUS.CALLED)
  const done = patients.filter(p => p.status === STATUS.DONE)
  const activePatients = [...called, ...waiting]
  const displayPatients = activeTab === 'active' ? activePatients : done

  // ── Limits ──
  const planId = clinic?.plan_id || 'starter'
  const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
  const isLimitReached = patients.length >= limit

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
            padding: 16px !important;
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
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 8px !important;
            padding: 12px 14px !important;
          }
          .action-bar-responsive button {
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

        /* DROPDOWN MENU STYLES */
        .dropdown-menu {
          position: fixed;
          top: 72px;
          right: 16px;
          background: rgba(15, 10, 42, 0.97);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(124, 58, 237, 0.35);
          border-radius: 14px;
          padding: 8px;
          width: 210px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.07) inset;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: slideDown 0.18s ease-out forwards;
          transform-origin: top right;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: scale(0.92) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .dropdown-item {
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          border: none;
          padding: 13px 16px;
          border-radius: 9px;
          text-align: left;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 11px;
          transition: background 0.12s ease, color 0.12s ease;
          width: 100%;
          font-family: inherit;
        }

        .dropdown-item:hover, .dropdown-item:active {
          background: rgba(124, 58, 237, 0.25);
          color: #fff;
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
          background: rgba(124, 58, 237, 0.3);
          border-color: rgba(124, 58, 237, 0.5);
        }

        @media (max-width: 960px) {
          .dropdown-menu {
            top: auto;
            bottom: auto;
            right: 12px;
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
                  <button key={uc.id} className="dropdown-item" style={{ padding: '8px 16px', background: uc.id === clinic?.id ? 'rgba(124,58,237,0.15)' : 'transparent', color: uc.id === clinic?.id ? '#A78BFA' : 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }} onClick={() => switchToBranch(uc)}>
                    {uc.id === clinic?.id ? '✓ ' : '○ '}{uc.name}
                  </button>
                ))}
                <div className="dropdown-divider" />
              </>
            )}

            {(clinic?.plan_id === 'elite' || clinic?.subscription_status === 'trialing') && userClinics.length < 3 && (
              <button className="dropdown-item" onClick={() => { setShowAddBranch(true); setMenuOpen(false); }} style={{ color: '#34D399', fontSize: '0.85rem' }}>
                + Add New Branch
              </button>
            )}

            <button className="dropdown-item" onClick={() => { setActiveTab('history'); setMenuOpen(false); }}>
              🕒 History
            </button>
            <button className="dropdown-item" onClick={() => { router.push('/dashboard/analytics'); setMenuOpen(false); }}>
              📊 Analytics (Elite)
            </button>
            <button className="dropdown-item" onClick={() => { router.push('/dashboard/crm'); setMenuOpen(false); }}>
              📢 CRM & Broadcasts (Elite)
            </button>
            {clinic?.plan_id === 'elite' ? (
              <button className="dropdown-item" onClick={() => { window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'}?text=Hi%20VIP%20Support!`, '_blank'); setMenuOpen(false); }} style={{ color: '#059669', fontWeight: 700 }}>
                🟢 VIP Support (Elite)
              </button>
            ) : clinic?.plan_id === 'pro' ? (
              <button className="dropdown-item" onClick={() => { window.open('mailto:tokenpe.online@gmail.com', '_blank'); setMenuOpen(false); }} style={{ color: '#A78BFA', fontWeight: 700 }}>
                ⭐ Priority Support (Pro)
              </button>
            ) : (
              <button className="dropdown-item" onClick={() => { window.open('mailto:tokenpe.online@gmail.com', '_blank'); setMenuOpen(false); }}>
                ✉️ Standard Support
              </button>
            )}
            <button className="dropdown-item" onClick={() => { router.push('/dashboard/billing'); setMenuOpen(false); }}>
              💳 Billing & Plan
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={() => { logout(); setMenuOpen(false); }} style={{ color: '#FDA4AF' }}>
              🚪 Logout
            </button>
          </div>
        </>
      )}

      {/* ── Add New Branch Modal ── */}
      {showAddBranch && (
        <div onClick={() => setShowAddBranch(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0F172A', borderRadius: 24, padding: '32px', width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.1)' }}>
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
          <strong>{newPatientAlert.name || maskPhone(newPatientAlert.phone)} — {newPatientAlert.token}</strong>
        </div>
      )}

      {/* ── QR Modal ── */}
      {showQR && <QRModal clinic={clinic} onClose={() => setShowQR(false)} onCodeUpdate={handleCodeUpdate} router={router} />}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="header-clock">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
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
        <button style={s.btnQR} onClick={() => setShowQR(true)}>🔲 Generate QR</button>
        <button
          style={{ ...s.btnGhost, color: clinic?.queue_paused ? '#EF4444' : '#10B981', borderColor: clinic?.queue_paused ? '#FECACA' : '#A7F3D0', fontWeight: 700 }}
          onClick={togglePause}
        >
          {clinic?.queue_paused ? '⏸ Paused' : '▶️ Active'}
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
          {clinic?.queue_paused ? '⏸ Queue Paused' : isLimitReached ? `🔒 Limit (${limit})` : '+ Walk-in'}
        </button>
        <button
          style={{ ...s.btnCall, opacity: waiting.length === 0 ? 0.4 : 1 }}
          onClick={callNext}
          disabled={waiting.length === 0}
        >
          📢 Call Next {waiting.length > 0 ? `(${waiting[0]?.token})` : ''}
        </button>
        <div className="qr-hint-mobile" style={s.qrHint}>📱 Patients scan QR → WhatsApp → Auto joins queue</div>
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
          <div style={{ marginBottom: 16, background: 'white', padding: '16px 20px', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            {/* Row 1: Date picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>📅 Date:</label>
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
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', background: '#F8FAFC', color: '#0F172A', fontWeight: 500 }}
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
                  style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', background: '#F8FAFC', color: '#0F172A', fontWeight: 500, boxSizing: 'border-box' }}
                />
              </div>
              <select
                value={historyFilter}
                onChange={e => setHistoryFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', background: '#F8FAFC', color: '#0F172A', fontWeight: 600, cursor: 'pointer', minWidth: 100 }}
              >
                <option value="all">All</option>
                <option value="done">✅ Done</option>
                <option value="waiting">🟡 Waiting</option>
                <option value="called">🟢 Called</option>
                <option value="skipped">⏭ Skipped</option>
              </select>
            </div>
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
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                <div style={{ fontWeight: 600, color: '#64748B' }}>No matching patients</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Try a different search or filter</div>
              </div>
            )
          }
          return filtered.map(p => (
            <PatientCard key={p.id} patient={p} position={null} />
          ))
        })()}

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
  const joinedTime = new Date(patient.joined_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  const completedTime = patient.completed_at ? new Date(patient.completed_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : null
  const statusColor = { waiting: '#F97316', called: '#10B981', done: '#38BDF8', skipped: '#FB7185' }[patient.status]

  return (
    <div className="patient-card" style={{ ...s.card, borderLeft: `4px solid ${statusColor}`, opacity: isDone || isSkipped ? 0.75 : 1 }}>
      <div style={{ ...s.token, color: statusColor }}>{patient.token}</div>
      <div style={s.cardInfo}>
        <div style={s.patientName}>
          {patient.name || 'Walk-in Patient'}
          <span style={s.langBadge}>{LANG_NAMES[patient.language] || 'हिंदी'}</span>
        </div>
        <div style={s.patientMeta}>
          📱 +91 {maskPhone(patient.phone)} &nbsp;·&nbsp;
          🕒 {joinedTime} {isWaiting && `(⏳ ${waitMins}m)`}
          {completedTime && ` → ✅ ${completedTime}`} &nbsp;·&nbsp;
          {position ? `#${position} in line` : patient.status.toUpperCase()}
        </div>
        {position && <div style={s.estWait}>Est. wait: ~{position * 7} mins</div>}
      </div>
      <div className="patient-card-actions" style={s.cardActions}>
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
  btnBilling: { background: 'rgba(124,58,237,0.2)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.4)', padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
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
  card: { background: 'white', borderRadius: 16, padding: '18px 20px', marginBottom: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', transition: 'box-shadow .2s,transform .15s' },
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