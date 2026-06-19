'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import CelebrationScreen from '../components/CelebrationScreen'

export default function LoginPage() {
    const router = useRouter()
    const [mode, setMode] = useState('login') // 'login' | 'register'
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [celebration, setCelebration] = useState(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Check session via API instead of localStorage directly to be secure
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => {
                    if (data.authenticated && data.clinic) {
                        localStorage.setItem('tokenpe_clinic', JSON.stringify(data.clinic))
                        localStorage.setItem('clinicCode', data.clinic.code)
                        localStorage.setItem('clinicPhone', data.clinic.phone)
                        router.replace('/dashboard')
                    } else {
                        localStorage.removeItem('tokenpe_clinic')
                        localStorage.removeItem('tokenpe_user_clinics')
                    }
                })
                .catch(() => {})

            const params = new URLSearchParams(window.location.search)
            const errType = params.get('error')
            if (errType === 'no_clinic') {
                setError('No clinic account found for this Google email. Please register first, or use your Clinic Code to log in.')
            }
        }
    }, [router])

    const [loginEmail, setLoginEmail] = useState('')
    const [loginPhone, setLoginPhone] = useState('')
    const [loginPin, setLoginPin] = useState('')

    const [regName, setRegName] = useState('')
    const [regPhone, setRegPhone] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regPin, setRegPin] = useState('')
    const [regSpecialty, setRegSpecialty] = useState('General Physician')
    const [customSpecialty, setCustomSpecialty] = useState('')
    const [regCity, setRegCity] = useState('')
    const [regLat, setRegLat] = useState(null)
    const [regLng, setRegLng] = useState(null)
    const [gpsStatus, setGpsStatus] = useState('')

    function requestGps() {
        if (!navigator.geolocation) return
        setGpsStatus('loading')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setRegLat(pos.coords.latitude)
                setRegLng(pos.coords.longitude)
                setGpsStatus('success')
                setError('')
            },
            (err) => {
                console.error('GPS Error:', err)
                if (err.code === err.PERMISSION_DENIED) {
                    setGpsStatus('denied')
                } else {
                    setGpsStatus('error')
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
    }

    useEffect(() => {
        if (mode === 'register') {
            requestGps()
        }
    }, [mode])

    // OTP reset flow
    const [otpToken, setOtpToken] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [newPin, setNewPin] = useState('')
    const [confirmPin, setConfirmPin] = useState('')

    function generateRandomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
        return code
    }

    async function handleGoogleLogin() {
        setGoogleLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { 
                redirectTo: `${window.location.origin}/auth/callback?intent=${mode}`,
                queryParams: {
                    prompt: 'select_account'
                }
            }
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

        if (loginPin.length !== 4) {
            setError('PIN must be exactly 4 digits.')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, phone: loginPhone, pin: loginPin })
            })
            const result = await res.json()

            if (!res.ok) {
                setError(result.message || 'Login failed.')
                setLoading(false)
                return
            }

            localStorage.setItem('tokenpe_clinic', JSON.stringify(result.clinic))
            localStorage.setItem('clinicCode', result.clinic.code)
            localStorage.setItem('clinicPhone', result.clinic.phone)
            localStorage.setItem('tokenpe_user_clinics', JSON.stringify([result.clinic]))
            router.push('/dashboard')
        } catch (err) {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    async function handleRegister(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (regPin.length !== 4) {
            setError('PIN must be exactly 4 digits.')
            setLoading(false)
            return
        }

        if (!regLat || !regLng) {
            setError('Clinic GPS location is mandatory. Please click "Detect GPS Location" and allow permissions.')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: regName, 
                    phone: regPhone, 
                    email: regEmail, 
                    pin: regPin,
                    specialty: regSpecialty === 'Other' ? customSpecialty : regSpecialty,
                    city: regCity,
                    lat: regLat,
                    lng: regLng
                })
            })
            const result = await res.json()

            if (!res.ok) {
                setError(result.message || 'Registration failed.')
                setLoading(false)
                return
            }

            setLoading(false)
            
            // Set localStorage 
            localStorage.setItem('tokenpe_clinic', JSON.stringify(result.clinic))
            localStorage.setItem('clinicCode', result.clinic.code)
            localStorage.setItem('clinicPhone', result.clinic.phone)
            localStorage.setItem('tokenpe_user_clinics', JSON.stringify([result.clinic]))
            
            // Trigger celebration pop-up!
            setCelebration({ clinicName: result.clinic.name, trialEnd: result.clinic.trial_ends_at })
            
        } catch (err) {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    async function handleSendOtp(e) {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, phone: loginPhone })
            })
            const result = await res.json()
            if (!res.ok) {
                setError(result.message || 'Failed to send OTP.')
            } else {
                setOtpToken(result.otpToken)
                setMode('verify-otp')
                setSuccess('OTP sent! Check your email.')
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
        }
        setLoading(false)
    }

    async function handleResetPin(e) {
        e.preventDefault()
        setError('')
        setSuccess('')
        if (newPin !== confirmPin) {
            setError('PINs do not match.')
            return
        }
        if (newPin.length !== 4) {
            setError('PIN must be exactly 4 digits.')
            return
        }
        setLoading(true)
        try {
            const res = await fetch('/api/auth/reset-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otpToken, otp: otpCode, newPin })
            })
            const result = await res.json()
            if (!res.ok) {
                setError(result.message || 'Failed to reset PIN.')
            } else {
                setSuccess('✅ PIN updated! You can now log in.')
                setOtpToken('')
                setOtpCode('')
                setNewPin('')
                setConfirmPin('')
                setTimeout(() => {
                    setMode('login')
                    setSuccess('')
                }, 2500)
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
        }
        setLoading(false)
    }

    if (celebration) {
        return <CelebrationScreen clinicName={celebration.clinicName} trialEnd={celebration.trialEnd} onDone={() => router.push('/dashboard')} />
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }} suppressHydrationWarning={true}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }

                .left-panel {
                    width: 42%;
                    background: linear-gradient(160deg, #1a0b3b 0%, #0f0a2a 60%, #080818 100%);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 48px 44px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                .left-panel::before {
                    content: '';
                    position: absolute;
                    top: -120px; right: -120px;
                    width: 380px; height: 380px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%);
                    pointer-events: none;
                }
                .left-panel::after {
                    content: '';
                    position: absolute;
                    bottom: -80px; left: -80px;
                    width: 300px; height: 300px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }

                .logo-area {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }
                .logo-img {
                    height: 48px;
                    width: auto;
                }

                .panel-divider-wave {
                    position: absolute;
                    top: 0;
                    right: -1px;
                    height: 100%;
                    width: 45px;
                    fill: #ffffff;
                    pointer-events: none;
                    z-index: 10;
                }

                .mid-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0 20px; }
                .mid-desc {
                    font-size: 16px; color: rgba(255,255,255,0.65);
                    line-height: 1.65; margin-bottom: 36px; max-width: 320px;
                }

                .feature-list { display: flex; flex-direction: column; gap: 18px; }
                .feature-item {
                    display: flex; align-items: center; gap: 14px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                    padding: 14px 18px;
                    transition: background 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
                    will-change: transform;
                }
                .feature-item:hover { background: rgba(255,255,255,0.1); transform: translateX(6px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
                .feature-icon {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: rgba(255,255,255,0.1);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 17px; flex-shrink: 0;
                }
                .feature-text { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8); }

                .left-footer { font-size: 12px; color: rgba(255,255,255,0.3); }

                /* RIGHT PANEL */
                .right-panel {
                    flex: 1;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    padding: 48px 40px;
                    overflow-y: auto;
                }
                .form-box { width: 100%; max-width: 400px; margin: auto; }

                .form-title { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
                .form-subtitle { font-size: 14px; color: #64748b; margin-bottom: 28px; }

                .btn-google {
                    width: 100%; padding: 13px 20px;
                    border: 1.5px solid #e2e8f0; border-radius: 10px;
                    background: #fff; color: #0f172a;
                    font-size: 14px; font-weight: 600;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease, background 0.15s ease; margin-bottom: 22px;
                    font-family: inherit;
                    will-change: transform;
                }
                .btn-google:hover { background: #f8fafc; border-color: #cbd5e1; box-shadow: 0 6px 20px rgba(0,0,0,0.09); transform: translateY(-2px); }
                .btn-google:active { transform: scale(0.97); }
                .btn-google:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .or-divider {
                    display: flex; align-items: center; gap: 12px;
                    margin-bottom: 22px;
                }
                .or-line { flex: 1; height: 1px; background: #e2e8f0; }
                .or-text { font-size: 12px; color: #94a3b8; font-weight: 600; }

                /* TABS */
                .tabs {
                    display: flex; border-radius: 10px; overflow: hidden;
                    border: 1.5px solid #e2e8f0; margin-bottom: 22px;
                }
                .tab-btn {
                    flex: 1; padding: 11px 10px;
                    font-size: 14px; font-weight: 600;
                    border: none; background: transparent; cursor: pointer;
                    color: #94a3b8; transition: all 0.2s; font-family: inherit;
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                }
                .tab-btn.active {
                    background: #7C3AED; color: #ffffff;
                }

                /* INPUTS */
                .field { margin-bottom: 16px; }
                .field label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
                .field input, .field select {
                    width: 100%; padding: 12px 14px;
                    border: 1.5px solid #e2e8f0; border-radius: 10px;
                    font-size: 14px; font-family: inherit; color: #0f172a;
                    background: #f9fafb; outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .field select {
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 14px center;
                    background-size: 14px;
                    padding-right: 40px;
                }
                .field input::placeholder { color: #94a3b8; }
                .field input:focus, .field select:focus { border-color: #7C3AED; background: #fff; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }

                .btn-submit {
                    width: 100%; padding: 13px;
                    background: linear-gradient(135deg, #7C3AED, #4F46E5); color: #fff;
                    border: none; border-radius: 10px;
                    font-size: 15px; font-weight: 700; cursor: pointer;
                    transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s ease, background 0.2s ease; margin-top: 6px; font-family: inherit;
                    will-change: transform;
                }
                .btn-submit:hover:not(:disabled) { background: linear-gradient(135deg, #6d28d9, #4338ca); box-shadow: 0 10px 30px rgba(124,58,237,0.4); transform: translateY(-2px); }
                .btn-submit:active:not(:disabled) { transform: scale(0.96); box-shadow: 0 3px 10px rgba(124,58,237,0.25); }
                .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .alert-error {
                    background: #fef2f2; border: 1px solid #fecaca;
                    color: #dc2626; border-radius: 10px;
                    padding: 12px 14px; font-size: 13px; font-weight: 500;
                    margin-bottom: 16px; display: flex; align-items: flex-start; gap: 8px;
                }
                .alert-success {
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    color: #16a34a; border-radius: 10px;
                    padding: 12px 14px; font-size: 13px; font-weight: 500;
                    margin-bottom: 16px;
                }

                /* RESPONSIVE */
                @media (max-width: 768px) {
                    .left-panel { display: none; }
                    .right-panel { padding: 40px 24px; }
                }
            `}</style>

            {/* LEFT PANEL */}
            <div className="left-panel">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 1000" preserveAspectRatio="none" className="panel-divider-wave">
                    <path d="M100,0 L0,0 C30,150 70,350 40,500 C10,650 60,850 100,1000 Z" />
                </svg>
                <div className="logo-area" onClick={() => router.push('/')}>
                    <img src="/logo.svg" alt="TokenPe" className="logo-img" />
                </div>

                <div className="mid-content">
                    <p className="mid-desc">
                        Digital OPD queue management for modern clinics. No crowding. No confusion.
                    </p>
                    <div className="feature-list">
                        <div className="feature-item animate-slide-right animate-delay-2">
                            <div className="feature-icon">🎙️</div>
                            <span className="feature-text">Voice updates in 10 Indian languages</span>
                        </div>
                        <div className="feature-item animate-slide-right animate-delay-3">
                            <div className="feature-icon">💬</div>
                            <span className="feature-text">Patients join via WhatsApp — zero app needed</span>
                        </div>
                        <div className="feature-item animate-slide-right animate-delay-4">
                            <div className="feature-icon">🔔</div>
                            <span className="feature-text">Real-time notifications for every action</span>
                        </div>
                    </div>
                </div>

                <div className="left-footer">Made in India · TokenPe © 2026</div>
            </div>

            {/* RIGHT PANEL */}
            <div className="right-panel">
                <div className="form-box animate-fade-up">
                    <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: 0 }} suppressHydrationWarning={true}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Back to Home
                    </button>
                    <div className="form-title">{mode === 'login' ? 'Welcome back' : 'New Clinic'}</div>
                    <div className="form-subtitle">
                        {mode === 'login' ? 'Sign in to your TokenPe dashboard' : 'Register your clinic and get started in 2 minutes'}
                    </div>

                    {/* Google */}
                    <button className="btn-google" onClick={handleGoogleLogin} disabled={googleLoading} suppressHydrationWarning={true}>
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                        </svg>
                        {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                    </button>

                    <div className="or-divider">
                        <div className="or-line" /><span className="or-text">or</span><div className="or-line" />
                    </div>

                    {/* Tabs */}
                    <div className="tabs">
                        <button
                            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                            suppressHydrationWarning={true}
                        >
                            🔑 Login
                        </button>
                        <button
                            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                            suppressHydrationWarning={true}
                        >
                            🏥 New Clinic
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="alert-error">
                            <span>✖</span><span>{error}</span>
                        </div>
                    )}
                    {success && <div className="alert-success">{success}</div>}

                    {/* Forms */}
                    {mode === 'login' ? (
                        <form onSubmit={handleLogin}>
                            <div className="field">
                                <label>Registered Email</label>
                                <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="doctor@gmail.com" type="email" required suppressHydrationWarning={true} />
                            </div>
                            <div className="field">
                                <label>Registered Phone</label>
                                <input value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="9876543210" required type="tel" suppressHydrationWarning={true} />
                            </div>
                            <div className="field" style={{ position: 'relative' }}>
                                <label>4-Digit PIN</label>
                                <input value={loginPin} onChange={e => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required type="password" suppressHydrationWarning={true} />
                                <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: 'none', fontSize: 13, color: '#7C3AED', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>Forgot PIN?</button>
                            </div>
                            <button type="submit" disabled={loading} className="btn-submit" suppressHydrationWarning={true}>
                                {loading ? 'Signing in...' : 'Sign in →'}
                            </button>
                        </form>
                    ) : mode === 'forgot' ? (
                        <form onSubmit={handleSendOtp}>
                            <div style={{ background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#6d28d9', fontWeight: 500 }}>
                                🔐 Enter your registered email and phone. We'll send a 6-digit OTP to your inbox.
                            </div>
                            <div className="field">
                                <label>Registered Email</label>
                                <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="doctor@gmail.com" type="email" required suppressHydrationWarning={true} />
                            </div>
                            <div className="field">
                                <label>Registered Phone</label>
                                <input value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="9876543210" required type="tel" suppressHydrationWarning={true} />
                            </div>
                            <button type="submit" disabled={loading} className="btn-submit" suppressHydrationWarning={true}>
                                {loading ? 'Sending OTP...' : 'Send OTP to Email →'}
                            </button>
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', fontSize: 13, color: '#64748b', cursor: 'pointer', fontWeight: 500 }}>← Back to Login</button>
                            </div>
                        </form>
                    ) : mode === 'verify-otp' ? (
                        <form onSubmit={handleResetPin}>
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#16a34a', fontWeight: 500 }}>
                                ✅ Check your email for the 6-digit OTP. It expires in 10 minutes.
                            </div>
                            <div className="field">
                                <label>6-Digit OTP</label>
                                <input value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" required type="text" inputMode="numeric" maxLength={6} style={{ letterSpacing: 6, fontSize: 22, textAlign: 'center', fontWeight: 700 }} suppressHydrationWarning={true} />
                            </div>
                            <div className="field">
                                <label>New 4-Digit PIN</label>
                                <input value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required type="password" suppressHydrationWarning={true} />
                            </div>
                            <div className="field">
                                <label>Confirm New PIN</label>
                                <input value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required type="password" suppressHydrationWarning={true} />
                            </div>
                            <button type="submit" disabled={loading} className="btn-submit" suppressHydrationWarning={true}>
                                {loading ? 'Updating PIN...' : 'Reset PIN →'}
                            </button>
                            <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
                                <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', fontSize: 13, color: '#7C3AED', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</button>
                                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', fontSize: 13, color: '#64748b', cursor: 'pointer', fontWeight: 500 }}>← Back to Login</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <div className="field">
                                <label>Clinic Name *</label>
                                <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Dr. Sharma Clinic" required suppressHydrationWarning={true} />
                            </div>
                            <div className="field">
                                <label>Specialty *</label>
                                <select value={regSpecialty} onChange={e => setRegSpecialty(e.target.value)} required suppressHydrationWarning={true}>
                                    <option value="Other">Other (Custom)</option>
                                    <option value="General Physician">General Physician</option>
                                    <option value="Pediatrician">Pediatrician</option>
                                    <option value="Dermatologist">Dermatologist</option>
                                    <option value="Gynecologist">Gynecologist</option>
                                    <option value="Orthopedic">Orthopedic</option>
                                    <option value="Dentist">Dentist</option>
                                    <option value="ENT">ENT</option>
                                    <option value="Ophthalmologist">Ophthalmologist</option>
                                    <option value="Cardiologist">Cardiologist</option>
                                    <option value="Neurologist">Neurologist</option>
                                    <option value="Psychiatrist">Psychiatrist</option>
                                    <option value="Urologist">Urologist</option>
                                    <option value="Oncologist">Oncologist</option>
                                    <option value="Diabetologist">Diabetologist</option>
                                    <option value="Physiotherapist">Physiotherapist</option>
                                </select>
                            </div>
                            {regSpecialty === 'Other' && (
                                <div className="field">
                                    <label>Enter Custom Specialty *</label>
                                    <input value={customSpecialty} onChange={e => setCustomSpecialty(e.target.value)} placeholder="e.g. Homeopath, Ayurveda, etc." required suppressHydrationWarning={true} />
                                </div>
                            )}
                            <div className="field">
                                <label>City *</label>
                                <input value={regCity} onChange={e => setRegCity(e.target.value)} placeholder="e.g. Mumbai, Bangalore" required suppressHydrationWarning={true} />
                            </div>
                            <div className="field">
                                <label>Clinic GPS Location</label>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <button 
                                        type="button" 
                                        onClick={requestGps}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: 10,
                                            border: '1.5px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: '#334155',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            outline: 'none'
                                        }}
                                        suppressHydrationWarning={true}
                                    >
                                        📍 {gpsStatus === 'loading' ? 'Detecting GPS...' : gpsStatus === 'success' ? 'Location Linked' : 'Detect GPS Location'}
                                    </button>
                                    {gpsStatus === 'success' && (
                                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✅ GPS Active</span>
                                    )}
                                    {gpsStatus === 'denied' && (
                                        <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, lineHeight: 1.3 }}>⚠️ Permission Denied.<br/>Please allow location access.</span>
                                    )}
                                    {gpsStatus === 'error' && (
                                        <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>⚠️ Failed to get location</span>
                                    )}
                                </div>
                            </div>
                            <div className="field">
                                <label>Phone Number *</label>
                                <input value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="9876543210" required type="tel" suppressHydrationWarning={true} />
                            </div>
                            <div className="field">
                                <label>Registered Email *</label>
                                <input value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="doctor@gmail.com" type="email" required suppressHydrationWarning={true} />
                            </div>
                            <div className="field">
                                <label>Set 4-Digit PIN *</label>
                                <input value={regPin} onChange={e => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required type="password" suppressHydrationWarning={true} />
                            </div>
                            <div style={{ background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#6d28d9', fontWeight: 500 }}>
                                🎲 A unique clinic code will be auto-generated. You can customize it later from your dashboard.
                            </div>
                            <button type="submit" disabled={loading} className="btn-submit" suppressHydrationWarning={true}>
                                {loading ? 'Creating account...' : 'Create Account →'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}