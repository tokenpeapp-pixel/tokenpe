'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function CRMPage() {
  const router = useRouter()
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [totalPatients, setTotalPatients] = useState(0)
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

  // Smart Follow-ups Config (Frontend Demo)
  const [followupRecall, setFollowupRecall] = useState(false)
  const [followupMeds, setFollowupMeds] = useState(false)
  const [savingFollowups, setSavingFollowups] = useState(false)

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) { router.push('/login'); return }

      const c = JSON.parse(stored)
      
      // Fetch fresh clinic to get welcome_message
      const { data: freshClinic } = await supabase.from('clinics').select('*').eq('id', c.id).single()
      const finalClinic = freshClinic || c
      
      setClinic(finalClinic)
      setWelcomeMsg(finalClinic.welcome_message || '')
      setFollowupRecall(finalClinic.smart_recall_enabled || false)
      setFollowupMeds(finalClinic.smart_meds_enabled || false)

      if (finalClinic.plan_id !== 'elite' && finalClinic.subscription_status !== 'trialing') {
        setLoading(false)
        return
      }

      // Fetch total unique patient phones
      const { data } = await supabase
        .from('patients')
        .select('phone, rating, feedback_text, name, date')
        .eq('clinic_id', finalClinic.id)
      
      if (data) {
        const uniquePhones = new Set(data.map(p => p.phone))
        setTotalPatients(uniquePhones.size)
        
        const rated = data.filter(p => p.rating > 0)
        if (rated.length > 0) {
          const sum = rated.reduce((acc, p) => acc + p.rating, 0)
          setAvgRating((sum / rated.length).toFixed(1))
          
          const feedbacks = rated.filter(p => p.feedback_text).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
          setRecentFeedbacks(feedbacks)
        }
      }
      
      setLoading(false)
    }
    load()
  }, [router])

  async function saveWelcomeMessage() {
    setSavingWelcome(true)
    setWelcomeSuccess(false)
    try {
      const res = await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, welcomeMessage: welcomeMsg })
      })
      if (res.ok) {
        setWelcomeSuccess(true)
        setTimeout(() => setWelcomeSuccess(false), 3000)
        // update local storage
        const updated = { ...clinic, welcome_message: welcomeMsg }
        setClinic(updated)
        localStorage.setItem('tokenpe_clinic', JSON.stringify(updated))
      }
    } catch (err) {
      alert('Error saving welcome message')
    }
    setSavingWelcome(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const fileName = `broadcasts/${clinic.id}_${Date.now()}.png`
      const { data, error } = await supabase.storage.from('voice-notes').upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('voice-notes').getPublicUrl(fileName)
      setBroadcastImage(publicUrl)
    } catch(err) {
      alert('Error uploading image: ' + err.message)
    }
    setUploadingImage(false)
  }

  async function sendBroadcast() {
    if (!broadcastMsg.trim() && !broadcastImage) return alert('Please enter a message or upload an image.')
    if (!confirm(`Are you sure you want to send this broadcast to ${totalPatients} patients?`)) return

    setSendingBroadcast(true)
    setBroadcastSuccess(false)
    
    try {
      const res = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, message: broadcastMsg || ' ', imageUrl: broadcastImage })
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
      alert('Error sending broadcast')
    }
    setSendingBroadcast(false)
  }

  async function saveFollowupConfig(field, value) {
    setSavingFollowups(true)
    try {
      const updates = field === 'recall' ? { smart_recall_enabled: value } : { smart_meds_enabled: value }
      await supabase.from('clinics').update(updates).eq('id', clinic.id)
      
      if (field === 'recall') setFollowupRecall(value)
      if (field === 'meds') setFollowupMeds(value)
      
      const stored = localStorage.getItem('tokenpe_clinic')
      if (stored) {
        localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), ...updates }))
      }
    } catch (err) {
      console.error(err)
    }
    setSavingFollowups(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
      <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (clinic?.plan_id !== 'elite' && clinic?.subscription_status !== 'trialing') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: 'white', fontFamily: "'Inter',sans-serif", padding: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: 20 }}>🥇</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 10 }}>Elite Feature</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
            Patient CRM and Broadcasts are strictly available to Elite plan members. Upgrade to engage your patients!
          </p>
          <button onClick={() => router.push('/dashboard/billing')} style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', width: '100%' }}>
            Upgrade to Elite
          </button>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', color: '#94A3B8', border: 'none', padding: '12px 24px', marginTop: 10, fontWeight: 600, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif", color: '#0F172A' }}>
      <div style={{ background: '#0F172A', color: 'white', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ←
          </button>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Patient CRM</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{clinic.name}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>CRM & Broadcasts</h1>
          <p style={{ color: '#64748B' }}>Engage with your patients and customize your clinic's automated messaging.</p>
        </div>

        <div style={{ display: 'grid', gap: 32 }}>
          {/* Personalized Welcome Message */}
          <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Personalized Welcome Message</h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: 20 }}>This message will be appended to the standard TokenPe WhatsApp reply when a patient joins your queue.</p>
            
            <textarea
              value={welcomeMsg}
              onChange={e => setWelcomeMsg(e.target.value)}
              placeholder="e.g. Welcome to City Hospital! Please wait in the AC lounge. Free Wi-Fi password is: city123"
              style={{ width: '100%', minHeight: 100, padding: 16, borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: 16 }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button 
                onClick={saveWelcomeMessage}
                disabled={savingWelcome}
                style={{ background: '#7C3AED', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, cursor: savingWelcome ? 'not-allowed' : 'pointer', opacity: savingWelcome ? 0.7 : 1 }}
              >
                {savingWelcome ? 'Saving...' : 'Save Welcome Message'}
              </button>
              {welcomeSuccess && <span style={{ color: '#10B981', fontWeight: 600, fontSize: '0.9rem' }}>✅ Saved successfully!</span>}
            </div>
          </div>

          {/* Broadcasts */}
          <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>WhatsApp Broadcast</h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Send a mass update to all your past patients instantly.</p>
              </div>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '8px 16px', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem' }}>
                👥 {totalPatients} Reachable Patients
              </div>
            </div>

            <textarea
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              placeholder="e.g. Dr. Sharma's Clinic will be closed this Sunday. We are also running a free dental checkup camp next week!"
              style={{ width: '100%', minHeight: 120, padding: 16, borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: 16 }}
            />

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 16, borderRadius: 12, marginBottom: 20, fontSize: '0.85rem', color: '#92400E' }}>
              <strong>Note:</strong> Broadcasts are sent using the official TokenPe WhatsApp API. Do not use this for spam, or your clinic's broadcast privileges may be revoked.
            </div>
            
            {broadcastImage && (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                <img src={broadcastImage} alt="Broadcast Attachment" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid #E2E8F0' }} />
                <button onClick={() => setBroadcastImage('')} style={{ position: 'absolute', top: -8, right: -8, background: '#EF4444', color: 'white', width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button 
                onClick={sendBroadcast}
                disabled={sendingBroadcast || totalPatients === 0 || (!broadcastMsg && !broadcastImage)}
                style={{ background: '#10B981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, cursor: (sendingBroadcast || totalPatients === 0 || (!broadcastMsg && !broadcastImage)) ? 'not-allowed' : 'pointer', opacity: (sendingBroadcast || totalPatients === 0 || (!broadcastMsg && !broadcastImage)) ? 0.7 : 1 }}
              >
                {sendingBroadcast ? 'Sending...' : '📢 Send Broadcast'}
              </button>
              
              <label style={{ cursor: uploadingImage ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#7C3AED', fontWeight: 600, fontSize: '0.9rem', background: '#F5F3FF', padding: '10px 16px', borderRadius: 10, border: '1px dashed #C4B5FD' }}>
                {uploadingImage ? 'Uploading...' : '📸 Attach Flyer Image'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImage} />
              </label>

              {broadcastSuccess && <span style={{ color: '#10B981', fontWeight: 600, fontSize: '0.9rem' }}>✅ Broadcast queued successfully!</span>}
            </div>
          </div>

          {/* Smart Patient Follow-ups */}
          <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Smart Patient Follow-ups</h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: 20 }}>Automate your patient retention with intelligent WhatsApp reminders.</p>

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>90-Day Routine Recall 🔄</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Automatically messages patients 90 days after their visit to schedule a routine check-up.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                  <input type="checkbox" checked={followupRecall} onChange={e => saveFollowupConfig('recall', e.target.checked)} disabled={savingFollowups} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: followupRecall ? '#10B981' : '#CBD5E1', transition: '.4s', borderRadius: 24 }}></span>
                  <span style={{ position: 'absolute', content: '""', height: 18, width: 18, left: followupRecall ? 22 : 3, bottom: 3, backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Medicine Reminders 💊</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Sends a friendly "Did you start your medicines?" check-in 3 days post-visit.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                  <input type="checkbox" checked={followupMeds} onChange={e => saveFollowupConfig('meds', e.target.checked)} disabled={savingFollowups} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: followupMeds ? '#10B981' : '#CBD5E1', transition: '.4s', borderRadius: 24 }}></span>
                  <span style={{ position: 'absolute', content: '""', height: 18, width: 18, left: followupMeds ? 22 : 3, bottom: 3, backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                </label>
              </div>
            </div>
          </div>

          {/* Patient Feedback */}
          <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Patient Feedback</h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Ratings and reviews collected after consultation.</p>
              </div>
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#B45309', padding: '12px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{avgRating > 0 ? avgRating : 'N/A'}</span>
                <span style={{ fontSize: '1.2rem', color: '#F59E0B' }}>★</span>
              </div>
            </div>

            {recentFeedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: 12, border: '1.5px dashed #E2E8F0' }}>
                <p style={{ color: '#94A3B8', fontWeight: 600 }}>No text feedback received yet.</p>
                <p style={{ color: '#CBD5E1', fontSize: '0.85rem', marginTop: 4 }}>Patients receive a feedback link automatically after their visit.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {recentFeedbacks.map((fb, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{fb.name || 'Anonymous'}</span>
                      <span style={{ color: '#F59E0B', fontWeight: 800 }}>{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                    </div>
                    <p style={{ color: '#475569', fontSize: '0.9rem', fontStyle: 'italic' }}>"{fb.feedback_text}"</p>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 8, textAlign: 'right' }}>{fb.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
