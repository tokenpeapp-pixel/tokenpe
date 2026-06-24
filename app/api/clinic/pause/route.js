import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { clinicId, queuePaused } = await req.json()

        if (clinicId !== session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }
        
        const adminSupabase = supabaseAdmin

        const { data, error } = await adminSupabase
            .from('clinics')
            .update({ queue_paused: queuePaused })
            .eq('id', clinicId)
            .select()

        if (error) {
            console.error('[Pause API] Error:', error)
            throw error
        }
        
        return Response.json({ success: true, data })
    } catch (err) {
        console.error('[Pause API] Exception:', err)
        return Response.json({ error: err.message }, { status: 500 })
    }
}
