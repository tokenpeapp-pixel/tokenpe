import { supabase, supabaseAdmin, getISTDateString } from './supabase'
import { sendText, sendVoice, sendTextAndVoice, buildVoiceText, cleanPhone } from './messaging'
import { maskPhone, maskName } from './mask'
import { after } from 'next/server'

export async function joinQueue({ phone, name, language, businessCode }) {
    console.log(`[JoinQueue] phone=${maskPhone(phone)} | name=${maskName(name)} | lang=${language} | businessCode=${businessCode}`)

    if (!phone) {
        console.error('[JoinQueue] ❌ No phone number provided.')
        return { success: false, message: '❌ Invalid phone number format', token: 'ERR', position: 0, wait: 'N/A', businessName: 'Unknown', name }
    }

    // ── Builder Test Safeguard ─────────────────────────────────────────────
    const isTestPayload = businessCode.includes('{') || businessCode.includes('}') || businessCode === 'PLACEHOLDER' || businessCode.includes('VARIABLE')
    if (isTestPayload) {
        console.log('[JoinQueue] 🧪 Test mode detected — returning mock response')
        return { success: true, token: 'T001', position: 0, wait: 'You are next!', businessName: 'Demo Business', name: name || 'Guest' }
    }

    if (!businessCode) {
        console.error(`[JoinQueue] ❌ Invalid or missing business code.`)
        return { success: false, message: '❌ Invalid code. Please scan the QR code again.', token: 'ERR', position: 0, wait: 'N/A', businessName: 'Unknown', name: name || 'Guest' }
    }

    // 1. Find business in Supabase
    const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('code', businessCode)
        .single()

    if (businessError || !business) {
        console.error(`[JoinQueue] ❌ Business not found for code: "${businessCode}"`, businessError?.message)
        return { success: false, message: '❌ Invalid code. Please scan the QR code again.', token: 'ERR', position: 0, wait: 'N/A', businessName: 'Unknown', name: name || 'Guest' }
    }

    // 1.5 Check if queue is paused
    if (business.queue_paused) {
        console.log(`[JoinQueue] ❌ Queue is paused for ${business.name}`)
        const pausedMsg = `❌ *Queue Paused*\n\nThe queue is currently paused by ${business.name}.\n\nPlease try again later.`
        
        await sendTextAndVoice({
            phone: cleanPhone(phone),
            language: language,
            event: 'paused',
            clinicName: business.name,
            textMessage: pausedMsg
        })
        
        return { success: false, message: 'Queue is currently paused.', token: 'PAUSED', position: 0, wait: 'N/A', businessName: business.name, name: name || 'Guest' }
    }

    // 1.6 Check if business is closed for today
    const todayDate = getISTDateString()
    if (business.closed_today_date) {
        console.log(`[JoinQueue] ❌ Business "${business.name}" is closed for today`)
        const closedMsg = `🔴 *Closed for Today*\n\n${business.name} has ended today's session.\n\nPlease visit again tomorrow. We look forward to seeing you! 🙏\n\n_Powered by TokenPe_`
        await sendTextAndVoice({
            phone: cleanPhone(phone),
            language: language,
            event: 'paused',  // reuse paused voice event as it conveys "unavailable"
            clinicName: business.name,
            textMessage: closedMsg
        })
        return { success: false, message: 'Closed for today.', token: 'CLOSED', position: 0, wait: 'N/A', businessName: business.name, name: name || 'Guest' }
    }

    // 2. Count patients & calculate waits in PARALLEL
    const today = getISTDateString()
    const planId = business.plan_id || 'starter'
    const cleanedPhone = cleanPhone(phone)
    
    // Rate limit joins (3 per phone per day)
    const { data: existingJoins } = await supabase
        .from('queue_entries')
        .select('name')
        .eq('business_id', business.id)
        .eq('phone', cleanedPhone)
        .eq('date', today)

    if (existingJoins && existingJoins.length >= 3) {
        console.log(`[JoinQueue] ❌ Rate limit reached for ${maskPhone(phone)} at ${business.name}`)
        await sendText(cleanedPhone, `❌ *Limit Reached*\n\nYou have reached the maximum daily limit for this phone number.\n\nPlease visit the premises to join via walk-in.`)
        return { success: false, message: 'Daily join limit reached for this phone number.', token: 'LIMIT', position: 0, wait: 'N/A', businessName: business.name, name }
    }

    const nameCount = existingJoins?.filter(p => p.name.toLowerCase() === name.toLowerCase()).length || 0;
    if (nameCount >= 2) {
        console.log(`[JoinQueue] ❌ Name limit reached for ${maskPhone(phone)}: ${maskName(name)}`)
        await sendText(cleanedPhone, `❌ *Limit Reached*\n\nA person named "${name}" has already joined the queue twice today.\n\nTo join again, please visit the premises and use the walk-in method.`)
        return { success: false, message: 'A person with this name has reached the daily limit.', token: 'DUPE', position: 0, wait: 'N/A', businessName: business.name, name }
    }
    
    const [
        { count },
        { count: peopleAhead },
        { data: recentDone }
    ] = await Promise.all([
        supabaseAdmin.from('queue_entries').select('*', { count: 'exact', head: true })
            .eq('business_id', business.id).eq('date', today),
        supabaseAdmin.from('queue_entries').select('*', { count: 'exact', head: true })
            .eq('business_id', business.id).eq('date', today).in('status', ['waiting', 'called']),
        planId !== 'starter' 
            ? supabaseAdmin.from('queue_entries').select('completed_at')
                .eq('business_id', business.id).eq('date', today).eq('status', 'done')
                .not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(10)
            : Promise.resolve({ data: null })
    ])

    const position = count || 0
    const limit = planId === 'starter' ? 50 : planId === 'pro' ? 150 : Infinity
    
    if (position >= limit) {
        console.log(`[JoinQueue] ❌ Limit reached for ${business.name}: ${position}/${limit}`)
        const limitMsg = `❌ *Queue Full*\n\n${business.name} has reached its maximum daily limit.\n\nPlease ask them to upgrade their TokenPe plan to add more people today.`
        await sendText(cleanedPhone, limitMsg)
        
        return { success: false, message: 'Daily queue limit reached.', token: 'FULL', position: 0, wait: 'N/A', businessName: business.name, name: name || 'Guest' }
    }

    // Calculate dynamic wait time
    let avgWaitPerPatient = 7
    if (planId !== 'starter' && recentDone && recentDone.length >= 2) {
        let totalDiffMs = 0
        let diffCount = 0
        for (let i = 0; i < recentDone.length - 1; i++) {
            const t1 = new Date(recentDone[i].completed_at).getTime()
            const t2 = new Date(recentDone[i+1].completed_at).getTime()
            const diffMs = t1 - t2
            if (diffMs >= 60000 && diffMs <= 1800000) {
                totalDiffMs += diffMs
                diffCount++
            }
        }
        if (diffCount > 0) {
            const calculatedAvg = Math.round((totalDiffMs / diffCount) / 60000)
            avgWaitPerPatient = Math.max(2, Math.min(calculatedAvg, 15))
        }
    }

    const tokenNumber = `T${String(position + 1).padStart(3, '0')}`
    const waitTimeNum = (peopleAhead || 0) * avgWaitPerPatient
    let waitMins = (peopleAhead === 0) ? 'You are next!' : `${waitTimeNum} mins`
    if (planId !== 'starter' && peopleAhead > 0) {
        waitMins = `Predicted Wait Time: ~${waitTimeNum} mins`
    }

    // 3. Insert into queue
    const insertPayload = {
        business_id: business.id,
        token: tokenNumber,
        phone: cleanedPhone,
        name: name,
        language: language || 'en',
        status: 'waiting',
        amount_paid: 0,
        date: today,
        joined_at: new Date().toISOString()
    }

    const { error: insertError } = await supabaseAdmin.from('queue_entries').insert(insertPayload)

    if (insertError) {
        console.error('[JoinQueue] ❌ Insert failed:', insertError.message, insertError.details)
        return { success: false, message: 'Failed to join queue', error: insertError.message }
    }

    console.log(`[JoinQueue] ✅ ${maskName(name)} → ${tokenNumber} at ${business.name} (pos ${position})`)

    if (planId !== 'starter') {
        after(async () => {
            try {
                if (business.welcome_message && (planId === 'elite' || business.subscription_status === 'trialing')) {
                    await sendText(cleanedPhone, `*Message from ${business.name}:*\n\n${business.welcome_message}`)
                }
                
                await sendVoice({
                    phone: cleanedPhone,
                    language: language || 'en',
                    event: 'joined',
                    token: tokenNumber,
                    position: peopleAhead || 0,
                    clinicName: business.name
                })
            } catch (err) {
                console.error('[Voice Background Error]', err)
                const fallbackText = buildVoiceText({
                    language: language || 'en',
                    event: 'joined',
                    token: tokenNumber,
                    position: peopleAhead || 0,
                    clinicName: business.name
                })
                if (fallbackText) {
                    await sendText(cleanedPhone, `🎙️ *Voice Note Failed*\n\n${fallbackText}`)
                }
            }
        })
    }

    return {
        success: true,
        token: tokenNumber,
        position: peopleAhead || 0,
        wait: waitMins,
        businessName: business.name,
        name: name || 'Guest'
    }
}
