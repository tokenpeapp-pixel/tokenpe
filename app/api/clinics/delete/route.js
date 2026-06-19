import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session || !session.clinicId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { clinicId } = await req.json()
    if (!clinicId) {
      return NextResponse.json({ success: false, error: 'Clinic ID required' }, { status: 400 })
    }

    // Get current user's email from their session clinic
    const { data: sessionClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', session.clinicId).single()
    if (!sessionClinic || !sessionClinic.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized clinic access' }, { status: 403 })
    }

    // Get the target clinic to delete
    const { data: targetClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', clinicId).single()
    if (!targetClinic || targetClinic.email !== sessionClinic.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized branch access' }, { status: 403 })
    }

    // Count how many branches this email has
    const { data: userClinics } = await supabaseAdmin.from('clinics').select('id').eq('email', sessionClinic.email)
    if (userClinics.length <= 1) {
      return NextResponse.json({ success: false, error: 'Cannot delete your only branch' }, { status: 400 })
    }

    // Delete the clinic
    const { error } = await supabaseAdmin.from('clinics').delete().eq('id', clinicId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete branch error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
