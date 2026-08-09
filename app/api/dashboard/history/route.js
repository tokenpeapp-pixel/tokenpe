import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
    try {
        let session = null
        try {
            session = await getSession()
        } catch (_) {}

        const searchParams = new URL(req.url).searchParams
        const businessId = session?.businessId || searchParams.get('clinicId') || searchParams.get('businessId')

        if (!businessId) {
            return Response.json({ success: false, message: 'Missing clinic ID' }, { status: 400 })
        }

        const preset = searchParams.get('preset') || 'today'
        const customStart = searchParams.get('customStart')
        const customEnd = searchParams.get('customEnd')

        let query = supabaseAdmin
            .from('patients')
            .select('*')
            .eq('clinic_id', businessId)
            .order('joined_at', { ascending: false })

        const now = new Date()
        const getISTDate = (d) => {
            const istOffset = 5.5 * 60 * 60 * 1000
            const istDate = new Date(d.getTime() + istOffset)
            return istDate.toISOString().split('T')[0]
        }

        if (preset === 'today') {
            const todayStr = getISTDate(now)
            query = query.eq('date', todayStr)
        } else if (preset === '7') {
            const d7 = new Date()
            d7.setDate(d7.getDate() - 7)
            query = query.gte('date', getISTDate(d7))
        } else if (preset === '30') {
            const d30 = new Date()
            d30.setDate(d30.getDate() - 30)
            query = query.gte('date', getISTDate(d30))
        } else if (preset === '365') {
            const d365 = new Date()
            d365.setDate(d365.getDate() - 365)
            query = query.gte('date', getISTDate(d365))
        } else if (preset === 'custom' && customStart) {
            query = query.gte('date', customStart)
            if (customEnd) query = query.lte('date', customEnd)
        }

        let { data: patients, error } = await query

        if (!patients || patients.length === 0) {
            // Fallback for null clinic_id entries
            let fbQuery = supabaseAdmin
                .from('patients')
                .select('*')
                .is('clinic_id', null)
                .order('joined_at', { ascending: false })

            if (preset === 'today') {
                fbQuery = fbQuery.eq('date', getISTDate(now))
            } else if (preset === '7') {
                const d7 = new Date()
                d7.setDate(d7.getDate() - 7)
                fbQuery = fbQuery.gte('date', getISTDate(d7))
            } else if (preset === '30') {
                const d30 = new Date()
                d30.setDate(d30.getDate() - 30)
                fbQuery = fbQuery.gte('date', getISTDate(d30))
            } else if (preset === '365') {
                const d365 = new Date()
                d365.setDate(d365.getDate() - 365)
                fbQuery = fbQuery.gte('date', getISTDate(d365))
            } else if (preset === 'custom' && customStart) {
                fbQuery = fbQuery.gte('date', customStart)
                if (customEnd) fbQuery = fbQuery.lte('date', customEnd)
            }

            const { data: fbData } = await fbQuery
            if (fbData && fbData.length > 0) patients = fbData
        }

        if (error && (!patients || patients.length === 0)) {
            console.error('[dashboard/history API Error]', error)
            return Response.json({ success: false, message: error.message }, { status: 500 })
        }

        return Response.json({ success: true, patients: patients || [] }, { status: 200 })
    } catch (error) {
        console.error('[dashboard/history API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
