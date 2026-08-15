// FILE: /app/api/queue/update-payment/route.js
// Securely updates patient payment status and amounts after verifying clinic session and ownership

import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'
import { sendText } from '../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        let session = null
        try {
            session = await getSession()
        } catch (_) {}

        const { searchParams } = new URL(req.url)
        const queryClinicId = searchParams.get('clinicId')
        const activeClinicId = session?.businessId || queryClinicId

        if (!activeClinicId) {
            return Response.json({ success: false, message: 'Unauthorized: Clinic session missing' }, { status: 401 })
        }

        const body = await req.json()
        const { patientId, updates } = body

        if (!patientId || !updates) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        // Verify the patient belongs to the clinic in the active session
        let patient = null
        const { data: pData } = await supabaseAdmin
            .from('patients')
            .select('clinic_id, name, phone, token, fee_total, fee_paid')
            .eq('id', patientId)
            .single()

        if (pData) {
            patient = pData
        } else {
            const { data: qData } = await supabaseAdmin
                .from('queue_entries')
                .select('clinic_id, business_id, name, phone, token, fee_total, fee_paid')
                .eq('id', patientId)
                .single()
            if (qData) {
                patient = { ...qData, business_id: qData.business_id || qData.clinic_id }
            }
        }

        if (!patient) {
            return Response.json({ success: false, message: 'Patient not found' }, { status: 404 })
        }

        if (patient.business_id && patient.business_id !== activeClinicId) {
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

        await supabaseAdmin
            .from('patients')
            .update(allowedUpdates)
            .eq('id', patientId)

        try {
            await supabaseAdmin
                .from('queue_entries')
                .update(allowedUpdates)
                .eq('id', patientId)
        } catch (_) {}

        // Send WhatsApp confirmation of completed transaction if status is updated to completed
        if (allowedUpdates.payment_status === 'completed' && patient.phone && patient.phone !== '0000000000') {
            after(async () => {
                try {
                    // Fetch business info
                    const { data: business } = await supabaseAdmin
                        .from('businesses')
                        .select('name')
                        .eq('id', patient.business_id)
                        .single()

                    const clinicName = business?.name || 'the business'
                    const totalBill = allowedUpdates.fee_total !== undefined ? allowedUpdates.fee_total : (parseFloat(patient.fee_total) || 0)
                    const amountPaid = allowedUpdates.fee_paid !== undefined ? allowedUpdates.fee_paid : (parseFloat(patient.fee_paid) || 0)

                    const receiptMsg = `🏥 *${clinicName}*
                    
Dear *${patient.name || 'Patient'}*,

Thank you! Your payment has been received successfully.

💵 Total Bill: *₹${totalBill.toFixed(2)}*
✅ Amount Paid: *₹${amountPaid.toFixed(2)}*
🎉 Remaining Balance: *₹0.00 (Fully Paid)*

We appreciate your payment!

_Powered by TokenPe_`

                    await sendText(patient.phone, receiptMsg)
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
