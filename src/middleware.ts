import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/supabase/utils/middleware'
import { createClient } from '@/supabase/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    // If no session and trying to access protected route, redirect to login
    if (!session && !request.nextUrl.pathname.startsWith('/auth/')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      return NextResponse.redirect(redirectUrl)
    }
  
    // ✅ Skip session check for the Yelp crawler API route
    if (pathname.startsWith('/api/reserve/crawlers/yelp')) {
      return NextResponse.next();
    }
  
  
    // If session exists and trying to access auth pages, redirect to dashboard
    if (session && (request.nextUrl.pathname.startsWith('/auth/') || request.nextUrl.pathname === '/')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  
    // Otherwise, run Supabase session logic
    return await updateSession(request)

  } catch (error) {
    console.error('Middleware error:', error)
    // On error, clear auth cookies and redirect to login
    const res = NextResponse.redirect(new URL('/auth/login', request.url))
    res.cookies.delete('sb-access-token')
    res.cookies.delete('sb-refresh-token')
    return res
  }
}


// Specify which routes should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - auth/login (login page)
     * - auth/signup (signup page)
     * - api/webhooks (webhook API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/webhooks).*)',
  ],
};