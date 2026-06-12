import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'

export async function GET(req) {
  try {
    const session = await getSession()
    if (!session || !session.clinicId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Allow fetching stats for a specific branch (verify ownership via email)
    const { searchParams } = new URL(req.url)
    const requestedClinicId = searchParams.get('clinicId')
    let clinicId = session.clinicId

    if (requestedClinicId && requestedClinicId !== session.clinicId) {
      // Verify ownership: both clinics must share the same email
      const { data: sessionClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', session.clinicId).single()
      const { data: targetClinic } = await supabaseAdmin.from('clinics').select('email').eq('id', requestedClinicId).single()
      if (!sessionClinic || !targetClinic || sessionClinic.email !== targetClinic.email) {
        return NextResponse.json({ success: false, error: 'Unauthorized branch access' }, { status: 403 })
      }
      clinicId = requestedClinicId
    }

    // Fetch all patients for this clinic to calculate stats
    // We use supabaseAdmin to bypass RLS securely on the server
    const { data: patients, error } = await supabaseAdmin
      .from('patients')
      .select('phone, crm_rating, feedback_text, feedback_at, name, date, completed_at, status')
      .eq('clinic_id', clinicId)
      
    if (error) {
      throw error
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

    // Get recent feedback (sort by feedback_at, then completed_at, then date)
    const feedbacks = rated
      .filter(p => p.feedback_text)
      .sort((a, b) => {
        const timeA = new Date(a.feedback_at || a.completed_at || a.date).getTime()
        const timeB = new Date(b.feedback_at || b.completed_at || b.date).getTime()
        return timeB - timeA
      })
      .slice(0, 10)

    // Calculate reachable today for meds (3 days ago, status done)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const dateStr3 = threeDaysAgo.toISOString().split('T')[0]
    const medsReachable = new Set(patients.filter(p => p.date === dateStr3 && p.status === 'done').map(p => p.phone).filter(Boolean)).size

    // Calculate reachable today for recall (90 days ago, status done)
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
