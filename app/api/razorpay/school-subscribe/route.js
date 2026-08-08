// POST /api/razorpay/school-subscribe
// Creates a Razorpay subscription for the given plan tier specific to schools
import Razorpay from 'razorpay'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    })

    const PLAN_MAP = {
      starter: process.env.RAZORPAY_PLAN_SCHOOL_STARTER,
      pro:     process.env.RAZORPAY_PLAN_SCHOOL_PRO,
      elite:   process.env.RAZORPAY_PLAN_SCHOOL_ELITE,
    }

    const { businessId, planTier } = await req.json()

    if (!businessId || !planTier) {
      return Response.json({ error: 'Missing businessId or planTier' }, { status: 400 })
    }

    const session = await getUnifiedSession()
    if (!session || session.businessId !== businessId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const planId = PLAN_MAP[planTier]
    if (!planId) {
      return Response.json({ error: `Unknown plan tier or environment variable missing: ${planTier}` }, { status: 400 })
    }

    // Get school details for pre-filling checkout
    const { data: business, error: bizErr } = await supabaseAdmin
      .from('businesses')
      .select('name, email, phone')
      .eq('id', businessId)
      .single()

    if (bizErr || !business) {
      return Response.json({ error: 'School not found' }, { status: 404 })
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 1 year; auto-renews
      quantity: 1,
      customer_notify: 1,
      notes: {
        business_id: businessId,
        plan_tier: planTier,
        business_name: business.name,
      }
    })

    return Response.json({
      subscriptionId: subscription.id,
      businessName: business.name,
      businessEmail: business.email,
      businessPhone: business.phone,
    })

  } catch (err) {
    console.error('[Razorpay School Subscribe] Create subscription error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
