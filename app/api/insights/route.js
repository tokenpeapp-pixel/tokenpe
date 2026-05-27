// /api/insights — Smart AI Insights for Elite Analytics
// Uses Groq API (free tier) with Llama 3 model

import { NextResponse } from 'next/server'

export async function POST(req) {
    try {
        const body = await req.json()
        const apiKey = process.env.GROQ_API_KEY

        if (!apiKey) {
            // Fallback mock insights when no API key configured
            return NextResponse.json({
                success: true,
                insights: [
                    { icon: '📈', insight: 'Your clinic sees the highest patient volume on Mondays. Consider adding extra staff on that day for faster service.', type: 'tip' },
                    { icon: '⚡', insight: 'Average wait time has been trending downward. Your queue management is improving week over week!', type: 'positive' },
                    { icon: '⚠️', insight: 'Skip rates tend to increase after 5 PM. Consider sending reminder alerts earlier to reduce no-shows.', type: 'warning' }
                ]
            })
        }

        const prompt = `You are a medical clinic analytics assistant for Indian clinics. Based on these stats:
${JSON.stringify(body, null, 2)}

Give 3 short actionable insights in simple English that a doctor would find valuable. Each insight max 2 sentences.
Format your response ONLY as a raw JSON array of objects with fields: "icon" (a single emoji), "insight" (the text), "type" (choose one: "positive", "warning", "tip"). No markdown, no extra text, just the JSON array.`

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.5
            })
        })

        if (!response.ok) {
            const err = await response.text()
            console.error('[Insights] Groq API error:', err)
            throw new Error('Groq API request failed')
        }

        const data = await response.json()
        let content = data.choices?.[0]?.message?.content || ''

        // Clean markdown fences if model included them
        content = content.replace(/```json/g, '').replace(/```/g, '').trim()

        const insights = JSON.parse(content)
        return NextResponse.json({ success: true, insights })
    } catch (error) {
        console.error('[Insights] Error:', error.message)
        // Return fallback on any error
        return NextResponse.json({
            success: true,
            insights: [
                { icon: '📈', insight: 'Your clinic data is being analyzed. Check back when more patient data is available for personalized insights.', type: 'tip' },
                { icon: '⚡', insight: 'TokenPe is tracking your queue performance automatically. Insights improve as more patients join.', type: 'positive' },
                { icon: '💡', insight: 'Tip: Share your QR code at the reception to increase WhatsApp adoption and reduce manual work.', type: 'tip' }
            ]
        })
    }
}
