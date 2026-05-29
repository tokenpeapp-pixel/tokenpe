// POST /api/razorpay/create-subscription
// Creates a Razorpay subscription for the given plan tier
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    })

    const PLAN_MAP = {
      starter: process.env.RAZORPAY_PLAN_STARTER,
      pro:     process.env.RAZORPAY_PLAN_PRO,
      elite:   process.env.RAZORPAY_PLAN_ELITE,
    }

    const { clinicId, planTier } = await req.json()

    if (!clinicId || !planTier) {
      return Response.json({ error: 'Missing clinicId or planTier' }, { status: 400 })
    }

    const session = await getSession()
    if (!session || session.clinicId !== clinicId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const planId = PLAN_MAP[planTier]
    if (!planId) {
      return Response.json({ error: `Unknown plan tier: ${planTier}` }, { status: 400 })
    }

    // Get clinic details for pre-filling checkout
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    
    const { data: clinic, error: cErr } = await supabaseAdmin
      .from('clinics').select('name, email, phone').eq('id', clinicId).single()

    if (cErr || !clinic) {
      return Response.json({ error: 'Clinic not found' }, { status: 404 })
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 billing cycles (1 year); auto-renews after
      quantity: 1,
      customer_notify: 1,
      notes: {
        clinic_id: clinicId,
        plan_tier: planTier,
        clinic_name: clinic.name,
      }
    })

    return Response.json({
      subscriptionId: subscription.id,
      clinicName: clinic.name,
      clinicEmail: clinic.email,
      clinicPhone: clinic.phone,
    })

  } catch (err) {
    console.error('[Razorpay] Create subscription error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
