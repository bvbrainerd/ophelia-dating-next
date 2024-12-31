'use client';

import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';

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

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) return '/images/default-avatar.png';
  
  // If it's already a full URL or a local image path, return it directly
  if (avatarPath.startsWith('http') || avatarPath.startsWith('/images/')) {
    return avatarPath;
  }

  try {
    // Clean up the path - remove any storage URLs and get just the filename
    const fileName = avatarPath.split('/').pop() || '';
    
    if (!fileName) return '/images/default-avatar.png';

    const { data } = await supabase
      .storage
      .from('avatars')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return '/images/default-avatar.png';
  }
};

const ProfileImage = ({ user, className, width, height, style, alt }: { user: Profile, className?: string, width?: number, height?: number, style?: React.CSSProperties, alt?: string }) => {
  const [imageUrl, setImageUrl] = useState<string>('/images/default-avatar.png');

  useEffect(() => {
    const loadImage = async () => {
      try {
        if (!user.avatar_url) {
          setImageUrl('/images/default-avatar.png');
          return;
        }

        // If it's a signed URL, get a fresh public URL
        if (user.avatar_url.includes('?token=')) {
          const filename = user.avatar_url.split('avatars/')[1]?.split('?')[0];
          if (filename) {
            const { data } = supabase
              .storage
              .from('avatars')
              .getPublicUrl(filename);
            
            if (data?.publicUrl) {
              setImageUrl(data.publicUrl);
              return;
            }
          }
        }

        // If it's already a public URL, use it directly
        setImageUrl(user.avatar_url);

      } catch (error) {
        console.error('Error loading image for user:', user.id, error);
        setImageUrl('/images/default-avatar.png');
      }
    };

    loadImage();
  }, [user.avatar_url, user.id]);

  return (
    <div 
      className={`relative h-[250px] w-full ${className}`}
      style={style}
    >
      <Image
        src={imageUrl}
        alt={alt || `Profile picture of ${user.first_name}`}
        fill
        priority={true}
        sizes="(max-width: 640px) 100vw, 
               (max-width: 1024px) 50vw,
               33vw"
        className="object-cover rounded-lg"
        unoptimized={imageUrl.startsWith('http')}
      />
    </div>
  );
};

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth/login');
        return;
      }

      const { data: currentUserData, error: currentUserError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (currentUserError) throw currentUserError;

      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', session.user.id)
        .eq('school', currentUserData.school);

      if (currentUserData.preferred_gender && currentUserData.preferred_gender !== 'both') {
        query = query.eq('gender', currentUserData.preferred_gender);
      }

      const { data: matchingUsers, error: matchError } = await query;

      if (matchError) throw matchError;

      if (matchingUsers) {
        // Debug log to see what URLs we're getting
        console.log('Matching users with their avatar URLs:', 
          matchingUsers.map(user => ({
            id: user.id,
            name: user.first_name,
            avatar_url: user.avatar_url
          }))
        );
        
        setUsers(matchingUsers);
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
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto p-5 pb-24">
          <Header variant="matching" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className='border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white max-w-md mx-auto w-full'
              >
                <div className="aspect-[4/3] w-full mb-4">
                  <ProfileImage 
                    user={user}
                    className="w-full h-full"
                  />
                </div>
                
                <h3 className='text-xl font-bold text-[#BA2525] mb-1'>
                  {user.first_name}, {user.age}
                </h3>
                <p className='text-gray-600 text-sm mb-4 line-clamp-3'>
                  {user.bio}
                </p>
                
                <div className="space-y-2">
                  <button
                    className='w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors'
                    onClick={() => handleSendDateRequest(user.id)}
                  >
                    Send Date Request
                  </button>
                  <button
                    className='w-full p-2.5 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
                    onClick={() => router.push(`/profile/${user.id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    </>
  );
}