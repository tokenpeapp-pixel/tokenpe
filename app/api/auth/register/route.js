import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'
import { sanitizeName, validatePhone, validatePin } from '../../../../lib/validate'
import { sendWelcomeEmail } from '../../../../lib/messaging'
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

        if (!cleanName || !cleanPhone || !email || !cleanPin) {
            return Response.json({ success: false, message: 'Invalid input format.' }, { status: 400 })
        }

        // Always generate a random, unbranded code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let j = 0; j < 6; j++) code += chars[Math.floor(Math.random() * chars.length)]

        // 7 day trial
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 7)

        const insertData = {
            name: cleanName,
            phone: cleanPhone,
            email,
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
            .from('clinics')
            .insert(insertData)
            .select().single()

        if (error) {
            return Response.json({ success: false, message: 'Failed to create clinic. Phone may already be registered.' }, { status: 500 })
        }

        // Send welcome email in background so registration UI is instant
        after(async () => {
            await sendWelcomeEmail(email, cleanName)
        })

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
