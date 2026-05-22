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
async function sendVoiceNote({ phone, language, event, token, clinicName }) {
    try {
        const res = await fetch(`${APP_URL}/api/voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone,
                language: language || 'en',
                event,
                token,
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
            clinicName,
            patientPhone,
            patientName,
            token,
            language
        } = await req.json()

        // 1. Send Manual Notify Text Msg
        const notifyMsg = `🔔 *Manual Alert, ${patientName || 'Patient'}!*

🎟 Your Token: *${token}*
🏥 ${clinicName}

The clinic has sent a manual alert for you. Please make sure you are nearby! 🏃

_Powered by TokenPe_`

        await sendInteraktText(patientPhone, notifyMsg)

        // 2. Send Voice Note — "Soon"
        sendVoiceNote({
            phone: patientPhone,
            language: language || 'en',
            event: 'soon',
            token,
            clinicName
        })

        return Response.json({
            success: true,
            notified: token
        })

    } catch (error) {
        console.error('[queue/notify] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
