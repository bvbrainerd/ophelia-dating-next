import { useState } from 'react';
import { supabase } from '@/supabase/client';

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
    if (!url) return DEFAULT_AVATAR;
    if (url.startsWith('file://')) return DEFAULT_AVATAR;
    
    // If it's a signed URL, extract the file path
    const matches = url.match(/\/avatars\/avatars\/([^?]+)/);
    if (matches && matches[1]) {
      // Construct the public URL directly to avoid auth issues
      return `https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/avatars/avatars/${matches[1]}`;
    }
    
    // If it's already a public URL, use it directly
    if (url.includes('/storage/v1/object/public/')) {
      return url;
    }
    
    return DEFAULT_AVATAR;
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