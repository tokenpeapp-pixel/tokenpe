import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'

const VALID_VERTICALS = new Set(['clinic', 'restaurant', 'salon', 'school', 'business'])

function matchesText(value, query) {
  return String(value || '').toLowerCase().includes(query)
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const vertical = (searchParams.get('vertical') || '').trim().toLowerCase()
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const city = (searchParams.get('city') || '').trim().toLowerCase()
    const specialty = (searchParams.get('specialty') || '').trim().toLowerCase()
    const status = (searchParams.get('status') || 'all').trim().toLowerCase()
    const today = getISTDateString()

    if (!vertical || !VALID_VERTICALS.has(vertical)) {
      return Response.json({ clinics: [], error: 'Missing or invalid vertical' }, { status: 400 })
    }

    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('id, name, specialty, city, area, code, logo_url, location, lat, lng, queue_paused, closed_today_date')
      .eq('type', vertical)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const filtered = (businesses || []).filter((biz) => {
      if (q && ![biz.name, biz.specialty, biz.city, biz.area, biz.code].some(v => matchesText(v, q))) return false
      if (city && !matchesText(biz.city, city)) return false
      if (specialty && !matchesText(biz.specialty, specialty)) return false
      if (status === 'open' && (biz.queue_paused || biz.closed_today_date)) return false
      if (status === 'paused' && !biz.queue_paused) return false
      if (status === 'closed' && !biz.closed_today_date) return false
      return true
    })

    const withCounts = await Promise.all(filtered.map(async (biz) => {
      const { count } = await supabaseAdmin
        .from('queue_entries')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', biz.id)
        .eq('status', 'waiting')
        .eq('date', today)

      return {
        id: biz.id,
        name: biz.name,
        specialty: biz.specialty,
        city: biz.city,
        area: biz.area,
        code: biz.code,
        photo_url: biz.logo_url,
        logo_url: biz.logo_url,
        location: biz.location,
        lat: biz.lat,
        lng: biz.lng,
        queue_paused: biz.queue_paused,
        is_closed_today: !!biz.closed_today_date,
        waiting_count: count || 0,
      }
    }))

    return Response.json({ clinics: withCounts }, { status: 200 })
  } catch (error) {
    console.error('[clinics/search] Error:', error)
    return Response.json({ clinics: [] }, { status: 500 })
  }
}
