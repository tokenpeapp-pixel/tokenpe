import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

function exposeBusiness(business) {
    if (!business) return null
    const settings = business.settings || {}
    return {
        ...business,
        active_notice: settings.active_notice || '',
        location_label: settings.location || '',
    }
}

export async function GET(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }
        
        const { searchParams } = new URL(req.url)
        const date = searchParams.get('date')
        const start = searchParams.get('start')
        const end = searchParams.get('end')
        const includeHistory = searchParams.get('history') === 'true'
        
        const businessId = session.businessId

        const { data: business, error: businessError } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .single()

        if (businessError) throw businessError

        let query = supabaseAdmin
            .from('queue_entries')
            .select('*')
            .eq('business_id', businessId)

        if (start && end) {
            query = query.gte('date', start).lte('date', end)
        } else if (date) {
            query = query.eq('date', date)
        }

        const { data: entries, error } = await query
            .order('joined_at', { ascending: true })

        if (error) throw error

        const allEntries = entries || []
        const queue = allEntries.filter(p => p.status === 'waiting')
        const history = allEntries.filter(p => ['completed', 'skipped'].includes(p.status))

        return Response.json({
            success: true,
            clinic: exposeBusiness(business),
            patients: includeHistory ? allEntries : queue,
            queue,
            history,
        }, { status: 200 })
    } catch (error) {
        console.error('[generic-dashboard/get] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
