import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession, getUnifiedSession } from '../../../../lib/auth'

async function fetchEntityEmail(id) {
  if (!id) return null
  try {
    let { data } = await supabaseAdmin.from('clinics').select('email').eq('id', id).single()
    if (!data || !data.email) {
      const { data: bData } = await supabaseAdmin.from('businesses').select('email').eq('id', id).single()
      data = bData
    }
    return data?.email ? data.email.trim().toLowerCase() : null
  } catch (e) {
    return null
  }
}

export async function GET(req) {
  try {
    const session = (await getUnifiedSession()) || (await getSession())
    const sessionClinicId = session?.businessId || session?.clinicId

    const { searchParams } = new URL(req.url)
    const requestedClinicId = searchParams.get('clinicId') || searchParams.get('businessId')
    let businessId = requestedClinicId || sessionClinicId

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Clinic ID required' }, { status: 400 })
    }

    if (sessionClinicId && businessId !== sessionClinicId) {
      const sessionEmail = await fetchEntityEmail(sessionClinicId)
      const targetEmail = await fetchEntityEmail(businessId)
      if (sessionEmail && targetEmail && sessionEmail !== targetEmail) {
        return NextResponse.json({ success: false, error: 'Unauthorized branch access' }, { status: 403 })
      }
    }

    // Query patients table first (fallback to queue_entries)
    let { data: patients, error } = await supabaseAdmin
      .from('patients')
      .select('phone, name, date, completed_at, status, crm_rating, feedback_text, feedback_at')
      .eq('clinic_id', businessId)
      
    if (error || !patients) {
      const { data: qPatients } = await supabaseAdmin
        .from('queue_entries')
        .select('phone, crm_rating, feedback_text, feedback_at, name, date, completed_at, status')
        .eq('business_id', businessId)
      patients = qPatients || []
    }

    if (!patients || patients.length === 0) {
      return NextResponse.json({
        success: true,
        totalPatients: 0,
        medsReachable: 0,
        recallReachable: 0,
        avgRating: 0,
        recentFeedbacks: []
      })
    }

    // Calculate unique phones for broadcast reachable count
    const uniquePhones = new Set(patients.map(p => p.phone).filter(Boolean))
    
    // Calculate average rating
    const rated = patients.filter(p => p.crm_rating && p.crm_rating > 0)
    let avgRating = 0
    if (rated.length > 0) {
      const sum = rated.reduce((acc, p) => acc + p.crm_rating, 0)
      avgRating = (sum / rated.length).toFixed(1)
    }

    // Get recent feedback
    const feedbacks = rated
      .sort((a, b) => {
        const timeA = new Date(a.feedback_at || a.completed_at || a.date).getTime()
        const timeB = new Date(b.feedback_at || b.completed_at || b.date).getTime()
        return timeB - timeA
      })
      .slice(0, 10)

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const dateStr3 = threeDaysAgo.toISOString().split('T')[0]
    const medsReachable = new Set(patients.filter(p => p.date === dateStr3 && p.status === 'done').map(p => p.phone).filter(Boolean)).size

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const dateStr90 = ninetyDaysAgo.toISOString().split('T')[0]
    const recallReachable = new Set(patients.filter(p => p.date === dateStr90 && p.status === 'done').map(p => p.phone).filter(Boolean)).size

    return NextResponse.json({
      success: true,
      totalPatients: uniquePhones.size,
      medsReachable,
      recallReachable,
      avgRating,
      recentFeedbacks: feedbacks
    })

  } catch (err) {
    console.error('[CRM Stats API] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
