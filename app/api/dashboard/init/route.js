import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const clinicId = session.clinicId

        // Fetch the current clinic (source of truth for vertical + identity)
        const { data: clinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('id', clinicId)
            .single()

        if (clinicError || !clinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }

        // Fetch all accounts owned by this user within the SAME vertical only.
        // This is the multi-branch switcher (e.g. two clinic locations).
        // Cross-vertical accounts (e.g. the same user's restaurant account) are
        // intentionally excluded — each industry is billed and managed separately.
        let userClinics = [clinic]
        if (clinic.email) {
            const { data } = await supabaseAdmin
                .from('clinics')
                .select('*')
                .eq('email', clinic.email)
                .eq('vertical', clinic.vertical)   // ← same industry only
                .order('created_at', { ascending: true })
            if (data && data.length > 0) userClinics = data
        } else if (clinic.phone) {
            const { data } = await supabaseAdmin
                .from('clinics')
                .select('*')
                .eq('phone', clinic.phone)
                .eq('vertical', clinic.vertical)   // ← same industry only
                .order('created_at', { ascending: true })
            if (data && data.length > 0) userClinics = data
        }

        return Response.json({ success: true, clinic, userClinics }, { status: 200 })
    } catch (error) {
        console.error('[dashboard/init API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
