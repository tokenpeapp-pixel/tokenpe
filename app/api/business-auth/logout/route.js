import { cookies } from 'next/headers'

export async function POST() {
    try {
        const cookieStore = await cookies()
        cookieStore.delete('tokenpe_unified_session')
        cookieStore.delete('tokenpe_session')
        cookieStore.delete('tokenpe_business')
        cookieStore.delete('tokenpe_user_id')
        cookieStore.delete('clinic_session')
        return Response.json({ success: true }, { status: 200 })
    } catch (error) {
        return Response.json({ success: false }, { status: 500 })
    }
}
