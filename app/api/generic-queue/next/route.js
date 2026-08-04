import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'
import { sendText, sendVoice } from '../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }
        
        const { patientId } = await req.json()
        const businessId = session.businessId

        const { data: entry } = await supabaseAdmin.from('queue_entries').select('*').eq('id', patientId).eq('business_id', businessId).single()
        if (!entry) return Response.json({ success: false, message: 'Not found' }, { status: 404 })

        const { data: business } = await supabaseAdmin.from('businesses').select('name, plan_id').eq('id', businessId).single()

        if (entry.phone && entry.phone !== '0000000000') {
            after(async () => {
                try {
                    const bName = business?.name || 'the business'
                    const planId = business?.plan_id || 'starter'

                    const nextMsg = `🔔 *It's your turn, ${entry.name}!*

Please proceed.
🏢 ${bName}
🎟 Token: *${entry.token}*

_Powered by TokenPe_`

                    const alerts = [sendText(entry.phone, nextMsg)]
                    if (planId !== 'starter') {
                        alerts.push(sendVoice({ phone: entry.phone, language: entry.language || 'hi', event: 'next', token: entry.token, clinicName: bName }))
                    }
                    await Promise.all(alerts)
                } catch (err) {
                    console.error('[generic-queue/next] Messaging error:', err.message)
                }
            })
        }

        return Response.json({ success: true, patient: entry }, { status: 200 })
    } catch (error) {
        console.error('[generic-queue/next] Error:', error)
        return Response.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
