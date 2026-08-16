import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'
import { sendText } from '../../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { patientEntryId } = body

        if (!patientEntryId) {
            return Response.json({ success: false, message: 'Missing patientEntryId' }, { status: 400 })
        }

        // 1. Verify ownership and get patient details
        const { data: patient, error: patientError } = await supabaseAdmin
            .from('patient_entries')
            .select('clinic_id, name, phone, token_number')
            .eq('id', patientEntryId)
            .single()

        if (patientError || !patient) {
            return Response.json({ success: false, message: 'Patient not found' }, { status: 404 })
        }

        if (patient.clinic_id !== session.clinicId) {
            return Response.json({ success: false, message: 'Access denied to this patient record' }, { status: 403 })
        }

        if (!patient.phone || patient.phone.startsWith('pending-')) {
            return Response.json({ success: false, message: 'No valid phone number to send notification.' }, { status: 400 })
        }

        // 2. Fetch clinic details
        const { data: clinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('name')
            .eq('id', session.clinicId)
            .single()

        if (clinicError || !clinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }

        // 3. Send WhatsApp notification
        const message = `Hello ${patient.name || 'Patient'},\n\nYour turn is approaching! (Token ${patient.token_number} at ${clinic.name}).\n\nPlease make your way to the clinic.\n\nThank you!`

        after(async () => {
            try {
                await sendText(patient.phone, message)
            } catch (err) {
                console.error('[Clinic V2 Notify] Messaging error:', err)
            }
        })

        return Response.json({ success: true, message: 'Notification sent' }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Notify API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
