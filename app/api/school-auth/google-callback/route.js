import { signToken } from '../../../../lib/auth'
import { cookies } from 'next/headers'
import { supabaseAdmin, supabase, getISTDateString } from '../../../../lib/supabase'
import { sendWelcomeEmail } from '../../../../lib/messaging'
import { after } from 'next/server'

export async function POST(req) {
    try {
        const body = await req.json()
        const { intent } = body
        const authHeader = req.headers.get('Authorization')

        if (!authHeader) {
            return Response.json({ success: false, message: 'Missing token' }, { status: 400 })
        }

        const tokenString = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(tokenString)

        if (userError || !user) {
            return Response.json({ success: false, message: 'Invalid Supabase token' }, { status: 401 })
        }

        const { data: schools, error: schoolError } = await supabaseAdmin
            .from('schools')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: true })

        let finalSchoolData = null
        let isNewRegistration = false
        let userSchoolsToReturn = schools || []

        if (schools && schools.length > 0 && !schoolError) {
            // Login
            const schoolData = schools[0]
            const baseName = schoolData.name || user.user_metadata?.full_name || user.email.split('@')[0]
            const clean = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
            const todayStr = getISTDateString()
            const strToHash = schoolData.id + todayStr
            let hash = 0
            for (let i = 0; i < strToHash.length; i++) { hash = (hash << 5) - hash + strToHash.charCodeAt(i); hash |= 0 }
            const dailyNum = (Math.abs(hash) % 900) + 100
            const newCode = `${clean}${dailyNum}`

            finalSchoolData = schoolData

            if (schoolData.code !== newCode) {
                const { data: updated, error: updateError } = await supabaseAdmin
                    .from('schools')
                    .update({ code: newCode })
                    .eq('id', schoolData.id)
                    .select()
                    .single()
                if (updated && !updateError) {
                    finalSchoolData = updated
                    userSchoolsToReturn = userSchoolsToReturn.map(c => c.id === updated.id ? updated : c)
                }
            }
        } else {
            // Registration
            if (intent === 'login') {
                return Response.json({ success: false, message: 'no_school' }, { status: 404 })
            }

            isNewRegistration = true
            const baseName = user.user_metadata?.full_name || user.email.split('@')[0]
            const clean = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
            const todayStr = getISTDateString()
            const strToHash = user.email + todayStr
            let hash = 0
            for (let i = 0; i < strToHash.length; i++) { hash = (hash << 5) - hash + strToHash.charCodeAt(i); hash |= 0 }
            const num = (Math.abs(hash) % 900) + 100
            const newCode = `${clean}${num}`

            const trialEndsAt = new Date()
            trialEndsAt.setDate(trialEndsAt.getDate() + 7)

            const newSchoolData = {
                name: user.user_metadata?.full_name || 'My School',
                email: user.email,
                code: newCode,
                phone: '0000000000',
                plan_id: 'elite',
                subscription_status: 'trialing',
                trial_ends_at: trialEndsAt.toISOString()
            }

            const { data: insertedSchool, error: insertError } = await supabaseAdmin
                .from('schools')
                .insert(newSchoolData)
                .select()
                .single()

            if (insertError) {
                return Response.json({ success: false, message: 'create_failed' }, { status: 500 })
            }

            finalSchoolData = insertedSchool
            userSchoolsToReturn = [insertedSchool]

            after(async () => {
                await sendWelcomeEmail(finalSchoolData.email, finalSchoolData.name)
            })
        }

        const sessionPayload = {
            clinicId: finalSchoolData.id,
            clinicCode: finalSchoolData.code,
            phone: finalSchoolData.phone || '0000000000',
            vertical: 'school'
        }
        const token = await signToken(sessionPayload)

        const cookieStore = await cookies()
        cookieStore.set('tokenpe_school_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/'
        })

        return Response.json({
            success: true,
            clinic: finalSchoolData, // Keeping key as clinic for frontend compatibility
            userClinics: userSchoolsToReturn,
            isNewRegistration
        }, { status: 200 })

    } catch (error) {
        console.error('[School Google Callback API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
