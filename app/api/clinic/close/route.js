import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        // ── Auth: valid session required ───────────────────────────────────
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { clinicId } = body

        if (!clinicId) {
            return Response.json({ success: false, message: 'Missing clinicId' }, { status: 400 })
        }

        // ── Security: session must own the clinic being closed ─────────────
        if (clinicId !== session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        // ── All plans allowed — no plan restriction ────────────────────────
        const today = getISTDateString()

        const { data, error } = await supabaseAdmin
            .from('clinics')
            .update({ closed_today_date: today })
            .eq('id', clinicId)
            .select('id, name, closed_today_date')
            .single()

        if (error) {
            console.error('[Close API] Error updating clinic:', error)
            return Response.json({ success: false, message: 'Failed to close clinic' }, { status: 500 })
        }

        console.log(`[Close API] ✅ Clinic "${data.name}" closed for today (${today})`)

        return Response.json({ success: true, closedDate: today }, { status: 200 })

    } catch (err) {
        console.error('[Close API] Exception:', err)
        return Response.json({ success: false, message: err.message }, { status: 500 })
    }
}
