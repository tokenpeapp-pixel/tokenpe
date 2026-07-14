// FILE: /app/api/queue/update-payment/route.js
// Securely updates patient payment status and amounts after verifying clinic session and ownership

import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'
import { sendTemplateMessage, cleanPhone } from '../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { patientId, updates } = body

        if (!patientId || !updates) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        // Verify the patient belongs to the clinic in the active session
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

        // Prepare the safe update object containing only allowed payment fields
        const allowedUpdates = {}
        if ('fee_total' in updates) {
            allowedUpdates.fee_total = parseFloat(updates.fee_total) || 0
        }
        if ('fee_paid' in updates) {
            allowedUpdates.fee_paid = parseFloat(updates.fee_paid) || 0
        }
        if ('payment_status' in updates) {
            allowedUpdates.payment_status = updates.payment_status
        }

        const { error: updateError } = await supabaseAdmin
            .from('patients')
            .update(allowedUpdates)
            .eq('id', patientId)

        if (updateError) {
            throw updateError
        }

        // Send WhatsApp confirmation of completed transaction if status is updated to completed
        if (allowedUpdates.payment_status === 'completed' && patient.phone && patient.phone !== '0000000000') {
            after(async () => {
                try {
                    // Fetch clinic info
                    const { data: clinic } = await supabaseAdmin
                        .from('clinics')
                        .select('name')
                        .eq('id', patient.clinic_id)
                        .single()

                    const clinicName = clinic?.name || 'the clinic'
                    const totalBill = allowedUpdates.fee_total !== undefined ? allowedUpdates.fee_total : (parseFloat(patient.fee_total) || 0)
                    const amountPaid = allowedUpdates.fee_paid !== undefined ? allowedUpdates.fee_paid : (parseFloat(patient.fee_paid) || 0)

                    await sendTemplateMessage({
                        phone: cleanPhone(patient.phone),
                        templateName: 'patient_payment_success',
                        languageCode: 'en',
                        bodyValues: [
                            clinicName,
                            patient.name || 'Patient',
                            totalBill.toFixed(2),
                            amountPaid.toFixed(2)
                        ],
                        callbackData: 'patient_payment_success'
                    })
                } catch (err) {
                    console.error('[queue/update-payment] WhatsApp receipt send error:', err.message)
                }
            })
        }

        return Response.json({ success: true })
    } catch (error) {
        console.error('[queue/update-payment] Error updating payment details:', error)
        return Response.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
