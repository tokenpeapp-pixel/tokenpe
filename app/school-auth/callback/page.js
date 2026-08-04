'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

import CelebrationScreen from '../../components/CelebrationScreen'

function SchoolAuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Securing your session...')
    const [celebration, setCelebration] = useState(null)

    useEffect(() => {
        async function processAuth() {
            const redirectBase = '/school-login'
            
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                if (sessionError || !session) { router.replace(redirectBase); return }
                
                const intent = searchParams.get('intent') || 'login'
                
                if (intent === 'register') {
                    setStatus('Setting up your workspace...')
                } else {
                    setStatus('Logging you in securely...')
                }

                const res = await fetch('/api/school-auth/google-callback', {
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
                    router.replace(`${redirectBase}?error=` + (data.message || 'auth_failed'))
                    return
                }

                const finalSchoolData = data.clinic
                localStorage.setItem('businessCode', finalSchoolData.code)
                localStorage.setItem('businessPhone', finalSchoolData.phone || '0000000000')
                localStorage.setItem('tokenpe_clinic', JSON.stringify(finalSchoolData))
                if (data.userClinics) {
                    localStorage.setItem('tokenpe_user_businesses', JSON.stringify(data.userClinics))
                }

                const targetDashboard = '/school-dashboard'

                if (data.isNewRegistration) {
                    setCelebration({ clinicName: finalSchoolData.name, trialEnd: finalSchoolData.trial_ends_at })
                } else {
                    router.replace(targetDashboard)
                }

            } catch (err) {
                console.error('School Auth callback error:', err)
                router.replace('/school-login')
            }
        }
        processAuth()
    }, [router, searchParams])

    if (celebration) {
        return <CelebrationScreen clinicName={celebration.clinicName} trialEnd={celebration.trialEnd} onDone={() => router.replace('/school-dashboard')} />
    }

    return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0a2540 0%,#0F4C75 60%,#0a3554 100%)', fontFamily:"'DM Sans','Segoe UI',sans-serif", color:'white', flexDirection:'column', gap:20 }}>
            <div style={{ width:40, height:40, border:'4px solid rgba(255,255,255,0.2)', borderTopColor:'white', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
            <div style={{ fontSize:18, fontWeight:500 }}>{status}</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

export default function SchoolAuthCallback() {
    return (
        <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a2540', color:'white' }}>Loading...</div>}>
            <SchoolAuthCallbackContent />
        </Suspense>
    )
}
