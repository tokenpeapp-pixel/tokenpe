import { supabaseAdmin, supabase, getISTDateString } from '../../../../lib/supabase'
import { sendWelcomeEmail } from '../../../../lib/messaging'
import { hashPin, setClinicSession } from '../../../../lib/clinic-auth'
import { after } from 'next/server'
import crypto from 'crypto'

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
            finalClinicData = clinicData
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
            
            // Random secure PIN for Google SSO
            const randomNumPin = Math.floor(1000 + Math.random() * 9000).toString()
            const pinHash = await hashPin(randomNumPin)

            const newClinicData = {
                name: user.user_metadata?.full_name || 'My Clinic',
                email: user.email,
                code: newCode,
                phone: 'pending-' + crypto.randomBytes(4).toString('hex'),
                pin_hash: pinHash,
                plan_id: 'elite',
                subscription_status: 'trialing',
                trial_ends_at: trialEndsAt.toISOString(),
                is_public: true
            }

            const { data: insertedClinic, error: insertError } = await supabaseAdmin
                .from('clinics')
                .insert(newClinicData)
                .select()
                .single()

            if (insertError) {
                console.error('Insert error:', insertError)
                return Response.json({ success: false, message: 'create_failed' }, { status: 500 })
            }

            finalClinicData = insertedClinic
            userClinicsToReturn = [insertedClinic]

            // Send welcome email in background
            after(async () => {
                await sendWelcomeEmail(finalClinicData.email, finalClinicData.name).catch(e => console.error('Email failed:', e))
            })
        }

        // Create V2 JWT session
        const sessionPayload = {
            clinicId: finalClinicData.id,
            code: finalClinicData.code,
            phone: finalClinicData.phone || '0000000000'
        }
        await setClinicSession(sessionPayload)

        // Strip sensitive info before returning
        delete finalClinicData.pin_hash
        delete finalClinicData.razorpay_key_secret_encrypted

        // Strip sensitive info from all items in userClinicsToReturn
        const sanitizedUserClinics = userClinicsToReturn.map(c => {
            const copy = { ...c }
            delete copy.pin_hash
            delete copy.razorpay_key_secret_encrypted
            return copy
        })

        return Response.json({
            success: true,
            clinic: finalClinicData,
            userClinics: sanitizedUserClinics,
            isNewRegistration
        }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Google Callback API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
