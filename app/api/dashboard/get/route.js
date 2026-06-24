import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const date = searchParams.get('date')
        
        if (!date) {
            return Response.json({ success: false, message: 'Date is required' }, { status: 400 })
        }

        const clinicId = session.clinicId

        // Fetch patients for the specific date
        const { data: patients, error } = await supabaseAdmin
            .from('patients')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('date', date)
            .order('joined_at', { ascending: true })

        if (error) {
            throw error
        }

        return Response.json({ success: true, patients: patients || [] }, { status: 200 })
    } catch (error) {
        console.error('[dashboard/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
