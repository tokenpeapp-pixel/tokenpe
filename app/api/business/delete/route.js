import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const session = await getUnifiedSession()
    if (!session || !session.businessId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await req.json()
    
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID required' }, { status: 400 })
    }

    // You cannot delete your primary session business through this endpoint
    if (businessId === session.businessId) {
        return NextResponse.json({ success: false, error: 'Cannot delete the active session branch' }, { status: 403 })
    }

    // Verify ownership via email match
    const { data: sessionBusiness } = await supabaseAdmin.from('businesses').select('email').eq('id', session.businessId).single()
    const { data: targetBusiness } = await supabaseAdmin.from('businesses').select('email').eq('id', businessId).single()
    
    if (!sessionBusiness || !targetBusiness || sessionBusiness.email !== targetBusiness.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized business access' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', businessId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete branch error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
