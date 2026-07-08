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
            // Fetch the primary branch (oldest clinic with same email) — get full billing fields
            const { data: siblingClinics } = await supabaseAdmin
                .from('clinics')
                .select('id, name, plan_id, subscription_status, current_period_end, razorpay_subscription_id, trial_ends_at')
                .eq('email', clinic.email)
                .order('created_at', { ascending: true })
                .limit(1)

            if (siblingClinics && siblingClinics.length > 0) {
                const primaryClinic = siblingClinics[0]

                if (primaryClinic.id !== clinic.id) {
                    // This is a child branch — overlay primary branch billing data
                    isPrimaryBranch = false
                    primaryBranchName = primaryClinic.name

                    // Sync child clinic's billing fields with primary branch
                    clinic.plan_id = primaryClinic.plan_id
                    clinic.subscription_status = primaryClinic.subscription_status
                    clinic.current_period_end = primaryClinic.current_period_end
                    clinic.razorpay_subscription_id = primaryClinic.razorpay_subscription_id
                    clinic.trial_ends_at = primaryClinic.trial_ends_at
                }
            }
        }

        return Response.json({ success: true, clinic, isPrimaryBranch, primaryBranchName }, { status: 200 })
    } catch (error) {
        console.error('[clinics/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
