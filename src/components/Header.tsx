'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase/client';

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

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        console.log('Raw profile data from header:', profileData);
        
        // Handle avatar URL
        const avatarUrl = profileData.avatar_url;
        
        if (!avatarUrl) {
          console.log('No avatar URL found, using default');
          setCurrentUser({
            ...profileData,
            avatar_url: DEFAULT_AVATAR
          });
          return;
        }

        if (avatarUrl.startsWith('/images/')) {
          console.log('Using static image path:', avatarUrl);
          setCurrentUser({
            ...profileData,
            avatar_url: avatarUrl
          });
          return;
        }

        // Check if the file exists
        try {
          const { data: existsData, error: existsError } = await supabase.storage
            .from('avatars')
            .list('', {
              limit: 1,
              search: avatarUrl.split('/').pop()?.split('?')[0]
            });

          if (existsError || !existsData?.length) {
            console.log('Avatar file not found:', avatarUrl);
            setCurrentUser({
              ...profileData,
              avatar_url: DEFAULT_AVATAR
            });
            return;
          }

          // Get a fresh signed URL
          const { data, error } = await supabase.storage
            .from('avatars')
            .createSignedUrl(existsData[0].name, 365 * 24 * 60 * 60); // 1 year expiry

          if (error || !data?.signedUrl) {
            throw error || new Error('Failed to generate signed URL');
          }

          console.log('Generated signed URL in header:', data.signedUrl);
          
          setCurrentUser({
            ...profileData,
            avatar_url: data.signedUrl
          });
        } catch (error) {
          console.error('Error processing avatar URL:', error);
          setCurrentUser({
            ...profileData,
            avatar_url: DEFAULT_AVATAR
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }, []);

  useEffect(() => {
    if (variant === 'logo-only') return; // Don't fetch user data for logo-only variant
    
    fetchUser();
  }, [variant, fetchUser]);

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
                  unoptimized={true}
                  crossOrigin="anonymous"
                  className="object-cover rounded-full"
                  onError={(e) => {
                    console.error('Error loading image in header:', currentUser.avatar_url);
                    setAvatarError(true);
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_AVATAR;
                  }}
                />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}