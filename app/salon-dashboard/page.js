'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Scissors, Users, DollarSign, Calendar, Clock, Sparkles, Plus, CheckCircle, 
  XCircle, AlertCircle, Play, Pause, ChevronRight, Search, Settings, 
  TrendingUp, RefreshCw, LogOut, Copy, QrCode, Phone, Mail, MapPin, 
  Check, Award, FileText, Package, UserCheck, ShieldCheck, CreditCard, 
  Receipt, BarChart3, PieChart, Layers, UserPlus, Filter, Edit3, Trash2, ArrowUpRight,
  Menu, X, History, ChevronLeft
} from 'lucide-react'

// Default mock initial data
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
  { 
    id: 'cl1', name: 'Anita Desai', phone: '9876543210', visits: 8, lastVisit: '2026-07-20', totalSpent: 12400, 
    notes: 'Prefers ammonia-free hair color. Sensitive skin.',
    history: [
      { id: 'h1', date: '2026-07-20', service: 'Global Hair Color', stylist: 'Rahul Sharma', price: 2499, notes: 'Used INOA ammonia-free. Kept for 45 mins. Good result.' },
      { id: 'h2', date: '2026-06-10', service: 'Hair Cut & Blowdry', stylist: 'Priya Verma', price: 999, notes: 'U-cut with layers. Advised anti-frizz serum.' },
      { id: 'h3', date: '2026-05-02', service: 'Hydra Facial & Glow', stylist: 'Priya Verma', price: 1800, notes: 'Skin was dry. Recommend extra hydration.' }
    ]
  },
  { 
    id: 'cl2', name: 'Vikram Mehta', phone: '9820011223', visits: 4, lastVisit: '2026-07-15', totalSpent: 3800, 
    notes: 'Prefers Rahul for haircut. Likes mint tea.',
    history: [
      { id: 'h4', date: '2026-07-15', service: 'Haircut & Styling (Men)', stylist: 'Rahul Sharma', price: 499, notes: 'Classic fade. Trimmer on 2.' },
      { id: 'h5', date: '2026-06-05', service: 'Haircut & Styling (Men)', stylist: 'Rahul Sharma', price: 499, notes: 'Standard cut.' }
    ]
  },
  { 
    id: 'cl3', name: 'Sunita Rao', phone: '9765432109', visits: 12, lastVisit: '2026-07-24', totalSpent: 24500, 
    notes: 'Regular for facial every 3 weeks.',
    history: [
      { id: 'h6', date: '2026-07-24', service: 'Hydra Facial & Glow', stylist: 'Priya Verma', price: 1800, notes: 'Extra steam applied.' }
    ]
  }
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
  const [activeTab, setActiveTab] = useState('queue')
  const [loading, setLoading] = useState(true)

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // CRM State
  const [crmSearchDate, setCrmSearchDate] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientSearchQuery, setClientSearchQuery] = useState('')

  // Salon Data State
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

  const [invClientName, setInvClientName] = useState('')
  const [invClientPhone, setInvClientPhone] = useState('')
  const [invServiceId, setInvServiceId] = useState(INITIAL_SERVICES[0].id)
  const [activeUpiQr, setActiveUpiQr] = useState(null)
  const [settingsUpiId, setSettingsUpiId] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const savedClinicStr = localStorage.getItem('tokenpe_clinic')
        const savedRole = localStorage.getItem('tokenpe_salon_role')
        if (savedRole) setUserRole(savedRole)

        if (savedClinicStr) {
          const parsed = JSON.parse(savedClinicStr)
          setSalon(parsed)
          setSettingsUpiId(parsed.upi_id || '')
        }
      } catch (e) {
        console.error('Init Error', e)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleCallNext = () => {
    const nextWaiting = queue.find(q => q.status === 'waiting')
    if (!nextWaiting) {
      showToast('No clients in waiting queue!', 'error')
      return
    }
    setQueue(prev => prev.map(q => q.id === nextWaiting.id ? { ...q, status: 'serving' } : q))
    showToast(`Called ${nextWaiting.clientName} to styling chair.`)
  }

  const handleCompleteService = (id) => {
    const item = queue.find(q => q.id === id)
    if (!item) return
    setQueue(prev => prev.filter(q => q.id !== id))
    setCompletedToday(prev => [{
      id: `qc_${Date.now()}`, tokenNum: item.tokenNum, clientName: item.clientName, service: item.service, 
      stylist: item.stylist, price: item.price, paymentMode: 'UPI', completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev])
    showToast(`Completed service for ${item.clientName}! Recorded ₹${item.price}.`)
  }

  const handleAddWalkinSubmit = (e) => {
    e.preventDefault()
    if (!newClientName || !newClientPhone) return
    const selectedSvc = services.find(s => s.id === newServiceId) || services[0]
    const selectedStf = staff.find(s => s.id === newStylistId) || staff[0]
    const nextTokenNum = `S-0${queue.length + completedToday.length + 1}`
    const newQueueItem = {
      id: `q_${Date.now()}`, tokenNum: nextTokenNum, clientName: newClientName, phone: newClientPhone,
      service: selectedSvc.name, stylist: selectedStf.name, price: selectedSvc.price, status: 'waiting',
      waitTimeMins: (queue.filter(q => q.status === 'waiting').length + 1) * 15,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setQueue(prev => [...prev, newQueueItem])
    setShowAddWalkin(false)
    setNewClientName(''); setNewClientPhone('')
    showToast(`Added ${newClientName} to queue with Token ${nextTokenNum}!`)
  }

  const handleGenerateInvoice = (e) => {
    e.preventDefault()
    if (!salon?.upi_id) {
      showToast('⚠️ Owner needs to configure Salon UPI ID in Settings first!', 'error')
      setShowAddInvoice(false)
      return
    }
    const svc = services.find(s => s.id === invServiceId) || services[0]
    const upiDeepLink = `upi://pay?pa=${salon.upi_id}&pn=${encodeURIComponent(salon?.name || 'Salon')}&am=${svc.price}&cu=INR`
    setActiveUpiQr({ clientName: invClientName, serviceName: svc.name, amount: svc.price, upiDeepLink })
    showToast(`Generated ₹${svc.price} UPI Invoice for ${invClientName}!`)
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/clinics/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: salon.id, upiId: settingsUpiId })
      })
      const data = await res.json()
      if (data.success) {
        const updatedSalon = { ...salon, upi_id: settingsUpiId }
        setSalon(updatedSalon)
        localStorage.setItem('tokenpe_clinic', JSON.stringify(updatedSalon))
        setShowSettings(false)
        showToast('Settings saved successfully!')
      } else {
        showToast('Failed to save settings: ' + data.error, 'error')
      }
    } catch (err) {
      showToast('Error saving settings', 'error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('tokenpe_clinic')
    localStorage.removeItem('tokenpe_salon_role')
    router.push('/salon-login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          <span className="text-slate-500 font-medium text-sm">Loading Workspace...</span>
        </div>
      </div>
    )
  }

  const totalRevenueToday = completedToday.reduce((acc, curr) => acc + (curr.price || 0), 0)
  const totalServedToday = completedToday.length
  const totalWaiting = queue.filter(q => q.status === 'waiting').length
  const totalServing = queue.filter(q => q.status === 'serving').length

  const filteredHistory = selectedClient?.history.filter(h => {
    if (!crmSearchDate) return true
    return h.date === crmSearchDate
  }) || []

  const filteredClientsList = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
    c.phone.includes(clientSearchQuery)
  )

  const SIDEBAR_NAV = [
    { id: 'queue', label: 'Live Queue & Walk-ins', icon: Clock, roles: ['owner','manager','stylist','receptionist'] },
    { id: 'calendar', label: 'Appointments', icon: Calendar, roles: ['owner','manager','stylist'] },
    { id: 'sales', label: 'Revenue Analytics', icon: BarChart3, roles: ['owner'] },
    { id: 'staff', label: 'Staff & Commissions', icon: Award, roles: ['owner','stylist'] },
    { id: 'inventory', label: 'Stock & Inventory', icon: Package, roles: ['owner','manager'] },
    { id: 'crm', label: 'Client CRM & History', icon: UserCheck, roles: ['owner','manager','receptionist'] },
    { id: 'services', label: 'Services Menu', icon: Scissors, roles: ['owner'] }
  ]

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* ─── TOAST NOTIFICATIONS ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-xl shadow-2xl shadow-slate-900/20">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium tracking-wide">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── LEFT SIDEBAR (OVERLAY ON MOBILE) ─── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-2xl lg:shadow-none lg:static lg:block flex flex-col h-full"
            >
              {/* Sidebar Header */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                    <Scissors className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-sm truncate max-w-[140px]">{salon?.name || 'Salon'}</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide space-y-8">
                
                {/* Role Switcher */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Active Role</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'owner', label: 'Owner' }, { id: 'manager', label: 'Manager' },
                      { id: 'stylist', label: 'Stylist' }, { id: 'receptionist', label: 'Reception' }
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setUserRole(r.id); localStorage.setItem('tokenpe_salon_role', r.id)
                          showToast(`Switched to ${r.label} mode`, 'info')
                        }}
                        className={`px-3 py-2 rounded-lg text-[11px] font-semibold text-center transition-colors border ${
                          userRole === r.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Menu */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Navigation</h4>
                  <nav className="space-y-1">
                    {SIDEBAR_NAV.filter(nav => nav.roles.includes(userRole)).map(nav => (
                      <button
                        key={nav.id}
                        onClick={() => { setActiveTab(nav.id); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          activeTab === nav.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <nav.icon className={`w-4 h-4 ${activeTab === nav.id ? 'text-slate-900' : 'text-slate-400'}`} />
                        {nav.label}
                      </button>
                    ))}
                  </nav>
                </div>

              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-slate-100 shrink-0">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">System Status</div>
                    <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 capitalize hidden sm:block">
              {SIDEBAR_NAV.find(n => n.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'owner' && (
              <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors" title="Settings">
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setShowQrModal(true)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors" title="View Salon QR">
              <QrCode className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* DASHBOARD SCROLL AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* 4 STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Waiting</span>
                <div className="text-3xl font-extrabold text-slate-900">{totalWaiting}</div>
                <span className="text-xs text-slate-400 mt-1">~{totalWaiting * 15} mins</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">In Chair</span>
                <div className="text-3xl font-extrabold text-slate-900">{totalServing}</div>
                <span className="text-xs text-slate-400 mt-1">Active right now</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Served Today</span>
                <div className="text-3xl font-extrabold text-slate-900">{totalServedToday}</div>
                <span className="text-xs text-slate-400 mt-1">Completed</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Revenue</span>
                <div className="text-3xl font-extrabold text-slate-900">{userRole === 'owner' ? `₹${totalRevenueToday}` : '🔒'}</div>
                <span className="text-xs text-slate-400 mt-1">{userRole === 'owner' ? 'UPI + Cash' : 'Restricted view'}</span>
              </div>
            </div>

            {/* ─── TAB 1: LIVE QUEUE & WALK-INS ─── */}
            {activeTab === 'queue' && (
              <div className="space-y-6">
                
                {/* Action Bar */}
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleCallNext} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm">
                    <Play className="w-4 h-4 fill-white" /> Call Next
                  </button>
                  {(userRole === 'owner' || userRole === 'manager' || userRole === 'receptionist') && (
                    <button onClick={() => setShowAddWalkin(true)} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2 text-sm">
                      <UserPlus className="w-4 h-4" /> Add Walk-in
                    </button>
                  )}
                  {(userRole === 'receptionist' || userRole === 'owner') && (
                    <button onClick={() => setShowAddInvoice(true)} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2 text-sm">
                      <Receipt className="w-4 h-4" /> Bill & UPI
                    </button>
                  )}
                </div>

                {/* Queue Lists */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Currently Serving */}
                  <div className="lg:col-span-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-slate-400" /> In Styling Chairs ({queue.filter(q => q.status === 'serving').length})
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {queue.filter(q => q.status === 'serving').length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-white border border-slate-200 border-dashed rounded-2xl text-slate-400 text-sm">No clients currently in chairs.</div>
                      ) : (
                        queue.filter(q => q.status === 'serving').map(item => (
                          <div key={item.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm relative group hover:border-slate-300 transition-colors">
                            <div className="absolute top-4 right-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 font-mono text-xs font-bold rounded-md border border-slate-200">{item.tokenNum}</span></div>
                            <h4 className="font-bold text-slate-900 text-lg mb-1 pr-12">{item.clientName}</h4>
                            <div className="text-sm text-slate-600 mb-4">{item.service}</div>
                            <div className="text-xs text-slate-500 mb-5 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" /> Stylist: <strong className="text-slate-900">{item.stylist}</strong></div>
                            <button onClick={() => handleCompleteService(item.id)} className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Mark Complete
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Waiting List */}
                  <div className="lg:col-span-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" /> Waiting List ({queue.filter(q => q.status === 'waiting').length})
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {queue.filter(q => q.status === 'waiting').map(item => (
                        <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-slate-900">{item.clientName}</h4>
                              <span className="text-xs text-slate-500">Wait: ~{item.waitTimeMins} mins</span>
                            </div>
                            <span className="px-2 py-1 bg-slate-50 text-slate-500 font-mono text-xs font-bold rounded-md border border-slate-200">{item.tokenNum}</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <strong>Service:</strong> {item.service} <br/>
                            <strong>Prefers:</strong> {item.stylist}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB: CRM & HISTORY ─── */}
            {activeTab === 'crm' && (
              <div className="space-y-6">
                {!selectedClient ? (
                  /* Client Directory View */
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Client Directory</h3>
                        <p className="text-xs text-slate-500">Search and view customer histories.</p>
                      </div>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Search name or phone..." 
                          value={clientSearchQuery}
                          onChange={e => setClientSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClientsList.map(c => (
                          <div key={c.id} onClick={() => setSelectedClient(c)} className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md group">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-slate-700 transition-colors">{c.name}</h4>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">{c.phone}</div>
                              </div>
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
                                {c.visits} Visits
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-3 flex items-center justify-between pt-3 border-t border-slate-100">
                              <span>Last: {c.lastVisit}</span>
                              <span className="font-semibold flex items-center gap-1 text-slate-400 group-hover:text-slate-900 transition-colors">
                                View History <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Client Detailed History View */
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[700px]">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={() => { setSelectedClient(null); setCrmSearchDate(''); }} className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors shadow-sm">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-900">{selectedClient.name}</h3>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedClient.phone} • Total Spent: ₹{selectedClient.totalSpent}</p>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <span className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm">
                          {selectedClient.visits} Lifetime Visits
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      {/* Left: General Notes */}
                      <div className="w-full md:w-1/3 p-5 border-r border-slate-100 bg-white overflow-y-auto">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Client Profile Notes</h4>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed min-h-[150px]">
                          {selectedClient.notes || 'No general notes available.'}
                        </div>
                      </div>
                      
                      {/* Right: Visit History */}
                      <div className="w-full md:w-2/3 p-5 bg-slate-50 overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <History className="w-4 h-4" /> Service History
                          </h4>
                          <div className="relative">
                            <input 
                              type="date" 
                              value={crmSearchDate}
                              onChange={e => setCrmSearchDate(e.target.value)}
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 shadow-sm focus:outline-none focus:border-slate-400"
                            />
                            {crmSearchDate && (
                              <button onClick={() => setCrmSearchDate('')} className="absolute right-[-24px] top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {filteredHistory.length === 0 ? (
                            <div className="text-center p-8 text-sm text-slate-400 bg-white border border-slate-200 border-dashed rounded-xl">
                              No history found for this date.
                            </div>
                          ) : (
                            filteredHistory.map(h => (
                              <div key={h.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="font-bold text-slate-900 text-base">{h.service}</div>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{h.date}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-extrabold text-slate-900">₹{h.price}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Paid</div>
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 mb-3">
                                  <strong>Notes:</strong> {h.notes}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <Scissors className="w-3.5 h-3.5 text-slate-400" /> Stylist: <span className="font-semibold text-slate-700">{h.stylist}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Placeholder for other tabs */}
            {['calendar', 'sales', 'staff', 'inventory', 'services'].includes(activeTab) && (
              <div className="p-12 text-center bg-white border border-slate-200 border-dashed rounded-2xl">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1 capitalize">{activeTab} module</h3>
                <p className="text-sm text-slate-500">This module has been streamlined into the new light theme.</p>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ─── MODALS ─── */}
      <AnimatePresence>
        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Salon Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Direct UPI ID</label>
                  <input value={settingsUpiId} onChange={e => setSettingsUpiId(e.target.value)} placeholder="e.g. yourname@sbi" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all" />
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Payments will go directly to your bank account via Counter Billing QR.</p>
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all mt-2">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* QR Display Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm">
              <div id="salon-qr-standee" className="bg-white rounded-3xl p-6 shadow-2xl text-center border border-slate-200 relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Welcome to</h4>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-6 leading-tight">{salon?.name || 'Your Premium Salon'}</h3>
                  <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 inline-block mb-6 relative">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://wa.me/919892875513?text=JOIN%20${encodeURIComponent(salon?.code || 'GLAM99')}&bgcolor=ffffff&color=0f172a`} alt="Salon Queue QR" className="w-48 h-48" crossOrigin="anonymous" />
                  </div>
                  <p className="text-slate-900 font-bold text-sm mb-1">Scan to Join Digital Queue</p>
                  <p className="text-slate-400 text-[10px] mb-5 uppercase tracking-wider">Powered by TokenPe Salon</p>
                  <div className="text-xs font-mono bg-slate-50 p-3 rounded-2xl border border-slate-200 text-slate-600">
                    Manual Code: <strong className="text-slate-900 font-bold tracking-wider">{salon?.code || 'GLAM99'}</strong>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { showToast('Printing QR Standee...'); window.print(); }} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                  <span className="text-base">🖨️</span> Print QR
                </button>
                <button onClick={() => setShowQrModal(false)} className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all">
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
