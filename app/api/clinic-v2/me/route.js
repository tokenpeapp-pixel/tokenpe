import { supabaseAdmin } from '../../../../lib/supabase'
import { getClinicSession } from '../../../../lib/clinic-auth'

export async function GET(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { data: clinic, error } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('id', session.clinicId)
            .single()

        if (error || !clinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }

        // Fetch availability and exceptions
        const [availabilityResult, exceptionsResult] = await Promise.all([
            supabaseAdmin.from('clinic_availability').select('*').eq('clinic_id', clinic.id),
            supabaseAdmin.from('clinic_slot_exceptions').select('*').eq('clinic_id', clinic.id)
        ])

        const availability = availabilityResult.data || []
        const exceptions = exceptionsResult.data || []

        // Strip sensitive info before returning
        delete clinic.pin_hash
        delete clinic.razorpay_key_secret_encrypted

        return Response.json({ 
            success: true, 
            clinic,
            availability,
            exceptions
        }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Me Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
