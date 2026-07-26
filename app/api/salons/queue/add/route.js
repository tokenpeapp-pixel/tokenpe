import { supabaseAdmin, getISTDateString } from '../../../../../lib/supabase'
import { getSession } from '../../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, phone, service, stylist, price } = body
        const salonId = session.clinicId

        if (!name || !service) {
            return Response.json({ success: false, message: 'Name and service are required' }, { status: 400 })
        }

        const today = getISTDateString()
        
        // 1. Find or create customer
        let customerId = null
        if (phone && phone.trim() !== '') {
            const { data: existingCustomer } = await supabaseAdmin
                .from('salon_customers')
                .select('id')
                .eq('salon_id', salonId)
                .eq('phone', phone.trim())
                .single()
            
            if (existingCustomer) {
                customerId = existingCustomer.id
                // Update last visit timestamp
                await supabaseAdmin.from('salon_customers').update({ last_visit: new Date().toISOString() }).eq('id', customerId)
            } else {
                const { data: newCustomer } = await supabaseAdmin
                    .from('salon_customers')
                    .insert({ salon_id: salonId, name, phone: phone.trim(), last_visit: new Date().toISOString() })
                    .select('id')
                    .single()
                if (newCustomer) customerId = newCustomer.id
            }
        }

        // 2. Generate Token Number for the day
        const { count } = await supabaseAdmin
            .from('salon_queue')
            .select('*', { count: 'exact', head: true })
            .eq('salon_id', salonId)
            .gte('joined_at', `${today}T00:00:00.000Z`)
            .lte('joined_at', `${today}T23:59:59.999Z`)

        const tokenNum = `S-${String((count || 0) + 1).padStart(2, '0')}`

        // 3. Insert into salon_queue
        const newQueueItem = {
            salon_id: salonId,
            customer_id: customerId,
            token_num: tokenNum,
            client_name: name,
            phone: phone || '',
            service,
            stylist,
            price: price || 0,
            status: 'waiting',
            joined_at: new Date().toISOString()
        }

        const { data: queueData, error: qError } = await supabaseAdmin
            .from('salon_queue')
            .insert([newQueueItem])
            .select()
            .single()

        if (qError) throw qError

        // Note: Interakt WhatsApp notifications are temporarily on hold for salons per user request.

        return Response.json({ success: true, item: queueData }, { status: 200 })

    } catch (error) {
        console.error('[salons/queue/add] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
