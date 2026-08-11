import { NextResponse } from 'next/server'
import { handleIncomingMessage } from '../../../../lib/chatbot'

export async function POST(request) {
    try {
        const body = await request.json()
        console.log('[MSG91 Webhook] Incoming payload:', JSON.stringify(body, null, 2))

        // MSG91 WhatsApp Inbound Payload parsing
        // This handles different formats (text, interactive, buttons)
        const senderPhone = body.sender?.phone || body.from || body.contacts?.[0]?.wa_id || body.phone;
        
        let messageText = '';
        const msgType = body.type || body.messages?.[0]?.type;
        const msgData = body.messages?.[0] || body;

        if (msgType === 'text') {
            messageText = msgData.text?.text || msgData.text?.body || '';
        } else if (msgType === 'interactive') {
            const interactive = msgData.interactive;
            if (interactive?.type === 'button_reply') {
                messageText = interactive.button_reply.id || interactive.button_reply.title;
            } else if (interactive?.type === 'list_reply') {
                messageText = interactive.list_reply.id || interactive.list_reply.title;
            }
        } else if (msgType === 'button') {
            messageText = msgData.button?.text || '';
        } else {
            // Fallback for simple formats
            messageText = body.text?.text || body.text || '';
        }

        if (!senderPhone || !messageText) {
            console.warn('[MSG91 Webhook] Missing phone or text in payload')
            return NextResponse.json({ status: 'ignored', reason: 'missing data' }, { status: 200 })
        }

        // Process the message through our Chatbot logic
        // We do this asynchronously to not block the webhook response (MSG91 expects 200 OK quickly)
        handleIncomingMessage(senderPhone, messageText, body).catch(err => {
            console.error('[MSG91 Webhook] Chatbot handling error:', err)
        })

        // Always return 200 OK quickly
        return NextResponse.json({ status: 'received' }, { status: 200 })

    } catch (error) {
        console.error('[MSG91 Webhook] Error processing request:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
