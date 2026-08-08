import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        let session = null
        try {
            session = await getSession()
        } catch (_) {}

        const body = await req.json()
        const { patientId, businessId: reqBizId } = body
        const businessId = session?.businessId || reqBizId

        if (!patientId) {
            return Response.json({ success: false, message: 'Patient ID is required' }, { status: 400 })
        }

        await Promise.allSettled([
            supabaseAdmin.from('patients').update({ status: 'skipped' }).eq('id', patientId),
            supabaseAdmin.from('queue_entries').update({ status: 'skipped' }).eq('id', patientId)
        ])

        if (error) {
            return Response.json({ success: false, message: 'Failed to skip patient' }, { status: 500 })
        }

        return Response.json({ success: true }, { status: 200 })

    } catch (error) {
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
