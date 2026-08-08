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

    if (vertical === 'school') {
      const { data: businesses, error } = await supabaseAdmin
        .from('businesses')
        .select('id, name, specialty, city, area, code, logo_url, location, lat, lng, queue_paused, closed_today_date')
        .eq('type', 'school')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const filtered = (businesses || []).filter((school) => {
        if (q && ![school.name, school.specialty, school.city, school.area, school.code].some(v => matchesText(v, q))) return false
        if (city && !matchesText(school.city, city)) return false
        if (specialty && !matchesText(school.specialty, specialty)) return false
        if (status === 'open' && (school.queue_paused || school.closed_today_date)) return false
        if (status === 'paused' && !school.queue_paused) return false
        if (status === 'closed' && !school.closed_today_date) return false
        return true
      })

      const withCounts = await Promise.all(filtered.map(async (school) => {
        const { count } = await supabaseAdmin
          .from('queue_entries')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', school.id)
          .eq('status', 'waiting')
          .eq('date', today)

        return {
          id: school.id,
          name: school.name,
          specialty: school.specialty,
          city: school.city,
          area: school.area,
          code: school.code,
          photo_url: school.logo_url,
          logo_url: school.logo_url,
          location: school.location,
          lat: school.lat,
          lng: school.lng,
          queue_paused: school.queue_paused,
          is_closed_today: !!school.closed_today_date,
          waiting_count: count || 0,
        }
      }))

      return Response.json({ clinics: withCounts }, { status: 200 })
    }

    let query = supabaseAdmin
      .from('public_clinics')
      .select('id, name, specialty, city, area, code, avg_rating, photo_url, queue_paused, waiting_count, lat, lng')
      .eq('vertical', vertical)

    if (city) query = query.ilike('city', `%${city}%`)
    if (specialty) query = query.ilike('specialty', `%${specialty}%`)
    if (q) query = query.or(`name.ilike.%${q}%,specialty.ilike.%${q}%,city.ilike.%${q}%,area.ilike.%${q}%,code.ilike.%${q}%`)
    if (status === 'paused') query = query.eq('queue_paused', true)
    if (status === 'open') query = query.eq('queue_paused', false)

    const { data, error } = await query.limit(100)
    if (error) throw error

    return Response.json({ clinics: data || [] }, { status: 200 })
  } catch (error) {
    console.error('[clinics/search] Error:', error)
    return Response.json({ clinics: [] }, { status: 500 })
  }
}
