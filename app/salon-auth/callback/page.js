'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import CelebrationScreen from '../../components/CelebrationScreen'

// ─── SALON AUTH CALLBACK ────────────────────────────────────────────────────────
function SalonAuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Securing your salon session...')
    const [celebration, setCelebration] = useState(null)

    useEffect(() => {
        async function processSalonAuth() {
            const redirectBase = '/salon-login'

            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                if (sessionError || !session) {
                    router.replace(redirectBase)
                    return
                }

                const intent = searchParams.get('intent') || 'login'

                if (intent === 'register') {
                    setStatus('Setting up your salon workspace...')
                } else {
                    setStatus('Logging you into your salon dashboard...')
                }

                // Set vertical marker
                if (typeof window !== 'undefined') {
                    localStorage.setItem('tokenpe_vertical', 'salon')
                }

                // Call the shared googleCallback API — it handles clinic/salon lookup & JWT
                const res = await fetch('/api/auth/googleCallback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ intent, vertical: 'salon' })
                })

                const data = await res.json()

                if (!res.ok || !data.success) {
                    await supabase.auth.signOut()
                    const errCode = data.message || 'auth_failed'
                    router.replace(`${redirectBase}?error=${errCode}`)
                    return
                }

                const finalSalonData = data.clinic

                // Persist salon session in localStorage
                localStorage.setItem('clinicCode', finalSalonData.code)
                localStorage.setItem('clinicPhone', finalSalonData.phone || '0000000000')
                localStorage.setItem('tokenpe_clinic', JSON.stringify(finalSalonData))
                localStorage.setItem('tokenpe_vertical', 'salon')
                if (data.userClinics) {
                    localStorage.setItem('tokenpe_user_clinics', JSON.stringify(data.userClinics))
                }

                if (data.isNewRegistration) {
                    // Show celebration screen before routing to salon dashboard
                    setCelebration({
                        clinicName: finalSalonData.name,
                        trialEnd: finalSalonData.trial_ends_at
                    })
                } else {
                    router.replace('/salon-dashboard')
                }

            } catch (err) {
                console.error('[Salon Auth Callback Error]', err)
                router.replace(redirectBase)
            }
        }

        processSalonAuth()
    }, [router, searchParams])

    if (celebration) {
        return (
            <CelebrationScreen
                clinicName={celebration.clinicName}
                trialEnd={celebration.trialEnd}
                onDone={() => router.replace('/salon-dashboard')}
            />
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2a1115 0%, #4a1c24 60%, #2a1115 100%)',
            fontFamily: "'DM Sans','Segoe UI',sans-serif",
            color: 'white',
            flexDirection: 'column',
            gap: 24
        }}>
            {/* Spinner */}
            <div style={{
                width: 52,
                height: 52,
                border: '4px solid rgba(255,255,255,0.15)',
                borderTopColor: '#f43f5e',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />

            {/* Salon Brand */}
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    marginBottom: 8
                }}>
                    <span style={{ fontSize: 28 }}>✂️</span>
                    <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
                        TokenPe <span style={{ color: '#f43f5e' }}>Salon</span>
                    </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                    {status}
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

export default function SalonAuthCallback() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#2a1115',
                color: 'white',
                fontFamily: "'DM Sans','Segoe UI',sans-serif"
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>✂️</div>
                    <div>Loading Salon Auth...</div>
                </div>
            </div>
        }>
            <SalonAuthCallbackContent />
        </Suspense>
    )
}
