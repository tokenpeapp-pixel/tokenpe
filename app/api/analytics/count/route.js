import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const businessId = searchParams.get('businessId')
        const businessIds = searchParams.get('businessIds')
        const date = searchParams.get('date')

        if ((!businessId && !businessIds) || !date) {
            return Response.json({ success: false, message: 'Missing businessId(s) or date' }, { status: 400 })
        }

        let query = supabaseAdmin
            .from('queue_entries')
            .select('*', { count: 'exact', head: true })
            .eq('date', date)

        if (businessIds) {
            const ids = businessIds.split(',')
            query = query.in('clinic_id', ids)
        } else {
            query = query.eq('business_id', businessId)
        }

        const { count, error } = await query

        if (error) {
            return Response.json({ success: false, message: 'Failed to count patients' }, { status: 500 })
        }

        return Response.json({ success: true, count: count || 0 }, { status: 200 })
    } catch (error) {
        console.error('[analytics/count API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
