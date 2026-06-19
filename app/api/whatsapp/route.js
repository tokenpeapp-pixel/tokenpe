// FILE: /app/api/whatsapp/route.js
// Handles: join action (from Interakt Flow webhook)
// Also handles: callnext action (from dashboard)

import { after } from 'next/server'
import { supabase, supabaseAdmin, getISTDateString } from '../../../lib/supabase'
import { sendText, sendVoice, sendTextAndVoice, cleanPhone } from '../../../lib/messaging'
import crypto from 'crypto'
import { maskPhone, maskName, maskSecret } from '../../../lib/mask'
import { sanitizeName, validatePhone, validateClinicCode, validateRating, extractInteraktListReply, parseVisitRating, parseCrmRating, parseCrmFeedbackText } from '../../../lib/validate'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function findRecentDonePatient(phone) {
    const clean = cleanPhone(phone)
    const tenDigit = clean.startsWith('91') ? clean.slice(2) : clean
    const variants = [...new Set([clean, tenDigit, `91${tenDigit}`])]

    for (const variant of variants) {
        const { data } = await supabaseAdmin
            .from('patients')
            .select('id, rating, phone, name, clinic_id')
            .eq('phone', variant)
            .eq('status', 'done')
            .order('completed_at', { ascending: false, nullsFirst: false })
            .limit(1)

        if (data?.length) return data[0]
    }
    return null
}

async function sendRatingThankYou(phone, rating, patientName) {
    const stars = '⭐'.repeat(rating)
    const name = patientName || 'Patient'
    await sendText(
        cleanPhone(phone),
        `🙏 *Thank You, ${name}!*\n\nWe have recorded your ${stars} rating.\nWe appreciate your feedback!`
    )
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

        const body = await req.json()
        const action = pick(body, 'action', 'Action', 'event', 'type')
        const listReply = extractInteraktListReply(body)

        // 🛡️ Webhook Security
        // Interakt sends TWO types of webhooks to this endpoint:
        //   1. Flow webhooks (join) — include ?secret= in URL
        //   2. Message webhooks (ratings, replies) — come from Interakt's "Webhook URL" setting, no ?secret= param
        // For message webhooks, we verify by checking for standard Interakt payload structure
        const isInteraktMessage = (
            action === 'message_received' || action === 'message' || action === 'reply' || action === 'feedback' || action === 'rate' ||
            !!listReply
        ) && (
            body.data?.customer || body.data?.message || body.customer || body.message || !!listReply
        )

        if (!isInteraktMessage) {
            // For non-message webhooks (join, callnext), require the secret
            const expectedSecret = process.env.WEBHOOK_VERIFY_TOKEN || ''
            const isValid = expectedSecret && secret && 
                secret.length === expectedSecret.length &&
                crypto.timingSafeEqual(
                    Buffer.from(secret),
                    Buffer.from(expectedSecret)
                )

            if (!isValid) {
                console.error(`[whatsapp] ❌ Unauthorized — Invalid webhook secret. Received: ${maskSecret(secret)}`)
                return Response.json({
                    success: false,
                    message: '❌ Unauthorized. Invalid webhook secret.'
                }, { status: 401 })
            }
        }



        // ── 🔍 FULL PAYLOAD LOG — helps debug Interakt variable names ──────────
        // console.log('[whatsapp] ✅ Received payload:', JSON.stringify(body, null, 2))
        console.log(`[whatsapp] ✅ Received action: ${action}`)

        const baseUrl = new URL(req.url).origin

        // ── MESSAGE / RATING RECEIVED ─────────────────────────────────────────────
        const interactiveTitle = listReply?.title || body.data?.message?.interactive?.list_reply?.title || body.message?.interactive?.list_reply?.title || ''
        const interactiveId = listReply?.id || body.data?.message?.interactive?.list_reply?.id || body.message?.interactive?.list_reply?.id || ''
        const rawText = interactiveTitle || interactiveId || pick(body, 'text', 'rating', 'Rating', 'score', 'message', 'body') || (body.data?.message?.text) || (body.message?.text) || (body.message?.message) || ''
        const textStr = String(rawText).trim()
        const textStrLower = textStr.toLowerCase()
        const parsedCrmRating = parseCrmRating(body, textStr)
        const parsedVisitRating = parsedCrmRating ? null : parseVisitRating(body, textStr)
        const isRatingReply = !!listReply ||
                              parsedVisitRating !== null ||
                              parsedCrmRating !== null ||
                              textStrLower.startsWith('rate_')

        if (action === 'message_received' || action === 'message' || action === 'rate' || action === 'reply' || action === 'feedback' || isRatingReply) {
            const customerData = body.data?.customer || body.customer || body
            const phoneStr = customerData?.phone_number || customerData?.phoneNumber || pick(body, 'phone', 'Phone', 'mobile', 'waPhone', 'whatsapp', 'customer_phone')
            const phone = validatePhone(phoneStr)

            if (phone && (textStr || listReply || parsedVisitRating !== null || parsedCrmRating !== null)) {
                console.log(`[whatsapp] Incoming message from ${maskPhone(phone)}: "${textStr.slice(0, 50)}"${listReply ? ` [list id=${listReply.id}]` : ''}`)
                
                const clean = cleanPhone(phone)
                const tenDigit = clean.startsWith('91') ? clean.slice(2) : clean

                // 1. CRM rating (C1–C5 from list reply or text)
                if (parsedCrmRating) {
                    const crmRating = parsedCrmRating
                    const feedbackText = parseCrmFeedbackText(textStr)
                    
                    let { data: latestPatient } = await supabaseAdmin.from('patients').select('id, crm_rating, name, clinic_id').eq('phone', clean).order('joined_at', { ascending: false }).limit(1).single()
                    if (!latestPatient) {
                        const { data } = await supabaseAdmin.from('patients').select('id, crm_rating, name, clinic_id').eq('phone', tenDigit).order('joined_at', { ascending: false }).limit(1).single()
                        latestPatient = data
                    }

                    if (latestPatient?.id) {
                        const { data: patientClinic, error: clinicError } = await supabaseAdmin
                            .from('clinics')
                            .select('plan_id, subscription_status')
                            .eq('id', latestPatient.clinic_id)
                            .single()

                        const crmAllowed = !clinicError && patientClinic &&
                            (patientClinic.plan_id === 'elite' || patientClinic.subscription_status === 'trialing')

                        if (!crmAllowed) {
                            console.warn(`[whatsapp] ⚠️ CRM rating ignored for patient ${latestPatient.id} because clinic plan is not Elite/trialing.`)
                            await sendText(clean, `🙏 Thank you! CRM feedback is available only for Elite and trial clinics.`)
                            return Response.json({ success: true, message: 'CRM rating ignored for non-Elite/non-trial clinic' }, { status: 200 })
                        }

                        if (!latestPatient.crm_rating) {
                            await supabaseAdmin
                                .from('patients')
                                .update({ 
                                    crm_rating: crmRating, 
                                    feedback_text: feedbackText || null,
                                    feedback_at: new Date().toISOString()
                                })
                                .eq('id', latestPatient.id)
                            console.log(`[whatsapp] ✅ Saved CRM rating=${crmRating} for patient ${latestPatient.id}`)
                        } else {
                            console.log(`[whatsapp] ⏭️ CRM rating already exists for patient ${latestPatient.id}`)
                        }
                    }

                    await sendText(clean, `🙏 *Thank You!*\n\nWe have recorded your feedback for our recent update!`)
                    return Response.json({ success: true, message: 'CRM Rating processed' }, { status: 200 })
                }
                
                // 2. Normal visit rating (1–5 stars)
                const rating = parsedVisitRating ?? validateRating(interactiveId)
                
                if (rating) {
                    const recent = await findRecentDonePatient(phone)

                    if (recent?.id) {
                        const { data: clinicInfo, error: clinicError } = await supabaseAdmin
                            .from('clinics')
                            .select('plan_id, subscription_status')
                            .eq('id', recent.clinic_id)
                            .single()

                        const normalAllowed = !clinicError && clinicInfo &&
                            (clinicInfo.plan_id === 'pro' || clinicInfo.plan_id === 'elite' || clinicInfo.subscription_status === 'trialing')

                        if (!normalAllowed) {
                            console.warn(`[whatsapp] ⚠️ Normal rating ignored for patient ${recent.id} because clinic plan is not Pro/Elite/Trial.`)
                            await sendText(clean, `🙏 Thank you! Star ratings are available only for Pro, Elite, and trial clinics.`)
                            return Response.json({ success: true, message: 'Normal rating ignored for ineligible plan' }, { status: 200 })
                        }

                        if (!recent.rating) {
                            await supabaseAdmin.from('patients').update({
                                rating,
                                feedback_at: new Date().toISOString()
                            }).eq('id', recent.id)
                            console.log(`[whatsapp] ✅ Saved Normal rating=${rating} for patient ${recent.id}`)
                            
                            // Recalculate clinic avg_rating
                            try {
                                const { data: ratedPatients } = await supabaseAdmin
                                    .from('patients')
                                    .select('rating')
                                    .eq('clinic_id', recent.clinic_id)
                                    .gt('rating', 0)
                                    
                                if (ratedPatients) {
                                    const totalRating = ratedPatients.reduce((sum, p) => sum + p.rating, 0)
                                    const avgRating = ratedPatients.length > 0 ? parseFloat((totalRating / ratedPatients.length).toFixed(1)) : 0
                                    await supabaseAdmin
                                        .from('clinics')
                                        .update({ avg_rating: avgRating })
                                        .eq('id', recent.clinic_id)
                                }
                            } catch (calcErr) {
                                console.error('[whatsapp] failed to update clinic avg_rating:', calcErr)
                            }

                        } else {
                            console.log(`[whatsapp] ⏭️ Normal rating already exists for patient ${recent.id}`)
                        }
                    } else {
                        console.warn(`[whatsapp] ⚠️ No recent done patient found for ${maskPhone(phone)} to save rating=${rating}`)
                    }

                    await sendRatingThankYou(clean, rating, recent?.name)
                    return Response.json({ success: true, message: 'Normal Rating processed' }, { status: 200 })
                }
            }
            
            // If it's just a regular message, return 200 to acknowledge
            if (action === 'message_received' || action === 'message' || action === 'reply') {
                return Response.json({ success: true, message: 'Message acknowledged' }, { status: 200 })
            }
        }

        // ── JOIN action ──────────────────────────────────────────────────────────
        if (action === 'join') {

            // Accept multiple possible field names from Interakt Flow
            const rawPhone   = pick(body, 'phone', 'Phone', 'mobile', 'customer_phone', 'waPhone', 'whatsapp')
            const rawName    = pick(body, 'name', 'Name', 'customer_name', 'patientName', 'fullName', 'full_name')
            const rawLanguage = pick(body, 'language', 'Language', 'lang', 'preferred_language') || 'en'
            
            const phone = validatePhone(rawPhone)
            const name = sanitizeName(rawName) || 'Guest'

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

            // Accept clinic code variants + aggressively clean to handle mobile QR scanner bugs (e.g. JOIN%20CODE, JOIN+CODE, JOIN CITY HO 123)
            let rawCode = String(
                pick(body, 'clinicCode', 'clinic_code', 'cliniccode', 'code', 'Code', 'JOIN') || ''
            )
            // 1. Decode any URL artifacts (in case the QR scanner failed to decode ?text=)
            // 2. Replace the word "JOIN" (case insensitive)
            // 3. Remove ALL non-alphanumeric characters (spaces, %, dashes, etc.)
            const cleanedCode = decodeURIComponent(rawCode).replace(/\+/g, ' ').replace(/JOIN/i, '').replace(/[^A-Z0-9]/gi, '')
            
            const clinicCode = validateClinicCode(cleanedCode)

            console.log(`[Join] phone=${maskPhone(phone)} | name=${maskName(name)} | lang=${language} | clinicCode=${clinicCode}`)

            if (!phone) {
                console.error('[Join] ❌ No phone number in payload. Keys received:', Object.keys(body).join(', '))
                return Response.json({
                    success: false,
                    message: '❌ Invalid phone number format',
                    token: 'ERR', position: 0, wait: 'N/A', clinicName: 'Unknown', name: name
                }, { status: 200 })
            }

            // ── Builder Test Safeguard ─────────────────────────────────────────────
            const isTestPayload = rawCode.includes('{') || rawCode.includes('}') || rawCode === 'PLACEHOLDER' || rawCode.includes('VARIABLE')
            if (isTestPayload) {
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

            if (!clinicCode) {
                console.error(`[Join] ❌ Invalid or missing clinic code. rawCode was: "${rawCode}"`)
                return Response.json({
                    success: false,
                    message: '❌ Invalid clinic code. Please scan the QR code again.',
                    token: 'ERR', position: 0, wait: 'N/A', clinicName: 'Unknown', name: name || 'Guest'
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
            
            // Item 5: Rate limit joins (3 per phone per day, unique names)
            const cleanedPhone = cleanPhone(phone)
            const { data: existingJoins } = await supabase
                .from('patients')
                .select('name')
                .eq('clinic_id', clinic.id)
                .eq('phone', cleanedPhone)
                .eq('date', today)

            if (existingJoins && existingJoins.length >= 3) {
                console.log(`[Join] ❌ Rate limit reached for ${maskPhone(phone)} at ${clinic.name}`)
                await sendText(cleanedPhone, `❌ *Limit Reached*\n\nYou can only join the queue 3 times per day from the same phone number.`)
                return Response.json({
                    success: false,
                    message: 'Daily join limit reached for this phone number.',
                    token: 'LIMIT', position: 0, wait: 'N/A', clinicName: clinic.name, name: name
                }, { status: 200 })
            }

            if (existingJoins?.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                console.log(`[Join] ❌ Duplicate name for ${maskPhone(phone)}: ${maskName(name)}`)
                await sendText(cleanedPhone, `❌ *Already Joined*\n\nA patient named "${name}" has already joined the queue today from this phone number.`)
                return Response.json({
                    success: false,
                    message: 'A patient with this name has already joined.',
                    token: 'DUPE', position: 0, wait: 'N/A', clinicName: clinic.name, name: name
                }, { status: 200 })
            }
            
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
                phone: cleanedPhone,
                name: name,
                language: language || 'en',
                status: 'waiting',
                amount_paid: 0,
                date: today,
                joined_at: new Date().toISOString()
            }
            console.log(`[Join] Inserting patient: token=${tokenNumber}`)

            const { error: insertError } = await supabaseAdmin.from('patients').insert(insertPayload)

            if (insertError) {
                console.error('[Join] ❌ Insert failed:', insertError.message, insertError.details)
                return Response.json({ success: false, message: 'Failed to join queue', error: insertError.message }, { status: 500 })
            }

            console.log(`[Join] ✅ ${maskName(name)} → ${tokenNumber} at ${clinic.name} (pos ${position})`)

            if (planId !== 'starter') {
                after(async () => {
                    try {
                        if (clinic.welcome_message && (planId === 'elite' || clinic.subscription_status === 'trialing')) {
                            await sendText(cleanedPhone, `*Message from ${clinic.name}:*\n\n${clinic.welcome_message}`)
                        }
                        
                        await sendVoice({
                            phone: cleanedPhone,
                            language: language || 'en',
                            event: 'joined',
                            token: tokenNumber,
                            position: peopleAhead || 0,
                            clinicName: clinic.name
                        })
                    } catch (err) {
                        console.error('[Voice Background Error]', err)
                        // Fallback: send text if Sarvam AI fails
                        const { buildVoiceText } = require('../../../lib/messaging')
                        const fallbackText = buildVoiceText({
                            language: language || 'en',
                            event: 'joined',
                            token: tokenNumber,
                            position: peopleAhead || 0,
                            clinicName: clinic.name
                        })
                        if (fallbackText) {
                            await sendText(cleanedPhone, `🎙️ *Voice Note Failed*\n\n${fallbackText}`)
                        }
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