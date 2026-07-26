'use client'
import { useEffect, useState } from 'react'
import { PartyPopper, CheckCircle2, Check, Sparkles, ShieldCheck, Activity, Users, Building, Globe, Server, Database } from 'lucide-react'

export default function CelebrationScreen({ clinicName, trialEnd, onDone, vertical = 'clinic' }) {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])

    const isSalon = vertical === 'salon'
    const primaryColor = isSalon ? '#D14D72' : '#10b981'
    const buttonHoverColor = isSalon ? '#be185d' : '#059669' // fallback/hover
    const rgbColor = isSalon ? '209, 77, 114' : '16, 185, 129'

    const features = isSalon ? [
        { icon: '✓', text: 'Unlimited Clients' },
        { icon: '✓', text: 'Live Walk-in Queue' },
        { icon: '✓', text: 'WhatsApp CRM & Alerts' },
        { icon: '✓', text: 'Staff & Commissions' },
        { icon: '✓', text: 'Inventory Tracking' },
        { icon: '✓', text: 'Premium Support Line' }
    ] : [
        { icon: '✓', text: 'Unlimited Patients' },
        { icon: '✓', text: 'AI Voice in 10 Languages' },
        { icon: '✓', text: 'WhatsApp CRM & Alerts' },
        { icon: '✓', text: 'Advanced Analytics' },
        { icon: '✓', text: 'Multi-Branch Support' },
        { icon: '✓', text: 'Priority Support Line' }
    ]

    return (
        <div style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#09090b', backgroundImage:`radial-gradient(circle at 50% 30%, rgba(${rgbColor}, 0.15), transparent 60%)`, fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color:'#fff', flexDirection:'column', textAlign:'center', padding:24, zIndex:99999, overflow:'hidden' }}>

            {/* Dots Grid Background */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px', opacity: 0.8, maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)', pointerEvents: 'none' }} />

            <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:420, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition:'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                
                <div style={{ margin:'0 auto 32px', display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeInUp 0.8s ease-out 0.2s both' }}>
                    <CheckCircle2 size={80} color={primaryColor} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 15px rgba(${rgbColor},0.3))` }} />
                </div>

                <div style={{ fontSize:13, fontWeight:600, color:primaryColor, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12, animation:'fadeInUp 0.8s ease-out 0.3s both' }}>
                    Welcome to TokenPe
                </div>
                
                <h1 style={{ fontSize:32, fontWeight:700, margin:'0 0 16px', letterSpacing:'-0.03em', animation:'fadeInUp 0.8s ease-out 0.4s both', color:'#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Congratulations! <Sparkles size={32} color={primaryColor} style={{ marginLeft: 10 }} />
                </h1>

                <p style={{ fontSize:15, color:'#94a3b8', lineHeight:1.6, marginBottom:32, animation:'fadeInUp 0.8s ease-out 0.5s both', padding:'0 10px' }}>
                    <strong style={{ color:'#fff', fontWeight:700, fontSize:16 }}>{clinicName}</strong> is now live. We've unlocked the <strong style={{ color:primaryColor, fontWeight:700, background:`rgba(${rgbColor},0.15)`, padding:'2px 8px', borderRadius:6, whiteSpace:'nowrap', display:'inline-block', margin:'0 2px' }}>7-Day Elite Plan Trial</strong> for you, completely free until <strong style={{ color:'#fff', fontWeight:700, whiteSpace:'nowrap' }}>{new Date(trialEnd).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</strong>.
                </p>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:40, animation:'fadeInUp 0.8s ease-out 0.6s both' }}>
                    {features.map((feature, i) => (
                        <div key={i} className="feat-card" style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px', fontSize:13, color:'#f8fafc', textAlign:'left' }}>
                            <Check size={18} color={primaryColor} />
                            <span style={{ fontWeight: 500, lineHeight: 1.3 }}>{feature.text}</span>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={onDone} 
                    style={{ 
                        width:'100%', padding:'16px', background:primaryColor, color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', transition:'all 0.2s ease', animation:'fadeInUp 0.8s ease-out 0.7s both', outline:'none', boxShadow:`0 4px 14px 0 rgba(${rgbColor}, 0.4)`
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px rgba(${rgbColor}, 0.6)`; e.currentTarget.style.background = buttonHoverColor }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px 0 rgba(${rgbColor}, 0.4)`; e.currentTarget.style.background = primaryColor }}
                >
                    Go to Dashboard
                </button>
            </div>

            <style>{`
                @keyframes fadeInUp { 
                    from { opacity: 0; transform: translateY(15px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                @keyframes pulseGlow { 
                    from { opacity: 0.5; } 
                    to { opacity: 1; } 
                }
                .feat-card {
                    transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
                }
                .feat-card:hover {
                    transform: translateY(-2px);
                    background: rgba(255,255,255,0.12) !important;
                    border-color: rgba(255,255,255,0.2) !important;
                }
            `}</style>
        </div>
    )
}
