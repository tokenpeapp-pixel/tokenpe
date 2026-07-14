import { supabaseAdmin } from '../../../../lib/supabase'
import { sendText, cleanPhone } from '../../../../lib/messaging'
import { validateRating } from '../../../../lib/validate'
import { rateLimit } from '../../../../lib/rateLimit'

const feedbackLimiter = rateLimit({ maxAttempts: 10, windowMs: 15 * 60 * 1000 })

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const limit = feedbackLimiter.check(ip)
        if (limit.blocked) {
            return Response.json({ success: false, message: 'Too many submissions. Try again later.' }, { status: 429 })
        }

        const { patientId, clinicCode, rating, feedbackText } = await req.json()

        if (!patientId || !clinicCode) {
            return Response.json({ success: false, message: 'Missing patient or clinic' }, { status: 400 })
        }

        const validRating = validateRating(rating)
        if (!validRating) {
            return Response.json({ success: false, message: 'Invalid rating' }, { status: 400 })
        }

        const code = String(clinicCode).trim().toUpperCase()
        const { data: clinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('id, name, plan_id, subscription_status, current_period_end')
            .eq('code', code)
            .single()

        if (clinicError || !clinic) {
            return Response.json({ success: false, message: 'Clinic not found' }, { status: 404 })
        }

        const subExpired = clinic.current_period_end && new Date(clinic.current_period_end) < new Date()
        if (subExpired || (clinic.plan_id !== 'pro' && clinic.plan_id !== 'elite' && clinic.subscription_status !== 'trialing')) {
            return Response.json({ success: false, message: 'Normal ratings are available for Pro and Elite/Trial plans only' }, { status: 403 })
        }

        const { data: patient, error: patientError } = await supabaseAdmin
            .from('patients')
            .select('id, clinic_id, rating, phone, name')
            .eq('id', patientId)
            .single()

        if (patientError || !patient) {
            return Response.json({ success: false, message: 'Patient not found' }, { status: 404 })
        }

        if (patient.clinic_id !== clinic.id) {
            return Response.json({ success: false, message: 'Invalid feedback link' }, { status: 403 })
        }

        if (patient.rating) {
            if (patient.phone) {
                const name = patient.name || 'Patient'
                await sendText(
                    cleanPhone(patient.phone),
                    `🙏 *Thank You, ${name}!*\n\nWe have recorded your ${patient.rating} ⭐ rating.\nWe appreciate your feedback!`
                )
            }
            return Response.json({ success: true, message: 'Already submitted', alreadyRated: true })
        }

        const { error: updateError } = await supabaseAdmin
            .from('patients')
            .update({
                rating: validRating,
                feedback_text: feedbackText?.trim() || null,
                feedback_at: new Date().toISOString()
            })
            .eq('id', patientId)

        if (updateError) {
            console.error('[feedback/submit] Update failed:', updateError.message)
            return Response.json({ success: false, message: 'Failed to save feedback' }, { status: 500 })
        }

        if (patient.phone) {
            const name = patient.name || 'Patient'
            await sendText(
                cleanPhone(patient.phone),
                `🙏 *Thank You, ${name}!*\n\nWe have recorded your ${validRating} ⭐ rating.\nWe appreciate your feedback!`
            )
        }

        // Recalculate clinic avg_rating
        try {
            const { data: ratedPatients, error: statsError } = await supabaseAdmin
                .from('patients')
                .select('rating')
                .eq('clinic_id', clinic.id)
                .gt('rating', 0)
            
            if (!statsError && ratedPatients) {
                const totalRating = ratedPatients.reduce((sum, p) => sum + p.rating, 0)
                const avgRating = ratedPatients.length > 0 ? parseFloat((totalRating / ratedPatients.length).toFixed(1)) : 0
                
                await supabaseAdmin
                    .from('clinics')
                    .update({ avg_rating: avgRating })
                    .eq('id', clinic.id)
            }
        } catch (calcError) {
            console.error('[feedback/submit] failed to update clinic avg_rating:', calcError)
        }

        return Response.json({ success: true })
    } catch (error) {
        console.error('[feedback/submit] Error:', error)
        return Response.json({ success: false, message: error.message }, { status: 500 })
    }
}
