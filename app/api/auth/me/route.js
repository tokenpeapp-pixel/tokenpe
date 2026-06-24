import { getSession } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ authenticated: false }, { status: 401 })
        }

        // Fetch fresh clinic data
        const { data: clinic, error } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('id', session.clinicId)
            .single()

        if (error || !clinic) {
            return Response.json({ authenticated: false }, { status: 401 })
        }

        // Do not leak the pin back to the frontend
        delete clinic.pin

        return Response.json({ authenticated: true, clinic }, { status: 200 })

    } catch (error) {
        return Response.json({ authenticated: false }, { status: 500 })
    }
}
