import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'

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

    console.log(`[Nearby API] lat=${lat}, lng=${lng}, radius=${safeRadius}m`)

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

    // ── Helper: enrich clinics list with closed_today_date from clinics table ──
    // We fetch this from the real clinics table (not the view) because the view
    // may not have the column yet. This keeps the view untouched.
    async function enrichWithClosedStatus(clinics) {
      if (!clinics.length) return clinics
      const ids = clinics.map(c => c.id)
      const { data: closedData } = await supabaseAdmin
        .from('clinics')
        .select('id, closed_today_date')
        .in('id', ids)
      const closedMap = {}
      for (const c of (closedData || [])) {
        closedMap[c.id] = c.closed_today_date
      }
      return clinics.map(c => ({
        ...c,
        is_closed_today: closedMap[c.id] === today,
      }))
    }

    // Strategy 1: Try PostGIS RPC (most accurate)
    try {
      const { data, error } = await supabaseAdmin.rpc('find_nearby_clinics', {
        user_lat: lat,
        user_lng: lng,
        radius_m: safeRadius,
      })
      if (!error && data && data.length > 0) {
        console.log(`[Nearby API] RPC success: ${data.length} clinics`)
        const clinics = data.map(c => ({
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
          distance_km: c.distance_m ? (c.distance_m / 1000).toFixed(1) : null,
          queue_paused: c.queue_paused,
          waiting_count: c.waiting_count || 0,
        }))
        const enriched = await enrichWithClosedStatus(clinics)
        return Response.json({ clinics: enriched }, { status: 200 })
      }
      if (error) console.log(`[Nearby API] RPC failed: ${error.message}`)
    } catch (rpcErr) {
      console.log(`[Nearby API] RPC exception: ${rpcErr.message}`)
    }

    // Strategy 2: Query public_clinics view directly (no closed_today_date in view)
    const { data: allClinics, error: dbError } = await supabaseAdmin
      .from('public_clinics')
      .select('id, name, specialty, city, area, code, avg_rating, photo_url, queue_paused, waiting_count, lat, lng')

    if (dbError) {
      console.error('[Nearby API] DB error:', dbError)
      return Response.json({ clinics: [] }, { status: 200 })
    }

    console.log(`[Nearby API] DB returned ${(allClinics || []).length} public clinics`)

    const clinics = (allClinics || [])
      .map(c => {
        let cLat = parseFloat(c.lat)
        let cLng = parseFloat(c.lng)

        if (cLat === null || cLng === null || isNaN(cLat) || isNaN(cLng)) return null

        const distMeters = getDistance(lat, lng, cLat, cLng)
        return {
          id: c.id, name: c.name, specialty: c.specialty,
          city: c.city, area: c.area, code: c.code,
          avg_rating: c.avg_rating, photo_url: c.photo_url,
          lat: cLat, lng: cLng,
          distance_m: distMeters,
          distance_km: (distMeters / 1000).toFixed(1),
          queue_paused: c.queue_paused,
          waiting_count: c.waiting_count || 0,
        }
      })
      .filter(c => c !== null && c.distance_m <= safeRadius)
      .sort((a, b) => a.distance_m - b.distance_m)

    // Enrich with closed status from clinics table (separate query, safe)
    const enriched = await enrichWithClosedStatus(clinics)

    console.log(`[Nearby API] Returning ${enriched.length} clinics within range`)

    return Response.json({ clinics: enriched }, { status: 200 })
  } catch (err) {
    console.error('[Nearby API] Error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
