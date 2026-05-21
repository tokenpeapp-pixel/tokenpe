import { supabase } from '../../../lib/supabase'

const SARVAM_KEY = process.env.SARVAM_API_KEY

const MESSAGES = {
    hi: {
        joined: (token, pos, clinic) => `Namaste! ${clinic} mein aapka swagat hai. Aapka token number ${token} hai. Abhi ${pos} log aage hain. Kripa pratiksha karein.`,
        ten_away: (token, current) => `${token} number wale ji, ab sirf 10 token baaki hain. Abhi ${current} chal raha hai. Clinic ki taraf chaliye.`,
        five_away: (token, current) => `${token} number wale ji, sirf 5 token baaki hain! Abhi ${current} chal raha hai. Kripya taiyaar ho jayein.`,
        soon: (token) => `${token} number wale ji, sirf 3 log baaki hain. Kripya clinic ki taraf aa jayein.`,
        now: (token) => `${token} number wale ji, aapki baari aa gayi hai. Doctor aapka intezaar kar rahe hain. Please andar aa jayein.`,
        done: (clinic) => `Aapka consultation complete hua. ${clinic} mein aane ka shukriya. Jaldi theek ho jayein!`
    },
    ta: {
        joined: (token, pos, clinic) => `Vanakkam! ${clinic} il ungalukkு varkaverppu. Ungal token number ${token}. Tharuvadhil ${pos} per ullanar.`,
        ten_away: (token, current) => `${token} number, innumm 10 per ullanar. Tharuvadhil ${current} nadakkirathu. Clinic noki varungal.`,
        five_away: (token, current) => `${token} number, innumm 5 per mattume! Tharuvadhil ${current} nadakkirathu. Thayaraaga irungal.`,
        soon: (token) => `${token} number, innumm 3 per mattume ullanar. Theruvukku varungal.`,
        now: (token) => `${token} number, ungal alar vandhachu! Doctor ungalai thirumbugirar.`,
        done: (clinic) => `Consultation mudinthathu. ${clinic} vanthatharku nandri. Viratam munnerugal!`
    },
    te: {
        joined: (token, pos, clinic) => `Namaskaram! ${clinic} ki swagatam. Mee token number ${token}. Ippudu ${pos} mandhi mundu unnaru.`,
        ten_away: (token, current) => `${token} number garu, inkaa 10 mandhe unnaru. Ippudu ${current} nadustundi. Clinic vaipu ravandi.`,
        five_away: (token, current) => `${token} number garu, kevalam 5 mandhe unnaru! Ippudu ${current} nadustundi. Tayyaruga undandi.`,
        soon: (token) => `${token} number garu, inkaa 3 mandhe unnaru. Clinic vaipu ravandi.`,
        now: (token) => `${token} number garu, mee vanta vachindi! Doctor meeru kosam veediksthunnaru.`,
        done: (clinic) => `Consultation purthi ayyindi. ${clinic} ki dhanyavadalu. Tvaraga kolukondi!`
    },
    mr: {
        joined: (token, pos, clinic) => `Namaskar! ${clinic} madhe aapale swagat aahe. Aapala token number ${token} aahe. Ata ${pos} log pudhe aahet.`,
        ten_away: (token, current) => `${token} number wale, ata fakt 10 log baaki aahet. Ata ${current} chalu aahe. Clinic kade yaa.`,
        five_away: (token, current) => `${token} number wale, fakt 5 log baaki aahet! Ata ${current} chalu aahe. Krupaya taiyaar vha.`,
        soon: (token) => `${token} number wale, fakt 3 log baaki aahet. Krupaya clinic kade yaa.`,
        now: (token) => `${token} number wale, aapali vel aali aahe! Doctor aapli vaat pahat aahet.`,
        done: (clinic) => `Consultation sampale. ${clinic} madhe alyabaddal dhanyavaad. Lavkar bara vha!`
    },
    bn: {
        joined: (token, pos, clinic) => `Namaskar! ${clinic} te apnake swagat. Apnar token number ${token}. Ekhon ${pos} jon samne achhen.`,
        ten_away: (token, current) => `${token} number, aro 10 jon baki. Ekhon ${current} cholche. Clinic er dike asun.`,
        five_away: (token, current) => `${token} number, matro 5 jon baki! Ekhon ${current} cholche. Tairi thakun.`,
        soon: (token) => `${token} number, matro 3 jon baki. Clinic er dike asun.`,
        now: (token) => `${token} number, apnar pala eshe geche! Doctor apnar jonno opekkha korchen.`,
        done: (clinic) => `Consultation sesh hoyeche. ${clinic} te asar jonno dhonyobad. Taratari sustha hon!`
    },
    gu: {
        joined: (token, pos, clinic) => `Kem cho! ${clinic} ma aapnu swagat che. Aapno token number ${token} che. Haju ${pos} log aage che.`,
        ten_away: (token, current) => `${token} number wala, hun fakt 10 log baaki che. Haju ${current} chale che. Clinic taraf aavo.`,
        five_away: (token, current) => `${token} number wala, fakt 5 log baaki! Haju ${current} chale che. Taiyaar thao.`,
        soon: (token) => `${token} number wala, fakt 3 log baki che. Clinic taraf aavo.`,
        now: (token) => `${token} number wala, aaparo varo aavi gayo! Doctor rahi rahya che.`,
        done: (clinic) => `Consultation puru thayun. ${clinic} ma aavva badal aabhar. Jaldi saara thao!`
    },
    kn: {
        joined: (token, pos, clinic) => `Namaskara! ${clinic} ge swagatav. Nimma token number ${token}. Ippaga ${pos} jana mundide.`,
        ten_away: (token, current) => `${token} number, ippaga 10 jana baaki ide. Ippaga ${current} nadeyuttide. Clinic kade banni.`,
        five_away: (token, current) => `${token} number, kevala 5 jana baaki! Ippaga ${current} nadeyuttide. Tayyaragi iri.`,
        soon: (token) => `${token} number, kevala 3 jana baki ide. Clinic kade banni.`,
        now: (token) => `${token} number, nimma sari bandide! Doctor nimmaga kaayithidare.`,
        done: (clinic) => `Consultation mugiyitu. ${clinic} ge banda salakaagi dhanyavadagalu!`
    },
    ml: {
        joined: (token, pos, clinic) => `Namaskaram! ${clinic} il swagatam. Ningalude token number ${token} aanu. Ippol ${pos} per munpil undu.`,
        ten_away: (token, current) => `${token} number, ippol 10 per baaki undu. Ippol ${current} nadakkunnu. Clinic ilekku varoo.`,
        five_away: (token, current) => `${token} number, vettum 5 per baaki! Ippol ${current} nadakkunnu. Tayyarayi irikkoo.`,
        soon: (token) => `${token} number, vettum 3 per baaki. Clinic te varoo.`,
        now: (token) => `${token} number, ningalude gharam ethi! Doctor ningale kaathirikkunnu.`,
        done: (clinic) => `Consultation kazhinju. ${clinic} il vanna thanku. Vegam suhrikhatte!`
    },
    pa: {
        joined: (token, pos, clinic) => `Sat sri akal! ${clinic} vich aapda swagat hai. Aapda token number ${token} hai. Hune ${pos} log aage ne.`,
        ten_away: (token, current) => `${token} number wale, hun sirf 10 log baaki ne. Hune ${current} chal reha hai. Clinic wale aa jao.`,
        five_away: (token, current) => `${token} number wale, sirf 5 log baaki ne! Hune ${current} chal reha hai. Taiyaar ho jao.`,
        soon: (token) => `${token} number wale, sirf 3 log baaki ne. Clinic wale aa jao.`,
        now: (token) => `${token} number wale, aapdi wari aa gayi! Doctor tenu intezaar kar reha hai.`,
        done: (clinic) => `Consultation mukk gaya. ${clinic} aun da shukriya. Jaldi theek ho jao!`
    },
    en: {
        joined: (token, pos, clinic) => `Welcome to ${clinic}! Your token number is ${token}. There are ${pos} patients ahead of you. Please wait nearby.`,
        ten_away: (token, current) => `Token ${token}, there are only 10 tokens remaining before yours. Currently serving ${current}. Please start making your way to the clinic.`,
        five_away: (token, current) => `Token ${token}, only 5 more tokens to go! Currently serving ${current}. Please get ready now.`,
        soon: (token) => `Token ${token}, only 3 patients remaining. Please make your way to the clinic now.`,
        now: (token) => `Token ${token}, it is your turn! The doctor is ready to see you. Please come in.`,
        done: (clinic) => `Your consultation is complete. Thank you for visiting ${clinic}. Get well soon!`
    }
}

const SARVAM_VOICES = {
    hi: 'neha', ta: 'rahul', te: 'rahul',
    mr: 'neha', bn: 'neha', gu: 'neha',
    kn: 'rahul', ml: 'rahul', pa: 'neha', en: 'neha'
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
            speaker: SARVAM_VOICES[language] || 'neha',
            pace: 1.0,
            speech_sample_rate: 8000,
            enable_preprocessing: true,
            model: 'bulbul:v3',
            output_audio_codec: 'mp3'
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

async function sendAiSensyVoiceNote(phone, audioUrl) {
    const AISENSY_API_KEY = process.env.AISENSY_API_KEY
    const campaignName = process.env.WHATSAPP_VOICE_CAMPAIGN || 'queue_voice_note'

    // Normalize phone number to contain exactly the country code and digits
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`
    }

    const response = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            apiKey: AISENSY_API_KEY,
            campaignName: campaignName,
            destination: cleanPhone,
            userName: 'Patient',
            media: {
                url: audioUrl,
                filename: 'voice.mp3'
            },
            templateParams: []
        })
    })

    const data = await response.json()
    console.log('AiSensy voice send response:', JSON.stringify(data))
    if (!response.ok || !data.success) {
        throw new Error(`AiSensy voice send failed: ${JSON.stringify(data)}`)
    }
}

export async function POST(req) {
    try {
        const { phone, language, event, token, position, clinicName, current } = await req.json()

        const lang = language || 'hi'
        const msgFns = MESSAGES[lang] || MESSAGES.hi
        const clinic = clinicName || 'the clinic'

        let text = ''
        if (event === 'joined') text = msgFns.joined(token, position, clinic)
        if (event === 'ten_away') text = msgFns.ten_away(token, current || '')
        if (event === 'five_away') text = msgFns.five_away(token, current || '')
        if (event === 'soon') text = msgFns.soon(token)
        if (event === 'now' || event === 'called') text = msgFns.now(token)
        if (event === 'done') text = msgFns.done(clinic)

        if (!text) return Response.json({ error: 'Unknown event' }, { status: 400 })

        // 1. Normalize phone number
        let cleanPhone = phone.replace(/\D/g, '')
        if (cleanPhone.length === 10) {
            cleanPhone = `91${cleanPhone}`
        }

        // 2. Generate voice note (base64)
        const base64Audio = await textToSpeech(text, lang)
        const audioBuffer = Buffer.from(base64Audio, 'base64')

        // 3. Upload to Supabase Storage (public bucket 'voice-notes')
        const fileName = `voice_${cleanPhone}_${Date.now()}.mp3`
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('voice-notes')
            .upload(fileName, audioBuffer, {
                contentType: 'audio/mpeg',
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            throw new Error(`Supabase storage upload failed: ${uploadError.message}`)
        }

        // 4. Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from('voice-notes')
            .getPublicUrl(fileName)

        console.log('Generated voice note public URL:', publicUrl)

        // 5. Send as WhatsApp voice note via AiSensy Campaign
        await sendAiSensyVoiceNote(phone, publicUrl)

        return Response.json({ success: true, publicUrl })
    } catch (err) {
        console.error('Voice error:', err.message)
        return Response.json({ error: err.message }, { status: 500 })
    }
}