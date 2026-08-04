import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const session = await getUnifiedSession()
    if (!session || !session.businessId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      businessId, name, welcomeMessage, address, specialty, city, area, isPublic, 
      photoUrl, lat, lng, phone, smartRecallEnabled, smartMedsEnabled, upiId 
    } = body
    
    const targetBusinessId = businessId || session.businessId

    if (!targetBusinessId) {
      return NextResponse.json({ success: false, error: 'Business ID required' }, { status: 400 })
    }

    // Verify branch ownership via email match
    if (targetBusinessId !== session.businessId) {
      const { data: sessionBusiness } = await supabaseAdmin.from('businesses').select('email').eq('id', session.businessId).single()
      const { data: targetBusiness } = await supabaseAdmin.from('businesses').select('email').eq('id', targetBusinessId).single()
      if (!sessionBusiness || !targetBusiness || sessionBusiness.email !== targetBusiness.email) {
        return NextResponse.json({ success: false, error: 'Unauthorized business access' }, { status: 403 })
      }
    }

    const { data: existingBusiness, error: fetchError } = await supabaseAdmin
        .from('businesses')
        .select('settings')
        .eq('id', targetBusinessId)
        .single()
        
    if (fetchError || !existingBusiness) {
        return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const updates = {}
    const newSettings = { ...existingBusiness.settings }
    let updateSettings = false

    if (name !== undefined) updates.name = name
    if (welcomeMessage !== undefined) updates.welcome_message = welcomeMessage
    if (address !== undefined) updates.address = address
    if (specialty !== undefined) updates.specialty = specialty
    if (phone !== undefined) updates.phone = phone
    if (city !== undefined) updates.city = city ? city.trim() : null
    if (area !== undefined) updates.area = area ? area.trim() : null
    if (photoUrl !== undefined) updates.logo_url = photoUrl

    // Settings fields
    if (isPublic !== undefined) { newSettings.is_public = isPublic; updateSettings = true }
    if (smartRecallEnabled !== undefined) { newSettings.smart_recall_enabled = smartRecallEnabled; updateSettings = true }
    if (smartMedsEnabled !== undefined) { newSettings.smart_meds_enabled = smartMedsEnabled; updateSettings = true }
    if (upiId !== undefined) { newSettings.upi_id = upiId ? upiId.trim() : null; updateSettings = true }
    
    if (updateSettings) {
        updates.settings = newSettings
    }

    if (lat !== undefined && lng !== undefined) {
      if (lat === null || lng === null) {
        updates.lat = null
        updates.lng = null
        updates.location = null
      } else {
        const parsedLat = parseFloat(lat)
        const parsedLng = parseFloat(lng)
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          updates.lat = parsedLat
          updates.lng = parsedLng
          updates.location = `POINT(${parsedLng} ${parsedLat})`
        }
      }
    }

    const { error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('id', targetBusinessId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update business error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
