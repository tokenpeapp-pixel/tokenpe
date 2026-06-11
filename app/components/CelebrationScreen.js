'use client'
import { useEffect, useRef } from 'react'

// ─── CONFETTI ENGINE ──────────────────────────────────────────────────────────
export function ConfettiCanvas() {
    const canvasRef = useRef(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        const COLORS = ['#7C3AED','#8B5CF6','#C4B5FD','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899','#fff']
        const SHAPES = ['circle','rect','triangle']
        const particles = []
        const origins = [
            { x: canvas.width * 0.3, y: canvas.height * 0.4 },
            { x: canvas.width * 0.7, y: canvas.height * 0.35 },
            { x: canvas.width * 0.5, y: canvas.height * 0.25 },
        ]
        for (let i = 0; i < 220; i++) {
            const origin = origins[i % origins.length]
            const angle = Math.random() * Math.PI * 2
            const speed = 4 + Math.random() * 14
            particles.push({
                x: origin.x + (Math.random() - 0.5) * 60,
                y: origin.y + (Math.random() - 0.5) * 60,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 10,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
                size: 6 + Math.random() * 10,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                opacity: 1,
                gravity: 0.35 + Math.random() * 0.2,
            })
        }
        let animId
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            let alive = false
            for (const p of particles) {
                if (p.opacity <= 0) continue
                alive = true
                p.x += p.vx; p.y += p.vy; p.vy += p.gravity
                p.vx *= 0.99; p.rotation += p.rotSpeed
                if (p.y > canvas.height * 0.65) p.opacity -= 0.02
                ctx.save()
                ctx.globalAlpha = Math.max(0, p.opacity)
                ctx.translate(p.x, p.y); ctx.rotate(p.rotation)
                ctx.fillStyle = p.color
                if (p.shape === 'circle') {
                    ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill()
                } else if (p.shape === 'rect') {
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
                } else {
                    ctx.beginPath(); ctx.moveTo(0, -p.size / 2)
                    ctx.lineTo(p.size / 2, p.size / 2); ctx.lineTo(-p.size / 2, p.size / 2)
                    ctx.closePath(); ctx.fill()
                }
                ctx.restore()
            }
            if (alive) animId = requestAnimationFrame(draw)
        }
        draw()
        return () => cancelAnimationFrame(animId)
    }, [])
    return <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:10 }} />
}

// ─── CELEBRATION SCREEN ───────────────────────────────────────────────────────
export default function CelebrationScreen({ clinicName, trialEnd, onDone }) {
    return (
        <div style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0f0a2a 0%,#1a0b3b 50%,#0c1445 100%)', fontFamily:"'Inter','DM Sans',sans-serif", color:'#fff', flexDirection:'column', textAlign:'center', padding:24, zIndex:99999, overflow:'hidden' }}>
            <ConfettiCanvas />
            {/* Glow blob */}
            <div style={{ position:'absolute', width:600, height:600, background:'radial-gradient(circle,rgba(124,58,237,0.3) 0%,transparent 70%)', borderRadius:'50%', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:0, animation:'pulse 2s ease-in-out infinite' }} />
            {/* Card */}
            <div style={{ position:'relative', zIndex:5, background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)', border:'1px solid rgba(124,58,237,0.4)', borderRadius:32, padding:'48px 40px', maxWidth:500, width:'100%', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', animation:'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
                <div style={{ fontSize:80, marginBottom:4, lineHeight:1, animation:'bounce 0.6s ease 0.3s both' }}>🎉</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#f59e0b', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>🎊 Trial Activated 🎊</div>
                <div style={{ fontSize:28, fontWeight:900, marginBottom:20, letterSpacing:'-0.5px', lineHeight:1.25 }}>
                    Welcome to TokenPe,<br />
                    <span style={{ background:'linear-gradient(90deg,#a78bfa,#60a5fa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                        {clinicName}!
                    </span>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.08))', border:'1.5px solid rgba(245,158,11,0.5)', borderRadius:20, padding:'10px 24px', marginBottom:24 }}>
                    <span style={{ fontSize:20 }}>🥇</span>
                    <span style={{ fontWeight:800, color:'#fbbf24', fontSize:15, letterSpacing:0.5 }}>14-DAY ELITE PLAN — FREE!</span>
                </div>
                <div style={{ color:'rgba(255,255,255,0.7)', lineHeight:1.9, marginBottom:28, fontSize:15 }}>
                    You have <strong style={{ color:'#a78bfa' }}>unlimited patients</strong>, AI voice notes,<br />
                    and all Elite features unlocked — free until&nbsp;
                    <strong style={{ color:'#34d399' }}>
                        {new Date(trialEnd).toLocaleDateString('en-IN',{ day:'numeric', month:'long', year:'numeric' })}
                    </strong>.
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:32 }}>
                    {['♾️ Unlimited Patients','🎙️ AI Voice Notes','🔑 Custom Clinic Code','⚡ Priority Support'].map(f => (
                        <span key={f} style={{ background:'rgba(124,58,237,0.2)', border:'1px solid rgba(124,58,237,0.4)', borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:700, color:'#c4b5fd' }}>{f}</span>
                    ))}
                </div>
                <button onClick={onDone} style={{ width:'100%', padding:'16px 24px', background:'linear-gradient(135deg,#7c3aed,#5b21b6)', border:'none', borderRadius:16, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', boxShadow:'0 8px 32px rgba(124,58,237,0.5)', letterSpacing:0.3 }}>
                    🚀 Enter Your Dashboard
                </button>
            </div>
            <style>{`
                @keyframes slideUp { from{opacity:0;transform:translateY(40px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
                @keyframes pulse { 0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)} }
                @keyframes bounce { 0%{transform:scale(0) rotate(-20deg)} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0)} }
            `}</style>
        </div>
    )
}
