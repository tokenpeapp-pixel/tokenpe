import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const requestedBusinessId = searchParams.get('businessId') // frontend still sends businessId

        let businessId = session.businessId

        if (requestedBusinessId && requestedBusinessId !== session.businessId) {
            const { data: sessionBusiness } = await supabaseAdmin.from('businesses').select('email').eq('id', session.businessId).single()
            const { data: targetBusiness } = await supabaseAdmin.from('businesses').select('email').eq('id', requestedBusinessId).single()
            if (!sessionBusiness || !targetBusiness || sessionBusiness.email !== targetBusiness.email) {
                return Response.json({ success: false, message: 'Unauthorized branch access' }, { status: 403 })
            }
            businessId = requestedBusinessId
        }

        let query = supabaseAdmin
            .from('queue_entries')
            .select('*')
            .eq('business_id', businessId)
            
        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate)
        } else if (startDate) {
            query = query.eq('date', startDate)
        }
        
        const { data: entries, error } = await query.limit(100000)

        if (error) throw error

        return Response.json({ success: true, data: entries || [] }, { status: 200 })
    } catch (error) {
        console.error('[generic-analytics/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
