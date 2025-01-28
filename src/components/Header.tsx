'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { cn } from '../utils/cn';

const DEFAULT_AVATAR = '/images/default-avatar.png';

interface Profile {
  first_name: string;
  avatar_url: string | null;
}

interface HeaderProps {
  variant?: 'default' | 'matching' | 'logo-only' | 'dashboard';
}

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) return DEFAULT_AVATAR;
  
  try {
    // If it's already a public URL or default image, return it directly
    if (avatarPath.startsWith('http') || avatarPath.startsWith('/images/')) {
      return avatarPath;
    }

    // Clean up the path - remove any duplicate avatars/ prefix and query parameters
    const filename = avatarPath
      .split('/')
      .filter(part => part !== 'avatars')
      .join('/')
      .split('?')[0];

    // Get public URL using just the filename
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    if (!data?.publicUrl) {
      throw new Error('Could not generate public URL');
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return DEFAULT_AVATAR;
  }
};

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
        
        // Get the avatar URL
        const avatarUrl = await getAvatarUrl(profileData.avatar_url);
        
        setCurrentUser({
          ...profileData,
          avatar_url: avatarUrl
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (variant === 'logo-only') return; // Don't fetch user data for logo-only variant
    
    fetchUser();
  }, [variant, fetchUser]);

  return (
    <div className={cn(
      "flex justify-between items-center py-4 px-5",
      variant === "dashboard" ? "bg-transparent" : "bg-transparent"
    )}>
      <div className="flex-1" />
      
      <div className="flex-1 flex justify-center">
        <Link href="/dashboard">
          <h1 className="text-3xl font-bold text-[#BA2525] cursor-pointer hover:opacity-80 transition-opacity">
            Ophelia
          </h1>
        </Link>
      </div>

      <div className="flex-1 flex justify-end">
        {currentUser && variant !== 'logo-only' && (
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-[#BA2525]">
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
    </div>
  );
}