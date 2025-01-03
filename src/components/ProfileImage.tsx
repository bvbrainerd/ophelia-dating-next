import { useState } from 'react';

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
    
    try {
      // Extract the file path from any URL format
      const matches = url.match(/\/avatars\/avatars\/([^?]+)/);
      if (!matches || !matches[1]) {
        // Try alternate URL format
        const altMatches = url.match(/\/avatars\/([^?]+)/);
        if (!altMatches || !altMatches[1]) return DEFAULT_AVATAR;
        return `https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/avatars/${altMatches[1]}`;
      }

      // Always use the public URL format
      const fileName = matches[1];
      return `https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/avatars/avatars/${fileName}`;
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