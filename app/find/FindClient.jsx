'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
  MapPin, Search, MessageSquare, Mic, Zap, Gift, Crown, CreditCard, Lock, Check, Calendar, QrCode, Heart, Hospital, Globe, Camera, FileText, IndianFlag, Star, Clock, Link, Users, SPECIALTY_ICONS 
} from '../../lib/icons'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919892875513'



function StarRating({ rating }) {
  if (!rating) return null
  const stars = Math.round(rating)
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} fill={i <= stars ? '#f59e0b' : 'none'} stroke={i <= stars ? '#f59e0b' : 'rgba(255,255,255,0.15)'} />
      ))}
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>{parseFloat(rating).toFixed(1)}</span>
    </span>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: '24px 22px',
      animation: 'shimmer 1.5s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.07)', marginBottom: 8, width: '70%' }} />
          <div style={{ height: 12, borderRadius: 8, background: 'rgba(255,255,255,0.05)', width: '45%' }} />
        </div>
      </div>
      <div style={{ height: 12, borderRadius: 8, background: 'rgba(255,255,255,0.05)', marginBottom: 8, width: '80%' }} />
      <div style={{ height: 12, borderRadius: 8, background: 'rgba(255,255,255,0.05)', width: '55%', marginBottom: 20 }} />
      <div style={{ height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

function ClinicCard({ clinic, isNearby }) {
  const icon = typeof SPECIALTY_ICONS[clinic.specialty] === 'function' ? SPECIALTY_ICONS[clinic.specialty](26) : <Hospital size={26} />
  const waLink = `https://wa.me/${WA_NUMBER}?text=JOIN%20${encodeURIComponent(clinic.code)}`

  return (
    <div className="clinic-card" style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: '22px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1), border-color 0.2s, background 0.2s',
      backdropFilter: 'blur(8px)',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'default',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {clinic.photo_url ? (
          <img
            src={clinic.photo_url}
            alt={clinic.name}
            style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}
          />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(6,182,212,0.2))',
            border: '1px solid rgba(124,58,237,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd'
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {clinic.name}
          </div>
          {clinic.specialty && (
            <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>{clinic.specialty}</div>
          )}
        </div>
        {isNearby && clinic.distance_km && (
          <div style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 100,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: '#34d399',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}>
            <MapPin size={11} /> {clinic.distance_km} km
          </div>
        )}
      </div>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MapPin size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
          {[clinic.area, clinic.city].filter(Boolean).join(', ') || 'Location not set'}
        </span>
      </div>

      {/* Rating */}
      {clinic.avg_rating && (
        <StarRating rating={clinic.avg_rating} />
      )}

      {/* Live queue status row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
        {/* Status Pill */}
        <div style={{
          background: clinic.queue_paused ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
          border: clinic.queue_paused ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(16,185,129,0.25)',
          borderRadius: 100,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 700,
          color: clinic.queue_paused ? '#ef4444' : '#34d399',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
        }}>
          {clinic.queue_paused ? <Clock size={11} /> : <Check size={11} />}
          {clinic.queue_paused ? 'Paused' : 'Open'}
        </div>

        {/* Patients Waiting Pill */}
        <div style={{
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 100,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 700,
          color: '#c4b5fd',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Users size={11} /> {clinic.waiting_count || 0} waiting
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            color: '#fff',
            padding: '11px 16px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(124,58,237,0.5)' }}
          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.3)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Join Queue
        </a>
        <a
          href={`/j/${clinic.code}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)',
            padding: '11px 13px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.2s, color 0.2s',
          }}
          title="Share join link"
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
        >
          <Link size={14} />
        </a>
      </div>
    </div>
  )
}

function EmptyState({ query }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, color: 'rgba(255,255,255,0.2)' }}>
        <Hospital size={64} />
      </div>
      <h3 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px' }}>
        No clinics found
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, maxWidth: 380, margin: '0 auto 28px' }}>
        {query
          ? `No results for "${query}". Try a different name, specialty, or city.`
          : 'No public clinics are listed yet. Check back soon or ask your clinic to register on TokenPe.'}
      </p>
      <a
        href="/login"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
          color: '#fff', padding: '12px 28px', borderRadius: 12,
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
        }}
      >
        Register your clinic →
      </a>
    </div>
  )
}

export default function FindClient({ initialClinics, initialQ, initialCity, initialSpecialty, cities, specialties }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQ)
  const [selectedCity, setSelectedCity] = useState(initialCity)
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty)
  const [clinics, setClinics] = useState(initialClinics)
  const [loading, setLoading] = useState(false)
  const [nearbyResults, setNearbyResults] = useState([])
  const [locationStatus, setLocationStatus] = useState('checking') // 'checking' | 'prompt' | 'detecting' | 'active' | 'denied'
  const [userLocation, setUserLocation] = useState(null)
  const debounceRef = useRef(null)

  // If user has location and no search filters, show nearby. Otherwise show normal search results.
  const displayedClinics = (userLocation && !query && !selectedCity && !selectedSpecialty && nearbyResults.length > 0) 
    ? nearbyResults 
    : clinics

  const fetchClinics = useCallback(async (q, city, spec) => {
    setLoading(true)
    try {
      let dbQuery = supabase
        .from('public_clinics')
        .select('id, name, specialty, city, area, code, avg_rating, photo_url, queue_paused, waiting_count')
        .limit(60)

      if (q) dbQuery = dbQuery.or(`name.ilike.%${q}%,specialty.ilike.%${q}%,city.ilike.%${q}%,area.ilike.%${q}%`)
      if (city) dbQuery = dbQuery.ilike('city', `%${city}%`)
      if (spec) dbQuery = dbQuery.ilike('specialty', `%${spec}%`)

      const { data } = await dbQuery
      setClinics(data || [])
    } catch {
      setClinics([])
    }
    setLoading(false)
  }, [])

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchClinics(query, selectedCity, selectedSpecialty)
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (selectedCity) params.set('city', selectedCity)
      if (selectedSpecialty) params.set('specialty', selectedSpecialty)
      const qs = params.toString()
      router.replace(`/find${qs ? '?' + qs : ''}`, { scroll: false })
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, selectedCity, selectedSpecialty, fetchClinics, router])

  const fetchNearby = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`/api/clinics/nearby?lat=${lat}&lng=${lng}&radius=15000`)
      const json = await res.json()
      setNearbyResults(json.clinics || [])
      localStorage.setItem('tokenpe_user_lat', lat.toString())
      localStorage.setItem('tokenpe_user_lng', lng.toString())
    } catch {
      setNearbyResults([])
    }
  }, [])

  // Zepto/Blinkit style: On mount, check if we have cached location. If yes, use it. If no, show prompt.
  useEffect(() => {
    const storedLat = localStorage.getItem('tokenpe_user_lat')
    const storedLng = localStorage.getItem('tokenpe_user_lng')
    if (storedLat && storedLng) {
      const lat = parseFloat(storedLat)
      const lng = parseFloat(storedLng)
      setUserLocation({ lat, lng })
      setLocationStatus('active')
      fetchNearby(lat, lng)
    } else {
      setLocationStatus('prompt')
    }
  }, [fetchNearby])

  // User clicks "Detect my location" on the page
  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }
    setLocationStatus('detecting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserLocation({ lat, lng })
        setLocationStatus('active')
        fetchNearby(lat, lng)
      },
      (err) => {
        console.log('Location error:', err)
        setLocationStatus('denied')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // Skip location — just show all clinics
  function handleSkipLocation() {
    setLocationStatus('active')
  }

  const allSpecialties = specialties.length
    ? specialties
    : ['General Physician', 'Pediatrician', 'Dermatologist', 'Gynecologist', 'Orthopedic', 'Dentist', 'ENT', 'Ophthalmologist', 'Cardiologist', 'Neurologist']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: #080818; color: #fff; overflow-x: hidden; }

        .find-page { min-height: 100vh; background: #080818; position: relative; overflow: hidden; }
        
        /* Grid background */
        .find-page::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* Floating orbs */
        .find-orb1 { position: fixed; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%); top: -150px; left: -150px; pointer-events: none; z-index: 0; animation: floatOrb1 10s ease-in-out infinite; }
        .find-orb2 { position: fixed; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%); bottom: -100px; right: -100px; pointer-events: none; z-index: 0; animation: floatOrb2 13s ease-in-out infinite; }
        @keyframes floatOrb1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }
        @keyframes floatOrb2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(24px)} }

        .find-inner { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 100px 24px 80px; }

        /* Nav */
        .find-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; background: rgba(8,8,24,0.7); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .find-nav-logo { height: 36px; width: auto; cursor: pointer; }
        .find-nav-back { display: flex; align-items: center; gap: 7px; color: rgba(255,255,255,0.55); font-size: 13px; font-weight: 600; cursor: pointer; background: none; border: none; text-decoration: none; transition: color 0.15s; }
        .find-nav-back:hover { color: #fff; }

        /* Hero area */
        .find-hero { text-align: center; margin-bottom: 52px; }
        .find-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.35); border-radius: 100px; padding: 6px 18px; font-size: 12px; color: #c4b5fd; margin-bottom: 22px; font-weight: 600; letter-spacing: .5px; }
        .find-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #7C3AED; box-shadow: 0 0 8px #7C3AED; }
        .find-h1 { font-size: clamp(32px, 5vw, 56px); font-weight: 900; letter-spacing: -2px; color: #fff; margin-bottom: 14px; line-height: 1.05; }
        .find-h1 span { background: linear-gradient(135deg, #7C3AED, #06B6D4, #10B981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .find-sub { color: rgba(255,255,255,0.45); font-size: 16px; line-height: 1.7; max-width: 480px; margin: 0 auto; }

        /* Search box */
        .search-box-wrap { position: relative; max-width: 680px; margin: 0 auto 28px; }
        .search-icon-left { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); pointer-events: none; }
        .search-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; color: #fff; font-family: inherit; font-size: 16px; padding: 16px 60px 16px 52px; outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; backdrop-filter: blur(8px); }
        .search-input::placeholder { color: rgba(255,255,255,0.3); }
        .search-input:focus { border-color: rgba(124,58,237,0.6); background: rgba(255,255,255,0.08); box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
        .search-clear { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.1); border: none; color: rgba(255,255,255,0.5); width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: background 0.15s, color 0.15s; }
        .search-clear:hover { background: rgba(255,255,255,0.18); color: #fff; }

        /* GPS + controls row */
        .controls-row { display: flex; align-items: center; gap: 10px; max-width: 680px; margin: 0 auto 32px; flex-wrap: wrap; }
        .gps-btn { display: flex; align-items: center; gap: 7px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); color: #34d399; padding: 9px 18px; border-radius: 100px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s, border-color 0.2s, transform 0.2s; white-space: nowrap; font-family: inherit; }
        .gps-btn:hover { background: rgba(16,185,129,0.2); border-color: rgba(16,185,129,0.5); transform: translateY(-1px); }
        .gps-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .gps-btn.active { background: rgba(16,185,129,0.2); border-color: rgba(16,185,129,0.5); }
        .gps-error { font-size: 12px; color: #f87171; font-weight: 500; }
        .results-count { font-size: 13px; color: rgba(255,255,255,0.35); font-weight: 500; margin-left: auto; }

        /* Filter chips */
        .chips-section { margin-bottom: 32px; }
        .chips-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 10px; }
        .chips-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55); transition: all 0.2s; font-family: inherit; white-space: nowrap; }
        .chip:hover { border-color: rgba(124,58,237,0.4); background: rgba(124,58,237,0.08); color: #c4b5fd; }
        .chip.active { border-color: rgba(124,58,237,0.6); background: rgba(124,58,237,0.15); color: #a78bfa; }
        .chip-clear { font-size: 14px; color: rgba(255,255,255,0.3); }

        /* Results grid */
        .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
        .clinic-card:hover { transform: translateY(-5px); border-color: rgba(124,58,237,0.35) !important; background: rgba(124,58,237,0.06) !important; }

        /* Nearby mode banner */
        .nearby-banner { display: flex; align-items: center; justify-content: space-between; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 12px 18px; margin-bottom: 24px; flex-wrap: wrap; gap: 8px; }
        .nearby-banner-text { font-size: 13px; color: #34d399; font-weight: 600; display: flex; align-items: center; gap: 7px; }
        .nearby-clear { background: none; border: none; font-size: 12px; color: rgba(255,255,255,0.4); cursor: pointer; font-weight: 600; font-family: inherit; transition: color 0.15s; }
        .nearby-clear:hover { color: #fff; }

        /* Shimmer animation for skeletons */
        @keyframes shimmer { 0%,100%{opacity:0.7} 50%{opacity:1} }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(52,211,153,0.3); border-top-color: #34d399; border-radius: 50%; animation: spin 0.8s linear infinite; }

        /* Responsive */
        @media (max-width: 640px) {
          .find-inner { padding: 88px 16px 60px; }
          .find-nav { padding: 0 16px; }
          .search-input { font-size: 15px; padding: 14px 52px 14px 48px; }
          .results-grid { grid-template-columns: 1fr; }
          .chips-row { gap: 6px; }
          .chip { padding: 6px 12px; font-size: 11px; }
          .find-h1 { letter-spacing: -1px; }
          .controls-row { gap: 8px; }
          .results-count { width: 100%; margin-left: 0; }
        }
      `}</style>

      <div className="find-page">
        <div className="find-orb1" />
        <div className="find-orb2" />

        {/* Nav */}
        <nav className="find-nav">
          <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.svg" alt="TokenPe" className="find-nav-logo" />
          </a>
          <a href="/" className="find-nav-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </a>
        </nav>

        <div className="find-inner">

          {/* LOCATION PROMPT — Zepto/Blinkit style */}
          {(locationStatus === 'prompt' || locationStatus === 'detecting' || locationStatus === 'denied') && (
            <div style={{ textAlign: 'center', padding: '60px 20px 40px', maxWidth: 440, margin: '0 auto' }}>
              <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9', marginBottom: 12, letterSpacing: '-0.5px' }}>
                {locationStatus === 'detecting' ? 'Detecting your location...' : 'Where are you?'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
                {locationStatus === 'denied' 
                  ? 'Location was blocked. You can search clinics manually below, or allow location in your browser settings and try again.'
                  : 'Share your location to instantly see the clinics nearest to you.'}
              </p>
              
              {locationStatus === 'detecting' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div className="spinner" style={{ width: 24, height: 24 }} />
                  <span style={{ color: '#34d399', fontSize: 14, fontWeight: 600 }}>Getting your GPS location...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
                  <button
                    onClick={handleDetectLocation}
                    style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {locationStatus === 'denied' ? 'Try Again' : 'Detect My Location'}
                  </button>
                  <button
                    onClick={handleSkipLocation}
                    style={{ width: '100%', padding: '14px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Skip — I'll search manually
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MAIN CONTENT — shown after location is resolved */}
          {locationStatus === 'active' && (
            <>
              {/* Hero */}
              <div className="find-hero">
                <div className="find-badge">
                  <span className="find-badge-dot" />
                  {userLocation ? 'Showing clinics near you' : 'Find clinics near you — no QR scan needed'}
                </div>
                <h1 className="find-h1">Find a <span>Clinic</span><br />Join from Home</h1>
                <p className="find-sub">
                  Search by doctor, specialty, or city. Get your token instantly on WhatsApp — no waiting at reception.
                </p>
              </div>

              {/* Search input */}
              <div className="search-box-wrap">
                <span className="search-icon-left">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <input
                  id="find-search-input"
                  className="search-input"
                  type="text"
                  placeholder="Search by doctor, clinic, specialty or city..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoComplete="off"
                />
                {query && (
                  <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">✕</button>
                )}
              </div>

              {/* Results count + location indicator */}
              <div className="controls-row">
                {userLocation && !query && !selectedCity && !selectedSpecialty && nearbyResults.length > 0 && (
                  <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Sorted by distance from you
                  </span>
                )}
                {!loading && (
                  <span className="results-count">
                    {displayedClinics.length} clinic{displayedClinics.length !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>

              {/* Filter chips */}
              <div className="chips-section">
                <div className="chips-label">Specialty</div>
                <div className="chips-row" style={{ marginBottom: 14 }}>
                  {allSpecialties.map(spec => (
                    <button
                      key={spec}
                      className={`chip${selectedSpecialty === spec ? ' active' : ''}`}
                      onClick={() => setSelectedSpecialty(selectedSpecialty === spec ? '' : spec)}
                    >
                      {typeof SPECIALTY_ICONS[spec] === 'function' ? SPECIALTY_ICONS[spec](14) : <Hospital size={14} />} {spec}
                      {selectedSpecialty === spec && <span className="chip-clear">✕</span>}
                    </button>
                  ))}
                </div>

                {cities.length > 0 && (
                  <>
                    <div className="chips-label" style={{ marginTop: 6 }}>City</div>
                    <div className="chips-row">
                      {cities.slice(0, 12).map(c => (
                        <button
                          key={c}
                          className={`chip${selectedCity === c ? ' active' : ''}`}
                          onClick={() => setSelectedCity(selectedCity === c ? '' : c)}
                        >
                          {c}
                          {selectedCity === c && <span className="chip-clear">✕</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Results */}
              <div className="results-grid">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                  : displayedClinics.length === 0
                    ? <EmptyState query={query || selectedSpecialty || selectedCity} />
                    : displayedClinics.map(clinic => (
                      <ClinicCard key={clinic.id || clinic.code} clinic={clinic} isNearby={!!clinic.distance_km} />
                    ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
