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
            .select('clinic_id, name, phone, payment_amount, payment_status, token_number')
            .eq('id', patientEntryId)
            .single()

        if (patientError || !patient) {
            return Response.json({ success: false, message: 'Patient not found' }, { status: 404 })
        }

        if (patient.clinic_id !== session.clinicId) {
            return Response.json({ success: false, message: 'Access denied to this patient record' }, { status: 403 })
        }

        if (patient.payment_status === 'paid') {
            return Response.json({ success: false, message: 'Payment is already completed.' }, { status: 400 })
        }

        if (!patient.phone || patient.phone.startsWith('pending-')) {
            return Response.json({ success: false, message: 'No valid phone number to send reminder.' }, { status: 400 })
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

        // 3. Send WhatsApp reminder
        const amount = patient.payment_amount || 0
        const message = `Hello ${patient.name || 'Patient'},\n\nThis is a gentle reminder regarding your pending payment of ₹${amount} for your consultation (Token ${patient.token_number}) at ${clinic.name}.\n\nPlease clear the dues at the reception.\n\nThank you!`

        after(async () => {
            try {
                await sendText(patient.phone, message)
            } catch (err) {
                console.error('[Clinic V2 Remind Payment] Messaging error:', err)
            }
        })

        return Response.json({ success: true, message: 'Reminder sent' }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Remind Payment API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
