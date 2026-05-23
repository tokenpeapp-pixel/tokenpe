// FILE: /app/api/queue/done/route.js
// Marks patient as done, sends Consultation Complete text + voice note in parallel

import { supabase } from '../../../../lib/supabase'
import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'

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

        const phone = cleanPhone(patientPhone)

        const doneMsg = `✅ *Consultation Completed, ${patientName || 'Patient'}!*

Thank you for visiting *${clinicName}*. We hope you feel better soon! 🌟

Please don't hesitate to reach out if you have any questions.

_Powered by TokenPe_`

        // Mark done in DB + send text + send voice — all in parallel
        await Promise.all([
            supabase.from('patients').update({ status: 'done' }).eq('id', patientId),
            sendText(phone, doneMsg),
            sendVoice({ phone, language: language || 'en', event: 'done', token, clinicName })
        ])

        return Response.json({ success: true, done: token })

    } catch (error) {
        console.error('[queue/done] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
