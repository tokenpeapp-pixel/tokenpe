'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getISTDateString } from '../../../lib/supabase'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Securing your session...')

    useEffect(() => {
        async function processAuth() {
            try {
                // 1. Get the authenticated user from Supabase session
                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError || !user) {
                    router.replace('/login')
                    return
                }

                const intent = searchParams.get('intent') || 'login' // 'login' or 'register'
                
                // 2. Check if a clinic exists for this user's email
                const { data: clinicData, error: clinicError } = await supabase
                    .from('clinics')
                    .select('*')
                    .eq('email', user.email)
                    .single()

                if (clinicData && !clinicError) {
                    setStatus('Generating your daily code...')
                    
                    // Generate a daily code based on date so it changes every day upon login
                    const baseName = clinicData.name || user.user_metadata?.full_name || user.email.split('@')[0]
                    const clean = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                    const todayStr = getISTDateString()
                    
                    // Simple deterministic hash for the day
                    const strToHash = clinicData.id + todayStr
                    let hash = 0
                    for (let i = 0; i < strToHash.length; i++) {
                        hash = (hash << 5) - hash + strToHash.charCodeAt(i)
                        hash |= 0
                    }
                    const dailyNum = (Math.abs(hash) % 900) + 100
                    const newCode = `${clean}${dailyNum}`

                    let finalClinicData = clinicData

                    if (clinicData.code !== newCode) {
                        const { data: updated, error: updateError } = await supabase
                            .from('clinics')
                            .update({ code: newCode })
                            .eq('id', clinicData.id)
                            .select()
                            .single()
                        
                        if (updated && !updateError) {
                            finalClinicData = updated
                        }
                    }

                    // Clinic exists! Log them in regardless of intent
                    setStatus('Logging you in...')
                    localStorage.setItem('clinicCode', finalClinicData.code)
                    localStorage.setItem('clinicPhone', finalClinicData.phone)
                    localStorage.setItem('tokenpe_clinic', JSON.stringify(finalClinicData))
                    router.replace('/dashboard')
                    return
                }

                // 3. Clinic DOES NOT exist
                if (intent === 'login') {
                    // Tried to login, but no clinic found -> Error out
                    await supabase.auth.signOut()
                    router.replace('/login?error=no_clinic')
                    return
                }

                if (intent === 'register') {
                    // Register intent -> Auto-create the clinic
                    setStatus('Creating your clinic workspace...')
                    
                    // Generate a clinic code from their name or email
                    const baseName = user.user_metadata?.full_name || user.email.split('@')[0]
                    const clean = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                    const todayStr = getISTDateString()
                    const strToHash = user.email + todayStr // use email as ID proxy for first time
                    let hash = 0
                    for (let i = 0; i < strToHash.length; i++) {
                        hash = (hash << 5) - hash + strToHash.charCodeAt(i)
                        hash |= 0
                    }
                    const num = (Math.abs(hash) % 900) + 100
                    const newCode = `${clean}${num}`

                    const trialEndsAt = new Date()
                    trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 14-day free trial
                    
                    const newClinicData = {
                        name: user.user_metadata?.full_name || 'My Clinic',
                        email: user.email,
                        code: newCode,
                        phone: '0000000000', // Placeholder, they can update later if needed
                        plan_id: 'elite',
                        subscription_status: 'trialing',
                        trial_ends_at: trialEndsAt.toISOString()
                    }

                    const { data: insertedClinic, error: insertError } = await supabase
                        .from('clinics')
                        .insert(newClinicData)
                        .select()
                        .single()

                    if (insertError) {
                        console.error('Failed to auto-create clinic:', insertError)
                        await supabase.auth.signOut()
                        router.replace('/login?error=create_failed')
                        return
                    }

                    // Successfully created! Log them in
                    localStorage.setItem('clinicCode', insertedClinic.code)
                    localStorage.setItem('clinicPhone', insertedClinic.phone)
                    localStorage.setItem('tokenpe_clinic', JSON.stringify(insertedClinic))
                    
                    setStatus('Workspace ready! Redirecting...')
                    router.replace('/dashboard')
                }

            } catch (err) {
                console.error('Auth callback error:', err)
                router.replace('/login')
            }
        }

        processAuth()
    }, [router, searchParams])

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a2540 0%, #0F4C75 60%, #0a3554 100%)',
            fontFamily: "'DM Sans','Segoe UI',sans-serif",
            color: 'white',
            flexDirection: 'column',
            gap: 20
        }}>
            {/* Loading spinner */}
            <div style={{
                width: 40, height: 40, 
                border: '4px solid rgba(255,255,255,0.2)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <div style={{ fontSize: 18, fontWeight: 500 }}>{status}</div>
            <style>{`
                @keyframes spin { 
                    to { transform: rotate(360deg); } 
                }
            `}</style>
        </div>
    )
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a2540' }}></div>}>
            <AuthCallbackContent />
        </Suspense>
    )
}
