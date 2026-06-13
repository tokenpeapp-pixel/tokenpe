'use client'
import { useEffect, useState } from 'react'

export default function CelebrationScreen({ clinicName, trialEnd, onDone }) {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#000', backgroundImage:'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.12), transparent 70%)', fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color:'#fff', flexDirection:'column', textAlign:'center', padding:24, zIndex:99999, overflow:'hidden' }}>
            
            {/* Ambient animated glow */}
            <div style={{ position:'absolute', width:'80vw', height:'80vw', maxWidth:600, maxHeight:600, background:'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', filter:'blur(60px)', animation:'pulseGlow 4s ease-in-out infinite alternate', pointerEvents:'none' }} />

            <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:420, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition:'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                
                {/* Premium Success Badge */}
                <div style={{ margin:'0 auto 32px', width:72, height:72, borderRadius:20, background:'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(0,0,0,0))', border:'1px solid rgba(139, 92, 246, 0.3)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 40px rgba(139, 92, 246, 0.15)', position:'relative' }}>
                    <div style={{ position:'absolute', inset:0, borderRadius:20, background:'inherit', filter:'blur(10px)', opacity:0.5 }} />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position:'relative', zIndex:2 }}>
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#c4b5fd" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <path d="M20 6L9 17l-5-5" strokeDasharray="30" strokeDashoffset={mounted ? 0 : 30} style={{ transition:'stroke-dashoffset 0.8s ease-out 0.2s' }} />
                    </svg>
                </div>

                <div style={{ fontSize:13, fontWeight:600, color:'#a78bfa', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12, animation:'fadeInUp 0.8s ease-out 0.3s both' }}>
                    Welcome to TokenPe
                </div>
                
                <h1 style={{ fontSize:32, fontWeight:700, margin:'0 0 16px', letterSpacing:'-0.03em', animation:'fadeInUp 0.8s ease-out 0.4s both', color:'#f8fafc' }}>
                    Congratulations! 🎉
                </h1>

                <p style={{ fontSize:15, color:'#94a3b8', lineHeight:1.6, marginBottom:32, animation:'fadeInUp 0.8s ease-out 0.5s both', padding:'0 10px' }}>
                    <strong style={{ color:'#e2e8f0', fontWeight:600 }}>{clinicName}</strong> is now live. We've unlocked the <strong style={{ color:'#c4b5fd', fontWeight:600 }}>14-Day Elite Plan Trial</strong> for you, completely free until {new Date(trialEnd).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}.
                </p>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:40, animation:'fadeInUp 0.8s ease-out 0.6s both' }}>
                    {[
                        { icon: '✓', text: 'Unlimited Patients' },
                        { icon: '✓', text: 'AI Voice in 10 Languages' },
                        { icon: '✓', text: 'WhatsApp CRM & Alerts' },
                        { icon: '✓', text: 'Advanced Analytics' },
                        { icon: '✓', text: 'Multi-Branch Support' },
                        { icon: '✓', text: 'Priority Support Line' }
                    ].map((feature, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:'12px', fontSize:13, color:'#cbd5e1', textAlign:'left' }}>
                            <span style={{ color:'#a78bfa', fontWeight:'bold', fontSize:14 }}>{feature.icon}</span>
                            <span style={{ fontWeight: 500, lineHeight: 1.3 }}>{feature.text}</span>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={onDone} 
                    className="btn-interactive"
                    style={{ 
                        width:'100%', padding:'16px', background:'#fff', color:'#000', border:'none', borderRadius:12, fontSize:15, fontWeight:600, outline:'none', boxShadow:'0 4px 14px 0 rgba(255,255,255,0.1)',
                        animation:'fadeInUp 0.8s ease-out 0.7s both'
                    }}
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
            `}</style>
        </div>
    )
}
