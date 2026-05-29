// FILE: /lib/rateLimit.js
// In-memory rate limiter for login brute-force protection
// Tracks failed attempts per IP address

const attempts = new Map()

// Auto-cleanup stale entries every 30 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, data] of attempts.entries()) {
        if (now - data.firstAttempt > data.windowMs * 2) {
            attempts.delete(key)
        }
    }
}, 30 * 60 * 1000)

/**
 * Rate limiter factory
 * @param {number} maxAttempts - Max failed attempts before lockout (default: 5)
 * @param {number} windowMs - Lockout duration in ms (default: 15 minutes)
 */
export function rateLimit({ maxAttempts = 5, windowMs = 15 * 60 * 1000 } = {}) {
    return {
        /**
         * Check if an IP is currently rate limited
         * @param {string} ip - The IP address to check
         * @returns {{ blocked: boolean, remaining: number, retryAfterMs: number }}
         */
        check(ip) {
            const now = Date.now()
            const record = attempts.get(ip)

            if (!record) {
                return { blocked: false, remaining: maxAttempts, retryAfterMs: 0 }
            }

            // If the lockout window has expired, reset
            if (now - record.firstAttempt > windowMs) {
                attempts.delete(ip)
                return { blocked: false, remaining: maxAttempts, retryAfterMs: 0 }
            }

            // If they've exceeded max attempts, they're blocked
            if (record.count >= maxAttempts) {
                const retryAfterMs = windowMs - (now - record.firstAttempt)
                return { blocked: true, remaining: 0, retryAfterMs }
            }

            return { blocked: false, remaining: maxAttempts - record.count, retryAfterMs: 0 }
        },

        /**
         * Record a failed attempt for an IP
         * @param {string} ip
         */
        recordFailure(ip) {
            const now = Date.now()
            const record = attempts.get(ip)

            if (!record || now - record.firstAttempt > windowMs) {
                attempts.set(ip, { count: 1, firstAttempt: now, windowMs })
            } else {
                record.count++
            }
        },

        /**
         * Reset attempts for an IP (on successful login)
         * @param {string} ip
         */
        reset(ip) {
            attempts.delete(ip)
        }
    }
}
