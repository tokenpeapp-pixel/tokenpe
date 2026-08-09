import { supabaseAdmin as supabase } from '../../../../lib/supabase'
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
        const { email, phone, pin, vertical } = body
        const cleanVertical = ['clinic','restaurant','salon','school','business'].includes(vertical) ? vertical : 'clinic'

        if (!email || !phone || !pin) {
            return Response.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        // Input validation
        const cleanEmail = email.trim().toLowerCase()
        const cleanPhone = validatePhone(phone)
        const cleanPin = validatePin(pin)

        if (!cleanEmail || !cleanPhone || !cleanPin) {
            return Response.json({ success: false, message: 'Invalid input format.' }, { status: 400 })
        }

        let { data: rows, error } = await supabase
            .from('clinics')
            .select('*')
            .ilike('email', cleanEmail)
            .eq('phone', cleanPhone)
            .order('created_at', { ascending: true })
            .limit(1)

        if (!rows || rows.length === 0) {
            const { data: bRows } = await supabase
                .from('businesses')
                .select('*')
                .ilike('email', cleanEmail)
                .eq('phone', cleanPhone)
                .order('created_at', { ascending: true })
                .limit(1)
            if (bRows) rows = bRows
        }

        const data = rows?.[0] ?? null

        if (!data) {
            loginLimiter.recordFailure(ip)
            return Response.json({ success: false, message: `No ${cleanVertical} account found in database for these credentials.` }, { status: 404 })
        }

        if (data.pin !== cleanPin) {
            loginLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'Incorrect 4-Digit PIN.' }, { status: 401 })
        }

        // Success — reset rate limiter
        loginLimiter.reset(ip)

        // Create JWT session using existing clinic data
        const sessionPayload = {
            businessId: data.id,
            clinicId: data.id,
            businessCode: data.code,
            phone: data.phone,
            type: data.type,
            vertical: data.type
        }
        const token = await signToken(sessionPayload)

        // Set secure cookies
        const cookieStore = await cookies()
        const cookieOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/'
        }
        cookieStore.set('tokenpe_unified_session', token, cookieOpts)
        cookieStore.set('tokenpe_session', token, cookieOpts)

        return Response.json({ success: true, clinic: data }, { status: 200 })

    } catch (error) {
        console.error('[Login API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
