import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'

export async function POST(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { patientEntryId, paymentStatus, paymentAmount } = body

        if (!patientEntryId) {
            return Response.json({ success: false, message: 'Missing patientEntryId' }, { status: 400 })
        }

        // 1. Verify ownership
        const { data: patient, error: patientError } = await supabaseAdmin
            .from('patient_entries')
            .select('clinic_id')
            .eq('id', patientEntryId)
            .single()

        if (patientError || !patient) {
            return Response.json({ success: false, message: 'Patient not found' }, { status: 404 })
        }

        if (patient.clinic_id !== session.clinicId) {
            return Response.json({ success: false, message: 'Access denied to this patient record' }, { status: 403 })
        }

        // 2. Update patient_entries
        const { error: updateError } = await supabaseAdmin
            .from('patient_entries')
            .update({
                payment_status: paymentStatus,
                payment_amount: paymentAmount
            })
            .eq('id', patientEntryId)

        if (updateError) {
            console.error('[Clinic V2 Update Payment] Update Error:', updateError)
            return Response.json({ success: false, message: 'Failed to update payment status' }, { status: 500 })
        }

        // 3. Insert transaction if a payment was made
        // A payment is made if paymentAmount > 0 and status is completed or partial, but we will insert whatever amount is passed
        // as long as paymentAmount > 0 and status isn't unpaid. Or maybe just insert whenever amount is passed.
        // Actually, if we're marking 'completed', we should log the transaction.
        if (paymentAmount > 0 && paymentStatus !== 'unpaid') {
            await supabaseAdmin
                .from('patient_transactions')
                .insert({
                    patient_entry_id: patientEntryId,
                    amount: paymentAmount,
                    status: 'captured',
                    payment_method: 'cash'
                })
        }

        return Response.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Update Payment API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
