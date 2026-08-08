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

        if (searchQuery) {
            const { data: patients } = await supabaseAdmin
                .from('patients')
                .select('*')
                .eq('clinic_id', businessId)
                .or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,token.ilike.%${searchQuery}%`)
                .order('joined_at', { ascending: false })
                .limit(100)

            return Response.json({ success: true, patients: patients || [] }, { status: 200 })
        } else {
            const { data: patients } = await supabaseAdmin
                .from('patients')
                .select('*')
                .eq('clinic_id', businessId)
                .order('joined_at', { ascending: false })
                .limit(200)

            return Response.json({ success: true, patients: patients || [] }, { status: 200 })
        }
    } catch (error) {
        console.error('[dashboard/payments API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
