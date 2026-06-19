import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session || !session.clinicId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { clinicId, name, welcomeMessage, address, specialty, city, area, isPublic, photoUrl, lat, lng, phone } = await req.json()
    
    if (!clinicId) {
      return NextResponse.json({ success: false, error: 'Clinic ID required' }, { status: 400 })
    }

    // Verify branch ownership via email match
    if (clinicId !== session.clinicId) {
      const { data: sessionClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', session.clinicId).single()
      const { data: targetClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', clinicId).single()
      if (!sessionClinic || !targetClinic || sessionClinic.email !== targetClinic.email) {
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

    if (lat !== undefined && lng !== undefined) {
      if (lat === null || lng === null) {
        updates.location = null
      } else {
        const parsedLat = parseFloat(lat)
        const parsedLng = parseFloat(lng)
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          updates.location = `POINT(${parsedLng} ${parsedLat})`
        }
      }
    }

    const { error } = await supabaseAdmin
      .from('clinics')
      .update(updates)
      .eq('id', clinicId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update clinic error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
