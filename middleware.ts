// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if exists
  const { data: { session } } = await supabase.auth.getSession();

  // Allow access to auth-related pages
  if (req.nextUrl.pathname.startsWith('/auth')) {
    return res;
  }

  // Protect other routes
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|images|auth).*)',
  ],
};