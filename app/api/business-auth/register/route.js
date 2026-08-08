import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'
import { sanitizeName, validatePhone, validatePin } from '../../../../lib/validate'
import { sendWelcomeEmail } from '../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        const body = await req.json()
        const { name, phone, email, pin, specialty, city, lat, lng, vertical } = body
        const cleanVertical = ['clinic','restaurant','salon','school','business'].includes(vertical) ? vertical : 'clinic'

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

        // Prevent duplicate registration within the SAME vertical.
        // Same credentials across DIFFERENT verticals is allowed — each industry
        // gets its own separate account, trial, and subscription.
        const { data: existingClinic } = await supabaseAdmin
            .from('businesses')
            .select('id')
            .eq('phone', cleanPhone)
            .eq('email', cleanEmail)
            .eq('type', cleanVertical)   // ← businesses table uses 'type' column, not 'vertical'
            .limit(1)

        if (existingClinic?.length > 0) {
            return Response.json({ success: false, message: `An account with this email and phone number is already registered for ${cleanVertical}. Please log in instead.` }, { status: 409 })
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
            email: cleanEmail,
            code,
            pin: cleanPin,
            plan_id: 'elite',
            subscription_status: 'trialing',
            trial_ends_at: trialEndsAt.toISOString(),
            specialty: specialty || null,
            city: city ? city.trim() : null,
            is_public: true,
            type: cleanVertical,        // 'type' is the actual column in businesses table
        }

        if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
            const parsedLat = parseFloat(lat)
            const parsedLng = parseFloat(lng)
            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                insertData.location = `POINT(${parsedLng} ${parsedLat})`
            }
        }

        const { data, error } = await supabaseAdmin
            .from('businesses')
            .insert(insertData)
            .select().single()

        if (error) {
            // Log the full Supabase error so it appears in Vercel function logs
            console.error('[Register API] Supabase insert error:', JSON.stringify(error))
            // Detect unique constraint violations (code 23505 = PostgreSQL unique_violation)
            if (error.code === '23505') {
                return Response.json({ success: false, message: 'An account with this email or phone already exists. Please log in instead.' }, { status: 409 })
            }
            return Response.json({ success: false, message: 'Failed to create account. Please try again.' }, { status: 500 })
        }

        // Send welcome email in background so registration UI is instant
        after(async () => {
            await sendWelcomeEmail(email, cleanName)
        })

        // Create JWT session
        const sessionPayload = {
            businessId: data.id, businessCode: data.code, phone: data.phone, type: data.type, vertical: data.type
        }
        const token = await signToken(sessionPayload)

        // Set secure cookie
        const cookieStore = await cookies()
        cookieStore.set('tokenpe_unified_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/'
        })

        delete data.pin
        return Response.json({ success: true, clinic: data }, { status: 200 })

    } catch (error) {
        console.error('[Register API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
