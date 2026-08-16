import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'

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
        const { appointmentId } = body

        if (!appointmentId) {
            return Response.json({ success: false, message: 'Missing appointmentId' }, { status: 400 })
        }

        // 1. Fetch Appointment
        const { data: appointment, error: apptError } = await supabaseAdmin
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .eq('clinic_id', session.clinicId)
            .single()

        if (apptError || !appointment) {
            return Response.json({ success: false, message: 'Appointment not found' }, { status: 404 })
        }

        if (appointment.patient_entry_id) {
            return Response.json({ success: false, message: 'Patient has already been checked in.' }, { status: 400 })
        }

        const today = getISTDateString()

        // 2. Fetch Clinic for atomic token increment
        const { data: clinic } = await supabaseAdmin
            .from('clinics')
            .select('current_token_number')
            .eq('id', session.clinicId)
            .single()

        let token_number = 1
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('increment_clinic_token', { clinic_id_param: session.clinicId })
        
        if (rpcError) {
            console.warn('[Clinic V2 Checkin] RPC increment_clinic_token failed, using fallback read-update.', rpcError.message)
            token_number = (clinic.current_token_number || 0) + 1
            await supabaseAdmin.from('clinics').update({ current_token_number: token_number }).eq('id', session.clinicId)
        } else {
            token_number = rpcData
        }

        // 3. Create Patient Entry in Queue
        const patientObj = {
            clinic_id: session.clinicId,
            name: appointment.patient_name,
            phone: appointment.patient_phone,
            token_number,
            status: 'waiting',
            source: 'appointment',
            entry_date: today,
            checked_in_at: new Date().toISOString(),
            is_prebooked: true,
            appointment_time: `${appointment.appointment_date}T${appointment.slot_time}`
        }

        const { data: patient, error: insertError } = await supabaseAdmin
            .from('patient_entries')
            .insert(patientObj)
            .select()
            .single()

        if (insertError) {
            console.error('[Clinic V2 Checkin] Error inserting patient', insertError)
            return Response.json({ success: false, message: 'Failed to add to queue' }, { status: 500 })
        }

        // 4. Update Appointment
        await supabaseAdmin
            .from('appointments')
            .update({ 
                patient_entry_id: patient.id,
                status: 'checked_in'
            })
            .eq('id', appointment.id)

        return Response.json({ success: true, patient }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Checkin Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
