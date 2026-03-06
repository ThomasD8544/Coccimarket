import { NextRequest, NextResponse } from 'next/server';

function withSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(self), microphone=()');
  // Reduce stale UI/RSC mismatches after deployments (notably on iOS/PWA caches)
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

export function middleware(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith('/api');
  const method = req.method.toUpperCase();
  const isUnsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (isApi && isUnsafe) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    // Basic CSRF hardening: if Origin is present, it must match current host.
    if (origin && host) {
      try {
        const o = new URL(origin);
        if (o.host !== host) {
          return withSecurityHeaders(
            NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
          );
        }
      } catch {
        return withSecurityHeaders(NextResponse.json({ error: 'Invalid origin' }, { status: 403 }));
      }
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
