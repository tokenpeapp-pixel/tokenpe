import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return Response.json({ success: false, message: 'Missing business ID' }, { status: 400 })
        }

        const { data: business, error } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !business) {
            return Response.json({ success: false, message: 'Business not found' }, { status: 404 })
        }

        let isPrimaryBranch = true
        let primaryBranchName = null

        if (business.email) {
            // Fetch the primary branch (oldest business with same email) — get full billing fields
            const { data: siblingBusinesses } = await supabaseAdmin
                .from('businesses')
                .select('id, name, plan_id, subscription_status, current_period_end, razorpay_subscription_id, trial_ends_at')
                .eq('email', business.email)
                .order('created_at', { ascending: true })
                .limit(1)

            if (siblingBusinesses && siblingBusinesses.length > 0) {
                const primaryBusiness = siblingBusinesses[0]

                if (primaryBusiness.id !== business.id) {
                    // This is a child branch — overlay primary branch billing data
                    isPrimaryBranch = false
                    primaryBranchName = primaryBusiness.name

                    // Sync child business's billing fields with primary branch
                    business.plan_id = primaryBusiness.plan_id
                    business.subscription_status = primaryBusiness.subscription_status
                    business.current_period_end = primaryBusiness.current_period_end
                    business.razorpay_subscription_id = primaryBusiness.razorpay_subscription_id
                    business.trial_ends_at = primaryBusiness.trial_ends_at
                }
            }
        }

        return Response.json({ success: true, business, isPrimaryBranch, primaryBranchName }, { status: 200 })
    } catch (error) {
        console.error('[business/get API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
