// FILE: /app/api/queue/notify/route.js
// Manual notify from dashboard — sends "coming soon" text + voice note in parallel

import { supabase } from '../../../../lib/supabase'
import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const {
            clinicId,
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

        // Fetch clinic to check plan
        const { data: clinic } = await supabase.from('clinics').select('plan_id').eq('id', clinicId).single()
        const planId = clinic?.plan_id || 'starter'

        // Send text + voice (if pro/elite) in parallel
        const alerts = [sendText(phone, notifyMsg)]
        if (planId !== 'starter') {
            alerts.push(sendVoice({ phone, language: language || 'en', event: 'soon', token, clinicName }))
        }
        await Promise.all(alerts)

        return Response.json({ success: true, notified: token })

    } catch (error) {
        console.error('[queue/notify] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
