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
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const {
            businessId,
            clinicName, // Fallback
            businessName,
            patientId,
            patientPhone,
            patientName,
            token,
            language
        } = await req.json()
        const finalBusinessName = businessName || clinicName || 'TokenPe Business'

        if (businessId !== session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized access' }, { status: 403 })
        }

        const phone = cleanPhone(patientPhone)

        // 1. Fetch business to check plan/type
        const { data: business } = await supabaseAdmin.from('businesses').select('plan_id, code, subscription_status, type').eq('id', businessId).single()
        const planId = business?.plan_id || 'starter'
        const vertical = business?.type || 'clinic'

        // 2. Mark done in DB immediately (block on this so UI updates accurately)
        const { error: dbError } = await supabaseAdmin
            .from('queue_entries')
            .update({ status: 'done', completed_at: new Date().toISOString() })
            .eq('id', patientId)

        if (dbError) throw dbError

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

                // Send Interactive List via Interakt
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
