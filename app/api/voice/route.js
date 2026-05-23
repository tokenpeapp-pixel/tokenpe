// FILE: /app/api/voice/route.js
// Standalone voice note endpoint — wraps lib/messaging.sendVoice
// Note: queue routes (next/done/notify) call sendVoice() directly from lib/messaging
// to avoid the extra HTTP hop. This endpoint is kept for external/direct use only.

import { sendVoice } from '../../../lib/messaging'

export async function POST(req) {
    try {
        const { phone, language, event, token, position, clinicName, currentToken } = await req.json()

        if (!phone || !event || !token) {
            return Response.json({ error: 'Missing required fields: phone, event, token' }, { status: 400 })
        }

        await sendVoice({ phone, language, event, token, position, clinicName, currentToken })

        return Response.json({ success: true })

    } catch (err) {
        console.error('[/api/voice] Error:', err.message)
        return Response.json({ error: err.message }, { status: 500 })
    }
}