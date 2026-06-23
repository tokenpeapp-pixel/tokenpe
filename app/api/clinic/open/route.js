import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { clinicId } = body

        if (!clinicId) {
            return Response.json({ success: false, message: 'Missing clinicId' }, { status: 400 })
        }

        // Security: session must own the clinic
        if (clinicId !== session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        // Clear the closed date — clinic is open again
        const { data, error } = await supabaseAdmin
            .from('clinics')
            .update({ closed_today_date: null })
            .eq('id', clinicId)
            .select('id, name')
            .single()

        if (error) {
            console.error('[Open API] Error:', error)
            return Response.json({ success: false, message: 'Failed to re-open clinic' }, { status: 500 })
        }

        console.log(`[Open API] ✅ Clinic "${data.name}" re-opened`)

        return Response.json({ success: true }, { status: 200 })

    } catch (err) {
        console.error('[Open API] Exception:', err)
        return Response.json({ success: false, message: err.message }, { status: 500 })
    }
}
