import { getUnifiedSession } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ authenticated: false }, { status: 401 })
        }

        // Fetch fresh clinic data
        const { data: clinic, error } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('id', session.businessId)
            .single()

        if (error || !clinic) {
            return Response.json({ authenticated: false }, { status: 401 })
        }

        // ── Vertical guard ──────────────────────────────────────────────────────
        // If the caller specifies ?vertical=school (or any vertical), reject the
        // session if it belongs to a different vertical. This prevents a clinic
        // session from being silently accepted by the school dashboard.
        // Callers that omit ?vertical= (e.g. the clinic dashboard) are unaffected.
        const { searchParams } = new URL(req.url)
        const requestedVertical = searchParams.get('vertical')
        if (requestedVertical && clinic.type !== requestedVertical) {
            return Response.json(
                { authenticated: false, reason: 'vertical_mismatch' },
                { status: 401 }
            )
        }
        // ───────────────────────────────────────────────────────────────────────

        // Do not leak the pin back to the frontend
        delete clinic.pin
        clinic.active_notice = clinic.settings?.active_notice || ''
        clinic.location_label = clinic.settings?.location || ''

        return Response.json({ authenticated: true, clinic }, { status: 200 })

    } catch (error) {
        return Response.json({ authenticated: false }, { status: 500 })
    }
}
