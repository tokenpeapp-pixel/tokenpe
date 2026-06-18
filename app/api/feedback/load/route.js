import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const patientId = searchParams.get('patientId')
        const clinicCode = searchParams.get('clinicCode')

        if (!patientId || !clinicCode) {
            return Response.json({ success: false, message: 'Missing parameters' }, { status: 400 })
        }

        const code = String(clinicCode).trim().toUpperCase()
        const { data: clinic } = await supabaseAdmin
            .from('clinics')
            .select('id, name, logo_url')
            .eq('code', code)
            .single()

        if (!clinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }

        const { data: patient } = await supabaseAdmin
            .from('patients')
            .select('id, name, rating, feedback_text, clinic_id')
            .eq('id', patientId)
            .single()

        if (!patient || patient.clinic_id !== clinic.id) {
            return Response.json({ success: false, message: 'Patient not found' }, { status: 404 })
        }

        return Response.json({
            success: true,
            clinic: { id: clinic.id, name: clinic.name, logo_url: clinic.logo_url },
            patient: {
                id: patient.id,
                name: patient.name,
                rating: patient.rating,
                feedback_text: patient.feedback_text
            }
        })
    } catch (error) {
        console.error('[feedback/load] Error:', error)
        return Response.json({ success: false, message: error.message }, { status: 500 })
    }
}
