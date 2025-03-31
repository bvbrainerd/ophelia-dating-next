import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

const DEFAULT_AVATAR = 'https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/avatars/default-avatar.png';

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

const getAvatarUrl = (avatarPath: string | null): string => {
  if (!avatarPath) return DEFAULT_AVATAR;
  
  // If it's already a full URL, return it
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }

  // If it's the default avatar path, return the full URL
  if (avatarPath.includes('default-avatar.png')) {
    return DEFAULT_AVATAR;
  }

  // Clean up the path and construct the full URL
  const cleanPath = avatarPath.replace(/^avatars\//, '').split('?')[0];
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${cleanPath}`;
};

const ProfileImage = ({ user, className = '', priority = false, sizes }: ProfileImageProps) => {
  const [error, setError] = useState(false);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={error ? DEFAULT_AVATAR : (user.avatar_url || DEFAULT_AVATAR)}
        alt={user?.first_name ? `${user.first_name}'s profile` : 'Profile'}
        fill
        className="object-cover"
        onError={() => {
          console.error('Image load error for:', DEFAULT_AVATAR);
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