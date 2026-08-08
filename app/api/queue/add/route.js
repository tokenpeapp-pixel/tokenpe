import { supabase, supabaseAdmin, getISTDateString } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'
import { sanitizeName, validatePhone } from '../../../../lib/validate'
import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'
import { after } from 'next/server'

function getIndustryVocab(vertical, purpose) {
    switch (vertical) {
        case 'clinic':
            return {
                title: 'Walk-in Confirmed',
                person: 'Patient',
                icon: '🏥'
            }
        case 'school':
            return {
                title: 'Token Confirmed',
                person: purpose ? 'Student/Parent' : 'Visitor',
                icon: '🏢'
            }
        case 'salon':
            return {
                title: 'Appointment Confirmed',
                person: 'Customer',
                icon: '✂️'
            }
        case 'restaurant':
            return {
                title: 'Waitlist Confirmed',
                person: 'Guest',
                icon: '🍽️'
            }
        default:
            return {
                title: 'Token Confirmed',
                person: 'Visitor',
                icon: '🏢'
            }
    }
}

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { businessId, name, token, language, phone, purpose } = body

        if (!businessId || !token) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        if (businessId !== session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
        }

        const cleanName = sanitizeName(name)
        const cleanPhone = validatePhone(phone) || '0000000000'
        const today = getISTDateString()

        const { data: business } = await supabaseAdmin
            .from('businesses')
            .select('name, plan_id, closed_today_date, type, queue_paused')
            .eq('id', businessId)
            .single()
            
        const planId = business?.plan_id || 'starter'
        const vertical = business?.type || 'clinic'
        const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity

        if (business?.queue_paused) {
            return Response.json({
                success: false,
                message: 'Queue is currently paused by the administrator. No new entries can be added right now.'
            }, { status: 403 })
        }

        if (vertical === 'clinic' && business?.closed_today_date) {
            return Response.json({
                success: false,
                message: 'Clinic is closed for today. No new patients can be added.'
            }, { status: 403 })
        }

        const { count } = await supabaseAdmin
            .from('queue_entries')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('date', today)

        const currentTotal = count || 0
        if (currentTotal >= limit) {
            return Response.json({
                success: false,
                message: `Queue Full: Daily limit of ${limit} entries reached.`
            }, { status: 403 })
        }

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

        const vocab = getIndustryVocab(vertical, purpose)
        const fallbackName = `${vocab.person} ${token}`

        const patientObj = {
            clinic_id: businessId,
            name: cleanName || fallbackName,
            phone: cleanPhone,
            token: token,
            status: 'waiting',
            date: today,
            language: language || 'hi',
            joined_at: new Date().toISOString(),
            fee_total: 500.00,
            fee_paid: 0.00,
            payment_status: 'pending'
        }

        let patient = null
        const { data, error } = await supabaseAdmin.from('patients').insert([patientObj]).select()

        if (!error && data && data[0]) {
            patient = data[0]
            // Mirror into queue_entries if table exists
            try {
                await supabaseAdmin.from('queue_entries').insert([{
                    id: patient.id,
                    business_id: businessId,
                    name: patient.name,
                    phone: patient.phone,
                    token: patient.token,
                    status: 'waiting',
                    date: today,
                    language: patient.language,
                    joined_at: patient.joined_at
                }]).catch(() => {})
            } catch (_) {}
        } else {
            // Fallback to queue_entries table
            const fallbackObj = {
                business_id: businessId,
                name: cleanName || fallbackName,
                phone: cleanPhone,
                token: token,
                status: 'waiting',
                date: today,
                language: language || 'en',
                joined_at: new Date().toISOString()
            }
            const { data: qData, error: qErr } = await supabaseAdmin.from('queue_entries').insert([fallbackObj]).select()
            if (qErr) {
                console.error('[queue/add] Error inserting:', error || qErr)
                return Response.json({ success: false, message: 'Failed to add walk-in patient' }, { status: 500 })
            }
            patient = qData[0]
        }

        if (cleanPhone !== '0000000000') {
            after(async () => {
                try {
                    const businessName = business?.name || 'the business'
                    const v = getIndustryVocab(vertical, purpose)

                    const { count: aheadCount } = await supabaseAdmin
                        .from('queue_entries')
                        .select('*', { count: 'exact', head: true })
                        .eq('business_id', businessId)
                        .eq('status', 'waiting')
                        .eq('date', today)
                        .lt('token', token)

                    const peopleAhead = aheadCount || 0

                    const confirmMsg = `*${v.title}, ${patient.name}!*

Your Token: *${token}*
${businessName}${purpose ? `\nPurpose: ${purpose}` : ''}
People ahead: *${peopleAhead}*
Est. wait: ~${peopleAhead * 7} mins

We'll notify you when your turn is near!

_Powered by TokenPe_`

                    const alerts = [sendText(cleanPhone, confirmMsg)]

                    if (planId !== 'starter') {
                        alerts.push(sendVoice({
                            phone: cleanPhone,
                            language: language || 'en',
                            event: 'joined',
                            token,
                            position: peopleAhead,
                            clinicName: businessName
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
