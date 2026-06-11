import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '../../../../lib/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function POST(req) {
  try {
    const { clinicId, reason } = await req.json()

    if (!clinicId) {
      return Response.json({ error: 'Missing clinicId' }, { status: 400 })
    }

    const session = await getSession()
    if (!session || session.clinicId !== clinicId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get the clinic's Razorpay subscription ID
    const { data: clinic, error: cErr } = await supabaseAdmin
      .from('clinics')
      .select('razorpay_subscription_id, plan_id, name')
      .eq('id', clinicId)
      .single()

    const clinicName = clinic?.name || 'Unknown Clinic'

    if (cErr || !clinic) {
      return Response.json({ error: 'Clinic not found' }, { status: 404 })
    }

    if (!clinic.razorpay_subscription_id) {
      // If there's no subscription ID but they are somehow on a pro/elite plan, just downgrade them
      if (clinic.plan_id !== 'starter') {
        await supabaseAdmin.from('clinics').update({ plan_id: 'starter', subscription_status: 'canceled' }).eq('id', clinicId)
      }
      return Response.json({ success: true, message: 'Downgraded successfully' })
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy',
    })

    // Cancel in Razorpay immediately
    try {
      await razorpay.subscriptions.cancel(clinic.razorpay_subscription_id, false)
    } catch (rzpErr) {
      console.warn('[Razorpay] Cancel failed (might already be cancelled):', rzpErr)
    }

    // Downgrade in Supabase immediately
    const { error: updateErr } = await supabaseAdmin
      .from('clinics')
      .update({
        plan_id: 'starter',
        subscription_status: 'canceled',
        razorpay_subscription_id: null,
        current_period_end: null
      })
      .eq('id', clinicId)

    if (updateErr) {
      throw updateErr
    }

    // Notify founder via email
    try {
      const planLabel = clinic.plan_id === 'elite' ? 'Elite ₹1999' : clinic.plan_id === 'pro' ? 'Pro ₹999' : 'Starter ₹499'
      const reasonLabel = reason || 'Not provided'
      await resend.emails.send({
        from: 'TokenPe Alerts <support@tokenpe.online>',
        to: 'tokenpe.online@gmail.com',
        subject: `🚨 Cancellation: ${clinicName} cancelled their ${planLabel} plan`,
        html: `
          <h2>Subscription Cancelled</h2>
          <p><strong>Clinic:</strong> ${clinicName}</p>
          <p><strong>Plan:</strong> ${planLabel}/mo</p>
          <p><strong>Reason given:</strong> ${reasonLabel}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        `
      })
    } catch (mailErr) {
      console.warn('[Cancel] Founder email failed:', mailErr.message)
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error('[Razorpay Cancel] Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
