// FILE: /app/api/queue/next/route.js
// Called by dashboard "Call Next" button
// Sends your-turn + 10-away + 5-away alerts via Interakt text + Sarvam voice — all in parallel

import { supabase } from '../../../../lib/supabase'
import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'

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
        const {
            clinicId,
            clinicName,
            patientId,
            patientPhone,
            patientName,
            token,
            language
        } = await req.json()

        const today = new Date().toISOString().split('T')[0]
        const phone = cleanPhone(patientPhone)

        // 1. Mark patient as CALLED in Supabase + fetch waiting list — in parallel
        const [, { data: waitingPatients }] = await Promise.all([
            supabase.from('patients').update({ status: 'called' }).eq('id', patientId),
            supabase.from('patients').select('*')
                .eq('clinic_id', clinicId)
                .eq('status', 'waiting')
                .eq('date', today)
                .order('joined_at', { ascending: true })
        ])

        // 2. Send "Your Turn" text + voice in parallel
        await Promise.all([
            sendText(phone, getMessage('your_turn', patientName || 'Patient', token, token, clinicName)),
            sendVoice({ phone, language: language || 'en', event: 'now', token, clinicName })
        ])

        // 3. Send 10-away and 5-away alerts in parallel (fire & await together)
        const sideAlerts = []
        if (waitingPatients && waitingPatients.length > 0) {
            waitingPatients.forEach((p, idx) => {
                const position = idx + 1

                if (position === 10) {
                    console.log(`[10-Away] Alerting ${p.name} (${p.token})`)
                    sideAlerts.push(
                        sendText(cleanPhone(p.phone), getMessage('ten_away', p.name || 'Patient', p.token, token, clinicName)),
                        sendVoice({ phone: cleanPhone(p.phone), language: p.language || 'en', event: 'ten_away', token: p.token, currentToken: token, clinicName })
                    )
                }

                if (position === 5) {
                    console.log(`[5-Away] Alerting ${p.name} (${p.token})`)
                    sideAlerts.push(
                        sendText(cleanPhone(p.phone), getMessage('five_away', p.name || 'Patient', p.token, token, clinicName)),
                        sendVoice({ phone: cleanPhone(p.phone), language: p.language || 'en', event: 'five_away', token: p.token, currentToken: token, clinicName })
                    )
                }
            })
        }

        if (sideAlerts.length > 0) await Promise.all(sideAlerts)

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