import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { sendTemplateMessage, sendCRMInteractiveRating } from '../../../../lib/messaging'

export async function GET(req) {
  try {
    // 1. Verify Vercel Cron Secret (Security)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('[Cron] Unauthorized request to follow-ups endpoint')
      return new Response('Unauthorized', { status: 401 })
    }

    console.log('[Cron] Starting Smart Follow-ups job...')

    // 2. Fetch all Elite/Trial clinics that have either feature enabled
    const { data: clinics, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name, smart_recall_enabled, smart_meds_enabled, plan_id, subscription_status')
      .or('smart_recall_enabled.eq.true,smart_meds_enabled.eq.true')
      
    if (clinicError) throw clinicError

    // Filter only active Pro, Elite, or Trial
    const activeClinics = clinics.filter(c => c.plan_id === 'elite' || c.plan_id === 'pro' || c.subscription_status === 'trialing')
    
    if (activeClinics.length === 0) {
      return NextResponse.json({ success: true, message: 'No active clinics with follow-ups enabled' })
    }

    let medsSent = 0
    let recallSent = 0

    // 3. Process each clinic
    for (const clinic of activeClinics) {
      
      // -- MEDICINE REMINDERS (3 Days Ago) --
      if (clinic.smart_meds_enabled) {
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        const dateStr3 = threeDaysAgo.toISOString().split('T')[0] // YYYY-MM-DD

        const { data: medsPatients } = await supabase
          .from('patients')
          .select('phone, name, language')
          .eq('clinic_id', clinic.id)
          .eq('date', dateStr3)
          .eq('status', 'done')

        if (medsPatients && medsPatients.length > 0) {
          // Unique phones only
          const unique = [...new Map(medsPatients.map(p => [p.phone, p])).values()]
          for (const patient of unique) {
            if (!patient.phone) continue
            await sendTemplateMessage({
              phone: patient.phone,
              templateName: 'tokenpe_meds_reminder',
              bodyValues: [patient.name || 'Patient', clinic.name]
            })
            
            // Send CRM Rating immediately after
            await new Promise(r => setTimeout(r, 200)) // delay between template and text
            await sendCRMInteractiveRating(patient.phone, clinic.name, patient.language || 'en')
            
            medsSent++
            await new Promise(r => setTimeout(r, 100))
          }
        }
      }

      // -- 90-DAY RECALL (90 Days Ago) --
      if (clinic.smart_recall_enabled) {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const dateStr90 = ninetyDaysAgo.toISOString().split('T')[0]

        const { data: recallPatients } = await supabase
          .from('patients')
          .select('phone, name, language')
          .eq('clinic_id', clinic.id)
          .eq('date', dateStr90)
          .eq('status', 'done')

        if (recallPatients && recallPatients.length > 0) {
          const unique = [...new Map(recallPatients.map(p => [p.phone, p])).values()]
          for (const patient of unique) {
            if (!patient.phone) continue
            await sendTemplateMessage({
              phone: patient.phone,
              templateName: 'tokenpe_recall_reminder',
              bodyValues: [patient.name || 'Patient', clinic.name]
            })

            // Send CRM Rating immediately after
            await new Promise(r => setTimeout(r, 200)) // delay between template and text
            await sendCRMInteractiveRating(patient.phone, clinic.name, patient.language || 'en')

            recallSent++
            await new Promise(r => setTimeout(r, 100))
          }
        }
      }
    }

    console.log(`[Cron] Smart Follow-ups done. Meds sent: ${medsSent}, Recalls sent: ${recallSent}`)
    return NextResponse.json({ success: true, medsSent, recallSent })

  } catch (err) {
    console.error('[Cron] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
