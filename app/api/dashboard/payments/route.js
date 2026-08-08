import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        let session = null
        try {
            session = await getSession()
        } catch (_) {}

        const { searchParams } = new URL(req.url)
        const searchQuery = searchParams.get('search') || ''
        const businessId = session?.businessId || searchParams.get('clinicId') || searchParams.get('businessId')

        if (!businessId) {
            return Response.json({ success: true, patients: [] }, { status: 200 })
        }

        // Fetch patients specifically belonging to THIS clinic ONLY
        let { data: patientsList, error } = await supabaseAdmin
            .from('patients')
            .select('*')
            .eq('clinic_id', businessId)
            .order('joined_at', { ascending: false })

        if (error || !patientsList) {
            patientsList = []
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            patientsList = patientsList.filter(p => 
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.phone && p.phone.includes(q)) ||
                (p.token && String(p.token).toLowerCase().includes(q))
            )
        }

        return Response.json({ success: true, patients: patientsList }, { status: 200 })
    } catch (error) {
        console.error('[dashboard/payments API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
