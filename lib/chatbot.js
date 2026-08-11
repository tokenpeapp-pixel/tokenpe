import { sendText, sendInteractiveList } from './messaging'
import { supabaseAdmin } from './supabase'
import { Resend } from 'resend'
import { handleClinicMessage } from './clinic-chatbot'
import { generateText, tool } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
})

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

const SYSTEM_PROMPT = `You are the official WhatsApp Assistant for TokenPe. Your name is TokenPe AI.
TokenPe is a WhatsApp-based queue & token management system that eliminates waiting room chaos for Clinics, Hospitals, Salons, Restaurants, and Schools.
Customers get live token updates right on their WhatsApp without downloading any apps.

FOUNDER & STORY:
- Founded by Rahul, a passionate builder from India.
- Rahul built TokenPe because he hated waiting for hours in clinics and wanted a simple, WhatsApp-native solution for businesses.

PRICING & FEATURES:
- Starter Plan: ₹999/month (Basic queue management).
- Pro Plan: ₹1999/month (Advanced features, analytics, multi-branch).
- Free 7-day trial available.

FAQ & KNOWLEDGE:
- "Do patients/customers need an app?" -> No, it's 100% on WhatsApp.
- "How do I get started?" -> Tell them you can set them up right now, or they can start a free trial on tokenpe.online.
- "What industries?" -> We serve Clinics, Salons, Restaurants, and Schools.

YOUR GOAL & RULES:
1. Be friendly, professional, and concise (since this is WhatsApp, use emojis but keep texts short).
2. Answer questions about TokenPe confidently using the knowledge above.
3. If a user is interested in a demo, buying, or pricing, you MUST organically ask for their Business Name, City, and Industry. Once you have all three, you MUST call the captureLead tool to save their info.
4. If a user asks to talk to a human, agent, founder, or is frustrated, you MUST call the triggerHumanHandoff tool.
`

export async function handleIncomingMessage(senderPhone, messageText, rawPayload) {
    const text = (messageText || '').trim()
    console.log(`[Chatbot] Received from ${senderPhone}: ${text}`)

    if (!text) return

    // 1. Fetch current session
    let { data: session } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('*')
        .eq('phone', senderPhone)
        .single()

    let history = session?.data?.history || []
    
    // Backward compatibility: Convert string history to object history
    history = history.map(msg => typeof msg === 'string' ? { role: 'user', content: msg } : msg)
    
    // Add current message
    history.push({ role: 'user', content: text })

    // Keep track of the last 10 messages for context
    if (history.length > 10) history = history.slice(history.length - 10)
    
    const sessionData = { ...(session?.data || {}), history }

    // ==========================================
    // CLINIC BOT ROUTING
    // ==========================================
    if (text.toLowerCase().startsWith('join ') || session?.data?.mode === 'clinic') {
        return await handleClinicMessage(senderPhone, messageText, { ...session, data: sessionData })
    }

    if (session?.state === 'paused_for_human') {
        console.log(`[Chatbot] Ignored message from ${senderPhone}, currently paused for human.`)
        return
    }

    try {
        const { text: aiResponse, toolCalls } = await generateText({
            model: google('gemini-2.5-flash'),
            system: SYSTEM_PROMPT,
            messages: history,
            tools: {
                captureLead: tool({
                    description: 'Saves a lead when the user is interested in TokenPe and has provided their Business Name, City, and Industry.',
                    parameters: z.object({
                        businessName: z.string().describe('The name of the business'),
                        city: z.string().describe('The city where the business is located'),
                        industry: z.string().describe('The industry (Clinic, Salon, Restaurant, School, etc.)')
                    }),
                    execute: async ({ businessName, city, industry }) => {
                        console.log(`[Chatbot] Capturing Lead via AI: ${businessName}, ${city}, ${industry}`)
                        const newLead = {
                            name: rawPayload?.contacts?.[0]?.profile?.name || rawPayload?.sender?.name || 'Unknown User',
                            phone: senderPhone,
                            business_name: businessName,
                            city: city,
                            industry: industry,
                            source: 'TokenPe AI WhatsApp Bot'
                        }
                        
                        await supabaseAdmin.from('leads').insert(newLead)

                        if (process.env.VIASOCKET_LEADS_WEBHOOK_URL) {
                            fetch(process.env.VIASOCKET_LEADS_WEBHOOK_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...newLead, timestamp: new Date().toISOString() })
                            }).catch(e => console.error('[Chatbot] Failed to push lead to ViaSocket:', e.message))
                        }
                        return 'Lead successfully captured. Tell the user our team will reach out shortly with next steps.'
                    }
                }),
                triggerHumanHandoff: tool({
                    description: 'Triggers an alert to the TokenPe human support team when the user asks for a human, agent, or founder.',
                    parameters: z.object({
                        reason: z.string().describe('The reason for handoff')
                    }),
                    execute: async ({ reason }) => {
                        console.log(`[Chatbot] Triggering Handoff via AI. Reason: ${reason}`)
                        await _triggerHumanHandoffInternal(senderPhone, { ...session, data: sessionData })
                        return 'Human team has been alerted. Tell the user someone will connect with them shortly, and provide this direct founder WhatsApp link just in case: https://wa.me/917715951068'
                    }
                })
            },
            maxSteps: 3 // Allow up to 3 steps so the AI can execute the tool and then write a response
        })

        if (aiResponse) {
            history.push({ role: 'assistant', content: aiResponse })
            await sendText(senderPhone, aiResponse)
        }

        // Save updated history
        await supabaseAdmin
            .from('whatsapp_sessions')
            .upsert({ 
                phone: senderPhone, 
                state: session?.state || 'idle', 
                data: { ...sessionData, history },
                updated_at: new Date().toISOString() 
            }, { onConflict: 'phone' })

    } catch (error) {
        console.error('[Chatbot] AI Generation Failed:', error)
        await sendText(senderPhone, "I'm having a little trouble connecting right now. Let me hand you over to my human team! 🙋\n\nYou can chat with them directly here: https://wa.me/917715951068")
        await _triggerHumanHandoffInternal(senderPhone, { ...session, data: sessionData })
    }
}

async function _triggerHumanHandoffInternal(phone, session) {
    if (session?.state === 'paused_for_human') return

    await supabaseAdmin
        .from('whatsapp_sessions')
        .upsert({ 
            phone, 
            state: 'paused_for_human', 
            data: session?.data,
            updated_at: new Date().toISOString() 
        }, { onConflict: 'phone' })
    
    const customerName = session?.data?.name || 'Unknown User'
    const lastMessage = session?.data?.last_message || 'Requested Human via AI'
    const recentHistory = (session?.data?.history || [])
        .map(h => typeof h === 'string' ? h : h.content)
        .join(' | ')

    const alertPromises = []

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

    await Promise.allSettled(alertPromises)
}
