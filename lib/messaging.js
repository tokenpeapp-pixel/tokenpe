// lib/messaging.js
// ── Shared utility: TTS via Sarvam, upload to Supabase, send via Interakt ──
// Used by all queue API routes to avoid duplicate code and extra HTTP hops.

import { supabase } from './supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')


const SARVAM_KEY = process.env.SARVAM_API_KEY
const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY

// ── Voice messages in 10 Indian languages ────────────────────────────────────
const MESSAGES = {
    hi: {
        joined: (token, pos, clinic) => `नमस्ते! ${clinic} में आपका स्वागत है। आपका टोकन नंबर ${token} है। अभी ${pos} लोग आगे हैं। कृपया प्रतीक्षा करें।`,
        ten_away: (token, current) => `${token} नंबर वाले जी, अब सिर्फ 10 टोकन बाकी हैं। अभी ${current} चल रहा है। क्लिनिक की तरफ चलिए।`,
        five_away: (token, current) => `${token} number wale ji, sirf 5 token baaki hain! Abhi ${current} chal raha hai. Kripya taiyaar ho jayein.`, // Leaving five_away as native script
        soon: (token) => `${token} नंबर वाले जी, अब बस आपकी बारी आने वाली है। कृपया क्लिनिक की तरफ आ जाएं।`,
        now: (token) => `${token} नंबर वाले जी, आपकी बारी आ गई है। डॉक्टर आपका इंतज़ार कर रहे हैं। प्लीज़ अंदर आ जाएं।`,
        done: (clinic) => `आपका कंसल्टेशन पूरा हुआ। ${clinic} में आने का शुक्रिया। जल्दी ठीक हो जाएं!`,
        rating: () => `आपका कंसल्टेशन पूरा हो गया है। कृपया अपनी स्क्रीन पर दिए गए बटन को दबाकर अपना अनुभव बताएं।`,
        paused: (clinic) => `${clinic} की कतार अभी रोकी गई है। कृपया थोड़ी देर बाद प्रयास करें।`
    },
    ta: {
        joined: (token, pos, clinic) => `வணக்கம்! ${clinic} இல் உங்களுக்கு வரவேற்பு. உங்கள் டோக்கன் எண் ${token}. வரிசையில் ${pos} பேர் உள்ளனர்.`,
        ten_away: (token, current) => `${token} எண், இன்னும் 10 பேர் உள்ளனர். தற்போது ${current} நடக்கிறது. கிளினிக் நோக்கி வாருங்கள்.`,
        five_away: (token, current) => `${token} எண், இன்னும் 5 பேர் மட்டுமே! தற்போது ${current} நடக்கிறது. தயாராக இருங்கள்.`,
        soon: (token) => `${token} எண், உங்கள் முறை நெருங்கி விட்டது. கிளினிக் நோக்கி வாருங்கள்.`,
        now: (token) => `${token} எண், உங்கள் முறை வந்துவிட்டது! மருத்துவர் உங்களை எதிர்பார்க்கிறார்.`,
        done: (clinic) => `ஆலோசனை முடிந்தது. ${clinic} வந்ததற்கு நன்றி. விரைவில் குணமடையுங்கள்!`,
        rating: () => `உங்கள் ஆலோசனை முடிந்தது. தயவுசெய்து திரையில் உள்ள பட்டனை அழுத்தி உங்கள் அனுபவத்தை மதிப்பிடவும்.`,
        paused: (clinic) => `${clinic} இன் வரிசை தற்காலிகமாக நிறுத்தப்பட்டுள்ளது. தயவுசெய்து பிறகு முயற்சிக்கவும்.`
    },
    te: {
        joined: (token, pos, clinic) => `నమస్కారం! ${clinic} కి స్వాగతం. మీ టోకెన్ నంబర్ ${token}. ఇప్పుడు ${pos} మంది ముందు ఉన్నారు.`,
        ten_away: (token, current) => `${token} నంబర్ గారు, ఇంకా 10 మందే ఉన్నారు. ఇప్పుడు ${current} నడుస్తుంది. క్లినిక్ వైపు రండి.`,
        five_away: (token, current) => `${token} నంబర్ గారు, కేవలం 5 మందే ఉన్నారు! ఇప్పుడు ${current} నడుస్తుంది. సిద్ధంగా ఉండండి.`,
        soon: (token) => `${token} నంబర్ గారు, మీ వంతు దగ్గరపడింది. క్లినిక్ వైపు రండి.`,
        now: (token) => `${token} నంబర్ గారు, మీ వంతు వచ్చింది! డాక్టర్ మీ కోసం వేచి చూస్తున్నారు.`,
        done: (clinic) => `కన్సల్టేషన్ పూర్తయింది. ${clinic} కి ధన్యవాదాలు. త్వరగా కోలుకోండి!`,
        rating: () => `మీ కన్సల్టేషన్ పూర్తయింది. దయచేసి స్క్రీన్ పై ఉన్న బటన్ నొక్కి మీ అనుభవాన్ని తెలియజేయండి.`,
        paused: (clinic) => `${clinic} ద్వారా క్యూ ఆపబడింది. దయచేసి తర్వాత ప్రయత్నించండి.`
    },
    mr: {
        joined: (token, pos, clinic) => `नमस्कार! ${clinic} मध्ये आपले स्वागत आहे. आपला टोकन नंबर ${token} आहे. आता ${pos} लोक पुढे आहेत.`,
        ten_away: (token, current) => `${token} नंबर वाले, आता फक्त 10 लोक बाकी आहेत. आता ${current} चालू आहे. क्लिनिक कडे या.`,
        five_away: (token, current) => `${token} नंबर वाले, फक्त 5 लोक बाकी आहेत! आता ${current} चालू आहे. कृपया तयार व्हा.`,
        soon: (token) => `${token} नंबर वाले, आपली वेळ जवळ आली आहे. कृपया क्लिनिक कडे या.`,
        now: (token) => `${token} नंबर वाले, आपली वेळ आली आहे! डॉक्टर आपली वाट पाहत आहेत.`,
        done: (clinic) => `कन्सल्टेशन संपले. ${clinic} मध्ये आल्याबद्दल धन्यवाद. लवकर बरे व्हा!`,
        rating: () => `आपले कन्सल्टेशन पूर्ण झाले आहे. कृपया स्क्रीनवरील बटन दाबून आपले मत नोंदवा.`,
        paused: (clinic) => `${clinic} कडून रांग सध्या थांबवली आहे. कृपया नंतर प्रयत्न करा.`
    },
    bn: {
        joined: (token, pos, clinic) => `নমস্কার! ${clinic} এ আপনাকে স্বাগত। আপনার টোকেন নম্বর ${token}। এখন ${pos} জন সামনে আছেন।`,
        ten_away: (token, current) => `${token} নম্বর, আর ১০ জন বাকি। এখন ${current} চলছে। ক্লিনিকের দিকে আসুন।`,
        five_away: (token, current) => `${token} নম্বর, মাত্র ৫ জন বাকি! এখন ${current} চলছে। তৈরি থাকুন।`,
        soon: (token) => `${token} নম্বর, আপনার পালা প্রায় চলে এসেছে। ক্লিনিকের দিকে আসুন।`,
        now: (token) => `${token} নম্বর, আপনার পালা এসে গেছে! ডাক্তার আপনার জন্য অপেক্ষা করছেন।`,
        done: (clinic) => `কনসালটেশন শেষ হয়েছে। ${clinic} এ আসার জন্য ধন্যবাদ। তাড়াতাড়ি সুস্থ হোন!`,
        rating: () => `আপনার কনসালটেশন শেষ হয়েছে। অনুগ্রহ করে স্ক্রিনে থাকা বোতাম টিপে আপনার মতামত জানান।`,
        paused: (clinic) => `${clinic} এর কিউ এখন বন্ধ রাখা হয়েছে। অনুগ্রহ করে পরে চেষ্টা করুন।`
    },
    gu: {
        joined: (token, pos, clinic) => `કેમ છો! ${clinic} માં આપણું સ્વાગત છે. આપણો ટોકન નંબર ${token} છે. હજુ ${pos} લોકો આગળ છે.`,
        ten_away: (token, current) => `${token} નંબર વાળા, હવે ફક્ત 10 લોકો બાકી છે. હજુ ${current} ચાલે છે. ક્લિનિક તરફ આવો.`,
        five_away: (token, current) => `${token} નંબર વાળા, ફક્ત 5 લોકો બાકી! હજુ ${current} ચાલે છે. તૈયાર થાઓ.`,
        soon: (token) => `${token} નંબર વાળા, આપનો વારો આવવાની તૈયારી છે. ક્લિનિક તરફ આવો.`,
        now: (token) => `${token} નંબર વાળા, આપનો વારો આવી ગયો! ડોક્ટર રાહ જોઈ રહ્યા છે.`,
        done: (clinic) => `કન્સલ્ટેશન પૂરું થયું. ${clinic} માં આવવા બદલ આભાર. જલ્દી સારા થાઓ!`,
        rating: () => `આપનું કન્સલ્ટેશન પૂરું થયું છે. કૃપા કરીને સ્ક્રીન પર આપેલ બટન દબાવીને આપનો અનુભવ જણાવો.`,
        paused: (clinic) => `${clinic} ની કતાર અત્યારે રોકવામાં આવી છે. કૃપા કરીને પછી પ્રયાસ કરો.`
    },
    kn: {
        joined: (token, pos, clinic) => `ನಮಸ್ಕಾರ! ${clinic} ಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ಟೋಕನ್ ನಂಬರ್ ${token}. ಈಗ ${pos} ಜನ ಮುಂದಿದ್ದಾರೆ.`,
        ten_away: (token, current) => `${token} ನಂಬರ್, ಈಗ 10 ಜನ ಬಾಕಿ ಇದ್ದಾರೆ. ಈಗ ${current} ನಡೆಯುತ್ತಿದೆ. ಕ್ಲಿನಿಕ್ ಕಡೆ ಬನ್ನಿ.`,
        five_away: (token, current) => `${token} ನಂಬರ್, ಕೇವಲ 5 ಜನ ಬಾಕಿ! ಈಗ ${current} ನಡೆಯುತ್ತಿದೆ. ತಯಾರಾಗಿರಿ.`,
        soon: (token) => `${token} ನಂಬರ್, ನಿಮ್ಮ ಸರದಿ ಹತ್ತಿರ ಬಂದಿದೆ. ಕ್ಲಿನಿಕ್ ಕಡೆ ಬನ್ನಿ.`,
        now: (token) => `${token} ನಂಬರ್, ನಿಮ್ಮ ಸರದಿ ಬಂದಿದೆ! ಡಾಕ್ಟರ್ ನಿಮಗಾಗಿ ಕಾಯುತ್ತಿದ್ದಾರೆ.`,
        done: (clinic) => `ಕನ್ಸಲ್ಟೇಶನ್ ಮುಗಿಯಿತು. ${clinic} ಗೆ ಬಂದಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!`,
        rating: () => `ನಿಮ್ಮ ಕನ್ಸಲ್ಟೇಶನ್ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಸ್ಕ್ರೀನ್ ನಲ್ಲಿರುವ ಬಟನ್ ಒತ್ತಿ ನಿಮ್ಮ ಅನುಭವವನ್ನು ತಿಳಿಸಿ.`,
        paused: (clinic) => `${clinic} ಕಡೆಯಿಂದ ಕ್ಯೂ ಅನ್ನು ನಿಲ್ಲಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.`
    },
    ml: {
        joined: (token, pos, clinic) => `നമസ്കാരം! ${clinic} ൽ സ്വാഗതം. നിങ്ങളുടെ ടോക്കൺ നമ്പർ ${token} ആണ്. ഇപ്പോൾ ${pos} പേർ മുൻപിലുണ്ട്.`,
        ten_away: (token, current) => `${token} നമ്പർ, ഇപ്പോൾ 10 പേർ ബാക്കിയുണ്ട്. ഇപ്പോൾ ${current} നടക്കുന്നു. ക്ലിനിക്കിലേക്ക് വരൂ.`,
        five_away: (token, current) => `${token} നമ്പർ, വെറും 5 പേർ ബാക്കി! ഇപ്പോൾ ${current} നടക്കുന്നു. തയ്യാറായി ഇരിക്കൂ.`,
        soon: (token) => `${token} നമ്പർ, നിങ്ങളുടെ ഊഴം അടുത്തു! ക്ലിനിക്കിലേക്ക് വരൂ.`,
        now: (token) => `${token} നമ്പർ, നിങ്ങളുടെ ഊഴം എത്തി! ഡോക്ടർ നിങ്ങളെ കാത്തിരിക്കുന്നു.`,
        done: (clinic) => `കൺസൾട്ടേഷൻ കഴിഞ്ഞു. ${clinic} ൽ വന്നതിന് നന്ദി. വേഗം സുഖം പ്രാപിക്കട്ടെ!`,
        rating: () => `നിങ്ങളുടെ കൺസൾട്ടേഷൻ കഴിഞ്ഞു. ദയവായി സ്ക്രീനിലെ ബട്ടൺ അമർത്തി നിങ്ങളുടെ അഭിപ്രായം അറിയിക്കുക.`,
        paused: (clinic) => `${clinic} ക്യൂ ഇപ്പോൾ നിർത്തി വെച്ചിരിക്കുകയാണ്. ദയവായി കുറച്ചു കഴിഞ്ഞു ശ്രമിക്കുക.`
    },
    pa: {
        joined: (token, pos, clinic) => `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ${clinic} ਵਿੱਚ ਆਪ ਜੀ ਦਾ ਸਵਾਗਤ ਹੈ। ਆਪ ਜੀ ਦਾ ਟੋਕਨ ਨੰਬਰ ${token} ਹੈ। ਹੁਣ ${pos} ਲੋਕ ਅੱਗੇ ਨੇ।`,
        ten_away: (token, current) => `${token} ਨੰਬਰ ਵਾਲੇ, ਹੁਣ ਸਿਰਫ਼ 10 ਲੋਕ ਬਾਕੀ ਨੇ। ਹੁਣ ${current} ਚੱਲ ਰਿਹਾ ਹੈ। ਕਲੀਨਿਕ ਵੱਲ ਆ ਜਾਓ।`,
        five_away: (token, current) => `${token} ਨੰਬਰ ਵਾਲੇ, ਸਿਰਫ਼ 5 ਲੋਕ ਬਾਕੀ ਨੇ! ਹੁਣ ${current} ਚੱਲ ਰਿਹਾ ਹੈ। ਤਿਆਰ ਹੋ ਜਾਓ।`,
        soon: (token) => `${token} ਨੰਬਰ ਵਾਲੇ, ਆਪ ਦੀ ਵਾਰੀ ਆਉਣ ਵਾਲੀ ਹੈ। ਕਲੀਨਿਕ ਵੱਲ ਆ ਜਾਓ।`,
        now: (token) => `${token} ਨੰਬਰ ਵਾਲੇ, ਆਪ ਦੀ ਵਾਰੀ ਆ ਗਈ! ਡਾਕਟਰ ਤੇਰਾ ਇੰਤਜ਼ਾਰ ਕਰ ਰਿਹਾ ਹੈ।`,
        done: (clinic) => `ਕੰਸਲਟੇਸ਼ਨ ਮੁੱਕ ਗਿਆ। ${clinic} ਆਉਣ ਦਾ ਸ਼ੁਕਰੀਆ। ਜਲਦੀ ਠੀਕ ਹੋ ਜਾਓ!`,
        rating: () => `ਆਪ ਦਾ ਕੰਸਲਟੇਸ਼ਨ ਪੂਰਾ ਹੋ ਗਿਆ ਹੈ। ਕ੍ਰਿਪਾ ਕਰਕੇ ਸਕ੍ਰੀਨ ਤੇ ਦਿੱਤੇ ਬਟਨ ਨੂੰ ਦਬਾ ਕੇ ਆਪਣਾ ਅਨੁਭਵ ਦੱਸੋ।`,
        paused: (clinic) => `${clinic} ਦੀ ਕਤਾਰ ਹੁਣ ਰੋਕ ਦਿੱਤੀ ਗਈ ਹੈ। ਕ੍ਰਿਪਾ ਕਰਕੇ ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਕੋਸ਼ਿਸ਼ ਕਰੋ।`
    },
    en: {
        joined: (token, pos, clinic) => `Welcome to ${clinic}! Your token number is ${token}. There are ${pos} patients ahead of you. Please wait nearby.`,
        ten_away: (token, current) => `Token ${token}, only 10 more tokens to go! Currently serving ${current}. Please start making your way to the clinic.`,
        five_away: (token, current) => `Token ${token}, only 5 more tokens! Currently serving ${current}. Please get ready now.`,
        soon: (token) => `Token ${token}, it is almost your turn! Please make your way to the clinic now.`,
        now: (token) => `Token ${token}, it is your turn! The doctor is ready to see you. Please come in.`,
        done: (clinic) => `Your consultation is complete. Thank you for visiting ${clinic}. Get well soon!`,
        rating: () => `Your consultation is complete. Please tap the button on your screen to rate your visit.`,
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
    if (event === 'rating') return fns.rating()
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
export async function sendInteractiveRating(phone, clinicName, language = 'en') {
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
                type: 'InteractiveList',
                data: {
                    message: {
                        type: 'list',
                        header: { type: 'text', text: 'Rate Your Visit' },
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
                }
            })
        })
        const data = await res.json()
        console.log(`[Rating Interactive] → +91${phoneNumber}:`, JSON.stringify(data))

        // Send the rating voice note
        await sendVoice({
            phone: phoneNumber,
            language: language,
            event: 'rating',
            clinicName: clinicName
        })
    } catch (err) {
        console.error('[Rating Interactive] Error:', err.message)
    }
}

// ── Send CRM Interactive Rating Message via Interakt ───────────────────────
export async function sendCRMInteractiveRating(phone, clinicName, language = 'en') {
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
                type: 'InteractiveList',
                data: {
                    message: {
                        type: 'list',
                        header: { type: 'text', text: 'TokenPe CRM Feedback' },
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

// ── Send Welcome Email (Resend) ─────────────────────────────────────────────
export async function sendWelcomeEmail(toEmail, clinicName) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY not configured — skipping welcome email')
        return
    }
    
    const emailHtml = `
      <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
        <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:36px;margin-bottom:24px;" />
        <h2 style="color:#a78bfa;font-size:22px;margin-bottom:8px;">Welcome to TokenPe, ${clinicName}! 🎉</h2>
        <p style="color:#94a3b8;">Your account has been successfully created.</p>
        <p>You are now on a <strong>14-Day Free Trial of our Elite Plan</strong>. Experience the power of AI voice alerts, WhatsApp queue management, and our comprehensive CRM.</p>
        
        <div style="margin-top:24px;">
          <a href="https://tokenpe.online/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
            Go to Dashboard →
          </a>
        </div>
        <p style="margin-top:24px;font-size:12px;color:#475569;">Questions? Email support@tokenpe.online</p>
      </div>
    `
    try {
        await resend.emails.send({
            from: 'TokenPe <support@tokenpe.online>',
            to: toEmail,
            subject: '🎉 Welcome to TokenPe! Your 14-Day Elite Trial starts now',
            html: emailHtml
        })
        console.log(`[Email] Welcome sent to ${toEmail}`)
    } catch (err) {
        console.error('[Email] Failed to send welcome:', err.message)
    }
}

