import { cookies } from 'next/headers'

export async function POST() {
    try {
        const cookieStore = cookies()
        cookieStore.delete('tokenpe_session')
        return Response.json({ success: true }, { status: 200 })
    } catch (error) {
        return Response.json({ success: false }, { status: 500 })
    }
}
