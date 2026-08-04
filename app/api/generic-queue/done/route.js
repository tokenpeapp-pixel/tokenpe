import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { patientId } = await req.json()
        const businessId = session.businessId

        const { data: entry } = await supabaseAdmin.from('queue_entries').select('*').eq('id', patientId).eq('business_id', businessId).single()
        if (!entry) return Response.json({ success: false, message: 'Not found' }, { status: 404 })

        const { data: updatedEntry, error } = await supabaseAdmin
            .from('queue_entries')
            .update({ status: 'completed', done_at: new Date().toISOString() })
            .eq('id', patientId)
            .select()
            
        if (error) throw error

        return Response.json({ success: true, patient: updatedEntry[0] }, { status: 200 })
    } catch (error) {
        console.error('[generic-queue/done] Error:', error)
        return Response.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
