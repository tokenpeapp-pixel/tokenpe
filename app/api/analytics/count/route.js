import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const clinicId = searchParams.get('clinicId')
        const date = searchParams.get('date')

        if (!clinicId || !date) {
            return Response.json({ success: false, message: 'Missing clinicId or date' }, { status: 400 })
        }

        const { count, error } = await supabaseAdmin
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinicId)
            .eq('date', date)

        if (error) {
            return Response.json({ success: false, message: 'Failed to count patients' }, { status: 500 })
        }

        return Response.json({ success: true, count: count || 0 }, { status: 200 })
    } catch (error) {
        console.error('[analytics/count API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
