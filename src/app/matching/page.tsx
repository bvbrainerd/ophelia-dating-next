'use client';

import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/supabase/client';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
  gender: 'male' | 'female' | 'other',
  preferred_gender: 'male' | 'female' | 'other';
  dater_archetype: 'hopelessRomantic' | 'cautiousDater' | 'adventurous' | 'traditional' | 'independent';
}

export default function MatchingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    const checkAuthAndFetchUsers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/auth/login');
          return;
        }
        await fetchUsers();
      } catch (error) {
        console.error('Error:', error);
      }
    };

    checkAuthAndFetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user's data
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (currentUserError) throw currentUserError;
      setCurrentUser(currentUserData);

      // Modified query to show all users that match the preferred gender
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          age,
          avatar_url,
          bio,
          gender,
          preferred_gender,
          dater_archetype
        `)
        .neq('id', user.id)
        .eq('gender', currentUserData.preferred_gender);
        // Removed the dater_archetype filter to show more matches
        
      if (error) throw error;

      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDateRequest = (userId: string) => {
    router.push(`/send-date-request/${userId}`);
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
      </div>
    );
  }

  return (
    <>
      <div className='max-w-6xl mx-auto p-5 pb-24'>
        <h2 className='text-center text-[#cc0000] font-bold text-3xl mb-6'>
          {users.length === 0 
            ? 'No Matches Available' 
            : `Your ${users.length} Matches Are Waiting...`
          }
        </h2>

        {users.length === 0 ? (
          <div className='text-center text-gray-600 py-8'>
            No matches available at the moment
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className='border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow'
              >
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={user.avatar_url || '/images/default-avatar.png'}
                    alt={`${user.first_name} ${user.last_name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />
                </div>
                
                <h3 className='text-[#cc0000] text-xl font-medium mb-1'>
                  {user.first_name} {user.last_name}, {user.age}
                </h3>
                <p className='text-gray-600 text-sm mb-4 line-clamp-3'>{user.bio}</p>
                
                <div className="space-y-2">
                  <button
                    className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors'
                    onClick={() => handleSendDateRequest(user.id)}
                  >
                    Send Date Request
                  </button>
                  <button
                    className='w-full p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
                    onClick={() => router.push(`/profile/${user.id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}