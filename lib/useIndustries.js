'use client';
import { useEffect, useState } from 'react';

/**
 * Fetches the active industries from /api/config/industries.
 * Falls back to clinic-only on any network or API error.
 *
 * Returns: { industries, loading, error }
 * - industries: Array<{ industry, label, href, dashboardPath, loginPath }>
 */
export function useIndustries() {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchIndustries() {
      try {
        const response = await fetch('/api/config/industries');
        const result = await response.json();

        if (result.success) {
          setIndustries(result.data);
        } else {
          throw new Error(result.error || 'API returned failure');
        }
      } catch (err) {
        console.error('[useIndustries] Failed to fetch industries:', err);
        setError(err);
        // Clinic-only fallback so the UI never breaks
        setIndustries([
          {
            industry: 'clinic',
            label: 'Find Clinic',
            href: '/clinics',
            dashboardPath: '/dashboard',
            loginPath: '/clinic-auth/login',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchIndustries();
  }, []);

  return { industries, loading, error };
}

/**
 * Convenience hook: returns true if the given industry slug is active.
 */
export function useIndustryActive(industry) {
  const { industries } = useIndustries();
  return industries.some(ind => ind.industry === industry);
}
