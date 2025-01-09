import { useState, useEffect } from 'react';
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
        // Remove any @ prefix from the URL
        let cleanUrl = user.avatar_url.replace(/^@/, '');

        // If it's already a public URL and not a signed URL, use it
        if (cleanUrl.startsWith('http') && !cleanUrl.includes('/sign/')) {
          setProcessedUrl(cleanUrl);
          return;
        }

        // Extract just the filename from the URL
        let filename = cleanUrl;
        
        // If it's a signed URL, extract just the filename
        if (filename.includes('/sign/')) {
          // Get the part after the last avatars/ but before the query params
          const parts = filename.split('/');
          const lastAvatarsIndex = parts.lastIndexOf('avatars');
          if (lastAvatarsIndex !== -1 && lastAvatarsIndex < parts.length - 1) {
            filename = parts.slice(lastAvatarsIndex + 1).join('/').split('?')[0];
          } else {
            filename = filename.split('/').pop()?.split('?')[0] || '';
          }
        } else {
          // For relative paths, get everything after the last avatars/
          const parts = filename.split('/');
          const lastAvatarsIndex = parts.lastIndexOf('avatars');
          if (lastAvatarsIndex !== -1 && lastAvatarsIndex < parts.length - 1) {
            filename = parts.slice(lastAvatarsIndex + 1).join('/');
          } else {
            filename = parts[parts.length - 1];
          }
        }

        console.log('Raw avatar URL:', user.avatar_url);
        console.log('Cleaned URL:', cleanUrl);
        console.log('Extracted filename:', filename);

        // Get public URL using just the filename
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filename);

        if (!data?.publicUrl) {
          throw new Error('Could not generate public URL');
        }

        console.log('Generated public URL for profile image:', data.publicUrl);
        setProcessedUrl(data.publicUrl);
      } catch (e) {
        console.error('Error processing avatar URL:', e, 'for user:', user.first_name);
        setProcessedUrl(DEFAULT_AVATAR);
      }
    };

    if (!error) {
      processUrl();
    }
  }, [user.avatar_url, error]);

  const handleImageError = () => {
    console.error('Image failed to load:', processedUrl, 'for user:', user.first_name);
    setError(true);
    setProcessedUrl(DEFAULT_AVATAR);
  };

  return (
    <div className={`relative ${className}`}>
      <img
        src={processedUrl}
        alt={`${user.first_name || 'User'}'s profile picture`}
        onError={handleImageError}
        className="absolute inset-0 w-full h-full object-cover rounded-lg"
      />
    </div>
  );
} 