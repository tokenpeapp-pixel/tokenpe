// FILE: /app/api/queue/done/route.js
// Marks patient as done, sends Consultation Complete text + voice note in parallel


import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { sendText, sendVoice, cleanPhone, sendInteractiveRating } from '../../../../lib/messaging'
import { getSession } from '../../../../lib/auth'
import { after } from 'next/server'

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
        const { data: clinic } = await supabaseAdmin.from('clinics').select('plan_id, code, subscription_status').eq('id', clinicId).single()
        const planId = clinic?.plan_id || 'starter'

        // 2. Mark done in DB immediately (block on this so UI updates accurately)
        const { error: dbError } = await supabaseAdmin
            .from('patients')
            .update({ status: 'done', completed_at: new Date().toISOString() })
            .eq('id', patientId)

        if (dbError) throw dbError

        // 3. Fire all messaging asynchronously so the dashboard UI updates instantly and doesn't crash on TTS failure
        after(async () => {
            try {
                const doneMsg = `✅ *Consultation Completed, ${patientName || 'Patient'}!*\n\nPlease don't hesitate to reach out if you have any questions.\n\n_Powered by TokenPe_`
                const alerts = [sendText(phone, doneMsg)]

                if (planId !== 'starter') {
                    alerts.push(sendVoice({ phone, language: language || 'en', event: 'done', token, clinicName }))
                }

                await Promise.allSettled(alerts)

                // Send Interactive List via Interakt — patient taps a star → Interakt fires incoming webhook → we save rating
                await new Promise(r => setTimeout(r, 500))
                await sendInteractiveRating(phone, clinicName, language || 'en')
            } catch (err) {
                console.error('[queue/done] Background messaging error:', err)
            }
        })

        return Response.json({ success: true, done: token })

    } catch (error) {
        console.error('[queue/done] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
