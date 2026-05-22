// FILE: /app/api/queue/next/route.js
// Called by dashboard "Call Next" button
// Sends 10-away, 5-away, your-turn messages via Interakt + voice notes via Sarvam

import { supabase } from '../../../../lib/supabase'

const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ── Clean phone number ───────────────────────────────────────────────────────
function cleanPhone(phone) {
    let p = String(phone).replace(/\D/g, '')
    if (p.length === 10) p = '91' + p
    return p
}

// ── Send FREE session text message via Interakt ──────────────────────────────
// Works because patient messaged first (scanned QR) = 24hr window open
async function sendInteraktText(phone, message) {
    if (!INTERAKT_API_KEY) {
        console.warn('[Interakt] API key not configured')
        return
    }

    const p = cleanPhone(phone)
    const phoneNumber = p.startsWith('91') ? p.slice(2) : p

    try {
        const res = await fetch('https://api.interakt.ai/v1/public/message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + INTERAKT_API_KEY
            },
            body: JSON.stringify({
                countryCode: '+91',
                phoneNumber: phoneNumber,
                callbackData: 'tokenpe_queue_alert',
                type: 'Text',
                data: {
                    message: message
                }
            })
        })
        const data = await res.json()
        console.log(`[Interakt Text] → +91${phoneNumber}:`, JSON.stringify(data))
    } catch (err) {
        console.error('[Interakt Text] Error:', err)
    }
}

// ── Generate voice note via Sarvam + send via Interakt ───────────────────────
async function sendVoiceNote({ phone, language, event, token, currentToken, clinicName }) {
    try {
        const res = await fetch(`${APP_URL}/api/voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone,
                language: language || 'en',
                event,
                token,
                currentToken,
                clinicName
            })
        })
        const data = await res.json()
        console.log(`[Voice] ${event} → ${phone}:`, JSON.stringify(data))
    } catch (err) {
        console.error('[Voice] Error:', err)
    }
}

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

        // 1. Mark this patient as CALLED in Supabase
        await supabase
            .from('patients')
            .update({ status: 'called' })
            .eq('id', patientId)

        // 2. Send MSG 4 — "Your Turn" to current patient
        const yourTurnMsg = getMessage('your_turn', patientName || 'Patient', token, token, clinicName)
        await sendInteraktText(patientPhone, yourTurnMsg)

        // 3. Send Voice Note 4 — "Your Turn" in patient's language
        sendVoiceNote({
            phone: patientPhone,
            language: language || 'en',
            event: 'now',
            token,
            currentToken: token,
            clinicName
        })

        // 4. Get remaining WAITING patients in queue order
        const { data: waitingPatients } = await supabase
            .from('patients')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('status', 'waiting')
            .eq('date', today)
            .order('joined_at', { ascending: true })

        if (waitingPatients && waitingPatients.length > 0) {
            waitingPatients.forEach((p, idx) => {
                const position = idx + 1

                // MSG 2 — 10 tokens away
                if (position === 10) {
                    console.log(`[10-Away] Alerting ${p.name} (${p.token})`)
                    const msg = getMessage('ten_away', p.name || 'Patient', p.token, token, clinicName)
                    sendInteraktText(p.phone, msg)
                    sendVoiceNote({
                        phone: p.phone,
                        language: p.language || 'en',
                        event: 'ten_away',
                        token: p.token,
                        currentToken: token,
                        clinicName
                    })
                }

                // MSG 3 — 5 tokens away
                if (position === 5) {
                    console.log(`[5-Away] Alerting ${p.name} (${p.token})`)
                    const msg = getMessage('five_away', p.name || 'Patient', p.token, token, clinicName)
                    sendInteraktText(p.phone, msg)
                    sendVoiceNote({
                        phone: p.phone,
                        language: p.language || 'en',
                        event: 'five_away',
                        token: p.token,
                        currentToken: token,
                        clinicName
                    })
                }
            })
        }

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