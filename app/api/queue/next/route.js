// FILE: /app/api/queue/next/route.js
// Called by dashboard "Call Next" button
// Sends your-turn + 10-away + 5-away alerts via Interakt text + Sarvam voice — all in parallel

import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'
import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'
import { getSession } from '../../../../lib/auth'
import { after } from 'next/server'

// ── Message text for each event ──────────────────────────────────────────────
function getMessage(event, name, token, currentToken, clinicName) {
    switch (event) {
        case 'ten_away':
            return `🔔 *Heads up, ${name}!*

📍 Now Serving: *${currentToken}*
🎟 Your Token: *${token}*
🏥 ${clinicName}

About 10 tokens to go. Start making your way to the clinic! 🏃

_Powered by TokenPe_`

        case 'five_away':
            return `⚡ *Almost your turn, ${name}!*

📍 Now Serving: *${currentToken}*
🎟 Your Token: *${token}*
🏥 ${clinicName}

Only 5 tokens away. Please be ready near the cabin! 🙏

_Powered by TokenPe_`

        case 'your_turn':
            return `🚨 *It's YOUR turn, ${name}!*

🎟 Token *${token}* — Please go now!
🏥 ${clinicName}

Proceed to the doctor's cabin immediately! 🏥
Thank you for your patience 🙏

_Powered by TokenPe_`

        default:
            return ''
    }
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const {
            clinicId,
            clinicName,
            patientId,
            patientPhone,
            patientName,
            token,
            language
        } = await req.json()

        if (clinicId !== session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        const today = getISTDateString()
        const phone = cleanPhone(patientPhone)

        // 1. Fetch clinic to check plan, Mark patient as CALLED, fetch waiting list — in parallel
        const [ { data: clinic }, , { data: waitingPatients }] = await Promise.all([
            supabaseAdmin.from('clinics').select('plan_id, current_period_end').eq('id', clinicId).single(),
            supabaseAdmin.from('patients').update({ status: 'called' }).eq('id', patientId),
            supabaseAdmin.from('patients').select('*')
                .eq('clinic_id', clinicId)
                .eq('status', 'waiting')
                .eq('date', today)
                .order('joined_at', { ascending: true })
        ])

        const rawPlanId = clinic?.plan_id || 'starter'
        const subExpired = clinic?.current_period_end && new Date(clinic.current_period_end) < new Date()
        const planId = subExpired ? 'starter' : rawPlanId

        // Fire all messaging asynchronously so the dashboard UI updates instantly and doesn't crash on TTS failure
        after(async () => {
            try {
                // 2. Send "Your Turn" text + voice (if pro/elite) in parallel
                const nowAlerts = [sendText(phone, getMessage('your_turn', patientName || 'Patient', token, token, clinicName))]
                if (planId !== 'starter') {
                    nowAlerts.push(sendVoice({ phone, language: language || 'en', event: 'now', token, clinicName }))
                }
                await Promise.allSettled(nowAlerts)

                // 3. Send 10-away and 5-away alerts in parallel (fire & await together)
                const sideAlerts = []
                if (waitingPatients && waitingPatients.length > 0) {
                    waitingPatients.forEach((p, idx) => {
                        const position = idx + 1

                        if (position === 10) {
                            console.log(`[10-Away] Alerting ${p.name} (${p.token})`)
                            sideAlerts.push(sendText(cleanPhone(p.phone), getMessage('ten_away', p.name || 'Patient', p.token, token, clinicName)))
                            if (planId !== 'starter') {
                                sideAlerts.push(sendVoice({ phone: cleanPhone(p.phone), language: p.language || 'en', event: 'ten_away', token: p.token, currentToken: token, clinicName }))
                            }
                        }

                        if (position === 5) {
                            console.log(`[5-Away] Alerting ${p.name} (${p.token})`)
                            sideAlerts.push(sendText(cleanPhone(p.phone), getMessage('five_away', p.name || 'Patient', p.token, token, clinicName)))
                            if (planId !== 'starter') {
                                sideAlerts.push(sendVoice({ phone: cleanPhone(p.phone), language: p.language || 'en', event: 'five_away', token: p.token, currentToken: token, clinicName }))
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