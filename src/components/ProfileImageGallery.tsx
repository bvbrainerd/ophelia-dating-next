import Image from 'next/image';
import { useState } from 'react';
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

export default function ProfileImageGallery({ 
  images, 
  onSetMain, 
  onDelete, 
  className = '',
  mode = 'edit'
}: ProfileImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getImageUrl = async (image: ProfileImage) => {
    if (!image.image_url) return '/images/default-avatar.png';
    if (image.image_url.startsWith('/images/')) {
      return image.image_url;
    }

    try {
      // Extract filename from URL
      let filename = image.image_url;
      if (filename.includes('?token=')) {
        filename = filename.split('?')[0].split('/avatars/').pop() || '';
      } else if (filename.includes('/avatars/')) {
        filename = filename.split('/avatars/').pop() || '';
      }

      console.log('Processing gallery image filename:', filename);

      // Get a fresh signed URL
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filename, 365 * 24 * 60 * 60); // 1 year expiry

      if (error || !data?.signedUrl) {
        throw error || new Error('Failed to generate signed URL');
      }

      console.log('Generated signed URL for gallery:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error generating image URL:', error);
      return '/images/default-avatar.png';
    }
  };

  if (mode === 'view') {
    return (
      <div className={`relative aspect-square w-full ${className}`}>
        <Image
          src={images[currentIndex]?.image_url || '/images/default-avatar.png'}
          alt="Profile image"
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          unoptimized={true}
          crossOrigin="anonymous"
          onError={(e) => {
            console.error('Error loading gallery image:', images[currentIndex]?.image_url);
            const target = e.target as HTMLImageElement;
            target.src = '/images/default-avatar.png';
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
        {images[currentIndex]?.is_main && (
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
            src={image.image_url || '/images/default-avatar.png'}
            alt="Profile image"
            fill
            className="object-cover rounded-full"
            sizes="80px"
            unoptimized={true}
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Error loading thumbnail:', image.image_url);
              const target = e.target as HTMLImageElement;
              target.src = '/images/default-avatar.png';
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