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

  // Smart Follow-ups Config
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
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="w-10 h-10 border-4 border-white/10 border-t-[#F59E0B] rounded-full animate-spin" />
    </div>
  )

  if (clinic?.plan_id !== 'elite' && clinic?.subscription_status !== 'trialing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white p-4 font-sans">
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🥇</div>
          <h2 className="text-2xl font-black mb-3">Elite Feature</h2>
          <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
            Patient CRM and Broadcasts are strictly available to Elite plan members. Upgrade to engage your patients!
          </p>
          <button onClick={() => router.push('/dashboard/billing')} className="w-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black py-3 rounded-xl font-black mb-3 transition hover:scale-105">
            Upgrade to Elite
          </button>
          <button onClick={() => router.push('/dashboard')} className="w-full bg-transparent text-[#94A3B8] py-3 rounded-xl font-bold hover:text-white transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-20">
      <div className="bg-[#0F172A] text-white px-4 py-6 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition">
            ←
          </button>
          <div>
            <div className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Patient CRM</div>
            <div className="text-xl font-black">{clinic.name}</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">CRM & Broadcasts</h1>
          <p className="text-[#64748B] text-sm sm:text-base mt-1">Engage with your patients and customize your clinic's automated messaging.</p>
        </div>

        <div className="space-y-8">
          {/* Welcome Message */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#F1F5F9]">
            <h2 className="text-lg font-black mb-2">Personalized Welcome Message</h2>
            <p className="text-[#64748B] text-sm mb-5">This message will be appended to the standard TokenPe WhatsApp reply when a patient joins your queue.</p>
            
            <textarea
              value={welcomeMsg}
              onChange={e => setWelcomeMsg(e.target.value)}
              placeholder="e.g. Welcome to City Hospital! Please wait in the AC lounge. Free Wi-Fi password is: city123"
              className="w-full min-h-[100px] p-4 rounded-xl border-2 border-[#E2E8F0] outline-none text-sm font-medium resize-y mb-4 focus:border-[#7C3AED]"
            />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button 
                onClick={saveWelcomeMessage}
                disabled={savingWelcome}
                className={`bg-[#7C3AED] text-white px-6 py-2.5 rounded-xl font-bold transition ${savingWelcome ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#6D28D9]'}`}
              >
                {savingWelcome ? 'Saving...' : 'Save Welcome Message'}
              </button>
              {welcomeSuccess && <span className="text-[#10B981] font-bold text-sm">✅ Saved successfully!</span>}
            </div>
          </div>

          {/* Broadcasts */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#F1F5F9]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-5">
              <div>
                <h2 className="text-lg font-black mb-2">WhatsApp Broadcast</h2>
                <p className="text-[#64748B] text-sm">Send a mass update to all your past patients instantly.</p>
              </div>
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap">
                👥 {totalPatients} Reachable Patients
              </div>
            </div>

            <textarea
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              placeholder="e.g. Dr. Sharma's Clinic will be closed this Sunday. We are also running a free dental checkup camp next week!"
              className="w-full min-h-[120px] p-4 rounded-xl border-2 border-[#E2E8F0] outline-none text-sm font-medium resize-y mb-4 focus:border-[#10B981]"
            />

            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-xl mb-5 text-sm text-[#92400E]">
              <strong>Note:</strong> Broadcasts are sent using the official TokenPe WhatsApp API. Do not use this for spam, or your clinic's broadcast privileges may be revoked.
            </div>
            
            {broadcastImage && (
              <div className="relative inline-block mb-5">
                <img src={broadcastImage} alt="Broadcast Attachment" className="w-32 h-32 object-cover rounded-xl border border-[#E2E8F0]" />
                <button onClick={() => setBroadcastImage('')} className="absolute -top-2 -right-2 bg-[#EF4444] text-white w-6 h-6 rounded-full font-bold flex items-center justify-center">×</button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button 
                onClick={sendBroadcast}
                disabled={sendingBroadcast || totalPatients === 0 || (!broadcastMsg && !broadcastImage)}
                className={`bg-[#10B981] text-white px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center ${(sendingBroadcast || totalPatients === 0 || (!broadcastMsg && !broadcastImage)) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#059669]'}`}
              >
                {sendingBroadcast ? 'Sending...' : '📢 Send Broadcast'}
              </button>
              
              <label className={`flex items-center gap-2 text-[#7C3AED] font-bold text-sm bg-[#F5F3FF] px-4 py-2.5 rounded-xl border border-dashed border-[#C4B5FD] transition ${uploadingImage ? 'cursor-wait opacity-70' : 'cursor-pointer hover:bg-[#EDE9FE]'}`}>
                {uploadingImage ? 'Uploading...' : '📸 Attach Flyer'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>

              {broadcastSuccess && <span className="text-[#10B981] font-bold text-sm">✅ Broadcast queued!</span>}
            </div>
          </div>

          {/* Smart Follow-ups */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#F1F5F9]">
            <h2 className="text-lg font-black mb-2">Smart Patient Follow-ups</h2>
            <p className="text-[#64748B] text-sm mb-6">Automate your patient retention with intelligent WhatsApp reminders.</p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-1">90-Day Routine Recall 🔄</h3>
                  <p className="text-sm text-[#64748B]">Automatically messages patients 90 days after their visit to schedule a routine check-up.</p>
                </div>
                <label className="relative inline-block w-11 h-6 flex-shrink-0 cursor-pointer">
                  <input type="checkbox" checked={followupRecall} onChange={e => saveFollowupConfig('recall', e.target.checked)} disabled={savingFollowups} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-1">Medicine Reminders 💊</h3>
                  <p className="text-sm text-[#64748B]">Sends a friendly "Did you start your medicines?" check-in 3 days post-visit.</p>
                </div>
                <label className="relative inline-block w-11 h-6 flex-shrink-0 cursor-pointer">
                  <input type="checkbox" checked={followupMeds} onChange={e => saveFollowupConfig('meds', e.target.checked)} disabled={savingFollowups} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Patient Feedback */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#F1F5F9]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black mb-2">Patient Feedback</h2>
                <p className="text-[#64748B] text-sm">Ratings and reviews collected after consultation.</p>
              </div>
              <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] px-5 py-2.5 rounded-xl flex items-center gap-2">
                <span className="text-2xl font-black">{avgRating > 0 ? avgRating : 'N/A'}</span>
                <span className="text-xl text-[#F59E0B]">★</span>
              </div>
            </div>

            {recentFeedbacks.length === 0 ? (
              <div className="text-center p-8 bg-[#F8FAFC] rounded-xl border-2 border-dashed border-[#E2E8F0]">
                <p className="text-[#94A3B8] font-bold">No text feedback received yet.</p>
                <p className="text-[#CBD5E1] text-sm mt-1">Patients receive a feedback link automatically after their visit.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {recentFeedbacks.map((fb, idx) => (
                  <div key={idx} className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-[#0F172A]">{fb.name || 'Anonymous'}</span>
                      <span className="text-[#F59E0B] font-black tracking-widest">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                    </div>
                    <p className="text-[#475569] text-sm italic">"{fb.feedback_text}"</p>
                    <div className="text-xs text-[#94A3B8] mt-2 text-right">{fb.date}</div>
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
