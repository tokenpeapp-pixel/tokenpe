import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { getSession, signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { targetClinicId } = await req.json()
        if (!targetClinicId) {
            return Response.json({ success: false, message: 'Target clinic ID required' }, { status: 400 })
        }

        // Fetch current clinic to get the email AND vertical
        const { data: currentClinic, error: err1 } = await supabaseAdmin.from('clinics').select('email, vertical').eq('id', session.clinicId).single()
        if (err1 || !currentClinic) {
            return Response.json({ success: false, message: 'Invalid session' }, { status: 401 })
        }

        // Fetch target clinic to verify ownership and get details
        const { data: targetClinic, error: err2 } = await supabaseAdmin.from('clinics').select('*').eq('id', targetClinicId).single()
        // Verify: target must be owned by same user AND be in the same vertical.
        // Cross-industry switching is intentionally blocked — each industry is a
        // separate account with its own subscription.
        if (err2 || !targetClinic
            || targetClinic.email !== currentClinic.email
            || targetClinic.vertical !== currentClinic.vertical) {
            return Response.json({ success: false, message: 'Unauthorized branch switch' }, { status: 403 })
        }

        // Create JWT session
        const sessionPayload = {
            clinicId: targetClinic.id,
            clinicCode: targetClinic.code,
            phone: targetClinic.phone
        }
        const token = await signToken(sessionPayload)

        // Set secure cookie
        const cookieStore = await cookies()
        cookieStore.set('tokenpe_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/'
        })

        return Response.json({ success: true, clinic: targetClinic }, { status: 200 })

    } catch (error) {
        console.error('[Switch API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
