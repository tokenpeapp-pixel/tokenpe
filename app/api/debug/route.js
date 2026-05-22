// FILE: /app/api/debug/route.js
// Quick diagnostic endpoint — visit in browser to check env + test webhook
// REMOVE THIS FILE IN PRODUCTION if you want to keep env vars private

import { supabase } from '../../../lib/supabase'

export async function GET(req) {
    const { searchParams } = new URL(req.url)

    // ── Test: simulate an Interakt join webhook ──────────────────────────────
    const testJoin = searchParams.get('testJoin') // ?testJoin=CLINIC_CODE
    if (testJoin) {
        const origin = new URL(req.url).origin
        const secret = process.env.WEBHOOK_VERIFY_TOKEN
        const webhookUrl = `${origin}/api/whatsapp?secret=${secret}`

        console.log(`[debug] Simulating join for clinic: ${testJoin}`)

        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'join',
                    phone: '9999999999',
                    name: 'Debug Test Patient',
                    language: 'en',
                    clinicCode: testJoin.toUpperCase()
                })
            })
            const data = await res.json()
            return Response.json({
                testJoin: testJoin.toUpperCase(),
                webhookUrl,
                status: res.status,
                response: data
            }, { status: 200 })
        } catch (err) {
            return Response.json({ error: err.message }, { status: 500 })
        }
    }

    // ── Default: show env check + list clinics ───────────────────────────────
    const { data: clinics } = await supabase.from('clinics').select('id, name, code, email')
    const { data: recentPatients } = await supabase
        .from('patients')
        .select('id, name, phone, token, status, clinic_id, date')
        .order('joined_at', { ascending: false })
        .limit(5)

    return Response.json({
        status: '✅ TokenPe Debug',
        env: {
            INTERAKT_API_KEY:      process.env.INTERAKT_API_KEY     ? '✅ set' : '❌ MISSING',
            WEBHOOK_VERIFY_TOKEN:  process.env.WEBHOOK_VERIFY_TOKEN  ? '✅ set' : '❌ MISSING',
            NEXT_PUBLIC_APP_URL:   process.env.NEXT_PUBLIC_APP_URL   || '⚠️ not set',
            SARVAM_API_KEY:        process.env.SARVAM_API_KEY        ? '✅ set' : '❌ MISSING',
            SUPABASE_URL:          process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ set' : '❌ MISSING',
        },
        webhookUrl: `${new URL(req.url).origin}/api/whatsapp?secret=${process.env.WEBHOOK_VERIFY_TOKEN}`,
        hint: 'Add ?testJoin=YOUR_CLINIC_CODE to simulate a real patient joining',
        clinics: clinics || [],
        recentPatients: recentPatients || []
    }, { status: 200 })
}
