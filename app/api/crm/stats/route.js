import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'

export async function GET(req) {
  try {
    const session = await getSession()
    if (!session || !session.clinicId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = session.clinicId

    // Fetch all patients for this clinic to calculate stats
    // We use supabaseAdmin to bypass RLS securely on the server
    const { data: patients, error } = await supabaseAdmin
      .from('patients')
      .select('phone, crm_rating, feedback_text, feedback_at, name, date, completed_at')
      .eq('clinic_id', clinicId)
      
    if (error) {
      throw error
    }

    if (!patients || patients.length === 0) {
      return NextResponse.json({
        success: true,
        totalPatients: 0,
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

    return NextResponse.json({
      success: true,
      totalPatients: uniquePhones.size,
      avgRating,
      recentFeedbacks: feedbacks
    })

  } catch (err) {
    console.error('[CRM Stats API] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
