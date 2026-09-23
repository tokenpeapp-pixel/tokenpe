import { NextResponse } from 'next/server';
import { getActiveIndustries } from '@/lib/featureFlags';

export async function middleware(request) {
    const url = request.nextUrl.pathname;

    // Bypass everything in development so local dev is never blocked
    if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
    }

    // ── Always-allowed admin paths ───────────────────────────────────────
    const alwaysAllow = ['/business-login', '/business-dashboard', '/business-auth'];
    if (alwaysAllow.some(p => url.startsWith(p))) return NextResponse.next();

    // ── Maintenance-mode paths (hard-blocked regardless of feature flags) ─
    const maintenancePaths = ['/business', '/other'];
    const isMaintenancePath = maintenancePaths.some(
        path => url === path || url.startsWith(path + '/')
    );
    if (isMaintenancePath) {
        return NextResponse.rewrite(new URL('/maintenance', request.url));
    }

    // ── Feature-flag-based industry gating ───────────────────────────────
    // Map of path prefixes → industry slug
    const industryPaths = [
        { prefixes: ['/r/', '/r?', '/restaurants', '/restaurant-login', '/restaurant-dashboard'], industry: 'restaurant' },
        { prefixes: ['/s/', '/s?', '/salons', '/salon-auth', '/salon-login', '/salon-dashboard'], industry: 'salon' },
        { prefixes: ['/schools', '/school-auth', '/school-login', '/school-dashboard'], industry: 'school' },
    ];

    // Check if the current path belongs to any gated industry
    const matchedIndustry = industryPaths.find(({ prefixes }) =>
        prefixes.some(prefix => url === prefix.replace(/[/?]$/, '') || url.startsWith(prefix))
    );

    if (matchedIndustry) {
        const activeIndustries = await getActiveIndustries();
        if (!activeIndustries.includes(matchedIndustry.industry)) {
            return NextResponse.rewrite(new URL('/not-found', request.url));
        }
    }

    // Allow everything else (/, /login, /dashboard, /api, /clinics, /find, etc.)
    return NextResponse.next();
}

// Run on all routes except static assets
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|maintenance|logo-nav.svg).*)',
    ],
};
