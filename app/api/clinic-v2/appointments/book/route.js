import { supabaseAdmin } from '../../../../../lib/supabase'
import { decryptRazorpaySecret } from '../../../../../lib/crypto'
import Razorpay from 'razorpay'

// Basic in-memory rate limiting (use Redis in production)
const rateLimits = new Map()

export async function POST(req) {
    try {
        const body = await req.json()
        const { clinicId, patientName, patientPhone, appointmentDate, slotTime, reasonForVisit } = body

        if (!clinicId || !patientName || !patientPhone || !appointmentDate || !slotTime) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        // Rate limiting
        const now = Date.now()
        const lastRequest = rateLimits.get(patientPhone)
        if (lastRequest && (now - lastRequest < 60000)) { // 1 request per minute
            return Response.json({ success: false, message: 'Please wait before booking again.' }, { status: 429 })
        }
        rateLimits.set(patientPhone, now)

        // 1. Fetch Clinic details & Razorpay credentials
        const { data: clinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('consultation_fee, razorpay_key_id, razorpay_key_secret_encrypted, razorpay_connected')
            .eq('id', clinicId)
            .single()

        if (clinicError || !clinic || !clinic.razorpay_connected) {
            return Response.json({ success: false, message: 'Clinic not found or payments not configured.' }, { status: 400 })
        }

        // 2. Double check slot availability
        // Note: For true atomic locking in Postgres without RPC, we'd need a direct pg connection.
        // If strict locking is needed, wrap this in a Supabase RPC function.
        const dayOfWeek = new Date(appointmentDate).getDay()
        const { data: availability } = await supabaseAdmin
            .from('clinic_availability')
            .select('max_patients_per_slot')
            .eq('clinic_id', clinicId)
            .eq('day_of_week', dayOfWeek)
            .single()
            
        const maxPatients = availability?.max_patients_per_slot || 1

        const { count: bookedCount } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinicId)
            .eq('appointment_date', appointmentDate)
            .eq('slot_time', slotTime)
            .in('status', ['pending_payment', 'confirmed'])

        if (bookedCount >= maxPatients) {
            return Response.json({ success: false, message: 'Slot is no longer available.' }, { status: 409 })
        }

        // 3. Create Razorpay Order
        const keySecret = decryptRazorpaySecret(clinic.razorpay_key_secret_encrypted)
        const rzp = new Razorpay({
            key_id: clinic.razorpay_key_id,
            key_secret: keySecret
        })

        const fee = clinic.consultation_fee || 500
        const amountInPaise = Math.round(parseFloat(fee) * 100)
        
        let order;
        try {
            order = await rzp.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `book_${clinicId.substring(0, 8)}_${Date.now()}`
            })
        } catch (error) {
            console.error('[Razorpay Book Order Failed]', error)
            return Response.json({ success: false, message: 'Failed to create Razorpay order.' }, { status: 500 })
        }

        // 4. Insert Appointment & Transaction
        const { data: appointment, error: apptError } = await supabaseAdmin
            .from('appointments')
            .insert({
                clinic_id: clinicId,
                patient_name: patientName,
                patient_phone: patientPhone,
                appointment_date: appointmentDate,
                slot_time: slotTime,
                reason_for_visit: reasonForVisit,
                status: 'pending_payment',
                payment_status: 'unpaid',
                payment_amount: fee
            })
            .select()
            .single()

        if (apptError) {
            throw apptError
        }

        const { data: transaction, error: txError } = await supabaseAdmin
            .from('patient_transactions')
            .insert({
                clinic_id: clinicId,
                amount: fee,
                status: 'created',
                razorpay_order_id: order.id
            })
            .select()
            .single()

        if (txError) {
            throw txError
        }

        // Link transaction to appointment
        await supabaseAdmin
            .from('appointments')
            .update({ transaction_id: transaction.id })
            .eq('id', appointment.id)

        return Response.json({ 
            success: true, 
            order_id: order.id,
            key_id: clinic.razorpay_key_id,
            amount: amountInPaise,
            appointment_id: appointment.id
        }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Booking Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
