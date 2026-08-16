import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'

export async function POST(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { id } = body

        if (!id) {
            return Response.json({ success: false, message: 'Missing patient ID' }, { status: 400 })
        }

        const { data: patient, error } = await supabaseAdmin
            .from('patient_entries')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', id)
            .eq('clinic_id', session.clinicId)
            .select()
            .single()

        if (error || !patient) {
            return Response.json({ success: false, message: 'Patient not found or could not be updated' }, { status: 404 })
        }

        // Also update linked appointment if it exists
        await supabaseAdmin
            .from('appointments')
            .update({ status: 'completed' })
            .eq('patient_entry_id', patient.id)

        return Response.json({ success: true, patient }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Queue Done Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
