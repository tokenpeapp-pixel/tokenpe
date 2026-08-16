// FILE: /lib/rateLimit.js
// Database-backed rate limiter for brute-force protection
// Tracks failed attempts per key and scope using the rate_limit_attempts table

import { supabaseAdmin } from './supabase'

/**
 * Rate limiter factory
 * @param {number} maxAttempts - Max failed attempts before lockout (default: 5)
 * @param {number} windowMs - Lockout duration in ms (default: 15 minutes)
 */
export function rateLimit({ maxAttempts = 5, windowMs = 15 * 60 * 1000 } = {}) {
    return {
        /**
         * Check if a key is currently rate limited for a given scope
         * @param {string} key - The identifier (e.g., IP address, email)
         * @param {string} scope - The scope (e.g., 'otp_send', 'pin_reset', 'clinic_login')
         * @returns {Promise<{ blocked: boolean, remaining: number, retryAfterMs: number }>}
         */
        async check(key, scope) {
            const now = Date.now()
            
            const { data, error } = await supabaseAdmin
                .from('rate_limit_attempts')
                .select('*')
                .eq('key', key)
                .eq('scope', scope)
                .single()

            if (error || !data) {
                return { blocked: false, remaining: maxAttempts, retryAfterMs: 0 }
            }

            const firstAttempt = new Date(data.first_attempt_at).getTime()
            
            // If the lockout window has expired, reset
            if (now - firstAttempt > windowMs) {
                await this.reset(key, scope)
                return { blocked: false, remaining: maxAttempts, retryAfterMs: 0 }
            }

            // If they've exceeded max attempts, they're blocked
            if (data.attempt_count >= maxAttempts) {
                const retryAfterMs = windowMs - (now - firstAttempt)
                return { blocked: true, remaining: 0, retryAfterMs }
            }

            return { blocked: false, remaining: maxAttempts - data.attempt_count, retryAfterMs: 0 }
        },

        /**
         * Record a failed attempt for a key in a given scope
         * @param {string} key
         * @param {string} scope
         */
        async recordFailure(key, scope) {
            const now = Date.now()
            const nowIso = new Date(now).toISOString()

            // Fetch existing record to check if window expired
            const { data } = await supabaseAdmin
                .from('rate_limit_attempts')
                .select('*')
                .eq('key', key)
                .eq('scope', scope)
                .single()

            let attempt_count = 1
            let first_attempt_at = nowIso

            if (data) {
                const firstAttempt = new Date(data.first_attempt_at).getTime()
                // If within window, increment. Otherwise, the defaults (1, now) apply.
                if (now - firstAttempt <= windowMs) {
                    attempt_count = data.attempt_count + 1
                    first_attempt_at = data.first_attempt_at
                }
            }

            // Upsert the record
            await supabaseAdmin.from('rate_limit_attempts').upsert({
                key,
                scope,
                attempt_count,
                first_attempt_at,
                updated_at: nowIso
            }, { onConflict: 'key,scope' })
        },

        /**
         * Reset attempts for a key in a given scope (e.g., on successful login)
         * @param {string} key
         * @param {string} scope
         */
        async reset(key, scope) {
            await supabaseAdmin
                .from('rate_limit_attempts')
                .delete()
                .eq('key', key)
                .eq('scope', scope)
        }
    }
}
