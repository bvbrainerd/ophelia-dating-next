'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

// const DEFAULT_AVATAR = 'https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/avatars/default-avatar.png';

interface User {
  id?: string;
  first_name?: string;
  avatar_url: string | null;
}

interface ProfileImageProps {
  user: User;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const getAvatarUrl = (avatarPath: string | null) => {
  if (!avatarPath) return '/images/default-avatar.png';
  
  try {
    // If it's already a public URL or default image, return it directly
    if (avatarPath.startsWith('http') || avatarPath.startsWith('images/') || avatarPath.startsWith('/images/')) {
      return avatarPath;
    }

    // Extract just the filename from the path
    const filename = avatarPath
      .split('/')                                // Split by /
      .filter(part => part !== 'avatars')        // Remove all 'avatars' parts
      .join('/')                                 // Join remaining parts
      .split('?')[0];                            // Remove query parameters

    // Get a public URL that doesn't expire
    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filename);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Could not generate public URL');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return '/images/default-avatar.png';
  }
};

const ProfileImage = ({ user, className = '', priority = false, sizes }: ProfileImageProps) => {
  const [error, setError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      console.log('Avatar URL:', user.avatar_url);

      const url = getAvatarUrl(user.avatar_url || null);
      setAvatarUrl(url);
    };
    fetchAvatarUrl();
  }, [user.avatar_url]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={avatarUrl || '/images/default-avatar.png'}
        alt={user?.first_name ? `${user.first_name}'s profile` : 'Profile'}
        fill
        className="object-cover"
        onError={() => {
          console.error('Image load error for:', avatarUrl || '/images/default-avatar.png');
          setError(true);
        }}
        sizes={sizes}
        priority={priority}
        unoptimized={true}
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default ProfileImage; 