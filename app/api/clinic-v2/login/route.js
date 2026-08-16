import { supabaseAdmin } from '../../../../lib/supabase'
import { verifyPin, setClinicSession } from '../../../../lib/clinic-auth'
import { validatePhone } from '../../../../lib/validate'

const rateLimitMap = new Map()

export async function POST(req) {
    try {
        const body = await req.json()
        const { identifier, pin } = body // identifier can be email or phone

        if (!identifier || !pin) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        const cleanIdentifier = String(identifier).trim().toLowerCase()

        // 1. Basic Rate Limiting
        const now = Date.now()
        const limitWindow = 15 * 60 * 1000 // 15 minutes
        const maxAttempts = 5

        if (rateLimitMap.has(cleanIdentifier)) {
            const data = rateLimitMap.get(cleanIdentifier)
            if (now - data.firstAttempt < limitWindow) {
                if (data.attempts >= maxAttempts) {
                    return Response.json({ success: false, message: 'Too many failed attempts. Please try again after 15 minutes.' }, { status: 429 })
                }
            } else {
                rateLimitMap.delete(cleanIdentifier)
            }
        }

        const recordFailedAttempt = () => {
            if (!rateLimitMap.has(cleanIdentifier)) {
                rateLimitMap.set(cleanIdentifier, { firstAttempt: now, attempts: 1 })
            } else {
                const data = rateLimitMap.get(cleanIdentifier)
                data.attempts += 1
                rateLimitMap.set(cleanIdentifier, data)
            }
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
            recordFailedAttempt()
            return Response.json({ success: false, message: 'Invalid credentials.' }, { status: 401 })
        }

        // Verify PIN
        const isValid = await verifyPin(pin, clinic.pin_hash)
        if (!isValid) {
            recordFailedAttempt()
            return Response.json({ success: false, message: 'Invalid credentials.' }, { status: 401 })
        }
        
        // Success: clear rate limit
        rateLimitMap.delete(cleanIdentifier)

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
