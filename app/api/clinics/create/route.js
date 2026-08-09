import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession, getUnifiedSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const { clinicName, phone, email, specialty } = await req.json()
    
    if (!clinicName || !email) {
      return NextResponse.json({ success: false, error: 'Name and email required' }, { status: 400 })
    }

    const session = (await getUnifiedSession()) || (await getSession())

    let { data: existingClinics } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('email', email)
    
    if (!existingClinics || existingClinics.length === 0) {
      const { data: bClinics } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('email', email)
      if (bClinics) existingClinics = bClinics
    }

    // Generate unique code
    const clean = clinicName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    const num = Math.floor(Math.random() * 900) + 100
    const newCode = `${clean}${num}`
    
    const parentClinic = (existingClinics && existingClinics.length > 0)
      ? [...existingClinics].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
      : null
    
    const newId = crypto.randomUUID()

    const newClinic = {
      id: newId,
      name: clinicName,
      email: email,
      phone: phone || parentClinic?.phone || '0000000000',
      code: newCode,
      vertical: parentClinic?.vertical || 'clinic',
      specialty: specialty || parentClinic?.specialty || 'General Physician',
      plan_id: 'elite',
      subscription_status: 'active',
      trial_ends_at: parentClinic?.trial_ends_at || null,
      current_period_end: parentClinic?.current_period_end || null,
      razorpay_subscription_id: parentClinic?.razorpay_subscription_id || null
    }

    const { data: createdClinic, error: clinicErr } = await supabaseAdmin
      .from('clinics')
      .insert(newClinic)
      .select()
      .single()

    if (clinicErr) {
      // Fallback insert to businesses table
      const bPayload = { ...newClinic, logo_url: null, settings: { is_public: true } }
      const { data: createdB, error: bErr } = await supabaseAdmin
        .from('businesses')
        .insert(bPayload)
        .select()
        .single()
      if (bErr) throw bErr
      return NextResponse.json({ success: true, clinic: createdB })
    }

    // Sync to businesses table with exact same newId
    try {
      await supabaseAdmin.from('businesses').insert({ ...newClinic, logo_url: null, settings: { is_public: true } })
    } catch (_) {}

    return NextResponse.json({ success: true, clinic: createdClinic })
  } catch (err) {
    console.error('Create branch error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
