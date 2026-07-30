import { supabaseAdmin as supabase } from '../../../../../lib/supabase'
import { SignJWT } from 'jose'
import { Resend } from 'resend'
import { rateLimit } from '../../../../../lib/rateLimit'

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

        // Verify school exists with this email + phone
        const { data: rows, error } = await supabase
            .from('schools')
            .select('id, name, email')
            .ilike('email', cleanEmail)
            .eq('phone', cleanPhone)
            .order('created_at', { ascending: true })
            .limit(1)

        const school = rows?.[0] ?? null

        if (error || !school) {
            otpLimiter.recordFailure(ip)
            return Response.json({ success: false, message: 'No school found with this email and phone number.' }, { status: 404 })
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // Sign a short-lived OTP token (10 minutes) — embed vertical so reset-pin knows which table
        const otpToken = await new SignJWT({ email: cleanEmail, phone: cleanPhone, otp, vertical: 'school' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('10m')
            .sign(getSecret())

        // Send OTP email via Resend
        await resend.emails.send({
            from: 'TokenPe <support@tokenpe.online>',
            to: school.email,
            subject: '🔐 Your TokenPe PIN Reset Code',
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Inter','Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid rgba(124,58,237,0.3);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a0b3b 0%,#0f0a2a 100%);padding:28px 36px;border-bottom:1px solid rgba(124,58,237,0.2);">
            <div style="font-size:24px;font-weight:900;color:#fff;">Token<span style="color:#a78bfa;">Pe</span></div>
            <div style="font-size:11px;color:#6d28d9;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Smart Queue · Schools</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 36px 28px;">
            <h1 style="margin:0 0 20px;font-size:26px;font-weight:900;color:#fff;">Hi, ${school.name} 👋</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.7;">
              Use the code below to reset your <strong style="color:#e2e8f0;">TokenPe PIN</strong>. Valid for <strong style="color:#a78bfa;">10 minutes</strong>.
            </p>
            <div style="background:linear-gradient(135deg,#1e1b4b,#1a0b3b);border:2px solid #7c3aed;border-radius:16px;padding:32px 24px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 12px;font-size:12px;color:#6d28d9;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your One-Time Password</p>
              <div style="font-size:48px;font-weight:900;letter-spacing:16px;color:#c4b5fd;line-height:1;">${otp}</div>
              <p style="margin:12px 0 0;font-size:12px;color:#475569;">Expires in 10 minutes &nbsp;·&nbsp; Do not share this code</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#080b14;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:12px;color:#334155;">&copy; 2026 TokenPe &nbsp;·&nbsp; Made in India 🇮🇳</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
        })

        otpLimiter.reset(ip)
        return Response.json({ success: true, otpToken, message: 'OTP sent to your email.' }, { status: 200 })

    } catch (err) {
        console.error('[School Send OTP Error]', err)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
