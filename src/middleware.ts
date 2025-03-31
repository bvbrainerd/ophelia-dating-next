import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session and trying to access protected route, redirect to login
    if (!session && !req.nextUrl.pathname.startsWith('/auth/')) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      return NextResponse.redirect(redirectUrl)
    }

    // If session exists and trying to access auth pages, redirect to dashboard
    if (session && (req.nextUrl.pathname.startsWith('/auth/') || req.nextUrl.pathname === '/')) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }

    // Update session if it exists
    if (session) {
      res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, clear auth cookies and redirect to login
    const res = NextResponse.redirect(new URL('/auth/login', req.url))
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
     * - images (public image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images).*)',
  ],
};