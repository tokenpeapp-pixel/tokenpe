'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import ClinicSidebar from '../../../components/ClinicSidebar'
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

  // Bot Settings
  const [botTimings, setBotTimings]     = useState('')
  const [botLocation, setBotLocation]   = useState('')
  const [botLocationUrl, setBotLocationUrl] = useState('')
  const [botDoctors, setBotDoctors]     = useState('')
  const [googleReviewLink, setGoogleReviewLink] = useState('')

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
      
      setBotTimings(fresh.bot_timings || '')
      setBotLocation(fresh.bot_location || '')
      setBotLocationUrl(fresh.bot_location_url || '')
      setBotDoctors(fresh.bot_doctors || '')
      setGoogleReviewLink(fresh.google_review_link || '')

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
        upiId: upiId.trim(),
        botTimings: botTimings.trim(),
        botLocation: botLocation.trim(),
        botLocationUrl: botLocationUrl.trim(),
        botDoctors: botDoctors.trim(),
        googleReviewLink: googleReviewLink.trim()
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
          upi_id: upiId.trim(),
          bot_timings: botTimings.trim(),
          bot_location: botLocation.trim(),
          bot_location_url: botLocationUrl.trim(),
          bot_doctors: botDoctors.trim(),
          google_review_link: googleReviewLink.trim()
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F2F7F2] font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <ClinicSidebar clinic={clinic} />
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-8">
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F2F7F2] font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <ClinicSidebar clinic={clinic} />

      {/* ── Main Content Container ── */}
      <main className="flex-grow lg:overflow-y-auto lg:h-screen">
        <form onSubmit={handleSaveProfile} className="max-w-[1040px] mx-auto p-4 sm:p-6 lg:p-10 space-y-8">

          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button type="button" onClick={() => router.push('/dashboard')} className="hidden lg:inline-flex mb-2 text-[#065F46] font-bold text-[13px] hover:underline items-center gap-1">
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

          {/* ── 5. WHATSAPP BOT CONFIGURATION ── */}
          <div className="profile-card bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E5E7EB] space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
              <Megaphone className="w-5 h-5 text-[#065F46]" />
              <div>
                <h2 className="text-lg font-black text-[#111827]">WhatsApp Patient Assistant</h2>
                <p className="text-xs text-[#6B7280]">Configure the information your automated WhatsApp bot will send to patients.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Clinic Timings</label>
                <textarea
                  rows={2}
                  value={botTimings}
                  onChange={e => setBotTimings(e.target.value)}
                  placeholder="e.g. Mon-Fri: 10 AM - 2 PM, Sat-Sun: Closed"
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Doctors Available</label>
                <textarea
                  rows={2}
                  value={botDoctors}
                  onChange={e => setBotDoctors(e.target.value)}
                  placeholder="e.g. Dr. Rajesh (Cardiologist), Dr. Neha (Pediatrics)"
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Location Instructions</label>
                <textarea
                  rows={2}
                  value={botLocation}
                  onChange={e => setBotLocation(e.target.value)}
                  placeholder="e.g. Opposite City Mall, near the Metro Station"
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Google Maps Link</label>
                <input
                  type="url"
                  value={botLocationUrl}
                  onChange={e => setBotLocationUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Google Review Link</label>
                <input
                  type="url"
                  value={googleReviewLink}
                  onChange={e => setGoogleReviewLink(e.target.value)}
                  placeholder="https://g.page/review/..."
                  className="w-full p-3 border border-[#CBD5E1] rounded-2xl text-xs font-semibold outline-none focus:border-[#065F46] bg-gray-50 focus:bg-white transition-all text-[#111827]"
                />
                <p className="text-[11px] text-[#64748B] mt-1.5">
                  If patients leave a 4-star or 5-star rating on WhatsApp, they will automatically be sent this link to rate you publicly on Google!
                </p>
              </div>
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
