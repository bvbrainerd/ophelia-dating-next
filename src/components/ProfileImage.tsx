import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../supabase/client';

interface ProfileImageProps {
  user: {
    avatar_url: string | null;
    first_name?: string;
  } | null;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
}

const DEFAULT_AVATAR = '/images/default-avatar.png';

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) {
    console.log('No avatar path provided');
    return DEFAULT_AVATAR;
  }

  try {
    // If it's a static image or default avatar, return it directly
    if (avatarPath.includes('default-avatar') || avatarPath.startsWith('/images/')) {
      return avatarPath;
    }

    // Get the Supabase URL from environment variable
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('Supabase URL not found in environment');
      return DEFAULT_AVATAR;
    }

    // If it's already a Supabase URL, return it as is
    if (avatarPath.includes(supabaseUrl)) {
      return avatarPath;
    }

    // If it's already a full URL but not Supabase, extract the filename
    if (avatarPath.startsWith('http')) {
      const url = new URL(avatarPath);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      // Get a fresh public URL using Supabase client
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      return data?.publicUrl || DEFAULT_AVATAR;
    }

    // For relative paths, clean up the filename and get a fresh URL
    const filename = avatarPath
      .replace(/^avatars\//, '')  // Remove leading avatars/
      .split('?')[0];             // Remove query parameters

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    return data?.publicUrl || DEFAULT_AVATAR;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return DEFAULT_AVATAR;
  }
};

export default function ProfileImage({ 
  user, 
  className = '', 
  priority = true,
  quality = 95,
  sizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
}: ProfileImageProps) {
  const [error, setError] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string>('/images/default-avatar.png');
  const [hasLoadError, setHasLoadError] = useState(false);
  const DEFAULT_AVATAR = '/images/default-avatar.png';

  useEffect(() => {
    const processUrl = async () => {
      if (!user?.avatar_url || user.avatar_url.includes('default-avatar')) {
        setProcessedUrl(DEFAULT_AVATAR);
        return;
      }

      try {
        const url = await getAvatarUrl(user.avatar_url);
        setProcessedUrl(url);
      } catch (e) {
        console.error('Error processing avatar URL:', e);
        setProcessedUrl(DEFAULT_AVATAR);
      }
    };

    if (!error) {
      processUrl();
    }
  }, [user?.avatar_url, error]);

  useEffect(() => {
    if (hasLoadError) {
      console.error('Image failed to load:', {
        originalUrl: user?.avatar_url,
        processedUrl,
        userName: user?.first_name
      });
      setError(true);
      setProcessedUrl(DEFAULT_AVATAR);
      setHasLoadError(false);
    }
  }, [hasLoadError, user, processedUrl]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={processedUrl}
        alt={`${user?.first_name || 'Profile'}'s photo`}
        fill
        priority={priority}
        className="object-cover object-center"
        sizes={sizes}
        quality={quality}
        onError={() => setHasLoadError(true)}
        unoptimized={true}
        loading={priority ? 'eager' : 'lazy'}
        crossOrigin="anonymous"
      />
    </div>
  );
} 