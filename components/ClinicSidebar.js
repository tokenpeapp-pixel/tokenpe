'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Layers, History, BarChart2, Megaphone, CreditCard,
  HelpCircle, User, Menu, X, LogOut, Building2, Stethoscope, Check,
  ChevronRight, ArrowLeft
} from 'lucide-react'

export default function ClinicSidebar({ clinic: initialClinic, activeTab }) {
  const router = useRouter()
  const pathname = usePathname()
  const [clinic, setClinic] = useState(initialClinic || null)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [sbTooltip, setSbTooltip] = useState(null)

  useEffect(() => {
    if (initialClinic) {
      setClinic(initialClinic)
      return
    }
    try {
      const stored = localStorage.getItem('tokenpe_clinic') || localStorage.getItem('tokenpe_business')
      if (stored) setClinic(JSON.parse(stored))
    } catch (_) {}
  }, [initialClinic])

  const consoleNavItems = [
    { href: '/dashboard', label: 'Dashboard', desc: 'Live queue overview & clinic stats', icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> },
    { href: '/dashboard/branches', label: 'Manage Branches', desc: 'Set up & switch between clinic locations under one account', icon: <Layers className="w-4 h-4 flex-shrink-0" /> },
    { href: '/dashboard/history', label: 'History', desc: 'Browse completed & past patient consultation records', icon: <History className="w-4 h-4 flex-shrink-0" /> },
    { href: '/dashboard/analytics', label: 'Analytics & Reports', desc: 'Track peak OPD hours, wait times & patient statistics', icon: <BarChart2 className="w-4 h-4 flex-shrink-0" /> },
    { href: '/dashboard/crm', label: 'Broadcasting & CRM', desc: 'Send bulk WhatsApp alerts & manage patient relationships', icon: <Megaphone className="w-4 h-4 flex-shrink-0" /> },
  ]

  const accountNavItems = [
    { href: '/dashboard/billing', label: 'Billing & Plans', desc: 'Manage your TokenPe subscription & plan features', icon: <CreditCard className="w-4 h-4 flex-shrink-0" /> },
    { href: '/dashboard/help', label: 'Help & Support', desc: 'Report bugs, raise issues & get in touch with our team', icon: <HelpCircle className="w-4 h-4 flex-shrink-0" /> },
    { href: '/dashboard/profile', label: 'Edit Profile', desc: 'Update clinic name, contact info & branding', icon: <User className="w-4 h-4 flex-shrink-0" /> },
  ]

  const handleLogout = () => {
    localStorage.removeItem('tokenpe_clinic')
    localStorage.removeItem('tokenpe_business')
    localStorage.removeItem('tokenpe_user_businesses')
    localStorage.removeItem('clinicCode')
    localStorage.removeItem('clinicPhone')
    router.push('/login')
  }

  const isCurrentActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
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
          padding-left: 18px !important;
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

        @media (max-width: 1024px) {
          .clinic-desktop-sidebar {
            display: none !important;
          }
          .clinic-mobile-topbar {
            display: flex !important;
          }
        }

        @media (min-width: 1025px) {
          .clinic-mobile-topbar {
            display: none !important;
          }
          .clinic-desktop-sidebar {
            display: flex !important;
          }
        }
      `}</style>

      {/* ── MOBILE TOP BAR (< 1025px) ── */}
      <header className="clinic-mobile-topbar w-full bg-[#052E20] text-white px-4 py-3 border-b border-[#065F46] items-center justify-between sticky top-0 z-[99] shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo-dark.svg" alt="TokenPe" className="h-8 w-auto object-contain" />
          {clinic && (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#065F46] text-[#A7F3D0] px-2.5 py-1 rounded-lg text-xs font-extrabold border border-[#10B981]/30">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px]">{clinic.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {clinic && (
            <span className="text-[10px] font-mono font-bold bg-[#065F46] text-[#A7F3D0] px-2 py-1 rounded-md border border-[#10B981]/30 sm:hidden">
              {clinic.code}
            </span>
          )}
          <button
            onClick={() => setShowMobileNav(true)}
            className="p-2 rounded-xl bg-[#065F46] text-white border border-[#10B981]/30 hover:bg-[#044E3A] transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-[#A7F3D0]" />
            <span className="hidden xs:inline text-xs font-extrabold">Menu</span>
          </button>
        </div>
      </header>

      {/* ── DESKTOP SIDEBAR (>= 1025px) ── */}
      <aside className="clinic-desktop-sidebar" style={{ width: 240, background: '#CBE4D3', borderRight: '1px solid #A8D5B5', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'visible' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', overflowX: 'hidden', flex: 1, paddingBottom: 8 }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', marginBottom: 24 }}>
            <img src="/logo-light.svg" alt="TokenPe" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Active Branch Pill */}
          {clinic && (
            <div style={{ marginBottom: 16, padding: '8px 10px', background: '#065F46', borderRadius: 12, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(6,95,70,0.15)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#044E3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#A7F3D0' }}>
                <Building2 className="w-4 h-4" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Location</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clinic.name}</div>
              </div>
            </div>
          )}

          {/* Nav Group: Console */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1E3A2B', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 6 }}>Console</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {consoleNavItems.map(item => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`sidebar-btn${isCurrentActive(item.href) ? ' active' : ''}`}
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
            {accountNavItems.map(item => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`sidebar-btn${isCurrentActive(item.href) ? ' active' : ''}`}
                onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setSbTooltip({ label: item.label, desc: item.desc, y: r.top + r.height / 2 }) }}
                onMouseLeave={() => setSbTooltip(null)}
              >
                {item.icon}
                <span className="sb-label">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Divider & Logout Footer (Desktop) */}
          <div style={{ paddingTop: 14, borderTop: '1px solid #A8D5B5', marginTop: 14 }}>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut className="w-4 h-4" /> Exit / Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Floating Hover Tooltip (Desktop) */}
      {sbTooltip && (
        <div style={{ position: 'fixed', left: 248, top: sbTooltip.y, transform: 'translateY(-50%)', background: '#0F291B', color: '#FFFFFF', padding: '10px 14px', borderRadius: 10, fontSize: '0.78rem', zIndex: 99999, pointerEvents: 'none', maxWidth: 220, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 800, marginBottom: 2, color: '#A7F3D0' }}>{sbTooltip.label}</div>
          <div style={{ fontSize: '0.72rem', color: '#D1FAE5', lineHeight: 1.3 }}>{sbTooltip.desc}</div>
        </div>
      )}

      {/* ── MOBILE OVERLAY NAVIGATION DRAWER ── */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileNav(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(5, 46, 32, 0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', justifyContent: 'flex-end' }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '85%', maxWidth: 320, background: '#FFFFFF', height: '100%', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src="/logo-clinic-nav.svg" alt="TokenPe" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                  </div>

                  <button
                    onClick={() => setShowMobileNav(false)}
                    style={{ background: '#F1F5F9', border: 'none', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Active Branch Box */}
                {clinic && (
                  <div style={{ marginBottom: 16, padding: '10px 12px', background: '#ECFDF5', borderRadius: 14, border: '1px solid #A7F3D0', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 className="w-4 h-4 text-[#059669]" />
                      <div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Active Location</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065F46' }}>{clinic.name}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { router.push('/dashboard/branches'); setShowMobileNav(false); }}
                      style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', background: '#FFFFFF', border: '1px solid #A7F3D0', padding: '4px 8px', borderRadius: 8, cursor: 'pointer' }}
                    >
                      Switch
                    </button>
                  </div>
                )}

                {/* Console Section */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#052E20', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 4 }}>CONSOLE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {consoleNavItems.map(item => {
                      const active = isCurrentActive(item.href)
                      return (
                        <button
                          key={item.href}
                          onClick={() => { router.push(item.href); setShowMobileNav(false); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '11px 14px',
                            borderRadius: 12,
                            background: active ? '#ECFDF5' : '#F8FAFC',
                            color: active ? '#065F46' : '#1E293B',
                            border: active ? '1px solid #A7F3D0' : '1px solid #F1F5F9',
                            fontWeight: active ? 800 : 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: active ? '#065F46' : '#64748B' }}>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Account Section */}
                <div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#052E20', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 4 }}>ACCOUNT & SETTINGS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {accountNavItems.map(item => {
                      const active = isCurrentActive(item.href)
                      return (
                        <button
                          key={item.href}
                          onClick={() => { router.push(item.href); setShowMobileNav(false); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '11px 14px',
                            borderRadius: 12,
                            background: active ? '#ECFDF5' : '#F8FAFC',
                            color: active ? '#065F46' : '#1E293B',
                            border: active ? '1px solid #A7F3D0' : '1px solid #F1F5F9',
                            fontWeight: active ? 800 : 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: active ? '#065F46' : '#64748B' }}>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Logout Footer (Mobile Drawer) */}
              <div style={{ paddingTop: 14, borderTop: '1px solid #E2E8F0', marginTop: 16 }}>
                <button
                  onClick={() => { setShowMobileNav(false); setShowLogoutConfirm(true); }}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <LogOut className="w-4 h-4" /> Logout Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(6, 46, 32, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              padding: 28,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              border: '1.5px solid #CBE4D3',
              textAlign: 'center'
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEF2F2', border: '1.5px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <LogOut style={{ width: 22, height: 22, color: '#DC2626' }} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F291B', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Exit Command Center?
            </div>
            <div style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to log out of TokenPe?<br />You will need to enter your credentials to log back in.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, background: '#F1F5F9', color: '#0F291B', border: 'none', padding: '11px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
                style={{ flex: 1, background: '#DC2626', color: 'white', border: 'none', padding: '11px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <LogOut style={{ width: 15, height: 15 }} /> Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
