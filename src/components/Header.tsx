'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

const DEFAULT_AVATAR = '/images/default-avatar.png';

interface Profile {
  first_name: string;
  avatar_url: string | null;
}

interface HeaderProps {
  variant?: 'default' | 'matching' | 'logo-only';
}

export default function Header({ variant = 'default' }: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (variant === 'logo-only') return; // Don't fetch user data for logo-only variant
    
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('first_name, avatar_url')
            .eq('id', user.id)
            .single();

          if (data && data.avatar_url) {
            // Clean up the path - extract just the filename
            const cleanPath = data.avatar_url
              .split('/')
              .pop()
              ?.split('?')[0];

            if (cleanPath) {
              // Get the download URL for the avatar
              const { data: downloadData } = await supabase
                .storage
                .from('avatars')
                .createSignedUrl(`avatars/${cleanPath}`, 60 * 60); // 1 hour expiry

              setCurrentUser({
                ...data,
                avatar_url: downloadData?.signedUrl || DEFAULT_AVATAR
              });
            } else {
              setCurrentUser(data);
            }
          } else {
            setCurrentUser(data);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setCurrentUser(null);
      }
    };

    fetchUser();
  }, [variant]);

  return (
    <div className={`flex items-center mb-6 relative -mx-5 px-5 py-4 ${
      variant === 'default' ? 'bg-[#BA2525]' : 'bg-white'
    }`}>
      <div className="absolute left-0 right-0 text-center">
        <Link href="/dashboard">
          <h1 className={`text-4xl font-bold cursor-pointer hover:opacity-80 transition-opacity ${
            variant === 'default' ? 'text-white' : 'text-[#BA2525]'
          }`}>
            Ophelia
          </h1>
        </Link>
      </div>
      {currentUser && variant !== 'logo-only' && (
        <div className="ml-auto flex items-center gap-3 z-10">
          <div className={`text-sm font-medium ${
            variant === 'default' ? 'text-white' : 'text-[#BA2525]'
          }`}>
            {currentUser.first_name}
          </div>
          <Link href="/dashboard/editprofile">
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full cursor-pointer overflow-hidden">
              <div className="relative w-10 h-10">
                <Image
                  src={currentUser.avatar_url || DEFAULT_AVATAR}
                  alt={`${currentUser.first_name}'s profile`}
                  fill
                  sizes="40px"
                  priority
                  className="object-cover rounded-full"
                  onError={() => setAvatarError(true)}
                />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}