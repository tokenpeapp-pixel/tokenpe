import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const city = searchParams.get('city')
        const lat = searchParams.get('lat')
        const lng = searchParams.get('lng')
        const radius = searchParams.get('radius') || 10 // km

        let query = supabaseAdmin
            .from('clinics')
            .select(`
                id, code, name, phone, email, specialty, welcome_message, active_notice,
                logo_url, banner_url, address, city, area, lat, lng, google_maps_url,
                website_url, operating_hours, is_open, closed_today_date, queue_paused,
                is_verified, avg_rating, rating_count, consultation_fee, registration_number,
                about_text, social_links, languages_spoken, amenities
            `)
            .eq('is_public', true)

        if (city) {
            query = query.ilike('city', `%${city}%`)
        }

        // PostGIS radius search (if rpc exists)
        if (lat && lng) {
            // Because we don't know if the user has a postgis RPC for distance search,
            // we will just fetch them and let the client sort/filter, OR just rely on basic city match.
            // Ideally: query = query.rpc('nearby_clinics', { lat, lng, radius_km: radius })
        }

        const { data: clinics, error } = await query

        if (error) {
            console.error('[Clinic V2 Discovery] DB Error:', error)
            return Response.json({ success: false, message: 'Database error' }, { status: 500 })
        }

        return Response.json({ success: true, clinics: clinics || [] }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Discovery Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
