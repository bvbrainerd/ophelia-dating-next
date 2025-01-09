'use client'

import { useEffect } from 'react'
import { supabase } from '../supabase/client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
      } else {
          router.push('/dashboard')
        }
      }
    
    checkUser(); 
  }, [])

  // Show loading state while checking auth
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
    </main>
  )
}