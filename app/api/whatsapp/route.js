import { supabase } from '../../../lib/supabase'

const TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_ID = process.env.WHATSAPP_PHONE_ID
const BASE = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`
const HEADERS = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
}

// ─── SEND TEXT ──────────────────────────────────────────────────────────────
async function sendText(phone, text) {
    await fetch(BASE, {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: `91${phone}`,
            type: 'text',
            text: { body: text }
        })
    })
}

// ─── SEND BUTTON ────────────────────────────────────────────────────────────
async function sendButton(phone, bodyText, buttons) {
    await fetch(BASE, {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: `91${phone}`,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: { text: bodyText },
                action: { buttons }
            }
        })
    })
}

// ─── SEND LANGUAGE LIST ─────────────────────────────────────────────────────
async function sendLanguageList(phone) {
    await fetch(BASE, {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: `91${phone}`,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text: '🌐 *Select your preferred language*\n\nYou will receive all queue updates as voice notes in your chosen language.'
                },
                action: {
                    button: '🌐 Choose Language',
                    sections: [{
                        title: 'Available Languages',
                        rows: [
                            { id: 'lang_hi', title: 'हिंदी', description: 'Hindi' },
                            { id: 'lang_ta', title: 'தமிழ்', description: 'Tamil' },
                            { id: 'lang_te', title: 'తెలుగు', description: 'Telugu' },
                            { id: 'lang_mr', title: 'मराठी', description: 'Marathi' },
                            { id: 'lang_bn', title: 'বাংলা', description: 'Bengali' },
                            { id: 'lang_gu', title: 'ગુજરાતી', description: 'Gujarati' },
                            { id: 'lang_kn', title: 'ಕನ್ನಡ', description: 'Kannada' },
                            { id: 'lang_ml', title: 'മലയാളം', description: 'Malayalam' },
                            { id: 'lang_pa', title: 'ਪੰਜਾਬੀ', description: 'Punjabi' },
                            { id: 'lang_en', title: 'English', description: 'English (Indian)' },
                        ]
                    }]
                }
            }
        })
    })
}

// ─── WEBHOOK HANDLER ────────────────────────────────────────────────────────
export async function POST(req) {
    const body = await req.json()
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!message) return new Response('ok', { status: 200 })

    // Phone number — auto from WhatsApp, strip country code
    const phone = message.from.replace(/^91/, '').replace(/^\+/, '')

    // ── Step 1: Patient sends "JOIN CLINICCODE" from QR scan ─────────────────
    if (message.type === 'text') {
        const text = message.text.body.trim().toUpperCase()

        if (text.startsWith('JOIN')) {
            const code = text.split(' ')[1]
            const { data: clinic } = await supabase
                .from('clinics').select('*').eq('code', code).single()

            if (!clinic) {
                await sendText(phone, '❌ Invalid clinic code. Please scan the QR code at the clinic again.')
                return new Response('ok', { status: 200 })
            }

            // Save state: waiting for name
            await supabase.from('pending').upsert({
                phone,
                clinic_id: clinic.id,
                step: 'ask_name'
            })

            // Ask for name — only thing patient types
            await sendButton(phone,
                `🏥 *Welcome to ${clinic.name}!*\n\nTo join today's OPD queue, please tell us your name.\n\n_Type your name and send it._`,
                [{ type: 'reply', reply: { id: 'SKIP_NAME', title: '⏭ Skip (No name)' } }]
            )

            return new Response('ok', { status: 200 })
        }

        // ── Step 2: Patient typed their name ──────────────────────────────────
        const { data: pending } = await supabase
            .from('pending').select('*').eq('phone', phone).single()

        if (pending?.step === 'ask_name') {
            const name = message.text.body.trim()

            // Save name, move to language step
            await supabase.from('pending').update({
                step: 'ask_language',
                name: name
            }).eq('phone', phone)

            await sendLanguageList(phone)
            return new Response('ok', { status: 200 })
        }
    }

    // ── Button / List taps ───────────────────────────────────────────────────
    if (message.type === 'interactive') {
        const buttonId = message.interactive?.button_reply?.id
            || message.interactive?.list_reply?.id

        // ── Tapped "Skip Name" ───────────────────────────────────────────────
        if (buttonId === 'SKIP_NAME') {
            await supabase.from('pending').update({
                step: 'ask_language',
                name: null
            }).eq('phone', phone)

            await sendLanguageList(phone)
            return new Response('ok', { status: 200 })
        }

        // ── Tapped a language ────────────────────────────────────────────────
        if (buttonId?.startsWith('lang_')) {
            const lang = buttonId.replace('lang_', '')

            const { data: pending } = await supabase
                .from('pending').select('*').eq('phone', phone).single()

            if (!pending) return new Response('ok', { status: 200 })

            const { data: clinic } = await supabase
                .from('clinics').select('*').eq('id', pending.clinic_id).single()

            // Count patients waiting today
            const today = new Date().toISOString().split('T')[0]
            const { count } = await supabase.from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', pending.clinic_id)
                .eq('status', 'waiting')
                .eq('date', today)

            const position = count || 0
            const token = `T${String(position + 1).padStart(3, '0')}`
            const waitMins = position * 7

            const langNames = {
                hi: 'हिंदी', ta: 'தமிழ்', te: 'తెలుగు', mr: 'मराठी',
                bn: 'বাংলা', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ml: 'മലയാളം',
                pa: 'ਪੰਜਾਬੀ', en: 'English'
            }

            // Add to queue with name from pending
            await supabase.from('patients').insert({
                clinic_id: pending.clinic_id,
                token,
                phone,
                name: pending.name || null,
                language: lang,
                status: 'waiting',
                amount_paid: 0
            })

            // Clear pending
            await supabase.from('pending').delete().eq('phone', phone)

            // Send confirmation
            await sendText(phone,
                `✅ *You have been added to the queue at ${clinic.name}*\n\n` +
                `👤 Name: *${pending.name || 'Guest'}*\n` +
                `🎫 Your Token: *${token}*\n` +
                `👥 Patients ahead: *${position}*\n` +
                `⏱ Est. wait: *${position === 0 ? 'You are next!' : `~${waitMins} minutes`}*\n\n` +
                `📍 Please stay near the clinic.\n` +
                `🎙️ Voice updates in *${langNames[lang]}*\n\n` +
                `_${clinic.name} · Powered by TokenPe_`
            )

            // Send voice note
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone, language: lang, event: 'joined',
                    token, position, clinicName: clinic.name
                })
            })

            return new Response('ok', { status: 200 })
        }

        // ── Tapped "On My Way" ───────────────────────────────────────────────
        if (buttonId === 'ON_MY_WAY') {
            await sendText(phone,
                `👍 *Perfect! We have noted that you are on your way.*\n\nPlease come to the reception and show your token.\n\n_Thank you for your patience._`
            )
        }
    }

    return new Response('ok', { status: 200 })
}

// ─── WEBHOOK VERIFICATION ────────────────────────────────────────────────────
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