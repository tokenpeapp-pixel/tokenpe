import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session || !session.clinicId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Keep using clinicId variable for consistency since the session payload still stores clinicId 
    // even for salons. The token payload sets: { clinicId: insertedClinic.id }
    const { clinicId, name, address, city, area, isPublic, photoUrl, lat, lng, phone, upiId } = await req.json()
    
    if (!clinicId) {
      return NextResponse.json({ success: false, error: 'Salon ID required' }, { status: 400 })
    }

    // Verify branch ownership via email match
    if (clinicId !== session.clinicId) {
      const { data: sessionSalon } = await supabaseAdmin.from('salons').select('email').eq('id', session.clinicId).single()
      const { data: targetSalon } = await supabaseAdmin.from('salons').select('email').eq('id', clinicId).single()
      if (!sessionSalon || !targetSalon || sessionSalon.email !== targetSalon.email) {
        return NextResponse.json({ success: false, error: 'Unauthorized salon access' }, { status: 403 })
      }
    }

    const updates = {}
    if (name !== undefined) updates.name = name
    if (address !== undefined) updates.address = address
    if (phone !== undefined) updates.phone = phone
    if (city !== undefined) updates.city = city ? city.trim() : null
    if (area !== undefined) updates.area = area ? area.trim() : null
    if (isPublic !== undefined) updates.is_public = isPublic
    if (photoUrl !== undefined) updates.photo_url = photoUrl
    if (upiId !== undefined) updates.upi_id = upiId ? upiId.trim() : null

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
      .from('salons')
      .update(updates)
      .eq('id', clinicId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update salon error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
