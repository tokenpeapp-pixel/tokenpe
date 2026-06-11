// POST /api/webhooks/razorpay
// Handles Razorpay subscription webhook events to update clinic plans in Supabase
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { sendText, cleanPhone } from '../../../../lib/messaging'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function POST(req) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // Verify webhook signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(rawBody)
      .digest('hex')

    if (signature !== expectedSig) {
      console.error('[Razorpay Webhook] ❌ Invalid signature')
      return Response.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const { event: eventType, payload } = event

    console.log(`[Razorpay Webhook] 📩 Event: ${eventType}`)

    // Extract subscription details
    const sub = payload?.subscription?.entity
    const payment = payload?.payment?.entity
    if (!sub) return Response.json({ ok: true })

    const clinicId = sub.notes?.clinic_id
    const planTier = sub.notes?.plan_tier
    if (!clinicId) return Response.json({ ok: true })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── Handle Events ──────────────────────────────────────────────────────────

    if (eventType === 'subscription.activated' || eventType === 'subscription.charged') {
      // Payment successful — upgrade clinic plan
      const periodEnd = new Date(sub.current_end * 1000).toISOString()
      const { data: currentClinic } = await supabaseAdmin.from('clinics').select('name, email, phone').eq('id', clinicId).single()

      const { error } = await supabaseAdmin
        .from('clinics')
        .update({
          plan_id: planTier,
          subscription_status: 'active',
          razorpay_subscription_id: sub.id,
          current_period_end: periodEnd,
        })
        .eq('id', clinicId)

      if (error) console.error('[Razorpay Webhook] DB update error:', error)
      else {
        console.log(`[Razorpay Webhook] ✅ Clinic ${clinicId} upgraded to ${planTier}`)
        
        // Send Confirmations only if it's newly activated or charged
        if (currentClinic && eventType === 'subscription.charged') {
          const planName = planTier.charAt(0).toUpperCase() + planTier.slice(1)
          
          // 1. Email Confirmation
          if (currentClinic.email) {
            try {
              await resend.emails.send({
                from: 'TokenPe <support@tokenpe.online>',
                to: currentClinic.email,
                subject: `🎉 Upgrade Successful: Welcome to TokenPe ${planName}!`,
                html: `
                  <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
                    <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:36px;margin-bottom:24px;" />
                    <h2 style="color:#10b981;font-size:22px;margin-bottom:8px;">Payment Successful! 🎉</h2>
                    <p style="color:#94a3b8;">Hi <strong style="color:#fff">${currentClinic.name}</strong>,</p>
                    <p>Your clinic has been successfully upgraded to the <strong>${planName} Plan</strong>.</p>
                    <p>Your subscription is now active and will automatically renew on <strong>${new Date(sub.current_end * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
                    <a href="https://tokenpe.online/dashboard" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-top:16px;">
                      Go to Dashboard →
                    </a>
                  </div>
                `
              })
            } catch (e) { console.error('Failed to send confirmation email', e) }
          }

          // 2. WhatsApp Confirmation
          if (currentClinic.phone) {
            const waMsg = `🎉 *Payment Successful!*

Hi *${currentClinic.name}*,

Welcome to the *TokenPe ${planName} Plan*! 🚀
Your clinic's features have been unlocked instantly.

Next renewal date: *${new Date(sub.current_end * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}*

Access your dashboard now:
👉 https://tokenpe.online/dashboard

_Powered by TokenPe_`
            await sendText(cleanPhone(currentClinic.phone), waMsg)
          }
        }
      }
    }

    if (eventType === 'subscription.halted' || eventType === 'subscription.cancelled') {
      // Payment failed or cancelled — downgrade to starter
      const { error } = await supabaseAdmin
        .from('clinics')
        .update({
          plan_id: eventType === 'subscription.cancelled' ? 'canceled' : 'starter',
          subscription_status: eventType === 'subscription.cancelled' ? 'canceled' : 'past_due',
        })
        .eq('id', clinicId)

      if (error) console.error('[Razorpay Webhook] DB downgrade error:', error)
      else console.log(`[Razorpay Webhook] ⚠️ Clinic ${clinicId} downgraded — event: ${eventType}`)
    }

    if (eventType === 'subscription.completed') {
      await supabaseAdmin
        .from('clinics')
        .update({ subscription_status: 'completed' })
        .eq('id', clinicId)
    }

    return Response.json({ ok: true })

  } catch (err) {
    console.error('[Razorpay Webhook] Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
