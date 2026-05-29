import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const getSecret = () => {
    const secret = process.env.JWT_SECRET || 'tokenpe_super_secret_fallback_2026'
    return new TextEncoder().encode(secret)
}

export async function signToken(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(getSecret())
}

export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, getSecret())
        return payload
    } catch (err) {
        return null
    }
}

export async function getSession() {
    const cookieStore = cookies()
    const token = cookieStore.get('tokenpe_session')?.value
    if (!token) return null
    return await verifyToken(token)
}
