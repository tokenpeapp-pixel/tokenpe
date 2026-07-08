import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '../../../../lib/auth'
import { Resend } from 'resend'
import { sendText, cleanPhone } from '../../../../lib/messaging'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function POST(req) {
  try {
    const { clinicId, reason } = await req.json()

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
    const reasonLabel = reason || 'Not provided'
    const periodEndDate = clinic.current_period_end
      ? new Date(clinic.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    if (!clinic.razorpay_subscription_id) {
      // No real subscription ID — lock account directly (test/manual plan)
      await supabaseAdmin.from('clinics').update({
        plan_id: 'canceled',
        subscription_status: 'canceled',
        current_period_end: null
      }).eq('id', clinicId)
      return Response.json({ success: true, message: 'Account locked' })
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy',
    })

    // Cancel at end of current billing cycle (not immediately)
    try {
      await razorpay.subscriptions.cancel(clinic.razorpay_subscription_id, true)
    } catch (rzpErr) {
      console.warn('[Razorpay] Cancel-at-cycle-end failed:', rzpErr)
    }

    // Mark as pending cancellation — keep plan + access until period end
    let updateQuery = supabaseAdmin
      .from('clinics')
      .update({ subscription_status: 'cancel_at_period_end' })
      
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
          from: 'TokenPe <support@tokenpe.online>',
          to: clinic.email,
          subject: `Your TokenPe ${planLabel} subscription has been cancelled`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
              <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:32px;margin-bottom:24px;" />
              <h2 style="color:#f87171;font-size:20px;margin-bottom:8px;">Cancellation Confirmed</h2>
              <p style="color:#94a3b8;">Hi <strong style="color:#fff">${clinicName}</strong>,</p>
              <p>Your <strong>TokenPe ${planLabel} Plan (${planPrice}/mo)</strong> has been cancelled as requested.</p>
              ${periodEndDate ? `
              <div style="background:#1e1b4b;border:1px solid #7c3aed;border-radius:12px;padding:20px;margin:24px 0;">
                <p style="font-size:13px;color:#a78bfa;font-weight:700;margin-bottom:4px;">✅ You still have full access</p>
                <p style="font-size:15px;color:#fff;font-weight:700;margin:0;">Until: ${periodEndDate}</p>
                <p style="font-size:13px;color:#94a3b8;margin-top:8px;">No further charges will be made after this date.</p>
              </div>` : ''}
              <p style="color:#cbd5e1;">Changed your mind? You can reactivate anytime before your access ends.</p>
              <a href="https://tokenpe.online/dashboard/billing" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-top:8px;">
                Reactivate Plan →
              </a>
              <p style="margin-top:24px;font-size:12px;color:#475569;">Questions? Reply to this email or contact support@tokenpe.online</p>
            </div>
          `
        })
      } catch (mailErr) {
        console.warn('[Cancel] Doctor email failed:', mailErr.message)
      }
    }

    // ── 2. WhatsApp confirmation to the DOCTOR ───────────────────────────
    if (clinic.phone) {
      try {
        const waMsg = `✅ *TokenPe Cancellation Confirmed*

Hi *${clinicName}*,

Your *${planLabel} Plan (${planPrice}/mo)* has been cancelled.
${periodEndDate ? `\n🗓️ You have *full access until ${periodEndDate}*.\n\n🚫 No further charges will be made.` : ''}

Changed your mind? Reactivate anytime:
👉 https://tokenpe.online/dashboard/billing

_Powered by TokenPe_`
        await sendText(cleanPhone(clinic.phone), waMsg)
      } catch (waErr) {
        console.warn('[Cancel] Doctor WhatsApp failed:', waErr.message)
      }
    }

    // ── 3. Founder alert ─────────────────────────────────────────────────
    try {
      await resend.emails.send({
        from: 'TokenPe <support@tokenpe.online>',
        to: 'tokenpe.online@gmail.com',
        subject: `⚠️ Subscription Canceled: ${clinicName}`,
        html: `
          <h2>Subscription Cancelled</h2>
          <p><strong>Clinic:</strong> ${clinicName}</p>
          <p><strong>Plan:</strong> ${planLabel} ${planPrice}/mo</p>
          <p><strong>Access until:</strong> ${periodEndDate || 'N/A'}</p>
          <p><strong>Reason given:</strong> ${reasonLabel}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        `
      })
    } catch (mailErr) {
      console.warn('[Cancel] Founder email failed:', mailErr.message)
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error('[Razorpay Cancel] Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
