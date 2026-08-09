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
    const cookieStore = await cookies()
    const token = cookieStore.get('tokenpe_session')?.value || cookieStore.get('tokenpe_unified_session')?.value
    if (!token) return null
    const payload = await verifyToken(token)
    if (payload) {
        if (!payload.businessId && payload.clinicId) payload.businessId = payload.clinicId
        if (!payload.clinicId && payload.businessId) payload.clinicId = payload.businessId
    }
    return payload
}

export async function getUnifiedSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get('tokenpe_unified_session')?.value || cookieStore.get('tokenpe_session')?.value
    if (!token) return null
    const payload = await verifyToken(token)
    if (payload) {
        if (!payload.businessId && payload.clinicId) payload.businessId = payload.clinicId
        if (!payload.clinicId && payload.businessId) payload.clinicId = payload.businessId
    }
    return payload
}
