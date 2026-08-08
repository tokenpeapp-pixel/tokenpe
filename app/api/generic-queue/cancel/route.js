import { supabaseAdmin } from '../../../../lib/supabase'
import { getUnifiedSession } from '../../../../lib/auth'

/**
 * # Cancellation Route
 * - Match done/next response shape
 * - Add status guard and timestamp
 * - Use patientId parameter
 */
export async function POST(req) {
  try {
    const session = await getUnifiedSession()
    if (!session || !session.businessId) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { patientId } = await req.json()
    const businessId = session.businessId

    if (!patientId) {
      return Response.json({ success: false, message: 'No queue entry ID provided' }, { status: 400 })
    }

    // Fetch entry with ownership check
    const { data: entry } = await supabaseAdmin
      .from('queue_entries')
      .select("*")
      .eq('id', patientId)
      .eq('business_id', businessId)
      .single()

    if (!entry) {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 })
    }

    // Prevent cancelling completed entries
    if (entry.status === 'completed') {
      return Response.json({ success: false, message: 'Cannot cancel a completed entry' }, { status: 400 })
    }

    // Use skipped because queue_entries only supports waiting/completed/skipped.
    const { data: updatedEntry, error } = await supabaseAdmin
      .from('queue_entries')
      .update({ status: 'skipped', done_at: new Date().toISOString() })
      .eq('id', patientId)
      .eq('business_id', businessId)
      .select()

    if (error) throw error

    return Response.json({ success: true, patient: updatedEntry[0] }, { status: 200 })
  } catch (error) {
    console.error('[generic-queue/cancel] Error:', error)
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
