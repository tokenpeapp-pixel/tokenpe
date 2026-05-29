// FILE: /lib/mask.js
// Utility to mask sensitive PII in server logs

/**
 * Mask a phone number: "919876543210" → "9198****3210"
 */
export function maskPhone(phone) {
    if (!phone) return '***'
    const str = String(phone).replace(/\D/g, '')
    if (str.length <= 4) return '****'
    return str.slice(0, 4) + '****' + str.slice(-4)
}

/**
 * Mask a name: "Rahul Kumar" → "Ra***"
 */
export function maskName(name) {
    if (!name) return '***'
    const str = String(name).trim()
    if (str.length <= 2) return str + '***'
    return str.slice(0, 2) + '***'
}

/**
 * Mask a secret/token: "abc123xyz789" → "abc***"
 */
export function maskSecret(secret) {
    if (!secret) return '***'
    const str = String(secret)
    if (str.length <= 3) return '***'
    return str.slice(0, 3) + '***'
}
