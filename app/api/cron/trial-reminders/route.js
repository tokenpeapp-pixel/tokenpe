import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { sendText, cleanPhone } from '../../../../lib/messaging'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')


// Helper: send Email via Resend
async function sendEmail(to, subject, html) {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Must use this for unverified Resend free tier
      to,
      subject,
      html
    })
  } catch (e) {
    console.error('Email failed for', to, e.message)
  }
}

export async function GET(req) {
  // Protect the cron endpoint with a secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const remindersSent = []

    // ── 1. TRIAL EXPIRY REMINDERS ────────────────────────────────────────────
    // Fetch all clinics still on free trial
    const { data: trialingClinics } = await supabase
      .from('clinics')
      .select('*')
      .eq('subscription_status', 'trialing')

    for (const clinic of (trialingClinics || [])) {
      if (!clinic.trial_ends_at) continue
      const trialEnd = new Date(clinic.trial_ends_at)
      const daysLeft = (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      // Only fire once — when exactly 3 days remain
      if (daysLeft >= 2.5 && daysLeft <= 3.5) {
        const dateStr = trialEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

        // ── Smart Plan Recommendation based on trial usage ──────────────────
        // Count total patients served during the 14-day trial
        const trialStart = new Date(trialEnd.getTime() - 14 * 24 * 60 * 60 * 1000)
        const { count: totalPatients } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', clinic.id)
          .gte('joined_at', trialStart.toISOString())

        const avgPerDay = Math.round((totalPatients || 0) / 14)

        let recommendedPlan, recommendedPrice, recommendedEmoji, marketingLine
        if (avgPerDay >= 100) {
          recommendedPlan = 'Elite'
          recommendedPrice = '₹1999'
          recommendedEmoji = '🏆'
          marketingLine = `You're serving <strong>${avgPerDay}+ patients/day</strong> — that's elite-level demand! The <strong>Elite Plan</strong> gives you unlimited patients, multi-clinic management, CRM broadcasts, and a dedicated WhatsApp support line. Built for high-volume clinics like yours.`
        } else if (avgPerDay >= 50) {
          recommendedPlan = 'Pro'
          recommendedPrice = '₹999'
          recommendedEmoji = '⭐'
          marketingLine = `You're averaging <strong>${avgPerDay} patients/day</strong> — perfect for the <strong>Pro Plan</strong>! Get up to 150 patients/day, AI voice alerts in 10 languages, smart wait-time predictions, and a 30-day analytics heatmap. Upgrade and take your clinic to the next level.`
        } else {
          recommendedPlan = 'Starter'
          recommendedPrice = '₹499'
          recommendedEmoji = '🚀'
          marketingLine = `You're averaging <strong>${avgPerDay} patients/day</strong> — the <strong>Starter Plan</strong> is the perfect fit! Get all core WhatsApp queue features for just ₹499/mo. As you grow, you can upgrade anytime with a single click.`
        }

        // ✅ CORRECT: No auto-charge. Personalized plan recommendation included.
        const emailHtml = `
          <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
            <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:36px;margin-bottom:24px;" />
            <h2 style="color:#a78bfa;font-size:22px;margin-bottom:8px;">Your Free Trial Ends in 3 Days! ⏳</h2>
            <p style="color:#94a3b8;">Hi <strong style="color:#fff">${clinic.name}</strong>,</p>
            <p>Your <strong>TokenPe Elite Free Trial</strong> ends on <strong>${dateStr}</strong>. After that, your account will be paused — <strong>no automatic charge</strong> will be made.</p>
            
            <div style="background:#1e1b4b;border:1px solid #7c3aed;border-radius:12px;padding:20px;margin:24px 0;">
              <p style="font-size:13px;color:#a78bfa;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${recommendedEmoji} Our Recommendation For You</p>
              <h3 style="font-size:24px;color:#fff;margin-bottom:8px;">${recommendedPlan} Plan — ${recommendedPrice}/mo</h3>
              <p style="color:#cbd5e1;font-size:14px;">${marketingLine}</p>
            </div>

            <a href="https://tokenpe.online/dashboard/billing" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Activate ${recommendedPlan} Plan →
            </a>
            <p style="margin-top:24px;font-size:12px;color:#475569;">You can also compare all plans at <a href="https://tokenpe.online/dashboard/billing" style="color:#7c3aed">tokenpe.online/dashboard/billing</a>. Questions? Email support@tokenpe.online</p>
          </div>
        `
        await sendEmail(
          clinic.email,
          `${recommendedEmoji} Your TokenPe Trial ends in 3 days — We recommend ${recommendedPlan} for you!`,
          emailHtml
        )

        // WhatsApp — plain text, no template needed
        if (clinic.phone) {
          const waMsg = `⏳ *TokenPe Trial Ending in 3 Days!*

Hi *${clinic.name}*,

Your TokenPe Elite Free Trial ends on *${dateStr}*.

🚫 *No automatic charge* — your account will simply be paused.

${recommendedEmoji} Based on your *${avgPerDay} avg patients/day*, we recommend:

*${recommendedPlan} Plan — ${recommendedPrice}/mo*

👉 Choose your plan now:
https://tokenpe.online/dashboard/billing

_Powered by TokenPe_`
          await sendText(cleanPhone(clinic.phone), waMsg)
        }

        remindersSent.push({ clinic: clinic.name, type: 'trial_expiry', recommended: recommendedPlan, avgPerDay })
      }
    }

    // ── 2. PAID PLAN RENEWAL REMINDERS ──────────────────────────────────────
    // Fetch all clinics with an active paid subscription that renews in ~3 days
    const { data: activeClinics } = await supabase
      .from('clinics')
      .select('*')
      .eq('subscription_status', 'active')
      .not('current_period_end', 'is', null)

    for (const clinic of (activeClinics || [])) {
      const renewalDate = new Date(clinic.current_period_end)
      const daysToRenewal = (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      // Only fire once — when exactly 3 days before renewal
      if (daysToRenewal >= 2.5 && daysToRenewal <= 3.5) {
        const planName = clinic.plan_id === 'elite' ? 'Elite' : clinic.plan_id === 'pro' ? 'Pro' : 'Starter'
        const planPrice = clinic.plan_id === 'elite' ? '₹1999' : clinic.plan_id === 'pro' ? '₹999' : '₹499'
        const dateStr = renewalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

        // ✅ CORRECT: This IS an auto-renewal notification for paying subscribers
        const emailHtml = `
          <p>Hi <strong>${clinic.name}</strong>,</p>
          <p>Your <strong>TokenPe ${planName} Plan</strong> will automatically renew in <strong>3 days</strong> on <strong>${dateStr}</strong>.</p>
          <p>💳 <strong>Amount: ${planPrice}/month</strong> — This will be charged to your saved payment method via Razorpay.</p>
          <p>If you do NOT want to continue, you can cancel before the renewal date from your billing dashboard.</p>
          <p><a href="https://tokenpe.online/dashboard/billing" style="background:#7C3AED;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;">Manage Subscription →</a></p>
          <br><p style="color:#94a3b8;font-size:12px;">If you have questions, contact support@tokenpe.online</p>
        `
        await sendEmail(
          clinic.email,
          `Your TokenPe ${planName} Plan renews in 3 days (${planPrice})`,
          emailHtml
        )

        // WhatsApp — plain text, no template needed
        if (clinic.phone) {
          const waMsg = `🔔 *TokenPe ${planName} Plan Renewing in 3 Days*

Hi *${clinic.name}*,

Your *TokenPe ${planName} Plan (${planPrice}/mo)* will automatically renew on *${dateStr}*.

💳 The amount will be charged to your saved payment method via Razorpay.

Want to cancel before the renewal?
👉 https://tokenpe.online/dashboard/billing

_Powered by TokenPe_`
          await sendText(cleanPhone(clinic.phone), waMsg)
        }

        remindersSent.push({ clinic: clinic.name, type: 'plan_renewal', plan: planName })
      }
    }

    return NextResponse.json({ success: true, processed: remindersSent.length, details: remindersSent })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
