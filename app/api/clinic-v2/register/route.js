import { supabaseAdmin } from '../../../../lib/supabase'
import { hashPin, setClinicSession } from '../../../../lib/clinic-auth'
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
        const cleanEmail = String(email).trim().toLowerCase()

        if (!cleanName || !cleanPhone || !cleanEmail || !cleanPin) {
            return Response.json({ success: false, message: 'Invalid input format.' }, { status: 400 })
        }

        // Check if email or phone already registered
        const { data: existingClinic } = await supabaseAdmin
            .from('clinics')
            .select('id')
            .or(`phone.eq.${cleanPhone},email.eq.${cleanEmail}`)
            .limit(1)

        if (existingClinic?.length > 0) {
            return Response.json({ success: false, message: 'An account with this email or phone number is already registered.' }, { status: 409 })
        }

        // Hash PIN
        const pinHash = await hashPin(cleanPin)

        // Generate 6-char random code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let j = 0; j < 6; j++) code += chars[Math.floor(Math.random() * chars.length)]

        // Setup Trial
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 7)

        const insertData = {
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            code,
            pin_hash: pinHash,
            plan_id: 'elite',
            subscription_status: 'trialing',
            trial_ends_at: trialEndsAt.toISOString(),
            specialty: specialty || null,
            city: city ? city.trim() : null,
            is_public: true
        }

        if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
            const parsedLat = parseFloat(lat)
            const parsedLng = parseFloat(lng)
            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                insertData.location = `POINT(${parsedLng} ${parsedLat})`
                insertData.lat = parsedLat
                insertData.lng = parsedLng
            }
        }

        const { data, error } = await supabaseAdmin
            .from('clinics')
            .insert(insertData)
            .select()
            .single()

        if (error) {
            console.error('[Clinic V2 Register] Supabase insert error:', JSON.stringify(error))
            if (error.code === '23505') {
                return Response.json({ success: false, message: 'An account with this email or phone already exists.' }, { status: 409 })
            }
            return Response.json({ success: false, message: 'Failed to create account.' }, { status: 500 })
        }

        // Send welcome email in background
        after(async () => {
            await sendWelcomeEmail(email, cleanName)
        })

        // Create JWT session
        const sessionPayload = {
            clinicId: data.id, 
            code: data.code, 
            phone: data.phone 
        }
        await setClinicSession(sessionPayload)

        // Strip sensitive info before returning
        delete data.pin_hash
        delete data.razorpay_key_secret_encrypted

        return Response.json({ success: true, clinic: data }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Register Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
