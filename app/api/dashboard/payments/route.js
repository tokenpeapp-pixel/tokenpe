import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const searchQuery = searchParams.get('search') || ''
        const clinicId = session.clinicId

        if (searchQuery) {
            // Global search for patients (for payments view)
            const { data: patients, error } = await supabaseAdmin
                .from('patients')
                .select('*')
                .eq('clinic_id', clinicId)
                .or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,token.ilike.%${searchQuery}%`)
                .order('joined_at', { ascending: false })
                .limit(100)

            if (error) throw error
            return Response.json({ success: true, patients: patients || [] }, { status: 200 })
        } else {
            // Default view: fetch all pending + recent completed
            const { data: pendingPatients, error: pendingErr } = await supabaseAdmin
                .from('patients')
                .select('*')
                .eq('clinic_id', clinicId)
                .neq('payment_status', 'completed')
                .order('joined_at', { ascending: false })

            if (pendingErr) throw pendingErr

            const { data: completedPatients, error: completedErr } = await supabaseAdmin
                .from('patients')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('payment_status', 'completed')
                .order('joined_at', { ascending: false })
                .limit(100)

            if (completedErr) throw completedErr

            const combined = [...(pendingPatients || []), ...(completedPatients || [])]
            
            // Deduplicate in case a record somehow matches both or just to be safe
            const uniquePatients = Array.from(new Map(combined.map(item => [item.id, item])).values())

            return Response.json({ success: true, patients: uniquePatients }, { status: 200 })
        }
    } catch (error) {
        console.error('[dashboard/payments API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
