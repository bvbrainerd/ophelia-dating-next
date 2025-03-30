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
    newUser: '/onboarding'
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }: AuthContext) {
      const isLoggedIn = !!auth?.user;
      const isProtected = 
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/matching') ||
        nextUrl.pathname.startsWith('/profile');

      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return true; // If logged in, can access any non-protected page
      }
      return true; // Allow unauthenticated users to access non-protected pages
    }
  }
}; 