import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'
import { sendText, sendImage } from '../../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { message, imageUrl } = body

        if (!message && !imageUrl) {
            return Response.json({ success: false, message: 'Message or image required' }, { status: 400 })
        }

        // 1. Fetch all patient entries for this clinic to determine distinct recipients
        const { data: entries, error: entriesError } = await supabaseAdmin
            .from('patient_entries')
            .select('phone, name, created_at')
            .eq('clinic_id', session.clinicId)
            .order('created_at', { ascending: false })

        if (entriesError) {
            console.error('[Clinic V2 Broadcast] Error fetching entries:', entriesError)
            return Response.json({ success: false, message: 'Failed to fetch patients' }, { status: 500 })
        }

        // 2. Build distinct recipient list
        const recipientsMap = new Map() // phone -> { name, lastVisitDate }
        for (const entry of (entries || [])) {
            const phone = entry.phone
            // Skip invalid or placeholder phones
            if (!phone || phone.startsWith('pending-')) continue
            
            // Because we ordered by created_at DESC, the first time we see a phone, it's their most recent visit
            if (!recipientsMap.has(phone)) {
                recipientsMap.set(phone, {
                    name: entry.name || 'Patient',
                    lastVisitDate: entry.created_at
                })
            }
        }

        const uniquePhones = Array.from(recipientsMap.keys())

        if (uniquePhones.length === 0) {
            return Response.json({ success: false, message: 'No valid patients found for broadcast' }, { status: 400 })
        }

        // 3. Send Broadcast asynchronously
        after(async () => {
            console.log(`[Clinic V2 Broadcast] Sending to ${uniquePhones.length} patients...`)
            for (const phone of uniquePhones) {
                try {
                    const recipient = recipientsMap.get(phone)
                    // Optional: dynamically replace placeholders if user used them
                    let personalizedMsg = message || ''
                    if (personalizedMsg) {
                        personalizedMsg = personalizedMsg.replace(/\[Name\]/gi, recipient.name)
                        // Could also replace [LastVisit] if needed
                    }

                    if (imageUrl) {
                        await sendImage(phone, imageUrl, personalizedMsg)
                    } else if (personalizedMsg) {
                        await sendText(phone, personalizedMsg)
                    }
                } catch (e) {
                    console.error(`[Clinic V2 Broadcast Error] Phone ${phone}:`, e)
                }
            }
        })

        return Response.json({ success: true, count: uniquePhones.length }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Broadcast API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
