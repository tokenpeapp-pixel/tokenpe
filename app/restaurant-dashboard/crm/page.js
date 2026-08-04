'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../lovable.css'
import { Trophy, Building, CheckCircle2, Users, Megaphone, Camera, Rocket, RefreshCw, Pill, Star, ArrowLeft, Lock } from 'lucide-react'

export default function CRMPage() {
  const router = useRouter()
  const [clinic, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [totalGuests, setTotalGuests] = useState(0)
  const [medsReachable, setMedsReachable] = useState(0)
  const [recallReachable, setRecallReachable] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [recentFeedbacks, setRecentFeedbacks] = useState([])
  
  const [welcomeMsg, setWelcomeMsg] = useState('')
  const [savingWelcome, setSavingWelcome] = useState(false)
  const [welcomeSuccess, setWelcomeSuccess] = useState(false)

  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastImage, setBroadcastImage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState(false)

  // Smart Follow-ups Config
  const [followupRecall, setFollowupRecall] = useState(false)
  const [followupMeds, setFollowupMeds] = useState(false)
  const [savingFollowups, setSavingFollowups] = useState(false)
  const [userRestaurants, setUserRestaurants] = useState([])

  async function loadCRMStats(clinicObj) {
    if (clinicObj.plan_id !== 'elite' && clinicObj.plan_id !== 'pro' && clinicObj.subscription_status !== 'trialing') {
      return
    }
    try {
      const statsRes = await fetch(`/api/crm/stats?clinicId=${clinicObj.id}`)
      const stats = await statsRes.json()
      if (stats.success) {
        setTotalGuests(stats.totalGuests || 0)
        setMedsReachable(stats.medsReachable || 0)
        setRecallReachable(stats.recallReachable || 0)
        setAvgRating(stats.avgRating || 0)
        setRecentFeedbacks(stats.recentFeedbacks || [])
      }
    } catch (err) {
      console.error('Failed to fetch CRM stats:', err)
    }
  }

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_business')
      if (!stored) { router.push('/restaurant-login'); return }

      const c = JSON.parse(stored)
      
      let freshRestaurant = null
      try {
        const res = await fetch(`/api/business/get?id=${c.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) freshRestaurant = data.clinic
        }
      } catch (e) {}
      
      const finalRestaurant = freshRestaurant || c
      
      setRestaurant(finalRestaurant)
      setWelcomeMsg(finalRestaurant.welcome_message || '')
      setFollowupRecall(finalRestaurant.smart_recall_enabled || false)
      setFollowupMeds(finalRestaurant.smart_meds_enabled || false)

      try {
        const storedRestaurants = localStorage.getItem('tokenpe_user_businesses')
        if (storedRestaurants) setUserRestaurants(JSON.parse(storedRestaurants))
      } catch (e) { }

      await loadCRMStats(finalRestaurant)
      
      setLoading(false)
    }
    load()
  }, [router])

  async function handleBranchChange(e) {
    const selectedId = e.target.value
    const selected = userRestaurants.find(c => c.id === selectedId)
    if (!selected) return
    setLoading(true)
    
    let freshRestaurant = null
    try {
      const res = await fetch(`/api/business/get?id=${selected.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) freshRestaurant = data.clinic
      }
    } catch (e) {}

    const finalRestaurant = freshRestaurant || selected
    setRestaurant(finalRestaurant)
    setWelcomeMsg(finalRestaurant.welcome_message || '')
    setFollowupRecall(finalRestaurant.smart_recall_enabled || false)
    setFollowupMeds(finalRestaurant.smart_meds_enabled || false)
    await loadCRMStats(finalRestaurant)
    setLoading(false)
  }

  async function saveWelcomeMessage() {
    setSavingWelcome(true)
    setWelcomeSuccess(false)
    try {
      const res = await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, welcomeMessage: welcomeMsg })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setWelcomeSuccess(true)
        setTimeout(() => setWelcomeSuccess(false), 3000)
        const updated = { ...clinic, welcome_message: welcomeMsg }
        setRestaurant(updated)
        localStorage.setItem('tokenpe_business', JSON.stringify(updated))
      }
    } catch (err) {
      console.error(err)
      alert('Error saving welcome message')
    }
    setSavingWelcome(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      return alert('Image size must be less than 5MB')
    }

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${clinic.id}_${Date.now()}.${fileExt}`
      const filePath = `broadcasts/${fileName}`

      const { data, error } = await supabase.storage
        .from('public_assets')
        .upload(filePath, file, { upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('public_assets')
        .getPublicUrl(filePath)

      setBroadcastImage(publicUrl)
    } catch (err) {
      console.error('Image upload failed:', err)
      alert('Failed to upload image. Please try again.')
    }
    setUploadingImage(false)
  }

  async function sendBroadcast() {
    if (!broadcastMsg.trim() && !broadcastImage) {
      return alert('Please enter a broadcast message or attach a flyer image.')
    }

    if (!confirm(`Are you sure you want to send this broadcast to ${totalGuests} guests?`)) {
      return
    }

    setSendingBroadcast(true)
    setBroadcastSuccess(false)

    try {
      const res = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic.id,
          message: broadcastMsg,
          imageUrl: broadcastImage
        })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setBroadcastSuccess(true)
        setBroadcastMsg('')
        setBroadcastImage('')
        setTimeout(() => setBroadcastSuccess(false), 5000)
      } else {
        alert(data.error || 'Failed to send broadcast')
      }
    } catch (err) {
      console.error(err)
      alert('Error sending broadcast')
    }
    setSendingBroadcast(false)
  }

  async function saveFollowupConfig(field, value) {
    setSavingFollowups(true)
    try {
      const payload = { clinicId: clinic.id }
      if (field === 'recall') payload.smartRecallEnabled = value
      if (field === 'meds') payload.smartMedsEnabled = value
      
      const res = await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, ...payload })
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        if (field === 'recall') setFollowupRecall(value)
        if (field === 'meds') setFollowupMeds(value)
        
        const updates = field === 'recall' ? { smart_recall_enabled: value } : { smart_meds_enabled: value }
        const stored = localStorage.getItem('tokenpe_business')
        if (stored) {
          localStorage.setItem('tokenpe_business', JSON.stringify({ ...JSON.parse(stored), ...updates }))
        }
      } else {
        alert(data.error || 'Failed to save follow-up configuration')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving configuration')
    }
    setSavingFollowups(false)
  }

  if (loading) return (
    <div className="lovable-root flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-[#3f1515] border-t-[#fbbf24] rounded-full animate-spin" />
    </div>
  )

  const isEliteOrTrial = clinic?.plan_id === 'elite' || clinic?.subscription_status === 'trialing'

  if (clinic?.plan_id !== 'elite' && clinic?.plan_id !== 'pro' && clinic?.subscription_status !== 'trialing') {
    return (
      <div className="lovable-root flex items-center justify-center min-h-screen">
        <div style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', padding: 32, borderRadius: 24, textAlign: 'center', maxWidth: 420, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Trophy className="w-12 h-12 text-[#fbbf24]" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>Premium CRM Features</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Guest CRM, automated WhatsApp welcome messages, and customer broadcasts are available on Pro and Elite plans. Upgrade now to start engaging your guests!
          </p>
          <button onClick={() => router.push('/restaurant-dashboard/billing')} className="lovable-btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
            Upgrade Plan
          </button>
          <button onClick={() => router.push('/restaurant-dashboard')} className="lovable-btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lovable-root">
      
      {/* ── HEADER ── */}
      <header className="lovable-header" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <button 
            onClick={() => router.push('/restaurant-dashboard')}
            className="lovable-btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          {userRestaurants.length > 1 && (
            <select
              value={clinic?.id || ''}
              onChange={handleBranchChange}
              style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', color: 'var(--foreground)', padding: '8px 14px', borderRadius: 8, fontSize: '0.8rem', outline: 'none' }}
            >
              {userRestaurants.map(uc => (
                <option key={uc.id} value={uc.id}>{uc.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="lovable-supertitle">RESTAURANT | GUEST ENGAGEMENT</div>
        <h1 className="lovable-title">
          {clinic?.name || 'Restaurant'} <span>— CRM & Broadcasts</span>
        </h1>
        <div className="lovable-subtitle">
          Customize automated WhatsApp welcome messages, broadcast mass announcements, and manage guest follow-ups.
        </div>
      </header>

      {/* ── CRM CARDS STACK ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Personalized Welcome Message */}
        <div style={{ position: 'relative', background: 'var(--wine-deep)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>
          {!isEliteOrTrial && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 5, 5, 0.8)', backdropFilter: 'blur(6px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
              <Trophy className="w-8 h-8 text-[#fbbf24] mb-2" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: 4 }}>Elite Feature</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 16 }}>Upgrade to Elite to set a personalized WhatsApp welcome message.</p>
              <button onClick={() => router.push('/restaurant-dashboard/billing')} className="lovable-btn-primary">Upgrade to Elite</button>
            </div>
          )}

          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 4 }}>Personalized Welcome Message</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 16 }}>This message will be appended to the WhatsApp confirmation reply when a guest joins your queue.</p>

          <textarea
            value={welcomeMsg}
            onChange={e => setWelcomeMsg(e.target.value)}
            placeholder="e.g. Welcome to Our Restaurant! Please wait in our lounge. Free Wi-Fi password is: RestoGuest123"
            style={{ width: '100%', minHeight: 90, padding: 14, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fef3c7', fontSize: '0.85rem', outline: 'none', resize: 'vertical', marginBottom: 16, boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={saveWelcomeMessage}
              disabled={savingWelcome}
              className="lovable-btn-primary"
              style={{ opacity: savingWelcome ? 0.7 : 1 }}
            >
              {savingWelcome ? 'Saving...' : 'Save Welcome Message'}
            </button>
            {welcomeSuccess && <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 className="w-4 h-4" /> Saved successfully!</span>}
          </div>
        </div>

        {/* WhatsApp Broadcast */}
        <div style={{ position: 'relative', background: 'var(--wine-deep)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>
          {!isEliteOrTrial && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 5, 5, 0.8)', backdropFilter: 'blur(6px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
              <Rocket className="w-8 h-8 text-[#fbbf24] mb-2" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: 4 }}>Elite Feature</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 16 }}>Upgrade to Elite to send mass WhatsApp broadcasts to your guests.</p>
              <button onClick={() => router.push('/restaurant-dashboard/billing')} className="lovable-btn-primary">Upgrade to Elite</button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 4 }}>WhatsApp Broadcast</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Send a mass message or promotional flyer to all your past guests instantly.</p>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users className="w-3.5 h-3.5" /> {totalGuests} Reachable Guests
            </div>
          </div>

          <textarea
            value={broadcastMsg}
            onChange={e => setBroadcastMsg(e.target.value)}
            placeholder="e.g. Special Weekend Offer! Get 20% off on all main courses this Saturday & Sunday. Book your table now!"
            style={{ width: '100%', minHeight: 110, padding: 14, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fef3c7', fontSize: '0.85rem', outline: 'none', resize: 'vertical', marginBottom: 16, boxSizing: 'border-box' }}
          />

          {broadcastImage && (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              <img src={broadcastImage} alt="Attachment" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />
              <button onClick={() => setBroadcastImage('')} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button 
              onClick={sendBroadcast}
              disabled={sendingBroadcast || totalGuests === 0 || (!broadcastMsg && !broadcastImage)}
              className="lovable-btn-primary"
              style={{ opacity: (sendingBroadcast || totalGuests === 0 || (!broadcastMsg && !broadcastImage)) ? 0.6 : 1 }}
            >
              {sendingBroadcast ? 'Sending...' : <><Megaphone className="w-4 h-4" /> Send Broadcast</>}
            </button>
            
            <label className="lovable-btn-outline" style={{ cursor: uploadingImage ? 'wait' : 'pointer' }}>
              {uploadingImage ? 'Uploading...' : <><Camera className="w-4 h-4 text-[#fbbf24]" /> Attach Flyer</>}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>

            {broadcastSuccess && <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 className="w-4 h-4" /> Broadcast queued!</span>}
          </div>
        </div>

        {/* Guest Feedback & Reviews */}
        <div style={{ background: 'var(--wine-deep)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 4 }}>Guest Feedback & Ratings</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Ratings and comments collected automatically from WhatsApp after dining.</p>
            </div>
            <div style={{ background: 'rgba(212, 163, 115, 0.15)', border: '1px solid rgba(212, 163, 115, 0.3)', color: 'var(--gold)', padding: '8px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Playfair Display, serif' }}>{avgRating > 0 ? avgRating : 'N/A'}</span>
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>

          {recentFeedbacks.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px border-dashed var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
              <p style={{ fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>No guest reviews received yet</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>Guests reply to automated WhatsApp feedback requests after their table is cleared.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentFeedbacks.map((fb, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{fb.name || 'Anonymous Guest'}</span>
                    <span style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      {Array.from({length: fb.crm_rating || 5}).map((_, i) => <Star key={'f'+i} className="w-3.5 h-3.5 fill-current" />)}
                    </span>
                  </div>
                  {fb.feedback_text && (
                    <p style={{ fontSize: '0.82rem', color: '#d4d4d8', fontStyle: 'italic', margin: 0 }}>"{fb.feedback_text}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
