const SARVAM_KEY = process.env.SARVAM_API_KEY

const MESSAGES = {
    hi: {
        joined: (token, pos, clinic) => `Namaste! ${clinic} mein aapka swagat hai. Aapka token number ${token} hai. Abhi ${pos} log aage hain. Kripa pratiksha karein.`,
        soon: (token) => `${token} number wale ji, sirf 3 log baaki hain. Kripya clinic ki taraf aa jayein.`,
        now: (token) => `${token} number wale ji, aapki baari aa gayi hai. Doctor aapka intezaar kar rahe hain. Please andar aa jayein.`,
        done: (clinic) => `Aapka consultation complete hua. ${clinic} mein aane ka shukriya. Jaldi theek ho jayein!`
    },
    ta: {
        joined: (token, pos, clinic) => `Vanakkam! ${clinic} il ungalukkு varkaverppu. Ungal token number ${token}. Tharuvadhil ${pos} per ullanar.`,
        soon: (token) => `${token} number, innumm 3 per mattume ullanar. Theruvukku varungal.`,
        now: (token) => `${token} number, ungal alar vandhachu! Doctor ungalai thirumbugirar.`,
        done: (clinic) => `Consultation mudinthathu. ${clinic} vanthatharku nandri. Viratam munnerugal!`
    },
    te: {
        joined: (token, pos, clinic) => `Namaskaram! ${clinic} ki swagatam. Mee token number ${token}. Ippudu ${pos} mandhi mundu unnaru.`,
        soon: (token) => `${token} number garu, inkaa 3 mandhe unnaru. Clinic vaipu ravandi.`,
        now: (token) => `${token} number garu, mee vanta vachindi! Doctor meeru kosam veediksthunnaru.`,
        done: (clinic) => `Consultation purthi ayyindi. ${clinic} ki dhanyavadalu. Tvaraga kolukondi!`
    },
    mr: {
        joined: (token, pos, clinic) => `Namaskar! ${clinic} madhe aapale swagat aahe. Aapala token number ${token} aahe. Ata ${pos} log pudhe aahet.`,
        soon: (token) => `${token} number wale, fakt 3 log baaki aahet. Krupaya clinic kade yaa.`,
        now: (token) => `${token} number wale, aapali vel aali aahe! Doctor aapli vaat pahat aahet.`,
        done: (clinic) => `Consultation sampale. ${clinic} madhe alyabaddal dhanyavaad. Lavkar bara vha!`
    },
    bn: {
        joined: (token, pos, clinic) => `Namaskar! ${clinic} te apnake swagat. Apnar token number ${token}. Ekhon ${pos} jon samne achhen.`,
        soon: (token) => `${token} number, matro 3 jon baki. Clinic er dike asun.`,
        now: (token) => `${token} number, apnar pala eshe geche! Doctor apnar jonno opekkha korchen.`,
        done: (clinic) => `Consultation sesh hoyeche. ${clinic} te asar jonno dhonyobad. Taratari sustha hon!`
    },
    gu: {
        joined: (token, pos, clinic) => `Kem cho! ${clinic} ma aapnu swagat che. Aapno token number ${token} che. Haju ${pos} log aage che.`,
        soon: (token) => `${token} number wala, fakt 3 log baki che. Clinic taraf aavo.`,
        now: (token) => `${token} number wala, aaparo varo aavi gayo! Doctor rahi rahya che.`,
        done: (clinic) => `Consultation puru thayun. ${clinic} ma aavva badal aabhar. Jaldi saara thao!`
    },
    kn: {
        joined: (token, pos, clinic) => `Namaskara! ${clinic} ge swagatav. Nimma token number ${token}. Ippaga ${pos} jana mundide.`,
        soon: (token) => `${token} number, kevala 3 jana baki ide. Clinic kade banni.`,
        now: (token) => `${token} number, nimma sari bandide! Doctor nimmaga kaayithidare.`,
        done: (clinic) => `Consultation mugiyitu. ${clinic} ge banda salakaagi dhanyavadagalu!`
    },
    ml: {
        joined: (token, pos, clinic) => `Namaskaram! ${clinic} il swagatam. Ningalude token number ${token} aanu. Ippol ${pos} per munpil undu.`,
        soon: (token) => `${token} number, vettum 3 per baaki. Clinic te varoo.`,
        now: (token) => `${token} number, ningalude gharam ethi! Doctor ningale kaathirikkunnu.`,
        done: (clinic) => `Consultation kazhinju. ${clinic} il vanna thanku. Vegam suhrikhatte!`
    },
    pa: {
        joined: (token, pos, clinic) => `Sat sri akal! ${clinic} vich aapda swagat hai. Aapda token number ${token} hai. Hune ${pos} log aage ne.`,
        soon: (token) => `${token} number wale, sirf 3 log baaki ne. Clinic wale aa jao.`,
        now: (token) => `${token} number wale, aapdi wari aa gayi! Doctor tenu intezaar kar reha hai.`,
        done: (clinic) => `Consultation mukk gaya. ${clinic} aun da shukriya. Jaldi theek ho jao!`
    },
    en: {
        joined: (token, pos, clinic) => `Welcome to ${clinic}! Your token number is ${token}. There are ${pos} patients ahead of you. Please wait nearby.`,
        soon: (token) => `Token ${token}, only 3 patients remaining. Please make your way to the clinic now.`,
        now: (token) => `Token ${token}, it is your turn! The doctor is ready to see you. Please come in.`,
        done: (clinic) => `Your consultation is complete. Thank you for visiting ${clinic}. Get well soon!`
    }
}

const SARVAM_VOICES = {
    hi: 'meera', ta: 'arjun', te: 'arvind',
    mr: 'meera', bn: 'meera', gu: 'meera',
    kn: 'arvind', ml: 'arvind', pa: 'meera', en: 'meera'
}

async function textToSpeech(text, language) {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
            'api-subscription-key': SARVAM_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: [text],
            target_language_code: `${language}-IN`,
            speaker: SARVAM_VOICES[language] || 'meera',
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 8000,
            enable_preprocessing: true,
            model: 'bulbul:v1'
        })
    })

    const data = await response.json()
    console.log('Sarvam response keys:', Object.keys(data))

    // Handle different response formats
    if (data.audios && data.audios[0]) return data.audios[0]
    if (data.audio) return data.audio
    if (data.data) return data.data

    throw new Error(`Sarvam error: ${JSON.stringify(data)}`)
}

async function sendWhatsAppVoiceNote(phone, base64Audio) {
    const TOKEN = process.env.WHATSAPP_TOKEN
    const PHONE_ID = process.env.WHATSAPP_PHONE_ID

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Audio, 'base64')

    // Upload to WhatsApp media
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: 'audio/wav' })
    formData.append('file', blob, 'voice.wav')
    formData.append('type', 'audio/wav')
    formData.append('messaging_product', 'whatsapp')

    const uploadRes = await fetch(
        `https://graph.facebook.com/v18.0/${PHONE_ID}/media`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${TOKEN}` },
            body: formData
        }
    )
    const uploadData = await uploadRes.json()
    console.log('WhatsApp upload response:', JSON.stringify(uploadData))

    if (!uploadData.id) throw new Error(`Media upload failed: ${JSON.stringify(uploadData)}`)

    // Send as voice note
    const sendRes = await fetch(
        `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: `91${phone}`,
                type: 'audio',
                audio: { id: uploadData.id }
            })
        }
    )
    const sendData = await sendRes.json()
    console.log('WhatsApp send response:', JSON.stringify(sendData))
}

export async function POST(req) {
    try {
        const { phone, language, event, token, position, clinicName } = await req.json()

        const lang = language || 'hi'
        const msgFns = MESSAGES[lang] || MESSAGES.hi
        const clinic = clinicName || 'the clinic'

        let text = ''
        if (event === 'joined') text = msgFns.joined(token, position, clinic)
        if (event === 'soon') text = msgFns.soon(token)
        if (event === 'now') text = msgFns.now(token)
        if (event === 'done') text = msgFns.done(clinic)

        if (!text) return Response.json({ error: 'Unknown event' }, { status: 400 })

        // Generate voice note
        const base64Audio = await textToSpeech(text, lang)

        // Send as WhatsApp voice note
        await sendWhatsAppVoiceNote(phone, base64Audio)

        return Response.json({ success: true })
    } catch (err) {
        console.error('Voice error:', err.message)
        return Response.json({ error: err.message }, { status: 500 })
    }
}