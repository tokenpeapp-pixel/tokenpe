const TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_ID = process.env.WHATSAPP_PHONE_ID
const BASE = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`

const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
}

// ─────────────────────────────────────
// 1. SEND PLAIN TEXT
// ─────────────────────────────────────
export async function sendText(phone, message) {
    await fetch(BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: `91${phone}`,
            type: 'text',
            text: { body: message }
        })
    })
}

// ─────────────────────────────────────
// 2. SEND JOIN BUTTON
// Patient gets this after sending JOIN
// ─────────────────────────────────────
export async function sendJoinButton(phone, clinicName) {
    await fetch(BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: `91${phone}`,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text: `🏥 *${clinicName}*\n\nWelcome! Tap below to join today's queue.\n\n_You will receive voice updates in your language._`
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: { id: 'JOIN_QUEUE', title: '✅ Join Queue' }
                        }
                    ]
                }
            }
        })
    })
}

// ─────────────────────────────────────
// 3. SEND LANGUAGE SELECTION (List)
// Supports all 10 languages
// ─────────────────────────────────────
export async function sendLanguageList(phone) {
    await fetch(BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: `91${phone}`,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text: '🌐 *Select Your Language*\n\nChoose how you want to receive your queue voice updates.'
                },
                action: {
                    button: '🌐 Select Language',
                    sections: [
                        {
                            title: 'Indian Languages',
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
                        }
                    ]
                }
            }
        })
    })
}

// ─────────────────────────────────────
// 4. SEND QUEUE CONFIRMATION (Text)
// Always in English so everyone reads it
// ─────────────────────────────────────
export async function sendConfirmation(phone, token, position, langName) {
    const wait = position * 7
    await sendText(phone,
        `✅ *You're in the queue!*\n\n` +
        `🎫 Token: *${token}*\n` +
        `👥 People ahead: *${position}*\n` +
        `⏱ Est. wait: *~${wait} mins*\n\n` +
        `🎙️ Voice updates will come in *${langName}*\n\n` +
        `_Please stay nearby. We'll notify you when your turn is close._`
    )
}

// ─────────────────────────────────────
// 5. SEND "ALMOST YOUR TURN" BUTTON
// With option to say they're on their way
// ─────────────────────────────────────
export async function sendAlmostTurnButton(phone, token) {
    await fetch(BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: `91${phone}`,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text: `🔔 *Almost your turn!*\n\nToken *${token}* — only 3 patients ahead.\n\nPlease start heading to the clinic now.`
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: { id: 'ON_MY_WAY', title: "🚶 I'm on my way" }
                        }
                    ]
                }
            }
        })
    })
}