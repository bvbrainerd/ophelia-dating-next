import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../supabase/client';

interface ProfileImageProps {
  user: {
    avatar_url: string | null;
    first_name?: string;
  };
  className?: string;
  priority?: boolean;
}

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) return '/images/default-avatar.png';
  
  try {
    // If it's already a public URL or default image, return it directly
    if (avatarPath.startsWith('http') || avatarPath.startsWith('/images/')) {
      return avatarPath;
    }

    // Extract just the filename from the path
    const filename = avatarPath
      .split('/')                                // Split by /
      .filter(part => part !== 'avatars')        // Remove all 'avatars' parts
      .join('/')                                 // Join remaining parts
      .split('?')[0];                            // Remove query parameters

    console.log('Processing filename:', filename);

    // Get a public URL that doesn't expire
    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filename);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Could not generate public URL');
    }

    console.log('Generated public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return '/images/default-avatar.png';
  }
};

export default function ProfileImage({ user, className = '', priority = true }: ProfileImageProps) {
  const [error, setError] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string>('/images/default-avatar.png');
  const DEFAULT_AVATAR = '/images/default-avatar.png';

  useEffect(() => {
    const processUrl = async () => {
      if (!user.avatar_url || user.avatar_url.includes('default-avatar')) {
        setProcessedUrl(DEFAULT_AVATAR);
        return;
      }

      try {
        const url = await getAvatarUrl(user.avatar_url);
        console.log('Processing avatar for user:', user.first_name);
        console.log('Original URL:', user.avatar_url);
        console.log('Generated URL:', url);
        setProcessedUrl(url);
      } catch (e) {
        console.error('Error processing avatar URL:', e);
        setProcessedUrl(DEFAULT_AVATAR);
      }
    };

    if (!error) {
      processUrl();
    }
  }, [user.avatar_url, error]);

  const handleImageError = () => {
    console.error('Image failed to load:', {
      originalUrl: user.avatar_url,
      processedUrl,
      userName: user.first_name
    });
    setError(true);
    setProcessedUrl(DEFAULT_AVATAR);
  };

  return (
    <div className={`relative ${className}`}>
      <Image
        src={processedUrl}
        alt={`${user.first_name || 'User'}'s profile picture`}
        onError={handleImageError}
        fill
        className="object-cover rounded-lg"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={priority}
        unoptimized={true}
        crossOrigin="anonymous"
      />
    </div>
  );
} 