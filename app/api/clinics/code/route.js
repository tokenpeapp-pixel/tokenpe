import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
    try {
        const body = await req.json()
        const { clinicId, newCode } = body

        if (!clinicId || !newCode) {
            return NextResponse.json({ success: false, message: 'Missing clinic ID or new code' }, { status: 400 })
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
