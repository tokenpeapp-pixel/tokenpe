import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const clinicId = session.clinicId

        // Fetch fresh clinic
        const { data: clinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('id', clinicId)
            .single()

        if (clinicError || !clinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }

        // Fetch all clinics owned by this user (same email OR same phone)
        // Since we don't have user_id, we group by email if exists, else by phone
        let userClinics = [clinic]
        if (clinic.email) {
            const { data } = await supabaseAdmin.from('clinics').select('*').eq('email', clinic.email).order('created_at', { ascending: true })
            if (data && data.length > 0) userClinics = data
        } else if (clinic.phone) {
            const { data } = await supabaseAdmin.from('clinics').select('*').eq('phone', clinic.phone).order('created_at', { ascending: true })
            if (data && data.length > 0) userClinics = data
        }

        return Response.json({ success: true, clinic, userClinics }, { status: 200 })
    } catch (error) {
        console.error('[dashboard/init API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
