import { sendText, sendInteractiveList, sendInteractiveButton } from './messaging'
import { supabaseAdmin } from './supabase'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
})


// Fallback to fetch directly since we are on the same Next.js server
// We'll simulate hitting the /api/whatsapp route by importing the logic if needed,
// but for now let's just make a fetch call locally.
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'


/**
 * Handles incoming WhatsApp messages for the Clinic Bot mode.
 */
export async function handleClinicMessage(senderPhone, messageText, session) {
    const text = (messageText || '').toLowerCase().trim()
    console.log(`[ClinicBot] Received from ${senderPhone}: ${text}`)

    if (!text) return

    // Extract clinic_id from session data
    const clinicId = session?.data?.clinic_id
    let clinic = null
    
    if (clinicId) {
        const { data } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('id', clinicId)
            .single()
        clinic = data
    }

    const currentState = session?.state || 'idle'

    // ==========================================
    // QR CODE JOIN FLOW
    // ==========================================
    if (text.startsWith('join ')) {
        const code = text.replace('join ', '').toUpperCase().replace(/[^A-Z0-9]/g, '')
        
        // Look up clinic by code
        const { data: foundClinic } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('code', code)
            .single()
            
        if (!foundClinic) {
            return await sendText(senderPhone, "❌ Invalid clinic code. Please try scanning the QR code again.")
        }
        
        // Save clinic to session
        await setSessionState(senderPhone, 'qr_join_confirm', { ...session.data, mode: 'clinic', clinic_id: foundClinic.id, businessCode: code })
        
        return await sendInteractiveButton(
            senderPhone, 
            `🏥 Welcome to ${foundClinic.name}!\n\nYou are about to join today's OPD queue.\n\nTap the button below to confirm your spot 👇`,
            [{ id: "btn_join_queue", title: "✅ Join Queue" }]
        )
    }

    if (currentState === 'qr_join_confirm') {
        if (text === 'btn_join_queue' || text.includes('join queue')) {
            await setSessionState(senderPhone, 'qr_join_name', session.data)
            return await sendText(senderPhone, "👤 Please enter your full name 👇")
        } else {
            return await sendInteractiveButton(
                senderPhone, 
                `🏥 You are about to join today's OPD queue.\n\nTap the button below to confirm your spot 👇`,
                [{ id: "btn_join_queue", title: "✅ Join Queue" }]
            )
        }
    }

    if (currentState === 'qr_join_name') {
        const name = messageText.trim()
        await setSessionState(senderPhone, 'qr_join_language', { ...session.data, patient_name: name })
        
        const langSections = [
            {
                title: "Select Language",
                rows: [
                    { id: "lang_en", title: "English" },
                    { id: "lang_hi", title: "हिंदी (Hindi)" },
                    { id: "lang_mr", title: "मराठी (Marathi)" },
                    { id: "lang_gu", title: "ગુજરાતી (Gujarati)" },
                    { id: "lang_pa", title: "ਪੰਜਾਬੀ (Punjabi)" },
                    { id: "lang_ta", title: "தமிழ் (Tamil)" },
                    { id: "lang_te", title: "తెలుగు (Telugu)" },
                    { id: "lang_bn", title: "বাংলা (Bengali)" },
                    { id: "lang_kn", title: "ಕನ್ನಡ (Kannada)" },
                    { id: "lang_ml", title: "മലയാളം (Malayalam)" }
                ]
            }
        ]
        
        return await sendInteractiveList(
            senderPhone,
            "",
            "🔊 Choose your preferred language for voice updates:",
            "Select Language",
            langSections
        )
    }

    if (currentState === 'qr_join_language') {
        let langId = 'en'
        // Detect if they sent "lang_hi" or just typed "Hindi" or "2"
        const lower = text.toLowerCase()
        if (lower.includes('lang_')) {
            langId = lower.replace('lang_', '')
        } else {
            const map = {
                '1': 'en', 'english': 'en',
                '2': 'hi', 'hindi': 'hi',
                '3': 'mr', 'marathi': 'mr',
                '4': 'gu', 'gujarati': 'gu',
                '5': 'pa', 'punjabi': 'pa',
                '6': 'ta', 'tamil': 'ta',
                '7': 'te', 'telugu': 'te',
                '8': 'bn', 'bengali': 'bn',
                '9': 'kn', 'kannada': 'kn',
                '10': 'ml', 'malayalam': 'ml'
            }
            langId = map[lower] || 'en'
        }

        // Call the internal queue addition API to reuse all existing logic
        try {
            const secret = process.env.WEBHOOK_VERIFY_TOKEN || ''
            const res = await fetch(`${NEXT_PUBLIC_APP_URL}/api/whatsapp?secret=${secret}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'join',
                    phone: senderPhone,
                    name: session.data.patient_name,
                    language: langId,
                    businessCode: clinic?.code || session.data.businessCode
                })
            })
            
            const data = await res.json()
            
            if (data.success && data.token) {
                const waitTime = (data.position || 0) * 5
                await sendText(
                    senderPhone, 
                    `✅ You're in the queue, ${data.name}!\n🎫 Your Token: ${data.token}\n👥 People ahead: ${data.position}\n⏱ Est. wait: ${waitTime} mins. We'll notify you when your turn is near.\n\n🏥 Powered by TokenPe`
                )
            } else {
                await sendText(senderPhone, data.message || "❌ Sorry, we couldn't add you to the queue.")
            }

            // Clean up session state back to idle, but keep them in clinic mode
            await setSessionState(senderPhone, 'idle', session.data)
        } catch (err) {
            console.error('[ClinicBot] Failed to call internal API:', err)
            await sendText(senderPhone, "❌ Sorry, something went wrong while adding you to the queue. Please try again.")
        }
        return
    }


    // ==========================================
    // INTENT CONVERSATIONAL BOT
    // ==========================================
    if (!clinic) {
        return await sendText(senderPhone, "I am currently not linked to any clinic. Please scan a clinic's QR code to begin.")
    }

    const systemPrompt = `You are the official WhatsApp Receptionist for ${clinic.name}.
Your job is to assist patients professionally, kindly, and concisely. Keep answers short (this is WhatsApp).

CLINIC KNOWLEDGE BASE:
- Name: ${clinic.name}
- Timings: ${clinic.bot_timings || 'Not specified'}
- Location: ${clinic.bot_location || 'Not specified'}
- Google Maps Link: ${clinic.bot_location_url || 'Not specified'}
- Doctors: ${clinic.bot_doctors || 'Not specified'}
- FAQs: ${clinic.bot_faqs || 'Not specified'}
- Google Review Link: ${clinic.google_review_link || 'Not specified'}
- General Information / Greeting: ${clinic.bot_greeting || 'Not specified'}

RULES:
1. Only answer questions using the knowledge base provided above. Do NOT invent timings, doctors, or addresses.
2. If the user asks something you don't know (e.g., medical advice, appointment booking outside of walk-ins, specific doctor fees not listed), politely tell them to speak to the clinic staff or receptionist directly.
3. If they ask for a Google review link, share it if available.
4. If they want to join the queue, tell them to type "JOIN [CLINIC CODE]" or scan the QR code at the clinic. Do NOT try to join them yourself. (Their clinic code is: ${clinic.code})`

    try {
        const history = session?.data?.history || []

        const { text: aiResponse } = await generateText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            messages: history,
            maxSteps: 1
        })

        if (aiResponse) {
            history.push({ role: 'assistant', content: aiResponse })
            await sendText(senderPhone, aiResponse)
            
            // Save updated history
            await setSessionState(senderPhone, currentState, { ...session.data, history })
        }
    } catch (error) {
        console.error('[ClinicBot] AI Generation Failed:', error)
        // Fallback to basic menu if AI fails
        await sendText(senderPhone, `Hi! I am the automated assistant for *${clinic.name}*.\n\nYou can ask me about:\n- Clinic Timings\n- Location & Map\n- Doctors Available`)
    }
}

async function setSessionState(phone, state, data = {}) {
    await supabaseAdmin
        .from('whatsapp_sessions')
        .upsert({ 
            phone, 
            state, 
            data,
            updated_at: new Date().toISOString()
        })
}
