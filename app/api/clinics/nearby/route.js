import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get('lat'))
    const lng = parseFloat(searchParams.get('lng'))
    const radius = parseFloat(searchParams.get('radius') || '10000') // metres, default 10km

    if (isNaN(lat) || isNaN(lng)) {
      return Response.json({ error: 'lat and lng are required' }, { status: 400 })
    }

    // Clamp radius to 50km max to prevent abuse
    const safeRadius = Math.min(radius, 50000)

    // Fetch all clinics that have lat and lng
    const { data: allClinics, error } = await supabaseAdmin
      .from('public_clinics')
      .select('id, name, specialty, city, area, code, avg_rating, photo_url, lat, lng, queue_paused, waiting_count')
      .not('lat', 'is', null)
      .not('lng', 'is', null)

    if (error) {
      console.error('[Nearby API] DB error:', error)
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    // Perfect Haversine distance calculation in JS
    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3 // Earth radius in metres
      const p1 = lat1 * Math.PI / 180
      const p2 = lat2 * Math.PI / 180
      const dp = (lat2 - lat1) * Math.PI / 180
      const dl = (lon2 - lon1) * Math.PI / 180

      const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
                Math.cos(p1) * Math.cos(p2) *
                Math.sin(dl / 2) * Math.sin(dl / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c // in metres
    }

    // Calculate distance, filter by radius, and sort
    const clinics = (allClinics || [])
      .map(c => {
        const distMeters = getDistance(lat, lng, parseFloat(c.lat), parseFloat(c.lng))
        return {
          ...c,
          distance_m: distMeters,
          distance_km: (distMeters / 1000).toFixed(1)
        }
      })
      .filter(c => c.distance_m <= safeRadius)
      .sort((a, b) => a.distance_m - b.distance_m)
      .map(c => ({
        id: c.id,
        name: c.name,
        specialty: c.specialty,
        city: c.city,
        area: c.area,
        code: c.code,
        avg_rating: c.avg_rating,
        photo_url: c.photo_url,
        lat: c.lat,
        lng: c.lng,
        distance_km: c.distance_km,
        queue_paused: c.queue_paused,
        waiting_count: c.waiting_count || 0,
      }))

    return Response.json({ clinics }, { status: 200 })
  } catch (err) {
    console.error('[Nearby API] Error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
