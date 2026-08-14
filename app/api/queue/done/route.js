// FILE: /app/api/queue/done/route.js
// Marks patient as done, sends Consultation Complete text + voice note in parallel


import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { sendText, sendVoice, cleanPhone, sendInteractiveRating } from '../../../../lib/messaging'
import { getSession } from '../../../../lib/auth'
import { after } from 'next/server'

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        let session = null
        try {
            session = await getSession()
        } catch (_) {}

        const {
            businessId: reqBizId,
            clinicName, // Fallback
            businessName,
            patientId,
            patientPhone,
            patientName,
            token,
            language
        } = await req.json()

        if (!session) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const businessId = session.businessId || reqBizId
        const finalBusinessName = businessName || clinicName || 'TokenPe Business'

        if (!patientId) {
            return Response.json({ success: false, message: 'Missing patient ID' }, { status: 400 })
        }

        const phone = cleanPhone(patientPhone)

        // 1. Fetch business to check plan/type
        let business = null
        try {
            const { data: bData } = await supabaseAdmin.from('clinics').select('plan_id, code, subscription_status, type').eq('id', businessId).single()
            business = bData
        } catch (_) {}

        const planId = business?.plan_id || 'starter'
        const vertical = business?.type || 'clinic'

        // 2. Mark done in DB immediately in BOTH patients and queue_entries tables
        await Promise.allSettled([
            supabaseAdmin.from('patients').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', patientId),
            supabaseAdmin.from('queue_entries').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', patientId)
        ])

        // 3. Fire all messaging asynchronously so the dashboard UI updates instantly
        after(async () => {
            try {
                let completionTitle = "Consultation Completed"
                let person = "Patient"
                if (vertical === 'school' || vertical === 'college') {
                    completionTitle = "Visit Completed"
                    person = "Visitor"
                } else if (vertical === 'salon' || vertical === 'barbershop') {
                    completionTitle = "Service Completed"
                    person = "Customer"
                } else if (vertical === 'restaurant') {
                    completionTitle = "Dining Completed"
                    person = "Guest"
                }

                const doneMsg = `✅ *${completionTitle}, ${patientName || person}!*\n\nPlease don't hesitate to reach out if you have any questions.\n\n_Powered by TokenPe_`
                const alerts = [sendText(phone, doneMsg)]

                if (planId !== 'starter') {
                    alerts.push(sendVoice({ phone, language: language || 'en', event: 'done', token, clinicName: finalBusinessName }))
                }

                await Promise.allSettled(alerts)

                // Send Interactive List via MSG91
                await new Promise(r => setTimeout(r, 500))
                await sendInteractiveRating(phone, finalBusinessName, language || 'en')
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
