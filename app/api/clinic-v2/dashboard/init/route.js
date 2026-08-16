import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'

export async function GET(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // Fetch the current clinic to see its parent_clinic_id
        const { data: currentClinic, error: currentError } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('id', session.clinicId)
            .single()

        if (currentError || !currentClinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }
        
        delete currentClinic.pin_hash
        delete currentClinic.razorpay_key_secret_encrypted

        // Determine the root parent ID. If this clinic is a child, use its parent's ID. If it is the parent, use its own ID.
        const parentId = currentClinic.parent_clinic_id || currentClinic.id

        // Fetch all clinics that belong to this family (the parent itself, or any clinic that has this parent_id)
        const { data: branches, error: branchError } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .or(`id.eq.${parentId},parent_clinic_id.eq.${parentId}`)
            .order('created_at', { ascending: true })

        if (branchError) {
            console.error('[Clinic V2 Dashboard Init] Branch fetch error:', branchError)
            return Response.json({ success: false, message: 'Failed to load branches' }, { status: 500 })
        }

        // Strip sensitive info from branches
        const sanitizedBranches = (branches || []).map(b => {
            const clean = { ...b }
            delete clean.pin_hash
            delete clean.razorpay_key_secret_encrypted
            return clean
        })

        return Response.json({
            success: true,
            clinic: currentClinic,
            userClinics: sanitizedBranches
        }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Dashboard Init API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
