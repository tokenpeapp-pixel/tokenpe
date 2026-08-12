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
      { id: 'h1', date: '2026-07-20', service: 'Global Hair Color', stylist: 'Rahul Sharma', price: 2499, rating: 5, notes: 'Used INOA ammonia-free. Kept for 45 mins. Good result.' },
      { id: 'h2', date: '2026-06-10', service: 'Hair Cut & Blowdry', stylist: 'Priya Verma', price: 999, rating: 4, notes: 'U-cut with layers. Advised anti-frizz serum.' },
      { id: 'h3', date: '2026-05-02', service: 'Hydra Facial & Glow', stylist: 'Priya Verma', price: 1800, rating: 5, notes: 'Skin was dry. Recommend extra hydration.' }
    ]
  },
  {
    id: 'cl2', name: 'Vikram Mehta', phone: '9820011223', visits: 4, lastVisit: '2026-07-15', totalSpent: 3800,
    notes: 'Prefers Rahul for haircut. Likes mint tea.',
    history: [
      { id: 'h4', date: '2026-07-15', service: 'Haircut & Styling (Men)', stylist: 'Rahul Sharma', price: 499, rating: 5, notes: 'Classic fade. Trimmer on 2.' },
      { id: 'h5', date: '2026-06-05', service: 'Haircut & Styling (Men)', stylist: 'Rahul Sharma', price: 499, rating: 4, notes: 'Standard cut.' }
    ]
  },
  {
    id: 'cl3', name: 'Sunita Rao', phone: '9765432109', visits: 12, lastVisit: '2026-07-24', totalSpent: 24500,
    notes: 'Regular for facial every 3 weeks.',
    history: [
      { id: 'h6', date: '2026-07-24', service: 'Hydra Facial & Glow', stylist: 'Priya Verma', price: 1800, rating: 5, notes: 'Extra steam applied.' }
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
  const [queue, setQueue] = useState([])
  const [completedToday, setCompletedToday] = useState([])
  const [isQueuePaused, setIsQueuePaused] = useState(false)
  const [services, setServices] = useState(INITIAL_SERVICES)
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [inventory, setInventory] = useState(INITIAL_INVENTORY)
  const [clients, setClients] = useState([])

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
  const [settingsName, setSettingsName] = useState('')
  const [settingsAddress, setSettingsAddress] = useState('')

  // QR modal state
  const [editSalonCode, setEditSalonCode] = useState('')
  const [qrBgColor, setQrBgColor] = useState('#ffffff')
  const [qrFgColor, setQrFgColor] = useState('#0f172a')
  const [qrLogoFile, setQrLogoFile] = useState(null)
  const [qrLogoUrl, setQrLogoUrl] = useState('')

  // Service price editing
  const [editingPrices, setEditingPrices] = useState({})

  const fetchQueueData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/business/queue/get?date=${today}`)
      const data = await res.json()
      if (data.success) {
        setQueue(data.queue.filter(q => q.status !== 'completed' && q.status !== 'skipped').map(q => ({
          id: q.id, tokenNum: q.token_num, clientName: q.client_name, phone: q.phone,
          service: q.service, stylist: q.stylist, price: q.price, status: q.status,
          joinedAt: new Date(q.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          waitTimeMins: Math.floor((new Date() - new Date(q.joined_at)) / 60000)
        })))
        setCompletedToday(data.history.map(h => ({
          id: h.id, tokenNum: h.queue_id || h.id.slice(0, 8), clientName: h.salon_customers?.name || 'Customer', 
          service: h.service, stylist: h.stylist, price: h.price, paymentMode: 'UPI', 
          completedAt: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })))
        setClients(data.clients.map(c => ({
          id: c.id, name: c.name, phone: c.phone, visits: c.visits, totalSpent: c.total_spent,
          notes: c.notes, lastVisit: c.last_visit ? new Date(c.last_visit).toLocaleDateString() : '',
          history: [] // Client history can be fetched specifically later
        })))
      }
    } catch (e) { console.error('Fetch Queue Error', e) }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const savedClinicStr = localStorage.getItem('tokenpe_business')
        const savedRole = localStorage.getItem('tokenpe_salon_role')
        if (savedRole) setUserRole(savedRole)
        if (savedClinicStr) {
          const parsed = JSON.parse(savedClinicStr)
          setSalon(parsed)
          setSettingsUpiId(parsed.upi_id || '')
          setSettingsName(parsed.name || '')
          setSettingsAddress(parsed.address || '')
          setEditSalonCode(parsed.code || '')
        }
      } catch (e) {
        console.error('Init Error', e)
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (salon?.id) {
      fetchQueueData()
      const interval = setInterval(fetchQueueData, 10000) // Auto refresh every 10s
      return () => clearInterval(interval)
    }
  }, [salon?.id])

  const handleCallNext = async () => {
    const nextWaiting = queue.find(q => q.status === 'waiting')
    if (!nextWaiting) {
      showToast('No clients in waiting queue!', 'error')
      return
    }
    try {
      const res = await fetch('/api/business/queue/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: nextWaiting.id, status: 'serving' })
      })
      if (res.ok) {
        showToast(`Called ${nextWaiting.clientName} to styling chair.`)
        fetchQueueData()
      }
    } catch (e) { showToast('Error updating queue', 'error') }
  }

  const handleCompleteService = async (id) => {
    const item = queue.find(q => q.id === id)
    if (!item) return
    try {
      const res = await fetch('/api/business/queue/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: id, status: 'completed' })
      })
      if (res.ok) {
        showToast(`Completed service for ${item.clientName}! Recorded ₹${item.price}.`)
        fetchQueueData()
      }
    } catch (e) { showToast('Error completing service', 'error') }
  }

  const handleAddWalkinSubmit = async (e) => {
    e.preventDefault()
    if (!newClientName || !newClientPhone) return
    const selectedSvc = services.find(s => s.id === newServiceId) || services[0]
    const selectedStf = staff.find(s => s.id === newStylistId) || staff[0]
    
    try {
      const res = await fetch('/api/business/queue/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClientName, phone: newClientPhone, service: selectedSvc.name, stylist: selectedStf.name, price: selectedSvc.price })
      })
      if (res.ok) {
        showToast(`Added ${newClientName} to queue!`)
        setShowAddWalkin(false)
        setNewClientName(''); setNewClientPhone('')
        fetchQueueData()
      } else {
        showToast('Failed to add to queue', 'error')
      }
    } catch (e) { showToast('Error adding to queue', 'error') }
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
      const res = await fetch('/api/business/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: salon.id, upiId: settingsUpiId, name: settingsName, address: settingsAddress })
      })
      const data = await res.json()
      if (data.success) {
        const updatedSalon = { ...salon, upi_id: settingsUpiId, name: settingsName, address: settingsAddress }
        setSalon(updatedSalon)
        localStorage.setItem('tokenpe_business', JSON.stringify(updatedSalon))
        setShowSettings(false)
        showToast('Settings saved successfully!')
      } else {
        showToast('Failed to save: ' + data.error, 'error')
      }
    } catch (err) {
      showToast('Error saving settings', 'error')
    }
  }

  const handleSaveSalonCode = async () => {
    if (!editSalonCode.trim()) return
    try {
      const res = await fetch('/api/business/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: salon.id, code: editSalonCode.trim().toUpperCase() })
      })
      const data = await res.json()
      if (data.success) {
        const updated = { ...salon, code: editSalonCode.trim().toUpperCase() }
        setSalon(updated)
        localStorage.setItem('tokenpe_business', JSON.stringify(updated))
        showToast('Salon code updated!')
      } else {
        showToast('Failed to update code: ' + data.error, 'error')
      }
    } catch { showToast('Error updating code', 'error') }
  }

  const handleSalonSubscribe = async () => {
    if (!salon?.id) return
    showToast('Opening payment gateway...')
    try {
      const res = await fetch('/api/razorpay/salon-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonId: salon.id })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        showToast(data.error || 'Failed to initiate payment', 'error')
        return
      }
      // Load Razorpay script dynamically if not already loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'TokenPe Salon',
        description: 'Full Package – Monthly Subscription',
        image: '/logo-nav.svg',
        prefill: {
          name: data.salonName,
          email: data.salonEmail,
          contact: data.salonPhone,
        },
        theme: { color: '#D14D72' },
        handler: () => {
          showToast('🎉 Subscribed! Welcome to the Full Package!')
          setTimeout(() => window.location.reload(), 2000)
        },
      })
      rzp.open()
    } catch (e) {
      showToast('Payment error: ' + e.message, 'error')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/business-auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout error', e)
    }
    localStorage.removeItem('tokenpe_business')
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
    { id: 'queue', label: 'Live Queue & Walk-ins', icon: Clock, roles: ['owner', 'manager', 'stylist', 'receptionist'] },
    { id: 'calendar', label: 'Appointments', icon: Calendar, roles: ['owner', 'manager', 'stylist'] },
    { id: 'sales', label: 'Revenue Analytics', icon: BarChart3, roles: ['owner'] },
    { id: 'staff', label: 'Staff & Commissions', icon: Award, roles: ['owner', 'stylist'] },
    { id: 'inventory', label: 'Stock & Inventory', icon: Package, roles: ['owner', 'manager'] },
    { id: 'crm', label: 'Client CRM & History', icon: UserCheck, roles: ['owner', 'manager', 'receptionist'] },
    { id: 'services', label: 'Services Menu', icon: Scissors, roles: ['owner'] },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard, roles: ['owner'] }
  ]

  return (
    <div className="flex h-screen font-sans overflow-hidden" style={{background:'#F9F9F9',color:'#1A1A1A'}}>

      {/* ─── TOAST NOTIFICATIONS ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl" style={{background:'#1A1A1A',color:'#fff'}}>
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium tracking-wide">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── LEFT SIDEBAR (OVERLAY ON MOBILE) ─── */}
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 shadow-2xl lg:shadow-none lg:static lg:block flex flex-col h-full transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{background:'#FDF8F9',borderRight:'1px solid #EFEFEF'}}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0" style={{borderBottom:'1px solid #EFEFEF'}}>
          <div className="flex items-center gap-2">
            <img src="/logo-nav.svg" alt="TokenPe" className="h-7 w-auto" />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-lg" style={{color:'#6B7280'}}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide space-y-8">

          {/* Role Switcher */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3 px-2" style={{color:'#6B7280'}}>Active Role</h4>
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
                  className="px-3 py-2 rounded-lg text-[11px] font-semibold text-center transition-all"
                  style={userRole === r.id
                    ? {background:'#D14D72',color:'#fff',border:'1px solid #D14D72',boxShadow:'0 1px 4px rgba(209,77,114,0.25)'}
                    : {background:'#fff',color:'#6B7280',border:'1px solid #EFEFEF'}
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Menu */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2 px-2" style={{color:'#6B7280'}}>Navigation</h4>
            <nav className="space-y-1">
              {SIDEBAR_NAV.filter(nav => nav.roles.includes(userRole)).map(nav => (
                <button
                  key={nav.id}
                  onClick={() => { setActiveTab(nav.id); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={activeTab === nav.id
                    ? {background:'#FBEAEF',color:'#D14D72',fontWeight:600}
                    : {color:'#6B7280'}
                  }
                  onMouseEnter={e => { if(activeTab !== nav.id) e.currentTarget.style.background='#FDF0F3'; }}
                  onMouseLeave={e => { if(activeTab !== nav.id) e.currentTarget.style.background=''; }}
                >
                  <nav.icon className="w-4 h-4" style={{color: activeTab === nav.id ? '#D14D72' : '#9CA3AF'}} />
                  {nav.label}
                </button>
              ))}
            </nav>
          </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-4 shrink-0" style={{borderTop:'1px solid #EFEFEF'}}>
          <div className="p-3 rounded-xl flex items-center justify-between" style={{background:'#FDF0F3',border:'1px solid #EFEFEF'}}>
            <div>
              <div className="text-[10px] font-bold uppercase" style={{color:'#6B7280'}}>System Status</div>
              <div className="text-xs font-semibold flex items-center gap-1.5 mt-0.5" style={{color:'#10b981'}}>
                <span className="w-1.5 h-1.5 rounded-full" style={{background:'#10b981'}} /> Online
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">

        {/* HEADER */}
        <header className="h-16 bg-white shrink-0 flex items-center justify-between px-4 sm:px-8" style={{borderBottom:'1px solid #EFEFEF'}}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-lg lg:hidden transition-colors hover:bg-gray-100" style={{color:'#6B7280'}}>
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{color:'#1A1A1A'}}>
              <Scissors className="w-5 h-5" style={{color:'#D14D72'}} />
              <span className="truncate max-w-[140px] sm:max-w-none">{salon?.name || 'TokenPe Salon'}</span>
              <span className="hidden sm:inline" style={{color:'#D14D72'}}>|</span> 
              <span className="capitalize hidden sm:inline" style={{color:'#6B7280'}}>{SIDEBAR_NAV.find(n => n.id === activeTab)?.label}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'owner' && (
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg transition-colors" style={{color:'#6B7280'}} onMouseEnter={e=>e.currentTarget.style.background='#F3F4F6'} onMouseLeave={e=>e.currentTarget.style.background=''} title="Settings">
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setShowQrModal(true)} className="p-2 rounded-lg transition-colors" style={{color:'#6B7280'}} onMouseEnter={e=>e.currentTarget.style.background='#F3F4F6'} onMouseLeave={e=>e.currentTarget.style.background=''} title="View Salon QR">
              <QrCode className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg transition-colors" style={{color:'#6B7280'}} onMouseEnter={e=>{e.currentTarget.style.background='#FBEAEF';e.currentTarget.style.color='#D14D72'}} onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.color='#6B7280'}} title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* DASHBOARD SCROLL AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* 4 STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label:'Waiting', value: totalWaiting, sub:`~${totalWaiting*15} mins` },
                { label:'In Chair', value: totalServing, sub:'Active right now' },
                { label:'Served Today', value: totalServedToday, sub:'Completed' },
                { label:'Revenue', value: userRole==='owner'?`₹${totalRevenueToday}`:'🔒', sub: userRole==='owner'?'UPI + Cash':'Restricted view' }
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity:0, y:14 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.35, delay: i*0.07, ease:'easeOut' }}
                  whileHover={{ y:-4, boxShadow:'0 12px 30px rgba(209, 77, 114, 0.15)', borderColor:'#D14D72' }}
                  className="p-5 bg-white rounded-2xl flex flex-col transition-all cursor-default"
                  style={{border:'1px solid #EFEFEF', borderLeft:`3px solid #D14D72`}}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color:'#6B7280'}}>{card.label}</span>
                  <div className="text-3xl font-extrabold" style={{color:'#1A1A1A'}}>{card.value}</div>
                  <span className="text-xs mt-1" style={{color:'#9CA3AF'}}>{card.sub}</span>
                </motion.div>
              ))}
            </div>

            {/* ─── TAB 1: LIVE QUEUE & WALK-INS ─── */}
            {activeTab === 'queue' && (
              <div className="space-y-6">

                {/* Action Bar */}
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleCallNext} className="px-5 py-2.5 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all" style={{background:'#D14D72',transform:'scale(1)'}} onMouseEnter={e=>{e.currentTarget.style.background='#C0405F';e.currentTarget.style.transform='scale(1.02)'}} onMouseLeave={e=>{e.currentTarget.style.background='#D14D72';e.currentTarget.style.transform='scale(1)'}}>
                    <Play className="w-4 h-4 fill-white" /> Call Next
                  </button>
                  <button onClick={() => {setIsQueuePaused(!isQueuePaused); showToast(isQueuePaused ? 'Queue resumed' : 'Queue paused');}} className="px-5 py-2.5 font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all" style={{background: isQueuePaused ? '#FEF2F2' : '#F3F4F6',color: isQueuePaused ? '#EF4444' : '#4B5563',border:`1px solid ${isQueuePaused ? '#FCA5A5' : '#E5E7EB'}`}}>
                    {isQueuePaused ? <Play className="w-4 h-4" /> : <span className="font-bold text-lg leading-none" style={{transform:'translateY(-1px)'}}>II</span>}
                    {isQueuePaused ? 'Resume Queue' : 'Pause Queue'}
                  </button>
                  {(userRole === 'owner' || userRole === 'manager' || userRole === 'receptionist') && (
                    <button disabled={isQueuePaused} onClick={() => {if(!isQueuePaused) setShowAddWalkin(true)}} className={`px-5 py-2.5 font-medium rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all ${isQueuePaused ? 'opacity-50 cursor-not-allowed' : ''}`} style={{background:'#FBEAEF',color:'#D14D72',border:'1px solid #D14D72'}} onMouseEnter={e=>{if(!isQueuePaused) {e.currentTarget.style.background='#F5D6E2';e.currentTarget.style.transform='scale(1.02)'}}} onMouseLeave={e=>{if(!isQueuePaused) {e.currentTarget.style.background='#FBEAEF';e.currentTarget.style.transform='scale(1)'}}}>
                      <UserPlus className="w-4 h-4" /> Add Walk-in
                    </button>
                  )}
                  {(userRole === 'receptionist' || userRole === 'owner') && (
                    <button onClick={() => setShowAddInvoice(true)} className="px-5 py-2.5 font-medium rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all" style={{background:'#FBEAEF',color:'#D14D72',border:'1px solid #D14D72',transform:'scale(1)'}} onMouseEnter={e=>{e.currentTarget.style.background='#F5D6E2';e.currentTarget.style.transform='scale(1.02)'}} onMouseLeave={e=>{e.currentTarget.style.background='#FBEAEF';e.currentTarget.style.transform='scale(1)'}}>
                      <Receipt className="w-4 h-4" /> Bill & UPI
                    </button>
                  )}
                </div>

                {/* Queue Lists */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Currently Serving */}
                  <div className="lg:col-span-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{color:'#1A1A1A'}}>
                       <Scissors className="w-4 h-4" style={{color:'#D14D72'}} /> In Styling Chairs ({queue.filter(q => q.status === 'serving').length})
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {queue.filter(q => q.status === 'serving').length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-white rounded-2xl text-sm" style={{border:'1px dashed #EFEFEF',color:'#9CA3AF'}}>No clients currently in chairs.</div>
                      ) : (
                        queue.filter(q => q.status === 'serving').map(item => (
                          <div key={item.id} className="p-5 bg-white rounded-2xl shadow-sm relative group transition-shadow hover:shadow-md" style={{border:'1px solid #EFEFEF'}}>
                            <div className="absolute top-4 right-4"><span className="px-2 py-1 font-mono text-xs font-bold rounded-md" style={{background:'#FBEAEF',color:'#D14D72',border:'1px solid #F5D6E2'}}>{item.tokenNum}</span></div>
                            <h4 className="font-bold text-lg mb-1 pr-12" style={{color:'#1A1A1A'}}>{item.clientName}</h4>
                            <div className="text-sm mb-4" style={{color:'#6B7280'}}>{item.service}</div>
                            <div className="text-xs mb-5 flex items-center gap-1.5" style={{color:'#6B7280'}}><Scissors className="w-3.5 h-3.5" style={{color:'#D14D72'}} /> Stylist: <strong style={{color:'#1A1A1A'}}>{item.stylist}</strong></div>
                            <button onClick={() => handleCompleteService(item.id)} className="w-full py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all" style={{background:'#FBEAEF',color:'#D14D72',border:'1px solid #F5D6E2'}} onMouseEnter={e=>e.currentTarget.style.background='#F5D6E2'} onMouseLeave={e=>e.currentTarget.style.background='#FBEAEF'}>
                              <CheckCircle className="w-4 h-4" /> Mark Complete
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Waiting List */}
                  <div className="lg:col-span-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{color:'#1A1A1A'}}>
                       <Clock className="w-4 h-4" style={{color:'#D14D72'}} /> Waiting List ({queue.filter(q => q.status === 'waiting').length})
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {queue.filter(q => q.status === 'waiting').map(item => (
                        <div key={item.id} className="p-4 bg-white rounded-2xl shadow-sm transition-shadow hover:shadow-md" style={{border:'1px solid #EFEFEF'}}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold" style={{color:'#1A1A1A'}}>{item.clientName}</h4>
                              <span className="text-xs" style={{color:'#6B7280'}}>Wait: ~{item.waitTimeMins} mins</span>
                            </div>
                            <span className="px-2 py-1 font-mono text-xs font-bold rounded-md" style={{background:'#FBEAEF',color:'#D14D72',border:'1px solid #F5D6E2'}}>{item.tokenNum}</span>
                          </div>
                          <div className="text-xs mt-2 p-2 rounded-lg" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#6B7280'}}>
                            <strong style={{color:'#1A1A1A'}}>Service:</strong> {item.service} <br />
                            <strong style={{color:'#1A1A1A'}}>Prefers:</strong> {item.stylist}
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
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]" style={{border:'1px solid #EFEFEF'}}>
                    <div className="p-5 flex flex-col sm:flex-row justify-between gap-4" style={{borderBottom:'1px solid #EFEFEF',background:'#FDF8F9'}}>
                      <div>
                        <h3 className="text-lg font-bold" style={{color:'#1A1A1A'}}>Client Directory</h3>
                        <p className="text-xs" style={{color:'#6B7280'}}>Search and view customer histories.</p>
                      </div>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#9CA3AF'}} />
                        <input
                          type="text"
                          placeholder="Search name or phone..."
                          value={clientSearchQuery}
                          onChange={e => setClientSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white rounded-xl text-sm shadow-sm outline-none transition-all"
                          style={{border:'1px solid #EFEFEF',color:'#1A1A1A'}}
                          onFocus={e=>{e.currentTarget.style.borderColor='#D14D72';e.currentTarget.style.boxShadow='0 0 0 2px rgba(209,77,114,0.1)'}}
                          onBlur={e=>{e.currentTarget.style.borderColor='#EFEFEF';e.currentTarget.style.boxShadow=''}}
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClientsList.map(c => (
                          <div key={c.id} onClick={() => setSelectedClient(c)} className="p-4 bg-white rounded-xl cursor-pointer shadow-sm transition-all group" style={{border:'1px solid #EFEFEF'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#D14D72';e.currentTarget.style.boxShadow='0 4px 12px rgba(209,77,114,0.08)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#EFEFEF';e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.04)'}}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold" style={{color:'#1A1A1A'}}>{c.name}</h4>
                                <div className="text-xs font-mono mt-0.5" style={{color:'#6B7280'}}>{c.phone}</div>
                              </div>
                              <span className="px-2 py-1 text-[10px] font-bold rounded-lg" style={{background:'#FBEAEF',color:'#D14D72',border:'1px solid #F5D6E2'}}>
                                {c.visits} Visits
                              </span>
                            </div>
                            <div className="text-xs mt-3 flex items-center justify-between pt-3" style={{borderTop:'1px solid #EFEFEF',color:'#6B7280'}}>
                              <span>Last: {c.lastVisit}</span>
                              <span className="font-semibold flex items-center gap-1" style={{color:'#D14D72'}}>
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
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-[700px]" style={{border:'1px solid #EFEFEF'}}>
                    <div className="p-5 flex items-center justify-between" style={{borderBottom:'1px solid #EFEFEF',background:'#FDF8F9'}}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => { setSelectedClient(null); setCrmSearchDate(''); }} className="p-2 bg-white rounded-lg shadow-sm transition-colors" style={{border:'1px solid #EFEFEF',color:'#6B7280'}} onMouseEnter={e=>e.currentTarget.style.background='#FBEAEF'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <h3 className="text-xl font-extrabold" style={{color:'#1A1A1A'}}>{selectedClient.name}</h3>
                          <p className="text-xs font-mono mt-0.5" style={{color:'#6B7280'}}>{selectedClient.phone} • Total Spent: ₹{selectedClient.totalSpent}</p>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <span className="px-3 py-1.5 text-white text-xs font-bold rounded-lg shadow-sm" style={{background:'#D14D72'}}>
                          {selectedClient.visits} Lifetime Visits
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      {/* Left: General Notes */}
                      <div className="w-full md:w-1/3 p-5 bg-white overflow-y-auto" style={{borderRight:'1px solid #EFEFEF'}}>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#6B7280'}}>Client Profile Notes</h4>
                        <div className="p-4 rounded-xl text-sm leading-relaxed min-h-[150px]" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}}>
                          {selectedClient.notes || 'No general notes available.'}
                        </div>
                      </div>

                      {/* Right: Visit History */}
                      <div className="w-full md:w-2/3 p-5 overflow-y-auto" style={{background:'#FDF8F9'}}>
                        <div className="flex items-center justify-between mb-5">
                          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{color:'#6B7280'}}>
                            <History className="w-4 h-4" style={{color:'#D14D72'}} /> Service History
                          </h4>
                          <div className="relative">
                            <input
                              type="date"
                              value={crmSearchDate}
                              onChange={e => setCrmSearchDate(e.target.value)}
                              className="px-3 py-1.5 bg-white rounded-lg text-xs shadow-sm outline-none"
                              style={{border:'1px solid #EFEFEF',color:'#1A1A1A'}}
                              onFocus={e=>e.currentTarget.style.borderColor='#D14D72'}
                              onBlur={e=>e.currentTarget.style.borderColor='#EFEFEF'}
                            />
                            {crmSearchDate && (
                              <button onClick={() => setCrmSearchDate('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1" style={{color:'#9CA3AF'}}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs uppercase" style={{color:'#6B7280',background:'#FDF8F9'}}>
                                <tr>
                                  <th className="px-4 py-3 font-semibold rounded-tl-xl">Date</th>
                                  <th className="px-4 py-3 font-semibold">Service</th>
                                  <th className="px-4 py-3 font-semibold">Stylist</th>
                                  <th className="px-4 py-3 font-semibold">Rating</th>
                                  <th className="px-4 py-3 font-semibold rounded-tr-xl text-right">Paid</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y" style={{borderColor:'#EFEFEF'}}>
                                {filteredHistory.length === 0 ? (
                                  <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center" style={{color:'#9CA3AF'}}>No visits found in this date range.</td>
                                  </tr>
                                ) : (
                                  filteredHistory.map((v, i) => (
                                    <tr key={i} className="transition-colors" onMouseEnter={e=>e.currentTarget.style.background='#FBEAEF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="font-semibold" style={{color:'#1A1A1A'}}>{v.date}</div>
                                        <div className="text-[10px] mt-0.5" style={{color:'#9CA3AF'}}>{v.time}</div>
                                      </td>
                                      <td className="px-4 py-4">
                                        <div className="font-semibold" style={{color:'#1A1A1A'}}>{v.service}</div>
                                        {v.note && <div className="text-[10px] mt-0.5 px-2 py-1 rounded inline-block" style={{background:'#FBEAEF',color:'#D14D72'}}>{v.note}</div>}
                                      </td>
                                      <td className="px-4 py-4 font-medium" style={{color:'#6B7280'}}>{v.stylist}</td>
                                      <td className="px-4 py-4">
                                        {v.rating ? (
                                          <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, idx) => (
                                              <svg key={idx} className={`w-3.5 h-3.5 ${idx < v.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                              </svg>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-xs" style={{color:'#9CA3AF'}}>No rating</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-4 text-right font-bold" style={{color:'#1A1A1A'}}>₹{v.price}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {filteredHistory.length === 0 ? (
                            <div className="text-center p-8 text-sm bg-white rounded-xl" style={{border:'1px dashed #EFEFEF',color:'#9CA3AF'}}>
                              No history found for this date.
                            </div>
                          ) : (
                            filteredHistory.map(h => (
                              <div key={h.id} className="p-4 bg-white rounded-xl shadow-sm transition-shadow hover:shadow-md" style={{border:'1px solid #EFEFEF'}}>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="font-bold text-base" style={{color:'#1A1A1A'}}>{h.service}</div>
                                    <div className="text-xs font-mono mt-0.5" style={{color:'#6B7280'}}>{h.date}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-extrabold" style={{color:'#D14D72'}}>₹{h.price}</div>
                                    <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{color:'#9CA3AF'}}>Paid</div>
                                  </div>
                                </div>
                                <div className="p-3 rounded-lg text-xs mb-3" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#6B7280'}}>
                                  <strong style={{color:'#1A1A1A'}}>Notes:</strong> {h.notes}
                                </div>
                                <div className="text-xs flex items-center gap-1.5" style={{color:'#6B7280'}}>
                                  <Scissors className="w-3.5 h-3.5" style={{color:'#D14D72'}} /> Stylist: <span className="font-semibold" style={{color:'#1A1A1A'}}>{h.stylist}</span>
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
            {activeTab === 'services' && userRole === 'owner' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{border:'1px solid #EFEFEF'}}>
                <div className="p-5 flex items-center justify-between" style={{borderBottom:'1px solid #EFEFEF',background:'#FDF8F9'}}>
                  <div>
                    <h3 className="text-lg font-bold" style={{color:'#1A1A1A'}}>Services Menu</h3>
                    <p className="text-xs" style={{color:'#6B7280'}}>Edit pricing directly. Changes apply to new walk-ins immediately.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{background:'#FDF8F9',borderBottom:'1px solid #EFEFEF'}}>
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color:'#6B7280'}}>Service</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color:'#6B7280'}}>Category</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color:'#6B7280'}}>Duration</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color:'#6B7280'}}>Price (₹)</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{color:'#6B7280'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{borderColor:'#EFEFEF'}}>
                      {services.map(svc => (
                        <tr key={svc.id} className="transition-colors" onMouseEnter={e=>e.currentTarget.style.background='#FDF8F9'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <td className="px-5 py-4 font-semibold" style={{color:'#1A1A1A'}}>{svc.name}</td>
                          <td className="px-5 py-4">
                            <span className="px-2 py-1 text-[10px] font-bold rounded-md" style={{background:'#FBEAEF',color:'#D14D72'}}>{svc.category}</span>
                          </td>
                          <td className="px-5 py-4" style={{color:'#6B7280'}}>{svc.duration} min</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span style={{color:'#6B7280'}}>₹</span>
                              <input
                                type="number"
                                defaultValue={svc.price}
                                onChange={e => setEditingPrices(prev => ({...prev, [svc.id]: parseInt(e.target.value)||0}))}
                                className="w-24 rounded-lg px-2 py-1.5 text-sm font-bold outline-none"
                                style={{border:'1px solid #EFEFEF',color:'#1A1A1A',background:'#fff'}}
                                onFocus={e=>{e.currentTarget.style.borderColor='#D14D72';e.currentTarget.style.boxShadow='0 0 0 2px rgba(209,77,114,0.1)'}}
                                onBlur={e=>{e.currentTarget.style.borderColor='#EFEFEF';e.currentTarget.style.boxShadow=''}}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => {
                                const newPrice = editingPrices[svc.id]
                                if (newPrice !== undefined) {
                                  setServices(prev => prev.map(s => s.id === svc.id ? {...s, price: newPrice} : s))
                                  showToast(`Price updated to ₹${newPrice} for ${svc.name}`)
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                              style={{background:'#D14D72',color:'#fff'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#C0405F'}
                              onMouseLeave={e=>e.currentTarget.style.background='#D14D72'}
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {['calendar', 'sales', 'staff', 'inventory'].includes(activeTab) && (
              <div className="p-12 text-center bg-white rounded-2xl" style={{border:'1px dashed #EFEFEF'}}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{background:'#FBEAEF'}}>
                  <Sparkles className="w-5 h-5" style={{color:'#D14D72'}} />
                </div>
                <h3 className="text-base font-bold mb-1 capitalize" style={{color:'#1A1A1A'}}>{activeTab} module</h3>
                <p className="text-sm" style={{color:'#6B7280'}}>This module is coming soon.</p>
              </div>
            )}
          </div>

            {/* ─── TAB: BILLING & PLAN ─── */}
            {activeTab === 'billing' && (
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Trial Banner */}
                {salon?.subscription_status === 'trialing' && (
                  <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6" style={{border:'1px solid #EFEFEF', borderLeft:'4px solid #D14D72'}}>
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2 mb-2" style={{color:'#1A1A1A'}}>
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        7-Day Free Trial Active
                      </h3>
                      <p className="text-sm" style={{color:'#6B7280'}}>
                        You have full access to TokenPe Salon until {new Date(salon?.trial_ends_at).toLocaleDateString()}.
                      </p>
                    </div>
                    <div className="text-center sm:text-right shrink-0">
                      <div className="text-3xl font-extrabold" style={{color:'#D14D72'}}>
                        {Math.max(0, Math.ceil((new Date(salon?.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))}
                      </div>
                      <div className="text-xs uppercase tracking-wider font-semibold" style={{color:'#9CA3AF'}}>Days Left</div>
                    </div>
                  </div>
                )}

                {/* Plan Card */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{border:'1px solid #EFEFEF'}}>
                  <div className="p-8 text-center" style={{background:'#FDF8F9', borderBottom:'1px solid #EFEFEF'}}>
                    <h3 className="text-2xl font-extrabold mb-2" style={{color:'#1A1A1A'}}>Full Package</h3>
                    <p className="text-sm mb-6" style={{color:'#6B7280'}}>Everything you need to manage your salon, in one simple plan.</p>
                    <div className="flex items-center justify-center gap-1 mb-6">
                      <span className="text-2xl font-bold" style={{color:'#1A1A1A'}}>₹</span>
                      <span className="text-5xl font-extrabold" style={{color:'#D14D72'}}>999</span>
                      <span className="text-sm font-medium" style={{color:'#6B7280'}}>/ month</span>
                    </div>
                    <button onClick={handleSalonSubscribe} className="px-8 py-3.5 text-white font-bold rounded-xl shadow-md transition-all w-full max-w-sm" style={{background:'#D14D72'}} onMouseEnter={e=>e.currentTarget.style.background='#C0405F'} onMouseLeave={e=>e.currentTarget.style.background='#D14D72'}>
                      Subscribe Now
                    </button>
                  </div>
                  <div className="p-8">
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-center" style={{color:'#6B7280'}}>What's included</h4>
                    <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      {[
                        'Unlimited Clients & Walk-ins',
                        'Live Queue Management',
                        'WhatsApp CRM & Alerts',
                        'Staff & Commission Tracking',
                        'Inventory Management',
                        'Priority Premium Support'
                      ].map(feat => (
                        <div key={feat} className="flex items-center gap-3 text-sm font-medium" style={{color:'#1A1A1A'}}>
                          <CheckCircle className="w-5 h-5" style={{color:'#D14D72'}} /> {feat}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}
        </main>
      </div>



      {/* ─── MODALS ─── */}
      <AnimatePresence>
        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl" style={{border:'1px solid #EFEFEF'}}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold" style={{color:'#1A1A1A'}}>Salon Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-1" style={{color:'#9CA3AF'}} onMouseEnter={e=>e.currentTarget.style.color='#D14D72'} onMouseLeave={e=>e.currentTarget.style.color='#9CA3AF'}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'#6B7280'}}>Salon Name</label>
                  <input value={settingsName} onChange={e => setSettingsName(e.target.value)} placeholder="e.g. Glamour Studio" className="w-full rounded-xl px-3.5 py-2.5 outline-none transition-all" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}} onFocus={e=>{e.currentTarget.style.borderColor='#D14D72';e.currentTarget.style.boxShadow='0 0 0 2px rgba(209,77,114,0.1)'}} onBlur={e=>{e.currentTarget.style.borderColor='#EFEFEF';e.currentTarget.style.boxShadow=''}} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'#6B7280'}}>Direct UPI ID</label>
                  <input value={settingsUpiId} onChange={e => setSettingsUpiId(e.target.value)} placeholder="e.g. yourname@sbi" className="w-full rounded-xl px-3.5 py-2.5 outline-none transition-all" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}} onFocus={e=>{e.currentTarget.style.borderColor='#D14D72';e.currentTarget.style.boxShadow='0 0 0 2px rgba(209,77,114,0.1)'}} onBlur={e=>{e.currentTarget.style.borderColor='#EFEFEF';e.currentTarget.style.boxShadow=''}} />
                  <p className="text-[10px] mt-1.5 leading-relaxed" style={{color:'#6B7280'}}>Payments will go directly to your bank account via Counter Billing QR.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'#6B7280'}}>Salon Address</label>
                  <input value={settingsAddress} onChange={e => setSettingsAddress(e.target.value)} placeholder="e.g. 123 Main Street" className="w-full rounded-xl px-3.5 py-2.5 outline-none transition-all" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}} onFocus={e=>{e.currentTarget.style.borderColor='#D14D72';e.currentTarget.style.boxShadow='0 0 0 2px rgba(209,77,114,0.1)'}} onBlur={e=>{e.currentTarget.style.borderColor='#EFEFEF';e.currentTarget.style.boxShadow=''}} />
                </div>
                <button type="submit" className="w-full py-3 text-white font-bold rounded-xl shadow-md transition-all mt-2" style={{background:'#D14D72'}} onMouseEnter={e=>e.currentTarget.style.background='#C0405F'} onMouseLeave={e=>e.currentTarget.style.background='#D14D72'}>
                  Save All Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* QR Display Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm">
              {/* QR Standee Preview */}
              <div id="salon-qr-standee" className="bg-white rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden" style={{border:'1px solid #EFEFEF'}}>
                <div className="relative z-10">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{color:'#9CA3AF'}}>Welcome to</h4>
                  <h3 className="text-2xl font-extrabold mb-5 leading-tight" style={{color:'#1A1A1A'}}>{salon?.name || 'Your Salon'}</h3>
                  <div className="inline-block mb-5 rounded-2xl p-3 shadow-sm" style={{border:'1px solid #EFEFEF',background: qrBgColor}}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wa.me/917977075721?text=JOIN%20${encodeURIComponent(editSalonCode||salon?.code||'SALON')}&bgcolor=${qrBgColor.replace('#','')}&color=${qrFgColor.replace('#','')}&margin=2`}
                      alt="Salon Queue QR" className="w-40 h-40 block" crossOrigin="anonymous"
                    />
                    {qrLogoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <img src={qrLogoUrl} alt="logo" className="w-10 h-10 rounded-lg" style={{background:'#fff',padding:'2px'}} />
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-sm mb-1" style={{color:'#1A1A1A'}}>Scan to Join Digital Queue</p>
                  <p className="text-[10px] mb-4 uppercase tracking-wider" style={{color:'#9CA3AF'}}>Powered by TokenPe Salon</p>
                  <div className="flex items-center justify-center gap-2 font-mono text-xs rounded-2xl p-3" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#6B7280'}}>
                    Code: <strong style={{color:'#1A1A1A'}}>{editSalonCode||salon?.code||'---'}</strong>
                    <button onClick={() => {navigator.clipboard.writeText(editSalonCode||salon?.code||'');showToast('Code copied!')}} className="ml-1 p-1 rounded" style={{color:'#D14D72'}}><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>

              {/* Editable Controls */}
              <div className="mt-3 bg-white rounded-2xl p-4 space-y-3" style={{border:'1px solid #EFEFEF'}}>
                {/* Salon Code edit */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{color:'#6B7280'}}>Salon Code</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      value={editSalonCode}
                      onChange={e => setEditSalonCode(e.target.value.toUpperCase())}
                      maxLength={10}
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm font-mono font-bold outline-none"
                      style={{border:'1px solid #EFEFEF',color:'#1A1A1A',background:'#FDF8F9'}}
                      onFocus={e=>{e.currentTarget.style.borderColor='#D14D72'}}
                      onBlur={e=>{e.currentTarget.style.borderColor='#EFEFEF'}}
                    />
                    <button onClick={handleSaveSalonCode} className="px-3 py-1.5 text-xs font-bold rounded-lg text-white" style={{background:'#D14D72'}} onMouseEnter={e=>e.currentTarget.style.background='#C0405F'} onMouseLeave={e=>e.currentTarget.style.background='#D14D72'}>Save</button>
                  </div>
                </div>
                {/* QR Theme */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{color:'#6B7280'}}>QR Background</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={qrBgColor} onChange={e=>setQrBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      <span className="text-xs font-mono" style={{color:'#6B7280'}}>{qrBgColor}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{color:'#6B7280'}}>QR Dots Color</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={qrFgColor} onChange={e=>setQrFgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      <span className="text-xs font-mono" style={{color:'#6B7280'}}>{qrFgColor}</span>
                    </div>
                  </div>
                </div>
                {/* Logo upload */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{color:'#6B7280'}}>Center Logo (optional)</label>
                  <input
                    type="file" accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) { setQrLogoFile(file); setQrLogoUrl(URL.createObjectURL(file)) }
                    }}
                    className="block w-full mt-1 text-xs" style={{color:'#6B7280'}}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-3">
                <button onClick={() => { showToast('Printing QR Standee...'); window.print(); }} className="flex-1 py-3 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2" style={{background:'#D14D72'}} onMouseEnter={e=>e.currentTarget.style.background='#C0405F'} onMouseLeave={e=>e.currentTarget.style.background='#D14D72'}>
                  <span className="text-base">🖨️</span> Print QR
                </button>
                <button onClick={() => setShowQrModal(false)} className="flex-1 py-3 text-xs font-bold rounded-xl shadow-sm transition-all" style={{background:'#fff',border:'1px solid #EFEFEF',color:'#6B7280'}} onMouseEnter={e=>e.currentTarget.style.background='#FDF8F9'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Walk-in Modal */}
        {showAddWalkin && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl" style={{border:'1px solid #EFEFEF'}}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold" style={{color:'#1A1A1A'}}>Add Walk-in Client</h3>
                <button onClick={() => setShowAddWalkin(false)} className="p-1" style={{color:'#9CA3AF'}} onMouseEnter={e=>e.currentTarget.style.color='#D14D72'} onMouseLeave={e=>e.currentTarget.style.color='#9CA3AF'}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddWalkinSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'#6B7280'}}>Client Name</label>
                  <input required value={newClientName} onChange={e=>setNewClientName(e.target.value)} placeholder="e.g. Priya Shah" className="w-full rounded-xl px-3.5 py-2.5 outline-none" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}} onFocus={e=>{e.currentTarget.style.borderColor='#D14D72';e.currentTarget.style.boxShadow='0 0 0 2px rgba(209,77,114,0.1)'}} onBlur={e=>{e.currentTarget.style.borderColor='#EFEFEF';e.currentTarget.style.boxShadow=''}} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'#6B7280'}}>Phone Number</label>
                  <input required type="tel" value={newClientPhone} onChange={e=>setNewClientPhone(e.target.value)} placeholder="10-digit number" className="w-full rounded-xl px-3.5 py-2.5 outline-none" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}} onFocus={e=>{e.currentTarget.style.borderColor='#D14D72';e.currentTarget.style.boxShadow='0 0 0 2px rgba(209,77,114,0.1)'}} onBlur={e=>{e.currentTarget.style.borderColor='#EFEFEF';e.currentTarget.style.boxShadow=''}} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'#6B7280'}}>Service</label>
                  <select value={newServiceId} onChange={e=>setNewServiceId(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 outline-none" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}}>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} — ₹{s.price}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'#6B7280'}}>Preferred Stylist</label>
                  <select value={newStylistId} onChange={e=>setNewStylistId(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 outline-none" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}}>
                    {staff.filter(s=>s.role==='stylist'||s.role==='manager').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={()=>setShowAddWalkin(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{border:'1px solid #EFEFEF',color:'#6B7280'}} onMouseEnter={e=>e.currentTarget.style.background='#FDF8F9'} onMouseLeave={e=>e.currentTarget.style.background=''}>Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{background:'#D14D72'}} onMouseEnter={e=>e.currentTarget.style.background='#C0405F'} onMouseLeave={e=>e.currentTarget.style.background='#D14D72'}>Add to Queue</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Bill & UPI Modal */}
        {showAddInvoice && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl" style={{border:'1px solid #EFEFEF'}}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold" style={{color:'#1A1A1A'}}>Bill & UPI Payment</h3>
                <button onClick={() => { setShowAddInvoice(false); setActiveUpiQr(null); }} className="p-1" style={{color:'#9CA3AF'}} onMouseEnter={e=>e.currentTarget.style.color='#D14D72'} onMouseLeave={e=>e.currentTarget.style.color='#9CA3AF'}><X className="w-5 h-5" /></button>
              </div>
              {!activeUpiQr ? (
                <form onSubmit={handleGenerateInvoice} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'#6B7280'}}>Client Name</label>
                    <input required value={invClientName} onChange={e=>setInvClientName(e.target.value)} placeholder="e.g. Rohan Gupta" className="w-full rounded-xl px-3.5 py-2.5 outline-none" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}} onFocus={e=>{e.currentTarget.style.borderColor='#D14D72';e.currentTarget.style.boxShadow='0 0 0 2px rgba(209,77,114,0.1)'}} onBlur={e=>{e.currentTarget.style.borderColor='#EFEFEF';e.currentTarget.style.boxShadow=''}} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'#6B7280'}}>Service</label>
                    <select value={invServiceId} onChange={e=>setInvServiceId(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 outline-none" style={{background:'#FDF8F9',border:'1px solid #EFEFEF',color:'#1A1A1A'}}>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name} — ₹{s.price}</option>)}
                    </select>
                  </div>
                  {!salon?.upi_id && <p className="text-xs p-3 rounded-xl" style={{background:'#FFF3CD',color:'#856404',border:'1px solid #FFEEBA'}}>⚠️ No UPI ID configured. Go to Settings first.</p>}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={()=>setShowAddInvoice(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{border:'1px solid #EFEFEF',color:'#6B7280'}}>Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{background:'#D14D72'}} onMouseEnter={e=>e.currentTarget.style.background='#C0405F'} onMouseLeave={e=>e.currentTarget.style.background='#D14D72'}>Generate QR</button>
                  </div>
                </form>
              ) : (
                <div className="text-center">
                  <div className="mb-3">
                    <div className="text-sm font-semibold" style={{color:'#1A1A1A'}}>{activeUpiQr.clientName}</div>
                    <div className="text-xs" style={{color:'#6B7280'}}>{activeUpiQr.serviceName}</div>
                    <div className="text-2xl font-extrabold mt-1" style={{color:'#D14D72'}}>₹{activeUpiQr.amount}</div>
                  </div>
                  <div className="inline-block p-3 rounded-2xl mb-4" style={{border:'1px solid #EFEFEF',background:'#FDF8F9'}}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeUpiQr.upiDeepLink)}&bgcolor=ffffff&color=0f172a`} alt="UPI QR" className="w-44 h-44" />
                  </div>
                  <p className="text-xs mb-4" style={{color:'#6B7280'}}>Show this QR to the client to scan and pay</p>
                  <div className="flex gap-3">
                    <button onClick={()=>setActiveUpiQr(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{border:'1px solid #EFEFEF',color:'#6B7280'}}>Back</button>
                    <button onClick={()=>{setShowAddInvoice(false);setActiveUpiQr(null);showToast('Payment recorded!')}} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{background:'#10b981'}} onMouseEnter={e=>e.currentTarget.style.background='#059669'} onMouseLeave={e=>e.currentTarget.style.background='#10b981'}>✓ Done, Paid</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
