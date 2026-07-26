import { supabaseAdmin } from '../../../../../lib/supabase'
import { getSession } from '../../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const date = searchParams.get('date')
        
        if (!date) {
            return Response.json({ success: false, message: 'Date is required' }, { status: 400 })
        }

        const salonId = session.clinicId

        // Fetch today's queue (active and waiting)
        const { data: queue, error: qError } = await supabaseAdmin
            .from('salon_queue')
            .select('*')
            .eq('salon_id', salonId)
            .gte('joined_at', `${date}T00:00:00.000Z`)
            .lte('joined_at', `${date}T23:59:59.999Z`)
            .order('joined_at', { ascending: true })

        if (qError) throw qError

        // Fetch CRM data (customers)
        const { data: clients, error: cError } = await supabaseAdmin
            .from('salon_customers')
            .select('*')
            .eq('salon_id', salonId)
            .order('last_visit', { ascending: false })

        if (cError) throw cError

        // Fetch history for today (completed/skipped)
        const { data: history, error: hError } = await supabaseAdmin
            .from('salon_history')
            .select('*, salon_customers(name, phone)')
            .eq('salon_id', salonId)
            .gte('created_at', `${date}T00:00:00.000Z`)
            .lte('created_at', `${date}T23:59:59.999Z`)
            .order('created_at', { ascending: false })

        if (hError) throw hError

        return Response.json({ 
            success: true, 
            queue: queue || [],
            clients: clients || [],
            history: history || []
        }, { status: 200 })
    } catch (error) {
        console.error('[salons/queue/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
