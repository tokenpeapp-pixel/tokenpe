import { supabase } from '../../../../lib/supabase'
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
        
        // We will update the clinic. Note: If RLS is enabled, the regular client 
        // won't be able to update unless the anon user is allowed, which is usually not.
        // We should use the service role key to bypass RLS.
        const { createClient } = await import('@supabase/supabase-js')
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjqynkjwpmhyxhrqamjh.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )

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
