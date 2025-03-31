import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

const DEFAULT_AVATAR = '/images/default-avatar.png';

interface User {
  id?: string;
  first_name?: string;
  avatar_url: string | null;
}

interface ProfileImageProps {
  user: User;
  className?: string;
  priority?: boolean;
}

const getAvatarUrl = async (avatarPath: string | null): Promise<string> => {
  if (!avatarPath) return DEFAULT_AVATAR;
  
  try {
    // If it's the default avatar or starts with a forward slash, return as is
    if (avatarPath === DEFAULT_AVATAR || avatarPath.startsWith('/')) {
      return avatarPath;
    }

    // If it's already a full URL, return it
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }

    // Clean up the path - remove any duplicate avatars/ prefix
    const cleanPath = avatarPath
      .replace(/^avatars\/avatars\//, 'avatars/')
      .replace(/^avatars\//, '')
      .split('?')[0];  // Remove query parameters

    // Get public URL using the cleaned filename
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(cleanPath);

    if (!data?.publicUrl) {
      throw new Error('Could not generate public URL');
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return DEFAULT_AVATAR;
  }
};

export default function ProfileImage({ user, className = '', priority = false }: ProfileImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_AVATAR);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!user?.avatar_url) {
        setImageUrl(DEFAULT_AVATAR);
        return;
      }

      try {
        const url = await getAvatarUrl(user.avatar_url);
        setImageUrl(url);
        setError(false);
      } catch (err) {
        console.error('Error loading profile image:', err);
        setImageUrl(DEFAULT_AVATAR);
        setError(true);
      }
    };

    loadImage();
  }, [user?.avatar_url]);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={error ? DEFAULT_AVATAR : imageUrl}
        alt={user?.first_name ? `${user.first_name}'s profile` : 'Profile'}
        fill
        className="object-cover"
        onError={() => {
          console.error('Image load error for:', imageUrl);
          setError(true);
          setImageUrl(DEFAULT_AVATAR);
        }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        unoptimized={imageUrl === DEFAULT_AVATAR}
      />
    </div>
  );
} 