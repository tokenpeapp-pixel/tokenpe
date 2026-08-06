const fs = require('fs');

let content = fs.readFileSync('app/school-dashboard/page.js', 'utf8');
const start = content.indexOf('function DiscoveryProfileModal');
let end = content.indexOf('\n}\n', start);
if (end === -1) end = content.indexOf('\r\n}\r\n', start);
end += 3;

const newModal = `function DiscoveryProfileModal({ clinic, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false)
  const [schoolName, setSchoolName] = useState(clinic?.name || '')
  const [institutionType, setInstitutionType] = useState(clinic?.specialty || 'School')
  const [customType, setCustomType] = useState('')
  const [city, setCity] = useState(clinic?.city || '')
  const [area, setArea] = useState(clinic?.area || '')
  const [phone, setPhone] = useState(clinic?.phone === '0000000000' ? '' : clinic?.phone || '')
  const [gpsStatus, setGpsStatus] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setGpsStatus('success') },
      err => { console.error(err); setGpsStatus('error') },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  async function handleSave() {
    const finalType = institutionType === 'Other' ? (customType || 'Other') : institutionType
    if (!schoolName || !city || !finalType) return alert('Institution Name, City and Type are required.')
    if (!phone || phone.length < 10) return alert('A valid 10-digit WhatsApp number is required.')
    
    setSaving(true)
    try {
      const res = await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: clinic.id, name: schoolName, specialty: finalType, city, area, phone, lat, lng })
      })
      if (res.ok) {
        onSuccess({ name: schoolName, specialty: finalType, city, area, phone, lat, lng })
        onClose()
      } else {
        alert('Failed to save profile.')
      }
    } catch (e) {
      alert('Error: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div className="discovery-modal-container" style={{ backgroundColor: '#09090b', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.15), transparent 70%)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 440, maxHeight: '90vh', color: 'white', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflowY: 'auto', fontFamily: "'Inter', sans-serif" }}>
        
        {clinic?.phone !== '0000000000' && clinic?.specialty && clinic?.city && (
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 16, cursor: 'pointer', zIndex: 10 }}>✕</button>
        )}
        <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Building size={48} color="#0ea5e9" style={{ filter: 'drop-shadow(0 0 10px rgba(14,165,233,0.3))' }} /></div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0' }}>Setup Institution Profile</h2>
          <p style={{ color: '#94A3B8', fontSize: 14, margin: 0, lineHeight: 1.5 }}>Fill in details to set up your campus dashboard and gate control.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>Institution Name *</label>
            <input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="e.g. Ashbourne Academy" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', outline: 'none', fontSize: 15 }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>Institution Type *</label>
            <div style={{ position: 'relative' }}>
              <select value={institutionType} onChange={e => setInstitutionType(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', outline: 'none', fontSize: 15, appearance: 'none', cursor: 'pointer' }}>
                <option value="School">School</option>
                <option value="College">College</option>
                <option value="University">University</option>
                <option value="Coaching Institute">Coaching Institute</option>
                <option value="Kindergarten">Kindergarten / Pre-school</option>
                <option value="Training Center">Training Center</option>
                <option value="Other">Other (Type your own)</option>
              </select>
              <ChevronDown size={18} color="#64748b" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            {institutionType === 'Other' && (
              <input 
                autoFocus
                value={customType} 
                onChange={e => setCustomType(e.target.value)} 
                placeholder="Type your institution type..." 
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', outline: 'none', fontSize: 15, marginTop: 10 }} 
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>City *</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', outline: 'none', fontSize: 15 }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>Local Area</label>
            <input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Andheri West, Bandra" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', outline: 'none', fontSize: 15 }} />
            <div style={{ marginTop: 6, fontSize: 13, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 6 }}>
              {gpsStatus === 'loading' ? <span style={{ color: '#94a3b8' }}>Getting location...</span> : gpsStatus === 'success' ? <><CheckCircle2 size={14} /> <span>Location secured</span></> : <span style={{ color: '#94a3b8' }}>Location failed (Optional)</span>}
            </div>
          </div>

          {clinic?.phone === '0000000000' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>WhatsApp Number * (Admin)</label>
              <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\\D/g, ''))} placeholder="10-digit number" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', outline: 'none', fontSize: 15 }} />
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 14, borderRadius: 12, background: '#0284c7', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', cursor: saving ? 'wait' : 'pointer', marginTop: 8, boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)', transition: 'background 0.2s ease' }}>
            {saving ? 'Saving Profile...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
`;

content = content.substring(0, start) + newModal + content.substring(end);
fs.writeFileSync('app/school-dashboard/page.js', content, 'utf8');
console.log('Successfully patched school-dashboard/page.js with customized modal!');
