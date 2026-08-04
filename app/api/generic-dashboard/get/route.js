import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }
        
        const { searchParams } = new URL(req.url)
        const date = searchParams.get('date')
        if (!date) {
            return Response.json({ success: false, message: 'Date is required' }, { status: 400 })
        }
        
        const businessId = session.businessId

        const { data: entries, error } = await supabaseAdmin
            .from('queue_entries')
            .select('*')
            .eq('business_id', businessId)
            .eq('date', date)
            .order('joined_at', { ascending: true })

        if (error) throw error
        return Response.json({ success: true, patients: entries || [] }, { status: 200 }) // 'patients' key kept for frontend compatibility
    } catch (error) {
        console.error('[generic-dashboard/get] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
