import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { clinicId, newCode } = body

        if (!clinicId || !newCode) {
            return NextResponse.json({ success: false, message: 'Missing clinic ID or new code' }, { status: 400 })
        }

        if (clinicId !== session.clinicId) {
            return NextResponse.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 1. Verify the clinic exists and check their plan
        const { data: clinic } = await supabaseAdmin.from('clinics').select('plan_id, subscription_status, current_period_end').eq('id', clinicId).single()
        
        if (!clinic) {
            return NextResponse.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }

        const planId = clinic.plan_id || 'starter'
        const subExpired = clinic.current_period_end && new Date(clinic.current_period_end) < new Date()
        const isTrialing = planId === 'trialing' || clinic.subscription_status === 'trialing'
        const canEditCode = !subExpired && (planId === 'pro' || planId === 'elite' || isTrialing)

        if (!canEditCode) {
            return NextResponse.json({ success: false, message: 'Upgrade to Pro or Elite to customize your clinic code.' }, { status: 403 })
        }

        // 2. Check if the new code is already taken
        const { data: taken } = await supabaseAdmin.from('clinics').select('id').eq('code', newCode).single()
        
        if (taken && taken.id !== clinicId) {
             return NextResponse.json({ success: false, message: 'This code is already taken. Try another.' }, { status: 400 })
        }

        const { data: updatedData, error } = await supabaseAdmin
            .from('clinics')
            .update({ code: newCode })
            .eq('id', clinicId)
            .select()

        if (error || !updatedData || updatedData.length === 0) {
            console.error('Code update error:', error)
            return NextResponse.json({ success: false, message: 'Failed to update code' }, { status: 500 })
        }

        return NextResponse.json({ success: true, clinic: updatedData[0] }, { status: 200 })

    } catch (error) {
        console.error('Code update error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
