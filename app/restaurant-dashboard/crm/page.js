'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Trophy, Building, CheckCircle2, Users, Megaphone, Camera, Rocket, RefreshCw, Pill, Star } from 'lucide-react'

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
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) { router.push('/login'); return }

      const c = JSON.parse(stored)
      
      // Fetch fresh restaurant to get welcome_message
      let freshRestaurant = null
      try {
        const res = await fetch(`/api/clinics/get?id=${c.id}`)
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

      // Load all branches for the branch selector
      try {
        const storedRestaurants = localStorage.getItem('tokenpe_user_clinics')
        if (storedRestaurants) setUserRestaurants(JSON.parse(storedRestaurants))
      } catch (e) { /* ignore */ }

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
    
    // Fetch fresh restaurant data for the selected branch
    let freshRestaurant = null
    try {
      const res = await fetch(`/api/clinics/get?id=${selected.id}`)
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
    setTotalGuests(0)
    setMedsReachable(0)
    setRecallReachable(0)
    setAvgRating(0)
    setRecentFeedbacks([])
    
    await loadCRMStats(finalRestaurant)
    setLoading(false)
  }

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
        setRestaurant(updated)
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
    if (!confirm(`Are you sure you want to send this broadcast to ${totalGuests} guests?`)) return

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
      const payload = { clinicId: clinic.id }
      if (field === 'recall') payload.smartRecallEnabled = value
      if (field === 'meds') payload.smartMedsEnabled = value
      
      const res = await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        if (field === 'recall') setFollowupRecall(value)
        if (field === 'meds') setFollowupMeds(value)
        
        const updates = field === 'recall' ? { smart_recall_enabled: value } : { smart_meds_enabled: value }
        const stored = localStorage.getItem('tokenpe_clinic')
        if (stored) {
          localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), ...updates }))
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
    <div className="min-h-screen flex items-center justify-center bg-[#065F46]">
      <div className="w-10 h-10 border-4 border-white/10 border-t-[#F59E0B] rounded-full animate-spin" />
    </div>
  )

  const isEliteOrTrial = clinic?.plan_id === 'elite' || clinic?.subscription_status === 'trialing'

  if (clinic?.plan_id !== 'elite' && clinic?.plan_id !== 'pro' && clinic?.subscription_status !== 'trialing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#065F46] text-white p-4 font-sans">
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center max-w-sm w-full">
          <div className="text-5xl mb-4 flex justify-center"><Trophy size={48} className="text-amber-500" /></div>
          <h2 className="text-2xl font-black mb-3">Premium Feature</h2>
          <p className="text-[#CCFBF1] text-sm leading-relaxed mb-6">
            Guest CRM and Smart Follow-ups are available to Pro and Elite plan members. Upgrade to engage your guests!
          </p>
          <button onClick={() => router.push('/restaurant-dashboard/billing')} className="w-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-black py-3 rounded-xl font-black mb-3">
            Upgrade Plan
          </button>
          <button onClick={() => router.push('/restaurant-dashboard')} className="w-full bg-transparent text-[#CCFBF1] py-3 rounded-xl font-bold hover:text-white">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#065F46] font-sans pb-20">
      <div className="bg-[#065F46] text-white px-4 py-6 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/restaurant-dashboard')} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">
            ←
          </button>
          <div>
            <div className="text-xs text-[#CCFBF1] font-bold uppercase tracking-widest">Guest CRM</div>
            <div className="text-xl font-black">{clinic.name}</div>
          </div>
        </div>
        {userRestaurants.length > 1 && (
          <select
            value={clinic?.id || ''}
            onChange={handleBranchChange}
            className="bg-[#065F46] border border-[#064E3B] text-white px-4 py-2.5 rounded-xl font-semibold outline-none text-sm"
          >
            {userRestaurants.map(uc => (
              <option key={uc.id} value={uc.id}>{uc.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="w-full mx-auto p-4 sm:p-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#065F46] tracking-tight">CRM & Broadcasts</h1>
          <p className="text-[#64748B] text-sm sm:text-base mt-1">Engage with your guests and customize your clinic's automated messaging.</p>
        </div>

        <div className="space-y-8">
          {/* Welcome Message */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#F1F5F9] relative overflow-hidden hover-card">
            {!isEliteOrTrial && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                <div className="text-3xl mb-2 flex justify-center"><Trophy size={32} className="text-amber-500" /></div>
                <h3 className="text-lg font-black text-[#065F46] mb-2">Elite Feature</h3>
                <p className="text-[#64748B] text-sm mb-4 font-medium">Upgrade to Elite to set a personalized WhatsApp welcome message.</p>
                <button onClick={() => router.push('/restaurant-dashboard/billing')} className="bg-[#065F46] text-white px-6 py-2.5 rounded-xl font-bold text-sm">Upgrade to Elite</button>
              </div>
            )}
            <h2 className="text-lg font-black mb-2">Personalized Welcome Message</h2>
            <p className="text-[#64748B] text-sm mb-5">This message will be appended to the standard TokenPe WhatsApp reply when a guest joins your queue.</p>
            
            <textarea
              value={welcomeMsg}
              onChange={e => setWelcomeMsg(e.target.value)}
              placeholder="e.g. Welcome to City Hospital! Please wait in the AC lounge. Free Wi-Fi password is: city123"
              className="w-full min-h-[100px] p-4 rounded-xl border-2 border-[#E2E8F0] outline-none text-sm font-medium resize-y mb-4 focus:border-[#065F46]"
            />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button 
                onClick={saveWelcomeMessage}
                disabled={savingWelcome}
                className={`bg-[#065F46] text-white px-6 py-2.5 rounded-xl font-bold ${savingWelcome ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#064E3B]'}`}
              >
                {savingWelcome ? 'Saving...' : 'Save Welcome Message'}
              </button>
              {welcomeSuccess && <span className="text-[#10B981] font-bold text-sm"><CheckCircle2 className="inline-block w-4 h-4 mr-1" /> Saved successfully!</span>}
            </div>
          </div>

          {/* Broadcasts */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#F1F5F9] relative overflow-hidden hover-card">
            {!isEliteOrTrial && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                <div className="text-3xl mb-2 flex justify-center"><Rocket size={32} className="text-[#065F46]" /></div>
                <h3 className="text-lg font-black text-[#065F46] mb-2">Elite Feature</h3>
                <p className="text-[#64748B] text-sm mb-4 font-medium">Upgrade to Elite to send mass WhatsApp broadcasts to all your guests.</p>
                <button onClick={() => router.push('/restaurant-dashboard/billing')} className="bg-[#065F46] text-white px-6 py-2.5 rounded-xl font-bold text-sm">Upgrade to Elite</button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-5">
              <div>
                <h2 className="text-lg font-black mb-2">WhatsApp Broadcast</h2>
                <p className="text-[#64748B] text-sm">Send a mass update to all your past guests instantly.</p>
              </div>
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap">
                <Users className="inline-block w-4 h-4 mr-1" /> {totalGuests} Reachable Guests
              </div>
            </div>

            <textarea
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              placeholder="e.g. Dr. Sharma's Restaurant will be closed this Sunday. We are also running a free dental checkup camp next week!"
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
                disabled={sendingBroadcast || totalGuests === 0 || (!broadcastMsg && !broadcastImage)}
                className={`bg-[#10B981] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center ${(sendingBroadcast || totalGuests === 0 || (!broadcastMsg && !broadcastImage)) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#059669]'}`}
              >
                {sendingBroadcast ? 'Sending...' : <><Megaphone className="inline-block w-4 h-4 mr-2" /> Send Broadcast</>}
              </button>
              
              <label className={`flex items-center gap-2 text-[#065F46] font-bold text-sm bg-[#F0FDFA] px-4 py-2.5 rounded-xl border border-dashed border-[#5EEAD4] transition ${uploadingImage ? 'cursor-wait opacity-70' : 'cursor-pointer hover:bg-[#CCFBF1]'}`}>
                {uploadingImage ? 'Uploading...' : <><Camera className="inline-block w-4 h-4 mr-2" /> Attach Flyer</>}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>

              {broadcastSuccess && <span className="text-[#10B981] font-bold text-sm"><CheckCircle2 className="inline-block w-4 h-4 mr-1" /> Broadcast queued!</span>}
            </div>
          </div>

          {/* Smart Follow-ups */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#F1F5F9] hover-card">
            <h2 className="text-lg font-black mb-2">Smart Guest Follow-ups</h2>
            <p className="text-[#64748B] text-sm mb-6">Automate your guest retention with intelligent WhatsApp reminders.</p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-[#065F46]">90-Day Routine Recall <RefreshCw className="inline-block w-4 h-4 ml-1" /></h3>
                    <span className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">{recallReachable} Reachable Today</span>
                  </div>
                  <p className="text-sm text-[#64748B]">Automatically messages guests 90 days after their visit to schedule a routine check-up.</p>
                </div>
                <label className="relative inline-block w-11 h-6 flex-shrink-0 cursor-pointer">
                  <input type="checkbox" checked={followupRecall} onChange={e => saveFollowupConfig('recall', e.target.checked)} disabled={savingFollowups} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-[#065F46]">Medicine Reminders <Pill className="inline-block w-4 h-4 ml-1" /></h3>
                    <span className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">{medsReachable} Reachable Today</span>
                  </div>
                  <p className="text-sm text-[#64748B]">Sends a friendly "Did you start your medicines?" check-in 3 days post-visit.</p>
                </div>
                <label className="relative inline-block w-11 h-6 flex-shrink-0 cursor-pointer">
                  <input type="checkbox" checked={followupMeds} onChange={e => saveFollowupConfig('meds', e.target.checked)} disabled={savingFollowups} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Guest Feedback */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#F1F5F9] hover-card">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black mb-2">Guest Feedback</h2>
                <p className="text-[#64748B] text-sm">Ratings and reviews collected after consultation.</p>
              </div>
              <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] px-5 py-2.5 rounded-xl flex items-center gap-2">
                <span className="text-2xl font-black">{avgRating > 0 ? avgRating : 'N/A'}</span>
                <Star className="inline-block w-5 h-5 text-[#F59E0B] fill-current" />
              </div>
            </div>

            {recentFeedbacks.length === 0 ? (
              <div className="text-center p-8 bg-[#F8FAFC] rounded-xl border-2 border-dashed border-[#E2E8F0]">
                <p className="text-[#94A3B8] font-bold">No text feedback received yet.</p>
                <p className="text-[#CBD5E1] text-sm mt-1">Guests reply to the automated TokenPe WhatsApp feedback message after their visit.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {recentFeedbacks.map((fb, idx) => {
                  const timeStr = fb.feedback_at || fb.completed_at || fb.date
                  const formattedTime = timeStr ? new Date(timeStr).toLocaleString('en-IN', { 
                    timeZone: 'Asia/Kolkata', 
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  }) : 'Unknown Date'
                  
                  return (
                    <div key={idx} className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-[#065F46]">{fb.name || 'Anonymous'}</span>
                        <span className="text-[#F59E0B] flex items-center">{Array.from({length: fb.crm_rating}).map((_, i) => <Star key={'f'+i} className="inline-block w-4 h-4 fill-current" />)}{Array.from({length: 5 - fb.crm_rating}).map((_, i) => <Star key={'e'+i} className="inline-block w-4 h-4" />)}</span>
                      </div>
                      {fb.feedback_text && (
                        <p className="text-[#475569] text-sm italic mt-1">"{fb.feedback_text}"</p>
                      )}
                      <div className="text-xs text-[#94A3B8] mt-2 text-right">{formattedTime}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
