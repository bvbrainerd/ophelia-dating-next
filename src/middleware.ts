import { type NextRequest } from 'next/server'
import { updateSession } from '@/supabase/utils/middleware'
export async function middleware(request: NextRequest) {
  return await updateSession(request)
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth/login|auth/signup|auth(?!/reset-password)).*)',
  ],
};