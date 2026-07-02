'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  MapPin, Search, Check, Clock, Users, Link as LinkIcon, Hospital
} from '../../lib/icons'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919892875513'

// Dynamically import the Leaflet map component with ssr: false
// This prevents "window is not defined" errors during server-side rendering
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb' }}>Loading Map...</div>
})

function ClinicCard({ clinic, isNearby, onClick, isSelected }) {
  const waLink = `https://wa.me/${WA_NUMBER}?text=JOIN%20${encodeURIComponent(clinic.code)}`

  return (
    <div 
      className={`clinic-card ${isSelected ? 'selected' : ''}`} 
      onClick={onClick} 
      style={{ 
        cursor: 'pointer', 
        borderColor: isSelected ? '#0d9488' : '#e5e7eb',
        borderWidth: isSelected ? '2px' : '1px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
          {clinic.name}
        </div>
        {isNearby && clinic.distance_km && (
          <div style={{ background: '#ecfdf5', color: '#10b981', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <MapPin size={10} /> {clinic.distance_km} km
          </div>
        )}
      </div>
      <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>
        Specialty: {clinic.specialty || 'General Physician'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <span className="badge-teal">Voice Alerts</span>
        <span className="badge-teal">No App Required</span>
      </div>
      
      {clinic.is_closed_today ? (
        <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          🔴 Closed for Today
        </div>
      ) : clinic.queue_paused ? (
        <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} /> Queue Paused
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
            Live Queue Status: <strong>{clinic.waiting_count || 0} people waiting</strong>
          </div>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>
            Estimated Wait Time: <strong>{Math.max((clinic.waiting_count || 0) * 5, 10)} min</strong>
          </div>
        </>
      )}

      {clinic.is_closed_today ? (
        <div className="btn-join" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', cursor: 'not-allowed' }}>
          Closed Today
        </div>
      ) : (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-join"
          onClick={(e) => e.stopPropagation()}
        >
          Join Queue via WhatsApp
        </a>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty-state-overlay">
      <div className="empty-icon-wrap">
        <Search size={32} color="#0d9488" />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        No clinics found in this area.
      </h3>
      <p style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', marginBottom: 16, maxWidth: 280, lineHeight: 1.5 }}>
        Try searching for a different location or invite your doctor to join TokenPe to get started!
      </p>
      <button className="btn-invite">Invite Doctor</button>
    </div>
  )
}

export default function FindClient({ initialClinics, initialQ, initialCity, initialSpecialty, cities, specialties }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQ || '')
  const [selectedCity, setSelectedCity] = useState(initialCity || '')
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty || '')
  const [clinics, setClinics] = useState(initialClinics || [])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'open', 'paused', 'closed'
  const [activeView, setActiveView] = useState('list') // 'list' or 'map'
  const [selectedClinic, setSelectedClinic] = useState(null)
  // Incrementing this key forces a full Leaflet remount when map view activates,
  // preventing the "grey tiles / 0x0 container" bug on mobile.
  const [mapMountKey, setMapMountKey] = useState(0)

  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [nearbyClinics, setNearbyClinics] = useState([])
  const [isNearbyMode, setIsNearbyMode] = useState(false)

  const debounceRef = useRef(null)

  // Client-side filtering is only used for Nearby mode now.
  // Standard searches fetch perfectly from the database based on the statusFilter.
  const displayedClinics = isNearbyMode 
    ? nearbyClinics.filter(c => {
        if (statusFilter === 'open') return !c.is_closed_today && !c.queue_paused;
        if (statusFilter === 'paused') return c.queue_paused;
        if (statusFilter === 'closed') return c.is_closed_today;
        return true;
      })
    : clinics

  const fetchClinics = useCallback(async (q, city, spec, status) => {
    setLoading(true)
    setIsNearbyMode(false)
    setGpsError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (city) params.set('city', city)
      if (spec) params.set('specialty', spec)
      if (status && status !== 'all') params.set('status', status)
      
      const res = await fetch(`/api/clinics/search${params.toString() ? '?' + params.toString() : ''}`)
      const json = await res.json()
      setClinics(json.clinics || [])
    } catch {
      setClinics([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchClinics(query, selectedCity, selectedSpecialty, statusFilter)
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (selectedCity) params.set('city', selectedCity)
      if (selectedSpecialty) params.set('specialty', selectedSpecialty)
      // We don't necessarily need to push status into the URL, but we can
      router.replace(`/find${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, selectedCity, selectedSpecialty, statusFilter, fetchClinics, router])

  const fetchNearby = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`/api/clinics/nearby?lat=${lat}&lng=${lng}&radius=50000`)
      const json = await res.json()
      setNearbyClinics(json.clinics || [])
      setIsNearbyMode(true)
    } catch {
      setNearbyClinics([])
      setGpsError('Could not fetch nearby clinics. Please try again.')
    } finally {
      setGpsLoading(false)
    }
  }, [])

  function handleFindNearMe() {
    setGpsError('')
    if (!navigator.geolocation) {
      setGpsError('Your browser does not support location.')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setGpsLoading(false)
        setGpsError('Could not get your location. Please allow access.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const allSpecialties = specialties && specialties.length ? specialties : ['General Physician', 'Pediatrician', 'Dentist', 'Gynecologist', 'Orthopedic', 'Cardiologist']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f9fafb; color: #111827; }
        
        .find-nav { padding: 0 32px; height: 72px; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 100; }
        .find-nav-logo { height: 32px; cursor: pointer; }
        .find-nav-back { color: #0d9488; font-size: 14px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .find-nav-back:hover { text-decoration: underline; }
        
        .layout-container { max-width: 1440px; margin: 0 auto; padding: 32px; display: grid; grid-template-columns: minmax(400px, 1fr) 1.2fr; gap: 32px; min-height: calc(100vh - 72px); }
        .left-col { display: flex; flex-direction: column; }
        .right-col { position: sticky; top: 104px; height: calc(100vh - 136px); border-radius: 20px; overflow: hidden; background: #f3f4f6; }
        
        .page-title { font-size: 26px; font-weight: 800; color: #111827; margin-bottom: 24px; }
        
        .search-row { display: flex; align-items: center; background: #fff; border: 2px solid #0d9488; border-radius: 100px; padding: 4px 4px 4px 20px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.08); transition: box-shadow 0.2s; }
        .search-row:focus-within { box-shadow: 0 6px 20px rgba(13, 148, 136, 0.15); }
        .search-input { border: none; outline: none; flex: 1; font-size: 15px; padding: 8px 0; color: #111827; }
        .btn-search { background: #0d9488; color: #fff; border: none; padding: 10px 28px; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.2s; }
        .btn-search:hover { background: #0f766e; }
        
        .filters-row { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
        
        .btn-near-me { padding: 8px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; height: 36px; background: #fff; border: 1px solid #d1d5db; color: #374151; }
        .btn-near-me:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-near-me.active { background: #ecfdf5; border: 1px solid #10b981; color: #10b981; }
        
        .status-filters { display: flex; background: #e5e7eb; padding: 4px; border-radius: 100px; align-items: center; height: 36px; }
        .status-filter-btn { padding: 4px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .status-filter-btn.active { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.05); color: #111827; }
        .status-filter-btn.inactive { background: transparent; color: #6b7280; }
        .status-filter-btn.active.open { color: #0d9488; }
        .status-filter-btn.active.paused { color: #f59e0b; }
        .status-filter-btn.active.closed { color: #ef4444; }

        .filter-group { display: flex; align-items: center; gap: 8px; }
        .filter-select { padding: 8px 32px 8px 14px; border-radius: 8px; border: 1px solid #d1d5db; font-size: 13px; font-weight: 600; color: #374151; background: #fff url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 12px center; appearance: none; outline: none; cursor: pointer; min-width: 160px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        
        .clinic-list { display: flex; flex-direction: column; gap: 16px; padding-bottom: 40px; }
        .clinic-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: transform 0.2s, box-shadow 0.2s; }
        .clinic-card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,0.06); border-color: #d1d5db; }
        
        .badge-teal { background: #ccfbf1; color: #0f766e; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 100px; display: inline-block; }
        
        .btn-join { display: inline-block; background: #0d9488; color: #fff; text-align: center; padding: 14px; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none; width: 100%; transition: background 0.2s, transform 0.1s; }
        .btn-join:hover { background: #0f766e; }
        .btn-join:active { transform: scale(0.98); }

        .empty-state-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255,255,255,0.95); padding: 32px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); backdrop-filter: blur(8px); display: flex; flex-direction: column; align-items: center; width: 340px; text-align: center; z-index: 10; }
        .empty-icon-wrap { width: 64px; height: 64px; background: #e0f2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .btn-invite { background: #0d9488; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
        .btn-invite:hover { background: #0f766e; }
        
        .mobile-view-toggle { display: none; }

        @media (max-width: 1024px) {
          .layout-container { grid-template-columns: 1fr; padding: 20px; }
          .right-col { display: none; }
          .search-row { padding: 4px 4px 4px 16px; }
          .btn-search { padding: 10px 20px; }
        }

        @media (max-width: 768px) {
          .find-nav { padding: 0 16px; height: 64px; }
          .layout-container { padding: 16px; min-height: auto; gap: 16px; margin-bottom: 24px; }
          .page-title { font-size: 22px; margin-bottom: 16px; }
          .search-row { border-radius: 16px; padding: 10px; flex-direction: column; gap: 10px; align-items: stretch; border-width: 1.5px; }
          .search-input { padding: 8px; font-size: 16px; }
          .btn-search { width: 100%; justify-content: center; padding: 12px; border-radius: 10px; font-size: 15px; }
          
          .filters-row { gap: 12px; }
          .filter-group { width: 100%; justify-content: space-between; }
          .filter-select { flex: 1; max-width: none; min-width: 0; }
          .btn-near-me { width: 100%; justify-content: center; height: 44px; font-size: 14px; }
          
          .status-filters { width: 100%; justify-content: space-between; height: auto; padding: 4px; }
          .status-filter-btn { flex: 1; text-align: center; padding: 8px 4px; }
          
          .clinic-card { padding: 20px; }
          
          /* Map view toggle on mobile */
          .mobile-view-toggle { display: flex; background: #e5e7eb; padding: 4px; border-radius: 100px; margin-bottom: 16px; }
          .mobile-view-btn { flex: 1; text-align: center; padding: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border-radius: 100px; color: #6b7280; transition: all 0.2s; }
          .mobile-view-btn.active { background: #fff; color: #111827; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

          .mobile-map-container { height: calc(100vh - 300px); min-height: 400px; border-radius: 16px; overflow: hidden; background: #f3f4f6; position: relative; }
        }
      `}</style>

      <nav className="find-nav">
        <a href="/">
          <img src="/logo-nav.svg" alt="TokenPe" className="find-nav-logo" />
        </a>
        <a href="/" className="find-nav-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Back to Home
        </a>
      </nav>

      <div className={`layout-container ${activeView === 'map' ? 'map-active' : ''}`}>
        <div className="left-col">
          <h1 className="page-title">Find a Clinic Search Results</h1>
          
          <div className="search-row">
            <input 
              className="search-input" 
              type="text" 
              placeholder="Search by clinic name, doctor, or locality" 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
            />
            <button className="btn-search">
              <Search size={16} />
              Search
            </button>
          </div>

          {gpsError && <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 16, background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2' }}>{gpsError}</div>}

          <div className="mobile-view-toggle">
            <div 
              className={`mobile-view-btn ${activeView === 'list' ? 'active' : ''}`}
              onClick={() => setActiveView('list')}
            >
              📋 List
            </div>
            <div 
              className={`mobile-view-btn ${activeView === 'map' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('map')
                setMapMountKey(k => k + 1)
              }}
            >
              🗺️ Map
            </div>
          </div>

          {/* Mobile map rendered inline — never in a display:none container */}
          <div className="mobile-map-container" style={{ display: activeView === 'map' ? 'block' : 'none' }}>
            {activeView === 'map' && (
              <MapComponent clinics={displayedClinics} selectedClinic={selectedClinic} mapKey={mapMountKey}>
                {displayedClinics.length === 0 && !loading && !gpsLoading && <EmptyState />}
              </MapComponent>
            )}
          </div>

          <div className="filters-row">
            <button 
              onClick={handleFindNearMe} 
              disabled={gpsLoading}
              className={`btn-near-me ${isNearbyMode ? 'active' : ''}`}
            >
              <MapPin size={14} color={isNearbyMode ? "#10b981" : "#0d9488"} /> 
              {gpsLoading ? 'Locating...' : 'Near Me'}
            </button>
            <div className="status-filters">
              <div onClick={() => setStatusFilter('all')} className={`status-filter-btn ${statusFilter === 'all' ? 'active' : 'inactive'}`}>All</div>
              <div onClick={() => setStatusFilter('open')} className={`status-filter-btn open ${statusFilter === 'open' ? 'active' : 'inactive'}`}>Open</div>
              <div onClick={() => setStatusFilter('paused')} className={`status-filter-btn paused ${statusFilter === 'paused' ? 'active' : 'inactive'}`}>Paused</div>
              <div onClick={() => setStatusFilter('closed')} className={`status-filter-btn closed ${statusFilter === 'closed' ? 'active' : 'inactive'}`}>Closed</div>
            </div>
            
            <div className="filter-group">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', whiteSpace: 'nowrap' }}>Specialty</span>
              <select 
                className="filter-select"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="">Any Specialty</option>
                {allSpecialties.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', whiteSpace: 'nowrap' }}>Distance</span>
              <select className="filter-select">
                <option value="">Any Distance</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="20">Within 20 km</option>
              </select>
            </div>
          </div>

          <div className="clinic-list">
            {(loading || gpsLoading) ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
            ) : displayedClinics.length > 0 ? (
              displayedClinics.map(clinic => (
                <ClinicCard 
                  key={clinic.id || clinic.code} 
                  clinic={clinic} 
                  isNearby={isNearbyMode} 
                  isSelected={selectedClinic && (selectedClinic.id === clinic.id || selectedClinic.code === clinic.code)}
                  onClick={() => {
                    setSelectedClinic(clinic)
                    if (window.innerWidth <= 1024) {
                      setActiveView('map')
                      setMapMountKey(k => k + 1)
                    }
                  }}
                />
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No clinics found.</div>
            )}
          </div>
        </div>

        {/* Desktop-only sticky map sidebar */}
        <div className="right-col">
          <MapComponent clinics={displayedClinics} selectedClinic={selectedClinic} mapKey={0}>
            {displayedClinics.length === 0 && !loading && !gpsLoading && <EmptyState />}
          </MapComponent>
        </div>
      </div>
    </>
  )
}
