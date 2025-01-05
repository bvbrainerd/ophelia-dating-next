import { supabase } from '@/supabase/client';

// Remove any password reset functionality from Supabase client
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    window.location.href = '/auth/login';
  }
}); 

export const checkAndRefreshSession = async (supabase: any) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (!session) {
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError) throw refreshError;
      return refreshedSession;
    }
    
    return session;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}; 