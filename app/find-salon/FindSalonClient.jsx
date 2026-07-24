'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  MapPin, Search, Clock, Users, Link as LinkIcon, ArrowRight, Star, Scissors, Sparkles
} from 'lucide-react'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919892875513'

// Dynamically import the Leaflet map component with ssr: false
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>Loading Map...</div>
})

function SalonCard({ salon, isNearby, onClick, isSelected }) {
  const waLink = `https://wa.me/${WA_NUMBER}?text=JOIN%20${encodeURIComponent(salon.code)}`

  return (
    <div 
      className={`salon-card ${isSelected ? 'selected' : ''}`} 
      onClick={onClick} 
    >
      <div>
        <h3 className="cc-title">{salon.name}</h3>
        <div className="cc-meta">
          <span className="cc-meta-item"><Scissors size={14} /> {salon.specialty || 'Hair & Styling'}</span>
          {salon.city && <span className="cc-meta-item"><MapPin size={14} /> {salon.city}</span>}
          {isNearby && salon.distance_km && (
            <span className="cc-meta-item" style={{color: '#ec4899'}}><MapPin size={14} /> {salon.distance_km} km</span>
          )}
        </div>
      </div>
      
      <div className="cc-right">
        {salon.is_closed_today ? (
          <div style={{ textAlign: "right" }}>
            <div className="cc-wait-label">Status</div>
            <div className="cc-wait-val" style={{color: '#ef4444'}}>
              🔴 Closed
            </div>
          </div>
        ) : salon.queue_paused ? (
          <div style={{ textAlign: "right" }}>
            <div className="cc-wait-label">Status</div>
            <div className="cc-wait-val" style={{color: '#db2777'}}>
              <Clock size={16} /> Paused
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
            <div className="cc-wait-label">Est. Wait Time</div>
            <div className="cc-wait-val" style={{color: '#ec4899'}}>
              <Clock size={16} /> {Math.max((salon.waiting_count || 0) * 5, 10)} mins
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              {salon.waiting_count || 0} waiting
            </div>
          </div>
        )}
        
        {salon.is_closed_today ? (
          <button className="cc-btn cc-btn-disabled" disabled>
            Closed
          </button>
        ) : (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="cc-btn cc-btn-active" onClick={e => e.stopPropagation()}>
            Join Queue <ArrowRight size={16} />
          </a>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = "https://tokenpe.online";

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="empty-state-overlay">
        <div className="empty-icon-wrap">
          <Search size={32} color="#ec4899" />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
          No salons found in this area.
        </h3>
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 16, maxWidth: 280, lineHeight: 1.5 }}>
          Try searching for a different location or invite the salon manager to join TokenPe!
        </p>
        <button className="btn-invite" onClick={() => setShowPopup(true)}>Invite Manager</button>
      </div>

      {showPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#3d1b35", border: "1px solid rgba(236,72,153,0.2)", borderRadius: "16px", padding: "32px", width: "90%", maxWidth: "400px", position: "relative", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <button 
              onClick={() => setShowPopup(false)} 
              style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "16px" }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Invite Your Manager</h3>
            <p style={{ fontSize: "14px", color: "#fed7aa", marginBottom: "24px", lineHeight: 1.5 }}>
              Share this link with your salon manager so they can register for free and set up digital queuing.
            </p>
            <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.05)", padding: "8px 8px 8px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <input 
                type="text" 
                value={link} 
                readOnly 
                style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: "15px", outline: "none" }}
              />
              <button 
                onClick={handleCopy}
                style={{ background: "#db2777", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", opacity: copied ? 0.8 : 1 }}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function FindSalonClient({ initialSalons, initialQ, initialCity, initialSpecialty, cities, specialties }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQ || '')
  const [selectedCity, setSelectedCity] = useState(initialCity || '')
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty || '')
  const [clinics, setClinics] = useState(initialSalons || [])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'open', 'paused', 'closed'
  const [activeView, setActiveView] = useState('list') // 'list' or 'map'
  const [selectedSalon, setSelectedSalon] = useState(null)
  
  const [mapMountKey, setMapMountKey] = useState(0)

  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [nearbySalons, setNearbySalons] = useState([])
  const [isNearbyMode, setIsNearbyMode] = useState(false)

  const debounceRef = useRef(null)

  const displayedSalons = isNearbyMode 
    ? nearbySalons.filter(c => {
        if (statusFilter === 'open') return !c.is_closed_today && !c.queue_paused;
        if (statusFilter === 'paused') return c.queue_paused;
        if (statusFilter === 'closed') return c.is_closed_today;
        return true;
      })
    : clinics

  const fetchSalons = useCallback(async (q, city, spec, status) => {
    setLoading(true)
    setIsNearbyMode(false)
    setGpsError('')
    try {
      const params = new URLSearchParams()
      params.set('vertical', 'salon')   // ← strict vertical isolation
      if (q) params.set('q', q)
      if (city) params.set('city', city)
      if (spec) params.set('specialty', spec)
      if (status && status !== 'all') params.set('status', status)
      
      const res = await fetch(`/api/clinics/search?${params.toString()}`)
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
      fetchSalons(query, selectedCity, selectedSpecialty, statusFilter)
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (selectedCity) params.set('city', selectedCity)
      if (selectedSpecialty) params.set('specialty', selectedSpecialty)
      router.replace(`/find-salon${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, selectedCity, selectedSpecialty, statusFilter, fetchSalons, router])

  const fetchNearby = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`/api/clinics/nearby?lat=${lat}&lng=${lng}&radius=50000&vertical=salon`)
      const json = await res.json()
      setNearbySalons(json.clinics || [])
      setIsNearbyMode(true)
    } catch {
      setNearbySalons([])
      setGpsError('Could not fetch nearby salons. Please try again.')
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

  const allSpecialties = specialties && specialties.length ? specialties : ['Haircut', 'Color', 'Spa', 'Nails', 'Makeup']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #2e1026; color: #f8fafc; }
        
        .find-nav { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(236,72,153,0.1); position: sticky; top: 0; z-index: 100; background: #2e1026; }
        .find-nav-logo { height: 32px; cursor: pointer; }
        .find-nav-btn { 
          background: transparent; 
          color: #ec4899; 
          border: 1px solid #ec4899; 
          padding: 8px 16px; 
          border-radius: 8px; 
          cursor: pointer; 
          font-weight: 600; 
          text-decoration: none; 
          transition: all 0.3s ease;
          box-shadow: 0 0 0 rgba(236,72,153,0);
        }
        .find-nav-btn:hover { 
          background: rgba(236,72,153,0.15); 
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 4px 16px rgba(236,72,153,0.4);
          color: #d38c97;
          border-color: #d38c97;
        }
        
        .layout-container { max-width: 1440px; margin: 0 auto; padding: 40px 32px; display: grid; grid-template-columns: minmax(400px, 1fr) 1.2fr; gap: 40px; min-height: calc(100vh - 72px); }
        .left-col { display: flex; flex-direction: column; }
        
        /* Map Dark Mode Hack */
        .right-col, .mobile-map-container { 
          border-radius: 20px; 
          overflow: hidden; 
          background: #3d1b35; 
          border: 1px solid rgba(255,255,255,0.05);
          position: relative;
        }
        .right-col { position: sticky; top: 112px; height: calc(100vh - 150px); }
        
        .right-col .leaflet-container, .mobile-map-container .leaflet-container {
          filter: invert(100%) hue-rotate(160deg) brightness(95%) contrast(90%) sepia(20%);
          background: #f9fafb !important; /* ensures proper inversion */
        }
        
        .page-title { font-size: 32px; font-weight: 800; color: #fff; margin-bottom: 8px; }
        .page-sub { color: #94a3b8; font-size: 16px; margin-bottom: 40px; }
        
        .search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .search-input-wrap { flex: 1; position: relative; }
        .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #64748b; }
        .search-input { width: 100%; padding: 16px 16px 16px 48px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 16px; outline: none; transition: border-color 0.2s; }
        .search-input:focus { border-color: #ec4899; }
        
        .btn-search { padding: 0 32px; height: 53px; background: #ec4899; color: #fff; border: none; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; transition: background 0.2s; }
        .btn-search:hover { background: #d38c97; }
        
        .filters-row { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
        
        .btn-near-me { padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #f8fafc; }
        .btn-near-me:hover { background: rgba(255,255,255,0.08); }
        .btn-near-me:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-near-me.active { background: rgba(236,72,153,0.1); border-color: #ec4899; color: #ec4899; }
        
        .status-filters { display: flex; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 8px; align-items: center; border: 1px solid rgba(255,255,255,0.05); }
        .status-filter-btn { padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .status-filter-btn.active { background: rgba(255,255,255,0.1); color: #fff; }
        .status-filter-btn.inactive { background: transparent; color: #64748b; }
        
        .filter-select { padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); font-size: 13px; color: #f8fafc; background: rgba(255,255,255,0.03); outline: none; cursor: pointer; }
        .filter-select option { background: #3d1b35; color: #fff; }
        
        .salon-list { display: flex; flex-direction: column; gap: 16px; padding-bottom: 40px; }
        
        /* Clinic Card */
        .salon-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; display: flex; justify-content: space-between; alignItems: center; flex-wrap: wrap; gap: 16px; transition: all 0.2s; cursor: pointer; }
        .salon-card:hover { border-color: rgba(236,72,153,0.3); background: rgba(255,255,255,0.04); }
        .salon-card.selected { border-color: #ec4899; background: rgba(236,72,153,0.05); }
        
        .cc-title { font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 8px; }
        .cc-meta { display: flex; gap: 16px; color: #94a3b8; font-size: 14px; flex-wrap: wrap; }
        .cc-meta-item { display: flex; align-items: center; gap: 4px; }
        
        .cc-right { display: flex; alignItems: center; gap: 24px; }
        .cc-wait-label { font-size: 13px; color: #94a3b8; margin-bottom: 4px; }
        .cc-wait-val { display: flex; align-items: center; gap: 6px; font-weight: 600; justify-content: flex-end; }
        
        .cc-btn { padding: 12px 24px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px; text-decoration: none; border: none; cursor: pointer; }
        .cc-btn-active { background: #ec4899; color: #fff; }
        .cc-btn-active:hover { background: #d38c97; }
        .cc-btn-disabled { background: rgba(255,255,255,0.1); color: #64748b; cursor: not-allowed; }
        
        .empty-state-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(46,16,38,0.85); padding: 32px; border-radius: 20px; backdrop-filter: blur(8px); display: flex; flex-direction: column; align-items: center; width: 340px; text-align: center; z-index: 10; border: 1px solid rgba(255,255,255,0.1); }
        .empty-icon-wrap { width: 64px; height: 64px; background: rgba(236,72,153,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .btn-invite { background: transparent; border: 1px solid #ec4899; color: #ec4899; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 8px; }
        
        .mobile-view-toggle { display: none; }
        
        @media (max-width: 1024px) {
          .layout-container { grid-template-columns: 1fr; padding: 24px; }
          .right-col { display: none; }
        }
        
        @media (max-width: 768px) {
          .find-nav { padding: 16px 20px; }
          .layout-container { padding: 16px; gap: 16px; margin-bottom: 24px; }
          .page-title { font-size: 26px; }
          .page-sub { font-size: 14px; margin-bottom: 24px; }
          
          .search-row { flex-direction: column; gap: 10px; }
          .search-input-wrap, .btn-search { width: 100%; }
          .btn-search { justify-content: center; }
          
          .cc-right { width: 100%; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
          .cc-wait-val { justify-content: flex-start; }
          
          .mobile-view-toggle { display: flex; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 8px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05); }
          .mobile-view-btn { flex: 1; text-align: center; padding: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border-radius: 6px; color: #94a3b8; transition: all 0.2s; }
          .mobile-view-btn.active { background: rgba(255,255,255,0.1); color: #fff; }
          
          .mobile-map-container { height: calc(100vh - 300px); min-height: 400px; }
        }
      `}</style>

      <nav className="find-nav">
        <a href="/">
          <img src="/logo-nav.svg" alt="TokenPe" className="find-nav-logo" />
        </a>
        <a href="/salon-login" className="find-nav-btn">
          Salon Login
        </a>
      </nav>

      <div className={`layout-container ${activeView === 'map' ? 'map-active' : ''}`}>
        <div className="left-col">
          <h1 className="page-title">Find a TokenPe Salon</h1>
          <p className="page-sub">Search by salon name, cuisine, or city to join a waitlist remotely.</p>
          
          <div className="search-row">
            <div className="search-input-wrap">
              <Search size={20} className="search-icon" />
              <input 
                className="search-input" 
                type="text" 
                placeholder="Search e.g., 'Salon in Mumbai'" 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
              />
            </div>
            <button className="btn-search">
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {gpsError && <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{gpsError}</div>}

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
              <MapComponent salons={displayedSalons} selectedSalon={selectedSalon} mapKey={mapMountKey}>
                {displayedSalons.length === 0 && !loading && !gpsLoading && <EmptyState />}
              </MapComponent>
            )}
          </div>

          <div className="filters-row">
            <button 
              onClick={handleFindNearMe} 
              disabled={gpsLoading}
              className={`btn-near-me ${isNearbyMode ? 'active' : ''}`}
            >
              <MapPin size={14} color={isNearbyMode ? "#ec4899" : "#64748b"} /> 
              {gpsLoading ? 'Locating...' : 'Near Me'}
            </button>
            <div className="status-filters">
              <div onClick={() => setStatusFilter('all')} className={`status-filter-btn ${statusFilter === 'all' ? 'active' : 'inactive'}`}>All</div>
              <div onClick={() => setStatusFilter('open')} className={`status-filter-btn ${statusFilter === 'open' ? 'active' : 'inactive'}`}>Open</div>
              <div onClick={() => setStatusFilter('paused')} className={`status-filter-btn ${statusFilter === 'paused' ? 'active' : 'inactive'}`}>Paused</div>
              <div onClick={() => setStatusFilter('closed')} className={`status-filter-btn ${statusFilter === 'closed' ? 'active' : 'inactive'}`}>Closed</div>
            </div>
            
            <select 
              className="filter-select"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">Any Service</option>
              {allSpecialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div className="salon-list">
            {(loading || gpsLoading) ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
            ) : displayedSalons.length > 0 ? (
              <>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px", color: "#f8fafc" }}>
                  {displayedSalons.length} {displayedSalons.length === 1 ? "Result" : "Results"} Found
                </h2>
                {displayedSalons.map(salon => (
                  <SalonCard 
                    key={salon.id || salon.code} 
                    salon={salon} 
                    isNearby={isNearbyMode} 
                    isSelected={selectedSalon && (selectedSalon.id === salon.id || selectedSalon.code === salon.code)}
                    onClick={() => {
                      setSelectedSalon(salon)
                      if (window.innerWidth <= 1024) {
                        setActiveView('map')
                        setMapMountKey(k => k + 1)
                      }
                    }}
                  />
                ))}
              </>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: "rgba(255,255,255,0.01)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                No salons found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Desktop-only sticky map sidebar */}
        <div className="right-col">
          <MapComponent salons={displayedSalons} selectedSalon={selectedSalon} mapKey={0}>
            {displayedSalons.length === 0 && !loading && !gpsLoading && <EmptyState />}
          </MapComponent>
        </div>
      </div>
    </>
  )
}
