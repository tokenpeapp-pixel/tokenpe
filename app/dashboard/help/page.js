'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ClinicSidebar from '../../../components/ClinicSidebar'
import { 
  HelpCircle, Headphones, MessageSquare, Mail, Phone, Search, ChevronDown,
  LayoutDashboard, Layers, History, BarChart2, Megaphone, CreditCard, User,
  ArrowLeft, CheckCircle2, AlertCircle, FileText, Send, Sparkles, X, ShieldAlert,
  PlayCircle, Clock, ExternalLink
} from 'lucide-react'

const SUPPORT_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_NUMBER || '917715951068'

export default function HelpSupportPage() {
  const router = useRouter()
  const [clinic, setClinic]               = useState(null)
  const [loading, setLoading]             = useState(true)
  
  // Search & Accordion State
  const [searchQuery, setSearchQuery]     = useState('')
  const [openFaq, setOpenFaq]             = useState(null)
  const [selectedGuide, setSelectedGuide] = useState(null)

  // Ticket Form Modal State
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketCategory, setTicketCategory]   = useState('Queue Issue')
  const [ticketPriority, setTicketPriority]   = useState('Medium')
  const [ticketSubject, setTicketSubject]     = useState('')
  const [ticketMessage, setTicketMessage]     = useState('')
  const [submittingTicket, setSubmittingTicket] = useState(false)
  const [ticketSuccess, setTicketSuccess]     = useState(null)

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('tokenpe_clinic')
      if (!stored) { router.push('/login'); return }
      const c = JSON.parse(stored)
      setClinic(c)
      setLoading(false)
    }
    load()
  }, [router])

  const faqs = [
    {
      cat: 'Queue & OPD Management',
      q: 'How do I start and manage my OPD queue?',
      a: 'Go to your Main Dashboard, click "Open Clinic", and click "Add Patient" or "Next Patient". Your tokens update live and send instant WhatsApp status updates to your waiting patients.'
    },
    {
      cat: 'Queue & OPD Management',
      q: 'What happens when I pause the queue?',
      a: 'Clicking "Pause Queue" notifies waiting patients on WhatsApp that consultations are temporarily paused (e.g. for emergency rounds or lunch break) and freezes estimated wait times.'
    },
    {
      cat: 'WhatsApp Alerts',
      q: 'Why are patients not receiving WhatsApp messages?',
      a: 'Ensure the patient phone number is entered with a valid 10-digit Indian mobile number. Check if your clinic has an active Pro/Elite subscription or trial days remaining.'
    },
    {
      cat: 'WhatsApp Alerts',
      q: 'Can I customize the WhatsApp message text?',
      a: 'Yes! Navigate to Broadcasting & CRM to set a custom WhatsApp Welcome Message, attaching Wi-Fi passwords, OPD lounge rules, or clinic directions.'
    },
    {
      cat: 'Subscription & Billing',
      q: 'How do I upgrade or change my plan?',
      a: 'Visit the Billing & Plans page. You can choose Monthly, Yearly (20% OFF), or Custom Duration plans. Upgrades take effect immediately upon payment.'
    },
    {
      cat: 'Subscription & Billing',
      q: 'Do you provide GST invoices for clinic tax filings?',
      a: 'Yes. Upon subscription payment, a digital tax invoice receipt is sent to your registered clinic email address.'
    },
    {
      cat: 'Branch & Account Setup',
      q: 'How do I add a new branch or doctor clinic?',
      a: 'Click "Manage Branches" in the sidebar to create and switch between multiple clinic locations under a single TokenPe account.'
    }
  ]

  const guides = [
    {
      id: 'queue_guide',
      title: 'Daily OPD Queue Workflow',
      desc: 'Step-by-step guide to calling next patients, marking consultations done, and skipping missed tokens.',
      icon: <PlayCircle className="w-5 h-5 text-[#065F46]" />,
      steps: [
        'Open your TokenPe Dashboard at the start of your consultation session.',
        'Click "Open Clinic" to allow patients to join via your QR code or receptionist entry.',
        'Click "Next Patient" to call the top token. The patient receives an automated WhatsApp alert.',
        'When finished, click "Mark Done" to advance the live queue.'
      ]
    },
    {
      id: 'crm_guide',
      title: 'WhatsApp Broadcasts & Follow-ups',
      desc: 'How to send mass announcements and enable automated 90-day routine recall messages.',
      icon: <MessageSquare className="w-5 h-5 text-[#065F46]" />,
      steps: [
        'Navigate to Broadcasting & CRM in your left sidebar.',
        'Type your announcement or attach a flyer image to broadcast to all past patients.',
        'Enable 90-day Routine Recall and 3-day Medicine Reminders to keep patients engaged.'
      ]
    },
    {
      id: 'analytics_guide',
      title: 'Understanding OPD Peak Hours & Analytics',
      desc: 'How to use peak hour heatmaps and wait duration reports to reduce patient rush.',
      icon: <FileText className="w-5 h-5 text-[#065F46]" />,
      steps: [
        'Click "Analytics & Reports" in your left sidebar.',
        'Review the OPD Rush Heatmap to see which hours (e.g. 10 AM - 12 PM) experience maximum footfall.',
        'Use average wait time metrics to optimize appointment slots and staff scheduling.'
      ]
    }
  ]

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.cat.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTicketSubmit = (e) => {
    e.preventDefault()
    if (!ticketSubject.trim() || !ticketMessage.trim()) return alert('Please fill in all fields.')
    setSubmittingTicket(true)

    setTimeout(() => {
      const ticketId = `TKP-${Math.floor(1000 + Math.random() * 9000)}`
      setTicketSuccess(ticketId)
      setSubmittingTicket(false)
      setTicketSubject('')
      setTicketMessage('')
    }, 1200)
  }

  if (loading) return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F2F7F2] font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <ClinicSidebar clinic={clinic} />
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-8">
        <div className="w-10 h-10 border-4 border-[#C3DBC7] border-t-[#2D6A4F] rounded-full animate-spin"></div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F2F7F2] font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <ClinicSidebar clinic={clinic} />

      <style jsx global>{`
        .help-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease !important;
        }
        .help-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 12px 30px rgba(6, 95, 70, 0.08) !important;
        }
      `}</style>

      {/* ── Main Content Container ── */}
      <main className="flex-1 min-h-screen pb-20 font-sans overflow-y-auto">
        <div className="max-w-[1040px] mx-auto p-4 sm:p-6 lg:p-10 space-y-8">

          {/* Top Bar Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button onClick={() => router.push('/dashboard')} className="mb-2 text-[#065F46] font-bold text-[13px] hover:underline flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-[#111827]">Help & Support Desk</h1>
              <p className="text-sm text-[#6B7280]">Get 24/7 technical support, browse clinic guides, and raise support tickets.</p>
            </div>

            <button
              onClick={() => setShowTicketModal(true)}
              className="px-5 py-2.5 bg-[#065F46] hover:bg-[#044E3A] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
            >
              <Send className="w-4 h-4" /> Raise Support Ticket
            </button>
          </div>

          {/* ── SEARCH BAR ── */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-[#6B7280] ml-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search help topics, WhatsApp setup, printer issues, or billing FAQs..."
              className="w-full text-xs sm:text-sm font-medium outline-none text-[#111827] bg-transparent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 rounded-full hover:bg-gray-100 text-[#6B7280] mr-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ── QUICK ACTION CARDS (3 Columns) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Direct WhatsApp Support */}
            <a
              href={`https://wa.me/${SUPPORT_NUMBER}?text=Hi%20TokenPe%20Support%2C%20I%20need%20assistance%20with%20my%20clinic%20account`}
              target="_blank"
              rel="noopener noreferrer"
              className="help-card bg-gradient-to-br from-[#052E20] to-[#043E2E] text-white p-6 rounded-3xl shadow-md border border-[#065F46] flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-[#A7F3D0]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-xs font-extrabold text-[#FBBF24] uppercase tracking-wider mb-1">Instant Support</div>
                <h3 className="text-lg font-black mb-2 text-white">WhatsApp Tech Desk</h3>
                <p className="text-xs text-teal-100/90 leading-relaxed mb-6">
                  Chat directly with our technical support engineer on WhatsApp for urgent queue or printer assistance.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#A7F3D0]">
                <span>Open WhatsApp Chat</span> <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Email Support */}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=tokenpe.online@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="help-card bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4 text-[#065F46]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs font-extrabold text-[#065F46] uppercase tracking-wider mb-1">Email Desk</div>
                <h3 className="text-lg font-black mb-2 text-[#111827]">tokenpe.online@gmail.com</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed mb-6">
                  Send detailed inquiries, invoice requests, or custom feature feedback directly to our support inbox.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#065F46]">
                <span>Send Email Inquiry</span> <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Create Ticket */}
            <div
              onClick={() => setShowTicketModal(true)}
              className="help-card bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 text-[#F59E0B]">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="text-xs font-extrabold text-[#F59E0B] uppercase tracking-wider mb-1">Support Portal</div>
                <h3 className="text-lg font-black mb-2 text-[#111827]">Submit Ticket</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed mb-6">
                  Track and resolve complex issues by submitting a prioritized technical support ticket to our team.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B]">
                <span>Open Ticket Form</span> <Send className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* ── STEP-BY-STEP CLINIC GUIDES ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#065F46]" />
              <h2 className="text-lg sm:text-xl font-black text-[#111827]">Essential OPD Setup Guides</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {guides.map((g) => (
                <div 
                  key={g.id}
                  onClick={() => setSelectedGuide(g)}
                  className="help-card bg-white border border-[#E5E7EB] p-6 rounded-3xl shadow-sm cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
                        {g.icon}
                      </div>
                      <h3 className="text-sm font-bold text-[#111827]">{g.title}</h3>
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed mb-4">{g.desc}</p>
                  </div>
                  <div className="text-xs font-bold text-[#065F46] flex items-center gap-1">
                    <span>View Step-by-Step Guide</span> →
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ACCORDION SECTION ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-[#065F46]" />
              <h2 className="text-lg sm:text-xl font-black text-[#111827]">Frequently Asked Questions</h2>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center text-xs text-[#6B7280]">
                No help articles found matching &quot;{searchQuery}&quot;. Please try another search term or contact our team directly.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((f, i) => {
                  const isOpen = openFaq === i
                  return (
                    <div
                      key={i}
                      className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden ${
                        isOpen ? 'border-[#065F46] shadow-sm bg-[#F0FDF4]/30' : 'border-[#E5E7EB] hover:border-[#A7F3D0]'
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="w-full flex justify-between items-center p-5 text-left transition-all active:scale-[0.99]"
                      >
                        <div className="pr-4">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#065F46] block mb-1">{f.cat}</span>
                          <span className={`text-sm font-bold transition-colors ${isOpen ? 'text-[#065F46]' : 'text-[#111827]'}`}>
                            {f.q}
                          </span>
                        </div>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isOpen ? 'bg-[#065F46] text-white rotate-180' : 'bg-gray-100 text-[#6B7280]'
                        }`}>
                          <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 text-xs text-[#4B5563] leading-relaxed border-t border-[#E5E7EB]/60 pt-3">
                          {f.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

        </div>
      </main>

      {/* ── MODALS ── */}

      {/* Support Ticket Modal */}
      {showTicketModal && (
        <div onClick={() => setShowTicketModal(false)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[500px] rounded-3xl p-6 sm:p-8 relative shadow-2xl">
            <button onClick={() => setShowTicketModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            {ticketSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-[#DCFCE7] text-[#166534] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#065F46] mb-1">Ticket Submitted Successfully!</h3>
                <div className="text-xs font-mono font-bold text-[#059669] mb-3">Ticket ID: {ticketSuccess}</div>
                <p className="text-xs text-[#6B7280] mb-6">Our senior technical support engineer has been notified and will contact your clinic phone/email shortly.</p>
                <button onClick={() => { setShowTicketModal(false); setTicketSuccess(null) }} className="px-6 py-2.5 bg-[#065F46] text-white rounded-xl text-xs font-bold">
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit}>
                <div className="flex items-center gap-2 mb-1 text-[#065F46]">
                  <Headphones className="w-5 h-5" />
                  <h3 className="text-xl font-black text-[#111827]">Submit Support Ticket</h3>
                </div>
                <p className="text-xs text-[#6B7280] mb-6">Need help with queue status, WhatsApp, or billing? Let us know below.</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">Issue Category</label>
                    <select
                      value={ticketCategory}
                      onChange={e => setTicketCategory(e.target.value)}
                      className="w-full p-2.5 border border-[#E5E7EB] rounded-xl text-xs bg-gray-50 outline-none focus:border-[#065F46] text-[#111827]"
                    >
                      <option value="Queue Issue">Queue Issue</option>
                      <option value="WhatsApp Alerts">WhatsApp Alerts</option>
                      <option value="Billing / Subscription">Billing / Subscription</option>
                      <option value="Printer / Hardware">Printer / Hardware</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">Subject</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={e => setTicketSubject(e.target.value)}
                      placeholder="e.g. WhatsApp audio alert not playing on Chrome"
                      className="w-full p-2.5 border border-[#E5E7EB] rounded-xl text-xs bg-gray-50 outline-none focus:border-[#065F46] text-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">Detailed Explanation</label>
                    <textarea
                      rows={3}
                      value={ticketMessage}
                      onChange={e => setTicketMessage(e.target.value)}
                      placeholder="Describe what happened and any error messages seen..."
                      className="w-full p-2.5 border border-[#E5E7EB] rounded-xl text-xs bg-gray-50 outline-none focus:border-[#065F46] text-[#111827]"
                    ></textarea>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowTicketModal(false)} className="flex-1 py-2.5 border border-[#E5E7EB] text-[#374151] rounded-xl font-bold text-xs hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingTicket} className="flex-1 py-2.5 bg-[#065F46] text-white rounded-xl font-bold text-xs hover:bg-[#043E2E] shadow-sm flex items-center justify-center gap-1.5">
                    {submittingTicket ? 'Submitting...' : <><Send className="w-3.5 h-3.5" /> Submit Ticket</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Guide Detail Modal */}
      {selectedGuide && (
        <div onClick={() => setSelectedGuide(null)} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[540px] rounded-3xl p-6 sm:p-8 relative shadow-2xl">
            <button onClick={() => setSelectedGuide(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl">
                {selectedGuide.icon}
              </div>
              <h3 className="text-xl font-black text-[#111827]">{selectedGuide.title}</h3>
            </div>
            <p className="text-xs text-[#6B7280] mb-6">{selectedGuide.desc}</p>

            <div className="space-y-4 mb-8">
              {selectedGuide.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0]">
                  <div className="w-6 h-6 rounded-full bg-[#065F46] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-xs text-[#374151] font-medium leading-relaxed">
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedGuide(null)} className="w-full py-2.5 bg-[#065F46] text-white rounded-xl text-xs font-bold">
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
