import { supabaseAdmin } from './supabase';

// ── In-memory cache (resets on server restart / cold starts) ──────────────
let featureFlagCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Returns an array of active industry slugs, e.g. ['clinic'].
 * Falls back to ['clinic'] on any DB error so the site never breaks.
 */
export async function getActiveIndustries() {
  try {
    // Serve from cache if still fresh
    if (featureFlagCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      return featureFlagCache;
    }

    const { data, error } = await supabaseAdmin
      .from('feature_flags')
      .select('industry')
      .eq('active', true)
      .order('industry', { ascending: true });

    if (error) {
      console.error('[featureFlags] Supabase error:', error);
      return ['clinic'];
    }

    featureFlagCache = data?.map(d => d.industry) || ['clinic'];
    cacheTimestamp = Date.now();

    return featureFlagCache;
  } catch (err) {
    console.error('[featureFlags] Unexpected error:', err);
    return ['clinic'];
  }
}

/**
 * Returns true if the given industry slug is currently active.
 */
export async function isIndustryActive(industry) {
  const activeIndustries = await getActiveIndustries();
  return activeIndustries.includes(industry?.toLowerCase());
}

// ── Static config for each industry vertical ─────────────────────────────
export const INDUSTRY_CONFIG = {
  clinic: {
    label: 'Find Clinic',
    href: '/clinics',
    dashboardPath: '/dashboard',
    loginPath: '/clinic-auth/login',
  },
  restaurant: {
    label: 'Find Restaurant',
    href: '/restaurants',
    dashboardPath: '/restaurant-dashboard',
    loginPath: '/restaurant-login',
  },
  salon: {
    label: 'Find Salon',
    href: '/salons',
    dashboardPath: '/salon-dashboard',
    loginPath: '/salon-auth/login',
  },
  school: {
    label: 'Find School',
    href: '/schools',
    dashboardPath: '/school-dashboard',
    loginPath: '/school-auth/login',
  },
};

/**
 * Returns the INDUSTRY_CONFIG entries for all currently-active industries.
 */
export async function getActiveIndustriesConfig() {
  const activeIndustries = await getActiveIndustries();
  return activeIndustries
    .map(industry => ({ ...INDUSTRY_CONFIG[industry], industry }))
    .filter(Boolean);
}

/**
 * Manually bust the cache — useful in admin tooling or after a DB update.
 */
export function invalidateCache() {
  featureFlagCache = null;
  cacheTimestamp = null;
}
