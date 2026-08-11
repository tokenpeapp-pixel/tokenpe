import { sendText, sendInteractiveList } from './messaging'
import { supabaseAdmin } from './supabase'
import { Resend } from 'resend'
import { handleClinicMessage } from './clinic-chatbot'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

/**
 * Handles incoming WhatsApp messages from MSG91.
 * TokenPe Main Chatbot (Lead Capture + Info + Handoff)
 */
export async function handleIncomingMessage(senderPhone, messageText, rawPayload) {
    const text = (messageText || '').toLowerCase().trim()
    console.log(`[Chatbot] Received from ${senderPhone}: ${text}`)

    if (!text) return

    // 1. Fetch current session
    let { data: session } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('*')
        .eq('phone', senderPhone)
        .single()

    // Keep track of the last 3 messages for context
    const history = session?.data?.history || []
    history.push(text)
    if (history.length > 3) history.shift()
    const sessionData = { ...(session?.data || {}), history }

    // ==========================================
    // CLINIC BOT ROUTING
    // ==========================================
    // If they are scanning a QR code for a clinic ("JOIN XXXX")
    // or if they are already in clinic mode
    if (text.startsWith('join ') || session?.data?.mode === 'clinic') {
        return await handleClinicMessage(senderPhone, messageText, { ...session, data: sessionData })
    }

    // 2. First-Ever Contact (No Session)
    if (!session) {
        // First-ever contact — always show welcome, regardless of what they typed
        await resetSession(senderPhone)
        return await sendWelcomeMenu(senderPhone)
    }

    // 3. Handle Global Keywords (Overrides state)
    if (matchesGreeting(text)) {
        await resetSession(senderPhone)
        return await sendWelcomeMenu(senderPhone)
    }
    
    if (text === 'agent' || text === 'human' || text === 'talk to someone' || text === 'call me') {
        return await triggerHumanHandoff(senderPhone, { ...session, data: sessionData })
    }

    if (text === 'demo' || text === 'pricing') {
        await setSessionState(senderPhone, 'capturing_business', sessionData)
        return await sendText(senderPhone, `Great! Let's get you set up. Just need a few quick details 🙂\n\n1️⃣ What's your business name?`)
    }

    // 3. State Machine Logic
    const currentState = session?.state || 'idle'

    if (currentState === 'paused_for_human') {
        // Do nothing, agent is handling it
        console.log(`[Chatbot] Ignored message from ${senderPhone}, currently paused for human.`)
        return
    }

    // --- MAIN MENU OPTIONS ---
    if (currentState === 'idle') {
        switch (text) {
            case 'opt_what_is':
                await sendText(senderPhone, `TokenPe is a WhatsApp-based queue & token management system.\nNo more crowded waiting rooms — your customers get live updates right on their phone.\n\n🔗 Learn more: https://tokenpe.online\n\nWant to see it in action? Type "demo" anytime.`)
                break
            case 'opt_who':
                await sendText(senderPhone, `TokenPe is built by a passionate team based in India, dedicated to solving waiting room chaos.\n\n🔗 About us: https://tokenpe.online/about`)
                break
            case 'opt_industries':
                await sendText(senderPhone, `We currently power systems for:\n🏥 Clinics & Hospitals\n💇 Salons & Spas\n🍽️ Restaurants\n🏫 Schools\n\nWhich one are you exploring for your business? (Just reply with the industry)`)
                await setSessionState(senderPhone, 'capturing_business', { ...sessionData, industry_prompted: true })
                break
            case 'opt_demo':
                await setSessionState(senderPhone, 'capturing_business', sessionData)
                await sendText(senderPhone, `Great! Let's get you set up. Just need a few quick details 🙂\n\n1️⃣ What's your business name?`)
                break
            case 'opt_patient':
                await setSessionState(senderPhone, 'idle', { ...sessionData, mode: 'clinic' })
                await sendText(senderPhone, `🏥 You are now in Patient Mode.\n\nPlease reply with the clinic code you want to connect to, or ask a question if you already have a clinic linked!`)
                break
            case 'opt_agent':
                await triggerHumanHandoff(senderPhone, { ...session, data: sessionData })
                break
            default:
                await sendText(senderPhone, `Sorry, I didn't quite get that 🤔\nType "menu" to see what I can help with, or "agent" to talk to our team.`)
        }
        return
    }

    // --- LEAD CAPTURE FLOW ---
    if (currentState === 'capturing_business') {
        let newData = { ...sessionData, business_name: messageText }
        
        // If they skipped industry step earlier, they go to city step normally
        await setSessionState(senderPhone, 'capturing_city', newData)
        await sendText(senderPhone, `Got it. "${messageText}" is a great name!\n\n2️⃣ Which city are you located in?`)
        return
    }

    if (currentState === 'capturing_city') {
        let newData = { ...sessionData, city: messageText }
        
        if (newData.industry_prompted) {
            // Already know they came from industry menu, but we don't know the exact industry. Ask for it.
            await setSessionState(senderPhone, 'capturing_industry', newData)
            await sendText(senderPhone, `Awesome, we love ${messageText}!\n\n3️⃣ Which industry are you in? (Clinic / Salon / Restaurant / School / Other)`)
        } else {
            // Standard demo flow
            await setSessionState(senderPhone, 'capturing_industry', newData)
            await sendText(senderPhone, `Awesome, we love ${messageText}!\n\n3️⃣ Which industry are you in? (Clinic / Salon / Restaurant / School / Other)`)
        }
        return
    }

    if (currentState === 'capturing_industry') {
        let finalData = { ...sessionData, industry: messageText }
        
        const newLead = {
            name: rawPayload?.contacts?.[0]?.profile?.name || rawPayload?.sender?.name || 'Unknown User',
            phone: senderPhone,
            business_name: finalData.business_name,
            city: finalData.city,
            industry: finalData.industry,
            source: 'TokenPe WhatsApp Bot'
        }

        // Push lead to database
        const { error } = await supabaseAdmin.from('leads').insert(newLead)

        if (error) {
            console.error('[Chatbot] Failed to save lead to Supabase:', error)
        } else {
            // Push lead to viaSocket for Google Sheets / CRM
            if (process.env.VIASOCKET_LEADS_WEBHOOK_URL) {
                fetch(process.env.VIASOCKET_LEADS_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...newLead,
                        timestamp: new Date().toISOString()
                    })
                }).catch(e => console.error('[Chatbot] Failed to push lead to ViaSocket:', e.message))
            }
        }

        await resetSession(senderPhone)
        await sendText(senderPhone, `Perfect! Our team will reach out to you shortly with pricing & a live demo.\n\nIn the meantime, feel free to explore our website: https://tokenpe.online 🚀`)
        return
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sendWelcomeMenu(phone) {
    const sections = [
        {
            title: "Main Menu",
            rows: [
                { id: "opt_what_is", title: "🏢 What is TokenPe?", description: "Learn about our system" },
                { id: "opt_patient", title: "🏥 I'm a Patient", description: "Check token or join queue" },
                { id: "opt_who", title: "👥 Who's behind it?", description: "Meet the team" },
                { id: "opt_industries", title: "🏥 Industries we serve", description: "Clinics, Salons & more" },
                { id: "opt_demo", title: "💰 Get pricing / demo", description: "Start your free trial" },
                { id: "opt_agent", title: "🙋 Talk to our team", description: "Chat with a human" }
            ]
        }
    ]
    
    await sendInteractiveList(
        phone,
        "Welcome to TokenPe! 👋",
        "We help clinics, salons, restaurants & schools manage queues, tokens & customer updates — all over WhatsApp.\n\nHow can I help you today?",
        "Select Option",
        sections
    )
}

async function triggerHumanHandoff(phone, session) {
    // Prevent spamming the team if they are already in handoff state
    if (session?.state === 'paused_for_human') {
        return await sendText(phone, `Our team has already been notified and will be with you shortly! 🙋\n\nNeed immediate help? Chat with our founders directly: https://wa.me/917715951068`)
    }

    await setSessionState(phone, 'paused_for_human', session?.data)
    await sendText(phone, `Sure, connecting you to our team 🙋\nSomeone will respond here shortly!\n\nAlternatively, you can chat with our founders directly right now: https://wa.me/917715951068`)
    
    // Prepare Alert Data
    const customerName = session?.data?.name || 'Unknown User'
    const lastMessage = session?.data?.last_message || 'Requested Human'
    const recentHistory = (session?.data?.history || []).join(' | ')

    // Fire all alerts in parallel, catching errors so one failure doesn't block others
    const alertPromises = []

    // 1. WhatsApp Template Alert
    const teamNumbers = (process.env.TEAM_WHATSAPP_NUMBERS || '').split(',').map(n => n.trim()).filter(Boolean)
    if (teamNumbers.length > 0) {
        const { sendTemplateMessage } = require('./messaging')
        teamNumbers.forEach(num => {
            alertPromises.push(
                sendTemplateMessage({
                    phone: num,
                    templateName: 'handoff_alert_internal',
                    bodyValues: [customerName, phone, lastMessage, recentHistory]
                }).catch(e => console.error('[Handoff] WhatsApp alert failed:', e.message))
            )
        })
    }

    // 2. One webhook call to viaSocket (Fans out to Slack + Email + Sheets internally)
    if (process.env.VIASOCKET_WEBHOOK_URL) {
        alertPromises.push(
            fetch(process.env.VIASOCKET_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: customerName,
                    customer_phone: phone,
                    last_message: lastMessage,
                    timestamp: new Date().toISOString(),
                    inbox_link: "https://control.msg91.com/app/inbox"
                })
            }).catch(e => console.error('[Handoff] ViaSocket webhook failed:', e.message))
        )
    }

    // Await all parallel alerts (using allSettled so one failure doesn't throw)
    await Promise.allSettled(alertPromises)
    console.log(`[Handoff] Triggered multi-channel alerts for ${phone}`)
}

async function setSessionState(phone, state, data = {}) {
    await supabaseAdmin
        .from('whatsapp_sessions')
        .upsert({ 
            phone, 
            state, 
            data,
            updated_at: new Date().toISOString() 
        }, { onConflict: 'phone' })
}

async function resetSession(phone) {
    await supabaseAdmin
        .from('whatsapp_sessions')
        .upsert({ 
            phone, 
            state: 'idle', 
            data: {},
            updated_at: new Date().toISOString()
        }, { onConflict: 'phone' })
}

const GREETING_KEYWORDS = [
  "hi", "hii", "hiii", "hello", "helo", "hlo", "hey", "heyy",
  "namaste", "namaskar", "start", "menu", "info", "services",
  "tokenpe", "token pe"
]

function matchesGreeting(text) {
    return GREETING_KEYWORDS.includes(text)
}
