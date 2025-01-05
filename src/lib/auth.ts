import { supabase } from '@/supabase/client';

// Remove any password reset functionality from Supabase client
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    window.location.href = '/auth/login';
  }
}); 