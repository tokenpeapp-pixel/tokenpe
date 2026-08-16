import { supabaseAdmin } from '../../../../lib/supabase'
import { verifyPin, setClinicSession } from '../../../../lib/clinic-auth'
import { validatePhone } from '../../../../lib/validate'

import { rateLimit } from '../../../../lib/rateLimit'

const loginLimiter = rateLimit({ maxAttempts: 5, windowMs: 15 * 60 * 1000 })

export async function POST(req) {
    try {
        const body = await req.json()
        const { identifier, pin } = body // identifier can be email or phone

        if (!identifier || !pin) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        const cleanIdentifier = String(identifier).trim().toLowerCase()

        // 1. Basic Rate Limiting
        const limit = await loginLimiter.check(cleanIdentifier, 'clinic_login')
        if (limit.blocked) {
            const retryMins = Math.ceil(limit.retryAfterMs / 60000)
            return Response.json({ success: false, message: `Too many failed attempts. Please try again after ${retryMins} minutes.` }, { status: 429 })
        }

        const isPhone = /^[0-9+]+$/.test(cleanIdentifier)
        const phone = isPhone ? validatePhone(cleanIdentifier) : null

        // Lookup clinic
        let query = supabaseAdmin.from('clinics').select('*')
        if (phone) {
            query = query.eq('phone', phone)
        } else {
            query = query.eq('email', cleanIdentifier)
        }

        const { data: clinic, error } = await query.single()

        if (error || !clinic) {
            await loginLimiter.recordFailure(cleanIdentifier, 'clinic_login')
            return Response.json({ success: false, message: 'Invalid credentials.' }, { status: 401 })
        }

        // Verify PIN
        const isValid = await verifyPin(pin, clinic.pin_hash)
        if (!isValid) {
            await loginLimiter.recordFailure(cleanIdentifier, 'clinic_login')
            return Response.json({ success: false, message: 'Invalid credentials.' }, { status: 401 })
        }
        
        // Success: clear rate limit
        await loginLimiter.reset(cleanIdentifier, 'clinic_login')

        // Create JWT session
        const sessionPayload = {
            clinicId: clinic.id, 
            code: clinic.code, 
            phone: clinic.phone 
        }
        await setClinicSession(sessionPayload)

        // Strip sensitive info before returning
        delete clinic.pin_hash
        delete clinic.razorpay_key_secret_encrypted

        return Response.json({ success: true, clinic }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Login Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
