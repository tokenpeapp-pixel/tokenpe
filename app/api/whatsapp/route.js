// FILE: /app/api/whatsapp/route.js
// Handles: join action (from Interakt Flow webhook)
// Also handles: callnext action (from dashboard)

import { after } from 'next/server'
import { supabase, getISTDateString } from '../../../lib/supabase'
import { sendText, sendVoice, cleanPhone } from '../../../lib/messaging'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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

        // ── 🔍 Write payload as a log entry into Supabase ───────────────────
        try {
            await supabase.from('patients').insert({
                clinic_id: '37785603-d390-4565-9fef-7f076b18de79', // Dr Sharma Clinic ID for logs
                token: 'LOG',
                phone: '0000000000',
                name: `PAYLOAD: ${JSON.stringify(body)}`.slice(0, 255),
                language: 'en',
                status: 'skipped', // skipped so it doesn't clutter dashboard
                date: getISTDateString(),
                joined_at: new Date().toISOString()
            })
        } catch (logErr) {
            console.error('[whatsapp] Failed to write payload log:', logErr.message)
        }

        // ── 🔍 FULL PAYLOAD LOG — helps debug Interakt variable names ──────────
        console.log('[whatsapp] ✅ Received payload:', JSON.stringify(body, null, 2))

        const action = pick(body, 'action', 'Action', 'event', 'type')
        const baseUrl = new URL(req.url).origin

        // ── JOIN action ──────────────────────────────────────────────────────────
        if (action === 'join') {

            // Accept multiple possible field names from Interakt Flow
            const phone    = pick(body, 'phone', 'Phone', 'mobile', 'customer_phone', 'waPhone', 'whatsapp')
            const name     = pick(body, 'name', 'Name', 'customer_name', 'patientName', 'fullName', 'full_name')
            const rawLanguage = pick(body, 'language', 'Language', 'lang', 'preferred_language') || 'en'

            // Map Interakt list position numbers to language codes
            // 1=मराठी 2=हिंदी 3=English 4=ગુજરાતી 5=ਪੰਜਾਬੀ 6=தமிழ் 7=తెలుగు 8=বাংলা 9=ಕನ್ನಡ 10=മലയാളം
            const languageMap = {
                '1': 'mr', 'marathi': 'mr', 'मराठी': 'mr',
                '2': 'hi', 'hindi': 'hi', 'हिंदी': 'hi', 'हिन्दी': 'hi',
                '3': 'en', 'english': 'en',
                '4': 'gu', 'gujarati': 'gu', 'ગુજરાતી': 'gu',
                '5': 'pa', 'punjabi': 'pa', 'ਪੰਜਾਬੀ': 'pa',
                '6': 'ta', 'tamil': 'ta', 'தமிழ்': 'ta',
                '7': 'te', 'telugu': 'te', 'తెలుగు': 'te',
                '8': 'bn', 'bengali': 'bn', 'বাংলা': 'bn',
                '9': 'kn', 'kannada': 'kn', 'ಕನ್ನಡ': 'kn',
                '10': 'ml', 'malayalam': 'ml', 'മലയാളം': 'ml',
            }
            const language = languageMap[String(rawLanguage).toLowerCase()] || languageMap[String(rawLanguage)] || rawLanguage || 'en'

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

            // 1.5 Check if queue is paused
            if (clinic.queue_paused) {
                console.log(`[Join] ❌ Queue is paused for ${clinic.name}`)
                const pausedMsg = `❌ *Queue Paused*\n\nThe queue is currently paused by the clinic.\n\nPlease try again later.`
                await sendText(cleanPhone(phone), pausedMsg)
                
                return Response.json({
                    success: false,
                    message: 'Queue is currently paused.',
                    token: 'PAUSED', position: 0, wait: 'N/A', clinicName: clinic.name, name: name || 'Guest'
                }, { status: 200 })
            }

            // 2. Count patients in queue today
            const today = getISTDateString()
            const { count } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinic.id)
                .eq('date', today)

            const position = count || 0

            // 2.5 Check subscription limits
            const planId = clinic.plan_id || 'starter' // default to starter
            const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
            
            if (position >= limit) {
                console.log(`[Join] ❌ Limit reached for ${clinic.name}: ${position}/${limit}`)
                const limitMsg = `❌ *Queue Full*\n\nThe clinic has reached its maximum daily patient limit.\n\nPlease ask the clinic reception to upgrade their TokenPe plan to add more patients today.`
                await sendText(cleanPhone(phone), limitMsg)
                
                return Response.json({
                    success: false,
                    message: 'Daily queue limit reached.',
                    token: 'FULL', position: 0, wait: 'N/A', clinicName: clinic.name, name: name || 'Guest'
                }, { status: 200 })
            }

            // Calculate people actually waiting ahead
            const { count: peopleAhead } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinic.id)
                .eq('date', today)
                .in('status', ['waiting', 'called'])

            // Calculate dynamic wait time for Pro/Elite based on doctor's speed today
            let avgWaitPerPatient = 7 // Default 7 mins
            if (planId !== 'starter') {
                const { data: recentDone } = await supabase
                    .from('patients')
                    .select('completed_at')
                    .eq('clinic_id', clinic.id)
                    .eq('date', today)
                    .eq('status', 'done')
                    .not('completed_at', 'is', null)
                    .order('completed_at', { ascending: false })
                    .limit(10)

                if (recentDone && recentDone.length >= 2) {
                    let totalDiffMs = 0
                    let diffCount = 0
                    for (let i = 0; i < recentDone.length - 1; i++) {
                        const t1 = new Date(recentDone[i].completed_at).getTime()
                        const t2 = new Date(recentDone[i+1].completed_at).getTime()
                        const diffMs = t1 - t2
                        // Ignore huge gaps (> 30 mins) as the doctor might have taken a break
                        if (diffMs >= 60000 && diffMs <= 1800000) {
                            totalDiffMs += diffMs
                            diffCount++
                        }
                    }
                    if (diffCount > 0) {
                        const calculatedAvg = Math.round((totalDiffMs / diffCount) / 60000)
                        // Keep reasonable bounds (min 2 mins, max 15 mins)
                        avgWaitPerPatient = Math.max(2, Math.min(calculatedAvg, 15))
                    }
                }
            }

            const tokenNumber = `T${String(position + 1).padStart(3, '0')}`
            const waitTimeNum = (peopleAhead || 0) * avgWaitPerPatient
            let waitMins = (peopleAhead === 0) ? 'You are next!' : `${waitTimeNum} mins`
            if (planId !== 'starter' && peopleAhead > 0) {
                waitMins = `Predicted Wait Time: ~${waitTimeNum} mins`
            }

            // 3. Insert patient into queue + send voice note — in parallel
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

            // 4. Send voice note and custom welcome text in background
            if (planId !== 'starter') {
                after(async () => {
                    try {
                        if (clinic.welcome_message) {
                            await sendText(cleanPhone(phone), `*Message from ${clinic.name}:*\n\n${clinic.welcome_message}`)
                        }
                        
                        await sendVoice({
                            phone: cleanPhone(phone),
                            language: language || 'en',
                            event: 'joined',
                            token: tokenNumber,
                            position,
                            clinicName: clinic.name
                        })
                    } catch (err) {
                        console.error('[Voice Background Error]', err)
                    }
                })
            }

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

            after(async () => {
                try {
                    await Promise.all([
                        sendText(patientPhone, msg),
                        sendVoice({ phone: patientPhone, language: language || 'en', event: 'now', token, clinicName })
                    ])
                } catch (err) {
                    console.error('[CallNext Background Error]', err)
                }
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