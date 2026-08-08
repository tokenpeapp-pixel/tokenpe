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
        let session = null
        try {
            session = await getSession()
        } catch (_) {}

        const body = await req.json()
        const { businessId: bodyBizId, name, token, language, phone, purpose } = body
        const businessId = session?.businessId || bodyBizId

        if (!businessId) {
            return Response.json({ success: false, message: 'Clinic identity missing. Please re-login.' }, { status: 401 })
        }

        const cleanName = sanitizeName(name) || 'Walk-in Patient'
        const cleanedPhone = validatePhone(phone) || '0000000000'
        const today = getISTDateString()

        let business = null
        if (businessId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(businessId))) {
            try {
                const { data: bData } = await supabaseAdmin
                    .from('clinics')
                    .upsert([{ id: businessId, name: 'dummy', vertical: 'clinic' }])
                    .select()
                    .single()
                if (bData) business = bData
            } catch (_) {}
        }
            
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

        let currentTotal = 0
        try {
            const { count } = await supabaseAdmin
                .from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('date', today)
            currentTotal = count || 0
        } catch (_) {}

        if (currentTotal >= limit) {
            return Response.json({
                success: false,
                message: `Queue Full: Daily limit of ${limit} entries reached.`
            }, { status: 403 })
        }

        if (cleanedPhone !== '0000000000') {
            let existingJoins = []
            try {
                const { data: exData } = await supabaseAdmin
                    .from('patients')
                    .select('name')
                    .eq('phone', cleanedPhone)
                    .eq('date', today)
                if (exData) existingJoins = exData
            } catch (_) {}

            if (existingJoins && existingJoins.length >= 5) {
                return Response.json({
                    success: false,
                    message: 'Daily join limit reached for this phone number.'
                }, { status: 429 })
            }
        }

        const vocab = getIndustryVocab(vertical, purpose)
        const fallbackName = `${vocab.person} ${token}`

        const patientObj = {
            name: cleanName || fallbackName,
            phone: cleanedPhone,
            token: token,
            status: 'waiting',
            date: today,
            language: language || 'hi',
            joined_at: new Date().toISOString(),
            fee_total: 500.00,
            fee_paid: 0.00,
            payment_status: 'pending'
        }

        // Only include clinic_id if it's a valid 36-char UUID
        if (businessId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(businessId))) {
            patientObj.clinic_id = businessId
        }

        let patient = null
        let { data, error } = await supabaseAdmin.from('patients').insert([patientObj]).select()

        if (error) {
            console.warn('[queue/add] FK error inserting into patients, retrying without clinic_id:', error.message)
            delete patientObj.clinic_id
            const res2 = await supabaseAdmin.from('patients').insert([patientObj]).select()
            if (res2.data && res2.data[0]) {
                data = res2.data
                error = null
            }
        }

        if (error || !data || !data[0]) {
            console.error('[queue/add Error inserting into Supabase patients table]:', error)
            return Response.json({ success: false, message: error?.message || 'Failed to insert patient into database' }, { status: 500 })
        }

        patient = data[0]

        if (cleanedPhone !== '0000000000') {
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

                    const confirmMsg = `*${v.title}, ${patient.name}!*\n\nYour Token: *${token}*\n${businessName}${purpose ? `\nPurpose: ${purpose}` : ''}\nPeople ahead: *${peopleAhead}*\nEst. wait: ~${peopleAhead * 7} mins\n\nWe'll notify you when your turn is near!\n\n_Powered by TokenPe_`

                    const alerts = [sendText(cleanedPhone, confirmMsg)]

                    if (planId !== 'starter') {
                        alerts.push(sendVoice({
                            phone: cleanedPhone,
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
