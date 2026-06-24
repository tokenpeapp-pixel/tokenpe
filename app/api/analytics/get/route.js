import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const requestedClinicId = searchParams.get('clinicId')

        let clinicId = session.clinicId

        if (requestedClinicId && requestedClinicId !== session.clinicId) {
            // Verify ownership: both clinics must share the same email
            const { data: sessionClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', session.clinicId).single()
            const { data: targetClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', requestedClinicId).single()
            if (!sessionClinic || !targetClinic || sessionClinic.email !== targetClinic.email) {
                return Response.json({ success: false, message: 'Unauthorized branch access' }, { status: 403 })
            }
            clinicId = requestedClinicId
        }

        let query = supabaseAdmin
            .from('patients')
            .select('*')
            .eq('clinic_id', clinicId)
            
        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate)
        } else if (startDate) {
            query = query.eq('date', startDate)
        }
        
        const { data: patients, error } = await query.limit(100000)

        if (error) {
            throw error
        }

        return Response.json({ success: true, data: patients || [] }, { status: 200 })
    } catch (error) {
        console.error('[analytics/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
