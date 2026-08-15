// FILE: /app/api/queue/notify/route.js
// Manual notify from dashboard — sends "coming soon" text + voice note in parallel

import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { sendText, sendVoice, cleanPhone } from '../../../../lib/messaging'
import { getSession } from '../../../../lib/auth'

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const {
            businessId,
            clinicName,
            patientPhone,
            patientName,
            token,
            language
        } = await req.json()

        if (businessId !== session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        const phone = cleanPhone(patientPhone)

        const notifyMsg = `🔔 *Manual Alert, ${patientName || 'Patient'}!*

🎟 Your Token: *${token}*
🏥 ${clinicName}

The clinic has sent a manual alert for you. Please make sure you are nearby! 🏃

_Powered by TokenPe_`

        // Check business plan features
        const { data: business } = await supabaseAdmin.from('businesses').select('plan_id').eq('id', businessId).single()
        const canUseVoice = business?.plan_id === 'pro' || business?.plan_id === 'elite'

        // Send text + voice (if pro/elite) in parallel
        const alerts = [sendText(phone, notifyMsg)]
        if (canUseVoice) {
            alerts.push(sendVoice({ phone, language: language || 'en', event: 'soon', token, clinicName }))
        }
        await Promise.all(alerts)

        return Response.json({ success: true, notified: token })

    } catch (error) {
        console.error('[queue/notify] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
