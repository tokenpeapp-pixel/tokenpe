'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

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
                    // Clinic exists! Log them in regardless of intent
                    setStatus('Logging you in...')
                    localStorage.setItem('clinicCode', clinicData.code)
                    localStorage.setItem('clinicPhone', clinicData.phone)
                    localStorage.setItem('tokenpe_clinic', JSON.stringify(clinicData))
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
                    const clean = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
                    const num = Math.floor(Math.random() * 900) + 100
                    const newCode = clean + num

                    const newClinicData = {
                        name: user.user_metadata?.full_name || 'My Clinic',
                        email: user.email,
                        code: newCode,
                        phone: '0000000000' // Placeholder, they can update later if needed
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
