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
        // If it's already a full URL, use it directly
        if (user.avatar_url.startsWith('http')) {
          setProcessedUrl(user.avatar_url);
          return;
        }

        // Simple path handling - just get the filename
        const filename = user.avatar_url.split('/').pop()?.split('?')[0] || '';
        
        console.log('Processing avatar for user:', user.first_name);
        console.log('Original URL:', user.avatar_url);
        console.log('Filename:', filename);

        // Get public URL
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filename);

        if (!data?.publicUrl) {
          throw new Error('Could not generate URL');
        }

        console.log('Generated URL:', data.publicUrl);
        setProcessedUrl(data.publicUrl);
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
    console.error('Image failed to load:', processedUrl);
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
      />
    </div>
  );
} 