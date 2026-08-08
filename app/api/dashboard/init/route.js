import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const businessId = session.businessId

        // Strict clinic verification against database
        let { data: clinic } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('id', businessId)
            .single()

        if (!clinic) {
            const { data: bClinic } = await supabaseAdmin
                .from('businesses')
                .select('*')
                .eq('id', businessId)
                .single()
            if (bClinic) clinic = bClinic
        }

        if (!clinic) {
            return Response.json({ success: false, message: 'Clinic not found in database. Access denied.' }, { status: 404 })
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
