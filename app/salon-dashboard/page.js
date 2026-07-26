'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Scissors, Users, DollarSign, Calendar, Clock, Sparkles, Plus, CheckCircle, 
  XCircle, AlertCircle, Play, Pause, ChevronRight, Search, Settings, 
  TrendingUp, RefreshCw, LogOut, Copy, QrCode, Phone, Mail, MapPin, 
  Check, Award, FileText, Package, UserCheck, ShieldCheck, CreditCard, 
  Receipt, BarChart3, PieChart, Layers, UserPlus, Filter, Edit3, Trash2, ArrowUpRight
} from 'lucide-react'

// Default mock initial data if backend tables are fresh
const INITIAL_SERVICES = [
  { id: '1', name: 'Haircut & Styling (Men)', category: 'Hair', price: 499, duration: 30 },
  { id: '2', name: 'Hair Cut & Blowdry (Women)', category: 'Hair', price: 999, duration: 45 },
  { id: '3', name: 'Global Hair Color', category: 'Color', price: 2499, duration: 90 },
  { id: '4', name: 'Hydra Facial & Glow', category: 'Skincare', price: 1800, duration: 60 },
  { id: '5', name: 'Aroma Spa & Head Massage', category: 'Spa', price: 1200, duration: 40 }
]

const INITIAL_STAFF = [
  { id: 'st1', name: 'Rahul Sharma', role: 'stylist', specialty: 'Hair Styling & Color', commissionRate: 25, totalServices: 6, totalEarnings: 1850 },
  { id: 'st2', name: 'Priya Verma', role: 'stylist', specialty: 'Skincare & Facials', commissionRate: 30, totalServices: 4, totalEarnings: 1440 },
  { id: 'st3', name: 'Anish Kumar', role: 'manager', specialty: 'Salon Ops & Inventory', commissionRate: 15, totalServices: 0, totalEarnings: 0 },
  { id: 'st4', name: 'Sneha Patel', role: 'receptionist', specialty: 'Front Desk & Billing', commissionRate: 10, totalServices: 0, totalEarnings: 0 }
]

const INITIAL_INVENTORY = [
  { id: 'inv1', name: 'L’Oréal Professionnel Shampoo (1L)', category: 'Hair Care', stock: 12, minThreshold: 5, unit: 'bottles', pricePerUnit: 1400 },
  { id: 'inv2', name: 'Matrix Hair Color Tube - Dark Brown', category: 'Color', stock: 4, minThreshold: 8, unit: 'tubes', pricePerUnit: 450 },
  { id: 'inv3', name: 'O3+ Facial Glow Kit', category: 'Skincare', stock: 18, minThreshold: 6, unit: 'kits', pricePerUnit: 850 },
  { id: 'inv4', name: 'Disposable Spa Towels (Pack of 50)', category: 'Supplies', stock: 3, minThreshold: 10, unit: 'packs', pricePerUnit: 300 }
]

const INITIAL_CLIENTS = [
  { id: 'cl1', name: 'Anita Desai', phone: '9876543210', visits: 8, lastVisit: '2026-07-20', totalSpent: 12400, notes: 'Prefers ammonia-free hair color. Sensitive skin.' },
  { id: 'cl2', name: 'Vikram Mehta', phone: '9820011223', visits: 4, lastVisit: '2026-07-15', totalSpent: 3800, notes: 'Prefers Rahul for haircut. Likes mint tea.' },
  { id: 'cl3', name: 'Sunita Rao', phone: '9765432109', visits: 12, lastVisit: '2026-07-24', totalSpent: 24500, notes: 'Regular for facial every 3 weeks.' }
]

const INITIAL_QUEUE = [
  { id: 'q101', tokenNum: 'S-01', clientName: 'Amit Verma', phone: '9819922334', service: 'Haircut & Styling (Men)', stylist: 'Rahul Sharma', price: 499, status: 'serving', waitTimeMins: 0, joinedAt: '12:15 PM' },
  { id: 'q102', tokenNum: 'S-02', clientName: 'Pooja Kapoor', phone: '9833445566', service: 'Hydra Facial & Glow', stylist: 'Priya Verma', price: 1800, status: 'waiting', waitTimeMins: 15, joinedAt: '12:30 PM' },
  { id: 'q103', tokenNum: 'S-03', clientName: 'Karan Malhotra', phone: '9892003344', service: 'Aroma Spa & Head Massage', stylist: 'Rahul Sharma', price: 1200, status: 'waiting', waitTimeMins: 35, joinedAt: '12:45 PM' }
]

export default function SalonDashboard() {
  const router = useRouter()
  const [salon, setSalon] = useState(null)
  const [userRole, setUserRole] = useState('owner') // 'owner' | 'manager' | 'stylist' | 'receptionist'
  const [activeTab, setActiveTab] = useState('queue') // 'queue' | 'sales' | 'staff' | 'inventory' | 'crm' | 'services' | 'calendar'
  const [loading, setLoading] = useState(true)

  // Salon State
  const [queue, setQueue] = useState(INITIAL_QUEUE)
  const [completedToday, setCompletedToday] = useState([
    { id: 'qc1', tokenNum: 'S-00', clientName: 'Rohan Gupta', service: 'Hair Cut & Blowdry', stylist: 'Rahul Sharma', price: 999, paymentMode: 'UPI', completedAt: '11:45 AM' }
  ])
  const [isQueuePaused, setIsQueuePaused] = useState(false)
  const [services, setServices] = useState(INITIAL_SERVICES)
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [inventory, setInventory] = useState(INITIAL_INVENTORY)
  const [clients, setClients] = useState(INITIAL_CLIENTS)

  // Modals state
  const [showAddWalkin, setShowAddWalkin] = useState(false)
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [showAddInventory, setShowAddInventory] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  // Toast notifications
  const [toast, setToast] = useState(null)
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Form states
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newServiceId, setNewServiceId] = useState(INITIAL_SERVICES[0].id)
  const [newStylistId, setNewStylistId] = useState(INITIAL_STAFF[0].id)

  // Invoice modal state
  const [invClientName, setInvClientName] = useState('')
  const [invClientPhone, setInvClientPhone] = useState('')
  const [invServiceId, setInvServiceId] = useState(INITIAL_SERVICES[0].id)
  const [invPaymentMode, setInvPaymentMode] = useState('UPI')
  const [activeUpiQr, setActiveUpiQr] = useState(null)
  const [settingsUpiId, setSettingsUpiId] = useState('')

  // Staff Form
  const [staffFormName, setStaffFormName] = useState('')
  const [staffFormRole, setStaffFormRole] = useState('stylist')
  const [staffFormSpecialty, setStaffFormSpecialty] = useState('')
  const [staffFormCommission, setStaffFormCommission] = useState('25')

  // Load session & role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('tokenpe_salon_role') || 'owner'
      setUserRole(storedRole)

      const savedClinicStr = localStorage.getItem('tokenpe_clinic')
      if (savedClinicStr) {
        try {
          const parsed = JSON.parse(savedClinicStr)
          setSalon(parsed)
          setSettingsUpiId(parsed.upi_id || '')
        } catch (e) {
          console.error('Failed to parse clinic data', e)
        }
      } else {
        // Fallback default demo salon
        setSalon({
          id: 'demo-salon-1',
          name: 'Glamour Unisex Salon & Spa',
          code: 'GLAM99',
          phone: '9876543210',
          specialty: 'Unisex Salon',
          city: 'Mumbai'
        })
      }
      setLoading(false)
    }
  }, [])

  // Auto-switch default tab according to user role
  useEffect(() => {
    if (userRole === 'receptionist') setActiveTab('queue')
    else if (userRole === 'stylist') setActiveTab('calendar')
    else if (userRole === 'manager') setActiveTab('queue')
    else setActiveTab('queue')
  }, [userRole])

  // Call Next Client handler
  const handleCallNext = () => {
    const waitingList = queue.filter(q => q.status === 'waiting')
    if (waitingList.length === 0) {
      showToast('No clients currently waiting in queue!', 'info')
      return
    }
    const nextClient = waitingList[0]
    setQueue(prev => prev.map(q => q.id === nextClient.id ? { ...q, status: 'serving' } : q))
    showToast(`Called Token ${nextClient.tokenNum} (${nextClient.clientName}) to Chair!`)
  }

  // Complete Service handler
  const handleCompleteService = (id) => {
    const item = queue.find(q => q.id === id)
    if (!item) return

    setQueue(prev => prev.filter(q => q.id !== id))
    setCompletedToday(prev => [{
      id: `qc_${Date.now()}`,
      tokenNum: item.tokenNum,
      clientName: item.clientName,
      service: item.service,
      stylist: item.stylist,
      price: item.price,
      paymentMode: 'UPI',
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev])

    showToast(`Completed service for ${item.clientName}! Recorded ₹${item.price}.`)
  }

  // Add Walk-in Client
  const handleAddWalkinSubmit = (e) => {
    e.preventDefault()
    if (!newClientName || !newClientPhone) return

    const selectedSvc = services.find(s => s.id === newServiceId) || services[0]
    const selectedStf = staff.find(s => s.id === newStylistId) || staff[0]
    const nextTokenNum = `S-0${queue.length + completedToday.length + 1}`

    const newQueueItem = {
      id: `q_${Date.now()}`,
      tokenNum: nextTokenNum,
      clientName: newClientName,
      phone: newClientPhone,
      service: selectedSvc.name,
      stylist: selectedStf.name,
      price: selectedSvc.price,
      status: 'waiting',
      waitTimeMins: (queue.filter(q => q.status === 'waiting').length + 1) * 15,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setQueue(prev => [...prev, newQueueItem])
    setShowAddWalkin(false)
    setNewClientName('')
    setNewClientPhone('')
    showToast(`Added ${newClientName} to queue with Token ${nextTokenNum}!`)
  }

  // Generate UPI Invoice
  const handleGenerateInvoice = (e) => {
    e.preventDefault()
    
    if (!salon?.upi_id) {
      showToast('⚠️ Owner needs to configure Salon UPI ID in Settings first!', 'error')
      setShowAddInvoice(false)
      return
    }

    const svc = services.find(s => s.id === invServiceId) || services[0]
    const upiDeepLink = `upi://pay?pa=${salon.upi_id}&pn=${encodeURIComponent(salon?.name || 'Salon')}&am=${svc.price}&cu=INR`
    setActiveUpiQr({
      clientName: invClientName,
      serviceName: svc.name,
      amount: svc.price,
      upiDeepLink
    })
    showToast(`Generated ₹${svc.price} UPI Invoice for ${invClientName}!`)
  }

  // Update Settings Handler
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/clinics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: salon.id,
          upiId: settingsUpiId
        })
      })
      const data = await res.json()
      if (data.success) {
        const updatedSalon = { ...salon, upi_id: settingsUpiId }
        setSalon(updatedSalon)
        localStorage.setItem('tokenpe_clinic', JSON.stringify(updatedSalon))
        
        // Also update the array if needed
        const storedClinics = JSON.parse(localStorage.getItem('tokenpe_user_clinics') || '[]')
        const updatedClinics = storedClinics.map(c => c.id === updatedSalon.id ? updatedSalon : c)
        localStorage.setItem('tokenpe_user_clinics', JSON.stringify(updatedClinics))

        setShowSettings(false)
        showToast('Settings saved successfully!')
      } else {
        showToast('Failed to save settings: ' + data.error, 'error')
      }
    } catch (err) {
      showToast('Error saving settings', 'error')
    }
  }

  // Add Staff Handler
  const handleAddStaffSubmit = (e) => {
    e.preventDefault()
    if (!staffFormName) return
    const newStf = {
      id: `st_${Date.now()}`,
      name: staffFormName,
      role: staffFormRole,
      specialty: staffFormSpecialty || 'General Hairstylist',
      commissionRate: parseInt(staffFormCommission) || 20,
      totalServices: 0,
      totalEarnings: 0
    }
    setStaff(prev => [...prev, newStf])
    setShowAddStaff(false)
    setStaffFormName('')
    setStaffFormSpecialty('')
    showToast(`Added staff member ${staffFormName} (${staffFormRole})!`)
  }

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('tokenpe_clinic')
    localStorage.removeItem('clinicCode')
    localStorage.removeItem('clinicPhone')
    localStorage.removeItem('tokenpe_user_clinics')
    localStorage.removeItem('tokenpe_salon_role')
    router.push('/salon-login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          <span className="text-slate-400 font-medium">Loading TokenPe Salon Dashboard...</span>
        </div>
      </div>
    )
  }

  // Calculation Metrics
  const totalRevenueToday = completedToday.reduce((acc, curr) => acc + (curr.price || 0), 0)
  const totalServedToday = completedToday.length
  const totalWaiting = queue.filter(q => q.status === 'waiting').length
  const totalServing = queue.filter(q => q.status === 'serving').length

  return (
    <div className="min-h-screen bg-[#0d0914] text-slate-100 font-sans selection:bg-rose-500 selection:text-white pb-20">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:w-auto z-50 flex items-center gap-3 px-4 py-3 bg-rose-900/95 border border-rose-500/40 text-white rounded-2xl shadow-2xl backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-sm font-semibold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAVBAR — MOBILE FRIENDLY 2-ROW LAYOUT */}
      <header className="sticky top-0 z-40 bg-[#160f22]/95 backdrop-blur-xl border-b border-rose-900/30">
        {/* Row 1: Brand + Quick Actions */}
        <div className="flex items-center justify-between px-3 sm:px-5 lg:px-8 py-2.5 gap-2">
          
          {/* Salon Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-600/30 text-white shrink-0">
              <Scissors className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 flex-wrap leading-tight">
                <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">{salon?.name || 'TokenPe Salon'}</span>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-medium border border-rose-500/30 shrink-0">
                  {salon?.code || 'GLAM99'}
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1.5 mt-0.5">
                <span>{salon?.specialty || 'Unisex Salon'}</span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {userRole === 'owner' && (
              <button onClick={() => setShowSettings(true)} className="p-2 sm:p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-rose-400 transition-colors" title="Settings">
                <span className="text-lg">⚙️</span>
              </button>
            )}
            <button onClick={() => setShowQrModal(true)} className="p-2 sm:p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-rose-400 transition-colors" title="View Salon QR">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 sm:p-2.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/40 rounded-xl text-slate-400 hover:text-rose-300 transition-colors" title="Logout">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Row 2: Role Switcher — Full Width, Touch-Friendly */}
        <div className="px-3 sm:px-5 lg:px-8 pb-2">
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold px-1.5 shrink-0 hidden sm:inline">ROLE</span>
            {[
              { id: 'owner', label: 'Owner', icon: '👑' },
              { id: 'manager', label: 'Mgr', icon: '💼' },
              { id: 'stylist', label: 'Stylist', icon: '✂️' },
              { id: 'receptionist', label: 'Recep.', icon: '🏷️' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => {
                  setUserRole(r.id)
                  localStorage.setItem('tokenpe_salon_role', r.id)
                  showToast(`Switched to ${r.label} role!`, 'info')
                }}
                className={`flex-1 px-2 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                  userRole === r.id 
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 active:bg-slate-800'
                }`}
              >
                <span className="text-sm sm:text-xs">{r.icon}</span>
                <span className="hidden xs:inline sm:inline text-[11px] sm:text-xs">{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-4">

        {/* METRICS STATS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          
          {/* Waiting Count */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-[#160f22] border border-rose-900/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Waiting</span>
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalWaiting}</div>
            <p className="text-[10px] sm:text-xs text-rose-300/70 mt-0.5">~{totalWaiting * 15} mins</p>
          </div>

          {/* Currently Serving */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-[#160f22] border border-rose-900/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">In Chair</span>
              <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalServing}</div>
            <p className="text-[10px] sm:text-xs text-pink-300/70 mt-0.5">Active now</p>
          </div>

          {/* Served Today */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-[#160f22] border border-rose-900/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Done Today</span>
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalServedToday}</div>
            <p className="text-[10px] sm:text-xs text-emerald-300/70 mt-0.5">Served</p>
          </div>

          {/* Revenue */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-[#160f22] border border-rose-900/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Revenue</span>
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-3xl font-extrabold text-white break-all">
              {userRole === 'owner' || userRole === 'receptionist' ? `₹${totalRevenueToday}` : '🔒'}
            </div>
            <p className="text-[10px] sm:text-xs text-amber-300/70 mt-0.5">
              {userRole === 'owner' ? 'UPI + Cash' : 'Restricted'}
            </p>
          </div>
        </div>

        {/* ROLE TAB NAVIGATION */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 scrollbar-hide border-b border-slate-800 -mx-3 sm:-mx-4 lg:-mx-8 px-3 sm:px-4 lg:px-8">

          {/* Live Queue Tab (All Roles) */}
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'queue' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Queue
          </button>

          {/* Stylist Calendar */}
          {(userRole === 'stylist' || userRole === 'manager' || userRole === 'owner') && (
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'calendar' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {userRole === 'stylist' ? 'Schedule' : 'Schedules'}
            </button>
          )}

          {/* Revenue & Analytics (Owner Only) */}
          {userRole === 'owner' && (
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'sales' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Revenue
            </button>
          )}

          {/* Staff & Commissions */}
          {(userRole === 'owner' || userRole === 'stylist') && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'staff' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {userRole === 'stylist' ? 'Earnings' : 'Staff'}
            </button>
          )}

          {/* Inventory (Manager & Owner) */}
          {(userRole === 'owner' || userRole === 'manager') && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'inventory' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Stock
            </button>
          )}

          {/* Client CRM */}
          {(userRole === 'owner' || userRole === 'manager' || userRole === 'receptionist') && (
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'crm' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Clients
            </button>
          )}

          {/* Services & Pricing (Owner Only) */}
          {userRole === 'owner' && (
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'services' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Services
            </button>
          )}
        </div>

        {/* MAIN TAB CONTENT */}

        {/* ─── TAB 1: LIVE QUEUE & WALK-INS ─── */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="bg-[#160f22] p-3 sm:p-4 rounded-2xl border border-rose-900/20 space-y-2.5">
              {/* Primary Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCallNext}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4 fill-white" /> Call Next
                </button>

                {(userRole === 'owner' || userRole === 'manager' || userRole === 'receptionist') && (
                  <button
                    onClick={() => setShowAddWalkin(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-700"
                  >
                    <UserPlus className="w-4 h-4 text-rose-400" /> Walk-in
                  </button>
                )}

                {(userRole === 'receptionist' || userRole === 'owner') && (
                  <button
                    onClick={() => setShowAddInvoice(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                  >
                    <Receipt className="w-4 h-4" /> Bill & UPI
                  </button>
                )}

                <button
                  onClick={() => setIsQueuePaused(!isQueuePaused)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2 ${
                    isQueuePaused ? 'bg-amber-950/60 border-amber-800/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {isQueuePaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isQueuePaused ? 'Paused' : 'Pause'}
                </button>
              </div>
            </div>

            {/* QUEUE CARDS GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* CURRENTLY SERVING SECTION */}
              <div className="md:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Scissors className="w-4 h-4" /> Currently in Styling Chairs ({queue.filter(q => q.status === 'serving').length})
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {queue.filter(q => q.status === 'serving').length === 0 ? (
                    <div className="p-6 bg-[#160f22] border border-rose-900/20 rounded-2xl text-center text-slate-500 text-sm col-span-2">
                      No client is currently in the styling chair. Click &quot;Call Next Client&quot; above to start.
                    </div>
                  ) : (
                    queue.filter(q => q.status === 'serving').map(item => (
                      <div key={item.id} className="p-5 bg-gradient-to-br from-rose-950/40 to-[#160f22] border border-rose-500/40 rounded-2xl shadow-xl flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-3 py-1 bg-rose-600 text-white font-mono font-bold text-sm rounded-lg">
                              {item.tokenNum}
                            </span>
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-full flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> In Service
                            </span>
                          </div>

                          <h4 className="text-lg font-bold text-white mb-1">{item.clientName}</h4>
                          <p className="text-xs text-rose-200/80 mb-3">{item.service} • ₹{item.price}</p>

                          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-rose-900/30">
                            <span>Stylist: <strong className="text-slate-200">{item.stylist}</strong></span>
                            <span>Joined: {item.joinedAt}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-rose-900/30 flex items-center justify-end">
                          <button
                            onClick={() => handleCompleteService(item.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                          >
                            <CheckCircle className="w-4 h-4" /> Mark Complete & Bill
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* WAITING LIST SECTION */}
              <div className="md:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" /> Waiting List ({queue.filter(q => q.status === 'waiting').length})
                </h3>

                <div className="space-y-3">
                  {queue.filter(q => q.status === 'waiting').length === 0 ? (
                    <div className="p-6 bg-[#160f22] border border-slate-800 rounded-2xl text-center text-slate-500 text-sm">
                      Waiting queue is empty.
                    </div>
                  ) : (
                    queue.filter(q => q.status === 'waiting').map((item, idx) => (
                      <div key={item.id} className="p-3 sm:p-4 bg-[#160f22] border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-rose-400 font-mono font-bold flex items-center justify-center text-xs sm:text-sm border border-slate-800 shrink-0">
                            {item.tokenNum}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm sm:text-base truncate">{item.clientName}</div>
                            <div className="text-xs text-slate-400 truncate">{item.service}</div>
                            <div className="text-xs text-slate-500">→ <strong className="text-slate-400">{item.stylist}</strong></div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right hidden xs:block">
                              <div className="text-xs text-rose-400 font-semibold">~{item.waitTimeMins}m</div>
                              <div className="text-[10px] text-slate-500">#{idx + 1}</div>
                            </div>
                            <button
                              onClick={() => {
                                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'serving' } : q))
                                showToast(`Moved ${item.clientName} to styling chair!`)
                              }}
                              className="w-9 h-9 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center"
                              title="Move to Chair"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB 2: STYLIST SCHEDULES & NOTES ─── */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#160f22] border border-rose-900/20 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-400" /> 
                {userRole === 'stylist' ? 'My Assigned Appointments & Client Styling Notes' : 'All Stylist Calendars'}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Conflict-free slot schedule for today.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {staff.filter(s => s.role === 'stylist').map(stf => (
                  <div key={stf.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="font-bold text-white text-base">{stf.name}</h4>
                        <span className="text-xs text-rose-400 font-medium">{stf.specialty}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-lg">
                        {stf.commissionRate}% Commission
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Today&apos;s Assigned Clients</div>
                      {queue.filter(q => q.stylist === stf.name).length === 0 ? (
                        <div className="text-xs text-slate-500 py-2">No active queue assignments for {stf.name} right now.</div>
                      ) : (
                        queue.filter(q => q.stylist === stf.name).map(qItem => (
                          <div key={qItem.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                            <div>
                              <div className="font-semibold text-slate-200">{qItem.clientName} ({qItem.tokenNum})</div>
                              <div className="text-slate-400">{qItem.service}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${qItem.status === 'serving' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                              {qItem.status.toUpperCase()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: REVENUE & SALES REPORTS (OWNER ONLY) ─── */}
        {activeTab === 'sales' && userRole === 'owner' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-4 sm:p-6 bg-[#160f22] border border-rose-900/20 rounded-2xl md:col-span-2">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" /> Daily Revenue Breakdown
                </h3>
                <p className="text-xs text-slate-400 mb-4">Real-time payment collections</p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-sm text-slate-300 font-semibold flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" /> UPI Instant Payments
                    </span>
                    <span className="text-lg font-extrabold text-white">₹{totalRevenueToday}</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-sm text-slate-300 font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" /> Cash Collections
                    </span>
                    <span className="text-lg font-extrabold text-white">₹0</span>
                  </div>
                </div>
              </div>

              {/* Business Analytics */}
              <div className="p-4 sm:p-6 bg-[#160f22] border border-rose-900/20 rounded-2xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-400" /> Peak Business Analytics
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-slate-400 mb-1">Peak Operational Hour</div>
                    <div className="text-sm font-bold text-white">4:00 PM – 7:30 PM</div>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-slate-400 mb-1">Most Popular Service</div>
                    <div className="text-sm font-bold text-rose-400">Haircut & Blowdry (Women)</div>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="text-slate-400 mb-1">Repeat Customer Ratio</div>
                    <div className="text-sm font-bold text-emerald-400">68% Repeat Clients</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB 4: STAFF & COMMISSIONS ─── */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#160f22] border border-rose-900/20 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-rose-400" /> 
                    {userRole === 'stylist' ? 'My Commission & Service Earnings' : 'Staff Commission Overview'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {userRole === 'stylist' ? 'Your personal daily payouts and earnings' : 'Manage salon staff roles, commission rates & earnings'}
                  </p>
                </div>

                {userRole === 'owner' && (
                  <button
                    onClick={() => setShowAddStaff(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Plus className="w-4 h-4" /> Add New Staff
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {(userRole === 'stylist' ? staff.filter(s => s.name === 'Rahul Sharma') : staff).map(stf => (
                  <div key={stf.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white text-base">{stf.name}</div>
                      <div className="text-xs text-rose-400 capitalize">{stf.role} • {stf.specialty}</div>
                      <div className="text-xs text-slate-400 mt-2">Services Today: {stf.totalServices}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Commission ({stf.commissionRate}%)</div>
                      <div className="text-lg font-extrabold text-emerald-400">₹{stf.totalEarnings}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: INVENTORY & STOCK (MANAGER & OWNER) ─── */}
        {activeTab === 'inventory' && (userRole === 'owner' || userRole === 'manager') && (
          <div className="space-y-6">
            <div className="p-6 bg-[#160f22] border border-rose-900/20 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-rose-400" /> Salon Inventory & Stock Tracking
                  </h3>
                  <p className="text-xs text-slate-400">Monitor stock levels for shampoos, dyes, and spa supplies</p>
                </div>

                <button
                  onClick={() => showToast('Stock updated successfully!')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Stock
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Item Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Stock Level</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 font-bold text-white">{item.name}</td>
                        <td className="p-3.5 text-slate-400">{item.category}</td>
                        <td className="p-3.5 font-mono text-sm">{item.stock} {item.unit}</td>
                        <td className="p-3.5">
                          {item.stock <= item.minThreshold ? (
                            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold">
                              ⚠️ Low Stock (Reorder)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 6: CLIENT CRM ─── */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#160f22] border border-rose-900/20 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-rose-400" /> Client CRM & Treatment Notes
              </h3>
              <p className="text-xs text-slate-400 mb-6">Client visit history and hair/skin styling preferences</p>

              <div className="grid md:grid-cols-3 gap-4">
                {clients.map(c => (
                  <div key={c.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-base">{c.name}</h4>
                        <span className="text-xs text-slate-400">{c.phone}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-lg">
                        {c.visits} Visits
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-rose-200/90 font-medium">
                      💡 Notes: {c.notes}
                    </div>

                    <div className="text-xs text-slate-400 flex justify-between pt-2 border-t border-slate-800">
                      <span>Last visit: {c.lastVisit}</span>
                      <span className="font-bold text-emerald-400">Total: ₹{c.totalSpent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 7: SERVICES & PRICING (OWNER ONLY) ─── */}
        {activeTab === 'services' && userRole === 'owner' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#160f22] border border-rose-900/20 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-rose-400" /> Salon Service Menu & Pricing
                  </h3>
                  <p className="text-xs text-slate-400">Configure services offered, duration, and prices</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(svc => (
                  <div key={svc.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-base">{svc.name}</h4>
                      <span className="text-xs text-rose-400">{svc.category} • ~{svc.duration} mins</span>
                    </div>
                    <div className="text-lg font-extrabold text-white">₹{svc.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── MODAL 1: ADD WALK-IN CLIENT ─── */}
      <AnimatePresence>
        {showAddWalkin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#160f22] border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-rose-400" /> Add Walk-in Client
                </h3>
                <button onClick={() => setShowAddWalkin(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>

              <form onSubmit={handleAddWalkinSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Client Full Name *</label>
                  <input value={newClientName} onChange={e => setNewClientName(e.target.value)} required placeholder="e.g. Ramesh Kumar" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} required placeholder="9876543210" type="tel" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Service *</label>
                  <select value={newServiceId} onChange={e => setNewServiceId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500">
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Stylist</label>
                  <select value={newStylistId} onChange={e => setNewStylistId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500">
                    {staff.filter(s => s.role === 'stylist').map(stf => (
                      <option key={stf.id} value={stf.id}>{stf.name} ({stf.specialty})</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg transition-all mt-4">
                  Issue Token & Add to Queue →
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: COUNTER BILLING & INSTANT UPI QR ─── */}
      <AnimatePresence>
        {showAddInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#160f22] border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" /> Counter Billing & UPI QR
                </h3>
                <button onClick={() => { setShowAddInvoice(false); setActiveUpiQr(null); }} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>

              {!activeUpiQr ? (
                <form onSubmit={handleGenerateInvoice} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Client Name *</label>
                    <input value={invClientName} onChange={e => setInvClientName(e.target.value)} required placeholder="Client Name" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input value={invClientPhone} onChange={e => setInvClientPhone(e.target.value)} placeholder="9876543210" type="tel" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Select Service Billed *</label>
                    <select value={invServiceId} onChange={e => setInvServiceId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500">
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all mt-4">
                    Generate UPI QR Code →
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeUpiQr.upiDeepLink)}`} 
                      alt="UPI QR Code" 
                      className="w-48 h-48"
                    />
                  </div>

                  <div>
                    <div className="text-2xl font-extrabold text-white">₹{activeUpiQr.amount}</div>
                    <div className="text-xs text-emerald-400 font-semibold">{activeUpiQr.serviceName}</div>
                    <div className="text-xs text-slate-400 mt-1">Ask {activeUpiQr.clientName} to scan with Google Pay / PhonePe / Paytm</div>
                  </div>

                  <button
                    onClick={() => {
                      showToast('Payment verified successfully!')
                      setShowAddInvoice(false)
                      setActiveUpiQr(null)
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    Confirm Payment Received ✓
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 3: ADD STAFF (OWNER ONLY) ─── */}
      <AnimatePresence>
        {showAddStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#160f22] border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-rose-400" /> Add Salon Staff Member
                </h3>
                <button onClick={() => setShowAddStaff(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>

              <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Full Name *</label>
                  <input value={staffFormName} onChange={e => setStaffFormName(e.target.value)} required placeholder="e.g. Vikram Singh" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Role *</label>
                  <select value={staffFormRole} onChange={e => setStaffFormRole(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500">
                    <option value="stylist">Stylist / Hairstylist</option>
                    <option value="manager">Manager</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Specialty</label>
                  <input value={staffFormSpecialty} onChange={e => setStaffFormSpecialty(e.target.value)} placeholder="e.g. Hair Coloring, Facials" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Commission Rate (%)</label>
                  <input value={staffFormCommission} onChange={e => setStaffFormCommission(e.target.value)} type="number" placeholder="25" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
                </div>

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg transition-all mt-4">
                  Add Staff Member →
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 4: SETTINGS ─── */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#160f22] border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-xl">⚙️</span> Salon Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Direct UPI ID (for Counter Billing)</label>
                  <input value={settingsUpiId} onChange={e => setSettingsUpiId(e.target.value)} placeholder="e.g. yourname@sbi" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500" />
                  <p className="text-[10px] text-slate-500 mt-1">Payments will go directly to your bank account with 0% commission.</p>
                </div>

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg transition-all mt-4">
                  Save Settings
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 5: QR DISPLAY ─── */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm">
              {/* Standee Banner Design */}
              <div id="salon-qr-standee" className="bg-gradient-to-b from-rose-600 to-[#160f22] rounded-3xl p-6 shadow-2xl text-center border-4 border-[#160f22] overflow-hidden relative">
                
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full translate-x-10 translate-y-10" />

                <div className="relative z-10">
                  <h4 className="text-rose-200 text-xs font-bold uppercase tracking-widest mb-2">Welcome to</h4>
                  <h3 className="text-2xl font-extrabold text-white mb-6 leading-tight drop-shadow-md">
                    {salon?.name || 'Your Premium Salon'}
                  </h3>

                  <div className="bg-white p-5 rounded-3xl shadow-xl inline-block mb-6 relative">
                    {/* Corner accents for QR */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-rose-500 rounded-tl-xl -translate-x-2 -translate-y-2" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-rose-500 rounded-tr-xl translate-x-2 -translate-y-2" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-rose-500 rounded-bl-xl -translate-x-2 translate-y-2" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-rose-500 rounded-br-xl translate-x-2 translate-y-2" />
                    
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://wa.me/919892875513?text=JOIN%20${encodeURIComponent(salon?.code || 'GLAM99')}&bgcolor=ffffff&color=000000`} 
                      alt="Salon Queue QR" 
                      className="w-48 h-48"
                      crossOrigin="anonymous"
                    />
                  </div>

                  <p className="text-white font-bold text-sm mb-1">Scan to Join the Digital Queue</p>
                  <p className="text-rose-200/80 text-[10px] mb-4">Powered by TokenPe Salon</p>

                  <div className="text-xs font-mono bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white shadow-inner">
                    Manual Code: <strong className="text-rose-400 text-sm tracking-wider">{salon?.code || 'GLAM99'}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button onClick={() => {
                  showToast('Printing QR Standee...')
                  window.print()
                }} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700">
                  <span className="text-lg">🖨️</span> Print QR
                </button>
                <button onClick={() => setShowQrModal(false)} className="flex-1 py-3 bg-white hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-xl transition-all border border-transparent shadow-lg">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
