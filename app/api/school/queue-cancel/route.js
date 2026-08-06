import { getUnifiedSession } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'

/**
 * POST /api/school/queue-cancel
 *
 * Cancels a school_queue entry.
 * Authenticates via the server-side session cookie.
 * Verifies the session belongs to the 'school' vertical.
 * businessId is derived from the session — NEVER from the request body.
 *
 * Body: { entryId: string }
 */
export async function POST(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // Verify this session is for a school account
        const { data: business, error: bizError } = await supabaseAdmin
            .from('businesses')
            .select('id, vertical')
            .eq('id', session.businessId)
            .single()

        if (bizError || !business || business.vertical !== 'school') {
            return Response.json({ success: false, message: 'Unauthorized: not a school account' }, { status: 403 })
        }

        const body = await req.json()
        const { entryId } = body

        if (!entryId || typeof entryId !== 'string') {
            return Response.json({ success: false, message: 'entryId is required' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('school_queue')
            .update({ status: 'cancelled' })
            .eq('id', entryId)

        if (error) {
            console.error('[school/queue-cancel] Error:', error)
            return Response.json({ success: false, message: 'Failed to cancel entry' }, { status: 500 })
        }

        return Response.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('[school/queue-cancel] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
