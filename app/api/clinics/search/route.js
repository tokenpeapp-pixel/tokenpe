import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'

/**
 * GET /api/clinics/search
 * Searches public_clinics view and enriches results with closed_today_date
 * from the clinics table. This avoids needing to modify the view.
 *
 * Query params: q, city, specialty
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const city = searchParams.get('city') || ''
    const specialty = searchParams.get('specialty') || ''

    let dbQuery = supabaseAdmin
      .from('public_clinics')
      .select('id, name, specialty, city, area, code, avg_rating, photo_url, queue_paused, waiting_count')
      .limit(60)

    if (q) dbQuery = dbQuery.or(`name.ilike.%${q}%,specialty.ilike.%${q}%,city.ilike.%${q}%,area.ilike.%${q}%`)
    if (city) dbQuery = dbQuery.ilike('city', `%${city}%`)
    if (specialty) dbQuery = dbQuery.ilike('specialty', `%${specialty}%`)

    const { data: clinicsList, error } = await dbQuery

    if (error) {
      console.error('[Search API] DB error:', error)
      return Response.json({ clinics: [] }, { status: 200 })
    }

    const list = clinicsList || []

    // Enrich with closed status from the actual clinics table (not the view)
    const today = getISTDateString()
    let closedMap = {}
    if (list.length > 0) {
      const ids = list.map(c => c.id)
      const { data: closedData } = await supabaseAdmin
        .from('clinics')
        .select('id, closed_today_date')
        .in('id', ids)
      for (const c of (closedData || [])) {
        closedMap[c.id] = c.closed_today_date
      }
    }

    const clinics = list.map(c => ({
      ...c,
      is_closed_today: closedMap[c.id] === today,
    }))

    return Response.json({ clinics }, { status: 200 })

  } catch (err) {
    console.error('[Search API] Error:', err)
    return Response.json({ clinics: [] }, { status: 200 })
  }
}
