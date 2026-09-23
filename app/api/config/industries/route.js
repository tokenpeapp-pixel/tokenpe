import { getActiveIndustries, INDUSTRY_CONFIG } from '@/lib/featureFlags';

/**
 * GET /api/config/industries
 *
 * Returns the list of currently-active industry verticals from the database.
 * The response is safe to cache for 5 minutes (matches the server-side TTL).
 *
 * Response shape:
 * {
 *   success: true,
 *   data: [{ industry, label, href, dashboardPath, loginPath }],
 *   count: number
 * }
 */
export async function GET() {
  try {
    const activeIndustries = await getActiveIndustries();

    const industriesConfig = activeIndustries
      .map(industry => ({ ...INDUSTRY_CONFIG[industry], industry }))
      .filter(Boolean);

    return Response.json(
      {
        success: true,
        data: industriesConfig,
        count: industriesConfig.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('[API /config/industries] Error:', error);
    return Response.json(
      {
        success: false,
        data: [{ ...INDUSTRY_CONFIG.clinic, industry: 'clinic' }],
        count: 1,
      },
      { status: 500 }
    );
  }
}
