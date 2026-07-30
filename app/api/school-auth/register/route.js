import { supabaseAdmin } from '../../../../../lib/supabase'
import { signToken } from '../../../../../lib/auth'
import { cookies } from 'next/headers'
import { sanitizeName, validatePhone, validatePin } from '../../../../../lib/validate'
import { sendWelcomeEmail } from '../../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        const body = await req.json()
        const { name, phone, email, pin, specialty, city, lat, lng } = body

        if (!name || !phone || !email || !pin) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        const cleanName = sanitizeName(name)
        const cleanPhone = validatePhone(phone)
        const cleanPin = validatePin(pin)
        const cleanEmail = String(email).trim().toLowerCase()

        if (!cleanName || !cleanPhone || !cleanEmail || !cleanPin) {
            return Response.json({ success: false, message: 'Invalid input format.' }, { status: 400 })
        }

        // Check for existing school with same phone
        const { data: existing } = await supabaseAdmin
            .from('schools')
            .select('id')
            .eq('phone', cleanPhone)
            .limit(1)

        if (existing?.length > 0) {
            return Response.json({ success: false, message: 'This phone number is already registered. Please log in instead.' }, { status: 409 })
        }

        // Generate 6-char join code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let j = 0; j < 6; j++) code += chars[Math.floor(Math.random() * chars.length)]

        // 7-day trial
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 7)

        const insertData = {
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            code,
            pin: cleanPin,
            plan_id: 'elite',
            subscription_status: 'trialing',
            trial_ends_at: trialEndsAt.toISOString(),
            specialty: specialty || null,
            city: city ? city.trim() : null,
            is_public: true,
        }

        if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
            const parsedLat = parseFloat(lat)
            const parsedLng = parseFloat(lng)
            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                insertData.location = `POINT(${parsedLng} ${parsedLat})`
            }
        }

        const { data, error } = await supabaseAdmin
            .from('schools')
            .insert(insertData)
            .select().single()

        if (error) {
            console.error('[School Register] DB error:', error)
            return Response.json({ success: false, message: 'Failed to create account. Phone may already be registered.' }, { status: 500 })
        }

        // Send welcome email in background
        after(async () => {
            await sendWelcomeEmail(email, cleanName)
        })

        const sessionPayload = {
            clinicId: data.id,
            clinicCode: data.code,
            phone: data.phone,
            vertical: 'school'
        }
        const token = await signToken(sessionPayload)

        const cookieStore = await cookies()
        cookieStore.set('tokenpe_school_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24,
            path: '/'
        })

        return Response.json({ success: true, clinic: data }, { status: 200 })

    } catch (error) {
        console.error('[School Register API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
