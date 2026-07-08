import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const clinicId = searchParams.get('clinicId')
        const clinicIds = searchParams.get('clinicIds')
        const date = searchParams.get('date')

        if ((!clinicId && !clinicIds) || !date) {
            return Response.json({ success: false, message: 'Missing clinicId(s) or date' }, { status: 400 })
        }

        let query = supabaseAdmin
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('date', date)

        if (clinicIds) {
            const ids = clinicIds.split(',')
            query = query.in('clinic_id', ids)
        } else {
            query = query.eq('clinic_id', clinicId)
        }

        const { count, error } = await query

        if (error) {
            return Response.json({ success: false, message: 'Failed to count patients' }, { status: 500 })
        }

        return Response.json({ success: true, count: count || 0 }, { status: 200 })
    } catch (error) {
        console.error('[analytics/count API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
