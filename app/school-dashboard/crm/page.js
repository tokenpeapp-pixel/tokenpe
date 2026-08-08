'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import {
  Users, Megaphone, Camera, CheckCircle2, ChevronLeft,
  MessageSquare, Trophy, Lock, Search, Filter, Phone,
  Clock, Tag, RefreshCw, X, Send, Bell, Zap
} from 'lucide-react'

const S = { fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }
const COLORS = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777', '#DC2626']

export default function SchoolCRMPage() {
  const router = useRouter()
  const [clinic, setClinic]               = useState(null)
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('directory')

  const [students, setStudents]           = useState([])
  const [search, setSearch]               = useState('')
  const [filterGrade, setFilterGrade]     = useState('All')

  const [totalStudents, setTotalStudents] = useState(0)
  const [reachable, setReachable]         = useState(0)

  const [welcomeMsg, setWelcomeMsg]       = useState('')
  const [savingWelcome, setSavingWelcome] = useState(false)
  const [welcomeSuccess, setWelcomeSuccess] = useState(false)

  const [broadcastMsg, setBroadcastMsg]   = useState('')
  const [broadcastImage, setBroadcastImage] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState(false)
  const [broadcastCount, setBroadcastCount] = useState(0)

  const [followupRecall, setFollowupRecall] = useState(false)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadDirectory = useCallback(async (schoolId) => {
    try {
      if (!schoolId) return

      const [historyRes, queueRes] = await Promise.all([
        supabase.from('school_history').select('*').eq('school_id', schoolId),
        supabase.from('school_queue').select('*').eq('school_id', schoolId)
      ])

      const combined = [...(historyRes.data || []), ...(queueRes.data || [])]

      const studentMap = {}
      combined.forEach(r => {
        const name = r.student_name || r.name
        const phone = r.guardian_name || r.phone || 'N/A'
        const grade = r.grade_class || r.grade || 'General'
        if (!name) return

        const key = `${name.toLowerCase()}_${phone}`
        if (!studentMap[key]) {
          studentMap[key] = {
            id: r.id,
            name,
            guardian: phone,
            grade,
            visits: 1,
            lastVisit: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'
          }
        } else {
          studentMap[key].visits += 1
        }
      })

      const list = Object.values(studentMap)
      setStudents(list)
      setTotalStudents(list.length)

      const withPhone = list.filter(s => s.guardian && s.guardian !== 'N/A' && s.guardian.length >= 10)
      setReachable(withPhone.length)
      setBroadcastCount(withPhone.length)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_school_business') || localStorage.getItem('tokenpe_business')
      if (!stored) { router.push('/school-login'); return }

      const c = JSON.parse(stored)
      let freshClinic = c

      try {
        const res = await fetch(`/api/business/get?id=${c.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.clinic) freshClinic = data.clinic
        }
      } catch (e) {}

      setClinic(freshClinic)
      setWelcomeMsg(freshClinic.welcome_message || '')
      setFollowupRecall(freshClinic.smart_recall_enabled || false)

      await loadDirectory(freshClinic.id)
      setLoading(false)
    }
    load()
  }, [router, loadDirectory])

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
        setClinic(updated)
        localStorage.setItem('tokenpe_business', JSON.stringify(updated))
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

  const grades = ['All', ...new Set(students.map(s => s.grade).filter(Boolean))]

  const filtered = students.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.guardian.includes(search) || s.grade.toLowerCase().includes(search.toLowerCase())
    const matchesGrade = filterGrade === 'All' || s.grade === filterGrade
    return matchesSearch && matchesGrade
  })

  const tabs = [
    { id: 'directory', label: 'Student Directory', icon: <Users size={15} /> },
    { id: 'broadcast', label: 'WhatsApp Broadcast', icon: <Megaphone size={15} /> },
    { id: 'welcome', label: 'Welcome Auto-reply', icon: <MessageSquare size={15} /> },
  ]

  const isElite = clinic?.plan_id === 'elite' || clinic?.plan_id === 'elite_monthly' || clinic?.plan_id === 'elite_yearly' || clinic?.plan_id === 'elite_custom' || clinic?.subscription_status === 'trialing' || clinic?.subscription_status === 'active'

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

      <style>{`
        .student-card {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .student-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 28px rgba(27, 42, 74, 0.1) !important;
          border-color: rgba(124, 58, 237, 0.4) !important;
        }
        .hover-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .hover-btn:hover {
          transform: translateY(-1.5px) !important;
          box-shadow: 0 4px 14px rgba(27, 42, 74, 0.15) !important;
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(27,42,74,0.08)', padding: isMobile ? '10px 12px' : '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(27,42,74,0.06)' }}>
        <button onClick={() => router.push('/school-dashboard')} className="hover-btn" style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#1B2A4A', fontWeight: 700, fontSize: '0.8rem' }}>
          <ChevronLeft size={16} />{isMobile ? null : ' Back'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #7C3AED 100%)', borderRadius: 8, padding: 8 }}>
            <Users size={18} color="#FFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A' }}>Student Directory (CRM)</div>
            <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600, display: isMobile ? 'none' : 'block' }}>{clinic?.name} — Broadcasts & Engagement</div>
          </div>
        </div>
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
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="hover-btn" style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit',
              background: activeTab === t.id ? '#1B2A4A' : 'transparent',
              color: activeTab === t.id ? '#FFF' : '#5A6E85',
            }}>
              {t.icon} {isMobile ? t.label.split(' ')[0] : t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: STUDENT DIRECTORY */}
        {activeTab === 'directory' && (
          <div>
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
              <button onClick={() => loadDirectory(clinic.id)} className="hover-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '0 14px', cursor: 'pointer', color: '#5A6E85', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'inherit' }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#5A6E85', fontSize: '0.9rem', fontWeight: 600, background: '#FFFFFF', borderRadius: 12, border: '1px dashed #CBD5E1' }}>
                {students.length === 0 ? 'No students on record yet — they appear after their first visit.' : 'No students match your search.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(268px, 1fr))', gap: 14 }}>
                {filtered.map((s, i) => (
                  <div key={i} className="student-card" style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '18px 20px', boxShadow: '0 4px 14px rgba(27,42,74,0.05)' }}>
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

        {/* TAB 2: WHATSAPP BROADCAST */}
        {activeTab === 'broadcast' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: '#FFFFFF', border: '1.5px solid #A7F3D0', borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 4px 12px rgba(5,150,105,0.08)' }}>
              <div style={{ background: '#ECFDF5', borderRadius: 10, padding: 14 }}><Megaphone size={24} color="#059669" /></div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 700, color: '#1B2A4A', lineHeight: 1 }}>{broadcastCount}</div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>Students Reachable via WhatsApp</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '22px 24px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)', position: 'relative', overflow: 'hidden' }}>
              {!isElite && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(248,250,252,0.94)', backdropFilter: 'blur(8px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', borderRadius: 12 }}>
                  <Trophy size={36} color="#D97706" style={{ marginBottom: 12 }} />
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#1B2A4A', marginBottom: 6 }}>Elite Feature</h3>
                  <p style={{ fontSize: '0.82rem', color: '#5A6E85', lineHeight: 1.6, maxWidth: 320, marginBottom: 18 }}>
                    Upgrade to Elite to send mass WhatsApp broadcasts to all your students.
                  </p>
                  <button onClick={() => router.push('/school-dashboard/billing')} className="hover-btn" style={{ background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'inherit' }}>
                    <Zap size={14} style={{ display: 'inline', marginRight: 6 }} /> Upgrade to Elite
                  </button>
                </div>
              )}

              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.05rem', color: '#1B2A4A', marginBottom: 3 }}>Compose Broadcast</div>
              <div style={{ fontSize: '0.75rem', color: '#5A6E85', marginBottom: 16 }}>Send a mass message or announcement flyer to all students via WhatsApp.</div>

              <textarea
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="e.g. 📢 Exam schedule update — Mid-semester exams begin on 5th August. Please carry your hall tickets."
                style={{ width: '100%', minHeight: 120, padding: 14, borderRadius: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1B2A4A', fontSize: '0.85rem', outline: 'none', resize: 'vertical', marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
              />

              {broadcastImage && (
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                  <img src={broadcastImage.url} alt="Flyer" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                  <span style={{ fontSize: '0.78rem', color: '#5A6E85', fontWeight: 600 }}>{broadcastImage.name}</span>
                  <button onClick={() => setBroadcastImage(null)} style={{ background: '#DC2626', color: '#FFF', border: 'none', width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} /></button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={sendBroadcast}
                  disabled={sendingBroadcast || broadcastCount === 0 || (!broadcastMsg && !broadcastImage)}
                  className="hover-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: (sendingBroadcast || broadcastCount === 0 || (!broadcastMsg && !broadcastImage)) ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'inherit', opacity: (sendingBroadcast || broadcastCount === 0 || (!broadcastMsg && !broadcastImage)) ? 0.55 : 1 }}>
                  <Send size={14} /> {sendingBroadcast ? 'Sending...' : `Send to ${broadcastCount} Students`}
                </button>

                <label className="hover-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: '#5A6E85', fontFamily: 'inherit' }}>
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
            </div>
          </div>
        )}

        {/* TAB 3: WELCOME AUTO-REPLY */}
        {activeTab === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.1)', borderRadius: 12, padding: '22px 24px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)', position: 'relative', overflow: 'hidden' }}>
              {!isElite && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(248,250,252,0.94)', backdropFilter: 'blur(8px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', borderRadius: 12 }}>
                  <Lock size={32} color="#D97706" style={{ marginBottom: 12 }} />
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#1B2A4A', marginBottom: 6 }}>Elite Feature</h3>
                  <p style={{ fontSize: '0.82rem', color: '#5A6E85', lineHeight: 1.6, maxWidth: 300, marginBottom: 18 }}>Upgrade to Elite to set a personalised WhatsApp welcome message.</p>
                  <button onClick={() => router.push('/school-dashboard/billing')} className="hover-btn" style={{ background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'inherit' }}>Upgrade to Elite</button>
                </div>
              )}

              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.05rem', color: '#1B2A4A', marginBottom: 4 }}>Personalised Welcome Message</div>
              <div style={{ fontSize: '0.75rem', color: '#5A6E85', marginBottom: 18 }}>
                This message is appended to the WhatsApp confirmation reply when a student joins the queue.
              </div>

              <textarea
                value={welcomeMsg}
                onChange={e => setWelcomeMsg(e.target.value)}
                placeholder="e.g. Welcome to ABC College! Please proceed to the waiting area near the admin block."
                style={{ width: '100%', minHeight: 110, padding: 14, borderRadius: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1B2A4A', fontSize: '0.85rem', outline: 'none', resize: 'vertical', marginBottom: 18, boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={saveWelcomeMessage} disabled={savingWelcome} className="hover-btn" style={{ background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: savingWelcome ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.85rem', opacity: savingWelcome ? 0.7 : 1, fontFamily: 'inherit' }}>
                  {savingWelcome ? 'Saving…' : 'Save Welcome Message'}
                </button>
                {welcomeSuccess && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 800, fontSize: '0.82rem' }}>
                    <CheckCircle2 size={15} /> Saved successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
