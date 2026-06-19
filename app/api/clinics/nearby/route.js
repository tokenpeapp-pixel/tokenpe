import { supabaseAdmin } from '../../../../lib/supabase'

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
        return Response.json({ clinics }, { status: 200 })
      }
      if (error) console.log(`[Nearby API] RPC failed: ${error.message}`)
    } catch (rpcErr) {
      console.log(`[Nearby API] RPC exception: ${rpcErr.message}`)
    }

    // Strategy 2: Query clinics table directly, parse POINT location
    const { data: allClinics, error: dbError } = await supabaseAdmin
      .from('clinics')
      .select('id, name, specialty, city, area, code, avg_rating, photo_url, queue_paused, waiting_count, location, is_public')
      .eq('is_public', true)

    if (dbError) {
      console.error('[Nearby API] DB error:', dbError)
      return Response.json({ clinics: [] }, { status: 200 })
    }

    console.log(`[Nearby API] DB returned ${(allClinics || []).length} public clinics`)

    const clinics = (allClinics || [])
      .map(c => {
        let cLat = null, cLng = null

        if (c.location) {
          if (typeof c.location === 'string') {
            if (c.location.startsWith('01010000')) {
              // Parse PostGIS EWKB Hex string
              const isLittleEndian = c.location.substring(0, 2) === '01';
              const xHex = c.location.slice(-32, -16);
              const yHex = c.location.slice(-16);
              const getFloat64 = (hex) => {
                const bytes = new Uint8Array(8);
                for (let i = 0; i < 8; i++) {
                  bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
                }
                const view = new DataView(bytes.buffer);
                return view.getFloat64(0, isLittleEndian);
              };
              try {
                cLng = getFloat64(xHex);
                cLat = getFloat64(yHex);
              } catch (e) {}
            } else {
              // Parse standard POINT string if somehow returned
              const match = c.location.match(/POINT\(([^ ]+) ([^ ]+)\)/)
              if (match) {
                cLng = parseFloat(match[1])
                cLat = parseFloat(match[2])
              }
            }
          } else if (c.location.type === 'Point' && c.location.coordinates) {
            cLng = c.location.coordinates[0]
            cLat = c.location.coordinates[1]
          }
        }

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

    console.log(`[Nearby API] Returning ${clinics.length} clinics within range`)

    return Response.json({ clinics }, { status: 200 })
  } catch (err) {
    console.error('[Nearby API] Error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
