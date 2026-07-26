import { supabaseAdmin } from '../../../../../lib/supabase'
import { getSession } from '../../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { queueId, status, rating, notes } = body
        const salonId = session.clinicId

        if (!queueId || !status) {
            return Response.json({ success: false, message: 'Queue ID and status are required' }, { status: 400 })
        }

        // Fetch current queue item
        const { data: queueItem, error: fetchError } = await supabaseAdmin
            .from('salon_queue')
            .select('*')
            .eq('id', queueId)
            .eq('salon_id', salonId)
            .single()

        if (fetchError || !queueItem) {
            return Response.json({ success: false, message: 'Queue item not found' }, { status: 404 })
        }

        const updateData = { status }
        if (status === 'completed' || status === 'skipped') {
            updateData.completed_at = new Date().toISOString()
        }

        // 1. Update queue status
        const { data: updatedQueue, error: updateError } = await supabaseAdmin
            .from('salon_queue')
            .update(updateData)
            .eq('id', queueId)
            .select()
            .single()

        if (updateError) throw updateError

        // 2. If completed, handle History and CRM updates
        if (status === 'completed' && queueItem.status !== 'completed') {
            // Insert into history
            await supabaseAdmin.from('salon_history').insert([{
                salon_id: salonId,
                customer_id: queueItem.customer_id,
                queue_id: queueId,
                service: queueItem.service,
                stylist: queueItem.stylist,
                price: queueItem.price,
                rating: rating || null,
                notes: notes || null
            }])

            // Update customer totals
            if (queueItem.customer_id) {
                // We use RPC for atomic increments ideally, but for now we'll fetch and update
                const { data: customer } = await supabaseAdmin
                    .from('salon_customers')
                    .select('visits, total_spent')
                    .eq('id', queueItem.customer_id)
                    .single()
                
                if (customer) {
                    await supabaseAdmin.from('salon_customers').update({
                        visits: (customer.visits || 0) + 1,
                        total_spent: (customer.total_spent || 0) + (queueItem.price || 0)
                    }).eq('id', queueItem.customer_id)
                }
            }
        }

        return Response.json({ success: true, item: updatedQueue }, { status: 200 })

    } catch (error) {
        console.error('[salons/queue/update] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
