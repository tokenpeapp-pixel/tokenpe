// GET /api/cron/expire-subscriptions
// Safety-net cron: finds clinics whose billing period has ended but are still marked active/cancel_at_period_end.
// Runs daily at 01:00 UTC. Idempotent — safe to run multiple times.
import { createClient } from "@supabase/supabase-js"
import { sendCancellationEmail } from "../../../../lib/messaging"

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // UTC comparison — current_period_end is stored as ISO/UTC
    const nowUtc = new Date().toISOString()

    const { data: expiredClinics, error: fetchErr } = await supabaseAdmin
      .from("clinics")
      .select("id, name, email")
      .in("subscription_status", ["cancel_at_period_end", "active", "past_due"])
      .not("current_period_end", "is", null)
      .lt("current_period_end", nowUtc)

    if (fetchErr) {
      console.error("[Cron: expire-subscriptions] Query error:", fetchErr)
      throw fetchErr
    }

    console.log(`[Cron: expire-subscriptions] Found ${expiredClinics?.length ?? 0} expired clinic(s)`)

    const processed = []

    for (const clinic of expiredClinics ?? []) {
      // Idempotency: .neq ensures we only update rows not already canceled
      const { error: updateErr } = await supabaseAdmin
        .from("clinics")
        .update({
          plan_id: "canceled",
          subscription_status: "canceled",
        })
        .eq("id", clinic.id)
        .neq("subscription_status", "canceled")

      if (updateErr) {
        console.error(`[Cron: expire-subscriptions] Failed to update clinic ${clinic.id}:`, updateErr)
        continue
      }

      console.log(`[Cron: expire-subscriptions] ✅ Expired clinic ${clinic.id} (${clinic.email || "no email"})`)
      processed.push({ id: clinic.id, email: clinic.email })

      // Send the same cancellation email as the webhook does
      if (clinic.email) {
        await sendCancellationEmail(clinic.email, clinic.name || "Clinic")
      }
    }

    return Response.json({ success: true, processedCount: processed.length, processed })
  } catch (error) {
    console.error("[Cron: expire-subscriptions] Error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
