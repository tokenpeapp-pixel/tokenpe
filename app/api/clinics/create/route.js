import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function POST(req) {
  try {
    const { clinicName, phone, email, parentPlanId } = await req.json()
    
    if (!clinicName || !email) {
      return NextResponse.json({ success: false, error: 'Name and email required' }, { status: 400 })
    }

    // Verify user owns clinics with this email and has Elite plan
    const { data: existingClinics, error: checkError } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', email)
    
    if (checkError) throw checkError
    
    const isElite = existingClinics.some(c => c.plan_id === 'elite' || c.plan_id === 'trialing' || c.subscription_status === 'trialing')
    
    if (!isElite) {
      return NextResponse.json({ success: false, error: 'Only Elite plans can create multiple branches' }, { status: 403 })
    }
    
    if (existingClinics.length >= 3) {
      return NextResponse.json({ success: false, error: 'Maximum limit of 3 branches reached' }, { status: 403 })
    }

    // Generate unique code
    const clean = clinicName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    const num = Math.floor(Math.random() * 900) + 100
    const newCode = `${clean}${num}`
    
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14) // Doesn't matter much as it inherits Elite, but keep schema valid
    
    const newClinic = {
      name: clinicName,
      email: email,
      phone: phone || existingClinics[0]?.phone || '0000000000',
      code: newCode,
      plan_id: 'elite', // Inherits Elite
      subscription_status: 'active'
    }

    const { data, error } = await supabase
      .from('clinics')
      .insert(newClinic)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, clinic: data })
  } catch (err) {
    console.error('Create branch error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
