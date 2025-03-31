import { User } from '@supabase/supabase-js';

interface AuthRequest {
  nextUrl: URL;
}

interface AuthContext {
  auth: { user: User } | null;
  request: AuthRequest;
}

export const authConfig = {
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/onboarding'
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }: AuthContext) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = 
        nextUrl.pathname.startsWith('/auth/login') ||
        nextUrl.pathname.startsWith('/auth/signup');
      const isProtected = 
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/matching') ||
        nextUrl.pathname.startsWith('/profile') ||
        nextUrl.pathname.startsWith('/dates') ||
        nextUrl.pathname.startsWith('/challenges');

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
        return true;
      }

      if (isProtected) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL('/auth/login', nextUrl));
      }

      return true;
    }
  }
}; 