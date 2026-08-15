'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getISTDateString } from '../../../lib/supabase'

import CelebrationScreen from '../../components/CelebrationScreen'

// ─── MAIN CALLBACK ────────────────────────────────────────────────────────────
function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Securing your session...')
    const [celebration, setCelebration] = useState(null)

    useEffect(() => {
        const vertical = typeof window !== 'undefined' ? localStorage.getItem('tokenpe_vertical') : null
        const redirectBase = vertical === 'salon' ? '/salon-login' : vertical === 'restaurant' ? '/restaurant-login' : vertical === 'school' ? '/school-login' : vertical === 'other' ? '/business-login' : '/login'

        async function processAuth(session) {
            try {
                const urlIntent = searchParams.get('intent')
                const localIntent = typeof window !== 'undefined' ? localStorage.getItem('tokenpe_auth_intent') : null
                const intent = urlIntent || localIntent || 'login'
                
                if (intent === 'register') {
                    setStatus('Setting up your workspace...')
                } else {
                    setStatus('Logging you in securely...')
                }

                // Call our secure backend API to handle all checks, creation, and JWT logic
                const res = await fetch('/api/business-auth/googleCallback', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ intent, vertical: vertical || 'clinic' })
                })
                
                const data = await res.json()
                
                if (!res.ok || !data.success) {
                    await supabase.auth.signOut()
                    router.replace(`${redirectBase}?error=` + (data.message || 'auth_failed'))
                    return
                }

                const finalClinicData = data.clinic
                localStorage.setItem('businessCode', finalClinicData.code)
                localStorage.setItem('businessPhone', finalClinicData.phone || '0000000000')
                
                if (vertical === 'school') {
                    localStorage.setItem('tokenpe_school_business', JSON.stringify(finalClinicData))
                } else if (vertical === 'salon') {
                    localStorage.setItem('tokenpe_salon', JSON.stringify(finalClinicData))
                } else if (vertical === 'restaurant') {
                    localStorage.setItem('tokenpe_restaurant', JSON.stringify(finalClinicData))
                } else {
                    localStorage.setItem('tokenpe_clinic', JSON.stringify(finalClinicData))
                }
                localStorage.setItem('tokenpe_business', JSON.stringify(finalClinicData))
                
                if (data.userClinics) {
                    localStorage.setItem('tokenpe_user_businesses', JSON.stringify(data.userClinics))
                }

                const targetDashboard = vertical === 'salon' ? '/salon-dashboard' : vertical === 'restaurant' ? '/restaurant-dashboard' : vertical === 'school' ? '/school-dashboard' : vertical === 'other' ? '/business-dashboard' : '/dashboard'

                if (data.isNewRegistration) {
                    setCelebration({
                        name: finalClinicData.name,
                        code: finalClinicData.code,
                        dashboardUrl: targetDashboard
                    })
                } else {
                    router.replace(targetDashboard)
                }

            } catch (err) {
                console.error('Auth error:', err)
                router.replace(`${redirectBase}?error=unknown_error`)
            }
        }

        let handled = false

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (handled) return
            if (event === 'SIGNED_IN' && session) {
                handled = true
                processAuth(session)
            }
        })

        // Fallback: in case the event already fired before the listener attached
        const hasHash = typeof window !== 'undefined' && window.location.hash.includes('access_token')
        const fallback = setTimeout(async () => {
            if (handled) return
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                handled = true
                processAuth(session)
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
        const vertical = typeof window !== 'undefined' ? localStorage.getItem('tokenpe_vertical') : null
        const targetDashboard = vertical === 'school' ? '/school-dashboard' : vertical === 'salon' ? '/salon-dashboard' : vertical === 'restaurant' ? '/restaurant-dashboard' : '/dashboard'
        return <CelebrationScreen clinicName={celebration.clinicName} trialEnd={celebration.trialEnd} onDone={() => router.replace(targetDashboard)} />
    }

    return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0a2540 0%,#0F4C75 60%,#0a3554 100%)', fontFamily:"'DM Sans','Segoe UI',sans-serif", color:'white', flexDirection:'column', gap:20 }}>
            <div style={{ width:40, height:40, border:'4px solid rgba(255,255,255,0.2)', borderTopColor:'white', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
            <div style={{ fontSize:18, fontWeight:500 }}>{status}</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a2540', color:'white' }}>Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    )
}
