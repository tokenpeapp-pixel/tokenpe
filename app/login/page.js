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
        <div className="login-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
                
                * { box-sizing: border-box; }
                
                .login-container {
                    display: flex;
                    min-height: 100vh;
                    width: 100vw;
                    font-family: 'Inter', sans-serif;
                    background: #ffffff;
                    overflow-x: hidden;
                    overflow-y: auto;
                }

                /* ANIMATIONS */
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
                .animate-slide-up-1 { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; }
                .animate-slide-up-2 { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; }
                .animate-slide-up-3 { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; }
                .animate-slide-up-4 { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards; }
                .animate-slide-up-5 { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards; }

                /* LEFT PANEL */
                .left-panel {
                    flex: 1.2;
                    position: relative;
                    background: url('/login-illustration.png') center/cover no-repeat;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 60px;
                    color: white;
                }

                .left-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(124, 58, 237, 0.45) 100%);
                    z-index: 1;
                }
                
                .left-content {
                    position: relative;
                    z-index: 2;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .glass-card {
                    background: rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 32px;
                    padding: 48px;
                    max-width: 520px;
                    box-shadow: 0 32px 64px rgba(0, 0, 0, 0.3);
                    animation: float 6s ease-in-out infinite;
                }
                
                .brand-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 52px;
                    font-weight: 800;
                    line-height: 1.1;
                    margin-bottom: 20px;
                    background: linear-gradient(135deg, #ffffff, #e2e8f0);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .brand-subtitle {
                    font-size: 17px;
                    color: rgba(255, 255, 255, 0.85);
                    line-height: 1.6;
                    font-weight: 400;
                }

                .feature-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.15);
                    padding: 12px 24px;
                    border-radius: 100px;
                    font-size: 14px;
                    font-weight: 600;
                    margin-top: 32px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    transition: transform 0.3s, background 0.3s, box-shadow 0.3s;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                }
                .feature-pill:hover {
                    transform: translateY(-4px);
                    background: rgba(255, 255, 255, 0.25);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.15);
                }

                /* RIGHT PANEL */
                .right-panel {
                    flex: 1;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    position: relative;
                }
                
                .form-wrapper {
                    width: 100%;
                    max-width: 440px;
                }

                .form-header {
                    margin-bottom: 40px;
                }
                .form-header h2 {
                    font-family: 'Outfit', sans-serif;
                    font-size: 40px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 10px 0;
                    letter-spacing: -1px;
                }
                .form-header p {
                    font-size: 16px;
                    color: #64748b;
                    margin: 0;
                    line-height: 1.5;
                }

                /* INPUTS */
                .input-group {
                    margin-bottom: 24px;
                    position: relative;
                }
                .input-group label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: 8px;
                    transition: color 0.2s;
                }
                .input-group input {
                    width: 100%;
                    padding: 16px 20px;
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    font-size: 15px;
                    font-weight: 500;
                    font-family: inherit;
                    color: #0f172a;
                    background: #f8fafc;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                }
                .input-group input::placeholder { color: #94a3b8; font-weight: 400; }
                .input-group input:hover { border-color: #cbd5e1; background: #f1f5f9; }
                .input-group input:focus {
                    background: #ffffff;
                    border-color: #7c3aed;
                    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
                }
                .input-group:focus-within label { color: #7c3aed; }

                /* BUTTONS */
                .btn-submit {
                    width: 100%;
                    padding: 18px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, #7c3aed, #4f46e5);
                    color: white;
                    font-size: 16px;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 10px 24px rgba(124, 58, 237, 0.25);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    margin-top: 12px;
                }
                .btn-submit::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .btn-submit:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 20px 40px rgba(124, 58, 237, 0.35);
                }
                .btn-submit:hover::before { opacity: 1; }
                .btn-submit:active { transform: translateY(0); box-shadow: 0 8px 16px rgba(124, 58, 237, 0.2); }
                .btn-submit:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .btn-google {
                    width: 100%;
                    padding: 16px;
                    border-radius: 16px;
                    background: #ffffff;
                    color: #0f172a;
                    font-size: 15px;
                    font-weight: 600;
                    border: 2px solid #e2e8f0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 32px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                }
                .btn-google:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.06);
                }
                .btn-google:active { transform: translateY(0); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

                /* DIVIDER */
                .divider {
                    display: flex;
                    align-items: center;
                    margin-bottom: 32px;
                }
                .divider-line { flex: 1; height: 1px; background: #e2e8f0; }
                .divider-text { padding: 0 16px; color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

                /* TABS */
                .tab-container {
                    display: flex;
                    background: #f1f5f9;
                    padding: 6px;
                    border-radius: 16px;
                    margin-bottom: 32px;
                    position: relative;
                }
                .tab-btn {
                    flex: 1;
                    padding: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    z-index: 2;
                }
                .tab-btn.active { color: #0f172a; }
                
                .tab-highlight {
                    position: absolute;
                    top: 6px; bottom: 6px;
                    width: calc(50% - 6px);
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    z-index: 1;
                }
                .mode-login .tab-highlight { transform: translateX(0); }
                .mode-register .tab-highlight { transform: translateX(100%); }

                /* ALERTS */
                .alert {
                    padding: 16px;
                    border-radius: 16px;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: fadeInUp 0.4s ease-out;
                }
                .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #ef4444; }
                .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #22c55e; }

                /* RESPONSIVE */
                @media (max-width: 992px) {
                    .login-container { flex-direction: column; }
                    .left-panel {
                        flex: none; min-height: 320px; padding: 40px 24px;
                        align-items: center; text-align: center;
                    }
                    .glass-card { display: none; }
                    .left-content > div:last-child { display: none; }
                    .left-content { justify-content: center; width: 100%; }
                    .left-content img { height: 48px !important; margin: 0 auto; }
                    
                    .right-panel {
                        flex: 1;
                        padding: 40px 24px;
                        border-radius: 32px 32px 0 0;
                        margin-top: -40px;
                        z-index: 10;
                        box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
                        justify-content: flex-start;
                    }
                    .form-header h2 { font-size: 32px; }
                }

                @media (max-width: 480px) {
                    .left-panel { min-height: 260px; padding: 30px 20px; }
                    .right-panel { padding: 32px 20px; margin-top: -30px; border-radius: 24px 24px 0 0; }
                    .form-header h2 { font-size: 28px; }
                    .form-header p { font-size: 14px; }
                    .input-group input { padding: 14px 16px; font-size: 14px; }
                    .btn-submit { padding: 16px; font-size: 15px; }
                }
            `}</style>

            {/* LEFT PANEL */}
            <div className="left-panel animate-fade-in">
                <div className="left-overlay"></div>
                <div className="left-content">
                    <div style={{ cursor: 'pointer', display: 'inline-block' }} onClick={() => router.push('/')}>
                        <img src="/logo.svg" alt="TokenPe" style={{ height: 44, filter: 'brightness(0) invert(1)' }} />
                    </div>
                    
                    <div className="glass-card">
                        <h1 className="brand-title">Queue smarter,<br/>not harder.</h1>
                        <p className="brand-subtitle">
                            Transform your clinic's waiting room into a seamless digital experience. 
                            Zero apps for patients, real-time updates in 10 languages.
                        </p>
                        <div className="feature-pill">
                            <span style={{ fontSize: 18 }}>✨</span>
                            Over 1M+ Patients Served
                        </div>
                    </div>
                    
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                        © 2026 TokenPe Technologies · Made with ❤️ in India
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="right-panel">
                <div className="form-wrapper">
                    <div className="form-header animate-slide-up-1">
                        <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
                        <p>{mode === 'login' ? 'Sign in to access your clinic dashboard.' : 'Start managing your queue digitally in 2 minutes.'}</p>
                    </div>

                    <div className="animate-slide-up-2">
                        <button className="btn-google" onClick={handleGoogleLogin} disabled={googleLoading}>
                            <svg width="22" height="22" viewBox="0 0 18 18">
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                            </svg>
                            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                        </button>

                        <div className="divider">
                            <div className="divider-line"></div>
                            <div className="divider-text">or</div>
                            <div className="divider-line"></div>
                        </div>

                        <div className={`tab-container mode-${mode}`}>
                            <div className="tab-highlight"></div>
                            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>Login</button>
                            <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>Register</button>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success">
                                <span>✅</span>
                                <span>{success}</span>
                            </div>
                        )}
                    </div>

                    <div className="animate-slide-up-3">
                        {mode === 'login' ? (
                            <form onSubmit={handleLogin}>
                                <div className="input-group">
                                    <label>Clinic Code</label>
                                    <input value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="e.g. SHARMA001" required />
                                </div>
                                <div className="input-group">
                                    <label>Registered Phone</label>
                                    <input value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="9876543210" required type="tel" />
                                </div>
                                <button type="submit" disabled={loading} className="btn-submit">
                                    {loading ? 'Signing in...' : 'Sign In to Console'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister}>
                                <div className="input-group">
                                    <label>Clinic Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input value={regName} onChange={e => { setRegName(e.target.value); if (!regCode) setRegCode(generateCode(e.target.value)); }} placeholder="Dr. Sharma Clinic" required />
                                </div>
                                <div className="input-group">
                                    <label>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="9876543210" required type="tel" />
                                </div>
                                <div className="input-group">
                                    <label>Email <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                    <input value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="doctor@gmail.com" type="email" />
                                </div>
                                <div className="input-group">
                                    <label>Clinic Code <span style={{ color: '#94a3b8', fontWeight: 400 }}>(auto-generated)</span></label>
                                    <input value={regCode} onChange={e => setRegCode(e.target.value.toUpperCase())} placeholder="SHARMA001" style={{ fontFamily: 'monospace', letterSpacing: 1, color: '#7c3aed', fontWeight: 700 }} />
                                </div>
                                <button type="submit" disabled={loading} className="btn-submit">
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}