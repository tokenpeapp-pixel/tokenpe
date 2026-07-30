import { getSchoolSession } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const session = await getSchoolSession()

        // Only handle school sessions
        if (!session || !session.clinicId || session.vertical !== 'school') {
            return Response.json({ authenticated: false }, { status: 401 })
        }

        const { data: school, error } = await supabaseAdmin
            .from('schools')
            .select('*')
            .eq('id', session.clinicId)
            .single()

        if (error || !school) {
            return Response.json({ authenticated: false }, { status: 401 })
        }

        // Never leak the PIN
        delete school.pin

        return Response.json({ authenticated: true, clinic: school }, { status: 200 })

    } catch (error) {
        return Response.json({ authenticated: false }, { status: 500 })
    }
}
