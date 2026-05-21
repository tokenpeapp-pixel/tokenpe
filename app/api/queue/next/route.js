import { supabase } from '../../../../lib/supabase'

const AISENSY_API_KEY = process.env.AISENSY_API_KEY

// ─── Extract number from token string (T050 → 50) ───────────────────────────
function tokenToNum(token) {
    return parseInt((token || '').replace('T', '')) || 0
}

// ─── Send WhatsApp template via AiSensy ─────────────────────────────────────
async function sendWhatsAppTemplate(phone, campaignName, userName, templateParams) {
    if (!AISENSY_API_KEY) return
    try {
        // Normalize phone: always 12 digits with country code
        let cleanPhone = String(phone).replace(/\D/g, '')
        if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`

        await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: AISENSY_API_KEY,
                campaignName,
                destination: cleanPhone,
                userName: userName || 'Patient',
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

// ─── Send voice note via our /api/voice route ────────────────────────────────
async function sendVoiceNote(phone, language, event, token, clinicName, position = 0, current = '') {
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        await fetch(`${appUrl}/api/voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, language: language || 'en', event, token, position, clinicName, current })
        })
    } catch (err) {
        console.error(`Error sending voice note (${event}) to ${phone}:`, err)
    }
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const body = await req.json()
        const { clinicId, clinicName, patientId, patientPhone, patientName, token, language } = body

        const currentTokenNum = tokenToNum(token)

        // ── Step 1: Mark the called patient as 'called' ──────────────────────
        const { error: updateError } = await supabase
            .from('patients')
            .update({ status: 'called', notifications_sent: 3 })
            .eq('id', patientId)

        if (updateError) {
            return Response.json({ success: false, error: updateError.message }, { status: 500 })
        }

        // ── Step 2: Send "YOUR TURN" WhatsApp template to called patient ──────
        const turnCampaign = process.env.WHATSAPP_TURN_CAMPAIGN || 'your_turn'
        await sendWhatsAppTemplate(
            patientPhone,
            turnCampaign,
            patientName,
            [patientName, token]  // templateParams: {{1}}=name, {{2}}=token
        )

        // ── Step 3: Send "YOUR TURN" voice note to called patient ─────────────
        await sendVoiceNote(patientPhone, language, 'now', token, clinicName, 0)

        // ── Step 4: Get all remaining waiting patients for today ──────────────
        const today = new Date().toISOString().split('T')[0]
        const { data: waitingPatients, error: queueError } = await supabase
            .from('patients')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('status', 'waiting')
            .eq('date', today)
            .order('created_at', { ascending: true })

        if (!queueError && waitingPatients && waitingPatients.length > 0) {
            for (const patient of waitingPatients) {
                const patientTokenNum = tokenToNum(patient.token)
                const diff = patientTokenNum - currentTokenNum
                const notifsSent = patient.notifications_sent || 0

                // ── 10 tokens away: send first alert ──────────────────────────
                // Only send if exactly 10 away AND haven't sent first alert yet
                if (diff === 10 && notifsSent < 1) {
                    // Send WhatsApp text alert
                    const alert10Campaign = process.env.WHATSAPP_ALERT_10_CAMPAIGN || 'queue_alert_10'
                    await sendWhatsAppTemplate(
                        patient.phone,
                        alert10Campaign,
                        patient.name || 'Patient',
                        [patient.name || 'Patient', patient.token, token]
                        // {{1}}=patientName, {{2}}=patientToken, {{3}}=currentToken
                    )

                    // Send voice note
                    await sendVoiceNote(patient.phone, patient.language, 'ten_away', patient.token, clinicName, 10, token)

                    // Mark first alert sent
                    await supabase
                        .from('patients')
                        .update({ notifications_sent: 1 })
                        .eq('id', patient.id)
                }

                // ── 5 tokens away: send second alert ──────────────────────────
                // Only send if exactly 5 away AND haven't sent second alert yet
                if (diff === 5 && notifsSent < 2) {
                    // Send WhatsApp text alert
                    const alert5Campaign = process.env.WHATSAPP_ALERT_5_CAMPAIGN || 'queue_alert_5'
                    await sendWhatsAppTemplate(
                        patient.phone,
                        alert5Campaign,
                        patient.name || 'Patient',
                        [patient.name || 'Patient', patient.token, token]
                        // {{1}}=patientName, {{2}}=patientToken, {{3}}=currentToken
                    )

                    // Send voice note
                    await sendVoiceNote(patient.phone, patient.language, 'five_away', patient.token, clinicName, 5, token)

                    // Mark second alert sent
                    await supabase
                        .from('patients')
                        .update({ notifications_sent: 2 })
                        .eq('id', patient.id)
                }
            }
        }

        return Response.json({ success: true })
    } catch (error) {
        console.error('Error in queue next API:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
