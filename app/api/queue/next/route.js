// FILE: /app/api/queue/next/route.js
// Called by dashboard "Call Next" button
// Sends your-turn + 10-away + 5-away alerts via Interakt text + Sarvam voice — all in parallel

import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'
import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'
import { getSession } from '../../../../lib/auth'
import { after } from 'next/server'

// ── Message text for each event ──────────────────────────────────────────────
function getMessage(event, name, token, currentToken, businessName, vertical, purpose) {
    let location = 'the clinic'
    let goMsg = "Start making your way to the clinic!"
    let readyMsg = "Please be ready near the cabin!"
    let finalMsg = "Proceed to the doctor's cabin immediately!"

    if (vertical === 'school' || vertical === 'college') {
        location = 'the campus / office'
        goMsg = "Start making your way to the office!"
        readyMsg = "Please be ready near the front desk!"
        finalMsg = "Proceed to the front desk immediately!"
    } else if (vertical === 'salon' || vertical === 'barbershop') {
        location = 'the salon'
        goMsg = "Start making your way to the salon!"
        readyMsg = "Please be ready near the waiting area!"
        finalMsg = "Your stylist is ready! Please proceed!"
    } else if (vertical === 'restaurant') {
        location = 'the restaurant'
        goMsg = "Start making your way to the restaurant!"
        readyMsg = "Please be ready near the host stand!"
        finalMsg = "Your table is ready! Please proceed to the host!"
    }

    switch (event) {
        case 'ten_away':
            return `*Heads up, ${name}!*

Now Serving: *${currentToken}*
Your Token: *${token}*
${businessName}${purpose ? `\nPurpose: ${purpose}` : ''}

About 10 tokens to go. ${goMsg}

_Powered by TokenPe_`

        case 'five_away':
            return `*Almost your turn, ${name}!*

Now Serving: *${currentToken}*
Your Token: *${token}*
${businessName}${purpose ? `\nPurpose: ${purpose}` : ''}

Only 5 tokens away. ${readyMsg}

_Powered by TokenPe_`

        case 'your_turn':
            return `*It's YOUR turn, ${name}!*

Token *${token}* — Please go now!
${businessName}${purpose ? `\nPurpose: ${purpose}` : ''}

${finalMsg}
Thank you for your patience

_Powered by TokenPe_`

        default:
            return ''
    }
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const {
            businessId,
            clinicName, // Fallback key from old frontend
            businessName,
            patientId,
            patientPhone,
            patientName,
            token,
            language
        } = await req.json()
        const finalBusinessName = businessName || clinicName || 'TokenPe Business'

        if (businessId !== session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
        }

        const today = getISTDateString()
        const phone = cleanPhone(patientPhone)

        // 1. Fetch business to check plan/type, Mark patient as CALLED, fetch waiting list — in parallel
        const [ { data: business }, , { data: waitingPatients }] = await Promise.all([
            supabaseAdmin.from('businesses').select('plan_id, type').eq('id', businessId).single(),
            supabaseAdmin.from('queue_entries').update({ status: 'called' }).eq('id', patientId),
            supabaseAdmin.from('queue_entries').select('*')
                .eq('business_id', businessId)
                .eq('status', 'waiting')
                .eq('date', today)
                .order('joined_at', { ascending: true })
        ])

        const planId = business?.plan_id || 'starter'
        const vertical = business?.type || 'clinic'

        // Fire all messaging asynchronously so the dashboard UI updates instantly and doesn't crash on TTS failure
        after(async () => {
            try {
                // Find current patient's purpose if any
                const { data: currentPatient } = await supabaseAdmin.from('queue_entries').select('purpose').eq('id', patientId).single()
                const currentPurpose = currentPatient?.purpose || null

                // 2. Send "Your Turn" text + voice (if pro/elite) in parallel
                const nowAlerts = [sendText(phone, getMessage('your_turn', patientName || 'Visitor', token, token, finalBusinessName, vertical, currentPurpose))]
                if (planId !== 'starter') {
                    nowAlerts.push(sendVoice({ phone, language: language || 'en', event: 'now', token, clinicName: finalBusinessName }))
                }
                await Promise.allSettled(nowAlerts)

                // 3. Send 10-away and 5-away alerts in parallel (fire & await together)
                const sideAlerts = []
                if (waitingPatients && waitingPatients.length > 0) {
                    waitingPatients.forEach((p, idx) => {
                        const position = idx + 1

                        if (position === 10) {
                            console.log(`[10-Away] Alerting ${p.name} (${p.token})`)
                            sideAlerts.push(sendText(cleanPhone(p.phone), getMessage('ten_away', p.name || 'Visitor', p.token, token, finalBusinessName, vertical, p.purpose)))
                            if (planId !== 'starter') {
                                sideAlerts.push(sendVoice({ phone: cleanPhone(p.phone), language: p.language || 'en', event: 'ten_away', token: p.token, currentToken: token, clinicName: finalBusinessName }))
                            }
                        }

                        if (position === 5) {
                            console.log(`[5-Away] Alerting ${p.name} (${p.token})`)
                            sideAlerts.push(sendText(cleanPhone(p.phone), getMessage('five_away', p.name || 'Visitor', p.token, token, finalBusinessName, vertical, p.purpose)))
                            if (planId !== 'starter') {
                                sideAlerts.push(sendVoice({ phone: cleanPhone(p.phone), language: p.language || 'en', event: 'five_away', token: p.token, currentToken: token, clinicName: finalBusinessName }))
                            }
                        }
                    })
                }

                if (sideAlerts.length > 0) await Promise.allSettled(sideAlerts)
            } catch (err) {
                console.error('[queue/next] Background messaging error:', err)
            }
        })

        return Response.json({
            success: true,
            called: token,
            waitingCount: waitingPatients?.length || 0
        })

    } catch (error) {
        console.error('[queue/next] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
