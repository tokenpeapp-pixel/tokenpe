import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}))
        const session = await getUnifiedSession().catch(() => null)
        const businessId = body.clinicId || body.schoolId || body.businessId || session?.businessId

        if (!session?.businessId || !businessId) {
            return Response.json({ success: false, message: 'Unauthorized or missing ID' }, { status: 401 })
        }

        if (businessId !== session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized business access' }, { status: 403 })
        }

        let newPausedStatus = body.paused
        const { data: currentBusiness, error: fetchError } = await supabaseAdmin
            .from('businesses')
            .select('queue_paused, type')
            .eq('id', businessId)
            .single()

        if (fetchError || !currentBusiness) {
            return Response.json({ success: false, message: 'Business not found' }, { status: 404 })
        }

        if (typeof newPausedStatus !== 'boolean') {
            newPausedStatus = !currentBusiness?.queue_paused
        }

        if (currentBusiness.type === 'school') {
            const { error } = await supabaseAdmin
                .from('businesses')
                .update({ queue_paused: newPausedStatus })
                .eq('id', businessId)
            if (error) throw error
        } else {
            // Preserve existing non-school behavior.
            await Promise.all([
                supabaseAdmin.from('businesses').update({ queue_paused: newPausedStatus }).eq('id', businessId).catch(() => {}),
                supabaseAdmin.from('schools').update({ queue_paused: newPausedStatus }).eq('id', businessId).catch(() => {}),
                supabaseAdmin.from('public_schools').update({ queue_paused: newPausedStatus }).eq('id', businessId).catch(() => {}),
                supabaseAdmin.from('clinics').update({ queue_paused: newPausedStatus }).eq('id', businessId).catch(() => {})
            ])
        }

        return Response.json({ success: true, paused: newPausedStatus }, { status: 200 })
    } catch (error) {
        console.error('[business/pause API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
