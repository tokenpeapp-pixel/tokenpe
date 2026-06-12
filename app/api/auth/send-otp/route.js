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
            subject: '\ud83d\udd10 Your TokenPe PIN Reset Code',
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Inter','Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid rgba(124,58,237,0.3);">

        <!-- HEADER BANNER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0b3b 0%,#0f0a2a 100%);padding:28px 36px;border-bottom:1px solid rgba(124,58,237,0.2);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
                    Token<span style="color:#a78bfa;">Pe</span>
                  </div>
                  <div style="font-size:11px;color:#6d28d9;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Smart Queue · Better Care</div>
                </td>
                <td align="right">
                  <div style="background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.4);border-radius:20px;padding:6px 14px;font-size:12px;color:#a78bfa;font-weight:600;">🔐 Security Alert</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:36px 36px 28px;">
            <p style="margin:0 0 6px;font-size:13px;color:#6d28d9;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">PIN Reset Request</p>
            <h1 style="margin:0 0 20px;font-size:26px;font-weight:900;color:#fff;line-height:1.2;">Hi, ${clinic.name} 👋</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.7;">
              We received a request to reset your <strong style="color:#e2e8f0;">TokenPe PIN</strong>. Use the verification code below to continue. This code is valid for <strong style="color:#a78bfa;">10 minutes</strong>.
            </p>

            <!-- OTP BOX -->
            <div style="background:linear-gradient(135deg,#1e1b4b,#1a0b3b);border:2px solid #7c3aed;border-radius:16px;padding:32px 24px;text-align:center;margin-bottom:28px;box-shadow:0 0 40px rgba(124,58,237,0.2);">
              <p style="margin:0 0 12px;font-size:12px;color:#6d28d9;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your One-Time Password</p>
              <div style="font-size:48px;font-weight:900;letter-spacing:16px;color:#c4b5fd;line-height:1;font-variant-numeric:tabular-nums;">${otp}</div>
              <p style="margin:12px 0 0;font-size:12px;color:#475569;">Expires in 10 minutes &nbsp;·&nbsp; Do not share this code</p>
            </div>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://tokenpe.online/login" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px;">
                    Go to TokenPe Login &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:28px 0 0;font-size:13px;color:#475569;line-height:1.6;">
              ⚠️ If you didn't request this, please ignore this email — your PIN has <strong>not</strong> been changed. If you're concerned, contact us at <a href="mailto:support@tokenpe.online" style="color:#7c3aed;">support@tokenpe.online</a>.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#080b14;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#334155;">
                  &copy; 2026 TokenPe &nbsp;·&nbsp; Made in India 🇮🇳 &nbsp;·&nbsp;
                  <a href="https://tokenpe.online/privacy" style="color:#475569;text-decoration:none;">Privacy Policy</a>
                </td>
                <td align="right" style="font-size:12px;color:#334155;">
                  <a href="https://tokenpe.online" style="color:#6d28d9;text-decoration:none;font-weight:600;">tokenpe.online</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
            `
        })

        otpLimiter.reset(ip)
        return Response.json({ success: true, otpToken, message: 'OTP sent to your email.' }, { status: 200 })

    } catch (err) {
        console.error('[Send OTP Error]', err)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
