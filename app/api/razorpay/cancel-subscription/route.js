import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const { clinicId } = await req.json()

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
      .select('razorpay_subscription_id, plan_id')
      .eq('id', clinicId)
      .single()

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

    return Response.json({ success: true })

  } catch (err) {
    console.error('[Razorpay Cancel] Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
