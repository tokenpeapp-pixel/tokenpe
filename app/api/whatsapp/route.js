import { supabase } from '../../../lib/supabase'

const AISENSY_API_KEY = process.env.AISENSY_API_KEY

// ─── SEND QUEUE CONFIRMATION VIA AISENSY ─────────────────────────────────────
async function sendQueueConfirmation(phone, name, token, position, waitMins) {
    const campaignName = process.env.WHATSAPP_CONFIRMATION_CAMPAIGN || 'queue_confirmation'
    await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            apiKey: AISENSY_API_KEY,
            campaignName: campaignName,        // dynamic confirmation campaign name
            destination: phone,
            userName: name,
            templateParams: [name, token, String(position), String(waitMins)],
            source: 'dashboard',
            media: {},
            buttons: [],
            carouselCards: [],
            location: {},
        })
    })
}

// ─── SEND CALL NEXT NOTIFICATION VIA AISENSY ────────────────────────────────
async function sendCallNext(phone, name, token) {
    const campaignName = process.env.WHATSAPP_CAMPAIGN_NAME || 'call_next_v3'
    await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            apiKey: AISENSY_API_KEY,
            campaignName: campaignName,        // dynamic campaign name from env or fallback
            destination: phone,
            userName: name,
            templateParams: [name, token],
            source: 'dashboard',
            media: {},
            buttons: [],
            carouselCards: [],
            location: {},
        })
    })
}

// ─── SEND VOICE NOTE VIA SARVAM ─────────────────────────────────────────────
async function sendVoiceNote({ phone, language, event, token, position, clinicName, baseUrl }) {
    const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await fetch(`${appUrl}/api/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, language, event, token, position, clinicName })
    })
}

// ─── MAIN WEBHOOK HANDLER (called by AiSensy API Request node) ──────────────
export async function POST(req) {
    try {
        const body = await req.json()
        const { phone, name, language, action, clinicCode } = body
        const baseUrl = new URL(req.url).origin

        // ── JOIN action (patient joining queue) ──────────────────────────────────
        if (action === 'join') {

            // 1. Validate clinic
            const { data: clinic, error: clinicError } = await supabase
                .from('clinics')
                .select('*')
                .eq('code', clinicCode)
                .single()

            if (clinicError || !clinic) {
                return Response.json({
                    success: false,
                    message: '❌ Invalid clinic code. Please scan the QR code again.'
                }, { status: 200 })
            }

            // 2. Count patients waiting today
            const today = new Date().toISOString().split('T')[0]
            const { count } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinic.id)
                .eq('status', 'waiting')
                .eq('date', today)

            const position = count || 0
            const tokenNumber = `T${String(position + 1).padStart(3, '0')}`
            const waitMins = position * 7

            // 3. Add patient to queue
            await supabase.from('patients').insert({
                clinic_id: clinic.id,
                token: tokenNumber,
                phone,
                name: name || 'Guest',
                language: language || 'en',
                status: 'waiting',
                amount_paid: 0,
                date: today,
            })

            // 4. Send voice note via Sarvam
            await sendVoiceNote({
                phone,
                language: language || 'en',
                event: 'joined',
                token: tokenNumber,
                position,
                clinicName: clinic.name,
                baseUrl
            })

            // 4.5. Send text queue confirmation template via AiSensy
            try {
                await sendQueueConfirmation(phone, name || 'Guest', tokenNumber, position, waitMins)
            } catch (err) {
                console.error('Error sending WhatsApp queue confirmation:', err)
            }

            // 5. Return token info back to AiSensy
            // AiSensy will show confirmation message to patient
            return Response.json({
                success: true,
                token: tokenNumber,
                position: position,
                wait: position === 0 ? 'You are next!' : `${waitMins} mins`,
                clinicName: clinic.name,
                name: name || 'Guest'
            }, { status: 200 })
        }

        // ── CALL NEXT action (doctor hits Call Next on dashboard) ────────────────
        if (action === 'callnext') {
            const { patientPhone, patientName, token } = body

            // Send WhatsApp notification via AiSensy
            await sendCallNext(patientPhone, patientName, token)

            // Send voice note via Sarvam
            await sendVoiceNote({
                phone: patientPhone,
                language: body.language || 'en',
                event: 'called',
                token,
                position: 0,
                clinicName: body.clinicName,
                baseUrl
            })

            return Response.json({ success: true }, { status: 200 })
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 })

    } catch (error) {
        console.error('Webhook error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}

// ─── WEBHOOK VERIFICATION (keep this for any future use) ────────────────────
export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
}