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
            background: 'linear-gradient(135deg, #0a2540 0%, #0F4C75 60%, #0a3554 100%)',
            display: 'flex',
            fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}>

            {/* ── Left panel — branding ── */}
            <style>{`
                @media (max-width: 767px) {
                    .left-panel { display: none !important; }
                }
            `}</style>
            <div className="left-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
            }}>
                <div style={{ marginBottom: '28px' }}>
                    <img src="/logo.svg" alt="TokenPe Logo" style={{ height: '64px', width: 'auto' }} />
                </div>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 10, fontWeight: 400, maxWidth: 320, lineHeight: 1.7 }}>
                    Digital OPD queue management for modern clinics. No crowding. No confusion.
                </div>

                {/* Feature list */}
                <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                        ['🎙️', 'Voice updates in 10 Indian languages'],
                        ['📱', 'Patients join via WhatsApp — zero app needed'],
                        ['🔔', 'Real-time notifications for every action'],
                    ].map(([icon, text]) => (
                        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 18, flexShrink: 0
                            }}>{icon}</div>
                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{text}</div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 60, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                    Made in India · TokenPe © 2026
                </div>
            </div>

            {/* ── Right panel — form ── */}
            <div style={{
                width: '100%',
                maxWidth: 480,
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '48px 40px',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.2)',
            }}>

                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
                        {mode === 'login' ? 'Welcome back' : 'Register your clinic'}
                    </div>
                    <div style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
                        {mode === 'login'
                            ? 'Sign in to your TokenPe dashboard'
                            : 'Get started in under 2 minutes'}
                    </div>
                </div>

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: 10,
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#1E293B',
                        cursor: 'pointer',
                        marginBottom: 20,
                        transition: 'all 0.15s',
                    }}
                >
                    {/* Google icon SVG */}
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                        <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                    </svg>
                    {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                    <div style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 500 }}>or</div>
                    <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                </div>

                {/* Tab toggle */}
                <div style={{
                    display: 'flex',
                    background: '#F8FAFC',
                    borderRadius: 10,
                    padding: 4,
                    marginBottom: 24,
                    border: '1px solid #F1F5F9'
                }}>
                    {['login', 'register'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setMode(tab); setError(''); setSuccess('') }}
                            style={{
                                flex: 1, padding: '9px',
                                border: 'none', borderRadius: 8,
                                fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.15s',
                                background: mode === tab ? '#0F4C75' : 'transparent',
                                color: mode === tab ? 'white' : '#94A3B8',
                            }}
                        >
                            {tab === 'login' ? '🔑 Login' : '🩺 New Clinic'}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: '#FEF2F2', border: '1px solid #FECACA',
                        borderRadius: 8, padding: '10px 14px',
                        fontSize: 13, color: '#DC2626', marginBottom: 16
                    }}>❌ {error}</div>
                )}

                {/* Success */}
                {success && (
                    <div style={{
                        background: '#F0FDF4', border: '1px solid #BBF7D0',
                        borderRadius: 8, padding: '10px 14px',
                        fontSize: 13, color: '#16A34A', marginBottom: 16
                    }}>{success}</div>
                )}

                {/* LOGIN FORM */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Clinic Code</label>
                            <input
                                value={loginCode}
                                onChange={e => setLoginCode(e.target.value)}
                                placeholder="e.g. SHARMA001"
                                required
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ marginBottom: 22 }}>
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
                        <button type="submit" disabled={loading} style={btnPrimaryStyle}>
                            {loading ? 'Signing in...' : 'Sign in →'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94A3B8' }}>
                            New clinic?{' '}
                            <span onClick={() => setMode('register')} style={linkStyle}>
                                Register here
                            </span>
                        </div>
                    </form>
                )}

                {/* REGISTER FORM */}
                {mode === 'register' && (
                    <form onSubmit={handleRegister}>
                        <div style={{ marginBottom: 14 }}>
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
                        <div style={{ marginBottom: 14 }}>
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
                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Email (optional)</label>
                            <input
                                value={regEmail}
                                onChange={e => setRegEmail(e.target.value)}
                                placeholder="doctor@gmail.com"
                                type="email"
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ marginBottom: 22 }}>
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
                                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 2, background: '#F8FAFC' }}
                            />
                        </div>
                        <button type="submit" disabled={loading} style={btnPrimaryStyle}>
                            {loading ? 'Creating account...' : 'Create Clinic Account →'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94A3B8' }}>
                            Already registered?{' '}
                            <span onClick={() => setMode('login')} style={linkStyle}>
                                Login here
                            </span>
                        </div>
                    </form>
                )}

                {/* Subscription hint — for later */}
                <div style={{
                    marginTop: 32,
                    padding: '12px 16px',
                    background: '#F8FAFC',
                    borderRadius: 10,
                    border: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                }}>
                    <span style={{ fontSize: 18 }}>✨</span>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Pro plan coming soon</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                            Unlimited clinics · Analytics · Priority support
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

const labelStyle = {
    fontSize: 13, fontWeight: 600, color: '#374151',
    display: 'block', marginBottom: 6
}

const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #E2E8F0', borderRadius: 9,
    fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    color: '#0F172A', background: 'white',
    transition: 'border-color 0.15s'
}

const btnPrimaryStyle = {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)',
    color: 'white', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.2px'
}

const linkStyle = {
    color: '#0F4C75', cursor: 'pointer',
    fontWeight: 600, textDecoration: 'underline'
}