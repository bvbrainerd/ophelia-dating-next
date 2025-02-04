import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { supabase } from '../supabase/client';

interface ProfileImage {
  id: number;
  image_url: string;
  is_main: boolean;
}

interface ProfileImageGalleryProps {
  images: ProfileImage[];
  onSetMain?: (imageId: number) => Promise<void>;
  onDelete?: (imageId: number) => Promise<void>;
  className?: string;
  mode?: 'edit' | 'view';
}

const DEFAULT_AVATAR = '/images/default-avatar.png';

const getAvatarUrl = async (path: string): Promise<string> => {
  try {
    if (!path) return DEFAULT_AVATAR;
    
    // If it's the default avatar, return it as is
    if (path.includes('default-avatar')) {
      return path;
    }

    // If it's already a full URL with storage/v1/object/public, return it
    if (path.includes('storage/v1/object/public')) {
      return path;
    }

    // If it's already a full URL with storage/v1/object/sign, extract the file path
    if (path.includes('storage/v1/object/sign')) {
      const matches = path.match(/avatars\/(.*?)(?:\?|$)/);
      if (matches && matches[1]) {
        path = matches[1];
      }
    }

    // Clean the path by removing any prefixes and query parameters
    const cleanPath = path
      .replace(/^\/+/, '')  // Remove leading slashes
      .replace(/^avatars\/avatars\//, 'avatars/') // Fix double avatars prefix
      .replace(/^avatars\//, '') // Remove single avatars prefix
      .split('?')[0];  // Remove query parameters
    
    console.log('Attempting to get URL for path:', cleanPath);
    
    // Use getPublicUrl instead of signed URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(cleanPath);

    if (!data?.publicUrl) {
      console.error('Error getting public URL');
      return DEFAULT_AVATAR;
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Error in getAvatarUrl:', error);
    return DEFAULT_AVATAR;
  }
};

export default function ProfileImageGallery({ 
  images, 
  onSetMain, 
  onDelete, 
  className = '',
  mode = 'edit'
}: ProfileImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedUrls, setProcessedUrls] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const processUrls = async () => {
      try {
        console.log('Processing images:', images);
        
        if (!images || images.length === 0) {
          console.log('No images found, using default avatar');
          setProcessedUrls({ 0: DEFAULT_AVATAR });
          return;
        }

        const urlMap: { [key: number]: string } = {};
        for (const image of images) {
          if (!image?.image_url) {
            urlMap[image.id] = DEFAULT_AVATAR;
            continue;
          }
          
          console.log('Processing image:', image.id, image.image_url);
          const processedUrl = await getAvatarUrl(image.image_url);
          urlMap[image.id] = processedUrl;
        }
        
        console.log('Processed URLs:', urlMap);
        setProcessedUrls(urlMap);
      } catch (error) {
        console.error('Error processing URLs:', error);
        setProcessedUrls({});
      }
    };
    
    processUrls();
  }, [images]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (mode === 'view') {
    const currentImage = images[currentIndex];
    return (
      <div className={`relative aspect-square w-full ${className}`}>
        <Image
          src={currentImage ? processedUrls[currentImage.id] || DEFAULT_AVATAR : DEFAULT_AVATAR}
          alt="Profile image"
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          unoptimized={true}
          crossOrigin="anonymous"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.error('Error loading gallery image:', {
              originalSrc: target.src,
              imageId: currentImage?.id,
              imageUrl: currentImage?.image_url,
              processedUrl: processedUrls[currentImage?.id]
            });
            target.src = DEFAULT_AVATAR;
          }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </>
        )}
        {currentImage?.is_main && (
          <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1">
            <Star className="w-4 h-4 text-[#BA2525] fill-[#BA2525]" />
          </div>
        )}
      </div>
    );
  }

  // Edit mode with circular thumbnails
  return (
    <div className={`flex flex-wrap gap-4 justify-center ${className}`}>
      {images.map((image) => (
        <div key={image.id} className="relative w-20 h-20">
          <Image
            src={processedUrls[image.id] || DEFAULT_AVATAR}
            alt="Profile image"
            fill
            className="object-cover rounded-full"
            sizes="80px"
            unoptimized={true}
            crossOrigin="anonymous"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error('Error loading thumbnail:', {
                originalSrc: target.src,
                imageId: image.id,
                imageUrl: image.image_url,
                processedUrl: processedUrls[image.id]
              });
              target.src = DEFAULT_AVATAR;
            }}
          />
          {image.is_main && (
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
              <Star className="w-3 h-3 text-[#BA2525] fill-[#BA2525]" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-full flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
            {!image.is_main && onSetMain && (
              <button
                onClick={() => onSetMain(image.id)}
                className="bg-white rounded-full p-1 hover:bg-gray-100"
                title="Set as main"
              >
                <Star className="w-4 h-4 text-[#BA2525]" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(image.id)}
                className="bg-white rounded-full p-1 hover:bg-gray-100"
                title="Delete image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 text-red-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 