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

/**
 * Extract Interakt interactive list reply from webhook payload (multiple shapes).
 */
export function extractInteraktListReply(body) {
    const candidates = [
        body.data?.message?.interactive?.list_reply,
        body.data?.message?.list_reply,
        body.message?.interactive?.list_reply,
        body.data?.interactive?.list_reply,
        body.interactive?.list_reply,
        body.data?.message?.interactive?.button_reply,
        body.data?.message?.button_reply,
        body.message?.interactive?.button_reply,
        body.data?.interactive?.button_reply,
        body.interactive?.button_reply,
    ]
    return candidates.find(lr => lr?.id) || null
}

/**
 * Parse a CRM rating (C1–C5) from Interakt list reply or message text.
 */
export function parseCrmRating(body, textStr = '') {
    const listReply = extractInteraktListReply(body)
    const sources = [listReply?.id, listReply?.title, textStr].filter(Boolean)

    for (const source of sources) {
        const trimmed = String(source).trim()
        const fromId = trimmed.match(/^C([1-5])$/i)
        if (fromId) return parseInt(fromId[1])

        const fromLabel = trimmed.match(/^C([1-5])\s*[-–—]/i)
        if (fromLabel) return parseInt(fromLabel[1])
    }

    const crmMatch = String(textStr).trim().match(/^[cC]\s*([1-5])(?:\s+(.*))?$/is)
    if (crmMatch) return parseInt(crmMatch[1])

    return null
}

/**
 * Parse optional feedback text bundled with a CRM rating reply.
 */
export function parseCrmFeedbackText(textStr = '') {
    const match = String(textStr).trim().match(/^[cC]\s*[1-5]\s+(.*)$/is)
    return match ? match[1].trim() : ''
}

/**
 * Parse a 1–5 visit rating from Interakt list reply or message text.
 */
export function parseVisitRating(body, textStr = '') {
    const listReply = extractInteraktListReply(body)
    if (listReply?.id) {
        const fromId = validateRating(listReply.id)
        if (fromId) return fromId
    }

    const title = listReply?.title || textStr || ''
    const trimmed = String(title).trim()

    // Match exact numbers (e.g. "5")
    const exact = trimmed.match(/^[1-5]$/)
    if (exact) return parseInt(exact[0])

    // Match formats like "5 - Excellent" or "5 ⭐"
    const prefixMatch = trimmed.match(/^([1-5])\s*(?:[-–—⭐*]|star|rating)/i)
    if (prefixMatch) return parseInt(prefixMatch[1])

    // Fallback: count star emojis (e.g. "⭐⭐⭐⭐⭐")
    const starCount = (String(title).match(/⭐/g) || []).length
    if (starCount >= 1 && starCount <= 5) return starCount

    return null
}
