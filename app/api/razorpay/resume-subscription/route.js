import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '../../../../lib/auth'
import { Resend } from 'resend'
import { sendText, cleanPhone } from '../../../../lib/messaging'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function POST(req) {
  try {
    const { clinicId } = await req.json()

    if (!clinicId) {
      return Response.json({ error: 'Missing clinicId' }, { status: 400 })
    }

    const session = await getSession()
    if (!session || session.clinicId !== clinicId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get the clinic's full details
    const { data: clinic, error: cErr } = await supabaseAdmin
      .from('clinics')
      .select('razorpay_subscription_id, plan_id, name, email, phone, current_period_end')
      .eq('id', clinicId)
      .single()

    if (cErr || !clinic) {
      return Response.json({ error: 'Clinic not found' }, { status: 404 })
    }

    const clinicName = clinic.name || 'Unknown Clinic'
    const planLabel = clinic.plan_id === 'elite' ? 'Elite' : clinic.plan_id === 'pro' ? 'Pro' : 'Starter'
    const planPrice = clinic.plan_id === 'elite' ? '₹1,999' : clinic.plan_id === 'pro' ? '₹999' : '₹499'
    const periodEndDate = clinic.current_period_end
      ? new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    if (!clinic.razorpay_subscription_id) {
      // Manual plan fallback
      await supabaseAdmin.from('clinics').update({
        subscription_status: 'active'
      }).eq('id', clinicId)
      return Response.json({ success: true, message: 'Account reactivated' })
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy',
    })

    // Cancel scheduled changes (reverts the cancel_at_cycle_end status)
    try {
      await razorpay.subscriptions.cancelScheduledChanges(clinic.razorpay_subscription_id)
    } catch (rzpErr) {
      console.warn('[Razorpay] Cancel-scheduled-changes failed:', rzpErr)
      // Might fail if it's already fully cancelled, but let's continue to update our DB anyway if they try to resume
    }

    // Mark as active in our database
    let updateQuery = supabaseAdmin
      .from('clinics')
      .update({ subscription_status: 'active' })
      
    if (clinic.email) {
      updateQuery = updateQuery.eq('email', clinic.email)
    } else {
      updateQuery = updateQuery.eq('id', clinicId)
    }

    const { error: updateErr } = await updateQuery

    if (updateErr) throw updateErr

    // ── 1. Confirmation email to the DOCTOR ──────────────────────────────
    if (clinic.email) {
      try {
        await resend.emails.send({
          from: 'TokenPe Support <support@tokenpe.online>',
          to: clinic.email,
          subject: `Auto-Renewal Reactivated: TokenPe ${planLabel} Plan`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
              <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:32px;margin-bottom:24px;" />
              <h2 style="color:#10b981;font-size:20px;margin-bottom:8px;">Auto-Renewal Reactivated ✅</h2>
              <p style="color:#94a3b8;">Hi <strong style="color:#fff">${clinicName}</strong>,</p>
              <p>Great news! Auto-renewal has been successfully reactivated for your <strong>TokenPe ${planLabel} Plan (${planPrice}/mo)</strong>.</p>
              
              <div style="background:#064e3b;border:1px solid #10b981;border-radius:12px;padding:20px;margin:24px 0;">
                <p style="font-size:15px;color:#fff;font-weight:700;margin:0;">Seamless Service Continues</p>
                <p style="font-size:13px;color:#a7f3d0;margin-top:8px;">Your access to premium features will continue without any interruptions.</p>
                ${periodEndDate ? `<p style="font-size:13px;color:#a7f3d0;margin-top:4px;">Next billing date: <strong>${periodEndDate}</strong></p>` : ''}
              </div>
              
              <a href="https://tokenpe.online/dashboard/billing" style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-top:8px;">
                View Billing Dashboard →
              </a>
              <p style="margin-top:24px;font-size:12px;color:#475569;">Questions? Reply to this email or contact <a href="mailto:tokenpe.online@gmail.com" style="color:#10b981;">tokenpe.online@gmail.com</a></p>
            </div>
          `
        })
      } catch (mailErr) {
        console.warn('[Resume] Doctor email failed:', mailErr.message)
      }
    }

    // ── 2. WhatsApp confirmation to the DOCTOR ───────────────────────────
    if (clinic.phone) {
      try {
        const waMsg = `✅ *Auto-Renewal Reactivated*

Hi *${clinicName}*,

Auto-renewal is now *ON* for your TokenPe *${planLabel} Plan*.
Your access to all premium features will continue without any interruptions.

View your billing details here:
👉 https://tokenpe.online/dashboard/billing

_Powered by TokenPe_`
        await sendText(cleanPhone(clinic.phone), waMsg)
      } catch (waErr) {
        console.warn('[Resume] Doctor WhatsApp failed:', waErr.message)
      }
    }

    // ── 3. Founder alert ─────────────────────────────────────────────────
    try {
      await resend.emails.send({
        from: 'TokenPe Support <support@tokenpe.online>',
        to: 'tokenpe.online@gmail.com',
        subject: `✅ Auto-Renewal Resumed: ${clinicName}`,
        html: `
          <h2>Subscription Reactivated</h2>
          <p><strong>Clinic:</strong> ${clinicName}</p>
          <p><strong>Plan:</strong> ${planLabel} ${planPrice}/mo</p>
          <p><strong>Next Billing Date:</strong> ${periodEndDate || 'N/A'}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        `
      })
    } catch (mailErr) {
      console.warn('[Resume] Founder email failed:', mailErr.message)
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error('[Razorpay Resume] Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
