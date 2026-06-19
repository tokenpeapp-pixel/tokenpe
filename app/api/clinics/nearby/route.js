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

    const { data, error } = await supabaseAdmin.rpc('find_nearby_clinics', {
      user_lat: lat,
      user_lng: lng,
      radius_m: safeRadius,
    })

    if (error) {
      console.error('[Nearby API] RPC error:', error)
      // Fallback: return empty rather than crash
      return Response.json({ clinics: [] }, { status: 200 })
    }

    // Map distance_m → distance_km and return only safe fields
    const clinics = (data || []).map((c) => ({
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

    return Response.json({ clinics }, { status: 200 })
  } catch (err) {
    console.error('[Nearby API] Error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
