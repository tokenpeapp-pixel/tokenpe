'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function FeedbackPage() {
  const { clinicCode } = useParams()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')
  
  const [clinic, setClinic] = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      if (!clinicCode || !patientId) {
        setLoading(false)
        return
      }
      
      const { data: c } = await supabase.from('clinics').select('id, name, logo_url').eq('code', clinicCode.toUpperCase()).single()
      if (c) {
        setClinic(c)
        const { data: p } = await supabase.from('patients').select('id, name, rating, feedback_text').eq('id', patientId).single()
        if (p) {
          setPatient(p)
          if (p.rating) {
            setRating(p.rating)
            setFeedbackText(p.feedback_text || '')
            setSubmitted(true)
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [clinicCode, patientId])

  async function submitFeedback() {
    if (rating === 0) return alert('Please select a star rating.')
    
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('patients')
        .update({ rating, feedback_text: feedbackText })
        .eq('id', patientId)
        
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      alert('Failed to submit feedback. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!clinic || !patient) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 24, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Invalid Link</h1>
          <p style={{ color: '#64748B', marginTop: 8 }}>We couldn't find your consultation record.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif", color: '#0F172A', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 12px 32px rgba(0,0,0,0.04)', marginTop: 40, textAlign: 'center' }}>
        
        {clinic.logo_url ? (
          <img src={clinic.logo_url} alt={clinic.name} style={{ width: 64, height: 64, borderRadius: 12, marginBottom: 16, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, margin: '0 auto 16px' }}>
            {clinic.name.charAt(0)}
          </div>
        )}
        
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>{clinic.name}</h1>
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: 24 }}>How was your experience today, {patient.name}?</p>
        
        {submitted ? (
          <div style={{ padding: 20, background: '#F0FDF4', borderRadius: 16, border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>💚</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534', marginBottom: 4 }}>Thank You!</h2>
            <p style={{ color: '#15803D', fontSize: '0.9rem' }}>Your feedback has been saved successfully.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '2.5rem',
                    cursor: 'pointer',
                    transition: 'transform 0.1s',
                    transform: (hoverRating || rating) === star ? 'scale(1.2)' : 'scale(1)',
                    color: star <= (hoverRating || rating) ? '#F59E0B' : '#E2E8F0'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Tell us what you liked or how we can improve... (Optional)"
              style={{ width: '100%', minHeight: 100, padding: 16, borderRadius: 12, border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: 20, background: '#F8FAFC' }}
            />
            
            <button
              onClick={submitFeedback}
              disabled={submitting || rating === 0}
              style={{
                width: '100%',
                background: rating > 0 ? '#10B981' : '#CBD5E1',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: '1rem',
                cursor: rating > 0 ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
                boxShadow: rating > 0 ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </>
        )}
        
      </div>
      
      <div style={{ marginTop: 24, fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>
        Powered by TokenPe
      </div>
    </div>
  )
}
