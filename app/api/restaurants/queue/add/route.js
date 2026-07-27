import { supabaseAdmin, getISTDateString } from '../../../../../lib/supabase'
import { getSession } from '../../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.restaurantId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, phone, party_size, notes } = body
        const restaurantId = session.restaurantId

        if (!name) {
            return Response.json({ success: false, message: 'Name is required' }, { status: 400 })
        }

        const today = getISTDateString()
        
        // 1. Find or create customer
        let customerId = null
        if (phone && phone.trim() !== '') {
            const { data: existingCustomer } = await supabaseAdmin
                .from('restaurant_customers')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('phone', phone.trim())
                .single()
            
            if (existingCustomer) {
                customerId = existingCustomer.id
                // Update last visit timestamp
                await supabaseAdmin.from('restaurant_customers').update({ last_visit: new Date().toISOString() }).eq('id', customerId)
            } else {
                const { data: newCustomer } = await supabaseAdmin
                    .from('restaurant_customers')
                    .insert({ restaurant_id: restaurantId, name, phone: phone.trim(), last_visit: new Date().toISOString() })
                    .select('id')
                    .single()
                if (newCustomer) customerId = newCustomer.id
            }
        }

        // 2. Generate Token Number for the day
        const { count } = await supabaseAdmin
            .from('restaurant_queue')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId)
            .gte('joined_at', `${today}T00:00:00.000Z`)
            .lte('joined_at', `${today}T23:59:59.999Z`)

        const tokenNum = `R-${String((count || 0) + 1).padStart(2, '0')}`

        // 3. Insert into restaurant_queue
        const newQueueItem = {
            restaurant_id: restaurantId,
            customer_id: customerId,
            token_num: tokenNum,
            client_name: name,
            phone: phone || '',
            party_size: party_size || 1,
            notes: notes || '',
            status: 'waiting',
            joined_at: new Date().toISOString()
        }

        const { data: queueData, error: qError } = await supabaseAdmin
            .from('restaurant_queue')
            .insert([newQueueItem])
            .select()
            .single()

        if (qError) throw qError

        return Response.json({ success: true, item: queueData }, { status: 200 })

    } catch (error) {
        console.error('[restaurants/queue/add] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
