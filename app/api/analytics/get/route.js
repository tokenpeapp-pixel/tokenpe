import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const requestedClinicId = searchParams.get('businessId') || searchParams.get('clinicId')

        let businessId = session.businessId

        if (requestedClinicId && requestedClinicId !== session.businessId) {
            // Verify ownership: both clinics must share the same email
            const { data: sessionClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', session.businessId).single()
            const { data: targetClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', requestedClinicId).single()
            if (sessionClinic && targetClinic && sessionClinic.email === targetClinic.email) {
                businessId = requestedClinicId
            }
        }

        let query = supabaseAdmin
            .from('patients')
            .select('*')
            .or(`clinic_id.eq.${businessId},clinic_id.is.null`)
            
        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate)
        } else if (startDate) {
            query = query.gte('date', startDate)
        }
        
        const { data: patients, error } = await query.order('joined_at', { ascending: false }).limit(100000)

        if (error) {
            throw error
        }

        return Response.json({ success: true, data: patients || [] }, { status: 200 })
    } catch (error) {
        console.error('[analytics/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
