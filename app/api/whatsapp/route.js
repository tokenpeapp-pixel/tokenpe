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
        console.warn('[Interakt] API key not configured')
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
                data: {
                    message: message
                }
            })
        })
        const data = await res.json()
        console.log(`[Interakt] → +91${phoneNumber}:`, JSON.stringify(data))
    } catch (err) {
        console.error('[Interakt] Error:', err)
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

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const { searchParams } = new URL(req.url)
        const secret = searchParams.get('secret')

        // 🛡️ Webhook Security
        if (secret !== process.env.WEBHOOK_VERIFY_TOKEN) {
            return Response.json({
                success: false,
                message: '❌ Unauthorized. Invalid webhook secret.'
            }, { status: 401 })
        }

        const body = await req.json()
        const { action } = body
        const baseUrl = new URL(req.url).origin

        // ── JOIN action ──────────────────────────────────────────────────────────
        if (action === 'join') {
            const { phone, name, language } = body

            // ── Extract clinic code from clinicCode field ──────────────────────────
            // Handles: "JOIN SHARMA001", "SHARMA001", "sharma001"
            const rawCode = (body.clinicCode || '').toString()
            const clinicCode = rawCode
                .replace(/^JOIN\s*/i, '')   // remove "JOIN " prefix if present
                .trim()
                .toUpperCase()

            console.log(`[Join] phone=${phone} name=${name} lang=${language} clinicCode=${clinicCode}`)

            // ── Builder Test Safeguard ─────────────────────────────────────────────
            // Return mock response if called from flow builder test
            if (
                !clinicCode ||
                clinicCode.includes('{') ||
                clinicCode.includes('}') ||
                clinicCode === 'PLACEHOLDER' ||
                clinicCode.includes('VARIABLE')
            ) {
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
                console.error(`[Join] Clinic not found: ${clinicCode}`)
                return Response.json({
                    success: false,
                    message: '❌ Invalid clinic code. Please scan the QR code again.',
                    token: 'ERR',
                    position: 0,
                    wait: 'N/A',
                    clinicName: 'Unknown',
                    name: name || 'Guest'
                }, { status: 200 })
            }

            // 2. Count waiting patients today
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
            const { error: insertError } = await supabase.from('patients').insert({
                clinic_id: clinic.id,
                token: tokenNumber,
                phone: cleanPhone(phone),
                name: name || 'Guest',
                language: language || 'en',
                status: 'waiting',
                amount_paid: 0,
                date: today,
                joined_at: new Date().toISOString()
            })

            if (insertError) {
                console.error('[Join] Insert error:', insertError)
                return Response.json({ success: false, message: 'Failed to join queue' }, { status: 500 })
            }

            console.log(`[Join] ✅ ${name} assigned ${tokenNumber} at ${clinic.name}`)

            // 4. Send voice note (joined event)
            sendVoiceNote({
                phone: cleanPhone(phone),
                language: language || 'en',
                event: 'joined',
                token: tokenNumber,
                position,
                clinicName: clinic.name,
                baseUrl
            })

            // 5. Return token info to Interakt Flow
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

            // Send "Your Turn" message
            const msg = `🚨 *It's YOUR turn, ${patientName || 'Patient'}!*

🎟 Token *${token}* — Please go now!
🏥 ${clinicName}

Proceed to the doctor's cabin immediately! 🏥
Thank you for your patience 🙏

_Powered by TokenPe_`

            await sendInteraktText(patientPhone, msg)

            // Send "Your Turn" voice note
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

        return Response.json({ error: 'Unknown action' }, { status: 400 })

    } catch (error) {
        console.error('[whatsapp] Error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}

// ── WEBHOOK VERIFICATION (Meta/GET) ─────────────────────────────────────────
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