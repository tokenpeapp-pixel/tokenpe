import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'
import { decryptRazorpaySecret } from '../../../../../lib/crypto'
import Razorpay from 'razorpay'

export async function POST(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { patientEntryId, amount } = body

        if (!patientEntryId || !amount) {
            return Response.json({ success: false, message: 'Missing patientEntryId or amount' }, { status: 400 })
        }

        // 1. Get Clinic's Razorpay Credentials
        const { data: clinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('razorpay_key_id, razorpay_key_secret_encrypted, razorpay_connected')
            .eq('id', session.clinicId)
            .single()

        if (clinicError || !clinic || !clinic.razorpay_connected) {
            return Response.json({ success: false, message: 'Clinic Razorpay account not connected.' }, { status: 400 })
        }

        const keySecret = decryptRazorpaySecret(clinic.razorpay_key_secret_encrypted)
        if (!keySecret) {
            return Response.json({ success: false, message: 'Failed to decrypt Razorpay secret.' }, { status: 500 })
        }

        // 2. Initialize Razorpay
        const rzp = new Razorpay({
            key_id: clinic.razorpay_key_id,
            key_secret: keySecret
        })

        // 3. Create Razorpay Order
        const amountInPaise = Math.round(parseFloat(amount) * 100)
        const orderOptions = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${patientEntryId.substring(0, 8)}_${Date.now()}`
        }

        let order;
        try {
            order = await rzp.orders.create(orderOptions)
        } catch (error) {
            console.error('[Razorpay Order Creation Failed]', error)
            return Response.json({ success: false, message: 'Failed to create Razorpay order.' }, { status: 500 })
        }

        // 4. Insert patient_transactions record
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('patient_transactions')
            .insert({
                clinic_id: session.clinicId,
                patient_entry_id: patientEntryId,
                amount: parseFloat(amount),
                status: 'created',
                razorpay_order_id: order.id
            })
            .select()
            .single()

        if (txError) {
            console.error('[Transaction Insert Error]', txError)
            return Response.json({ success: false, message: 'Failed to record transaction.' }, { status: 500 })
        }

        return Response.json({ 
            success: true, 
            order_id: order.id,
            key_id: clinic.razorpay_key_id,
            amount: amountInPaise,
            transaction_id: transaction.id
        }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Create Payment Order Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
