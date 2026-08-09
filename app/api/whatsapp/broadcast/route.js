import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { sendTemplateMessage } from '../../../../lib/messaging'
import { getSession, getUnifiedSession } from '../../../../lib/auth'

async function fetchEntityEmail(id) {
  if (!id) return null
  try {
    let { data } = await supabaseAdmin.from('clinics').select('email').eq('id', id).single()
    if (!data || !data.email) {
      const { data: bData } = await supabaseAdmin.from('businesses').select('email').eq('id', id).single()
      data = bData
    }
    return data?.email ? data.email.trim().toLowerCase() : null
  } catch (e) {
    return null
  }
}

export async function POST(req) {
  try {
    const { businessId, clinicId, message, imageUrl } = await req.json()
    const targetId = businessId || clinicId
    
    if (!targetId || (!message && !imageUrl)) {
      return NextResponse.json({ success: false, error: 'Clinic ID and message or image required' }, { status: 400 })
    }

    const session = (await getUnifiedSession()) || (await getSession())
    const sessionClinicId = session?.businessId || session?.clinicId

    if (sessionClinicId && sessionClinicId !== targetId) {
      const sessionEmail = await fetchEntityEmail(sessionClinicId)
      const targetEmail = await fetchEntityEmail(targetId)
      if (sessionEmail && targetEmail && sessionEmail !== targetEmail) {
        return NextResponse.json({ success: false, error: 'Unauthorized branch access' }, { status: 403 })
      }
    }

    // 1. Verify Clinic
    let { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', targetId)
      .single()

    if (!clinic) {
      const { data: bClinic } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('id', targetId)
        .single()
      clinic = bClinic
    }

    if (!clinic) {
      return NextResponse.json({ success: false, error: 'Clinic not found' }, { status: 404 })
    }

    // 2. Fetch Unique Patients
    let { data: patients } = await supabaseAdmin
      .from('patients')
      .select('phone')
      .eq('clinic_id', targetId)

    if (!patients || patients.length === 0) {
      const { data: qP } = await supabaseAdmin
        .from('queue_entries')
        .select('phone')
        .eq('business_id', targetId)
      if (qP) patients = qP
    }

    const uniquePhones = [...new Set((patients || []).map(p => p.phone).filter(Boolean))]

    if (uniquePhones.length === 0) {
      return NextResponse.json({ success: false, error: 'No patients with phone numbers found' }, { status: 400 })
    }

    // 3. Send Broadcast asynchronously
    after(async () => {
      console.log(`[Broadcast] Sending to ${uniquePhones.length} patients for clinic ${clinic.name}`)
      for (const phone of uniquePhones) {
        try {
          if (message) {
            await sendTemplateMessage(phone, message)
          }
        } catch (e) {
          console.error(`[Broadcast Error] Phone ${phone}:`, e)
        }
      }
    })

    return NextResponse.json({ success: true, count: uniquePhones.length })

  } catch (err) {
    console.error('[Broadcast API Error]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
