import { supabase } from '../../../../lib/supabase'

const AISENSY_API_KEY = process.env.AISENSY_API_KEY

// Helper to send a WhatsApp template via AiSensy
async function sendWhatsAppTemplate(phone, campaignName, userName, templateParams) {
    if (!AISENSY_API_KEY) return
    try {
        await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: AISENSY_API_KEY,
                campaignName,
                destination: phone,
                userName: userName || 'TokenPe',
                templateParams,
                source: 'dashboard',
                media: {},
                buttons: [],
                carouselCards: [],
                location: {},
            })
        })
    } catch (err) {
        console.error(`Error sending template ${campaignName} to ${phone}:`, err)
    }
}

export async function POST(req) {
    try {
        const body = await req.json()
        const { clinicId, clinicName, patientId, patientPhone, patientName, token, language } = body

        // 1. Update called patient's status to 'called' in Supabase
        const { error: updateError } = await supabase
            .from('patients')
            .update({ status: 'called' })
            .eq('id', patientId)

        if (updateError) {
            return Response.json({ success: false, error: updateError.message }, { status: 500 })
        }

        // 2. Trigger voice note for the called patient (event: 'now')
        try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: patientPhone,
                    language: language || 'en',
                    event: 'now',
                    token: token,
                    clinicName: clinicName
                })
            })
        } catch (err) {
            console.error('Error triggering voice note:', err)
        }

        // 3. Send turn WhatsApp template to called patient
        const callCampaign = process.env.WHATSAPP_CAMPAIGN_NAME || 'call_next_v3'
        await sendWhatsAppTemplate(patientPhone, callCampaign, patientName, [patientName, token])

        // 4. Query remaining waiting patients for today to find who is 5 and 10 spots behind
        const today = new Date().toISOString().split('T')[0]
        const { data: waitingPatients, error: queueError } = await supabase
            .from('patients')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('status', 'waiting')
            .eq('date', today)
            .order('created_at', { ascending: true })

        if (!queueError && waitingPatients && waitingPatients.length > 0) {
            // Index 4 in the waiting list represents the patient who has exactly 4 patients ahead of them
            // (so there are 5 people left ahead of them, placing them 5 spots away).
            if (waitingPatients.length > 4) {
                const p5 = waitingPatients[4]
                const alert5Campaign = process.env.WHATSAPP_ALERT_5_CAMPAIGN || 'queue_alert_5'
                await sendWhatsAppTemplate(p5.phone, alert5Campaign, p5.name || 'Patient', [token, p5.token])
            }

            // Index 9 in the waiting list represents the patient who has exactly 9 patients ahead of them
            // (placing them 10 spots away).
            if (waitingPatients.length > 9) {
                const p10 = waitingPatients[9]
                const alert10Campaign = process.env.WHATSAPP_ALERT_10_CAMPAIGN || 'queue_alert_10'
                await sendWhatsAppTemplate(p10.phone, alert10Campaign, p10.name || 'Patient', [token, p10.token])
            }
        }

        return Response.json({ success: true })
    } catch (error) {
        console.error('Error in queue next API:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
