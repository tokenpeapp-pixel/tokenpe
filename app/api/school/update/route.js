import { getUnifiedSession } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'

/**
 * POST /api/school/update
 *
 * Authenticates via the server-side session cookie.
 * Verifies the session belongs to the 'school' vertical.
 * Derives businessId from the session — NEVER from the request body.
 *
 * Body: { updates: { field: value, ... } }
 * Supported fields: location, active_notice, logo_url, name, specialty, city
 *
 * Writes to both 'schools' and 'public_schools' tables where applicable.
 */
export async function POST(req) {
    try {
        const session = await getUnifiedSession()
        if (!session || !session.businessId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // Verify this session is for a school account
        const { data: business, error: bizError } = await supabaseAdmin
            .from('businesses')
            .select('id, type')
            .eq('id', session.businessId)
            .single()

        if (bizError || !business || business.type !== 'school') {
            return Response.json({ success: false, message: 'Unauthorized: not a school account' }, { status: 403 })
        }

        const schoolId = business.id

        const body = await req.json()
        const { updates } = body

        if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
            return Response.json({ success: false, message: 'No updates provided' }, { status: 400 })
        }

        // Whitelist allowed fields to prevent arbitrary column injection
        const ALLOWED_FIELDS = ['location', 'active_notice', 'logo_url', 'name', 'specialty', 'city']
        const sanitized = {}
        for (const key of ALLOWED_FIELDS) {
            if (key in updates) sanitized[key] = updates[key]
        }

        if (Object.keys(sanitized).length === 0) {
            return Response.json({ success: false, message: 'No allowed fields provided' }, { status: 400 })
        }

        // Write to 'schools' table
        const { error: schoolsError } = await supabaseAdmin
            .from('schools')
            .update(sanitized)
            .eq('id', schoolId)

        if (schoolsError) {
            console.error('[school/update] schools table error:', schoolsError)
            // Don't hard-fail — schools table may not exist in all envs
        }

        // Write subset of fields to 'public_schools' table
        const PUBLIC_FIELDS = ['location', 'active_notice', 'logo_url', 'name', 'city']
        const publicUpdate = {}
        for (const key of PUBLIC_FIELDS) {
            if (key in sanitized) publicUpdate[key] = sanitized[key]
        }

        if (Object.keys(publicUpdate).length > 0) {
            const { error: pubError } = await supabaseAdmin
                .from('public_schools')
                .update(publicUpdate)
                .eq('id', schoolId)

            if (pubError) {
                console.error('[school/update] public_schools table error:', pubError)
                // Non-fatal — public_schools is a denormalized cache
            }
        }

        // Write subset of fields to unified 'businesses' table
        const BUSINESS_FIELDS = ['logo_url', 'name', 'specialty', 'city']
        const businessUpdate = {}
        for (const key of BUSINESS_FIELDS) {
            if (key in sanitized) businessUpdate[key] = sanitized[key]
        }

        // We also want to support `code` and `address` if they were passed, even though they weren't in ALLOWED_FIELDS originally.
        // The user mentioned `code` is not saving. Let's add them.
        if (updates.code) businessUpdate.code = updates.code.toUpperCase().replace(/[^A-Z0-9]/g, '')
        if (updates.address) businessUpdate.address = updates.address

        if (Object.keys(businessUpdate).length > 0) {
            const { error: bizUpdateError } = await supabaseAdmin
                .from('businesses')
                .update(businessUpdate)
                .eq('id', schoolId)

            if (bizUpdateError) {
                console.error('[school/update] businesses table error:', bizUpdateError)
                // We should probably fail if this doesn't work, since it's the main table.
                return Response.json({ success: false, message: 'Failed to update business profile' }, { status: 500 })
            }
        }

        return Response.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('[school/update] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
