import { supabase } from '../../../../lib/supabase'

export async function POST(req) {
    try {
        const { clinicId, queuePaused } = await req.json()
        
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
