import { supabase } from '../../../../lib/supabase'
import { SignJWT } from 'jose'
import { Resend } from 'resend'
import { rateLimit } from '../../../../lib/rateLimit'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')
const otpLimiter = rateLimit({ maxAttempts: 3, windowMs: 15 * 60 * 1000 })

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'tokenpe_super_secret_fallback_2026')

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const limit = otpLimiter.check(ip)
        if (limit.blocked) {
            const retryMins = Math.ceil(limit.retryAfterMs / 60000)
            return Response.json({ success: false, message: `Too many requests. Try again in ${retryMins} minutes.` }, { status: 429 })
        }

        const body = await req.json()
        const { email, phone } = body

        if (!email || !phone) {
            return Response.json({ success: false, message: 'Email and phone are required.' }, { status: 400 })
        }

        const cleanEmail = String(email).trim().toLowerCase()
        const cleanPhone = String(phone).replace(/\D/g, '')

        // Verify clinic exists with this email + phone
        const { data: clinic, error } = await supabase
            .from('clinics')
            .select('id, name, email')
            .eq('email', cleanEmail)
            .eq('phone', cleanPhone)
            .single()

        if (error || !clinic) {
            otpLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'No clinic found with this email and phone number.' }, { status: 404 })
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // Sign a short-lived token embedding the OTP (10 minutes)
        const otpToken = await new SignJWT({ email: cleanEmail, phone: cleanPhone, otp })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('10m')
            .sign(getSecret())

        // Send OTP email via Resend
        await resend.emails.send({
            from: 'TokenPe <support@tokenpe.online>',
            to: clinic.email,
            subject: '🔐 Your TokenPe PIN Reset OTP',
            html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
                    <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height: 32px; margin-bottom: 24px;" />
                    <h2 style="color: #a78bfa; font-size: 22px; margin-bottom: 8px;">PIN Reset OTP</h2>
                    <p style="color: #94a3b8;">Hi <strong style="color: #fff">${clinic.name}</strong>,</p>
                    <p style="color: #94a3b8;">Use the OTP below to reset your TokenPe PIN. It expires in <strong>10 minutes</strong>.</p>
                    <div style="background: #1e1b4b; border: 2px solid #7c3aed; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                        <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #c4b5fd;">${otp}</div>
                    </div>
                    <p style="color: #475569; font-size: 13px;">If you did not request this, please ignore this email. Your PIN remains unchanged.</p>
                    <p style="color: #475569; font-size: 12px; margin-top: 24px;">— The TokenPe Team</p>
                </div>
            `
        })

        otpLimiter.reset(ip)
        return Response.json({ success: true, otpToken, message: 'OTP sent to your email.' }, { status: 200 })

    } catch (err) {
        console.error('[Send OTP Error]', err)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
