import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'
import { sanitizeName, validatePhone } from '../../../../lib/validate'
import { sendText, sendVoice } from '../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { businessId, name, token, language, phone } = body

        if (!businessId || !token) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        if (businessId !== session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized business access' }, { status: 403 })
        }

        const cleanName = sanitizeName(name)
        const cleanPhone = validatePhone(phone) || '0000000000'
        const today = getISTDateString()
        
        const { data: business } = await supabaseAdmin.from('businesses').select('name, type, plan_id, closed_today_date').eq('id', businessId).single()
        const planId = business?.plan_id || 'starter'
        const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity

        if (business?.closed_today_date) {
            return Response.json({ success: false, message: 'Business is closed for today. No new entries can be added.' }, { status: 403 })
        }

        const { count } = await supabaseAdmin
            .from('queue_entries')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('date', today)

        if ((count || 0) >= limit) {
            return Response.json({ success: false, message: `Queue Full: Reached daily limit of ${limit}.` }, { status: 403 })
        }

        if (cleanPhone !== '0000000000') {
            const { data: existingJoins } = await supabaseAdmin
                .from('queue_entries')
                .select('name')
                .eq('business_id', businessId)
                .eq('phone', cleanPhone)
                .eq('date', today)

            if (existingJoins && existingJoins.length >= 3) {
                return Response.json({ success: false, message: 'Daily limit reached for this phone number.' }, { status: 429 })
            }

            if (cleanName && existingJoins?.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
                return Response.json({ success: false, message: 'An entry with this name has already joined.' }, { status: 409 })
            }
        }

        const newEntry = {
            business_id: businessId,
            business_type: business.type,
            name: cleanName || `Entry ${token}`,
            phone: cleanPhone,
            token: token,
            status: 'waiting',
            date: today,
            language: language || 'hi',
            joined_at: new Date().toISOString()
        }

        const { data, error } = await supabaseAdmin.from('queue_entries').insert([newEntry]).select()

        if (error) {
            console.error('[generic-queue/add] Error inserting:', error)
            return Response.json({ success: false, message: 'Failed to add to queue' }, { status: 500 })
        }

        const entry = data[0]

        // Add to crm_customers
        if (cleanPhone !== '0000000000') {
             after(async () => {
                const { data: existingCustomer } = await supabaseAdmin
                    .from('crm_customers')
                    .select('id')
                    .eq('business_id', businessId)
                    .eq('phone', cleanPhone)
                    .single()
                
                if (!existingCustomer) {
                    await supabaseAdmin.from('crm_customers').insert({
                        business_id: businessId,
                        business_type: business.type,
                        name: entry.name,
                        phone: cleanPhone,
                        first_visit: today,
                        last_visit: today,
                        total_visits: 1
                    })
                } else {
                    // Update total visits? We need an RPC or we just update via RPC for safe concurrency.
                    // Let's just update last_visit for now.
                    const { data: currentCustomer } = await supabaseAdmin.from('crm_customers').select('total_visits').eq('id', existingCustomer.id).single()
                    await supabaseAdmin.from('crm_customers').update({ 
                        last_visit: today,
                        total_visits: (currentCustomer?.total_visits || 1) + 1
                    }).eq('id', existingCustomer.id)
                }
             })
        }

        if (cleanPhone !== '0000000000') {
            after(async () => {
                try {
                    const bName = business?.name || 'the business'
                    const { count: aheadCount } = await supabaseAdmin
                        .from('queue_entries')
                        .select('*', { count: 'exact', head: true })
                        .eq('business_id', businessId)
                        .eq('status', 'waiting')
                        .eq('date', today)
                        .lt('token', token)

                    const peopleAhead = aheadCount || 0
                    const confirmMsg = `✅ *Confirmed, ${entry.name}!*

🎟 Your Token: *${token}*
🏢 ${bName}
👥 Ahead of you: *${peopleAhead}*
⏳ Est. wait: ~${peopleAhead * 7} mins

We'll notify you when your turn is near!

_Powered by TokenPe_`

                    const alerts = [sendText(cleanPhone, confirmMsg)]
                    if (planId !== 'starter') {
                        alerts.push(sendVoice({ phone: cleanPhone, language: language || 'hi', event: 'joined', token, position: peopleAhead, clinicName: bName }))
                    }
                    await Promise.all(alerts)
                } catch (err) {
                    console.error('[generic-queue/add] Messaging error:', err.message)
                }
            })
        }

        return Response.json({ success: true, patient: entry }, { status: 200 }) // Keep key as patient for frontend compatibility
    } catch (error) {
        console.error('[generic-queue/add] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
