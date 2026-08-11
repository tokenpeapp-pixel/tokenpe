import { sendText, sendInteractiveList } from './messaging'
import { supabaseAdmin } from './supabase'

// Fallback to fetch directly since we are on the same Next.js server
// We'll simulate hitting the /api/whatsapp route by importing the logic if needed,
// but for now let's just make a fetch call locally.
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Sends a button message via MSG91
 */
async function sendInteractiveButton(phone, text, buttons) {
    if (process.env.NODE_ENV === 'test') {
        console.log(`[MSG91-Mock] Button Message to ${phone}:\nBody: ${text}\nButtons:`, buttons)
        return true
    }

    const payload = {
        to: [phone],
        type: "interactive",
        interactive: {
            type: "button",
            body: { text: text },
            action: {
                buttons: buttons.map(btn => ({
                    type: "reply",
                    reply: {
                        id: btn.id,
                        title: btn.title
                    }
                }))
            }
        }
    }

    try {
        const response = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
            method: 'POST',
            headers: {
                'authkey': process.env.MSG91_AUTH_KEY || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.hasError) {
            console.error('[MSG91] Button Send Error:', result);
        }
        return !result.hasError;
    } catch (error) {
        console.error('[MSG91] Button Send Exception:', error);
        return false;
    }
}

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
    if (currentState === 'idle' && text.startsWith('join ')) {
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
            await fetch(`${NEXT_PUBLIC_APP_URL}/api/whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'join',
                    phone: senderPhone,
                    name: session.data.patient_name,
                    language: langId,
                    businessCode: session.data.businessCode
                })
            })
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

    // Check intents
    if (text.includes('timing') || text.includes('time') || text.includes('open') || text.includes('close') || text.includes('hours')) {
        return await sendText(senderPhone, `🕐 *Timings for ${clinic.name}:*\n\n${clinic.bot_timings || 'Timings are currently not set.'}`)
    }

    if (text.includes('location') || text.includes('address') || text.includes('where') || text.includes('map')) {
        let msg = `📍 *Location of ${clinic.name}:*\n\n${clinic.bot_location || 'Location is currently not set.'}`
        if (clinic.bot_location_url) {
            msg += `\n\nGoogle Maps: ${clinic.bot_location_url}`
        }
        return await sendText(senderPhone, msg)
    }

    if (text.includes('doctor') || text.includes('dr.') || text.includes('specialist')) {
        return await sendText(senderPhone, `👨‍⚕️ *Doctors Available:*\n\n${clinic.bot_doctors || 'Doctors list is currently not set.'}`)
    }

    if (text.includes('human') || text.includes('staff') || text.includes('talk to') || text.includes('reception')) {
        return await sendText(senderPhone, `Our staff has been notified and will assist you shortly.`)
    }

    // Default fallback
    return await sendText(senderPhone, `Hi! I am the automated assistant for *${clinic.name}*.\n\nYou can ask me about:\n- Clinic Timings\n- Location & Map\n- Doctors Available`)
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
