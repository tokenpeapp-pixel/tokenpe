import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const date = searchParams.get('date')
        
        if (!date) {
            return Response.json({ success: false, message: 'Date is required' }, { status: 400 })
        }

        const businessId = session.businessId

        // 1. Fetch active queue patients from patients table (by clinic_id)
        let { data: patients, error } = await supabaseAdmin
            .from('patients')
            .select('*')
            .eq('clinic_id', businessId)
            .or(`date.eq.${date},status.eq.waiting,status.eq.called`)
            .order('joined_at', { ascending: true })

        if (error || !patients || patients.length === 0) {
            // 2. Fallback to queue_entries table
            const { data: qPatients } = await supabaseAdmin
                .from('queue_entries')
                .select('*')
                .eq('business_id', businessId)
                .or(`date.eq.${date},status.eq.waiting,status.eq.called`)
                .order('joined_at', { ascending: true })
            if (qPatients && qPatients.length > 0) {
                patients = qPatients
            }
        }

        return Response.json({ success: true, patients: patients || [] }, { status: 200 })
    } catch (error) {
        console.error('[dashboard/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
