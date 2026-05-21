import { supabase } from '../../../lib/supabase'

const AISENSY_API_KEY = process.env.AISENSY_API_KEY

// ─── SEND QUEUE CONFIRMATION VIA AISENSY ─────────────────────────────────────
async function sendQueueConfirmation(phone, name, token, position, waitMins) {
    const campaignName = process.env.WHATSAPP_CONFIRMATION_CAMPAIGN || 'queue_confirmation'
    if (!AISENSY_API_KEY) {
        console.warn('AISENSY_API_KEY not configured')
        return
    }

    let cleanPhone = String(phone).replace(/\D/g, '')
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`

    try {
        const res = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: AISENSY_API_KEY,
                campaignName: campaignName,
                destination: cleanPhone,
                userName: name || 'Patient',
                templateParams: [name || 'Patient', token, String(position), String(waitMins)],
                source: 'dashboard',
                media: {},
                buttons: [],
                carouselCards: [],
                location: {},
            })
        })
        const data = await res.json()
        console.log(`AiSensy confirmation template response:`, JSON.stringify(data))
    } catch (err) {
        console.error('Error sending WhatsApp queue confirmation:', err)
    }
}

// ─── SEND CALL NEXT NOTIFICATION VIA AISENSY ────────────────────────────────
async function sendCallNext(phone, name, token) {
    const campaignName = process.env.WHATSAPP_TURN_CAMPAIGN || 'your_turn'
    if (!AISENSY_API_KEY) {
        console.warn('AISENSY_API_KEY not configured')
        return
    }

    let cleanPhone = String(phone).replace(/\D/g, '')
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`

    try {
        const res = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: AISENSY_API_KEY,
                campaignName: campaignName,
                destination: cleanPhone,
                userName: name || 'Patient',
                templateParams: [name || 'Patient', token],
                source: 'dashboard',
                media: {},
                buttons: [],
                carouselCards: [],
                location: {},
            })
        })
        const data = await res.json()
        console.log(`AiSensy call next template response:`, JSON.stringify(data))
    } catch (err) {
        console.error('Error sending WhatsApp call next:', err)
    }
}

// ─── SEND VOICE NOTE VIA /api/voice ─────────────────────────────────────────
async function sendVoiceNote({ phone, language, event, token, position, clinicName, baseUrl }) {
    const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    try {
        await fetch(`${appUrl}/api/voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, language, event, token, position, clinicName })
        })
    } catch (err) {
        console.error('Voice note error:', err)
    }
}

// ─── MAIN WEBHOOK HANDLER (called by AiSensy API Request node) ──────────────
export async function POST(req) {
    try {
        const { searchParams } = new URL(req.url)
        const secret = searchParams.get('secret')

        // 🛡️ Webhook Security
        if (secret !== process.env.WEBHOOK_VERIFY_TOKEN) {
            return Response.json({
                success: false,
                message: '❌ Unauthorized request. Invalid webhook secret token.'
            }, { status: 401 })
        }

        const body = await req.json()
        const { phone, name, language, action, clinicCode } = body
        const baseUrl = new URL(req.url).origin

        // ── JOIN action ──────────────────────────────────────────────────────────
        if (action === 'join') {

            // ─── Builder Test Safeguard ──────────────────────────────────────────
            // If this is a test call from the flow builder with unresolved placeholders,
            // return a mock success response so response keys can be mapped.
            if (!clinicCode || clinicCode.includes('{') || clinicCode.includes('}') || clinicCode === 'placeholder' || clinicCode.includes('variable')) {
                return Response.json({
                    success: true,
                    token: 'T001',
                    position: 0,
                    wait: 'You are next!',
                    clinicName: 'Demo Clinic',
                    name: name || 'Guest'
                }, { status: 200 })
            }

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

            // 4. Send voice note (Sarvam TTS → Supabase Storage → AiSensy)
            sendVoiceNote({
                phone,
                language: language || 'en',
                event: 'joined',
                token: tokenNumber,
                position,
                clinicName: clinic.name,
                baseUrl
            })

            // 5. Send text confirmation template via AiSensy
            try {
                await sendQueueConfirmation(phone, name || 'Guest', tokenNumber, position, waitMins)
            } catch (err) {
                console.error('Error sending WhatsApp queue confirmation:', err)
            }

            // 6. Return token info back to flow
            return Response.json({
                success: true,
                token: tokenNumber,
                position: position,
                wait: position === 0 ? 'You are next!' : `${waitMins} mins`,
                clinicName: clinic.name,
                name: name || 'Guest'
            }, { status: 200 })
        }

        // ── CALL NEXT action ─────────────────────────────────────────────────────
        if (action === 'callnext') {
            const { patientPhone, patientName, token } = body

            // Send "Your Turn" template via AiSensy
            await sendCallNext(patientPhone, patientName, token)

            // Send "Your Turn" voice note
            sendVoiceNote({
                phone: patientPhone,
                language: body.language || 'en',
                event: 'now',
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

// ─── WEBHOOK VERIFICATION ────────────────────────────────────────────────────
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