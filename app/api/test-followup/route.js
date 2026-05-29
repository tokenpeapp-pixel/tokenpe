import { NextResponse } from 'next/server'
import { sendTemplateMessage } from '../../../lib/messaging'
import { getSession } from '../../../lib/auth'

// TEMPORARY TEST ENDPOINT — remove after testing
// Tests tokenpe_meds_reminder and tokenpe_recall_reminder templates
export async function POST(req) {
  try {
    // Auth check — only logged-in users
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { phone, clinicName, type } = await req.json()

    if (!phone || !clinicName || !type) {
      return NextResponse.json({ 
        success: false, 
        error: 'Required: phone, clinicName, type (meds or recall)' 
      }, { status: 400 })
    }

    let templateName
    if (type === 'meds') {
      templateName = 'tokenpe_meds_reminder'
    } else if (type === 'recall') {
      templateName = 'tokenpe_recall_reminder'
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'type must be "meds" or "recall"' 
      }, { status: 400 })
    }

    console.log(`[Test Follow-up] Sending ${templateName} to ${phone} for ${clinicName}`)

    const result = await sendTemplateMessage({
      phone,
      templateName,
      bodyValues: ['Test Patient', clinicName],
      callbackData: 'tokenpe_test_followup'
    })

    console.log(`[Test Follow-up] Result:`, JSON.stringify(result))

    return NextResponse.json({ 
      success: true, 
      template: templateName,
      result 
    })

  } catch (err) {
    console.error('[Test Follow-up] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
