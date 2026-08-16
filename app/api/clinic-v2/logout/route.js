import { clearClinicSession } from '../../../../lib/clinic-auth'

export async function POST(req) {
    try {
        await clearClinicSession()
        return Response.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('[Clinic V2 Logout Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
