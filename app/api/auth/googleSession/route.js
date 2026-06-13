import { signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'
import { supabase } from '../../../../lib/supabase'
import { sendWelcomeEmail } from '../../../../lib/messaging'


export async function POST(req) {
    try {
        const body = await req.json()
        const { clinicId, clinicCode, phone, isNewRegistration, name } = body
        const authHeader = req.headers.get('Authorization')

        if (!clinicId || !clinicCode || !authHeader) {
            return Response.json({ success: false, message: 'Missing fields or token' }, { status: 400 })
        }

        const tokenString = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(tokenString)

        if (userError || !user) {
            return Response.json({ success: false, message: 'Invalid Supabase token' }, { status: 401 })
        }

        // Verify that the clinic belongs to this authenticated user
        const { data: clinic, error: clinicError } = await supabase
            .from('clinics')
            .select('email')
            .eq('id', clinicId)
            .single()

        if (clinicError || !clinic || clinic.email !== user.email) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        if (isNewRegistration) {
            // Send welcome email
            await sendWelcomeEmail(clinic.email, name || 'Doctor')
        }


        // Create JWT session
        const sessionPayload = {
            clinicId,
            clinicCode,
            phone: phone || '0000000000'
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

        return Response.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('[Google Session API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
