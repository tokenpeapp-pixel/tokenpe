// FILE: /app/api/queue/notify/route.js
// Manual notify from dashboard — sends "coming soon" text + voice note in parallel

import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'

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

        const phone = cleanPhone(patientPhone)

        const notifyMsg = `🔔 *Manual Alert, ${patientName || 'Patient'}!*

🎟 Your Token: *${token}*
🏥 ${clinicName}

The clinic has sent a manual alert for you. Please make sure you are nearby! 🏃

_Powered by TokenPe_`

        // Send text + voice in parallel
        await Promise.all([
            sendText(phone, notifyMsg),
            sendVoice({ phone, language: language || 'en', event: 'soon', token, clinicName })
        ])

        return Response.json({ success: true, notified: token })

    } catch (error) {
        console.error('[queue/notify] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
