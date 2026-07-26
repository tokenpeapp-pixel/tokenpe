// POST /api/razorpay/salon-subscribe
// Creates a Razorpay subscription for the salon Full Package plan
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    })

    // Salons have a single "Full Package" plan — one Razorpay plan ID
    const planId = process.env.RAZORPAY_PLAN_SALON

    const { salonId } = await req.json()

    if (!salonId) {
      return Response.json({ error: 'Missing salonId' }, { status: 400 })
    }

    const session = await getSession()
    if (!session || session.clinicId !== salonId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!planId) {
      return Response.json({ error: 'Salon plan not configured. Please set RAZORPAY_PLAN_SALON env variable.' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: salon, error: sErr } = await supabaseAdmin
      .from('salons').select('name, email, phone').eq('id', salonId).single()

    if (sErr || !salon) {
      return Response.json({ error: 'Salon not found' }, { status: 404 })
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 monthly billing cycles; auto-renews after
      quantity: 1,
      customer_notify: 1,
      notes: {
        salon_id: salonId,
        salon_name: salon.name,
        vertical: 'salon',
      }
    })

    return Response.json({
      subscriptionId: subscription.id,
      salonName: salon.name,
      salonEmail: salon.email,
      salonPhone: salon.phone,
    })

  } catch (err) {
    console.error('[Razorpay Salon] Create subscription error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
