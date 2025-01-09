import { useState } from 'react';
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
  const DEFAULT_AVATAR = '/images/default-avatar.png';

  const getPublicUrl = (url: string | null) => {
    if (!url || url.includes('default-avatar')) return DEFAULT_AVATAR;
    
    try {
      // If it's already a full URL (not a signed URL), use it
      if (url.startsWith('http') && !url.includes('/sign/')) {
        return url;
      }

      // Just use the filename directly - no path manipulation needed
      const filename = url.split('/').pop()?.split('?')[0];
      
      console.log('Using filename for storage:', filename);

      // Get public URL using just the filename
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename || '');

      console.log('Generated public URL for profile image:', data?.publicUrl);

      return data?.publicUrl || DEFAULT_AVATAR;
    } catch (e) {
      console.error('Error parsing avatar URL:', e);
      return DEFAULT_AVATAR;
    }
  };

  const handleImageError = () => {
    console.error('Image failed to load:', user.avatar_url);
    setError(true);
  };

  const imageUrl = error ? DEFAULT_AVATAR : getPublicUrl(user.avatar_url);

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageUrl}
        alt={`${user.first_name || 'User'}'s profile picture`}
        onError={handleImageError}
        className="absolute inset-0 w-full h-full object-cover rounded-lg"
      />
    </div>
  );
} 