'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import {
  Users, Megaphone, Camera, CheckCircle2, Star, ChevronLeft,
  MessageSquare, Rocket, Trophy, Lock, Search, Filter, Phone,
  GraduationCap, Clock, Tag, RefreshCw, X, Send, Bell, Zap
} from 'lucide-react'

const S = { fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }
const COLORS = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777', '#DC2626']

export default function SchoolCRMPage() {
  const router = useRouter()
  const [clinic, setClinic]               = useState(null)
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('directory') // 'directory' | 'broadcast' | 'welcome'

  // Directory state
  const [students, setStudents]           = useState([])
  const [search, setSearch]               = useState('')
  const [filterGrade, setFilterGrade]     = useState('All')

  // CRM stats
  const [totalStudents, setTotalStudents] = useState(0)
  const [reachable, setReachable]         = useState(0)
  const [avgRating, setAvgRating]         = useState(0)
  const [recentFeedbacks, setRecentFeedbacks] = useState([])

  // Welcome message
  const [welcomeMsg, setWelcomeMsg]       = useState('')
  const [savingWelcome, setSavingWelcome] = useState(false)
  const [welcomeSuccess, setWelcomeSuccess] = useState(false)

  // Broadcast
  const [broadcastMsg, setBroadcastMsg]   = useState('')
  const [broadcastImage, setBroadcastImage] = useState(null) // { url, name }
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState(false)
  const [broadcastCount, setBroadcastCount] = useState(0)

  // Smart follow-ups
  const [followupRecall, setFollowupRecall] = useState(false)
  const [savingFollowups, setSavingFollowups] = useState(false)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) { router.push('/school-login'); return }
      const c = JSON.parse(stored)

      // Try to fetch fresh clinic data
      let freshClinic = c
      try {
        const res = await fetch(`/api/clinics/get?id=${c.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.clinic) freshClinic = data.clinic
        }
      } catch (e) {}

      setClinic(freshClinic)
      setWelcomeMsg(freshClinic.welcome_message || '')
      setFollowupRecall(freshClinic.smart_recall_enabled || false)

      // Load student directory from school_history (deduplicated)
      await loadDirectory(freshClinic.id)
      setLoading(false)
    }
    load()
  }, [router])

  async function loadDirectory(schoolId) {
    try {
      const { data } = await supabase
        .from('school_history')
        .select('student_name, grade_class, guardian_name, time_label, created_at, status')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(500)

      const rows = data || []

      // Deduplicate by student name — aggregate visits, keep latest
      const map = new Map()
      rows.forEach(r => {
        const key = (r.student_name || '').toLowerCase().trim()
        if (!map.has(key)) {
          map.set(key, {
            name: r.student_name,
            grade: r.grade_class || 'Unknown',
            guardian: r.guardian_name || '—',
            lastVisit: r.time_label || new Date(r.created_at).toLocaleDateString('en-IN'),
            visits: 1,
            status: r.status,
          })
        } else {
          map.get(key).visits++
        }
      })

      const list = Array.from(map.values()).sort((a, b) => b.visits - a.visits)
      setStudents(list)
      setTotalStudents(list.length)

      // Count reachable (those with guardian phone — from school_queue)
      const { data: queueData } = await supabase
        .from('school_queue')
        .select('phone')
        .eq('school_id', schoolId)
        .neq('phone', null)
        .neq('phone', '')
      const uniquePhones = new Set((queueData || []).map(q => q.phone).filter(Boolean))
      setReachable(uniquePhones.size)
      setBroadcastCount(uniquePhones.size)

    } catch (e) {
      console.error('Failed to load directory:', e)
    }
  }

  async function saveWelcomeMessage() {
    setSavingWelcome(true)
    setWelcomeSuccess(false)
    try {
      const res = await fetch('/api/clinics/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, welcomeMessage: welcomeMsg })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setWelcomeSuccess(true)
        setTimeout(() => setWelcomeSuccess(false), 4000)
        const stored = localStorage.getItem('tokenpe_clinic')
        if (stored) localStorage.setItem('tokenpe_clinic', JSON.stringify({ ...JSON.parse(stored), welcome_message: welcomeMsg }))
      } else {
        alert(data.error || 'Failed to save welcome message')
      }
    } catch (err) { alert('Error saving welcome message') }
    setSavingWelcome(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return alert('Image size must be less than 5MB')
    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${clinic.id}_${Date.now()}.${fileExt}`
      const { error } = await supabase.storage.from('public_assets').upload(`broadcasts/${fileName}`, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('public_assets').getPublicUrl(`broadcasts/${fileName}`)
      setBroadcastImage({ url: publicUrl, name: file.name })
    } catch (err) {
      alert('Failed to upload image. Please try again.')
    }
    setUploadingImage(false)
  }

  async function sendBroadcast() {
    if (!broadcastMsg.trim() && !broadcastImage) return alert('Enter a message or attach a flyer.')
    if (broadcastCount === 0) return alert('No students with phone numbers are on record yet.')
    if (!confirm(`Send this broadcast to ${broadcastCount} students via WhatsApp?`)) return

    setSendingBroadcast(true)
    setBroadcastSuccess(false)
    try {
      const res = await fetch('/api/whatsapp/broadcast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, message: broadcastMsg, imageUrl: broadcastImage?.url || null })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBroadcastSuccess(true)
        setBroadcastMsg('')
        setBroadcastImage(null)
        setTimeout(() => setBroadcastSuccess(false), 5000)
      } else {
        alert(data.error || 'Failed to send broadcast')
      }
    } catch (err) { alert('Error sending broadcast') }
    setSendingBroadcast(false)
  }

  const isElite = clinic?.plan_id === 'elite' || clinic?.plan_id === 'elite_monthly' || clinic?.plan_id === 'elite_yearly' || clinic?.plan_id === 'elite_custom' || clinic?.subscription_status === 'trialing' || clinic?.subscription_status === 'active'

  const grades = ['All', ...new Set(students.map(s => s.grade).filter(Boolean))]
  const filtered = students.filter(s => {
    const m = s.name?.toLowerCase().includes(search.toLowerCase()) || s.guardian?.includes(search) || s.grade?.toLowerCase().includes(search.toLowerCase())
    const g = filterGrade === 'All' || s.grade === filterGrade
    return m && g
  })

  const tabs = [
    { id: 'directory', label: 'Student Directory', icon: <Users size={15} /> },
    { id: 'broadcast', label: 'WhatsApp Broadcast', icon: <Megaphone size={15} /> },
    { id: 'welcome',   label: 'Welcome Message',   icon: <MessageSquare size={15} /> },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center', ...S }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <div style={{ color: '#5A6E85', fontWeight: 600, fontSize: '0.88rem' }}>Loading Student Directory...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', ...S }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* ── HEADER ── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(27,42,74,0.08)', padding: isMobile ? '10px 12px' : '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(27,42,74,0.06)' }}>
        <button onClick={() => router.push('/school-dashboard')} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#1B2A4A', fontWeight: 700, fontSize: '0.8rem' }}>
          <ChevronLeft size={16} />{isMobile ? null : ' Back'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #7C3AED 100%)', borderRadius: 8, padding: 8 }}>
            <Users size={18} color="#FFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A' }}>Student Directory (CRM)</div>
            <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600, display: isMobile ? 'none' : 'block' }}>{clinic?.name} — Broadcasts & Guest Engagement</div>
          </div>
        </div>
        {/* Summary badges */}
        <div style={{ marginLeft: 'auto', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', padding: '6px 12px', borderRadius: 6, border: '1px solid #BFDBFE' }}>
            <Users size={13} color="#2563EB" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8' }}>{totalStudents} Students</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', padding: '6px 12px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
            <Bell size={13} color="#059669" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>{reachable} Reachable</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '14px 12px' : '24px 20px' }}>

        {/* ── TAB BAR ── */}
        <div style={{ display: 'flex', gap: 0, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 4, marginBottom: 22, width: isMobile ? '100%' : 'fit-content', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit', transition: 'all 0.18s ease',
              background: activeTab === t.id ? '#1B2A4A' : 'transparent',
              color: activeTab === t.id ? '#FFF' : '#5A6E85',
            }}>
              {t.icon} {isMobile ? t.label.split(' ')[0] : t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════
            TAB 1: STUDENT DIRECTORY
        ════════════════════════════════════════════════ */}
        {activeTab === 'directory' && (
          <div>
            {/* Search + Filter */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, grade, or guardian…" style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1.5px solid #E2E8F0', borderRadius: 8, outline: 'none', background: '#FFFFFF', fontSize: '0.85rem', color: '#1B2A4A', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '0 12px' }}>
                <Filter size={13} color="#5A6E85" />
                <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '0.82rem', color: '#1B2A4A', fontWeight: 600, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button onClick={() => loadDirectory(clinic.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '0 14px', cursor: 'pointer', color: '#5A6E85', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'inherit' }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {/* Student Grid */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#5A6E85', fontSize: '0.9rem', fontWeight: 600, background: '#FFFFFF', borderRadius: 12, border: '1px dashed #CBD5E1' }}>
                {students.length === 0 ? 'No students on record yet — they appear after their first visit.' : 'No students match your search.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(268px, 1fr))', gap: 14 }}>
                {filtered.map((s, i) => (
                  <div key={i} style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '18px 20px', boxShadow: '0 4px 14px rgba(27,42,74,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 2) % COLORS.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0 }}>
                        {s.name?.charAt(0) || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.95rem', color: '#1B2A4A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                          <Tag size={10} color="#7C3AED" />
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '1px 7px', borderRadius: 4 }}>{s.grade}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                          <Star size={11} color="#F59E0B" fill="#F59E0B" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D97706' }}>{s.visits}×</span>
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 600 }}>visits</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Phone size={11} color="#5A6E85" />
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: '#1B2A4A' }}>{s.guardian}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Clock size={11} color="#5A6E85" />
                        <span style={{ fontSize: '0.76rem', color: '#5A6E85', fontWeight: 600 }}>Last: {s.lastVisit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB 2: WHATSAPP BROADCAST
        ════════════════════════════════════════════════ */}
        {activeTab === 'broadcast' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Audience Stat Card */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid #A7F3D0', borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 4px 12px rgba(5,150,105,0.08)' }}>
              <div style={{ background: '#ECFDF5', borderRadius: 10, padding: 14 }}><Megaphone size={24} color="#059669" /></div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 700, color: '#1B2A4A', lineHeight: 1 }}>{broadcastCount}</div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>Students Reachable via WhatsApp</div>
                <div style={{ fontSize: '0.7rem', color: '#5A6E85', marginTop: 2 }}>Based on phone numbers collected during queue check-in</div>
              </div>
            </div>

            {/* Compose card */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '22px 24px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)', position: 'relative', overflow: 'hidden' }}>
              {!isElite && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(248,250,252,0.94)', backdropFilter: 'blur(8px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', borderRadius: 12 }}>
                  <Trophy size={36} color="#D97706" style={{ marginBottom: 12 }} />
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#1B2A4A', marginBottom: 6 }}>Elite Feature</h3>
                  <p style={{ fontSize: '0.82rem', color: '#5A6E85', lineHeight: 1.6, maxWidth: 320, marginBottom: 18 }}>
                    Upgrade to Elite to send mass WhatsApp broadcasts to all your students.
                  </p>
                  <button onClick={() => router.push('/school-dashboard/billing')} style={{ background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'inherit' }}>
                    <Zap size={14} style={{ display: 'inline', marginRight: 6 }} /> Upgrade to Elite
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.05rem', color: '#1B2A4A', marginBottom: 3 }}>Compose Broadcast</div>
                  <div style={{ fontSize: '0.75rem', color: '#5A6E85' }}>Send a mass message or announcement flyer to all students via WhatsApp.</div>
                </div>
              </div>

              <textarea
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="e.g. 📢 Exam schedule update — Mid-semester exams begin on 5th August. Please carry your hall tickets. Best of luck from the Admin!"
                style={{ width: '100%', minHeight: 120, padding: 14, borderRadius: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1B2A4A', fontSize: '0.85rem', outline: 'none', resize: 'vertical', marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
              />

              {/* Image preview */}
              {broadcastImage && (
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                  <img src={broadcastImage.url} alt="Flyer" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                  <span style={{ fontSize: '0.78rem', color: '#5A6E85', fontWeight: 600 }}>{broadcastImage.name}</span>
                  <button onClick={() => setBroadcastImage(null)} style={{ background: '#DC2626', color: '#FFF', border: 'none', width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <X size={11} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={sendBroadcast}
                  disabled={sendingBroadcast || broadcastCount === 0 || (!broadcastMsg && !broadcastImage)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: (sendingBroadcast || broadcastCount === 0 || (!broadcastMsg && !broadcastImage)) ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'inherit', opacity: (sendingBroadcast || broadcastCount === 0 || (!broadcastMsg && !broadcastImage)) ? 0.55 : 1, boxShadow: '0 4px 12px rgba(27,42,74,0.2)' }}>
                  <Send size={14} /> {sendingBroadcast ? 'Sending...' : `Send to ${broadcastCount} Students`}
                </button>

                <label style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '9px 16px', cursor: uploadingImage ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.82rem', color: '#5A6E85', fontFamily: 'inherit' }}>
                  <Camera size={14} color="#7C3AED" />
                  {uploadingImage ? 'Uploading…' : 'Attach Flyer'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImage} />
                </label>

                {broadcastSuccess && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 800, fontSize: '0.82rem', background: '#ECFDF5', padding: '8px 14px', borderRadius: 8, border: '1px solid #A7F3D0' }}>
                    <CheckCircle2 size={15} /> Broadcast queued successfully!
                  </span>
                )}
              </div>

              {/* Message preview */}
              {broadcastMsg && (
                <div style={{ marginTop: 18, padding: '14px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📱 WhatsApp Preview</div>
                  <div style={{ fontSize: '0.82rem', color: '#1B2A4A', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    📢 <strong>Update from {clinic?.name}</strong>{'\n\n'}{broadcastMsg}{'\n\n'}<em style={{ color: '#5A6E85' }}>Powered by TokenPe</em>
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { icon: '📢', title: 'Exam Alerts', desc: 'Notify students about upcoming exam dates, schedule changes, or hall ticket requirements.' },
                { icon: '🎉', title: 'Event Announcements', desc: 'Share upcoming college fests, seminars, sports events, or cultural programs.' },
                { icon: '⚠️', title: 'Urgent Notices', desc: 'Send emergency campus notifications like holiday announcements or class cancellations.' },
              ].map((tip, i) => (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{tip.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1B2A4A', marginBottom: 4 }}>{tip.title}</div>
                  <div style={{ fontSize: '0.74rem', color: '#5A6E85', lineHeight: 1.6 }}>{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB 3: WELCOME MESSAGE
        ════════════════════════════════════════════════ */}
        {activeTab === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '22px 24px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)', position: 'relative', overflow: 'hidden' }}>
              {!isElite && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(248,250,252,0.94)', backdropFilter: 'blur(8px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', borderRadius: 12 }}>
                  <Lock size={32} color="#D97706" style={{ marginBottom: 12 }} />
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#1B2A4A', marginBottom: 6 }}>Elite Feature</h3>
                  <p style={{ fontSize: '0.82rem', color: '#5A6E85', lineHeight: 1.6, maxWidth: 300, marginBottom: 18 }}>Upgrade to Elite to set a personalised WhatsApp welcome message for your students.</p>
                  <button onClick={() => router.push('/school-dashboard/billing')} style={{ background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'inherit' }}>Upgrade to Elite</button>
                </div>
              )}

              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.05rem', color: '#1B2A4A', marginBottom: 4 }}>Personalised Welcome Message</div>
              <div style={{ fontSize: '0.75rem', color: '#5A6E85', marginBottom: 18 }}>
                This message is appended to the WhatsApp confirmation reply when a student joins the queue. Personalise it with campus Wi-Fi, wait area info, or a warm greeting.
              </div>

              <textarea
                value={welcomeMsg}
                onChange={e => setWelcomeMsg(e.target.value)}
                placeholder="e.g. Welcome to ABC College! Please proceed to the waiting area near the admin block. For urgent queries, call 1800-XXX-XXXX."
                style={{ width: '100%', minHeight: 110, padding: 14, borderRadius: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1B2A4A', fontSize: '0.85rem', outline: 'none', resize: 'vertical', marginBottom: 18, boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={saveWelcomeMessage} disabled={savingWelcome} style={{ background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: savingWelcome ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.85rem', opacity: savingWelcome ? 0.7 : 1, fontFamily: 'inherit' }}>
                  {savingWelcome ? 'Saving…' : 'Save Welcome Message'}
                </button>
                {welcomeSuccess && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 800, fontSize: '0.82rem' }}>
                    <CheckCircle2 size={15} /> Saved successfully!
                  </span>
                )}
              </div>

              {/* Preview */}
              {welcomeMsg && (
                <div style={{ marginTop: 20, padding: '14px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📱 WhatsApp Preview</div>
                  <div style={{ fontSize: '0.82rem', color: '#1B2A4A', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    ✅ <strong>Your token has been confirmed!</strong>{'\n'}Queue position: #1{'\n\n'}{welcomeMsg}{'\n\n'}<em style={{ color: '#5A6E85' }}>— {clinic?.name} via TokenPe</em>
                  </div>
                </div>
              )}
            </div>

            {/* Smart follow-up toggle */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: '#1B2A4A', marginBottom: 4 }}>Smart Recall Reminders</div>
              <div style={{ fontSize: '0.75rem', color: '#5A6E85', marginBottom: 16 }}>Automatically send a WhatsApp follow-up to students who haven't visited in 30 days.</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1B2A4A' }}>30-Day Re-engagement Reminder</div>
                  <div style={{ fontSize: '0.72rem', color: '#5A6E85', marginTop: 2 }}>"We miss you at {clinic?.name}! Don't forget your upcoming visit."</div>
                </div>
                <button
                  onClick={() => {
                    const newVal = !followupRecall
                    setFollowupRecall(newVal)
                    // Save via API
                    fetch('/api/clinics/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clinicId: clinic.id, smartRecallEnabled: newVal }) }).catch(() => {})
                  }}
                  style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: followupRecall ? '#059669' : '#CBD5E1', transition: 'background 0.2s ease', position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#FFF', position: 'absolute', top: 3, left: followupRecall ? 25 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
