// FILE: /app/api/queue/done/route.js
// Marks patient as done, sends Consultation Complete text + voice note in parallel


import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { sendText, sendVoice, cleanPhone, sendInteractiveRating } from '../../../../lib/messaging'
import { getSession } from '../../../../lib/auth'

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

        const phone = cleanPhone(patientPhone)

        // 1. Fetch clinic to check plan
        const { data: clinic } = await supabase.from('clinics').select('plan_id, code, subscription_status').eq('id', clinicId).single()
        const planId = clinic?.plan_id || 'starter'
        const clinicCode = clinic?.code || ''

        const doneMsg = `✅ *Consultation Completed, ${patientName || 'Patient'}!*

Thank you for visiting *${clinicName}*. We hope you feel better soon! 🌟

Please don't hesitate to reach out if you have any questions.

_Powered by TokenPe_`

        // 2. Mark done in DB + send text + send voice (if pro/elite) — all in parallel
        const alerts = [
            supabaseAdmin.from('patients').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', patientId),
            sendText(phone, doneMsg)
        ]

        if (planId !== 'starter') {
            alerts.push(sendVoice({ phone, language: language || 'en', event: 'done', token, clinicName }))
        }

        await Promise.all(alerts)

        // Send rating AFTER the consultation messages so it arrives last in WhatsApp
        // We add a 2-second delay to guarantee Interakt has time to deliver the voice note first
        if (planId === 'elite' || planId === 'pro' || clinic?.subscription_status === 'trialing') {
            // Wait 2 seconds to ensure the 'Consultation Done' voice note is delivered first
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // 3) Send "Rate Your Visit" text message (interactive buttons)
            await sendInteractiveRating(phone, clinicName, language || 'en')
            
            // 4) Send "Rate Your Visit" voice note 
            // (sendVoice inherently takes ~1.5s to generate audio, naturally arriving after the text)
            try {
                await sendVoice({ phone, language: language || 'en', event: 'rating' })
            } catch (err) {
                console.error('[queue/done] Rating voice note failed:', err.message)
            }
        }

        return Response.json({ success: true, done: token })

    } catch (error) {
        console.error('[queue/done] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
