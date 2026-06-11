import { supabaseAdmin } from '../../../../lib/supabase'
import { jwtVerify } from 'jose'
import { validatePin } from '../../../../lib/validate'
import { rateLimit } from '../../../../lib/rateLimit'

const resetLimiter = rateLimit({ maxAttempts: 5, windowMs: 15 * 60 * 1000 })
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'tokenpe_super_secret_fallback_2026')

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const limit = resetLimiter.check(ip)
        if (limit.blocked) {
            const retryMins = Math.ceil(limit.retryAfterMs / 60000)
            return Response.json({ success: false, message: `Too many attempts. Try again in ${retryMins} minutes.` }, { status: 429 })
        }

        const body = await req.json()
        const { otpToken, otp, newPin } = body

        if (!otpToken || !otp || !newPin) {
            return Response.json({ success: false, message: 'Missing required fields.' }, { status: 400 })
        }

        // Verify the OTP token
        let payload
        try {
            const result = await jwtVerify(otpToken, getSecret())
            payload = result.payload
        } catch (err) {
            resetLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'OTP has expired or is invalid. Please request a new one.' }, { status: 401 })
        }

        // Check OTP matches
        if (payload.otp !== String(otp).trim()) {
            resetLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'Incorrect OTP. Please try again.' }, { status: 401 })
        }

        // Validate new PIN
        const cleanPin = validatePin(newPin)
        if (!cleanPin) {
            return Response.json({ success: false, message: 'PIN must be exactly 4 digits.' }, { status: 400 })
        }

        // Update the clinic's PIN
        const { error: updateError } = await supabaseAdmin
            .from('clinics')
            .update({ pin: cleanPin })
            .eq('email', payload.email)
            .eq('phone', payload.phone)

        if (updateError) {
            console.error('[Reset PIN] Failed to update PIN:', updateError)
            return Response.json({ success: false, message: 'Failed to update PIN. Please try again.' }, { status: 500 })
        }

        resetLimiter.reset(ip)
        return Response.json({ success: true, message: 'PIN updated successfully! You can now log in.' }, { status: 200 })

    } catch (err) {
        console.error('[Reset PIN Error]', err)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
