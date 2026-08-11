import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession, getUnifiedSession } from '../../../../lib/auth'

async function getEmail(id) {
  if (!id) return null
  try {
    const { data: c } = await supabaseAdmin.from('clinics').select('email').eq('id', id).single()
    if (c?.email) return c.email.trim().toLowerCase()
    const { data: b } = await supabaseAdmin.from('businesses').select('email').eq('id', id).single()
    return b?.email ? b.email.trim().toLowerCase() : null
  } catch (e) {
    return null
  }
}

export async function POST(req) {
  try {
    const session = (await getUnifiedSession()) || (await getSession())
    const sessionClinicId = session?.businessId || session?.clinicId

    if (!sessionClinicId) {
      return NextResponse.json({ success: false, error: 'Unauthorized - No valid session found' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      clinicId, businessId, name, welcomeMessage, address, specialty, 
      city, area, isPublic, photoUrl, lat, lng, phone, 
      smartRecallEnabled, smartMedsEnabled, upiId,
      botTimings, botLocation, botLocationUrl, botDoctors,
      googleReviewLink
    } = body

    const targetId = clinicId || businessId || sessionClinicId

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Clinic ID required' }, { status: 400 })
    }

    if (sessionClinicId && targetId !== sessionClinicId) {
      const sessionEmail = await getEmail(sessionClinicId)
      const targetEmail = await getEmail(targetId)
      if (sessionEmail && targetEmail && sessionEmail !== targetEmail) {
        return NextResponse.json({ success: false, error: 'Unauthorized clinic access' }, { status: 403 })
      }
    }

    const updates = {}
    if (name !== undefined) updates.name = name
    if (welcomeMessage !== undefined) updates.welcome_message = welcomeMessage
    if (address !== undefined) updates.address = address
    if (specialty !== undefined) updates.specialty = specialty
    if (phone !== undefined) updates.phone = phone
    if (city !== undefined) updates.city = city ? city.trim() : null
    if (area !== undefined) updates.area = area ? area.trim() : null
    if (isPublic !== undefined) updates.is_public = isPublic
    if (photoUrl !== undefined) updates.photo_url = photoUrl
    if (smartRecallEnabled !== undefined) updates.smart_recall_enabled = smartRecallEnabled
    if (smartMedsEnabled !== undefined) updates.smart_meds_enabled = smartMedsEnabled
    if (botTimings !== undefined) updates.bot_timings = botTimings
    if (botLocation !== undefined) updates.bot_location = botLocation
    if (botLocationUrl !== undefined) updates.bot_location_url = botLocationUrl
    if (botDoctors !== undefined) updates.bot_doctors = botDoctors
    if (googleReviewLink !== undefined) updates.google_review_link = googleReviewLink

    if (lat !== undefined && lng !== undefined) {
      if (lat === null || lng === null) {
        updates.location = null
      } else {
        const pLat = parseFloat(lat)
        const pLng = parseFloat(lng)
        if (!isNaN(pLat) && !isNaN(pLng)) {
          updates.location = `POINT(${pLng} ${pLat})`
        }
      }
    }

    const { error: clinicErr } = await supabaseAdmin.from('clinics').update(updates).eq('id', targetId)

    const bUpdates = { ...updates }
    if (photoUrl !== undefined) {
      bUpdates.logo_url = photoUrl
      delete bUpdates.photo_url
    }

    if (clinicErr) {
      const { error: bErr } = await supabaseAdmin.from('businesses').update(bUpdates).eq('id', targetId)
      if (bErr) throw bErr
    } else {
      await supabaseAdmin.from('businesses').update(bUpdates).eq('id', targetId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update clinic error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
