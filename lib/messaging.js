// lib/messaging.js
// ── Shared utility: TTS via Sarvam, upload to Supabase, send via Interakt ──
// Used by all queue API routes to avoid duplicate code and extra HTTP hops.

import { supabase } from './supabase'

const SARVAM_KEY = process.env.SARVAM_API_KEY
const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY

// ── Voice messages in 10 Indian languages ────────────────────────────────────
const MESSAGES = {
    hi: {
        joined: (token, pos, clinic) => `Namaste! ${clinic} mein aapka swagat hai. Aapka token number ${token} hai. Abhi ${pos} log aage hain. Kripa pratiksha karein.`,
        ten_away: (token, current) => `${token} number wale ji, ab sirf 10 token baaki hain. Abhi ${current} chal raha hai. Clinic ki taraf chaliye.`,
        five_away: (token, current) => `${token} number wale ji, sirf 5 token baaki hain! Abhi ${current} chal raha hai. Kripya taiyaar ho jayein.`,
        soon: (token) => `${token} number wale ji, ab bas aapki baari aane wali hai. Kripya clinic ki taraf aa jayein.`,
        now: (token) => `${token} number wale ji, aapki baari aa gayi hai. Doctor aapka intezaar kar rahe hain. Please andar aa jayein.`,
        done: (clinic) => `Aapka consultation complete hua. ${clinic} mein aane ka shukriya. Jaldi theek ho jayein!`,
        paused: (clinic) => `${clinic} ki queue abhi roki gayi hai. Kripya thodi der baad prayas karein.`
    },
    ta: {
        joined: (token, pos, clinic) => `Vanakkam! ${clinic} il ungalukkு varkaverppu. Ungal token number ${token}. Tharuvadhil ${pos} per ullanar.`,
        ten_away: (token, current) => `${token} number, innumm 10 per ullanar. Tharuvadhil ${current} nadakkirathu. Clinic noki varungal.`,
        five_away: (token, current) => `${token} number, innumm 5 per mattume! Tharuvadhil ${current} nadakkirathu. Thayaraaga irungal.`,
        soon: (token) => `${token} number, ungal murai nerungi vittathu. Clinic noki varungal.`,
        now: (token) => `${token} number, ungal alar vandhachu! Doctor ungalai thirumbugirar.`,
        done: (clinic) => `Consultation mudinthathu. ${clinic} vanthatharku nandri. Viratam munnerugal!`,
        paused: (clinic) => `${clinic} in varisai tharkalikamaga nirutha pattullathu. Thayavu seithu piragu muyarchi seiyavum.`
    },
    te: {
        joined: (token, pos, clinic) => `Namaskaram! ${clinic} ki swagatam. Mee token number ${token}. Ippudu ${pos} mandhi mundu unnaru.`,
        ten_away: (token, current) => `${token} number garu, inkaa 10 mandhe unnaru. Ippudu ${current} nadustundi. Clinic vaipu ravandi.`,
        five_away: (token, current) => `${token} number garu, kevalam 5 mandhe unnaru! Ippudu ${current} nadustundi. Tayyaruga undandi.`,
        soon: (token) => `${token} number garu, mee vantu daggarapaddadi. Clinic vaipu ravandi.`,
        now: (token) => `${token} number garu, mee vanta vachindi! Doctor meeru kosam veediksthunnaru.`,
        done: (clinic) => `Consultation purthi ayyindi. ${clinic} ki dhanyavadalu. Tvaraga kolukondi!`,
        paused: (clinic) => `${clinic} dwara queue aapabadindi. Dayachesi tarvata prayatninchandi.`
    },
    mr: {
        joined: (token, pos, clinic) => `Namaskar! ${clinic} madhe aapale swagat aahe. Aapala token number ${token} aahe. Ata ${pos} log pudhe aahet.`,
        ten_away: (token, current) => `${token} number wale, ata fakt 10 log baaki aahet. Ata ${current} chalu aahe. Clinic kade yaa.`,
        five_away: (token, current) => `${token} number wale, fakt 5 log baaki aahet! Ata ${current} chalu aahe. Krupaya taiyaar vha.`,
        soon: (token) => `${token} number wale, aapli vel javal aali aahe. Krupaya clinic kade yaa.`,
        now: (token) => `${token} number wale, aapali vel aali aahe! Doctor aapli vaat pahat aahet.`,
        done: (clinic) => `Consultation sampale. ${clinic} madhe alyabaddal dhanyavaad. Lavkar bara vha!`,
        paused: (clinic) => `${clinic} kadun queue sadyha thambavali aahe. Krupaya nantar prayatna kara.`
    },
    bn: {
        joined: (token, pos, clinic) => `Namaskar! ${clinic} te apnake swagat. Apnar token number ${token}. Ekhon ${pos} jon samne achhen.`,
        ten_away: (token, current) => `${token} number, aro 10 jon baki. Ekhon ${current} cholche. Clinic er dike asun.`,
        five_away: (token, current) => `${token} number, matro 5 jon baki! Ekhon ${current} cholche. Tairi thakun.`,
        soon: (token) => `${token} number, apnar pala pray chole esheche. Clinic er dike asun.`,
        now: (token) => `${token} number, apnar pala eshe geche! Doctor apnar jonno opekkha korchen.`,
        done: (clinic) => `Consultation sesh hoyeche. ${clinic} te asar jonno dhonyobad. Taratari sustha hon!`,
        paused: (clinic) => `${clinic} er queue ekhon bondho rakha hoyeche. Onugroho kore pore chesta korun.`
    },
    gu: {
        joined: (token, pos, clinic) => `Kem cho! ${clinic} ma aapnu swagat che. Aapno token number ${token} che. Haju ${pos} log aage che.`,
        ten_away: (token, current) => `${token} number wala, hun fakt 10 log baaki che. Haju ${current} chale che. Clinic taraf aavo.`,
        five_away: (token, current) => `${token} number wala, fakt 5 log baaki! Haju ${current} chale che. Taiyaar thao.`,
        soon: (token) => `${token} number wala, aaparo varo aavvani taiyari che. Clinic taraf aavo.`,
        now: (token) => `${token} number wala, aaparo varo aavi gayo! Doctor rahi rahya che.`,
        done: (clinic) => `Consultation puru thayun. ${clinic} ma aavva badal aabhar. Jaldi saara thao!`,
        paused: (clinic) => `${clinic} ni queue atyare rokavama aavi che. Krupa karine pachi prayas karo.`
    },
    kn: {
        joined: (token, pos, clinic) => `Namaskara! ${clinic} ge swagatav. Nimma token number ${token}. Ippaga ${pos} jana mundide.`,
        ten_away: (token, current) => `${token} number, ippaga 10 jana baaki ide. Ippaga ${current} nadeyuttide. Clinic kade banni.`,
        five_away: (token, current) => `${token} number, kevala 5 jana baaki! Ippaga ${current} nadeyuttide. Tayyaragi iri.`,
        soon: (token) => `${token} number, nimma sari hathira bandide. Clinic kade banni.`,
        now: (token) => `${token} number, nimma sari bandide! Doctor nimmaga kaayithidare.`,
        done: (clinic) => `Consultation mugiyitu. ${clinic} ge banda salakaagi dhanyavadagalu!`,
        paused: (clinic) => `${clinic} inda queue annu nillisiddare. Dayavittu nantara prayatnisi.`
    },
    ml: {
        joined: (token, pos, clinic) => `Namaskaram! ${clinic} il swagatam. Ningalude token number ${token} aanu. Ippol ${pos} per munpil undu.`,
        ten_away: (token, current) => `${token} number, ippol 10 per baaki undu. Ippol ${current} nadakkunnu. Clinic ilekku varoo.`,
        five_away: (token, current) => `${token} number, vettum 5 per baaki! Ippol ${current} nadakkunnu. Tayyarayi irikkoo.`,
        soon: (token) => `${token} number, ningalude oozham aduthu! Clinic ilekku varoo.`,
        now: (token) => `${token} number, ningalude gharam ethi! Doctor ningale kaathirikkunnu.`,
        done: (clinic) => `Consultation kazhinju. ${clinic} il vanna thanku. Vegam suhrikhatte!`,
        paused: (clinic) => `${clinic} queue ippol nirthi vechirikkukayanu. Dayavayi kurachu kazhinju shremikkuka.`
    },
    pa: {
        joined: (token, pos, clinic) => `Sat sri akal! ${clinic} vich aapda swagat hai. Aapda token number ${token} hai. Hune ${pos} log aage ne.`,
        ten_away: (token, current) => `${token} number wale, hun sirf 10 log baaki ne. Hune ${current} chal reha hai. Clinic wale aa jao.`,
        five_away: (token, current) => `${token} number wale, sirf 5 log baaki ne! Hune ${current} chal reha hai. Taiyaar ho jao.`,
        soon: (token) => `${token} number wale, aapdi wari aaun wali hai. Clinic wale aa jao.`,
        now: (token) => `${token} number wale, aapdi wari aa gayi! Doctor tenu intezaar kar reha hai.`,
        done: (clinic) => `Consultation mukk gaya. ${clinic} aun da shukriya. Jaldi theek ho jao!`,
        paused: (clinic) => `${clinic} di queue hun rok ditti gayi hai. Kripa karke thodi der baad koshish karo.`
    },
    en: {
        joined: (token, pos, clinic) => `Welcome to ${clinic}! Your token number is ${token}. There are ${pos} patients ahead of you. Please wait nearby.`,
        ten_away: (token, current) => `Token ${token}, only 10 more tokens to go! Currently serving ${current}. Please start making your way to the clinic.`,
        five_away: (token, current) => `Token ${token}, only 5 more tokens! Currently serving ${current}. Please get ready now.`,
        soon: (token) => `Token ${token}, it is almost your turn! Please make your way to the clinic now.`,
        now: (token) => `Token ${token}, it is your turn! The doctor is ready to see you. Please come in.`,
        done: (clinic) => `Your consultation is complete. Thank you for visiting ${clinic}. Get well soon!`,
        paused: (clinic) => `The queue at ${clinic} is currently paused. Please try again later.`
    }
}

// ── Sarvam AI voice per language ─────────────────────────────────────────────
const SARVAM_VOICES = {
    hi: 'neha', ta: 'rahul', te: 'rahul',
    mr: 'neha', bn: 'neha', gu: 'neha',
    kn: 'rahul', ml: 'rahul', pa: 'neha', en: 'neha'
}

// ── Normalize phone to 12-digit string with country code ─────────────────────
export function cleanPhone(phone) {
    let p = String(phone).replace(/\D/g, '')
    if (p.length === 10) p = '91' + p
    return p
}

// ── Get the Interakt-ready 10-digit number ───────────────────────────────────
function interaktPhone(phone) {
    const p = cleanPhone(phone)
    return p.startsWith('91') ? p.slice(2) : p
}

// ── Build voice text for an event ────────────────────────────────────────────
export function buildVoiceText({ language, event, token, position, clinicName, currentToken }) {
    const lang = language || 'en'
    const fns = MESSAGES[lang] || MESSAGES.en
    const clinic = clinicName || 'the clinic'
    const current = currentToken || ''

    if (event === 'joined') return fns.joined(token, position ?? 0, clinic)
    if (event === 'ten_away') return fns.ten_away(token, current)
    if (event === 'five_away') return fns.five_away(token, current)
    if (event === 'soon') return fns.soon(token)
    if (event === 'now' || event === 'called') return fns.now(token)
    if (event === 'done') return fns.done(clinic)
    if (event === 'paused') return fns.paused(clinic)
    return null
}

// ── Generate audio via Sarvam AI TTS ─────────────────────────────────────────
async function textToSpeech(text, language) {
    const lang = language || 'en'
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
            'api-subscription-key': SARVAM_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: [text],
            target_language_code: `${lang}-IN`,
            speaker: SARVAM_VOICES[lang] || 'neha',
            pace: 1.0,
            speech_sample_rate: 24000,
            enable_preprocessing: true,
            model: 'bulbul:v3',
            output_audio_codec: 'mp3'
        })
    })
    const data = await response.json()
    const base64 = data.audios?.[0] || data.audio || data.data
    if (!base64) throw new Error(`Sarvam error: ${JSON.stringify(data)}`)
    return base64
}

// ── Send text message via Interakt ───────────────────────────────────────────
export async function sendText(phone, message) {
    if (!INTERAKT_API_KEY) {
        console.warn('[Interakt] API key not configured — skipping text')
        return
    }
    const phoneNumber = interaktPhone(phone)
    try {
        const res = await fetch('https://api.interakt.ai/v1/public/message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + INTERAKT_API_KEY
            },
            body: JSON.stringify({
                countryCode: '+91',
                phoneNumber,
                callbackData: 'tokenpe_queue',
                type: 'Text',
                data: { message }
            })
        })
        const data = await res.json()
        console.log(`[Text] → +91${phoneNumber}:`, JSON.stringify(data))
    } catch (err) {
        console.error('[Text] Error:', err.message)
    }
}

// ── Send template message via Interakt ───────────────────────────────────────
export async function sendTemplateMessage({ phone, templateName, languageCode = 'en', bodyValues = [], headerValues = [], callbackData = 'tokenpe_broadcast' }) {
    if (!INTERAKT_API_KEY) {
        console.warn(`[Interakt] API key not configured — skipping template ${templateName}`)
        return
    }
    const phoneNumber = interaktPhone(phone)
    try {
        const payload = {
            countryCode: '+91',
            phoneNumber,
            callbackData,
            type: 'Template',
            template: {
                name: templateName,
                languageCode,
                bodyValues
            }
        }

        if (headerValues && headerValues.length > 0) {
            payload.template.headerValues = headerValues
        }

        const res = await fetch('https://api.interakt.ai/v1/public/message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + INTERAKT_API_KEY
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        console.log(`[Template ${templateName}] → +91${phoneNumber}:`, JSON.stringify(data))
        return data
    } catch (err) {
        console.error(`[Template ${templateName}] Error:`, err.message)
        return { result: false, message: err.message }
    }
}

// ── Send image message via Interakt ──────────────────────────────────────────
export async function sendImage(phone, mediaUrl, caption = '') {
    if (!INTERAKT_API_KEY) {
        console.warn('[Interakt] API key not configured — skipping image')
        return
    }
    const phoneNumber = interaktPhone(phone)
    try {
        const res = await fetch('https://api.interakt.ai/v1/public/message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + INTERAKT_API_KEY
            },
            body: JSON.stringify({
                countryCode: '+91',
                phoneNumber,
                callbackData: 'tokenpe_broadcast',
                type: 'Image',
                data: { mediaUrl, caption }
            })
        })
        const data = await res.json()
        console.log(`[Image] → +91${phoneNumber}:`, JSON.stringify(data))
    } catch (err) {
        console.error('[Image] Error:', err.message)
    }
}

// ── Send Interactive Rating Message via Interakt ──────────────────────────
export async function sendInteractiveRating(phone, clinicName) {
    if (!INTERAKT_API_KEY) {
        console.warn('[Interakt] API key not configured — skipping interactive rating')
        return
    }
    const phoneNumber = interaktPhone(phone)
    try {
        const res = await fetch('https://api.interakt.ai/v1/public/message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + INTERAKT_API_KEY
            },
            body: JSON.stringify({
                countryCode: '+91',
                phoneNumber,
                callbackData: 'tokenpe_rating',
                type: 'Interactive',
                data: {
                    type: 'list',
                    header: { type: 'text', text: '🌟 Rate Your Visit' },
                    body: { text: `How was your consultation at ${clinicName}? Your feedback helps us improve! 🙏\n\n_Powered by TokenPe_` },
                    action: {
                        button: 'Tap to Rate',
                        sections: [
                            {
                                title: 'Select Rating',
                                rows: [
                                    { id: '5', title: '⭐⭐⭐⭐⭐ Excellent' },
                                    { id: '4', title: '⭐⭐⭐⭐ Good' },
                                    { id: '3', title: '⭐⭐⭐ Average' },
                                    { id: '2', title: '⭐⭐ Fair' },
                                    { id: '1', title: '⭐ Poor' }
                                ]
                            }
                        ]
                    }
                }
            })
        })
        const data = await res.json()
        console.log(`[Rating Interactive] → +91${phoneNumber}:`, JSON.stringify(data))
    } catch (err) {
        console.error('[Rating Interactive] Error:', err.message)
    }
}

// ── Send CRM Interactive Rating Message via Interakt ───────────────────────
export async function sendCRMInteractiveRating(phone, clinicName) {
    if (!INTERAKT_API_KEY) {
        console.warn('[Interakt] API key not configured — skipping CRM rating')
        return
    }
    const phoneNumber = interaktPhone(phone)
    try {
        const res = await fetch('https://api.interakt.ai/v1/public/message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + INTERAKT_API_KEY
            },
            body: JSON.stringify({
                countryCode: '+91',
                phoneNumber,
                callbackData: 'tokenpe_crm_rating',
                type: 'Interactive',
                data: {
                    type: 'list',
                    header: { type: 'text', text: '🌟 TokenPe CRM Feedback' },
                    body: { text: `Was the recent update from ${clinicName} helpful?\n\n_Powered by TokenPe CRM_` },
                    action: {
                        button: 'Rate Feature',
                        sections: [
                            {
                                title: 'Select Rating',
                                rows: [
                                    { id: 'C5', title: 'C5 - Excellent' },
                                    { id: 'C4', title: 'C4 - Good' },
                                    { id: 'C3', title: 'C3 - Average' },
                                    { id: 'C2', title: 'C2 - Fair' },
                                    { id: 'C1', title: 'C1 - Poor' }
                                ]
                            }
                        ]
                    }
                }
            })
        })
        const data = await res.json()
        console.log(`[CRM Rating Interactive] → +91${phoneNumber}:`, JSON.stringify(data))
    } catch (err) {
        console.error('[CRM Rating Interactive] Error:', err.message)
    }
}

// ── Generate voice note + upload to Supabase + send via Interakt ─────────────
// keeps the function alive until it's fully done.
export async function sendVoice({ phone, language, event, token, position, clinicName, currentToken }) {
    if (!SARVAM_KEY) {
        console.warn('[Voice] SARVAM_API_KEY not set — skipping voice')
        return
    }

    const text = buildVoiceText({ language, event, token, position, clinicName, currentToken })
    if (!text) {
        console.warn('[Voice] Unknown event:', event)
        return
    }

    const clean = cleanPhone(phone)
    console.log(`[Voice] ${event} | ${language} | ${clean} | "${text.slice(0, 60)}..."`)

    // 1. Generate audio (Sarvam TTS)
    const base64Audio = await textToSpeech(text, language || 'en')
    const audioBuffer = Buffer.from(base64Audio, 'base64')

    // 2. Upload to Supabase Storage
    const fileName = `voice_${clean}_${Date.now()}.mp3`
    const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, audioBuffer, {
            contentType: 'audio/mpeg',
            cacheControl: '3600',
            upsert: true
        })
    if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`)

    // 3. Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(fileName)

    console.log(`[Voice] Uploaded: ${publicUrl}`)

    // 4. Send via Interakt as audio message
    if (!INTERAKT_API_KEY) {
        console.warn('[Voice] INTERAKT_API_KEY not set — skipping Interakt send')
        return
    }

    const phoneNumber = interaktPhone(phone)
    const res = await fetch('https://api.interakt.ai/v1/public/message/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + INTERAKT_API_KEY
        },
        body: JSON.stringify({
            countryCode: '+91',
            phoneNumber,
            callbackData: 'tokenpe_voice',
            type: 'Audio',
            data: { mediaUrl: publicUrl, caption: '' }
        })
    })
    const result = await res.json()
    console.log(`[Voice Audio] → +91${phoneNumber}:`, JSON.stringify(result))
}

// ── Send text + voice in parallel (fastest path) ─────────────────────────────
export async function sendTextAndVoice({ phone, language, event, token, position, clinicName, currentToken, textMessage }) {
    await Promise.all([
        sendText(phone, textMessage),
        sendVoice({ phone, language, event, token, position, clinicName, currentToken })
    ])
}
