// FILE: /lib/validate.js
// Input validation and sanitization for all API routes

/**
 * Sanitize a patient/clinic name — strip HTML tags, trim, limit length
 */
export function sanitizeName(name) {
    if (!name) return ''
    return String(name)
        .replace(/<[^>]*>/g, '')     // Strip HTML tags
        .replace(/[<>\"\'`;]/g, '')  // Remove dangerous characters
        .trim()
        .slice(0, 50)               // Max 50 characters
}

/**
 * Validate phone number — must be 10-13 digits only
 * Returns cleaned digits or null if invalid
 */
export function validatePhone(phone) {
    if (!phone) return null
    const cleaned = String(phone).replace(/\D/g, '')
    if (cleaned.length < 10 || cleaned.length > 13) return null
    return cleaned
}

/**
 * Validate clinic code — must be 3-10 alphanumeric characters
 * Returns uppercased code or null if invalid
 */
export function validateClinicCode(code) {
    if (!code) return null
    const cleaned = String(code).trim().toUpperCase()
    if (!/^[A-Z0-9]{3,12}$/.test(cleaned)) return null
    return cleaned
}

/**
 * Validate 4-digit PIN — must be exactly 4 digits
 * Returns the pin or null if invalid
 */
export function validatePin(pin) {
    if (!pin) return null
    const str = String(pin).trim()
    if (!/^\d{4}$/.test(str)) return null
    return str
}

/**
 * Validate rating — must be integer 1-5
 * Returns the rating number or null if invalid
 */
export function validateRating(value) {
    const num = parseInt(value)
    if (isNaN(num) || num < 1 || num > 5) return null
    return num
}
