'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  User, Building, Phone, MapPin, Globe, Camera, Save, CheckCircle2, 
  ArrowLeft, LayoutDashboard, Layers, History, BarChart2, Megaphone, 
  CreditCard, HelpCircle, AlertCircle, ShieldCheck, QrCode, Sparkles
} from 'lucide-react'

export default function EditProfilePage() {
  const router = useRouter()
  const [clinic, setClinic]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [sbTooltip, setSbTooltip]       = useState(null)

  // Profile Form States
  const [name, setName]                 = useState('')
  const [phone, setPhone]               = useState('')
  const [specialty, setSpecialty]       = useState('')
  const [address, setAddress]           = useState('')
  const [city, setCity]                 = useState('')
  const [area, setArea]                 = useState('')
  const [photoUrl, setPhotoUrl]         = useState('')
  const [upiId, setUpiId]               = useState('')
  const [isPublic, setIsPublic]         = useState(true)

  // Status States
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [successMsg, setSuccessMsg]     = useState(false)
  const [errorMsg, setErrorMsg]         = useState('')

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) { router.push('/login'); return }

      const c = JSON.parse(stored)
      
      // Fetch fresh clinic details
      let fresh = c
      try {
        const res = await fetch(`/api/clinics/get?id=${c.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.clinic) fresh = data.clinic
        }
      } catch (e) {}

      setClinic(fresh)
      setName(fresh.name || '')
      setPhone(fresh.phone || '')
      setSpecialty(fresh.specialty || 'General Physician')
      setAddress(fresh.address || '')
      setCity(fresh.city || '')
      setArea(fresh.area || '')
      setPhotoUrl(fresh.photo_url || fresh.logo_url || '')
      setUpiId(fresh.settings?.upi_id || fresh.upi_id || '')
      setIsPublic(fresh.is_public !== undefined ? fresh.is_public : true)

      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingLogo(true)
    setErrorMsg('')
    try {
      const fileName = `logos/${clinic.id}_${Date.now()}.png`
      const { error: uploadErr } = await supabase.storage.from('voice-notes').upload(fileName, file, { upsert: true })
      if (uploadErr) throw uploadErr
      
      const { data: { publicUrl } } = supabase.storage.from('voice-notes').getPublicUrl(fileName)
      setPhotoUrl(publicUrl)
    } catch (err) {
      setErrorMsg('Error uploading image: ' + err.message)
    }
    setUploadingLogo(false)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Clinic name cannot be empty.')
      return
    }

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg(false)

    try {
      const payload = {
        clinicId: clinic.id,
        businessId: clinic.id,
        name: name.trim(),
        phone: phone.trim(),
        specialty: specialty.trim(),
        address: address.trim(),
        city: city.trim(),
        area: area.trim(),
        photoUrl: photoUrl,
        isPublic: isPublic,
        upiId: upiId.trim()
      }

      // Try clinic update API first, fallback to business update API
      const res = await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const updatedClinic = {
          ...clinic,
          name: name.trim(),
          phone: phone.trim(),
          specialty: specialty.trim(),
          address: address.trim(),
          city: city.trim(),
          area: area.trim(),
          photo_url: photoUrl,
          logo_url: photoUrl,
          is_public: isPublic,
          upi_id: upiId.trim()
        }
        setClinic(updatedClinic)
        localStorage.setItem('tokenpe_clinic', JSON.stringify(updatedClinic))

        setSuccessMsg(true)
        setTimeout(() => setSuccessMsg(false), 4000)
      } else {
        // Fallback to /api/business/update
        const bRes = await fetch('/api/business/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const bData = await bRes.json()
        if (bRes.ok && bData.success) {
          setSuccessMsg(true)
          setTimeout(() => setSuccessMsg(false), 4000)
        } else {
          setErrorMsg(data.error || bData.error || 'Failed to update clinic profile.')
        }
      }
    } catch (err) {
      setErrorMsg('Error saving profile changes.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F2F7F2' }}>
      <aside className="dashboard-sidebar" style={{ width: 240, background: '#CBE4D3', borderRight: '1px solid #A8D5B5', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh' }}>
        <div style={{ padding: '0 4px', marginBottom: 28 }}>
          <img src="/logo-light.svg" alt="TokenPe" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-10 h-10 border-4 border-[#C3DBC7] border-t-[#2D6A4F] rounded-full animate-spin"></div>
      </div>
    </div>
  )

  const specialtiesList = [
    'General Physician', 'Pediatrics & Child Care', 'Orthopedics', 'Dermatology & Skin',
    'Cardiology', 'Gynecology & Obstetrics', 'ENT (Ear, Nose, Throat)', 'Ophthalmology (Eye)',
    'Dental & Oral Care', 'Neurology', 'Urology', 'Ayurvedic Medicine', 'Homeopathy'
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: '#F2F7F2', overflowX: 'hidden' }}>
      <style jsx global>{`
        .sidebar-btn {
          display: flex !important;
          align-items: center !important;
          flex-direction: row !important;
          gap: 10px !important;
          padding: 10px 14px !important;
          border-radius: 12px !important;
          background: transparent;
          color: #1E3A2B !important;
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          border: none !important;
          cursor: pointer !important;
          width: 100% !important;
          text-align: left !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          white-space: nowrap !important;
          overflow: hidden !important;
        }
        .sidebar-btn:hover {
          background: #BFE3CD !important;
          color: #064E3B !important;
          padding-left: 20px !important;
          box-shadow: 0 4px 12px rgba(6,78,59,0.08) !important;
        }
        .sidebar-btn.active {
          background: #BFE3CD !important;
          color: #064E3B !important;
          font-weight: 800 !important;
          box-shadow: inset 3px 0 0 #064E3B !important;
        }
        .sidebar-btn .sb-label {
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .profile-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease !important;
        }
        .profile-card:hover {
          box-shadow: 0 10px 25px rgba(6, 95, 70, 0.06) !important;
        }
      `}</style>
      
      {/* ── LEFT SIDEBAR NAVIGATION ── */}
      <aside className="dashboard-sidebar" style={{ width: 240, background: '#CBE4D3', borderRight: '1px solid #A8D5B5', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'visible' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', overflowX: 'hidden', flex: 1, paddingBottom: 8 }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', marginBottom: 28 }}>
            <img src="/logo-light.svg" alt="TokenPe" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Nav Group: Console */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1E3A2B', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 6 }}>Console</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Dashboard', desc: 'Live queue overview & clinic stats', icon: <LayoutDashboard className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard') },
                { label: 'Manage Branches', desc: 'Set up & switch between clinic locations under one account', icon: <Layers className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/branches') },
                { label: 'History', desc: 'Browse completed & past patient consultation records', icon: <History className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/history') },
                { label: 'Analytics & Reports', desc: 'Track peak OPD hours, average wait times, reason breakdowns, and patient-wise statistics.', icon: <BarChart2 className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/analytics') },
                { label: 'Broadcasting & CRM', desc: 'Send bulk WhatsApp alerts & manage patient relationships', icon: <Megaphone className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/crm') },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="sidebar-btn"
                  onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setSbTooltip({ label: item.label, desc: item.desc, y: r.top + r.height / 2 }) }}
                  onMouseLeave={() => setSbTooltip(null)}
                >
                  {item.icon}
                  <span className="sb-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#A8D5B5', margin: '14px 8px' }} />

          {/* Nav Group: Account */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Billing & Plans', desc: 'Manage your TokenPe subscription & plan features', icon: <CreditCard className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/billing') },
              { label: 'Help & Support', desc: 'Report bugs, raise issues & get in touch with our team', icon: <HelpCircle className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => router.push('/dashboard/help') },
              { label: 'Edit Profile', desc: 'Update clinic name, contact info & branding', icon: <User className="w-4 h-4" style={{ flexShrink: 0 }} />, onClick: () => {}, active: true },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`sidebar-btn${item.active ? ' active' : ''}`}
                onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setSbTooltip({ label: item.label, desc: item.desc, y: r.top + r.height / 2 }) }}
                onMouseLeave={() => setSbTooltip(null)}
              >
                {item.icon}
                <span className="sb-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Floating Hover Tooltip */}
      {sbTooltip && (
        <div style={{ position: 'fixed', left: 248, top: sbTooltip.y, transform: 'translateY(-50%)', background: '#0F291B', color: '#FFFFFF', padding: '10px 14px', borderRadius: 10, fontSize: '0.78rem', zIndex: 99999, pointerEvents: 'none', maxWidth: 220, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 800, marginBottom: 2, color: '#A7F3D0' }}>{sbTooltip.label}</div>
          <div style={{ fontSize: '0.72rem', color: '#D1FAE5', lineHeight: 1.3 }}>{sbTooltip.desc}</div>
        </div>
      )}

      {/* ── Main Content Container ── */}
      <main className="flex-grow lg:overflow-y-auto lg:h-screen">
        <form onSubmit={handleSaveProfile} className="max-w-[1040px] mx-auto p-4 sm:p-6 lg:p-10 space-y-8">

          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button type="button" onClick={() => router.push('/dashboard')} className="mb-2 text-[#065F46] font-bold text-[13px] hover:underline flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-[#111827]">Edit Clinic Profile</h1>
              <p className="text-sm text-[#6B7280]">Update your OPD details, clinic logo, contact numbers, and digital payment settings.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-2.5 bg-[#065F46] hover:bg-[#044E3A] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-[#065F46] p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#059669]" /> Clinic profile updated successfully!
            </div>
          )}

          {/* ── 1. CLINIC BRANDING & LOGO SECTION ── */}
          <div className="profile-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E5E7EB] flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#ECFDF5] border-2 border-[#A7F3D0] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                {photoUrl ? (
                  <img src={photoUrl} alt="Clinic Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-10 h-10 text-[#065F46]" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-[#065F46] text-white p-2 rounded-full cursor-pointer hover:bg-[#044E3A] transition-all shadow-md">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs font-black text-[#065F46] uppercase tracking-wider mb-1">Clinic Branding</div>
              <h2 className="text-lg font-black text-[#111827]">{name || 'Your Clinic Name'}</h2>
              <p className="text-xs text-[#6B7280] mt-1 mb-3">Upload your official logo or clinic banner to display on WhatsApp receipts and live queue screens.</p>
              
              <label className={`inline-flex items-center gap-2 text-xs font-bold text-[#065F46] bg-[#ECFDF5] px-4 py-2 rounded-xl border border-dashed border-[#A7F3D0] cursor-pointer hover:bg-teal-100 transition-all ${uploadingLogo ? 'opacity-70 cursor-wait' : ''}`}>
                <Camera className="w-3.5 h-3.5" />
                {uploadingLogo ? 'Uploading Image...' : 'Upload New Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
            </div>
          </div>

          {/* ── 2. BASIC CLINIC & DOCTOR INFORMATION ── */}
          <div className="profile-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E5E7EB] space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
              <Building className="w-5 h-5 text-[#065F46]" />
              <h2 className="text-lg font-black text-[#111827]">Clinic & Practice Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Clinic / OPD Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Sharma Super Speciality Clinic"
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Doctor Specialty</label>
                <select
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                >
                  {specialtiesList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">OPD Helpline Contact Phone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full p-3 pl-10 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Account Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={clinic?.email || 'clinic@tokenpe.in'}
                  className="w-full p-3 border border-[#E2E8F0] rounded-2xl text-xs font-semibold bg-gray-100 text-[#64748B] cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── 3. LOCATION & ADDRESS ── */}
          <div className="profile-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E5E7EB] space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
              <MapPin className="w-5 h-5 text-[#065F46]" />
              <h2 className="text-lg font-black text-[#111827]">Address & Location Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Full Clinic Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Shop 14, Sunrise Complex, Near Civil Hospital main gate"
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Area / Locality</label>
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. Kothrud"
                    className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. DIGITAL PAYMENTS & UPI SETUP ── */}
          <div className="profile-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E5E7EB] space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#065F46]" />
                <h2 className="text-lg font-black text-[#111827]">Digital Payments & UPI Setup</h2>
              </div>
              <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Direct Bank Deposit</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1.5">Clinic Virtual Payment Address (UPI ID)</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="e.g. drsharma@okicici or 9876543210@paytm"
                className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
              />
              <p className="text-[11px] text-[#64748B] mt-1.5">
                Patients scanning your TokenPe OPD QR code will be able to transfer consultation fees directly to your bank account with zero platform commission.
              </p>
            </div>
          </div>

          {/* ── 5. PUBLIC DISCOVERY TOGGLE ── */}
          <div className="profile-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E5E7EB] flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-5 h-5 text-[#065F46]" />
                <h3 className="text-base font-black text-[#111827]">Public Clinic Discovery Directory</h3>
              </div>
              <p className="text-xs text-[#6B7280]">Allow patients searching in your city on TokenPe Public Directory to locate your clinic and join your queue online.</p>
            </div>

            <label className="relative inline-block w-12 h-6 flex-shrink-0 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={e => setIsPublic(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-12 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#065F46]"></div>
            </label>
          </div>

          {/* Save Button Bar */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-3 bg-[#065F46] hover:bg-[#044E3A] text-white rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving Profile Changes...' : 'Save Profile Changes'}
            </button>
          </div>

        </form>
      </main>
    </div>
  )
}
