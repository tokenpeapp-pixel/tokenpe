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

        const { data: rows, error } = await supabase
            .from('businesses')
            .select('*')
            .ilike('email', cleanEmail)
            .eq('phone', cleanPhone)
            .eq('vertical', cleanVertical)   // ← only match correct industry
            .order('created_at', { ascending: true })
            .limit(1)

        const data = rows?.[0] ?? null

        if (error || !data) {
            loginLimiter.recordFailure(ip)
            return Response.json({ success: false, message: `No ${cleanVertical} account found for these credentials.` }, { status: 401 })
        }

        if (data.pin !== cleanPin) {
            loginLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'Incorrect 4-Digit PIN.' }, { status: 401 })
        }

        // Success — reset rate limiter
        loginLimiter.reset(ip)

        // Create JWT session using existing clinic data (no code rotation — doctors set custom codes)
        const sessionPayload = {
            businessId: data.id, businessCode: data.code, phone: data.phone, type: data.type, role: activeRole
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

        return Response.json({ success: true, clinic: data }, { status: 200 })

    } catch (error) {
        console.error('[Login API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
