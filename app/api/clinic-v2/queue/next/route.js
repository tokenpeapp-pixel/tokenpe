import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'

function getISTDateString() {
    const now = new Date()
    const istTime = now.getTime() + (5.5 * 60 * 60 * 1000)
    const istDate = new Date(istTime)
    return istDate.toISOString().split('T')[0]
}

export async function POST(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const today = getISTDateString()

        const body = await req.json().catch(() => ({}))
        const { patientId } = body

        // 1. Find currently processing patient and mark them completed
        const { data: currentProcessing } = await supabaseAdmin
            .from('patient_entries')
            .select('id')
            .eq('clinic_id', session.clinicId)
            .eq('entry_date', today)
            .eq('status', 'processing')
            .single()

        if (currentProcessing) {
            // Only complete the current one if it's different from the one being called (edge case)
            if (currentProcessing.id !== patientId) {
                await supabaseAdmin
                    .from('patient_entries')
                    .update({ status: 'completed', completed_at: new Date().toISOString() })
                    .eq('id', currentProcessing.id)

                // Also update linked appointment if it exists
                await supabaseAdmin
                    .from('appointments')
                    .update({ status: 'completed' })
                    .eq('patient_entry_id', currentProcessing.id)
            }
        }

        // 2. Find the target waiting patient (either specific or the next in line)
        let query = supabaseAdmin
            .from('patient_entries')
            .select('*')
            .eq('clinic_id', session.clinicId)
            .eq('entry_date', today)
            
        if (patientId) {
            query = query.eq('id', patientId)
        } else {
            query = query.eq('status', 'waiting').order('token_number', { ascending: true })
        }
        
        const { data: nextPatient, error: nextError } = await query
            .limit(1)
            .single()

        if (!nextPatient) {
            return Response.json({ success: true, message: 'Queue is empty. No more waiting patients.' }, { status: 200 })
        }

        // 3. Mark the next patient as processing
        const { data: updatedPatient, error: updateError } = await supabaseAdmin
            .from('patient_entries')
            .update({ status: 'processing', called_at: new Date().toISOString() })
            .eq('id', nextPatient.id)
            .select()
            .single()

        if (updateError || !updatedPatient) {
            throw updateError
        }

        return Response.json({ success: true, patient: updatedPatient }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Queue Next Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
