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

        // 1. Mark this patient as DONE in Supabase
        await supabase
            .from('patients')
            .update({ status: 'done' })
            .eq('id', patientId)

        // 2. Send MSG 5 — "Consultation Done"
        const doneMsg = `✅ *Consultation Completed, ${patientName || 'Patient'}!*

Thank you for visiting *${clinicName}*. We hope you feel better soon! 🌟

Please don't hesitate to reach out if you have any questions.

_Powered by TokenPe_`

        await sendInteraktText(patientPhone, doneMsg)

        // 3. Send Voice Note 5 — "Consultation Done" in patient's language
        sendVoiceNote({
            phone: patientPhone,
            language: language || 'en',
            event: 'done',
            token,
            currentToken: token,
            clinicName
        })

        return Response.json({
            success: true,
            done: token
        })

    } catch (error) {
        console.error('[queue/done] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
