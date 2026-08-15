// FILE: /app/api/whatsapp/route.js
// Handles: join action (from Interakt Flow webhook)
// Also handles: callnext action (from dashboard)

import { after } from 'next/server'
import { supabase, supabaseAdmin, getISTDateString } from '../../../lib/supabase'
import { sendText, sendVoice, sendTextAndVoice, cleanPhone, buildVoiceText } from '../../../lib/messaging'
import crypto from 'crypto'
import { maskPhone, maskName, maskSecret } from '../../../lib/mask'
import { sanitizeName, validatePhone, validateClinicCode, extractInteractiveReply, parseVisitRating, parseCrmRating, parseCrmFeedbackText } from '../../../lib/validate'
import { handleIncomingMessage } from '../../../lib/chatbot'
import { joinQueue } from '../../../lib/queue-manager'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'



// ── Resolve field with multiple possible variable names ─────────────
// Webhook variables might come as: customer_phone, phone, Phone, PHONE, etc.
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
        const action = pick(body, 'action', 'Action', 'event', 'type', 'eventName')

        // ── 🔍 FULL PAYLOAD LOG — helps debug variable names ──────────
        console.log('[whatsapp] ✅ Received payload:', JSON.stringify(body, null, 2))
        console.log(`[whatsapp] ✅ Received action: ${action}`)

        // ── EXTRACT TEXT & PHONE GLOBALLY ────────────────────────────────────────
        let textStr = ''
        let customerPhone = ''
        let listReply = null
        let isIncomingMessage = false

        // Check for Meta WhatsApp Cloud API payload
        const metaMessage = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
        
        if (metaMessage) {
            isIncomingMessage = true
            customerPhone = cleanPhone(metaMessage.from)
            listReply = extractInteractiveReply(metaMessage)
            textStr = metaMessage.text?.body || listReply?.id || ''
        } else {
            // Fallback for internal APIs (join, callnext, etc) or old MSG91 tests
            listReply = extractInteractiveReply(body)
            textStr = (
                body.data?.message?.text?.body ||
                body.message?.text?.body ||
                body.data?.text?.body ||
                body.text?.body ||
                body.data?.message?.text ||
                body.text ||
                body.textMessage ||
                listReply?.id ||
                ''
            )
            if (typeof textStr === 'object') {
                textStr = JSON.stringify(textStr)
            }
            
            customerPhone = cleanPhone(
                body.data?.customer?.channel_phone_number ||
                body.data?.customer?.phone_number ||
                pick(body, 'customer_phone', 'waPhone', 'phone', 'customer', 'customerNumber', 'sender') ||
                body.data?.customer?.phone ||
                body.data?.waPhone ||
                body.customerNumber ||
                body.sender
            )
            
            isIncomingMessage = !!listReply || !!textStr || (
                action === 'message_received' || action === 'message' || action === 'reply' || action === 'feedback' || action === 'rate' || action === 'inbound'
            )
        }

        if (!isIncomingMessage && body.object !== 'whatsapp_business_account') {
            // For non-message internal webhooks (join, callnext), require the secret
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

        const baseUrl = new URL(req.url).origin

        // ── RATING / INTERACTIVE REPLY — catch this FIRST before anything else ────

        // Also handle the direct Workflow webhook format:
        // { action: "feedback", phone: "{{1}}", rating: "{{2}}" }
        const directRating = body.rating ? parseInt(body.rating) : null
        if (directRating && directRating >= 1 && directRating <= 5 && customerPhone) {
            console.log(`[Rating] Direct Workflow rating ${directRating} from ${customerPhone}`)
            const phone10 = customerPhone.replace(/^91/, '')
            const phone12 = customerPhone.startsWith('91') ? customerPhone : '91' + customerPhone

            const { data: recentPatient } = await supabaseAdmin
                .from('queue_entries')
                .select('id, business_id')
                .or(`phone.eq.${phone10},phone.eq.${phone12}`)
                .eq('status', 'done')
                .gte('date', getISTDateString())
                .order('completed_at', { ascending: false })
                .limit(1)
                .single()

            if (recentPatient) {
                await supabaseAdmin
                    .from('queue_entries')
                    .update({ rating: directRating })
                    .eq('id', recentPatient.id)

                const { data: business } = await supabaseAdmin
                    .from('businesses').select('name, google_review_link').eq('id', recentPatient.business_id).single()

                const stars = '⭐'.repeat(directRating)
                await sendText(customerPhone, `🙏 *Thank You!*\n\nWe have recorded your ${stars} rating. We appreciate your feedback!\n\nThank you for visiting *${business?.name || 'our premises'}*. We hope to see you again soon! 🌟`)
                
                if (directRating >= 4 && business?.google_review_link) {
                    // Send Google Review link for 4 or 5 star ratings
                    setTimeout(async () => {
                        await sendText(customerPhone, `We're thrilled you had a great experience! 😊\n\nCould you take 30 seconds to leave us a quick review on Google? It really helps us out! 🙏\n\n👉 ${business.google_review_link}`)
                    }, 2000)
                }
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
                    .from('queue_entries')
                    .select('id, business_id')
                    .or(`phone.eq.${phone10},phone.eq.${phone12}`)
                    .eq('status', 'done')
                    .gte('date', getISTDateString())
                    .order('completed_at', { ascending: false })
                    .limit(1)
                    .single()

                if (recentPatient) {
                    await supabaseAdmin
                        .from('queue_entries')
                        .update({ rating: visitRating })
                        .eq('id', recentPatient.id)

                    const { data: business } = await supabaseAdmin
                        .from('businesses').select('name, google_review_link').eq('id', recentPatient.business_id).single()

                    const stars = '⭐'.repeat(visitRating)
                    await sendText(customerPhone, `🙏 *Thank You!*\n\nWe have recorded your ${stars} rating. We appreciate your feedback!\n\nThank you for visiting *${business?.name || 'our premises'}*. We hope to see you again soon! 🌟`)
                    
                    if (visitRating >= 4 && business?.google_review_link) {
                        // Send Google Review link for 4 or 5 star ratings
                        setTimeout(async () => {
                            await sendText(customerPhone, `We're thrilled you had a great experience! 😊\n\nCould you take 30 seconds to leave us a quick review on Google? It really helps us out! 🙏\n\n👉 ${business.google_review_link}`)
                        }, 2000)
                    }
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
                    .from('queue_entries')
                    .select('id, business_id')
                    .or(`phone.eq.${phone10},phone.eq.${phone12}`)
                    .order('joined_at', { ascending: false })
                    .limit(1)
                    .single()

                console.log(`[CRM Rating] Patient lookup — phone10: ${phone10}, phone12: ${phone12}, found:`, recentPatient?.id, 'err:', crmErr?.message)

                if (recentPatient) {
                    const feedbackText = parseCrmFeedbackText(textStr)
                    const { error: updateErr } = await supabaseAdmin
                        .from('queue_entries')
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

        // ── MESSAGE RECEIVED (Acknowledge non-rating messages & trigger chatbot) ──
        if (
            action === 'message_received' || action === 'message' || action === 'rate' || action === 'reply' || action === 'feedback' || action === 'delivered' || action === 'inbound' ||
            (!action && textStr && customerPhone)
        ) {
            if (textStr && customerPhone) {
                console.log(`[whatsapp] 🤖 Routing inbound message to Chatbot: ${customerPhone} -> ${textStr.substring(0, 50)}`)
                after(async () => {
                    await handleIncomingMessage(customerPhone, textStr, body)
                })
            }
            return Response.json({ success: true, message: 'Message acknowledged & routed to bot' }, { status: 200 })
        }

        // ── JOIN action ──────────────────────────────────────────────────────────
        if (action === 'join') {

            // Accept multiple possible field names
            const rawPhone   = pick(body, 'phone', 'Phone', 'mobile', 'customer_phone', 'waPhone', 'whatsapp', 'sender')
            const rawName    = pick(body, 'name', 'Name', 'customer_name', 'patientName', 'fullName', 'full_name')
            const rawLanguage = pick(body, 'language', 'Language', 'lang', 'preferred_language') || 'en'
            
            const phone = validatePhone(rawPhone)
            const name = sanitizeName(rawName) || 'Guest'

            // Map list position numbers to language codes
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
                pick(body, 'businessCode', 'clinic_code', 'cliniccode', 'code', 'Code', 'JOIN') || ''
            )
            // 1. Decode any URL artifacts (in case the QR scanner failed to decode ?text=)
            // 2. Replace the word "JOIN" (case insensitive)
            // 3. Remove ALL non-alphanumeric characters (spaces, %, dashes, etc.)
            const cleanedCode = decodeURIComponent(rawCode).replace(/\+/g, ' ').replace(/JOIN/i, '').replace(/[^A-Z0-9]/gi, '')
            
            const businessCode = validateClinicCode(cleanedCode)

            const result = await joinQueue({ phone, name, language, businessCode })
            return Response.json(result, { status: 200 })
        }

        // ── CALLNEXT action ──────────────────────────────────────────────────────
        if (action === 'callnext') {
            const { patientPhone, patientName, token, language, clinicName } = body

            // Check business type to set the correct dynamic message
            const { data: queueEntry } = await supabaseAdmin
                .from('queue_entries')
                .select('businesses(type)')
                .eq('token', token)
                .order('joined_at', { ascending: false })
                .limit(1).single()
                
            let destination = "the doctor's cabin"
            if (queueEntry?.businesses?.type === 'restaurant') destination = 'your table'
            else if (queueEntry?.businesses?.type === 'salon') destination = 'the stylist'
            else if (queueEntry?.businesses?.type === 'school') destination = 'the counter'
            else if (queueEntry?.businesses?.type === 'business') destination = 'the counter'

            const msg = `🚨 *It's YOUR turn, ${patientName || 'Patient'}!*

🎟 Token *${token}* — Please go now!
🏢 ${clinicName}

Proceed to ${destination} immediately! 🚀
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
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '(not set)'
        }
    }, { status: 200 })
}
