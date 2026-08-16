import { supabaseAdmin } from '../../../../lib/supabase'
import { decryptRazorpaySecret } from '../../../../lib/crypto'
import crypto from 'crypto'

export async function POST(req) {
    try {
        const rawBody = await req.text()
        const signature = req.headers.get('x-razorpay-signature')

        if (!signature) {
            return Response.json({ success: false, message: 'Missing signature' }, { status: 400 })
        }

        const payload = JSON.parse(rawBody)

        // Find the relevant order ID from the payload
        let orderId = null
        let paymentId = null

        if (payload.event === 'payment.captured' || payload.event === 'payment.authorized') {
            orderId = payload.payload.payment.entity.order_id
            paymentId = payload.payload.payment.entity.id
        } else if (payload.event === 'order.paid') {
            orderId = payload.payload.order.entity.id
        }

        if (!orderId) {
            return Response.json({ success: true, message: 'Unhandled or missing order_id' }, { status: 200 })
        }

        // 1. Look up the transaction to find clinic_id
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('patient_transactions')
            .select('id, clinic_id, patient_entry_id')
            .eq('razorpay_order_id', orderId)
            .single()

        if (txError || !transaction) {
            return Response.json({ success: false, message: 'Transaction not found' }, { status: 404 })
        }

        // 2. Fetch the clinic's Razorpay Secret
        const { data: clinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('razorpay_key_secret_encrypted')
            .eq('id', transaction.clinic_id)
            .single()

        if (clinicError || !clinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }

        const webhookSecret = decryptRazorpaySecret(clinic.razorpay_key_secret_encrypted)
        if (!webhookSecret) {
            return Response.json({ success: false, message: 'Failed to decrypt secret' }, { status: 500 })
        }

        // 3. Verify Signature
        // Note: For clinic-specific webhooks, the clinic must set their own webhook secret in the Razorpay dashboard.
        // It's common practice to use their own razorpay API secret as the webhook secret to keep things simple for them.
        // We will assume they use their API secret as the webhook secret.
        const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')

        if (expectedSignature !== signature) {
            console.error('[Webhook Verification Failed] Signature mismatch')
            return Response.json({ success: false, message: 'Invalid signature' }, { status: 400 })
        }

        // 4. Update Transaction Status
        if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
            await supabaseAdmin
                .from('patient_transactions')
                .update({
                    status: 'captured',
                    razorpay_payment_id: paymentId,
                    captured_at: new Date().toISOString()
                })
                .eq('id', transaction.id)

            // 5. Update linked Appointment or Patient Entry
            // Check if this transaction is linked to a patient_entry (walk-in)
            if (transaction.patient_entry_id) {
                await supabaseAdmin
                    .from('patient_entries')
                    .update({ payment_status: 'paid' })
                    .eq('id', transaction.patient_entry_id)
            }
            
            // Check if this transaction is linked to an appointment (booked online)
            // Wait, our Phase 1 schema links patient_transactions to patient_entries. 
            // In Phase 2, the user wanted an `appointments` table. 
            // Let's see if there's an appointment with this transaction ID.
            const { data: appointment } = await supabaseAdmin
                .from('appointments')
                .select('id')
                .eq('transaction_id', transaction.id)
                .single()
                
            if (appointment) {
                await supabaseAdmin
                    .from('appointments')
                    .update({ status: 'confirmed', payment_status: 'paid' })
                    .eq('id', appointment.id)
            }
        }

        return Response.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('[Clinic Payment Webhook Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
