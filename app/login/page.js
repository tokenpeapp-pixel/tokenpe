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
            // Auto-redirect if already logged in
            const existing = localStorage.getItem('tokenpe_clinic')
            if (existing) {
                try {
                    const clinic = JSON.parse(existing)
                    if (clinic && clinic.code) {
                        router.replace('/dashboard')
                        return
                    }
                } catch (_) {
                    localStorage.removeItem('tokenpe_clinic')
                }
            }

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
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }

                .left-panel {
                    width: 42%;
                    background: linear-gradient(160deg, #0d2d3f 0%, #0a2233 60%, #071a28 100%);
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
                    background: radial-gradient(circle, rgba(0,200,180,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .left-panel::after {
                    content: '';
                    position: absolute;
                    bottom: -80px; left: -80px;
                    width: 300px; height: 300px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(20,120,180,0.1) 0%, transparent 70%);
                    pointer-events: none;
                }

                .logo-area {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                }
                .logo-icon {
                    width: 44px; height: 44px;
                    background: linear-gradient(135deg, #00c8b4, #0ea5e9);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 22px;
                    font-weight: 900;
                    color: white;
                    box-shadow: 0 4px 16px rgba(0,200,180,0.35);
                    flex-shrink: 0;
                }
                .logo-text { display: flex; flex-direction: column; }
                .logo-name {
                    font-size: 22px; font-weight: 800;
                    background: linear-gradient(135deg, #ffffff, #a0d4e8);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    line-height: 1.1;
                }
                .logo-tagline { font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 500; margin-top: 2px; }

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
                    transition: background 0.2s, transform 0.2s;
                }
                .feature-item:hover { background: rgba(255,255,255,0.09); transform: translateX(4px); }
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
                    align-items: center;
                    justify-content: center;
                    padding: 48px 40px;
                    overflow-y: auto;
                }
                .form-box { width: 100%; max-width: 400px; }

                .form-title { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
                .form-subtitle { font-size: 14px; color: #64748b; margin-bottom: 28px; }

                .btn-google {
                    width: 100%; padding: 13px 20px;
                    border: 1.5px solid #e2e8f0; border-radius: 10px;
                    background: #fff; color: #0f172a;
                    font-size: 14px; font-weight: 600;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s; margin-bottom: 22px;
                    font-family: inherit;
                }
                .btn-google:hover { background: #f8fafc; border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
                .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

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
                    background: #0d2d3f; color: #ffffff;
                }

                /* INPUTS */
                .field { margin-bottom: 16px; }
                .field label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
                .field input {
                    width: 100%; padding: 12px 14px;
                    border: 1.5px solid #e2e8f0; border-radius: 10px;
                    font-size: 14px; font-family: inherit; color: #0f172a;
                    background: #f9fafb; outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .field input::placeholder { color: #94a3b8; }
                .field input:focus { border-color: #0d2d3f; background: #fff; box-shadow: 0 0 0 3px rgba(13,45,63,0.1); }

                .btn-submit {
                    width: 100%; padding: 13px;
                    background: #0d2d3f; color: #fff;
                    border: none; border-radius: 10px;
                    font-size: 15px; font-weight: 700; cursor: pointer;
                    transition: all 0.2s; margin-top: 6px; font-family: inherit;
                }
                .btn-submit:hover { background: #0a2233; box-shadow: 0 6px 20px rgba(13,45,63,0.25); transform: translateY(-1px); }
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
                <div className="logo-area" onClick={() => router.push('/')}>
                    <div className="logo-icon">T</div>
                    <div className="logo-text">
                        <span className="logo-name">TokenPe</span>
                        <span className="logo-tagline">Smart Queue. Better Care.</span>
                    </div>
                </div>

                <div className="mid-content">
                    <p className="mid-desc">
                        Digital OPD queue management for modern clinics. No crowding. No confusion.
                    </p>
                    <div className="feature-list">
                        <div className="feature-item">
                            <div className="feature-icon">🎙️</div>
                            <span className="feature-text">Voice updates in 10 Indian languages</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">💬</div>
                            <span className="feature-text">Patients join via WhatsApp — zero app needed</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🔔</div>
                            <span className="feature-text">Real-time notifications for every action</span>
                        </div>
                    </div>
                </div>

                <div className="left-footer">Made in India · TokenPe © 2026</div>
            </div>

            {/* RIGHT PANEL */}
            <div className="right-panel">
                <div className="form-box">
                    <div className="form-title">{mode === 'login' ? 'Welcome back' : 'New Clinic'}</div>
                    <div className="form-subtitle">
                        {mode === 'login' ? 'Sign in to your TokenPe dashboard' : 'Register your clinic and get started in 2 minutes'}
                    </div>

                    {/* Google */}
                    <button className="btn-google" onClick={handleGoogleLogin} disabled={googleLoading}>
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
                        >
                            🔑 Login
                        </button>
                        <button
                            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
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
                                <label>Clinic Code</label>
                                <input value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="e.g. SHARMA001" required />
                            </div>
                            <div className="field">
                                <label>Registered Phone</label>
                                <input value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="9876543210" required type="tel" />
                            </div>
                            <button type="submit" disabled={loading} className="btn-submit">
                                {loading ? 'Signing in...' : 'Sign in →'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <div className="field">
                                <label>Clinic Name *</label>
                                <input value={regName} onChange={e => { setRegName(e.target.value); if (!regCode) setRegCode(generateCode(e.target.value)); }} placeholder="Dr. Sharma Clinic" required />
                            </div>
                            <div className="field">
                                <label>Phone Number *</label>
                                <input value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="9876543210" required type="tel" />
                            </div>
                            <div className="field">
                                <label>Email <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                <input value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="doctor@gmail.com" type="email" />
                            </div>
                            <div className="field">
                                <label>Clinic Code <span style={{ color: '#94a3b8', fontWeight: 400 }}>(auto-generated)</span></label>
                                <input value={regCode} onChange={e => setRegCode(e.target.value.toUpperCase())} placeholder="SHARMA001" style={{ fontFamily: 'monospace', letterSpacing: 1, color: '#0d2d3f', fontWeight: 700 }} />
                            </div>
                            <button type="submit" disabled={loading} className="btn-submit">
                                {loading ? 'Creating account...' : 'Create Account →'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}