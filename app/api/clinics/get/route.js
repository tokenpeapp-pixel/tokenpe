import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return Response.json({ success: false, message: 'Missing clinic ID' }, { status: 400 })
        }

        const { data: clinic, error } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !clinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }
        let isPrimaryBranch = true
        let primaryBranchName = null

        if (clinic.email) {
            const { data: siblingClinics } = await supabaseAdmin
                .from('clinics')
                .select('id, name')
                .eq('email', clinic.email)
                .order('created_at', { ascending: true })
                .limit(1)
            
            if (siblingClinics && siblingClinics.length > 0) {
                if (siblingClinics[0].id !== clinic.id) {
                    isPrimaryBranch = false
                    primaryBranchName = siblingClinics[0].name
                }
            }
        }

        return Response.json({ success: true, clinic, isPrimaryBranch, primaryBranchName }, { status: 200 })
    } catch (error) {
        console.error('[clinics/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
