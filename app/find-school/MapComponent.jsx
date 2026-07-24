'use client'
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issues in Leaflet with Webpack/Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Teal custom icon for TokenPe
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230d9488" width="36px" height="36px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Invalidate the map size after mount so tiles load correctly when the
// container was hidden (display:none) during Leaflet's initialisation.
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    // Give the browser one frame to paint the container, then remeasure
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

function MarkerWithPopup({ school, isSelected }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker 
      position={[parseFloat(school.lat), parseFloat(school.lng)]}
      icon={customIcon}
      ref={markerRef}
    >
      <Popup>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{school.name}</div>
        <div style={{ fontSize: '12px', color: '#4b5563' }}>{school.specialty}</div>
      </Popup>
    </Marker>
  )
}

export default function LeafletMapComponent({ schools, selectedSchool, mapKey, children }) {
  const mapCenter = selectedSchool?.lat && selectedSchool?.lng 
    ? [parseFloat(selectedSchool.lat), parseFloat(selectedSchool.lng)]
    : schools.length > 0 && schools[0].lat && schools[0].lng
    ? [parseFloat(schools[0].lat), parseFloat(schools[0].lng)]
    : [20.5937, 78.9629]; // Default to India

  const mapZoom = selectedSchool ? 15 : schools.length > 0 ? 12 : 5;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
      {/* key forces a full remount when mapKey changes, fixing blank-tile issues */}
      <MapContainer 
        key={mapKey}
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ width: '100%', height: '100%' }}
        // Prevent scroll-zoom hijacking the page on mobile
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <InvalidateOnMount />
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {schools.map(school => {
          if (!school.lat || !school.lng) return null;
          const isSelected = selectedSchool && (selectedSchool.id === school.id || selectedSchool.code === school.code);
          return (
            <MarkerWithPopup 
              key={school.id || school.code} 
              school={school}
              isSelected={isSelected}
            />
          );
        })}
      </MapContainer>
      
      {/* Absolute positioned children (like empty state) */}
      {children && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ pointerEvents: 'auto' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

