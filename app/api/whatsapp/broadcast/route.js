import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { sendTemplateMessage } from '../../../../lib/messaging'
import { getSession } from '../../../../lib/auth'

export async function POST(req) {
  try {
    const { clinicId, message, imageUrl } = await req.json()
    
    if (!clinicId || (!message && !imageUrl)) {
      return NextResponse.json({ success: false, error: 'Clinic ID and message or image required' }, { status: 400 })
    }

    const session = await getSession()
    if (!session || session.clinicId !== clinicId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Verify Clinic is Elite
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single()

    if (clinicError || !clinic) {
      return NextResponse.json({ success: false, error: 'Clinic not found' }, { status: 404 })
    }

    if (clinic.plan_id !== 'elite' && clinic.subscription_status !== 'trialing') {
      return NextResponse.json({ success: false, error: 'Broadcasts are for Elite plans only' }, { status: 403 })
    }

    // 2. Fetch Unique Patients
    const { data: patients, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('phone')
      .eq('clinic_id', clinicId)

    if (patientError) {
      return NextResponse.json({ success: false, error: 'Failed to fetch patients' }, { status: 500 })
    }

    const uniquePhones = [...new Set(patients.map(p => p.phone).filter(Boolean))]

    if (uniquePhones.length === 0) {
      return NextResponse.json({ success: false, error: 'No patients with phone numbers found' }, { status: 400 })
    }

    // 3. Send Broadcast using after() so Vercel keeps the function alive
    const formattedMessage = `📢 *Update from ${clinic.name}*\n\n${message || ''}\n\n_Powered by TokenPe_`
    
    after(async () => {
      console.log(`[Broadcast] Starting broadcast to ${uniquePhones.length} patients for ${clinic.name}`)
      let sent = 0
      let failed = 0

      for (const phone of uniquePhones) {
        try {
          if (imageUrl) {
            await sendTemplateMessage({
              phone,
              templateName: 'tokenpe_broadcast_image',
              bodyValues: [clinic.name, message || ' '],
              headerValues: [imageUrl]
            })
          } else {
            await sendTemplateMessage({
              phone,
              templateName: 'tokenpe_broadcast',
              bodyValues: [clinic.name, message || ' ']
            })
          }
          sent++
          // Small delay to avoid rate limits
          await new Promise(r => setTimeout(r, 150))
        } catch (err) {
          failed++
          console.error(`[Broadcast] Failed for ${phone}:`, err.message)
        }
      }

      console.log(`[Broadcast] Completed: ${sent} sent, ${failed} failed out of ${uniquePhones.length}`)
    })

    return NextResponse.json({ success: true, count: uniquePhones.length })
  } catch (err) {
    console.error('[Broadcast] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
