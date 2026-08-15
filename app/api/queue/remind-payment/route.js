// FILE: /app/api/queue/remind-payment/route.js
// Manual payment reminder from dashboard — sends WhatsApp alert with pending balance

import { supabaseAdmin } from '../../../../lib/supabase'
import { sendText } from '../../../../lib/messaging'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { patientId } = body

        if (!patientId) {
            return Response.json({ success: false, message: 'Missing patient ID' }, { status: 400 })
        }

        // Fetch patient info
        const { data: patient, error: fetchError } = await supabaseAdmin
            .from('queue_entries')
            .select('business_id, name, phone, token, fee_total, fee_paid')
            .eq('id', patientId)
            .single()

        if (fetchError || !patient) {
            return Response.json({ success: false, message: 'Patient not found' }, { status: 404 })
        }

        if (patient.business_id !== session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        if (!patient.phone || patient.phone === '0000000000') {
            return Response.json({ success: false, message: 'Invalid phone number for notifications' }, { status: 400 })
        }

        // Fetch business info
        const { data: business } = await supabaseAdmin
            .from('businesses')
            .select('name')
            .eq('id', patient.business_id)
            .single()

        const clinicName = business?.name || 'the business'
        const feeTotal = parseFloat(patient.fee_total) || 0
        const feePaid = parseFloat(patient.fee_paid) || 0
        const remaining = feeTotal - feePaid

        const reminderMsg = `🏥 *${clinicName}*
        
Dear *${patient.name || 'Patient'}*,

This is a friendly reminder regarding your pending payment.

💵 Total Bill: *₹${feeTotal.toFixed(2)}*
✅ Paid So Far: *₹${feePaid.toFixed(2)}*
⚠️ Pending Balance: *₹${remaining.toFixed(2)}*

Please clear the balance at your earliest convenience. Thank you!

_Powered by TokenPe_`

        await sendText(patient.phone, reminderMsg)

        return Response.json({ success: true })

    } catch (error) {
        console.error('[queue/remind-payment] Error:', error)
        return Response.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
