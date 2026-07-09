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
                .catch(() => { })

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
                    width: 45%;
                    background: #022c22;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 48px 60px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    z-index: 1;
                }
                .left-panel::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-image: url('/clinic-bg.jpg');
                    background-size: cover;
                    background-position: center;
                    opacity: 0.25;
                    mix-blend-mode: overlay;
                    z-index: -1;
                }
                .left-panel::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(160deg, rgba(2,44,34,0.92) 0%, rgba(6,78,59,0.85) 100%);
                    z-index: -1;
                }

                .logo-area {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    z-index: 2;
                }
                .logo-img {
                    height: 48px;
                    width: auto;
                }

                .mid-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0 20px; z-index: 2; }
                .main-heading {
                    font-size: 38px;
                    font-weight: 800;
                    line-height: 1.2;
                    margin-bottom: 16px;
                }
                .text-highlight { color: #10B981; }
                .mid-desc {
                    font-size: 16px; color: rgba(255,255,255,0.75);
                    line-height: 1.6; margin-bottom: 40px; max-width: 360px;
                }

                .feature-list { display: flex; flex-direction: column; gap: 16px; }
                .feature-item {
                    display: flex; align-items: center; gap: 16px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    padding: 16px;
                    transition: background 0.25s ease, transform 0.25s ease;
                    max-width: 400px;
                }
                .feature-item:hover { background: rgba(255,255,255,0.06); transform: translateX(4px); }
                .feature-icon {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: rgba(16,185,129,0.2);
                    color: #10B981;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 18px; flex-shrink: 0;
                }
                .feature-text-block { display: flex; flex-direction: column; }
                .feature-text { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px; }
                .feature-sub { font-size: 12px; color: rgba(255,255,255,0.6); }

                .left-footer { font-size: 13px; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 8px; font-weight: 500; z-index: 2; }

                /* RIGHT PANEL */
                .right-panel {
                    flex: 1;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    padding: 48px 40px;
                    overflow-y: auto;
                    position: relative;
                }

                .form-box { 
                    width: 100%; max-width: 420px; margin: auto; 
                    background: #fff;
                    padding: 24px;
                    position: relative;
                    z-index: 1;
                }

                .form-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
                .form-subtitle { font-size: 14px; color: #64748b; margin-bottom: 28px; }

                .btn-google {
                    width: 100%; padding: 12px 20px;
                    border: 1px solid #e2e8f0; border-radius: 8px;
                    background: #fff; color: #334155;
                    font-size: 14px; font-weight: 600;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s; margin-bottom: 24px;
                    font-family: inherit;
                }
                .btn-google:hover { background: #f8fafc; border-color: #cbd5e1; }

                .or-divider {
                    display: flex; align-items: center; gap: 12px;
                    margin-bottom: 24px;
                }
                .or-line { flex: 1; height: 1px; background: #e2e8f0; }
                .or-text { font-size: 12px; color: #94a3b8; font-weight: 500; }

                /* TABS */
                .tabs {
                    display: flex; border-radius: 8px; overflow: hidden;
                    border: 1px solid #e2e8f0; margin-bottom: 24px;
                    background: #fff;
                }
                .tab-btn {
                    flex: 1; padding: 12px 10px;
                    font-size: 14px; font-weight: 600;
                    border: none; background: transparent; cursor: pointer;
                    color: #64748b; transition: all 0.2s; font-family: inherit;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .tab-btn.active {
                    background: #059669; color: #ffffff;
                    border-radius: 8px;
                }

                /* INPUTS */
                .field { margin-bottom: 20px; }
                .field label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; }
                .field input, .field select {
                    width: 100%; padding: 12px 14px;
                    border: 1px solid #e2e8f0; border-radius: 8px;
                    font-size: 14px; font-family: inherit; color: #0f172a;
                    background: #fff; outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .field-icon-wrapper { position: relative; }
                .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; }
                .field input.with-icon { padding-left: 40px; }

                .field select {
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 14px center;
                    background-size: 14px;
                }
                .field input::placeholder { color: #cbd5e1; font-weight: 400; }
                .field input:focus, .field select:focus { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }

                .btn-submit {
                    width: 100%; padding: 14px;
                    background: #059669; color: #fff;
                    border: none; border-radius: 8px;
                    font-size: 15px; font-weight: 600; cursor: pointer;
                    transition: all 0.2s; margin-top: 8px; font-family: inherit;
                }
                .btn-submit:hover:not(:disabled) { background: #047857; }
                .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

                .alert-error {
                    background: #fef2f2; border: 1px solid #fecaca;
                    color: #dc2626; border-radius: 8px;
                    padding: 12px 14px; font-size: 13px; font-weight: 500;
                    margin-bottom: 20px; display: flex; align-items: flex-start; gap: 8px;
                }
                .alert-success {
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    color: #16a34a; border-radius: 8px;
                    padding: 12px 14px; font-size: 13px; font-weight: 500;
                    margin-bottom: 20px;
                }

                .right-footer { text-align: center; margin-top: 24px; font-size: 13px; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 500; }

                /* RESPONSIVE */
                @media (max-width: 768px) {
                    .left-panel { display: none; }
                    .right-panel { padding: 24px 16px; background: #f8fafc; }
                    .form-box { padding: 32px 24px; box-shadow: none; border-color: #e2e8f0; }
                }
            `}</style>

            {/* LEFT PANEL */}
            <div className="left-panel">
                <div className="logo-area" onClick={() => router.push('/')}>
                    <img src="/logo.svg" alt="TokenPe" className="logo-img" />
                </div>

                <div className="mid-content">
                    <div className="main-heading">
                        Smart Queue<br />
                        Management for<br />
                        <span className="text-highlight">Modern Clinics</span>
                    </div>
                    <p className="mid-desc">
                        Digital OPD queue management that reduces crowding, saves time, and improves patient experience.
                    </p>
                    <div className="feature-list">
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                            </div>
                            <div className="feature-text-block">
                                <span className="feature-text">Voice updates in 10 Indian languages</span>
                                <span className="feature-sub">Inclusive. Accessible. Effortless.</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            </div>
                            <div className="feature-text-block">
                                <span className="feature-text">Patients join via WhatsApp</span>
                                <span className="feature-sub">No app download. No sign-up.</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            </div>
                            <div className="feature-text-block">
                                <span className="feature-text">Real-time notifications</span>
                                <span className="feature-sub">Stay informed. Always.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="left-footer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    Secure. Reliable. Built for Healthcare.
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="right-panel">
                <div className="form-box animate-fade-up">
                    <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: 0 }} suppressHydrationWarning={true}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Back to Home
                    </button>
                    <div className="form-title">{mode === 'login' ? 'Welcome back! 👋' : 'New Clinic 👋'}</div>
                    <div className="form-subtitle">
                        {mode === 'login' ? 'Sign in to your TokenPe dashboard' : 'Register your clinic and get started in 2 minutes'}
                    </div>

                    {/* Google Auth */}
                    <button type="button" onClick={handleGoogleLogin} className="btn-google" suppressHydrationWarning={true}>
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="or-divider">
                        <div className="or-line"></div>
                        <div className="or-text">or</div>
                        <div className="or-line"></div>
                    </div>

                    {/* Tabs */}
                    <div className="tabs">
                        <button
                            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                            suppressHydrationWarning={true}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Login
                        </button>
                        <button
                            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                            suppressHydrationWarning={true}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
                            New Clinic
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
                                <div className="field-icon-wrapper">
                                    <div className="field-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div>
                                    <input className="with-icon" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="doctor@gmail.com" type="email" required suppressHydrationWarning={true} />
                                </div>
                            </div>
                            <div className="field">
                                <label>Registered Phone</label>
                                <div className="field-icon-wrapper">
                                    <div className="field-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
                                    <input className="with-icon" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="9876543210" required type="tel" suppressHydrationWarning={true} />
                                </div>
                            </div>
                            <div className="field" style={{ position: 'relative' }}>
                                <label>4-Digit PIN</label>
                                <div className="field-icon-wrapper">
                                    <div className="field-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                                    <input className="with-icon" value={loginPin} onChange={e => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required type="password" suppressHydrationWarning={true} />
                                </div>
                                <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: 'none', fontSize: 13, color: '#059669', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>Forgot PIN?</button>
                            </div>
                            <button type="submit" disabled={loading} className="btn-submit" suppressHydrationWarning={true}>
                                {loading ? 'Signing in...' : 'Login'}
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
                                        <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, lineHeight: 1.3 }}>⚠️ Permission Denied.<br />Please allow location access.</span>
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

                <div className="right-footer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    Your data is safe and encrypted
                </div>
            </div>
        </div>
    )
}