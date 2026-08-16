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
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', id)
            .eq('clinic_id', session.clinicId)
            .select()
            .single()

        if (error || !patient) {
            return Response.json({ success: false, message: 'Patient not found or could not be cancelled' }, { status: 404 })
        }

        return Response.json({ success: true, patient }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Queue Cancel Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
