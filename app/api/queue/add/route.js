import { supabase, getISTDateString } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'
import { sanitizeName, validatePhone } from '../../../../lib/validate'

export async function POST(req) {
    try {
        const session = await getSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { clinicId, name, token, language, phone } = body

        if (!clinicId || !token) {
            return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        if (clinicId !== session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized clinic access' }, { status: 403 })
        }

        const cleanName = sanitizeName(name)
        const cleanPhone = validatePhone(phone) || '0000000000'

        const today = getISTDateString()
        
        // Item 5: Rate limit joins (3 per phone per day, unique names)
        if (cleanPhone !== '0000000000') {
            const { data: existingJoins } = await supabase
                .from('patients')
                .select('name')
                .eq('clinic_id', clinicId)
                .eq('phone', cleanPhone)
                .eq('date', today)

            if (existingJoins && existingJoins.length >= 3) {
                return Response.json({
                    success: false,
                    message: 'Daily join limit reached for this phone number.'
                }, { status: 429 })
            }

            if (cleanName && existingJoins?.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
                return Response.json({
                    success: false,
                    message: 'A patient with this name has already joined.'
                }, { status: 409 })
            }
        }

        const newPatient = {
            clinic_id: clinicId,
            name: cleanName || `Patient ${token}`,
            phone: cleanPhone,
            token: token,
            status: 'waiting',
            date: today,
            language: language || 'hi',
            joined_at: new Date().toISOString()
        }

        const { data, error } = await supabase.from('patients').insert([newPatient]).select()

        if (error) {
            console.error('[queue/add] Error inserting:', error)
            return Response.json({ success: false, message: 'Failed to add walk-in patient' }, { status: 500 })
        }

        return Response.json({ success: true, patient: data[0] }, { status: 200 })

    } catch (error) {
        console.error('[queue/add] Error:', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
