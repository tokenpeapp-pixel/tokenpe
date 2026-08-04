import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const businessId = session.businessId

        const { data: currentBusiness } = await supabaseAdmin.from('businesses').select('queue_paused').eq('id', businessId).single()
        if (!currentBusiness) return Response.json({ success: false, message: 'Business not found' }, { status: 404 })

        const newPausedStatus = !currentBusiness.queue_paused

        const { data, error } = await supabaseAdmin
            .from('businesses')
            .update({ queue_paused: newPausedStatus })
            .eq('id', businessId)
            .select()

        if (error) throw error

        return Response.json({ success: true, business: data[0] }, { status: 200 })
    } catch (error) {
        console.error('[business/pause API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
