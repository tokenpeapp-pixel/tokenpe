import { supabaseAdmin as supabase } from '../../../../lib/supabase'
import { signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'
import { rateLimit } from '../../../../lib/rateLimit'
import { validatePin, validatePhone } from '../../../../lib/validate'

const loginLimiter = rateLimit({ maxAttempts: 5, windowMs: 15 * 60 * 1000 })

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const limit = loginLimiter.check(ip)
        if (limit.blocked) {
            const retryMins = Math.ceil(limit.retryAfterMs / 60000)
            return Response.json({ success: false, message: `Too many login attempts. Try again in ${retryMins} minutes.` }, { status: 429 })
        }

        const body = await req.json()
        const { email, phone, pin, role } = body

        if (!email || !phone || !pin) {
            return Response.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        const cleanEmail = email.trim().toLowerCase()
        const cleanPhone = validatePhone(phone)
        const cleanPin = validatePin(pin)

        if (!cleanEmail || !cleanPhone || !cleanPin) {
            return Response.json({ success: false, message: 'Invalid input format.' }, { status: 400 })
        }

        const { data: rows, error } = await supabase
            .from('schools')
            .select('*')
            .ilike('email', cleanEmail)
            .eq('phone', cleanPhone)
            .order('created_at', { ascending: true })
            .limit(1)

        const data = rows?.[0] ?? null

        if (error || !data) {
            loginLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'Invalid email or phone number.' }, { status: 401 })
        }

        if (data.pin !== cleanPin) {
            loginLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'Incorrect 4-Digit PIN.' }, { status: 401 })
        }

        loginLimiter.reset(ip)

        const activeRole = role || 'owner'

        const sessionPayload = {
            clinicId: data.id,
            clinicCode: data.code,
            phone: data.phone,
            role: activeRole,
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

        return Response.json({ success: true, clinic: data, role: activeRole }, { status: 200 })

    } catch (error) {
        console.error('[School Login API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
