import { supabaseAdmin } from '../../../../lib/supabase'
import { jwtVerify } from 'jose'
import { validatePin } from '../../../../lib/validate'
import { rateLimit } from '../../../../lib/rateLimit'
import { hashPin } from '../../../../lib/clinic-auth'

const resetLimiter = rateLimit({ maxAttempts: 5, windowMs: 15 * 60 * 1000 })
const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in environment variables.')
  }
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const limit = await resetLimiter.check(ip, 'pin_reset_v2')
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
            await resetLimiter.recordFailure(ip, 'pin_reset_v2')
            return Response.json({ success: false, message: 'OTP has expired or is invalid. Please request a new one.' }, { status: 401 })
        }

        // Check OTP matches
        if (payload.otp !== String(otp).trim()) {
            await resetLimiter.recordFailure(ip, 'pin_reset_v2')
            return Response.json({ success: false, message: 'Incorrect OTP. Please try again.' }, { status: 401 })
        }

        // Validate new PIN
        const cleanPin = validatePin(newPin)
        if (!cleanPin) {
            return Response.json({ success: false, message: 'PIN must be exactly 4 digits.' }, { status: 400 })
        }
        
        // Hash the new PIN securely
        const pinHash = await hashPin(cleanPin)

        // Update the clinic's PIN
        let query = supabaseAdmin
            .from('clinics')
            .update({ pin_hash: pinHash })
            .eq('email', payload.email)
            
        // If phone is 'none', it was a Google SSO account lookup
        if (payload.phone && payload.phone !== 'none') {
            query = query.eq('phone', payload.phone)
        }

        const { error: updateError } = await query

        if (updateError) {
            console.error('[Reset PIN] Failed to update PIN:', updateError)
            return Response.json({ success: false, message: 'Failed to update PIN. Please try again.' }, { status: 500 })
        }

        await resetLimiter.reset(ip, 'pin_reset_v2')
        return Response.json({ success: true, message: 'PIN updated successfully! You can now log in.' }, { status: 200 })

    } catch (err) {
        console.error('[Reset PIN Error]', err)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
