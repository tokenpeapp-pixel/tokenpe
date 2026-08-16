import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'

function getISTDateString() {
    const now = new Date()
    const istTime = now.getTime() + (5.5 * 60 * 60 * 1000)
    const istDate = new Date(istTime)
    return istDate.toISOString().split('T')[0]
}

export async function GET(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const today = getISTDateString()

        // 1. Fetch clinic profile
        const { data: clinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('id', session.clinicId)
            .single()

        if (clinicError || !clinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }

        // Strip secrets
        delete clinic.pin_hash
        delete clinic.razorpay_key_secret_encrypted

        // 2. Fetch today's queue
        const { data: queue, error: queueError } = await supabaseAdmin
            .from('patient_entries')
            .select('*')
            .eq('clinic_id', session.clinicId)
            .eq('entry_date', today)
            .order('token_number', { ascending: true })

        if (queueError) {
            console.error('[Clinic V2 Dashboard Get] Queue Error:', queueError)
            return Response.json({ success: false, message: 'Failed to load queue' }, { status: 500 })
        }

        return Response.json({
            success: true,
            clinic,
            queue: queue || []
        }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Dashboard Get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
