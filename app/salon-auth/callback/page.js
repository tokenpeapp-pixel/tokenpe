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
        const redirectBase = '/salon-login'

        async function processSalonAuth(session) {
            try {
                const urlIntent = searchParams.get('intent')
                const localIntent = typeof window !== 'undefined' ? localStorage.getItem('tokenpe_auth_intent') : null
                const intent = urlIntent || localIntent || 'login'

                if (intent === 'register') {
                    setStatus('Setting up your salon workspace...')
                } else {
                    setStatus('Logging you into your salon dashboard...')
                }

                if (typeof window !== 'undefined') {
                    localStorage.setItem('tokenpe_vertical', 'salon')
                }

                const res = await fetch('/api/business-auth/googleCallback', {
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

                if (typeof window !== 'undefined') {
                    localStorage.setItem('businessCode', finalSalonData.code)
                    localStorage.setItem('businessPhone', finalSalonData.phone || '0000000000')
                    localStorage.setItem('tokenpe_salon', JSON.stringify(finalSalonData))
                    localStorage.setItem('tokenpe_business', JSON.stringify(finalSalonData))
                    if (data.userClinics) {
                        localStorage.setItem('tokenpe_user_businesses', JSON.stringify(data.userClinics))
                    }
                }

                const targetDashboard = '/salon-dashboard'

                if (data.isNewRegistration) {
                    setCelebration({
                        name: finalSalonData.name,
                        code: finalSalonData.code,
                        dashboardUrl: targetDashboard
                    })
                } else {
                    router.replace(targetDashboard)
                }

            } catch (err) {
                console.error('Salon auth callback error:', err)
                router.replace(`${redirectBase}?error=unknown_error`)
            }
        }

        let handled = false

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (handled) return
            if (event === 'SIGNED_IN' && session) {
                handled = true
                processSalonAuth(session)
            }
        })

        // Fallback: in case the event already fired before the listener attached
        const hasHash = typeof window !== 'undefined' && window.location.hash.includes('access_token')
        const fallback = setTimeout(async () => {
            if (handled) return
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                handled = true
                processSalonAuth(session)
            } else {
                handled = true
                router.replace(redirectBase)
            }
        }, hasHash ? 15000 : 2000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(fallback)
        }
    }, [router, searchParams])

    if (celebration) {
        return (
            <CelebrationScreen
                clinicName={celebration.name}
                trialEnd={celebration.trialEnd}
                onDone={() => router.replace('/salon-dashboard')}
                vertical="salon"
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
