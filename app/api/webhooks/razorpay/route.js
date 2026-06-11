// POST /api/webhooks/razorpay
// Handles Razorpay subscription webhook events to update clinic plans in Supabase
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

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
      else console.log(`[Razorpay Webhook] ✅ Clinic ${clinicId} upgraded to ${planTier}`)
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
