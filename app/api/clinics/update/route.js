import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function POST(req) {
  try {
    const { clinicId, welcomeMessage } = await req.json()
    
    if (!clinicId) {
      return NextResponse.json({ success: false, error: 'Clinic ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('clinics')
      .update({ welcome_message: welcomeMessage })
      .eq('id', clinicId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update clinic error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
