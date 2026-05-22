// FILE: /app/api/whatsapp/route.js
// Handles: join action (from Interakt Flow webhook)
// Also handles: callnext action (from dashboard)

import { supabase } from '../../../lib/supabase'

const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ── Clean phone number ───────────────────────────────────────────────────────
function cleanPhone(phone) {
    let p = String(phone).replace(/\D/g, '')
    if (p.length === 10) p = '91' + p
    return p
}

// ── Send text message via Interakt session ───────────────────────────────────
async function sendInteraktText(phone, message) {
    if (!INTERAKT_API_KEY) {
        console.warn('[Interakt] ⚠️ INTERAKT_API_KEY not set in env — skipping send')
        return
    }

    const p = cleanPhone(phone)
    const phoneNumber = p.startsWith('91') ? p.slice(2) : p

    try {
        const res = await fetch('https://api.interakt.ai/v1/public/message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + INTERAKT_API_KEY
            },
            body: JSON.stringify({
                countryCode: '+91',
                phoneNumber: phoneNumber,
                callbackData: 'tokenpe_queue',
                type: 'Text',
                data: { message }
            })
        })
        const data = await res.json()
        console.log(`[Interakt] → +91${phoneNumber}:`, JSON.stringify(data))
    } catch (err) {
        console.error('[Interakt] Send error:', err)
    }
}

// ── Send voice note via /api/voice ───────────────────────────────────────────
async function sendVoiceNote({ phone, language, event, token, position, clinicName, baseUrl }) {
    const appUrl = baseUrl || APP_URL
    try {
        await fetch(`${appUrl}/api/voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, language, event, token, position, clinicName })
        })
    } catch (err) {
        console.error('[Voice] Error:', err)
    }
}

// ── Resolve field with multiple possible Interakt variable names ─────────────
// Interakt Flow variables might come as: customer_phone, phone, Phone, PHONE, etc.
function pick(body, ...keys) {
    for (const key of keys) {
        if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
            return body[key]
        }
    }
    return undefined
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const { searchParams } = new URL(req.url)
        const secret = searchParams.get('secret')

        // 🛡️ Webhook Security
        if (secret !== process.env.WEBHOOK_VERIFY_TOKEN) {
            console.error(`[whatsapp] ❌ Unauthorized — secret="${secret}" expected="${process.env.WEBHOOK_VERIFY_TOKEN}"`)
            return Response.json({
                success: false,
                message: '❌ Unauthorized. Invalid webhook secret.'
            }, { status: 401 })
        }

        const body = await req.json()

        // ── 🔍 FULL PAYLOAD LOG — helps debug Interakt variable names ──────────
        console.log('[whatsapp] ✅ Received payload:', JSON.stringify(body, null, 2))

        const action = pick(body, 'action', 'Action', 'event', 'type')
        const baseUrl = new URL(req.url).origin

        // ── JOIN action ──────────────────────────────────────────────────────────
        if (action === 'join') {

            // Accept multiple possible field names from Interakt Flow
            const phone    = pick(body, 'phone', 'Phone', 'mobile', 'customer_phone', 'waPhone', 'whatsapp')
            const name     = pick(body, 'name', 'Name', 'customer_name', 'patientName', 'fullName', 'full_name')
            const language = pick(body, 'language', 'Language', 'lang', 'preferred_language') || 'en'

            // Accept clinic code variants + strip "JOIN " prefix
            const rawCode = String(
                pick(body, 'clinicCode', 'clinic_code', 'cliniccode', 'code', 'Code', 'JOIN') || ''
            )
            const clinicCode = rawCode
                .replace(/^JOIN\s*/i, '')
                .trim()
                .toUpperCase()

            console.log(`[Join] phone=${phone} | name=${name} | lang=${language} | clinicCode=${clinicCode}`)

            if (!phone) {
                console.error('[Join] ❌ No phone number in payload. Keys received:', Object.keys(body).join(', '))
                return Response.json({
                    success: false,
                    message: '❌ No phone number provided',
                    token: 'ERR', position: 0, wait: 'N/A', clinicName: 'Unknown', name: 'Guest'
                }, { status: 200 })
            }

            // ── Builder Test Safeguard ─────────────────────────────────────────────
            if (
                !clinicCode ||
                clinicCode.includes('{') ||
                clinicCode.includes('}') ||
                clinicCode === 'PLACEHOLDER' ||
                clinicCode.includes('VARIABLE')
            ) {
                console.log('[Join] 🧪 Test mode detected — returning mock response')
                return Response.json({
                    success: true,
                    token: 'T001',
                    position: 0,
                    wait: 'You are next!',
                    clinicName: 'Demo Clinic',
                    name: name || 'Guest'
                }, { status: 200 })
            }

            // 1. Find clinic in Supabase
            const { data: clinic, error: clinicError } = await supabase
                .from('clinics')
                .select('*')
                .eq('code', clinicCode)
                .single()

            if (clinicError || !clinic) {
                console.error(`[Join] ❌ Clinic not found for code: "${clinicCode}"`, clinicError?.message)
                return Response.json({
                    success: false,
                    message: '❌ Invalid clinic code. Please scan the QR code again.',
                    token: 'ERR', position: 0, wait: 'N/A', clinicName: 'Unknown', name: name || 'Guest'
                }, { status: 200 })
            }

            // 2. Count patients in queue today
            const today = new Date().toISOString().split('T')[0]
            const { count } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinic.id)
                .eq('date', today)

            const position = count || 0
            const tokenNumber = `T${String(position + 1).padStart(3, '0')}`
            const waitMins = position === 0 ? 'You are next!' : `${position * 7} mins`

            // 3. Insert patient into queue
            const insertPayload = {
                clinic_id: clinic.id,
                token: tokenNumber,
                phone: cleanPhone(phone),
                name: name || 'Guest',
                language: language || 'en',
                status: 'waiting',
                amount_paid: 0,
                date: today,
                joined_at: new Date().toISOString()
            }
            console.log('[Join] Inserting patient:', JSON.stringify(insertPayload))

            const { error: insertError } = await supabase.from('patients').insert(insertPayload)

            if (insertError) {
                console.error('[Join] ❌ Insert failed:', insertError.message, insertError.details)
                return Response.json({ success: false, message: 'Failed to join queue', error: insertError.message }, { status: 500 })
            }

            console.log(`[Join] ✅ ${name} → ${tokenNumber} at ${clinic.name} (pos ${position})`)

            // 4. Send voice note (fire & forget)
            sendVoiceNote({
                phone: cleanPhone(phone),
                language: language || 'en',
                event: 'joined',
                token: tokenNumber,
                position,
                clinicName: clinic.name,
                baseUrl
            })

            // 5. Return token info back to Interakt Flow
            return Response.json({
                success: true,
                token: tokenNumber,
                position: position,
                wait: waitMins,
                clinicName: clinic.name,
                name: name || 'Guest'
            }, { status: 200 })
        }

        // ── CALLNEXT action ──────────────────────────────────────────────────────
        if (action === 'callnext') {
            const { patientPhone, patientName, token, language, clinicName } = body

            const msg = `🚨 *It's YOUR turn, ${patientName || 'Patient'}!*

🎟 Token *${token}* — Please go now!
🏥 ${clinicName}

Proceed to the doctor's cabin immediately! 🏥
Thank you for your patience 🙏

_Powered by TokenPe_`

            await sendInteraktText(patientPhone, msg)

            sendVoiceNote({
                phone: patientPhone,
                language: language || 'en',
                event: 'now',
                token,
                position: 0,
                clinicName,
                baseUrl
            })

            return Response.json({ success: true }, { status: 200 })
        }

        console.warn('[whatsapp] ⚠️ Unknown action received:', action)
        return Response.json({ error: 'Unknown action', receivedAction: action }, { status: 400 })

    } catch (error) {
        console.error('[whatsapp] 💥 Unhandled error:', error.message)
        return Response.json({ error: error.message }, { status: 500 })
    }
}

// ── WEBHOOK VERIFICATION (GET) ───────────────────────────────────────────────
export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const mode      = searchParams.get('hub.mode')
    const token     = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 })
    }

    // Simple health check when hit directly in browser
    return Response.json({
        status: 'ok',
        message: 'TokenPe WhatsApp Webhook is live ✅',
        hint: 'POST to this URL with ?secret=<WEBHOOK_VERIFY_TOKEN>',
        envCheck: {
            WEBHOOK_VERIFY_TOKEN: !!process.env.WEBHOOK_VERIFY_TOKEN,
            INTERAKT_API_KEY: !!process.env.INTERAKT_API_KEY,
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '(not set)'
        }
    }, { status: 200 })
}