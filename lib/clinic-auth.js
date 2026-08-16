import crypto from 'crypto'
import { signToken, verifyToken } from './auth'
import { cookies } from 'next/headers'

export function hashPin(pin) {
    if (!pin) return ''
    return crypto.createHash('sha256').update(String(pin)).digest('hex')
}

export function verifyPin(pin, pinHash) {
    if (!pin || !pinHash) return false
    const hashed = hashPin(pin)
    return hashed === pinHash || String(pin) === String(pinHash)
}

export async function setClinicSession(payload) {
    const token = await signToken(payload)
    const cookieStore = await cookies()
    cookieStore.set('tokenpe_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
    })
    cookieStore.set('tokenpe_unified_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
    })
    return token
}

export async function getClinicSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get('tokenpe_session')?.value || cookieStore.get('tokenpe_unified_session')?.value
    if (!token) return null
    return await verifyToken(token)
}

export async function clearClinicSession() {
    const cookieStore = await cookies()
    cookieStore.set('tokenpe_session', '', { maxAge: 0, path: '/' })
    cookieStore.set('tokenpe_unified_session', '', { maxAge: 0, path: '/' })
}
