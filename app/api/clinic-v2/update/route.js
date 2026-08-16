import { supabaseAdmin } from '../../../../lib/supabase'
import { getClinicSession } from '../../../../lib/clinic-auth'

export async function POST(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { 
            name, city, logo_url, active_notice, queue_paused, upi_id, 
            specialty, welcome_message, google_maps_url, google_reviews_url, 
            consultation_fee, slot_duration_minutes, max_advance_booking_days, code,
            availability, exceptions 
        } = body

        // 1. Update Clinic Fields
        const clinicUpdates = {}
        if (name !== undefined) clinicUpdates.name = name
        if (city !== undefined) clinicUpdates.city = city
        if (logo_url !== undefined) clinicUpdates.logo_url = logo_url
        if (active_notice !== undefined) clinicUpdates.active_notice = active_notice
        if (queue_paused !== undefined) clinicUpdates.queue_paused = queue_paused
        if (upi_id !== undefined) clinicUpdates.upi_id = upi_id
        if (specialty !== undefined) clinicUpdates.specialty = specialty
        if (welcome_message !== undefined) clinicUpdates.welcome_message = welcome_message
        if (google_maps_url !== undefined) clinicUpdates.google_maps_url = google_maps_url
        if (google_reviews_url !== undefined) clinicUpdates.google_reviews_url = google_reviews_url
        if (consultation_fee !== undefined) clinicUpdates.consultation_fee = consultation_fee
        if (max_advance_booking_days !== undefined) clinicUpdates.max_advance_booking_days = max_advance_booking_days
        
        if (code !== undefined) {
            // Check for code uniqueness
            const cleanCode = String(code).trim().toUpperCase()
            const { data: existingCode } = await supabaseAdmin
                .from('clinics')
                .select('id')
                .ilike('code', cleanCode)
                .neq('id', session.clinicId)
                .limit(1)

            if (existingCode?.length > 0) {
                return Response.json({ success: false, message: 'Code is already taken.' }, { status: 409 })
            }
            clinicUpdates.code = cleanCode
        }

        if (Object.keys(clinicUpdates).length > 0) {
            const { error: clinicError } = await supabaseAdmin
                .from('clinics')
                .update(clinicUpdates)
                .eq('id', session.clinicId)

            if (clinicError) throw clinicError
        }

        // 2. Update Availability (Full Replace)
        if (Array.isArray(availability)) {
            await supabaseAdmin.from('clinic_availability').delete().eq('clinic_id', session.clinicId)
            
            if (availability.length > 0) {
                const availabilityInserts = availability.map(a => ({
                    ...a,
                    clinic_id: session.clinicId,
                    // apply the global slot duration if provided in the root level, or use what's in the array
                    slot_duration_minutes: slot_duration_minutes || a.slot_duration_minutes || 15
                }))
                await supabaseAdmin.from('clinic_availability').insert(availabilityInserts)
            }
        } else if (slot_duration_minutes !== undefined) {
            // If they just updated the duration but didn't send full array
            await supabaseAdmin.from('clinic_availability').update({ slot_duration_minutes }).eq('clinic_id', session.clinicId)
        }

        // 3. Update Exceptions (Upsert/Delete)
        // For exceptions, we assume they pass the full desired state of future exceptions
        if (Array.isArray(exceptions)) {
            await supabaseAdmin.from('clinic_slot_exceptions').delete().eq('clinic_id', session.clinicId)
            
            if (exceptions.length > 0) {
                const exceptionInserts = exceptions.map(e => ({
                    ...e,
                    clinic_id: session.clinicId
                }))
                await supabaseAdmin.from('clinic_slot_exceptions').insert(exceptionInserts)
            }
        }

        return Response.json({ success: true, message: 'Settings updated' }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Update Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
