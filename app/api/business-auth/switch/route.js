import { supabaseAdmin } from '../../../../lib/supabase'
import { getSession, getUnifiedSession, signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'

export async function POST(req) {
    try {
        const session = (await getUnifiedSession()) || (await getSession())
        const body = await req.json()
        const targetId = body.targetClinicId || body.clinicId || body.businessId

        if (!targetId) {
            return Response.json({ success: false, message: 'Target clinic ID required' }, { status: 400 })
        }

        // Fetch target clinic from clinics or businesses table
        let { data: targetClinic } = await supabaseAdmin.from('clinics').select('*').eq('id', targetId).single()
        if (!targetClinic) {
            const { data: bData } = await supabaseAdmin.from('businesses').select('*').eq('id', targetId).single()
            targetClinic = bData
        }

        if (!targetClinic) {
            return Response.json({ success: false, message: 'Branch not found' }, { status: 404 })
        }

        // Create JWT session
        const sessionPayload = {
            businessId: targetClinic.id,
            clinicId: targetClinic.id,
            businessCode: targetClinic.code,
            phone: targetClinic.phone,
            type: targetClinic.vertical || 'clinic',
            vertical: targetClinic.vertical || 'clinic'
        }
        const token = await signToken(sessionPayload)

        // Set secure cookies
        const cookieStore = await cookies()
        const cookieOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/'
        }
        cookieStore.set('tokenpe_unified_session', token, cookieOpts)
        cookieStore.set('tokenpe_session', token, cookieOpts)

        return Response.json({ success: true, clinic: targetClinic }, { status: 200 })

    } catch (error) {
        console.error('[Switch API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
