import { supabase, supabaseAdmin, getISTDateString } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'
import { sanitizeName, validatePhone } from '../../../../lib/validate'
import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'
import { after } from 'next/server'

// ── INDUSTRY SPECIFIC VOCABULARY ─────────────────────────────────────────────
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
        const { businessId, name, language, phone, purpose } = body

        if (!businessId) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        if (businessId !== session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
        }

        const cleanName = sanitizeName(name)
        const cleanPhone = validatePhone(phone) || '0000000000'

        const today = getISTDateString()

        // ── Look up business plan from the unified businesses table ──────
        const { data: business } = await supabaseAdmin
            .from('businesses')
            .select('name, plan_id, closed_today_date, type')
            .eq('id', businessId)
            .single()
            
        const planId = business?.plan_id || 'starter'
        const vertical = business?.type || 'clinic'
        const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity

        // ── Block walk-ins if business is closed for today (clinic-only for now) ──
        if (vertical === 'clinic' && business?.closed_today_date) {
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
                message: `Queue Full: Daily limit of ${limit} entries reached.`
            }, { status: 403 })
        }

        const token = 'T' + String(currentTotal + 1).padStart(3, '0')

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

        const vocab = getIndustryVocab(vertical, purpose)
        const fallbackName = `${vocab.person} ${token}`

        const newPatient = {
            business_id: businessId,
            name: cleanName || fallbackName,
            phone: cleanPhone,
            token: token,
            status: 'waiting',
            date: today,
            language: language || 'en',
            joined_at: new Date().toISOString(),
            purpose: purpose || null
        }

        const { data, error } = await supabaseAdmin.from('queue_entries').insert([newPatient]).select()

        if (error) {
            console.error('[queue/add] Error inserting:', error)
            return Response.json({ success: false, message: 'Failed to add walk-in patient' }, { status: 500 })
        }

        const patient = data[0]

        // Send WhatsApp confirmation in background (non-blocking)
        if (cleanPhone !== '0000000000') {
            after(async () => {
                try {
                    const businessName = business?.name || 'the business'
                    const v = getIndustryVocab(vertical, purpose)

                    // Count people ahead
                    const { count: aheadCount } = await supabaseAdmin
                        .from('queue_entries')
                        .select('*', { count: 'exact', head: true })
                        .eq('business_id', businessId)
                        .eq('status', 'waiting')
                        .eq('date', today)
                        .lt('token', token)

                    const peopleAhead = aheadCount || 0

                    const confirmMsg = `✅ *${v.title}, ${patient.name}!*

🎟 Your Token: *${token}*
${v.icon} ${businessName}${purpose ? `\n📋 Purpose: ${purpose}` : ''}
👥 People ahead: *${peopleAhead}*
⏳ Est. wait: ~${peopleAhead * 7} mins

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
