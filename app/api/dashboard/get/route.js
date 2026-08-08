import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        let session = null
        try {
            session = await getSession()
        } catch (_) {}

        const searchParams = new URL(req.url).searchParams
        const businessId = session?.businessId || searchParams.get('clinicId') || searchParams.get('businessId')

        if (!businessId) {
            return Response.json({ success: false, message: 'Missing clinic ID' }, { status: 400 })
        }

        // Automatically backfill any null clinic_id patients to this clinic_id if valid UUID
        if (businessId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(businessId))) {
            try {
                await supabaseAdmin
                    .from('patients')
                    .update({ clinic_id: businessId })
                    .is('clinic_id', null)
            } catch (_) {}
        }

        // Fetch patients for this clinic (and any unassigned entries)
        let { data: patients, error } = await supabaseAdmin
            .from('patients')
            .select('*')
            .eq('clinic_id', businessId)
            .order('joined_at', { ascending: true })

        if (!patients || patients.length === 0) {
            const { data: fallbackPatients } = await supabaseAdmin
                .from('patients')
                .select('*')
                .is('clinic_id', null)
                .order('joined_at', { ascending: true })
            if (fallbackPatients && fallbackPatients.length > 0) patients = fallbackPatients
        }

        if (error && (!patients || patients.length === 0)) {
            console.error('[dashboard/get API Error]', error)
            return Response.json({ success: false, message: error.message }, { status: 500 })
        }

        return Response.json({ success: true, patients: patients || [] }, { status: 200 })
    } catch (error) {
        console.error('[dashboard/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
