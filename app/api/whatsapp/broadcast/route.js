import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { sendText, sendImage } from '../../../../lib/messaging'

export async function POST(req) {
  try {
    const { clinicId, message, imageUrl } = await req.json()
    
    if (!clinicId || !message) {
      return NextResponse.json({ success: false, error: 'Clinic ID and message required' }, { status: 400 })
    }

    // 1. Verify Clinic is Elite
    const { data: clinic, error: clinicError } = await supabase
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
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('phone')
      .eq('clinic_id', clinicId)

    if (patientError) {
      return NextResponse.json({ success: false, error: 'Failed to fetch patients' }, { status: 500 })
    }

    const uniquePhones = [...new Set(patients.map(p => p.phone))]

    // 3. Send Broadcast in Background
    // We don't await the entire loop so the request doesn't timeout
    const formattedMessage = `📢 *Update from ${clinic.name}*\n\n${message}\n\n_Powered by TokenPe_`
    
    // In a real production system with thousands of patients, we would use a queue system (like BullMQ)
    // or batching. For now, since Vercel serverless has execution limits, we will send in small batches.
    
    setTimeout(async () => {
      for (const phone of uniquePhones) {
        try {
          if (imageUrl) {
            await sendImage(phone, imageUrl, formattedMessage)
          } else {
            await sendText(phone, formattedMessage)
          }
          // Add a small delay to avoid hitting rate limits
          await new Promise(r => setTimeout(r, 100))
        } catch (err) {
          console.error(`Failed to broadcast to ${phone}:`, err)
        }
      }
    }, 0)

    return NextResponse.json({ success: true, count: uniquePhones.length })
  } catch (err) {
    console.error('Broadcast error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
