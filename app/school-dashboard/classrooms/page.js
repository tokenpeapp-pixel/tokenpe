'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import {
  ChevronLeft, DoorOpen, Plus, QrCode, Users, Clock, CheckCircle2,
  Trash2, RefreshCw, Copy, X, AlertTriangle, Zap, Building2,
  GraduationCap, Star, ArrowRight, ShieldCheck, Sparkles,
  LayoutGrid, ScanLine, MessageCircle, Shuffle
} from 'lucide-react'

const S = { fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }
const AREA_SUGGESTIONS = [
  'Admissions Office', 'Principal Office', 'Accounts / Fees', 'Library',
  'Sports Ground', 'Medical Room', 'Exam Hall', 'Labs',
  'Hostel Admin', 'Canteen Counter', 'Transport Desk', 'Counsellor',
]

export default function ClassroomsPage() {
  const router = useRouter()

  const [clinic, setClinic]           = useState(null)
  const [queues, setQueues]           = useState([])   // all clinics sharing the same email
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  // Create queue modal
  const [showCreate, setShowCreate]   = useState(false)
  const [queueName, setQueueName]     = useState('')
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState(null)

  // QR modal
  const [showQR, setShowQR]           = useState(null) // queue object

  // Delete confirmation modal
  const [confirmDelete, setConfirmDelete] = useState(null) // queue object to delete
  const [deleting, setDeleting]       = useState(false)

  // Live stats per queue
  const [queueStats, setQueueStats]   = useState({}) // { [clinicId]: { active, completed } }

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Load all queues (branches sharing same email) ──────────────────────────
  const loadQueues = useCallback(async () => {
    const stored = localStorage.getItem('tokenpe_clinic')
    if (!stored) { router.push('/school-login'); return }
    const c = JSON.parse(stored)
    setClinic(c)

    try {
      // Get fresh data + all sibling queues
      const [freshRes] = await Promise.all([
        fetch(`/api/clinics/get?id=${c.id}`),
      ])
      const freshData = freshRes.ok ? await freshRes.json() : null
      const freshClinic = freshData?.success ? freshData.clinic : c
      setClinic(freshClinic)
      localStorage.setItem('tokenpe_clinic', JSON.stringify(freshClinic))

      // Fetch all school queues with same email from Supabase directly
      let query = supabase
        .from('clinics')
        .select('id, name, code, email, phone, plan_id, subscription_status, created_at, specialty, vertical')
        .eq('email', freshClinic.email)

      const targetVertical = freshClinic.vertical || 'school'
      const { data: siblings, error: sibErr } = await query
        .or(`vertical.eq.${targetVertical},vertical.is.null`)
        .order('created_at', { ascending: true })

      if (sibErr) throw sibErr
      setQueues(siblings || [])
      localStorage.setItem('tokenpe_user_clinics', JSON.stringify(siblings || []))

      // Load live stats for each queue
      const todayStr = new Date().toISOString().split('T')[0]
      const stats = {}
      await Promise.all((siblings || []).map(async (q) => {
        try {
          const [activeRes, histRes] = await Promise.all([
            supabase.from('school_queue').select('id', { count: 'exact', head: true }).eq('school_id', q.id).eq('status', 'waiting'),
            supabase.from('school_history').select('id', { count: 'exact', head: true }).eq('school_id', q.id).gte('created_at', `${todayStr}T00:00:00+05:30`),
          ])
          stats[q.id] = {
            active: activeRes.count || 0,
            completed: histRes.count || 0,
          }
        } catch { stats[q.id] = { active: 0, completed: 0 } }
      }))
      setQueueStats(stats)
    } catch (e) {
      console.error(e)
      setError('Failed to load queues. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadQueues() }, [loadQueues])

  // ── Create new queue ───────────────────────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault()
    if (!queueName.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/clinics/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: queueName.trim(),
          phone: clinic.phone,
          email: clinic.email,
          parentPlanId: clinic.plan_id,
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setCreateError(data.error || 'Failed to create queue')
        setCreating(false)
        return
      }
      setCreateSuccess(data.clinic)
      setQueueName('')
      setShowCreate(false)
      await loadQueues()
    } catch (err) {
      setCreateError('Network error. Please try again.')
    }
    setCreating(false)
  }

  // ── Switch to a queue ──────────────────────────────────────────────────────
  function switchToQueue(q) {
    localStorage.setItem('tokenpe_clinic', JSON.stringify(q))
    localStorage.setItem('clinicCode', q.code)
    localStorage.setItem('clinicPhone', q.phone)
    router.push('/school-dashboard')
  }

  // ── Delete queue (non-primary or primary) ─────────────────────────────────
  async function performDelete(q) {
    if (!q) return
    setDeleting(true)
    const isCurr = q.id === clinic?.id
    try {
      const res = await fetch('/api/clinics/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: q.id })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setConfirmDelete(null)
        // If we deleted the active queue, switch to whichever remains first
        if (isCurr) {
          const remaining = queues.filter(x => x.id !== q.id)
          if (remaining.length > 0) switchToQueue(remaining[0])
          else router.push('/school-dashboard')
        } else {
          await loadQueues()
        }
      } else {
        alert(data.error || 'Failed to delete queue')
      }
    } catch { alert('Network error') }
    setDeleting(false)
  }

  // ── Copy code ─────────────────────────────────────────────────────────────
  function copyCode(code) {
    navigator.clipboard.writeText(code).catch(() => {})
  }

  const isElite = clinic?.plan_id === 'elite' || clinic?.plan_id === 'elite_monthly' || clinic?.plan_id === 'elite_yearly' || clinic?.plan_id === 'elite_custom' || clinic?.subscription_status === 'trialing' || clinic?.subscription_status === 'active'
  const isPrimary = (q) => queues[0]?.id === q.id
  const isCurrent = (q) => q.id === clinic?.id
  const canAdd    = isElite && queues.length < 3

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center', ...S }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#1B2A4A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <div style={{ color: '#5A6E85', fontWeight: 600, fontSize: '0.88rem' }}>Loading queues…</div>
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
          <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #2563EB 100%)', borderRadius: 8, padding: 8 }}>
            <DoorOpen size={18} color="#FFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A' }}>Classrooms in Session</div>
            <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600, display: isMobile ? 'none' : 'block' }}>Multi-Queue Management — {clinic?.name}</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: isMobile ? 'none' : 'flex', gap: 10 }}>
          <button onClick={loadQueues} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#5A6E85', fontWeight: 700, fontSize: '0.75rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          {canAdd && (
            <button onClick={() => { setShowCreate(true); setCreateError(''); setQueueName(''); }} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1B2A4A', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: '#FFF', fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 4px 14px rgba(27,42,74,0.25)' }}>
              <Plus size={15} /> New Queue
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '14px 12px' : '24px 20px' }}>

        {/* ── EXPLAINER BANNER ── */}
        <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #2563EB 100%)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, color: '#FFF', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 20 }}>
          <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 12 }}>
            <Building2 size={28} color="#FFF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Multiple Queues, One Campus</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, display: isMobile ? 'none' : 'block' }}>
              Create separate queues for different areas of your campus — Admissions, Fees, Library, Medical Room, etc. Each queue gets its own QR code and can be managed independently, all under one account.
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'Playfair Display, serif' }}>{queues.length}<span style={{ fontSize: '1rem', fontWeight: 600 }}>/3</span></div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)' }}>Queues active</div>
          </div>
        </div>

        {/* ── SUCCESS TOAST ── */}
        {createSuccess && (
          <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 10, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={20} color="#059669" />
            <div>
              <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.88rem' }}>Queue "{createSuccess.name}" created successfully!</div>
              <div style={{ fontSize: '0.75rem', color: '#5A6E85', marginTop: 2 }}>Code: <strong style={{ fontFamily: 'monospace', color: '#1B2A4A' }}>{createSuccess.code}</strong> — Share the QR below to let students join.</div>
            </div>
            <button onClick={() => setCreateSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#5A6E85' }}><X size={16} /></button>
          </div>
        )}

        {/* ── QUEUE CARDS ── */}
        {error ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#DC2626', fontWeight: 700 }}>{error}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16, marginBottom: 28 }}>
            {queues.map((q, i) => {
              const stats   = queueStats[q.id] || { active: 0, completed: 0 }
              const current = isCurrent(q)
              const primary = isPrimary(q)

              return (
                <div key={q.id} style={{
                  background: '#FFFFFF',
                  border: current ? '2px solid #2563EB' : '1.5px solid rgba(27,42,74,0.1)',
                  borderRadius: 14,
                  padding: '20px',
                  boxShadow: current ? '0 8px 28px rgba(37,99,235,0.12)' : '0 4px 14px rgba(27,42,74,0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Top badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    {primary && (
                      <span style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#D97706', fontSize: '0.62rem', fontWeight: 900, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                        PRIMARY
                      </span>
                    )}
                    {current && (
                      <span style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', fontSize: '0.62rem', fontWeight: 900, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                        ● ACTIVE
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>#{i + 1}</span>
                  </div>

                  {/* Name */}
                  <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A', marginBottom: 4 }}>{q.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#5A6E85', fontWeight: 600, marginBottom: 14 }}>
                    {q.specialty || 'Queue'} · {q.email}
                  </div>

                  {/* Code */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: '#1B2A4A', letterSpacing: '0.1em', flex: 1 }}>{q.code}</span>
                    <button onClick={() => copyCode(q.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', padding: 4 }} title="Copy">
                      <Copy size={13} />
                    </button>
                  </div>

                  {/* Live stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#EA580C', lineHeight: 1 }}>{stats.active}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>In Queue</div>
                    </div>
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#059669', lineHeight: 1 }}>{stats.completed}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>Done Today</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => switchToQueue(q)}
                      disabled={current}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: current ? '#F1F5F9' : '#1B2A4A',
                        color: current ? '#94A3B8' : '#FFF',
                        border: 'none', borderRadius: 8, padding: '9px 0',
                        cursor: current ? 'not-allowed' : 'pointer',
                        fontWeight: 800, fontSize: '0.78rem', fontFamily: 'inherit',
                        boxShadow: current ? 'none' : '0 4px 12px rgba(27,42,74,0.18)',
                      }}>
                      {current ? '✓ Current' : <><ArrowRight size={13} /> Switch</>}
                    </button>
                    <button onClick={() => setShowQR(q)} style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', color: '#2563EB' }} title="View QR">
                      <QrCode size={15} />
                    </button>
                    <button onClick={() => setConfirmDelete(q)} style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', color: '#DC2626' }} title={primary ? 'Delete primary queue' : 'Delete queue'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* ── Add new queue card ── */}
            {canAdd ? (
              <button onClick={() => { setShowCreate(true); setCreateError(''); setQueueName(''); }} style={{ background: '#FFFFFF', border: '2px dashed #CBD5E1', borderRadius: 14, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', color: '#5A6E85', transition: 'all 0.18s ease', minHeight: 220 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#F0F7FF' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#FFFFFF' }}>
                <div style={{ background: '#EFF6FF', borderRadius: 10, padding: 12 }}><Plus size={24} color="#2563EB" /></div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1B2A4A' }}>Add New Queue</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', textAlign: 'center' }}>{3 - queues.length} slot{3 - queues.length !== 1 ? 's' : ''} remaining</div>
              </button>
            ) : !isElite ? (
              <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 14, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', minHeight: 220 }}>
                <div style={{ background: '#FEF3C7', borderRadius: 10, padding: 12 }}><Sparkles size={24} color="#D97706" /></div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1B2A4A' }}>Elite Feature</div>
                <div style={{ fontSize: '0.72rem', color: '#5A6E85', lineHeight: 1.6 }}>Upgrade to Elite to create up to 3 queues per campus.</div>
                <button onClick={() => router.push('/school-dashboard/billing')} style={{ background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', fontFamily: 'inherit' }}>
                  <Zap size={12} style={{ display: 'inline', marginRight: 5 }} /> Upgrade
                </button>
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center', minHeight: 220 }}>
                <div style={{ fontWeight: 700, color: '#94A3B8', fontSize: '0.85rem' }}>Maximum 3 queues reached</div>
                <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Delete an existing queue to add a new one.</div>
              </div>
            )}
          </div>
        )}

        {/* ── HOW IT WORKS ── */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(27,42,74,0.08)', borderRadius: 12, padding: '22px 24px', boxShadow: '0 4px 12px rgba(27,42,74,0.04)' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: '#1B2A4A', marginBottom: 16 }}>How Classrooms in Session Works</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { icon: <LayoutGrid size={20} color="#2563EB" />, bg: '#EFF6FF', title: 'Create Area Queues', desc: 'Add separate queues for Admissions, Fees, Library, Medical Room — any area on campus.' },
              { icon: <ScanLine size={20} color="#7C3AED" />, bg: '#F5F3FF', title: 'Share QR Codes', desc: 'Each queue has a unique QR code. Display it on the notice board or entrance of that area.' },
              { icon: <MessageCircle size={20} color="#059669" />, bg: '#ECFDF5', title: 'Students Join via WhatsApp', desc: 'No app needed. Students scan the QR and join via WhatsApp instantly.' },
              { icon: <Shuffle size={20} color="#D97706" />, bg: '#FEF3C7', title: 'Switch Between Queues', desc: 'Toggle between queues from this page. Each area\'s admin manages their own queue independently.' },
            ].map((step, i) => (
              <div key={i} style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 10 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: step.bg, borderRadius: 8, padding: 8, marginBottom: 10 }}>{step.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1B2A4A', marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: '0.73rem', color: '#5A6E85', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CREATE QUEUE MODAL
      ══════════════════════════════════════════ */}
      {showCreate && (
        <div onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: isMobile ? '18px 18px 0 0' : 18, padding: isMobile ? '20px 16px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 460, boxShadow: '0 24px 60px rgba(27,42,74,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: '#1B2A4A' }}>Create New Queue</div>
                <div style={{ fontSize: '0.72rem', color: '#5A6E85', marginTop: 3 }}>This queue shares billing with your primary account.</div>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 7, padding: 7, cursor: 'pointer', color: '#5A6E85' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1B2A4A', marginBottom: 7 }}>Queue / Area Name *</label>
                <input
                  value={queueName}
                  onChange={e => setQueueName(e.target.value)}
                  placeholder="e.g. Admissions Office, Fees Counter, Library…"
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 9, outline: 'none', fontSize: '0.88rem', color: '#1B2A4A', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              {/* Quick suggestions */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Quick Pick</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {AREA_SUGGESTIONS.filter(s => !queues.some(q => q.name.toLowerCase() === s.toLowerCase())).slice(0, 8).map(s => (
                    <button key={s} type="button" onClick={() => setQueueName(s)}
                      style={{ padding: '4px 12px', border: `1.5px solid ${queueName === s ? '#2563EB' : '#E2E8F0'}`, background: queueName === s ? '#EFF6FF' : '#F8FAFC', color: queueName === s ? '#2563EB' : '#5A6E85', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info notice */}
              <div style={{ background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 9, padding: '10px 14px', marginBottom: 18, fontSize: '0.75rem', color: '#1D4ED8', lineHeight: 1.6, display: 'flex', gap: 8 }}>
                <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>This queue will share the same billing plan and email as <strong>{clinic?.name}</strong>. It gets its own unique QR code and can be managed independently.</span>
              </div>

              {createError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.78rem', color: '#DC2626', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertTriangle size={14} /> {createError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '11px 0', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, color: '#5A6E85', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={creating || !queueName.trim()} style={{ flex: 2, padding: '11px 0', background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#FFF', fontWeight: 800, fontSize: '0.85rem', cursor: (creating || !queueName.trim()) ? 'not-allowed' : 'pointer', opacity: (creating || !queueName.trim()) ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 12px rgba(27,42,74,0.2)' }}>
                  {creating ? <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating…
                  </> : <><Plus size={15} /> Create Queue</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          QR CODE MODAL
      ══════════════════════════════════════════ */}
      {showQR && (
        <div onClick={() => setShowQR(null)} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: isMobile ? '18px 18px 0 0' : 18, padding: isMobile ? '20px 16px' : '28px 32px', width: '100%', maxWidth: isMobile ? '100%' : 380, boxShadow: '0 24px 60px rgba(27,42,74,0.2)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1B2A4A', marginBottom: 4 }}>{showQR.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#5A6E85', marginBottom: 18 }}>Scan to join this queue via WhatsApp</div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, marginBottom: 16, display: 'inline-block' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://wa.me/917303382377?text=${showQR.code}`)}&bgcolor=FFFFFF&color=1B2A4A&qzone=2`}
                alt="QR Code"
                style={{ width: 180, height: 180, display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', marginBottom: 18, justifyContent: 'center' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#5A6E85', textTransform: 'uppercase' }}>Code</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.1rem', color: '#1B2A4A', letterSpacing: '0.12em' }}>{showQR.code}</span>
              <button onClick={() => copyCode(showQR.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB' }}><Copy size={13} /></button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: 20 }}>
              Students send this code on WhatsApp to <strong style={{ color: '#1B2A4A' }}>+91 73033 82377</strong> to join the queue.
            </div>
            <button onClick={() => setShowQR(null)} style={{ width: '100%', padding: '11px 0', background: '#1B2A4A', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════════ */}
      {confirmDelete && (
        <div onClick={() => !deleting && setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: isMobile ? '18px 18px 0 0' : 18, padding: '28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(27,42,74,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 10, color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: '#1B2A4A' }}>Delete Queue?</div>
                <div style={{ fontSize: '0.75rem', color: '#5A6E85', fontWeight: 600 }}>This action cannot be undone.</div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1B2A4A', marginBottom: 4 }}>"{confirmDelete.name}"</div>
              <div style={{ fontSize: '0.72rem', color: '#5A6E85' }}>Code: <strong style={{ fontFamily: 'monospace', color: '#1B2A4A' }}>{confirmDelete.code}</strong></div>
            </div>

            {queues[0]?.id === confirmDelete.id && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: '0.75rem', color: '#D97706', lineHeight: 1.5, display: 'flex', gap: 8 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Primary Queue Warning:</strong> Deleting this queue will reassign primary status to your next available queue.</span>
              </div>
            )}

            {confirmDelete.id === clinic?.id && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: '0.75rem', color: '#1D4ED8', lineHeight: 1.5, display: 'flex', gap: 8 }}>
                <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Active Queue Notice:</strong> You are currently managing this queue. After deletion, you will be switched to another queue automatically.</span>
              </div>
            )}

            <div style={{ fontSize: '0.78rem', color: '#5A6E85', lineHeight: 1.6, marginBottom: 20 }}>
              Deleting this queue will permanently remove its student queue access and current tokens.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                style={{ flex: 1, padding: '11px 0', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, color: '#5A6E85', fontWeight: 700, fontSize: '0.85rem', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => performDelete(confirmDelete)}
                disabled={deleting}
                style={{ flex: 1.2, padding: '11px 0', background: '#DC2626', border: 'none', borderRadius: 8, color: '#FFF', fontWeight: 800, fontSize: '0.85rem', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(220,38,38,0.25)' }}>
                {deleting ? 'Deleting...' : <><Trash2 size={15} /> Delete Queue</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
