import { supabaseAdmin as supabase } from '../../../../lib/supabase'
import { rateLimit } from '../../../../lib/rateLimit'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

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
        const { email, phone } = body

        if (!email || !phone) {
            return Response.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        const cleanEmail = String(email).trim().toLowerCase()
        const cleanPhone = String(phone).replace(/\D/g, '')

        const { data: clinic, error } = await supabase
            .from('clinics')
            .select('id, name, phone, email')
            .eq('email', cleanEmail)
            .eq('phone', cleanPhone)
            .single()

        if (error || !clinic) {
            forgotLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'Invalid email or phone number.' }, { status: 404 })
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

        // Send the new PIN via Email
        try {
            await resend.emails.send({
                from: 'TokenPe <support@tokenpe.online>',
                to: clinic.email,
                subject: '🔑 Your TokenPe PIN Reset',
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2 style="color: #7C3AED;">Password Reset</h2>
                        <p>Hi ${clinic.name},</p>
                        <p>Your new TokenPe PIN is: <strong style="font-size: 24px;">${newPin}</strong></p>
                        <p>Please log in using this PIN. For security, you should not share this PIN with anyone.</p>
                        <br/>
                        <p>Thank you,<br/>The TokenPe Team</p>
                    </div>
                `
            })
        } catch (emailErr) {
            console.error('[Forgot PIN] Failed to send email:', emailErr)
            return Response.json({ success: false, message: 'PIN updated, but failed to send email.' }, { status: 500 })
        }

        forgotLimiter.reset(ip)
        return Response.json({ success: true, message: 'A new PIN has been sent to your registered email address.' }, { status: 200 })

    } catch (error) {
        console.error('[Forgot PIN Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
