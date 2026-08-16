import { supabaseAdmin } from '../../../../lib/supabase'
import { verifyPin, setClinicSession } from '../../../../lib/clinic-auth'
import { validatePhone } from '../../../../lib/validate'

export async function POST(req) {
    try {
        const body = await req.json()
        const { identifier, pin } = body // identifier can be email or phone

        if (!identifier || !pin) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        const cleanIdentifier = String(identifier).trim().toLowerCase()
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
            return Response.json({ success: false, message: 'Invalid credentials.' }, { status: 401 })
        }

        // Verify PIN
        const isValid = await verifyPin(pin, clinic.pin_hash)
        if (!isValid) {
            return Response.json({ success: false, message: 'Invalid credentials.' }, { status: 401 })
        }

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
