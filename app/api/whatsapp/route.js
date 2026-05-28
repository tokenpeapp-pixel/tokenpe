// FILE: /app/api/whatsapp/route.js
// Handles: join action (from Interakt Flow webhook)
// Also handles: callnext action (from dashboard)

import { after } from 'next/server'
import { supabase, getISTDateString } from '../../../lib/supabase'
import { sendText, sendVoice, sendTextAndVoice, cleanPhone } from '../../../lib/messaging'

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
                // Await to ensure Vercel doesn't kill the function before sending
                await sendTextAndVoice({
                    phone: cleanPhone(phone),
                    language: language,
                    event: 'paused',
                    clinicName: clinic.name,
                    textMessage: pausedMsg
                })
                
                // Return 200 so Interakt flow continues, but we return token 'PAUSED'
                return Response.json({
                    success: false,
                    message: 'Queue is currently paused.',
                    token: 'PAUSED', position: 0, wait: 'N/A', clinicName: clinic.name, name: name || 'Guest'
                }, { status: 200 })
            }

            // 2. Count patients & calculate waits in PARALLEL
            const today = getISTDateString()
            const planId = clinic.plan_id || 'starter' // default to starter
            
            const [
                { count },
                { count: peopleAhead },
                { data: recentDone }
            ] = await Promise.all([
                // Total patients today
                supabase.from('patients').select('*', { count: 'exact', head: true })
                    .eq('clinic_id', clinic.id).eq('date', today),
                // People waiting ahead
                supabase.from('patients').select('*', { count: 'exact', head: true })
                    .eq('clinic_id', clinic.id).eq('date', today).in('status', ['waiting', 'called']),
                // Recent done for dynamic wait time
                planId !== 'starter' 
                    ? supabase.from('patients').select('completed_at')
                        .eq('clinic_id', clinic.id).eq('date', today).eq('status', 'done')
                        .not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(10)
                    : Promise.resolve({ data: null })
            ])

            const position = count || 0
            const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
            
            if (position >= limit) {
                console.log(`[Join] ❌ Limit reached for ${clinic.name}: ${position}/${limit}`)
                const limitMsg = `❌ *Queue Full*\n\nThe clinic has reached its maximum daily patient limit.\n\nPlease ask the clinic reception to upgrade their TokenPe plan to add more patients today.`
                // Await to ensure Vercel doesn't kill the function before sending
                await sendText(cleanPhone(phone), limitMsg)
                
                return Response.json({
                    success: false,
                    message: 'Daily queue limit reached.',
                    token: 'FULL', position: 0, wait: 'N/A', clinicName: clinic.name, name: name || 'Guest'
                }, { status: 200 })
            }

            // Calculate dynamic wait time for Pro/Elite based on doctor's speed today
            let avgWaitPerPatient = 7 // Default 7 mins
            if (planId !== 'starter' && recentDone && recentDone.length >= 2) {
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
                            position: peopleAhead || 0,
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
                position: peopleAhead || 0,
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

        // ── RATE action (or auto-detect from reply) ──────────────────────────────
        const rawText = pick(body, 'text', 'rating', 'Rating', 'score', 'message', 'body') || ''
        const textStr = String(rawText).trim().toLowerCase()
        const starCount = (textStr.match(/⭐/g) || []).length
        const isRatingReply = starCount > 0 || 
                              textStr.includes('excellent') || 
                              textStr.includes('good') || 
                              textStr.includes('average') || 
                              textStr.includes('fair') || 
                              textStr.includes('poor') ||
                              textStr.startsWith('rate_') ||
                              /^[1-5]$/.test(textStr)

        console.log(`[Rating Debug] action=${action} | rawText="${rawText}" | textStr="${textStr}" | isRatingReply=${isRatingReply}`)

        if (action === 'rate' || action === 'reply' || action === 'message' || action === 'feedback' || isRatingReply) {
            const phone = pick(body, 'phone', 'Phone', 'mobile', 'waPhone', 'whatsapp', 'customer_phone')
            
            // First check if there are star emojis
            let rating = starCount
            
            // If no stars, try to find a digit 1-5
            if (rating === 0) {
                const match = String(rawText).trim().match(/^[1-5]$/)
                if (match) {
                    rating = parseInt(match[0])
                } else {
                    // Try extracting any digit from the text
                    const digitMatch = String(rawText).match(/[1-5]/)
                    rating = digitMatch ? parseInt(digitMatch[0]) : 0
                }
            }

            console.log(`[Rating Debug] phone=${phone} | rating=${rating}`)

            if (!phone || rating < 1 || rating > 5) {
                console.warn(`[Rating] ❌ Invalid: phone=${phone}, rating=${rating}`)
                return Response.json({ success: false, message: 'Invalid rating (must be 1-5)' }, { status: 400 })
            }

            const clean = cleanPhone(phone)
            const tenDigit = clean.startsWith('91') ? clean.slice(2) : clean
            
            // Find their most recent 'done' visit — try both phone formats
            let { data: recent } = await supabase
                .from('patients')
                .select('id, rating, phone')
                .eq('phone', clean)
                .eq('status', 'done')
                .order('joined_at', { ascending: false })
                .limit(1)

            // If not found with 12-digit, try 10-digit
            if (!recent || recent.length === 0) {
                const { data: recent2 } = await supabase
                    .from('patients')
                    .select('id, rating, phone')
                    .eq('phone', tenDigit)
                    .eq('status', 'done')
                    .order('joined_at', { ascending: false })
                    .limit(1)
                recent = recent2
            }

            console.log(`[Rating Debug] Found patient:`, JSON.stringify(recent))

            if (recent && recent.length > 0 && !recent[0].rating) {
                const { error: updateErr } = await supabase.from('patients').update({ rating }).eq('id', recent[0].id)
                if (updateErr) {
                    console.error(`[Rating] ❌ Update failed:`, updateErr.message)
                } else {
                    console.log(`[Rating] ✅ Saved rating=${rating} for patient ${recent[0].id}`)
                }
            } else if (recent && recent.length > 0 && recent[0].rating) {
                console.log(`[Rating] ℹ️ Patient already rated: ${recent[0].rating}`)
            } else {
                console.warn(`[Rating] ❌ No 'done' patient found for phone: ${clean} / ${tenDigit}`)
            }

            after(async () => {
                const stars = '⭐'.repeat(rating)
                await sendText(clean, `🙏 *Thank You!*\n\nWe have recorded your ${stars} rating. We appreciate your feedback!`)
            })

            return Response.json({ success: true, rating }, { status: 200 })
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