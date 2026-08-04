import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const { name, phone, email, type } = await req.json()
    
    if (!name || !email || !type) {
      return NextResponse.json({ success: false, error: 'Name, email and type required' }, { status: 400 })
    }

    const session = await getUnifiedSession()
    if (!session || !session.businessId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns businesses with this email and has Elite plan
    const { data: existingBusinesses, error: checkError } = await supabase
      .from('businesses')
      .select('*')
      .eq('email', email)
    
    if (checkError) throw checkError
    
    const isElite = existingBusinesses.some(c => c.plan_id === 'elite' || c.plan_id === 'trialing' || c.subscription_status === 'trialing')
    
    if (!isElite) {
      return NextResponse.json({ success: false, error: 'Only Elite plans can create multiple branches' }, { status: 403 })
    }
    
    if (existingBusinesses.length >= 3) {
      return NextResponse.json({ success: false, error: 'Maximum limit of 3 branches reached' }, { status: 403 })
    }

    // Generate unique code
    const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    const num = Math.floor(Math.random() * 900) + 100
    const newCode = `${clean}${num}`
    
    // Always use the OLDEST business (primary branch) as the billing source of truth
    const sortedBusinesses = [...existingBusinesses].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    const parentBusiness = sortedBusinesses[0]
    
    const newBusiness = {
      name: name,
      email: email,
      phone: phone || parentBusiness?.phone || '0000000000',
      type: type,
      code: newCode,
      plan_id: parentBusiness.plan_id || 'starter',
      subscription_status: parentBusiness.subscription_status || 'trialing',
      trial_ends_at: parentBusiness.trial_ends_at || null,
      current_period_end: parentBusiness.current_period_end || null,
      razorpay_subscription_id: parentBusiness.razorpay_subscription_id || null
    }

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .insert(newBusiness)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, business: data })
  } catch (err) {
    console.error('Create branch error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
