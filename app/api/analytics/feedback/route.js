import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const clinicId = session.clinicId

        // Fetch all ratings for the clinic
        const { data: patients, error } = await supabaseAdmin
            .from('patients')
            .select('rating')
            .eq('clinic_id', clinicId)
            .not('rating', 'is', null)

        if (error) {
            throw error
        }

        const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        let totalRating = 0
        let ratingCount = 0

        patients.forEach(p => {
            if (p.rating > 0) {
                ratings[p.rating] = (ratings[p.rating] || 0) + 1
                totalRating += p.rating
                ratingCount++
            }
        })

        const avgRating = ratingCount ? (totalRating / ratingCount).toFixed(1) : "0.0"

        return Response.json({ 
            success: true, 
            feedback: { ratings, totalRating, ratingCount, avgRating } 
        }, { status: 200 })
    } catch (error) {
        console.error('[analytics/feedback API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
