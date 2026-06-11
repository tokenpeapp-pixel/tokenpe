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
                
                const user = session.user
                if (!user) { router.replace('/login'); return }

                const intent = searchParams.get('intent') || 'login'
                const { data: clinics, error: clinicError } = await supabase
                    .from('clinics').select('*').eq('email', user.email).order('created_at', { ascending: true })

                if (clinics && clinics.length > 0 && !clinicError) {
                    setStatus('Generating your daily code...')
                    const clinicData = clinics[0] // Default to the first clinic
                    const baseName = clinicData.name || user.user_metadata?.full_name || user.email.split('@')[0]
                    const clean = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                    const todayStr = getISTDateString()
                    const strToHash = clinicData.id + todayStr
                    let hash = 0
                    for (let i = 0; i < strToHash.length; i++) { hash = (hash << 5) - hash + strToHash.charCodeAt(i); hash |= 0 }
                    const dailyNum = (Math.abs(hash) % 900) + 100
                    const newCode = `${clean}${dailyNum}`
                    let finalClinicData = clinicData
                    if (clinicData.code !== newCode) {
                        const { data: updated, error: updateError } = await supabase
                            .from('clinics').update({ code: newCode }).eq('id', clinicData.id).select().single()
                        if (updated && !updateError) finalClinicData = updated
                    }
                    setStatus('Logging you in securely...')
                    
                    // Secure JWT Session for Google Login
                    await fetch('/api/auth/googleSession', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ 
                            clinicId: finalClinicData.id, 
                            clinicCode: finalClinicData.code, 
                            phone: finalClinicData.phone 
                        })
                    })

                    localStorage.setItem('clinicCode', finalClinicData.code)
                    localStorage.setItem('clinicPhone', finalClinicData.phone)
                    localStorage.setItem('tokenpe_clinic', JSON.stringify(finalClinicData))
                    localStorage.setItem('tokenpe_user_clinics', JSON.stringify(clinics))
                    router.replace('/dashboard')
                    return
                }

                if (intent === 'login') {
                    await supabase.auth.signOut()
                    router.replace('/login?error=no_clinic')
                    return
                }

                if (intent === 'register') {
                    setStatus('Creating your clinic workspace...')
                    const baseName = user.user_metadata?.full_name || user.email.split('@')[0]
                    const clean = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                    const todayStr = getISTDateString()
                    const strToHash = user.email + todayStr
                    let hash = 0
                    for (let i = 0; i < strToHash.length; i++) { hash = (hash << 5) - hash + strToHash.charCodeAt(i); hash |= 0 }
                    const num = (Math.abs(hash) % 900) + 100
                    const newCode = `${clean}${num}`
                    const trialEndsAt = new Date()
                    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

                    const newClinicData = {
                        name: user.user_metadata?.full_name || 'My Clinic',
                        email: user.email,
                        code: newCode,
                        phone: '0000000000',
                        plan_id: 'elite',
                        subscription_status: 'trialing',
                        trial_ends_at: trialEndsAt.toISOString()
                    }

                    const { data: insertedClinic, error: insertError } = await supabase
                        .from('clinics').insert(newClinicData).select().single()

                    if (insertError) {
                        console.error('Failed to auto-create clinic:', insertError)
                        await supabase.auth.signOut()
                        router.replace('/login?error=create_failed')
                        return
                    }

                    // Secure JWT Session for Google Registration
                    await fetch('/api/auth/googleSession', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ 
                            clinicId: insertedClinic.id, 
                            clinicCode: insertedClinic.code, 
                            phone: insertedClinic.phone 
                        })
                    })

                    localStorage.setItem('clinicCode', insertedClinic.code)
                    localStorage.setItem('clinicPhone', insertedClinic.phone)
                    localStorage.setItem('tokenpe_clinic', JSON.stringify(insertedClinic))

                    // 🎉 Show party before redirecting!
                    setCelebration({ clinicName: insertedClinic.name, trialEnd: insertedClinic.trial_ends_at })
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
