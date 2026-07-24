// FILE: /app/api/whatsapp/route.js
// Handles: join action (from Interakt Flow webhook)
// Also handles: callnext action (from dashboard)

import { after } from 'next/server'
import { supabase, supabaseAdmin, getISTDateString } from '../../../lib/supabase'
import { sendText, sendVoice, sendTextAndVoice, cleanPhone, buildVoiceText } from '../../../lib/messaging'
import crypto from 'crypto'
import { maskPhone, maskName, maskSecret } from '../../../lib/mask'
import { sanitizeName, validatePhone, validateClinicCode, extractInteraktListReply, parseVisitRating, parseCrmRating, parseCrmFeedbackText } from '../../../lib/validate'

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

        const body = await req.json()
        const action = pick(body, 'action', 'Action', 'event', 'type')
        const isInteraktMessage = (
            action === 'message_received' || action === 'message' || action === 'reply' || action === 'feedback' || action === 'rate'
        ) && (
            body.data?.customer || body.data?.message || body.customer || body.message
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
        console.log('[whatsapp] ✅ Received payload:', JSON.stringify(body, null, 2))
        console.log(`[whatsapp] ✅ Received action: ${action}`)

        const baseUrl = new URL(req.url).origin

        // ── RATING / INTERACTIVE REPLY — catch this FIRST before anything else ────
        // Interakt sends action values like: "message_received", "RECEIVED", "incoming",
        // or even no action at all for interactive list replies. So we check the payload
        // shape directly rather than relying on the action string.
        const listReply = extractInteraktListReply(body)
        const textStr = (
            body.data?.message?.text?.body ||
            body.message?.text?.body ||
            body.data?.text?.body ||
            body.text?.body ||
            body.data?.message?.text ||
            ''
        )
        const customerPhone = cleanPhone(
            body.data?.customer?.channel_phone_number ||
            body.data?.customer?.phone_number ||
            pick(body, 'customer_phone', 'waPhone', 'phone', 'customer') ||
            body.data?.customer?.phone ||
            body.data?.waPhone
        )

        // Also handle the direct Interakt Workflow webhook format:
        // { action: "feedback", phone: "{{1}}", rating: "{{2}}" }
        const directRating = body.rating ? parseInt(body.rating) : null
        if (directRating && directRating >= 1 && directRating <= 5 && customerPhone) {
            console.log(`[Rating] Direct Workflow rating ${directRating} from ${customerPhone}`)
            const phone10 = customerPhone.replace(/^91/, '')
            const phone12 = customerPhone.startsWith('91') ? customerPhone : '91' + customerPhone

            const { data: recentPatient } = await supabaseAdmin
                .from('patients')
                .select('id, clinic_id')
                .or(`phone.eq.${phone10},phone.eq.${phone12}`)
                .eq('status', 'done')
                .gte('date', getISTDateString())
                .order('completed_at', { ascending: false })
                .limit(1)
                .single()

            if (recentPatient) {
                await supabaseAdmin
                    .from('patients')
                    .update({ rating: directRating })
                    .eq('id', recentPatient.id)

                const { data: clinic } = await supabaseAdmin
                    .from('clinics').select('name').eq('id', recentPatient.clinic_id).single()

                const stars = '⭐'.repeat(directRating)
                await sendText(customerPhone, `🙏 *Thank You!*\n\nWe have recorded your ${stars} rating. We appreciate your feedback!\n\nThank you for visiting *${clinic?.name || 'our clinic'}*. We hope you feel better soon! 🌟`)
                console.log(`[Rating] ✅ Direct Workflow rating ${directRating} saved for patient ${recentPatient.id}`)
            } else {
                console.warn(`[Rating] ⚠️ No matching done patient found for ${customerPhone} today`)
            }
            return Response.json({ success: true, message: 'Rating saved via workflow' }, { status: 200 })
        }

        if (listReply || (textStr && customerPhone)) {
            console.log('[Rating] Interactive reply or text received. listReply:', JSON.stringify(listReply), 'text:', textStr, 'phone:', customerPhone)

            if (!customerPhone) {
                return Response.json({ success: true, message: 'Rating acknowledged (no phone)' }, { status: 200 })
            }

            // Is it a normal visit rating? (1–5)
            const visitRating = parseVisitRating(body, textStr)
            if (visitRating) {
                console.log(`[Rating] ${customerPhone} gave visit rating ${visitRating}`)
                const phone10 = customerPhone.replace(/^91/, '')
                const phone12 = customerPhone.startsWith('91') ? customerPhone : '91' + customerPhone

                const { data: recentPatient } = await supabaseAdmin
                    .from('patients')
                    .select('id, clinic_id')
                    .or(`phone.eq.${phone10},phone.eq.${phone12}`)
                    .eq('status', 'done')
                    .gte('date', getISTDateString())
                    .order('completed_at', { ascending: false })
                    .limit(1)
                    .single()

                if (recentPatient) {
                    await supabaseAdmin
                        .from('patients')
                        .update({ rating: visitRating })
                        .eq('id', recentPatient.id)

                    const { data: clinic } = await supabaseAdmin
                        .from('clinics').select('name').eq('id', recentPatient.clinic_id).single()

                    const stars = '⭐'.repeat(visitRating)
                    await sendText(customerPhone, `🙏 *Thank You!*\n\nWe have recorded your ${stars} rating. We appreciate your feedback!\n\nThank you for visiting *${clinic?.name || 'our clinic'}*. We hope you feel better soon! 🌟`)
                    console.log(`[Rating] ✅ Saved rating ${visitRating} for patient ${recentPatient.id}`)
                } else {
                    console.warn(`[Rating] ⚠️ No matching done patient found for ${customerPhone} today`)
                }
                return Response.json({ success: true, message: 'Visit rating saved' }, { status: 200 })
            }

            // Is it a CRM rating? (C1–C5)
            const crmRating = parseCrmRating(body, textStr)
            if (crmRating) {
                console.log(`[CRM Rating] ${customerPhone} gave CRM rating ${crmRating}`)

                // Query with both phone formats (10-digit and 12-digit) to handle any storage format
                const phone10 = customerPhone.replace(/^91/, '')
                const phone12 = customerPhone.startsWith('91') ? customerPhone : '91' + customerPhone

                const { data: recentPatient, error: crmErr } = await supabaseAdmin
                    .from('patients')
                    .select('id, clinic_id')
                    .or(`phone.eq.${phone10},phone.eq.${phone12}`)
                    .order('joined_at', { ascending: false })
                    .limit(1)
                    .single()

                console.log(`[CRM Rating] Patient lookup — phone10: ${phone10}, phone12: ${phone12}, found:`, recentPatient?.id, 'err:', crmErr?.message)

                if (recentPatient) {
                    const feedbackText = parseCrmFeedbackText(textStr)
                    const { error: updateErr } = await supabaseAdmin
                        .from('patients')
                        .update({
                            crm_rating: crmRating,
                            feedback_text: feedbackText || null,
                            feedback_at: new Date().toISOString()
                        })
                        .eq('id', recentPatient.id)
                    
                    if (updateErr) {
                        console.error(`[CRM Rating] ❌ DB update error:`, updateErr.message)
                    } else {
                        const crmStars = '⭐'.repeat(crmRating)
                        await sendText(customerPhone, `🙏 *Thank You!*\n\nWe have recorded your ${crmStars} rating. We appreciate your feedback!`)
                        console.log(`[CRM Rating] ✅ Saved CRM rating ${crmRating} for patient ${recentPatient.id}`)
                    }
                } else {
                    console.warn(`[CRM Rating] ⚠️ No patient found for phone ${phone10} / ${phone12}`)
                }
                return Response.json({ success: true, message: 'CRM rating saved' }, { status: 200 })
            }

            // Has text but not a rating — fall through to other handlers below
        }

        // ── MESSAGE RECEIVED (Acknowledge non-rating messages) ──
        if (action === 'message_received' || action === 'message' || action === 'rate' || action === 'reply' || action === 'feedback') {
            return Response.json({ success: true, message: 'Message acknowledged' }, { status: 200 })
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

            // 1.6 Check if clinic is closed for today
            const todayDate = getISTDateString()
            if (clinic.closed_today_date) {
                console.log(`[Join] ❌ Clinic "${clinic.name}" is closed for today`)
                const closedMsg = `🔴 *Clinic Closed for Today*\n\n${clinic.name} has ended today's session.\n\nPlease visit again tomorrow. We look forward to seeing you! 🙏\n\n_Powered by TokenPe_`
                await sendTextAndVoice({
                    phone: cleanPhone(phone),
                    language: language,
                    event: 'paused',  // reuse paused voice event as it conveys "unavailable"
                    clinicName: clinic.name,
                    textMessage: closedMsg
                })
                return Response.json({
                    success: false,
                    message: 'Clinic is closed for today.',
                    token: 'CLOSED', position: 0, wait: 'N/A', clinicName: clinic.name, name: name || 'Guest'
                }, { status: 200 })
            }

            // 2. Count patients & calculate waits in PARALLEL
            const today = getISTDateString()
            const planId = clinic.plan_id || 'starter' // default to starter
            
            // Item 5: Rate limit joins (3 per phone per day, max 2 per same name)
            const cleanedPhone = cleanPhone(phone)
            const { data: existingJoins } = await supabase
                .from('patients')
                .select('name')
                .eq('clinic_id', clinic.id)
                .eq('phone', cleanedPhone)
                .eq('date', today)

            if (existingJoins && existingJoins.length >= 3) {
                console.log(`[Join] ❌ Rate limit reached for ${maskPhone(phone)} at ${clinic.name}`)
                await sendText(cleanedPhone, `❌ *Limit Reached*\n\nYou have reached the maximum daily limit for this phone number.\n\nPlease visit the clinic to join via walk-in.`)
                return Response.json({
                    success: false,
                    message: 'Daily join limit reached for this phone number.',
                    token: 'LIMIT', position: 0, wait: 'N/A', clinicName: clinic.name, name: name
                }, { status: 200 })
            }

            const nameCount = existingJoins?.filter(p => p.name.toLowerCase() === name.toLowerCase()).length || 0;
            if (nameCount >= 2) {
                console.log(`[Join] ❌ Name limit reached for ${maskPhone(phone)}: ${maskName(name)}`)
                await sendText(cleanedPhone, `❌ *Limit Reached*\n\nA patient named "${name}" has already joined the queue twice today.\n\nTo join again, please visit the clinic and use the walk-in method.`)
                return Response.json({
                    success: false,
                    message: 'A patient with this name has reached the daily limit.',
                    token: 'DUPE', position: 0, wait: 'N/A', clinicName: clinic.name, name: name
                }, { status: 200 })
            }
            
            const [
                { count },
                { count: peopleAhead },
                { data: recentDone }
            ] = await Promise.all([
                // Total patients today
                supabaseAdmin.from('patients').select('*', { count: 'exact', head: true })
                    .eq('clinic_id', clinic.id).eq('date', today),
                // People waiting ahead
                supabaseAdmin.from('patients').select('*', { count: 'exact', head: true })
                    .eq('clinic_id', clinic.id).eq('date', today).in('status', ['waiting', 'called']),
                // Recent done for dynamic wait time
                planId !== 'starter' 
                    ? supabaseAdmin.from('patients').select('completed_at')
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
