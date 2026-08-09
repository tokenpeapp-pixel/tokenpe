import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ success: false, error: 'Missing clinic ID' }, { status: 400 })
    }

    let { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !clinic) {
      const { data: bClinic } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single()
      clinic = bClinic
    }

    if (!clinic) {
      return Response.json({ success: false, error: 'Clinic not found' }, { status: 404 })
    }

    // Default to Elite plan if missing
    if (!clinic.plan_id) clinic.plan_id = 'elite'
    if (!clinic.subscription_status) clinic.subscription_status = 'active'

    return Response.json({ success: true, clinic, business: clinic }, { status: 200 })
  } catch (error) {
    console.error('[clinics/get API Error]', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
