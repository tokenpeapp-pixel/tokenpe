import { supabase, supabaseAdmin, getISTDateString } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'
import { sanitizeName, validatePhone } from '../../../../lib/validate'
import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { businessId, name, token, language, phone } = body

        if (!businessId || !token) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        if (businessId !== session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        const cleanName = sanitizeName(name)
        const cleanPhone = validatePhone(phone) || '0000000000'

        const today = getISTDateString()
        
        // Fetch clinic plan limits AND closed status
        const { data: clinic } = await supabaseAdmin.from('clinics').select('name, plan_id, closed_today_date').eq('id', businessId).single()
        const planId = clinic?.plan_id || 'starter'
        const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity

        // ── Block walk-ins if the clinic is closed for today ──────────────
        if (clinic?.closed_today_date) {
            return Response.json({
                success: false,
                message: 'Clinic is closed for today. No new patients can be added.'
            }, { status: 403 })
        }

        // Count total patients today
        const { count } = await supabaseAdmin
            .from('queue_entries')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('date', today)

        const currentTotal = count || 0
        if (currentTotal >= limit) {
            return Response.json({
                success: false,
                message: `Queue Full: The clinic has reached its daily limit of ${limit} patients.`
            }, { status: 403 })
        }

        // Rate limit joins (3 per phone per day, unique names)
        if (cleanPhone !== '0000000000') {
            const { data: existingJoins } = await supabase
                .from('queue_entries')
                .select('name')
                .eq('business_id', businessId)
                .eq('phone', cleanPhone)
                .eq('date', today)

            if (existingJoins && existingJoins.length >= 3) {
                return Response.json({
                    success: false,
                    message: 'Daily join limit reached for this phone number.'
                }, { status: 429 })
            }

            if (cleanName && existingJoins?.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
                return Response.json({
                    success: false,
                    message: 'A patient with this name has already joined.'
                }, { status: 409 })
            }
        }

        const newPatient = {
            business_id: businessId,
            name: cleanName || `Patient ${token}`,
            phone: cleanPhone,
            token: token,
            status: 'waiting',
            date: today,
            language: language || 'hi',
            joined_at: new Date().toISOString()
        }

        const { data, error } = await supabaseAdmin.from('queue_entries').insert([newPatient]).select()

        if (error) {
            console.error('[queue/add] Error inserting:', error)
            return Response.json({ success: false, message: 'Failed to add walk-in patient' }, { status: 500 })
        }

        const patient = data[0]

        // Send WhatsApp confirmation text + voice note in background (non-blocking)
        if (cleanPhone !== '0000000000') {
            after(async () => {
                try {
                    // Fetch clinic info for messaging
                    const { data: clinic } = await supabaseAdmin.from('clinics').select('name, plan_id, subscription_status').eq('id', businessId).single()
                    const planId = clinic?.plan_id || 'starter'
                    const clinicName = clinic?.name || 'the clinic'

                    // Count people ahead
                    const { count: aheadCount } = await supabaseAdmin
                        .from('queue_entries')
                        .select('*', { count: 'exact', head: true })
                        .eq('business_id', businessId)
                        .eq('status', 'waiting')
                        .eq('date', today)
                        .lt('token', token)

                    const peopleAhead = aheadCount || 0

                    const confirmMsg = `✅ *Walk-in Confirmed, ${patient.name}!*

🎟 Your Token: *${token}*
🏥 ${clinicName}
👥 People ahead: *${peopleAhead}*
⏳ Est. wait: ~${peopleAhead * 7} mins

We'll notify you when your turn is near!

_Powered by TokenPe_`

                    const alerts = [sendText(cleanPhone, confirmMsg)]

                    if (planId !== 'starter') {
                        alerts.push(sendVoice({
                            phone: cleanPhone,
                            language: language || 'hi',
                            event: 'joined',
                            token,
                            position: peopleAhead,
                            clinicName
                        }))
                    }

                    await Promise.all(alerts)
                } catch (err) {
                    console.error('[queue/add] Messaging error:', err.message)
                }
            })
        }

        return Response.json({ success: true, patient }, { status: 200 })

    } catch (error) {
        console.error('[queue/add] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
