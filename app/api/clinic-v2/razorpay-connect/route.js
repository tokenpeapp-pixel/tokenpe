import { supabaseAdmin } from '../../../../lib/supabase'
import { getClinicSession } from '../../../../lib/clinic-auth'
import { encryptRazorpaySecret } from '../../../../lib/crypto'
import Razorpay from 'razorpay'

export async function POST(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { razorpayKeyId, razorpayKeySecret } = body

        if (!razorpayKeyId || !razorpayKeySecret) {
            return Response.json({ success: false, message: 'Missing Razorpay credentials' }, { status: 400 })
        }

        // 1. Validate credentials with a lightweight test call
        try {
            const rzp = new Razorpay({
                key_id: razorpayKeyId,
                key_secret: razorpayKeySecret
            })

            // Try fetching a single order just to test auth
            await rzp.orders.all({ count: 1 })
        } catch (error) {
            console.error('[Razorpay Validation Failed]', error)
            return Response.json({ success: false, message: 'Invalid Razorpay credentials. Validation failed.' }, { status: 400 })
        }

        // 2. Encrypt the secret
        let encryptedSecret;
        try {
            encryptedSecret = encryptRazorpaySecret(razorpayKeySecret)
        } catch (error) {
            console.error('[Encryption Error]', error)
            return Response.json({ success: false, message: 'Encryption configuration error on server.' }, { status: 500 })
        }

        // 3. Save to database
        const { error: updateError } = await supabaseAdmin
            .from('clinics')
            .update({
                razorpay_key_id: razorpayKeyId,
                razorpay_key_secret_encrypted: encryptedSecret,
                razorpay_connected: true,
                razorpay_connected_at: new Date().toISOString()
            })
            .eq('id', session.clinicId)

        if (updateError) {
            throw updateError
        }

        return Response.json({ success: true, message: 'Razorpay connected successfully' }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Razorpay Connect Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
