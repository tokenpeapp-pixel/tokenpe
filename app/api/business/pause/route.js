import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}))
        const session = await getUnifiedSession().catch(() => null)
        const businessId = body.clinicId || body.schoolId || body.businessId || session?.businessId

        if (!businessId) {
            return Response.json({ success: false, message: 'Unauthorized or missing ID' }, { status: 401 })
        }

        let newPausedStatus = body.paused
        if (typeof newPausedStatus !== 'boolean') {
            const { data: currentBusiness } = await supabaseAdmin.from('businesses').select('queue_paused').eq('id', businessId).single()
            newPausedStatus = !currentBusiness?.queue_paused
        }

        // Sync queue_paused across all tables
        await Promise.all([
            supabaseAdmin.from('businesses').update({ queue_paused: newPausedStatus }).eq('id', businessId).catch(() => {}),
            supabaseAdmin.from('schools').update({ queue_paused: newPausedStatus }).eq('id', businessId).catch(() => {}),
            supabaseAdmin.from('public_schools').update({ queue_paused: newPausedStatus }).eq('id', businessId).catch(() => {}),
            supabaseAdmin.from('clinics').update({ queue_paused: newPausedStatus }).eq('id', businessId).catch(() => {})
        ])

        return Response.json({ success: true, paused: newPausedStatus }, { status: 200 })
    } catch (error) {
        console.error('[business/pause API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
