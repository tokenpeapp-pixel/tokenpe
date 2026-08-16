import { supabaseAdmin } from '../../../../../lib/supabase'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const clinicId = searchParams.get('clinicId')
        const dateStr = searchParams.get('date') // YYYY-MM-DD

        if (!clinicId || !dateStr) {
            return Response.json({ success: false, message: 'Missing clinicId or date' }, { status: 400 })
        }

        const dateObj = new Date(dateStr)
        const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.

        // 1. Check Exceptions
        const { data: exception } = await supabaseAdmin
            .from('clinic_slot_exceptions')
            .select('is_closed')
            .eq('clinic_id', clinicId)
            .eq('exception_date', dateStr)
            .single()

        if (exception?.is_closed) {
            return Response.json({ success: true, slots: [] }, { status: 200 })
        }

        // 2. Fetch Availability for the day of week
        const { data: availabilities, error: availError } = await supabaseAdmin
            .from('clinic_availability')
            .select('start_time, end_time, slot_duration_minutes, max_patients_per_slot')
            .eq('clinic_id', clinicId)
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)

        if (availError || !availabilities || availabilities.length === 0) {
            return Response.json({ success: true, slots: [] }, { status: 200 })
        }

        // Generate all possible slots from the availabilities (there could be multiple blocks like morning/evening)
        const allSlots = []
        for (const block of availabilities) {
            const startStr = block.start_time
            const endStr = block.end_time
            const duration = block.slot_duration_minutes || 15
            const maxPatients = block.max_patients_per_slot || 1

            // Parse times to minutes from midnight
            const [startH, startM] = startStr.split(':').map(Number)
            const [endH, endM] = endStr.split(':').map(Number)
            
            let currentMins = startH * 60 + startM
            const endMins = endH * 60 + endM

            while (currentMins + duration <= endMins) {
                const h = Math.floor(currentMins / 60).toString().padStart(2, '0')
                const m = (currentMins % 60).toString().padStart(2, '0')
                allSlots.push({ time: `${h}:${m}:00`, max: maxPatients })
                currentMins += duration
            }
        }

        // 3. Fetch Booked Appointments
        const { data: bookings, error: bookError } = await supabaseAdmin
            .from('appointments')
            .select('slot_time')
            .eq('clinic_id', clinicId)
            .eq('appointment_date', dateStr)
            .in('status', ['pending_payment', 'confirmed'])

        if (bookError) {
            console.error('[Available Slots] Bookings error', bookError)
        }

        // Tally bookings
        const bookedCounts = {}
        if (bookings) {
            for (const b of bookings) {
                bookedCounts[b.slot_time] = (bookedCounts[b.slot_time] || 0) + 1
            }
        }

        // Filter out full slots
        const availableSlots = allSlots.filter(s => {
            const booked = bookedCounts[s.time] || 0
            return booked < s.max
        }).map(s => s.time)

        return Response.json({ success: true, slots: availableSlots }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Available Slots Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
