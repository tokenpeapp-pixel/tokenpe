import { supabase } from '../../../../lib/supabase'
import { signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'
import { rateLimit } from '../../../../lib/rateLimit'
import { validatePin, validatePhone, validateClinicCode } from '../../../../lib/validate'

const loginLimiter = rateLimit({ maxAttempts: 5, windowMs: 15 * 60 * 1000 })

export async function POST(req) {
    try {
        // Rate limit check — before anything else
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const limit = loginLimiter.check(ip)
        if (limit.blocked) {
            const retryMins = Math.ceil(limit.retryAfterMs / 60000)
            return Response.json({ success: false, message: `Too many login attempts. Try again in ${retryMins} minutes.` }, { status: 429 })
        }

        const body = await req.json()
        const { code, phone, pin } = body

        if (!code || !phone || !pin) {
            return Response.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        // Input validation
        const cleanCode = validateClinicCode(code)
        const cleanPhone = validatePhone(phone)
        const cleanPin = validatePin(pin)

        if (!cleanCode || !cleanPhone || !cleanPin) {
            return Response.json({ success: false, message: 'Invalid input format.' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('code', cleanCode)
            .eq('phone', cleanPhone)
            .single()

        if (error || !data) {
            loginLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'Invalid clinic code or phone number.' }, { status: 401 })
        }

        if (data.pin !== cleanPin) {
            loginLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'Incorrect 4-Digit PIN.' }, { status: 401 })
        }

        // Success — reset rate limiter
        loginLimiter.reset(ip)

        // Generate a new clinic code on each login (invalidates old QR)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let newCode = ''
        for (let i = 0; i < 6; i++) newCode += chars[Math.floor(Math.random() * chars.length)]

        const { data: updated, error: updateErr } = await supabase
            .from('clinics')
            .update({ code: newCode })
            .eq('id', data.id)
            .select().single()

        if (updateErr || !updated) {
            return Response.json({ success: false, message: 'Failed to rotate clinic code.' }, { status: 500 })
        }

        // Create JWT session
        const sessionPayload = {
            clinicId: updated.id,
            clinicCode: updated.code,
            phone: updated.phone
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

        return Response.json({ success: true, clinic: updated }, { status: 200 })

    } catch (error) {
        console.error('[Login API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
