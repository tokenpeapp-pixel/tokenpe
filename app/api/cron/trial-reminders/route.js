import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { sendText, cleanPhone } from '../../../../lib/messaging'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')


// Helper: send Email via Resend
async function sendEmail(to, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'TokenPe <support@tokenpe.online>',
      to,
      subject,
      html
    })
    if (error) {
      console.error('Resend API error for', to, error)
    }
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
    const { data: trialingClinics } = await supabase
      .from('clinics')
      .select('*')
      .eq('subscription_status', 'trialing')

    const trialPromises = (trialingClinics || []).map(async (clinic) => {
      if (!clinic.trial_ends_at) return
      const trialEnd = new Date(clinic.trial_ends_at)
      const daysLeft = (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      if (daysLeft >= 2.5 && daysLeft <= 3.5) {
        const dateStr = trialEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
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
          marketingLine = `You're serving <strong>${avgPerDay}+ patients/day</strong> — that's elite-level demand! The <strong>Elite Plan</strong> gives you unlimited patients, multi-clinic management, CRM broadcasts, and a dedicated WhatsApp support line.`
        } else if (avgPerDay >= 50) {
          recommendedPlan = 'Pro'
          recommendedPrice = '₹999'
          recommendedEmoji = '⭐'
          marketingLine = `You're averaging <strong>${avgPerDay} patients/day</strong> — perfect for the <strong>Pro Plan</strong>! Get up to 150 patients/day, AI voice alerts in 10 languages, smart wait-time predictions, and a 30-day analytics heatmap.`
        } else {
          recommendedPlan = 'Starter'
          recommendedPrice = '₹499'
          recommendedEmoji = '🚀'
          marketingLine = `You're averaging <strong>${avgPerDay} patients/day</strong> — the <strong>Starter Plan</strong> is the perfect fit! Get all core WhatsApp queue features for just ₹499/mo. As you grow, you can upgrade anytime.`
        }

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
            <p style="margin-top:24px;font-size:12px;color:#475569;">Questions? Email support@tokenpe.online</p>
          </div>
        `
        await sendEmail(clinic.email, `${recommendedEmoji} Your TokenPe Trial ends in 3 days — We recommend ${recommendedPlan} for you!`, emailHtml)
        remindersSent.push({ clinic: clinic.name, type: 'trial_expiry', recommended: recommendedPlan, avgPerDay })
      }
      else if (daysLeft >= -0.5 && daysLeft <= 0.5) {
        const emailHtml = `
          <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
            <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:36px;margin-bottom:24px;" />
            <h2 style="color:#ef4444;font-size:22px;margin-bottom:8px;">Your Free Trial Ends TODAY! ⏳</h2>
            <p style="color:#94a3b8;">Hi <strong style="color:#fff">${clinic.name}</strong>,</p>
            <p>Your <strong>TokenPe Elite Free Trial</strong> officially ends <strong>today</strong>.</p>
            <p>To avoid any interruption to your clinic's digital queue and AI voice alerts, please select a plan now.</p>
            <div style="margin-top:24px;">
              <a href="https://tokenpe.online/dashboard/billing" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                Upgrade Plan Now →
              </a>
            </div>
          </div>
        `
        await sendEmail(clinic.email, `⏳ Action Required: Your TokenPe Trial ends TODAY!`, emailHtml)
        remindersSent.push({ clinic: clinic.name, type: 'trial_expiry_today' })
      }
    })

    await Promise.all(trialPromises)

    // ── 2. PAID PLAN RENEWAL REMINDERS ──────────────────────────────────────
    const { data: activeClinics } = await supabase
      .from('clinics')
      .select('*')
      .eq('subscription_status', 'active')
      .not('current_period_end', 'is', null)

    const renewalPromises = (activeClinics || []).map(async (clinic) => {
      const renewalDate = new Date(clinic.current_period_end)
      const daysToRenewal = (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      if (daysToRenewal >= 2.5 && daysToRenewal <= 3.5) {
        const planName = clinic.plan_id === 'elite' ? 'Elite' : clinic.plan_id === 'pro' ? 'Pro' : 'Starter'
        const planPrice = clinic.plan_id === 'elite' ? '₹1999' : clinic.plan_id === 'pro' ? '₹999' : '₹499'
        const dateStr = renewalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

        const emailHtml = `
          <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
            <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:36px;margin-bottom:24px;" />
            <h2 style="color:#a78bfa;font-size:22px;margin-bottom:8px;">Upcoming Subscription Renewal 🔄</h2>
            <p style="color:#94a3b8;">Hi <strong style="color:#fff">${clinic.name}</strong>,</p>
            <p>Your <strong>TokenPe ${planName} Plan</strong> will automatically renew in <strong>3 days</strong> on <strong>${dateStr}</strong>.</p>
            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin:24px 0;">
              <p style="margin:0;color:#cbd5e1;">Amount to be charged:</p>
              <h3 style="font-size:24px;color:#fff;margin:8px 0 0 0;">${planPrice}/month</h3>
            </div>
            <p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">This will be charged to your saved payment method via Razorpay. If you do not wish to continue, you can cancel before the renewal date.</p>
            <a href="https://tokenpe.online/dashboard/billing" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Manage Subscription →
            </a>
          </div>
        `
        await sendEmail(clinic.email, `Your TokenPe ${planName} Plan renews in 3 days (${planPrice})`, emailHtml)
        remindersSent.push({ clinic: clinic.name, type: 'plan_renewal', plan: planName })
      }
      else if (daysToRenewal >= -0.5 && daysToRenewal <= 0.5) {
        const planName = clinic.plan_id === 'elite' ? 'Elite' : clinic.plan_id === 'pro' ? 'Pro' : 'Starter'
        const planPrice = clinic.plan_id === 'elite' ? '₹1999' : clinic.plan_id === 'pro' ? '₹999' : '₹499'
        
        const emailHtml = `
          <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
            <img src="https://tokenpe.online/logo.svg" alt="TokenPe" style="height:36px;margin-bottom:24px;" />
            <h2 style="color:#34d399;font-size:22px;margin-bottom:8px;">Subscription Renewing Today 🔄</h2>
            <p style="color:#94a3b8;">Hi <strong style="color:#fff">${clinic.name}</strong>,</p>
            <p>Your <strong>TokenPe ${planName} Plan</strong> is renewing <strong>TODAY</strong>.</p>
            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin:24px 0;">
              <p style="margin:0;color:#cbd5e1;">Amount being charged:</p>
              <h3 style="font-size:24px;color:#fff;margin:8px 0 0 0;">${planPrice}/month</h3>
            </div>
            <p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">Your saved payment method via Razorpay is being charged. Thank you for choosing TokenPe.</p>
            <a href="https://tokenpe.online/dashboard/billing" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Manage Subscription →
            </a>
          </div>
        `
        await sendEmail(clinic.email, `🔄 Your TokenPe ${planName} Plan renews TODAY (${planPrice})`, emailHtml)
        remindersSent.push({ clinic: clinic.name, type: 'plan_renewal_today', plan: planName })
      }
    })

    await Promise.all(renewalPromises)

    return NextResponse.json({ success: true, processed: remindersSent.length, details: remindersSent })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
