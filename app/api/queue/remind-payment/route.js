// FILE: /app/api/queue/remind-payment/route.js
// Manual payment reminder from dashboard — sends WhatsApp alert with pending balance

import { supabaseAdmin } from '../../../../lib/supabase'
import { sendTemplateMessage, cleanPhone } from '../../../../lib/messaging'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { patientId } = body

        if (!patientId) {
            return Response.json({ success: false, message: 'Missing patient ID' }, { status: 400 })
        }

        // Fetch patient info
        const { data: patient, error: fetchError } = await supabaseAdmin
            .from('patients')
            .select('clinic_id, name, phone, token, fee_total, fee_paid')
            .eq('id', patientId)
            .single()

        if (fetchError || !patient) {
            return Response.json({ success: false, message: 'Patient not found' }, { status: 404 })
        }

        if (patient.clinic_id !== session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        if (!patient.phone || patient.phone === '0000000000') {
            return Response.json({ success: false, message: 'Invalid phone number for notifications' }, { status: 400 })
        }

        // Fetch clinic info
        const { data: clinic } = await supabaseAdmin
            .from('clinics')
            .select('name')
            .eq('id', patient.clinic_id)
            .single()

        const clinicName = clinic?.name || 'the clinic'
        const feeTotal = parseFloat(patient.fee_total) || 0
        const feePaid = parseFloat(patient.fee_paid) || 0
        const remaining = feeTotal - feePaid

        await sendTemplateMessage({
            phone: cleanPhone(patient.phone),
            templateName: 'patient_payment_reminder',
            languageCode: 'en',
            bodyValues: [
                clinicName,
                patient.name || 'Patient',
                feeTotal.toFixed(2),
                feePaid.toFixed(2),
                remaining.toFixed(2)
            ],
            callbackData: 'patient_payment_reminder'
        })

        return Response.json({ success: true })

    } catch (error) {
        console.error('[queue/remind-payment] Error:', error)
        return Response.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
