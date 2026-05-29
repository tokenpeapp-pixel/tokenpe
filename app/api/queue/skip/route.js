import { supabase } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { patientId } = body

        if (!patientId) {
            return Response.json({ success: false, message: 'Patient ID is required' }, { status: 400 })
        }

        const { error } = await supabase
            .from('patients')
            .update({ status: 'skipped' })
            .eq('id', patientId)
            .eq('clinic_id', session.clinicId) // Ensure they only skip their own patients

        if (error) {
            return Response.json({ success: false, message: 'Failed to skip patient' }, { status: 500 })
        }

        return Response.json({ success: true }, { status: 200 })

    } catch (error) {
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
