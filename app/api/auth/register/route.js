import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'
import { sanitizeName, validatePhone, validatePin } from '../../../../lib/validate'

export async function POST(req) {
    try {
        const body = await req.json()
        const { name, phone, email, pin } = body

        if (!name || !phone || !pin) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        const cleanName = sanitizeName(name)
        const cleanPhone = validatePhone(phone)
        const cleanPin = validatePin(pin)

        if (!cleanName || !cleanPhone || !cleanPin) {
            return Response.json({ success: false, message: 'Invalid input format.' }, { status: 400 })
        }

        // Always generate a random, unbranded code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let j = 0; j < 6; j++) code += chars[Math.floor(Math.random() * chars.length)]
        
        // Retry loop for unique code could be added, but 6 chars base32 is highly likely unique.

        const { data, error } = await supabaseAdmin
            .from('clinics')
            .insert({ name: cleanName, phone: cleanPhone, email, code, pin: cleanPin })
            .select().single()

        if (error) {
            return Response.json({ success: false, message: 'Failed to create clinic. Phone may already be registered.' }, { status: 500 })
        }

        // Create JWT session
        const sessionPayload = {
            clinicId: data.id,
            clinicCode: data.code,
            phone: data.phone
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

        return Response.json({ success: true, clinic: data }, { status: 200 })

    } catch (error) {
        console.error('[Register API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
