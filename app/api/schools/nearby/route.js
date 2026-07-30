import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'

/**
 * GET /api/schools/nearby
 * Returns nearby schools for a given location.
 *
 * Query params: lat, lng, radius (metres, max 50000)
 */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get('lat'))
    const lng = parseFloat(searchParams.get('lng'))
    const radius = parseFloat(searchParams.get('radius') || '10000')

    if (isNaN(lat) || isNaN(lng)) {
      return Response.json({ error: 'lat and lng are required' }, { status: 400 })
    }

    const safeRadius = Math.min(radius, 50000)
    const today = getISTDateString()

    console.log(`[Schools Nearby API] lat=${lat}, lng=${lng}, radius=${safeRadius}m`)

    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3
      const p1 = lat1 * Math.PI / 180
      const p2 = lat2 * Math.PI / 180
      const dp = (lat2 - lat1) * Math.PI / 180
      const dl = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
                Math.cos(p1) * Math.cos(p2) *
                Math.sin(dl / 2) * Math.sin(dl / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    async function enrichWithClosedStatus(schoolsList) {
      if (!schoolsList.length) return schoolsList
      const ids = schoolsList.map(s => s.id)
      const { data: closedData } = await supabaseAdmin
        .from('schools')
        .select('id, closed_today_date')
        .in('id', ids)
      const closedMap = {}
      for (const s of (closedData || [])) {
        closedMap[s.id] = s.closed_today_date
      }
      return schoolsList.map(s => ({
        ...s,
        is_closed_today: !!closedMap[s.id],
      }))
    }

    // Since we don't have a PostGIS RPC specifically for schools yet, we use the fallback method.
    // Query the public_schools view
    const { data: allSchools, error: dbError } = await supabaseAdmin
      .from('public_schools')
      .select('id, name, institution_type, city, area, code, avg_rating, photo_url, queue_paused, waiting_count, lat, lng')

    if (dbError) {
      console.error('[Schools Nearby API] DB error:', dbError)
      return Response.json({ schools: [] }, { status: 200 })
    }

    const schoolsList = (allSchools || [])
      .map(s => {
        let sLat = parseFloat(s.lat)
        let sLng = parseFloat(s.lng)

        if (sLat === null || sLng === null || isNaN(sLat) || isNaN(sLng)) return null

        const distMeters = getDistance(lat, lng, sLat, sLng)
        return {
          id: s.id, 
          name: s.name, 
          specialty: s.institution_type, // Map institution_type to specialty for the frontend card
          city: s.city, 
          area: s.area, 
          code: s.code,
          avg_rating: s.avg_rating, 
          photo_url: s.photo_url,
          lat: sLat, 
          lng: sLng,
          distance_m: distMeters,
          distance_km: (distMeters / 1000).toFixed(1),
          queue_paused: s.queue_paused,
          waiting_count: s.waiting_count || 0,
        }
      })
      .filter(s => s !== null && s.distance_m <= safeRadius)
      .sort((a, b) => a.distance_m - b.distance_m)

    const enriched = await enrichWithClosedStatus(schoolsList)

    console.log(`[Schools Nearby API] Returning ${enriched.length} results within range`)

    return Response.json({ clinics: enriched }, { status: 200 }) // Return as `clinics` to avoid breaking frontend FindSchoolClient mapping
  } catch (err) {
    console.error('[Schools Nearby API] Error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
