'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { cn } from '../utils/cn';
import { useRouter, usePathname } from 'next/navigation';
import { prompt } from '@/app/fonts';

const DEFAULT_AVATAR = '/images/default-avatar.png';

interface Profile {
  id: string;
  first_name: string;
  avatar_url: string | null;
}

interface HeaderProps {
  variant?: 'default' | 'matching' | 'logo-only' | 'dashboard' | 'challenges' | 'transparent' | 'transparent-red';
}

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) return DEFAULT_AVATAR;
  
  try {
    // If it's already a public URL or default image, return it directly
    if (avatarPath.startsWith('http') || avatarPath.startsWith('/images/')) {
      return avatarPath;
    }

    // Clean up the path - remove any duplicate avatars/ prefix
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
  const router = useRouter();
  const pathname = usePathname();
  
  const isAuthPage = pathname?.startsWith('/auth/');

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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
    if (variant === 'logo-only' || isAuthPage) return; // Don't fetch user data for logo-only variant or auth pages
    
    fetchUser();
  }, [variant, fetchUser]);

  return (
    <div className={cn(
      "flex justify-between items-center py-4 px-5",
      variant === "dashboard" ? "bg-[#cc0000]" : 
      variant === "matching" ? "bg-white" :
      variant === "challenges" ? "bg-[#cc0000]" :
      variant === "transparent" || variant === "transparent-red" ? "bg-transparent" :
      "bg-white"
    )}>
      {/* Left side - Empty for balance */}
      <div className="flex-1" />
      
      {/* Center - Logo */}
      <div className="flex-1 flex justify-center">
        <Link href="/dashboard">
          <h1 className={cn(
            `text-3xl font-bold cursor-pointer hover:opacity-80 transition-opacity ${prompt.className}`,
            variant === "dashboard" || variant === "challenges" ? "text-white" : 
            variant === "transparent" ? "text-white" :
            variant === "transparent-red" ? "text-[#cc0000]" :
            "text-[#cc0000]"
          )}>
            Ophelia
          </h1>
        </Link>
      </div>
      
      {/* Right side - Profile */}
      <div className="flex-1 flex justify-end">
        {currentUser && !isAuthPage && variant !== 'logo-only' && variant !== 'transparent' && variant !== 'transparent-red' && (
          <Link href={`/profile/${currentUser?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-md">
              <Image
                src={currentUser?.avatar_url || DEFAULT_AVATAR}
                alt={`${currentUser?.first_name}'s profile`}
                fill
                className="object-cover"
                priority
                onError={() => setAvatarError(true)}
              />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}