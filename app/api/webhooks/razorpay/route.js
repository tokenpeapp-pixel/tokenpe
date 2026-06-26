// POST /api/webhooks/razorpay
// Handles Razorpay subscription webhook events to update clinic plans in Supabase
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { sendTemplateMessage, cleanPhone } from '../../../../lib/messaging'

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

          // 2. WhatsApp Template Confirmation
          if (currentClinic.phone) {
            const renewalDate = new Date(sub.current_end * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
            await sendTemplateMessage({
              phone: cleanPhone(currentClinic.phone),
              templateName: 'tokenpe_payment_success',
              languageCode: 'en',
              bodyValues: [currentClinic.name, planName, renewalDate]
            })
          }
        }
      }
    }

    if (eventType === 'subscription.halted' || eventType === 'subscription.cancelled') {
      const newStatus = eventType === 'subscription.cancelled' ? 'canceled' : 'past_due'
      const updatePayload = { subscription_status: newStatus }

      // Only clear the plan on full cancellation, NOT on payment failure (halted)
      if (eventType === 'subscription.cancelled') {
        updatePayload.plan_id = 'canceled'
      }
      // On halted: keep existing plan_id so they still know what they had — just mark past_due

      const { error, data: clinicInfo } = await supabaseAdmin
        .from('clinics')
        .update(updatePayload)
        .eq('id', clinicId)
        .select('name, email, plan_id')
        .single()

      if (error) console.error('[Razorpay Webhook] DB downgrade error:', error)
      else {
        console.log(`[Razorpay Webhook] ⚠️ Clinic ${clinicId} status updated to ${newStatus} — event: ${eventType}`)

        // Send email notification
        if (clinicInfo?.email) {
          const isHalted = eventType === 'subscription.halted'
          const subject = isHalted
            ? '⚠️ Payment Failed – Action Required | TokenPe'
            : '❌ Subscription Cancelled | TokenPe'

          const bodyHtml = isHalted ? `
            <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
              <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:36px;margin-bottom:24px;" />
              <h2 style="color:#f59e0b;font-size:22px;margin-bottom:8px;">⚠️ Payment Failed</h2>
              <p>Hi <strong style="color:#fff">${clinicInfo.name}</strong>,</p>
              <p>We were unable to process your payment for your <strong>TokenPe subscription</strong>. Your account is currently on hold.</p>
              <p style="color:#94a3b8;">Please update your payment method to avoid any interruption to your service.</p>
              <a href="https://tokenpe.online/dashboard/billing" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-top:16px;">
                Update Payment →
              </a>
              <p style="margin-top:24px;font-size:12px;color:#475569;">Need help? Email support@tokenpe.online</p>
            </div>
          ` : `
            <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
              <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:36px;margin-bottom:24px;" />
              <h2 style="color:#ef4444;font-size:22px;margin-bottom:8px;">❌ Subscription Cancelled</h2>
              <p>Hi <strong style="color:#fff">${clinicInfo.name}</strong>,</p>
              <p>Your TokenPe subscription has been cancelled. Your clinic's premium features are now disabled.</p>
              <p style="color:#94a3b8;">You can reactivate your plan anytime from the billing dashboard to restore full access.</p>
              <a href="https://tokenpe.online/dashboard/billing" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-top:16px;">
                Reactivate Plan →
              </a>
              <p style="margin-top:24px;font-size:12px;color:#475569;">Need help? Email support@tokenpe.online</p>
            </div>
          `

          try {
            await resend.emails.send({
              from: 'TokenPe <support@tokenpe.online>',
              to: clinicInfo.email,
              subject,
              html: bodyHtml
            })
            console.log(`[Razorpay Webhook] 📧 ${isHalted ? 'Payment failure' : 'Cancellation'} email sent to ${clinicInfo.email}`)
          } catch (e) {
            console.error('[Razorpay Webhook] Failed to send email:', e)
          }
        }
      }
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
