import { NextResponse } from 'next/server';

export function middleware(request) {
    const url = request.nextUrl.pathname;

    // The Pro Way: Bypass the maintenance block if you are developing locally (npm run dev)!
    if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
    }

    // The list of new industry vertical base paths that should be blocked
    const maintenancePaths = [
        '/salon', 
        '/restaurant', 
        '/school', 
        '/business',
        '/other'
    ];

    // If the path starts with any of the blocked vertical paths (e.g. /salons, /restaurant-login)
    if (maintenancePaths.some(path => url.startsWith(path))) {
        return NextResponse.rewrite(new URL('/maintenance', request.url));
    }
    


    // Allow everything else (e.g., /, /login, /dashboard, /api, /find) to pass through to the live functionality
    return NextResponse.next();
}

// Ensure the middleware runs on all routes except statically served Next.js files and the maintenance page itself
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|maintenance|logo-nav.svg).*)',
    ],
};
