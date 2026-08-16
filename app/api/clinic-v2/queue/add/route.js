import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'
import { sanitizeName, validatePhone } from '../../../../../lib/validate'
import { sendText } from '../../../../../lib/messaging'
import { after } from 'next/server'

function getISTDateString() {
    const now = new Date()
    const istTime = now.getTime() + (5.5 * 60 * 60 * 1000)
    const istDate = new Date(istTime)
    return istDate.toISOString().split('T')[0]
}

export async function POST(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, phone, age, gender } = body

        const cleanName = sanitizeName(name) || 'Walk-in Patient'
        const cleanedPhone = validatePhone(phone) || '0000000000'
        const today = getISTDateString()

        // 1. Fetch clinic limits
        const { data: clinic } = await supabaseAdmin
            .from('clinics')
            .select('name, queue_paused, closed_today_date, max_daily_tokens, current_token_number')
            .eq('id', session.clinicId)
            .single()

        if (clinic?.queue_paused) {
            return Response.json({ success: false, message: 'Queue is currently paused.' }, { status: 403 })
        }
        if (clinic?.closed_today_date === today) {
            return Response.json({ success: false, message: 'Clinic is closed today.' }, { status: 403 })
        }

        // 2. Atomic Token Increment via RPC (with fallback to read-update)
        let token_number = 1
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('increment_clinic_token', { clinic_id_param: session.clinicId })
        
        if (rpcError) {
            // Fallback if the user hasn't created the RPC function yet in Supabase
            console.warn('[Clinic V2 Queue Add] RPC increment_clinic_token failed, using fallback read-update.', rpcError.message)
            token_number = (clinic.current_token_number || 0) + 1
            await supabaseAdmin.from('clinics').update({ current_token_number: token_number }).eq('id', session.clinicId)
        } else {
            token_number = rpcData
        }

        // 3. Create Patient Entry
        const patientObj = {
            clinic_id: session.clinicId,
            name: cleanName,
            phone: cleanedPhone,
            age: age ? parseInt(age, 10) : null,
            gender: gender || null,
            token_number,
            status: 'waiting',
            source: 'walkin',
            entry_date: today,
            checked_in_at: new Date().toISOString()
        }

        const { data: patient, error } = await supabaseAdmin
            .from('patient_entries')
            .insert(patientObj)
            .select()
            .single()

        if (error || !patient) {
            console.error('[Clinic V2 Queue Add] DB Insert Error:', error)
            return Response.json({ success: false, message: 'Failed to add patient to queue' }, { status: 500 })
        }

        // 4. Send Confirmation WhatsApp (Background)
        if (cleanedPhone !== '0000000000') {
            after(async () => {
                try {
                    // Check people ahead
                    const { count: peopleAhead } = await supabaseAdmin
                        .from('patient_entries')
                        .select('*', { count: 'exact', head: true })
                        .eq('clinic_id', session.clinicId)
                        .eq('status', 'waiting')
                        .eq('entry_date', today)
                        .lt('token_number', token_number)
                    
                    const aheadCount = peopleAhead || 0
                    const confirmMsg = `*Walk-in Confirmed, ${patient.name}!*\n\nYour Token: *${token_number}*\n${clinic.name}\nPeople ahead: *${aheadCount}*\nEst. wait: ~${aheadCount * 7} mins\n\nWe'll notify you when your turn is near!\n\n_Powered by TokenPe_`
                    await sendText(cleanedPhone, confirmMsg)
                } catch (err) {
                    console.error('[Clinic V2 Queue Add] Messaging error:', err.message)
                }
            })
        }

        return Response.json({ success: true, patient }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Queue Add Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
