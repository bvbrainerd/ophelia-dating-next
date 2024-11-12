'use client';

import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type User = {
  id: string;
  email?: string;
} | null;

export default function Dashboard() {
  const router = useRouter();
  // Remove user state since we're not using it in this component
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking user:', error);
        router.push('/auth/login');
      }
    };

    checkUser();
  }, [router]); 

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto p-5'>
      <h1 className='text-center text-[#cc0000] font-bold text-4xl mb-8'>
        Ophelia
      </h1>
      <h2 className='text-[#cc0000] text-center text-lg font-medium mb-6 mt-2.5'>
        It All Starts with the First Date...
      </h2>

      <button
        className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors'
        onClick={() => router.push('/matching')}
      >
        Start Dating
      </button>

      <button
        className='w-full p-2.5 mt-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors'
        onClick={() => router.push('/daterequests')}
      >
        Date Requests
      </button>

      <button
        className='w-full p-2.5 mt-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors'
        onClick={() => router.push('/dates/upcoming')}
      >
        Upcoming Dates
      </button>

      <button
        className='w-full p-2.5 mt-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors'
        onClick={() => router.push('/dashboard/editprofile')}
      >
        Edit Profile
      </button>

      <button
        className='w-full p-2.5 mt-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}