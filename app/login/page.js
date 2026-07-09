'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import CelebrationScreen from '../components/CelebrationScreen'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageCircle, Bell, ShieldCheck, Mail, Phone, Lock, Building, MapPin, Activity } from 'lucide-react'
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
        <div className="flex min-h-screen w-full bg-[#FCFCFA] overflow-hidden font-sans text-slate-800" suppressHydrationWarning={true}>
            
            {/* LEFT PANEL (approx 48%) */}
            <div className="relative hidden md:flex flex-col justify-between w-[48%] min-h-screen bg-gradient-to-br from-[#022c22] to-[#064e3b] text-white p-12 overflow-hidden z-10">
                {/* Immersive Background Image */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <img 
                        src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2000&auto=format&fit=crop" 
                        alt="Clinic Waiting Room" 
                        className="w-full h-full object-cover mix-blend-overlay opacity-20 blur-[2px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#022c22]/60 to-[#022c22]/95" />
                </div>

                {/* Decorative Grid & Radials */}
                <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-8 left-8 w-32 h-32 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.15]" />
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400 rounded-full mix-blend-screen filter blur-[100px] opacity-25 animate-pulse" />
                </div>

                {/* Abstract SVG Wave at Bottom */}
                <svg className="absolute bottom-0 left-0 w-full h-auto opacity-[0.15] z-0 pointer-events-none" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#ffffff" fillOpacity="1" d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,133.3C672,139,768,181,864,197.3C960,213,1056,203,1152,170.7C1248,139,1344,85,1392,58.7L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-start max-w-lg">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center cursor-pointer mb-8" onClick={() => router.push('/')}>
                        <img src="/logo.svg" alt="TokenPe" className="h-10 w-auto drop-shadow-sm" />
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl lg:text-4xl font-bold leading-tight mb-6">
                        Smart Queue<br />
                        Management for<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-100">Modern Clinics</span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-emerald-50/80 text-base mb-8 max-w-md">
                        Digital OPD queue management that reduces crowding, saves time, and improves patient experience.
                    </motion.p>

                    <div className="flex flex-col gap-4 w-full">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-lg cursor-default hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl transition-all duration-200">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300"><Mic className="w-5 h-5" /></div>
                                <div>
                                    <div className="font-semibold text-white">Voice updates in 10 Indian languages</div>
                                    <div className="text-sm text-emerald-100/60 mt-0.5">Inclusive. Accessible. Effortless.</div>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-lg cursor-default hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl transition-all duration-200">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300"><MessageCircle className="w-5 h-5" /></div>
                                <div>
                                    <div className="font-semibold text-white">Patients join via WhatsApp</div>
                                    <div className="text-sm text-emerald-100/60 mt-0.5">No app download. No sign-up.</div>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-lg cursor-default hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl transition-all duration-200">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300"><Bell className="w-5 h-5" /></div>
                                <div>
                                    <div className="font-semibold text-white">Real-time notifications</div>
                                    <div className="text-sm text-emerald-100/60 mt-0.5">Stay informed. Always.</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-emerald-200/50 mt-12">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-sm">Secure. Reliable. Built for Healthcare.</span>
                </div>
            </div>

            {/* RIGHT PANEL (approx 52%) */}
            <div className="relative flex-1 min-h-screen flex flex-col md:flex-row items-center justify-center p-0 md:p-6 lg:p-12 z-10 bg-gradient-to-br from-[#022c22] to-[#064e3b] md:bg-none md:bg-transparent">
                
                {/* Mobile Premium Header */}
                <div className="md:hidden flex flex-col items-center justify-center w-full pt-16 pb-12 text-white z-20">
                    <img src="/logo.svg" alt="TokenPe" className="h-12 w-auto drop-shadow-md" />
                </div>

                {/* Subtle Checkered Grid (Desktop) */}
                <div className="hidden md:block absolute inset-0 z-0 pointer-events-none opacity-40" style={{ backgroundImage: 'linear-gradient(to right, #EDEBE6 1px, transparent 1px), linear-gradient(to bottom, #EDEBE6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                {/* Soft Radial Gradients (Desktop) */}
                <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/15 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none" />
                <div className="hidden md:block absolute bottom-0 left-[48%] w-[600px] h-[600px] bg-cyan-200/15 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none" />

                {/* LOGIN CARD */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative z-10 w-full md:max-w-[440px] bg-white md:bg-white/70 md:backdrop-blur-xl rounded-t-[40px] md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-[0_25px_80px_rgba(0,0,0,0.08)] md:border border-white/60 px-6 py-8 pt-10 md:p-8 flex-1 md:flex-none">
                    
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm mb-8">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Back to Home
                    </button>

                    <h2 className="hidden md:block text-2xl font-bold text-slate-900 tracking-tight mb-2">
                        {mode === 'login' ? 'Welcome back!' : 'Create New Clinic'}
                    </h2>
                    <p className="hidden md:block text-slate-500 mb-8">
                        {mode === 'login' ? 'Sign in to your TokenPe dashboard' : 'Register your clinic and get started in 2 minutes'}
                    </p>

                    {/* Google Button */}
                    <motion.button 
                        whileHover={{ y: -2, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.05)' }} 
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold mb-8 transition-colors hover:bg-slate-50 disabled:opacity-50"
                        onClick={handleGoogleLogin} 
                        disabled={googleLoading}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                        </svg>
                        {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                    </motion.button>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 h-[1px] bg-slate-100" />
                        <span className="text-xs font-semibold text-slate-400">or</span>
                        <div className="flex-1 h-[1px] bg-slate-100" />
                    </div>

                    {/* Animated Segmented Control */}
                    <div className="relative flex bg-slate-100/50 p-1.5 rounded-2xl mb-8 border border-slate-200/50">
                        <div className="flex-1 relative z-10">
                            <button
                                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                                className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${mode === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Lock className="w-4 h-4" /> Login
                            </button>
                        </div>
                        <div className="flex-1 relative z-10">
                            <button
                                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                                className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${mode === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Building className="w-4 h-4" /> New Clinic
                            </button>
                        </div>
                        {/* Active Pill Background */}
                        <div className="absolute top-1.5 bottom-1.5 left-1.5 right-1.5 flex pointer-events-none">
                            <motion.div 
                                className="w-1/2 h-full bg-emerald-600 rounded-xl shadow-sm"
                                animate={{ x: mode === 'login' ? 0 : '100%' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        </div>
                    </div>

                    {/* Alerts */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium mb-6">
                                <span className="mt-0.5">✖</span><span>{error}</span>
                            </motion.div>
                        )}
                        {success && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium mb-6">
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Forms */}
                    <AnimatePresence mode="wait">
                        {mode === 'login' && (
                            <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Registered Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="doctor@gmail.com" type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Registered Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="9876543210" required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-semibold text-slate-700">4-Digit PIN</label>
                                        <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Forgot PIN?</button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={loginPin} onChange={e => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <motion.button whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)' }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl py-3 text-sm shadow-sm hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50 mt-4">
                                    {loading ? 'Signing in...' : 'Sign in →'}
                                </motion.button>
                            </motion.form>
                        )}

                        {mode === 'forgot' && (
                            <motion.form key="forgot" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSendOtp} className="space-y-5">
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-800 font-medium mb-2">
                                    🔐 Enter your registered email and phone. We&apos;ll send a 6-digit OTP to your inbox.
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Registered Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="doctor@gmail.com" type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Registered Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="9876543210" required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <motion.button whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)' }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl py-3 text-sm shadow-sm hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50 mt-4">
                                    {loading ? 'Sending OTP...' : 'Send OTP to Email →'}
                                </motion.button>
                                <div className="text-center mt-4">
                                    <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-sm font-semibold text-slate-500 hover:text-slate-700">← Back to Login</button>
                                </div>
                            </motion.form>
                        )}

                        {mode === 'verify-otp' && (
                            <motion.form key="verify-otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleResetPin} className="space-y-5">
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-800 font-medium mb-2">
                                    ✅ Check your email for the 6-digit OTP. It expires in 10 minutes.
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">6-Digit OTP</label>
                                    <input value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" required type="text" inputMode="numeric" maxLength={6} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner text-center text-2xl tracking-[0.5em] font-bold" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">New 4-Digit PIN</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New PIN</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <motion.button whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)' }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl py-3 text-sm shadow-sm hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50 mt-4">
                                    {loading ? 'Updating PIN...' : 'Reset PIN →'}
                                </motion.button>
                                <div className="flex justify-center gap-6 mt-4">
                                    <button type="button" onClick={handleSendOtp} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Resend OTP</button>
                                    <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-sm font-semibold text-slate-500 hover:text-slate-700">← Back to Login</button>
                                </div>
                            </motion.form>
                        )}

                        {mode === 'register' && (
                            <motion.form key="register" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleRegister} className="space-y-5 h-[65vh] md:h-[55vh] overflow-y-auto pr-2 pb-4 scrollbar-hide">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic Name *</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Dr. Sharma Clinic" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Specialty *</label>
                                    <div className="relative">
                                        <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <select value={regSpecialty} onChange={e => setRegSpecialty(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222.5%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19.5%208.25l-7.5%207.5-7.5-7.5%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_14px_center] bg-[length:14px]">
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
                                </div>
                                {regSpecialty === 'Other' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Enter Custom Specialty *</label>
                                        <input value={customSpecialty} onChange={e => setCustomSpecialty(e.target.value)} placeholder="e.g. Homeopath, Ayurveda, etc." required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">City *</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={regCity} onChange={e => setRegCity(e.target.value)} placeholder="e.g. Mumbai, Bangalore" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic GPS Location</label>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            type="button" 
                                            onClick={requestGps}
                                            className="flex items-center gap-2 py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            📍 {gpsStatus === 'loading' ? 'Detecting...' : gpsStatus === 'success' ? 'Linked' : 'Detect GPS'}
                                        </button>
                                        {gpsStatus === 'success' && <span className="text-xs font-bold text-emerald-600">✅ Active</span>}
                                        {gpsStatus === 'denied' && <span className="text-xs font-medium text-red-600">⚠️ Denied</span>}
                                        {gpsStatus === 'error' && <span className="text-xs font-medium text-red-600">⚠️ Error</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="9876543210" required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Registered Email *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="doctor@gmail.com" type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Set 4-Digit PIN *</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input value={regPin} onChange={e => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" required type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium">
                                    🎲 A unique clinic code will be auto-generated. You can customize it later from your dashboard.
                                </div>
                                <motion.button whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)' }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl py-3 text-sm shadow-sm hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50 mt-4">
                                    {loading ? 'Creating account...' : 'Create Account →'}
                                </motion.button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 flex items-center justify-center gap-2 text-emerald-600/70 text-xs font-semibold">
                        <ShieldCheck className="w-4 h-4" /> Your data is safe and encrypted
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
