import { supabaseAdmin, getISTDateString } from '../../../../lib/supabase'

/**
 * GET /api/clinics/search
 * Searches public_clinics view filtered by vertical.
 *
 * Query params: q, city, specialty, status, vertical (REQUIRED)
 * Valid verticals: clinic, restaurant, salon, school, business
 */

const VALID_VERTICALS = new Set(['clinic', 'restaurant', 'salon', 'school', 'business'])

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const city = searchParams.get('city') || ''
    const specialty = searchParams.get('specialty') || ''
    const status = searchParams.get('status') || 'all'
    const vertical = (searchParams.get('vertical') || '').trim().toLowerCase()

    // ── Vertical guard: reject missing or invalid verticals ──────────────────
    if (!vertical || !VALID_VERTICALS.has(vertical)) {
      return Response.json(
        { clinics: [], error: `Missing or invalid 'vertical' param. Must be one of: ${[...VALID_VERTICALS].join(', ')}` },
        { status: 400 }
      )
    }

    // Get closed clinics for today (only within this vertical)
    const today = getISTDateString()
    let closedMap = {}
    let closedIds = []
    const { data: closedData } = await supabaseAdmin
      .from('clinics')
      .select('id, closed_today_date')
      .eq('vertical', vertical)
      .not('closed_today_date', 'is', null)

    for (const c of (closedData || [])) {
      closedMap[c.id] = c.closed_today_date
      closedIds.push(c.id)
    }

    let dbQuery = supabaseAdmin
      .from('public_clinics')
      .select('id, name, specialty, city, area, code, avg_rating, photo_url, queue_paused, waiting_count, lat, lng')
      .eq('vertical', vertical)   // ← enforces isolation
      .limit(60)

    if (q) dbQuery = dbQuery.or(`name.ilike.%${q}%,specialty.ilike.%${q}%,city.ilike.%${q}%,area.ilike.%${q}%`)
    if (city) dbQuery = dbQuery.ilike('city', `%${city}%`)
    if (specialty) dbQuery = dbQuery.ilike('specialty', `%${specialty}%`)

    if (status === 'paused') {
      dbQuery = dbQuery.eq('queue_paused', true)
    } else if (status === 'closed') {
      if (closedIds.length === 0) return Response.json({ clinics: [] }, { status: 200 })
      dbQuery = dbQuery.in('id', closedIds)
    } else if (status === 'open') {
      dbQuery = dbQuery.eq('queue_paused', false)
      if (closedIds.length > 0) {
        dbQuery = dbQuery.not('id', 'in', `(${closedIds.join(',')})`)
      }
    }

    const { data: clinicsList, error } = await dbQuery

    if (error) {
      console.error('[Search API] DB error:', error)
      return Response.json({ clinics: [] }, { status: 200 })
    }

    const list = clinicsList || []

    const clinics = list.map(c => ({
      ...c,
      is_closed_today: !!closedMap[c.id],
    }))

    return Response.json({ clinics }, { status: 200 })

  } catch (err) {
    console.error('[Search API] Error:', err)
    return Response.json({ clinics: [] }, { status: 200 })
  }
}
