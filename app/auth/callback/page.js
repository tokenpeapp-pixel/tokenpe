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
        async function processAuth() {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                if (sessionError || !session) { router.replace('/login'); return }
                
                const intent = searchParams.get('intent') || 'login'
                
                if (intent === 'register') {
                    setStatus('Creating your clinic workspace...')
                } else {
                    setStatus('Logging you in securely...')
                }

                // Call our secure backend API to handle all clinic checks, creation, and JWT logic
                const res = await fetch('/api/auth/googleCallback', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ intent })
                })
                
                const data = await res.json()
                
                if (!res.ok || !data.success) {
                    await supabase.auth.signOut()
                    router.replace('/login?error=' + (data.message || 'auth_failed'))
                    return
                }

                const finalClinicData = data.clinic
                localStorage.setItem('clinicCode', finalClinicData.code)
                localStorage.setItem('clinicPhone', finalClinicData.phone || '0000000000')
                localStorage.setItem('tokenpe_clinic', JSON.stringify(finalClinicData))
                if (data.userClinics) {
                    localStorage.setItem('tokenpe_user_clinics', JSON.stringify(data.userClinics))
                }

                if (data.isNewRegistration) {
                    setCelebration({ clinicName: finalClinicData.name, trialEnd: finalClinicData.trial_ends_at })
                } else {
                    router.replace('/dashboard')
                }

            } catch (err) {
                console.error('Auth callback error:', err)
                router.replace('/login')
            }
        }
        processAuth()
    }, [router, searchParams])

    if (celebration) {
        return <CelebrationScreen clinicName={celebration.clinicName} trialEnd={celebration.trialEnd} onDone={() => router.replace('/dashboard')} />
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
