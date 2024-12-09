import { createClient as createClientComponent } from '@supabase/supabase-js';

export const supabase = createClientComponent(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'supabase.auth.token',
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') {
            return null
          }
          return window.localStorage.getItem(key)
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') {
            return
          }
          window.localStorage.setItem(key, value)
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') {
            return
          }
          window.localStorage.removeItem(key)
        },
      },
    },
  }
);

export const createClient = () => {
  return createClientComponent(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
