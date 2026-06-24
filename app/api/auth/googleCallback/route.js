import { signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'
import { supabaseAdmin, supabase, getISTDateString } from '../../../../lib/supabase'
import { sendWelcomeEmail } from '../../../../lib/messaging'

export async function POST(req) {
    try {
        const body = await req.json()
        const { intent } = body
        const authHeader = req.headers.get('Authorization')

        if (!authHeader) {
            return Response.json({ success: false, message: 'Missing token' }, { status: 400 })
        }

        const tokenString = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(tokenString)

        if (userError || !user) {
            return Response.json({ success: false, message: 'Invalid Supabase token' }, { status: 401 })
        }

        // Fetch user clinics via admin (bypassing RLS)
        const { data: clinics, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: true })

        let finalClinicData = null
        let isNewRegistration = false
        let userClinicsToReturn = clinics || []

        if (clinics && clinics.length > 0 && !clinicError) {
            // Existing User: Login Flow
            const clinicData = clinics[0]
            const baseName = clinicData.name || user.user_metadata?.full_name || user.email.split('@')[0]
            const clean = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
            const todayStr = getISTDateString()
            const strToHash = clinicData.id + todayStr
            let hash = 0
            for (let i = 0; i < strToHash.length; i++) { hash = (hash << 5) - hash + strToHash.charCodeAt(i); hash |= 0 }
            const dailyNum = (Math.abs(hash) % 900) + 100
            const newCode = `${clean}${dailyNum}`
            
            finalClinicData = clinicData
            
            if (clinicData.code !== newCode) {
                const { data: updated, error: updateError } = await supabaseAdmin
                    .from('clinics')
                    .update({ code: newCode })
                    .eq('id', clinicData.id)
                    .select()
                    .single()
                if (updated && !updateError) {
                    finalClinicData = updated
                    userClinicsToReturn = userClinicsToReturn.map(c => c.id === updated.id ? updated : c)
                }
            }
        } else {
            // New User: Registration Flow
            if (intent === 'login') {
                return Response.json({ success: false, message: 'no_clinic' }, { status: 404 })
            }

            isNewRegistration = true
            const baseName = user.user_metadata?.full_name || user.email.split('@')[0]
            const clean = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
            const todayStr = getISTDateString()
            const strToHash = user.email + todayStr
            let hash = 0
            for (let i = 0; i < strToHash.length; i++) { hash = (hash << 5) - hash + strToHash.charCodeAt(i); hash |= 0 }
            const num = (Math.abs(hash) % 900) + 100
            const newCode = `${clean}${num}`
            
            const trialEndsAt = new Date()
            trialEndsAt.setDate(trialEndsAt.getDate() + 7)

            const newClinicData = {
                name: user.user_metadata?.full_name || 'My Clinic',
                email: user.email,
                code: newCode,
                phone: '0000000000',
                plan_id: 'elite',
                subscription_status: 'trialing',
                trial_ends_at: trialEndsAt.toISOString()
            }

            const { data: insertedClinic, error: insertError } = await supabaseAdmin
                .from('clinics')
                .insert(newClinicData)
                .select()
                .single()

            if (insertError) {
                return Response.json({ success: false, message: 'create_failed' }, { status: 500 })
            }

            finalClinicData = insertedClinic
            userClinicsToReturn = [insertedClinic]
            
            // Send welcome email
            await sendWelcomeEmail(finalClinicData.email, finalClinicData.name)
        }

        // Create JWT session
        const sessionPayload = {
            clinicId: finalClinicData.id,
            clinicCode: finalClinicData.code,
            phone: finalClinicData.phone || '0000000000'
        }
        const token = await signToken(sessionPayload)

        // Set secure cookie
        const cookieStore = await cookies()
        cookieStore.set('tokenpe_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/'
        })

        return Response.json({ 
            success: true, 
            clinic: finalClinicData,
            userClinics: userClinicsToReturn,
            isNewRegistration 
        }, { status: 200 })

    } catch (error) {
        console.error('[Google Callback API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
