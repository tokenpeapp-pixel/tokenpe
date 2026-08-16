import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// In a real production app, ensure you have JWT_SECRET in .env.local
const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-development-only-tokenpe-v2'
    return new TextEncoder().encode(secret)
}

/**
 * Hashes a plaintext PIN.
 */
export async function hashPin(pin) {
    return bcrypt.hash(pin, 10)
}

/**
 * Verifies a plaintext PIN against a stored hash.
 */
export async function verifyPin(pin, hash) {
    return bcrypt.compare(pin, hash)
}

/**
 * Creates a JWT token for the given payload and sets it as an HttpOnly cookie.
 */
export async function setClinicSession(payload) {
    // Add type to the payload to distinguish from patient/other auth
    const tokenPayload = { ...payload, type: 'clinic' }
    
    const token = await new SignJWT(tokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(getJwtSecretKey())

    const cookieStore = await cookies()
    cookieStore.set('tokenpe_clinic_v2_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days
    })
}

/**
 * Retrieves and verifies the clinic session from cookies.
 * Returns the decoded payload if valid and type === 'clinic', else null.
 */
export async function getClinicSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get('tokenpe_clinic_v2_session')?.value

    if (!token) {
        return null
    }

    try {
        const { payload } = await jwtVerify(token, getJwtSecretKey())
        if (payload.type !== 'clinic') {
            return null
        }
        return payload
    } catch (error) {
        return null
    }
}

/**
 * Clears the clinic session cookie.
 */
export async function clearClinicSession() {
    const cookieStore = await cookies()
    cookieStore.delete('tokenpe_clinic_v2_session')
}
