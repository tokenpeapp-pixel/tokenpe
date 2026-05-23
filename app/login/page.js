'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [mode, setMode] = useState('login') // 'login' | 'register'
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const errType = params.get('error')
            if (errType === 'no_clinic') {
                setError('No clinic account found for this Google email. Please register first, or use your Clinic Code to log in.')
            }
        }
    }, [])

    // Login
    const [loginCode, setLoginCode] = useState('')
    const [loginPhone, setLoginPhone] = useState('')

    // Register
    const [regName, setRegName] = useState('')
    const [regPhone, setRegPhone] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regCode, setRegCode] = useState('')

    function generateCode(name) {
        const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
        const num = Math.floor(Math.random() * 900) + 100
        return clean + num
    }

    async function handleGoogleLogin() {
        setGoogleLoading(true)
        setError('')
        // Supabase Google OAuth
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback?intent=${mode}` }
        })
        if (error) {
            setError('Google sign in failed. Please try again.')
            setGoogleLoading(false)
        }
    }

    async function handleLogin(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('code', loginCode.toUpperCase().trim())
            .eq('phone', loginPhone.trim())
            .single()

        if (error || !data) {
            setError('Invalid clinic code or phone number.')
            setLoading(false)
            return
        }

        localStorage.setItem('tokenpe_clinic', JSON.stringify(data))
        localStorage.setItem('clinicCode', data.code)
        localStorage.setItem('clinicPhone', data.phone)
        router.push('/dashboard')
    }

    async function handleRegister(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const code = regCode || generateCode(regName)

        const { data: existing } = await supabase
            .from('clinics').select('id').eq('code', code).single()

        if (existing) {
            setError('This clinic code is taken. Try a different one.')
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('clinics')
            .insert({ name: regName, phone: regPhone, email: regEmail, code })
            .select().single()

        if (error) {
            setError('Something went wrong. Please try again.')
            setLoading(false)
            return
        }

        setSuccess(`✅ Registered! Your clinic code is: ${code}`)
        setLoading(false)
        setTimeout(() => {
            localStorage.setItem('tokenpe_clinic', JSON.stringify(data))
            localStorage.setItem('clinicCode', data.code)
            localStorage.setItem('clinicPhone', data.phone)
            router.push('/dashboard')
        }, 1500)
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #080818 0%, #1a0b3b 50%, #0c1445 100%)',
            display: 'flex',
            fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                @media (max-width: 767px) {
                    .left-panel { display: none !important; }
                }
                
                .login-orb1 {
                    position: absolute; width: 500px; height: 500px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%);
                    top: -150px; left: -100px; pointer-events: none;
                    animation: float1 10s ease-in-out infinite;
                }
                .login-orb2 {
                    position: absolute; width: 400px; height: 400px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%);
                    bottom: -100px; right: 30vw; pointer-events: none;
                    animation: float2 12s ease-in-out infinite;
                }
                
                @keyframes float1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }
                @keyframes float2 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(24px) scale(0.97)} }
                
                .glass-feat {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    backdrop-filter: blur(10px);
                    transition: transform 0.2s, background 0.2s;
                }
                .glass-feat:hover {
                    transform: translateX(5px);
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(124,58,237,0.3);
                }
            `}</style>
            
            <div className="login-orb1" />
            <div className="login-orb2" />

            {/* ── Left panel — branding ── */}
            <div className="left-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ marginBottom: '28px', cursor: 'pointer' }} onClick={() => router.push('/')}>
                    <img src="/logo.svg" alt="TokenPe Logo" style={{ height: '56px', width: 'auto' }} />
                </div>
                <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>
                    Welcome to the<br/>
                    <span style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        future of queues.
                    </span>
                </h1>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 400, maxWidth: 400, lineHeight: 1.7 }}>
                    Digital OPD queue management for modern clinics. No crowding. No confusion. Just better patient care.
                </div>

                {/* Feature list */}
                <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                    {[
                        ['🎙️', 'Voice updates in 10 Indian languages'],
                        ['💬', 'Patients join via WhatsApp — zero app needed'],
                        ['⚡', 'Real-time live queue dashboard'],
                    ].map(([icon, text]) => (
                        <div key={text} className="glass-feat">
                            <div style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))',
                                border: '1px solid rgba(124,58,237,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, flexShrink: 0, boxShadow: '0 4px 12px rgba(124,58,237,0.2)'
                            }}>{icon}</div>
                            <div style={{ fontSize: 15, color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4 }}>{text}</div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 60, fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                    Made with ❤️ in India · TokenPe © 2026
                </div>
            </div>

            {/* ── Right panel — form ── */}
            <div style={{
                width: '100%',
                maxWidth: 520,
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '48px 48px',
                position: 'relative',
                zIndex: 10,
                boxShadow: '-20px 0 60px rgba(0,0,0,0.3)'
            }}>

                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
                        {mode === 'login' ? 'Welcome back' : 'Register clinic'}
                    </div>
                    <div style={{ fontSize: 15, color: '#64748B', marginTop: 6 }}>
                        {mode === 'login'
                            ? 'Sign in to access your TokenPe console'
                            : 'Get your digital queue running in 2 mins'}
                    </div>
                </div>

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#0F172A',
                        cursor: 'pointer',
                        marginBottom: 24,
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                    {/* Google icon SVG */}
                    <svg width="20" height="20" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                        <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                    </svg>
                    {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                    <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>or</div>
                    <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                </div>

                {/* Tab toggle */}
                <div style={{
                    display: 'flex',
                    background: '#F8FAFC',
                    borderRadius: 12,
                    padding: 4,
                    marginBottom: 28,
                    border: '1px solid #F1F5F9'
                }}>
                    {['login', 'register'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setMode(tab); setError(''); setSuccess('') }}
                            style={{
                                flex: 1, padding: '10px',
                                border: 'none', borderRadius: 8,
                                fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.2s',
                                background: mode === tab ? '#fff' : 'transparent',
                                color: mode === tab ? '#7C3AED' : '#64748B',
                                boxShadow: mode === tab ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                            }}
                        >
                            {tab === 'login' ? 'Login with Code' : 'New Clinic'}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: '#FFF1F2', border: '1px solid #FECDD3',
                        borderRadius: 12, padding: '12px 16px',
                        fontSize: 14, color: '#BE123C', marginBottom: 20,
                        fontWeight: 500, display: 'flex', gap: 8, alignItems: 'flex-start'
                    }}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div style={{
                        background: '#F0FDF4', border: '1px solid #BBF7D0',
                        borderRadius: 12, padding: '12px 16px',
                        fontSize: 14, color: '#15803D', marginBottom: 20,
                        fontWeight: 600, display: 'flex', gap: 8, alignItems: 'flex-start'
                    }}>
                        <span>✅</span>
                        <span>{success}</span>
                    </div>
                )}

                {/* LOGIN FORM */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Clinic Code</label>
                            <input
                                value={loginCode}
                                onChange={e => setLoginCode(e.target.value)}
                                placeholder="e.g. SHARMA001"
                                required
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ marginBottom: 28 }}>
                            <label style={labelStyle}>Registered Phone</label>
                            <input
                                value={loginPhone}
                                onChange={e => setLoginPhone(e.target.value)}
                                placeholder="9876543210"
                                required
                                type="tel"
                                style={inputStyle}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary" style={btnPrimaryStyle}>
                            {loading ? 'Signing in...' : 'Sign in to Console →'}
                        </button>
                    </form>
                )}

                {/* REGISTER FORM */}
                {mode === 'register' && (
                    <form onSubmit={handleRegister}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Clinic Name *</label>
                            <input
                                value={regName}
                                onChange={e => {
                                    setRegName(e.target.value)
                                    if (!regCode) setRegCode(generateCode(e.target.value))
                                }}
                                placeholder="Dr. Sharma Clinic"
                                required
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Phone Number *</label>
                            <input
                                value={regPhone}
                                onChange={e => setRegPhone(e.target.value)}
                                placeholder="9876543210"
                                required
                                type="tel"
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Email (optional)</label>
                            <input
                                value={regEmail}
                                onChange={e => setRegEmail(e.target.value)}
                                placeholder="doctor@gmail.com"
                                type="email"
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ marginBottom: 28 }}>
                            <label style={labelStyle}>
                                Clinic Code
                                <span style={{ color: '#94A3B8', fontWeight: 400, marginLeft: 6 }}>
                                    (auto-generated, you can edit)
                                </span>
                            </label>
                            <input
                                value={regCode}
                                onChange={e => setRegCode(e.target.value.toUpperCase())}
                                placeholder="SHARMA001"
                                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 1.5, background: '#F8FAFC', color: '#7C3AED', fontWeight: 700 }}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary" style={btnPrimaryStyle}>
                            {loading ? 'Creating account...' : 'Create Clinic Account →'}
                        </button>
                    </form>
                )}

                {/* Subscription hint — for later */}
                <div style={{
                    marginTop: 36,
                    padding: '16px',
                    background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{ width: 36, height: 36, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: 18 }}>✨</div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Growth plan coming soon</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: 500 }}>
                            Patient history · Multi-queue support · Analytics
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

const labelStyle = {
    fontSize: 13, fontWeight: 700, color: '#334155',
    display: 'block', marginBottom: 8
}

const inputStyle = {
    width: '100%', padding: '14px 16px',
    border: '1px solid #E2E8F0', borderRadius: 12,
    fontSize: 15, outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif",
    color: '#0F172A', background: '#fff',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
}

const btnPrimaryStyle = {
    width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
    color: 'white', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '0.2px',
    boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s'
}