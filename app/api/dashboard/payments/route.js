import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const searchQuery = searchParams.get('search') || ''
        const businessId = session.businessId

        if (searchQuery) {
            // Global search for patients (for payments view)
            let { data: patients, error } = await supabaseAdmin
                .from('patients')
                .select('*')
                .eq('clinic_id', businessId)
                .or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,token.ilike.%${searchQuery}%`)
                .order('joined_at', { ascending: false })
                .limit(100)

            if (error || !patients || patients.length === 0) {
                const { data: qPatients } = await supabaseAdmin
                    .from('queue_entries')
                    .select('*')
                    .eq('business_id', businessId)
                    .or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,token.ilike.%${searchQuery}%`)
                    .order('joined_at', { ascending: false })
                    .limit(100)
                if (qPatients) patients = qPatients
            }

            return Response.json({ success: true, patients: patients || [] }, { status: 200 })
        } else {
            // Default view: fetch all queue entries for the clinic
            let { data: patients, error } = await supabaseAdmin
                .from('patients')
                .select('*')
                .eq('clinic_id', businessId)
                .order('joined_at', { ascending: false })
                .limit(200)

            if (error || !patients || patients.length === 0) {
                const { data: qPatients } = await supabaseAdmin
                    .from('queue_entries')
                    .select('*')
                    .eq('business_id', businessId)
                    .order('joined_at', { ascending: false })
                    .limit(200)
                if (qPatients) patients = qPatients
            }

            return Response.json({ success: true, patients: patients || [] }, { status: 200 })
        }
    } catch (error) {
        console.error('[dashboard/payments API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
