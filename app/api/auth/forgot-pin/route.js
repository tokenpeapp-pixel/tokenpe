import { supabase } from '../../../../lib/supabase'
import { sendText } from '../../../../lib/messaging'
import { rateLimit } from '../../../../lib/rateLimit'

const forgotLimiter = rateLimit({ maxAttempts: 3, windowMs: 15 * 60 * 1000 })

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const limit = forgotLimiter.check(ip)
        if (limit.blocked) {
            const retryMins = Math.ceil(limit.retryAfterMs / 60000)
            return Response.json({ success: false, message: `Too many requests. Try again in ${retryMins} minutes.` }, { status: 429 })
        }

        const body = await req.json()
        const { code, phone } = body

        if (!code || !phone) {
            return Response.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        const cleanCode = String(code).trim().toUpperCase()
        const cleanPhone = String(phone).replace(/\D/g, '')

        const { data: clinic, error } = await supabase
            .from('clinics')
            .select('id, name, phone')
            .eq('code', cleanCode)
            .eq('phone', cleanPhone)
            .single()

        if (error || !clinic) {
            forgotLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'Invalid clinic code or phone number.' }, { status: 404 })
        }

        // Generate a new 4-digit PIN
        const newPin = Math.floor(1000 + Math.random() * 9000).toString()

        // Update the clinic's PIN
        const { error: updateError } = await supabase
            .from('clinics')
            .update({ pin: newPin })
            .eq('id', clinic.id)

        if (updateError) {
            console.error('[Forgot PIN] Failed to update PIN:', updateError)
            return Response.json({ success: false, message: 'Failed to reset PIN. Please try again.' }, { status: 500 })
        }

        // Send the new PIN via WhatsApp
        const msg = `🚨 *Password Reset*\n\nYour new TokenPe PIN is: *${newPin}*\n\nPlease log in using this PIN.`
        await sendText(cleanPhone, msg)

        forgotLimiter.reset(ip)
        return Response.json({ success: true, message: 'A new PIN has been sent to your registered WhatsApp number.' }, { status: 200 })

    } catch (error) {
        console.error('[Forgot PIN Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
