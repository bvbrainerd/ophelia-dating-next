// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Skip auth check for password reset routes
  if (req.nextUrl.pathname.startsWith('/auth/reset-password')) {
    return res;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect if not authenticated
  if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth folder (except reset-password)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth(?!/reset-password)).*)',
  ],
};