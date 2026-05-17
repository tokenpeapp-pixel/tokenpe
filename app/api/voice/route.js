// app/api/voice/route.js
// Generates voice note via Sarvam AI and sends via WhatsApp

const LANGUAGES = {
    hi: {
        sarvamCode: 'hi-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Namaste! ${clinic} mein aapka swagat hai. Aapka token number ${token} hai. Aapke aage ${position} log hain. Hum aapko aapki baari aane par soochit karenge.`,
            soon: (token) =>
                `${token} number wale ji, sirf 3 log aur baaki hain. Kripya ab clinic ki taraf aa jayein.`,
            now: (token) =>
                `${token} number wale ji, aapki baari aa gayi hai! Doctor sahab aapka intezaar kar rahe hain. Andar aa jayein.`,
            done: (clinic) =>
                `Aapka consultation poora hua. ${clinic} mein aane ka shukriya. Jaldi theek ho jayein!`,
        }
    },
    ta: {
        sarvamCode: 'ta-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Vanakkam! ${clinic} க்கு வரவேற்கிறோம். உங்கள் token ${token}. உங்களுக்கு முன் ${position} நபர்கள் உள்ளனர்.`,
            soon: (token) =>
                `Token ${token}, இன்னும் 3 நபர்கள் மட்டுமே. தயவுசெய்து கிளினிக்கிற்கு வாருங்கள்.`,
            now: (token) =>
                `Token ${token}, உங்கள் முறை வந்துவிட்டது! டாக்டர் காத்திருக்கிறார். உள்ளே வாருங்கள்.`,
            done: (clinic) =>
                `உங்கள் சிகிச்சை முடிந்தது. ${clinic} வந்தமைக்கு நன்றி. விரைவில் குணமடையுங்கள்!`,
        }
    },
    te: {
        sarvamCode: 'te-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Namaskaram! ${clinic} కు స్వాగతం. మీ token ${token}. మీకు ముందు ${position} మంది ఉన్నారు.`,
            soon: (token) =>
                `Token ${token}, ఇంకా 3 మంది మాత్రమే. దయచేసి క్లినిక్ కి రండి.`,
            now: (token) =>
                `Token ${token}, మీ వంతు వచ్చింది! డాక్టర్ వేచి ఉన్నారు. లోపలికి రండి.`,
            done: (clinic) =>
                `మీ సంప్రదింపు పూర్తైంది. ${clinic} కి వచ్చినందుకు ధన్యవాదాలు.`,
        }
    },
    mr: {
        sarvamCode: 'mr-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Namaskar! ${clinic} madhe aapale swagat ahe. Aapla token ${token} ahe. Aaphalyapudhe ${position} rugna ahet.`,
            soon: (token) =>
                `Token ${token} dharak, fakt 3 rugna shillak ahet. Krupaya aata davakhan yakadat ya.`,
            now: (token) =>
                `Token ${token} dharak, aapali veli ali ahe! Doctor aapli vat pahat ahet. Aata ya.`,
            done: (clinic) =>
                `Aapache consultation pure zale. ${clinic} madhe alyabaddal dhanyavad. Lavkar bare vha!`,
        }
    },
    bn: {
        sarvamCode: 'bn-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Namaskar! ${clinic} te apnake swagat. Apnar token ${token}. Apnar age ${position} jon achen.`,
            soon: (token) =>
                `Token ${token}, matro ar 3 jon baki. Ekhoni clinic er dike asun.`,
            now: (token) =>
                `Token ${token}, apnar pala eseche! Doctor apnar jonyo apeksha korchen. Bhitore asun.`,
            done: (clinic) =>
                `Apnar consultation sompanna hoyeche. ${clinic} te asar jonyo dhanyabad.`,
        }
    },
    gu: {
        sarvamCode: 'gu-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Namaste! ${clinic} ma aapnu swagat che. Aapno token ${token} che. Aapni aage ${position} dardiyo che.`,
            soon: (token) =>
                `Token ${token}, have fakt 3 dardi baki che. Krupaya clinic taraf aavo.`,
            now: (token) =>
                `Token ${token}, aapno varo aavi gayo che! Doctor taiyar che. Andhar aavo.`,
            done: (clinic) =>
                `Aapnu consultation puru thayun. ${clinic} ma aavva badal aabhar.`,
        }
    },
    kn: {
        sarvamCode: 'kn-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Namaskara! ${clinic} ge swagata. Nimma token ${token}. Nimma mundhe ${position} jana iddaree.`,
            soon: (token) =>
                `Token ${token}, inu 3 jana mattra iddaree. Dayavittu clinic ge banni.`,
            now: (token) =>
                `Token ${token}, nimma saradi banthu! Vaidyaru nimage kaayuttiddaree. Odage banni.`,
            done: (clinic) =>
                `Nimma consultation mugiyitu. ${clinic} ge banda badalu dhanyavaadagalu.`,
        }
    },
    ml: {
        sarvamCode: 'ml-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Namaskaram! ${clinic} il swaagatham. Ningalude token ${token}. Ningalkku munpil ${position} peruund.`,
            soon: (token) =>
                `Token ${token}, innum 3 per maatram. Dayavayi clinic ilekku varuka.`,
            now: (token) =>
                `Token ${token}, ningalude ghoram ayi! Doctor kaattirikkunu. Akattu varuka.`,
            done: (clinic) =>
                `Consultation kazhinju. ${clinic} il vannadinu nandi.`,
        }
    },
    pa: {
        sarvamCode: 'pa-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Sat Sri Akal! ${clinic} vich aapda swagat hai. Aapda token ${token} hai. Aapde ton pehlan ${position} mareez hain.`,
            soon: (token) =>
                `Token ${token}, sirf 3 hor mareez baaki hain. Kripaa hun clinic wal aa jao.`,
            now: (token) =>
                `Token ${token}, aapdi vaari aa gayi hai! Doctor sahib aapda intezaar kar rahe hain. Andar aao.`,
            done: (clinic) =>
                `Aapdi consultation mukk gayi. ${clinic} vich aun da shukriya.`,
        }
    },
    en: {
        sarvamCode: 'en-IN',
        messages: {
            joined: (token, position, clinic) =>
                `Hello and welcome to ${clinic}! Your token number is ${token}. There are ${position} patients ahead of you. We will notify you when your turn is near.`,
            soon: (token) =>
                `Token ${token}, only 3 more patients ahead. Please make your way to the clinic now.`,
            now: (token) =>
                `Token ${token}, it is your turn! The doctor is ready for you. Please come inside now.`,
            done: (clinic) =>
                `Your consultation is complete. Thank you for visiting ${clinic}. We wish you a speedy recovery!`,
        }
    },
}

export async function POST(req) {
    try {
        const { phone, language, event, token, position, clinicName } = await req.json()

        const lang = LANGUAGES[language] || LANGUAGES['hi']
        let text = ''

        switch (event) {
            case 'joined': text = lang.messages.joined(token, position || 0, clinicName); break
            case 'soon': text = lang.messages.soon(token); break
            case 'now': text = lang.messages.now(token); break
            case 'done': text = lang.messages.done(clinicName); break
            default: return new Response('Invalid event', { status: 400 })
        }

        // Step 1: Generate voice via Sarvam AI
        const ttsRes = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
                'api-subscription-key': process.env.SARVAM_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: [text],
                target_language_code: lang.sarvamCode,
                speaker: 'meera',
                pace: 0.9,
                loudness: 1.5,
                speech_sample_rate: 22050,
                enable_preprocessing: true,
                model: 'bulbul:v1',
            }),
        })

        const ttsData = await ttsRes.json()
        const audioBase64 = ttsData.audios[0]
        const audioBuffer = Buffer.from(audioBase64, 'base64')

        // Step 2: Upload to WhatsApp
        const formData = new FormData()
        const blob = new Blob([audioBuffer], { type: 'audio/wav' })
        formData.append('file', blob, 'voice.wav')
        formData.append('type', 'audio/wav')
        formData.append('messaging_product', 'whatsapp')

        const uploadRes = await fetch(
            `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/media`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
                body: formData,
            }
        )
        const { id: mediaId } = await uploadRes.json()

        // Step 3: Send as voice note
        await fetch(
            `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: `91${phone}`,
                    type: 'audio',
                    audio: { id: mediaId },
                }),
            }
        )

        return new Response(JSON.stringify({ success: true }), { status: 200 })
    } catch (err) {
        console.error('Voice note error:', err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
}