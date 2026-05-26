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

        // 1. Fetch clinic to check plan
        const { data: clinic } = await supabase.from('clinics').select('plan_id').eq('id', clinicId).single()
        const planId = clinic?.plan_id || 'starter'

        // 2. Mark done in DB + send text + send voice (if pro/elite) — all in parallel
        const alerts = [
            supabase.from('patients').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', patientId),
            sendText(phone, doneMsg)
        ]
        
        if (planId !== 'starter') {
            alerts.push(sendVoice({ phone, language: language || 'en', event: 'done', token, clinicName }))
        }

        await Promise.all(alerts)

        return Response.json({ success: true, done: token })

    } catch (error) {
        console.error('[queue/done] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
