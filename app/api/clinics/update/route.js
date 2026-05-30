import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session || !session.clinicId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { clinicId, welcomeMessage, address } = await req.json()
    
    if (!clinicId) {
      return NextResponse.json({ success: false, error: 'Clinic ID required' }, { status: 400 })
    }

    // Verify branch ownership via email match
    if (clinicId !== session.clinicId) {
      const { data: sessionClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', session.clinicId).single()
      const { data: targetClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', clinicId).single()
      if (!sessionClinic || !targetClinic || sessionClinic.email !== targetClinic.email) {
        return NextResponse.json({ success: false, error: 'Unauthorized clinic access' }, { status: 403 })
      }
    }

    const updates = {}
    if (welcomeMessage !== undefined) updates.welcome_message = welcomeMessage
    if (address !== undefined) updates.address = address

    const { error } = await supabaseAdmin
      .from('clinics')
      .update(updates)
      .eq('id', clinicId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update clinic error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
