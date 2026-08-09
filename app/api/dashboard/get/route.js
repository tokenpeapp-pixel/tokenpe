import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        let session = null
        try {
            session = await getSession()
        } catch (_) {}

        const searchParams = new URL(req.url).searchParams
        const businessId = searchParams.get('clinicId') || searchParams.get('businessId') || session?.businessId

        if (!businessId) {
            return Response.json({ success: false, message: 'Missing clinic ID' }, { status: 400 })
        }

        // Fetch patients strictly for this specific clinic branch
        const { data: patients, error } = await supabaseAdmin
            .from('patients')
            .select('*')
            .eq('clinic_id', businessId)
            .order('joined_at', { ascending: true })

        if (error) {
            console.error('[dashboard/get API Error]', error)
            return Response.json({ success: false, message: error.message }, { status: 500 })
        }

        return Response.json({ success: true, patients: patients || [] }, { status: 200 })
    } catch (error) {
        console.error('[dashboard/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
