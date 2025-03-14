import React, { useState } from 'react';
import { supabase } from '@/supabase/client';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';

interface GroupPhotoUploadProps {
  groupId: string;
  currentPhotoUrl: string | null;
  isAdmin: boolean;
  onPhotoUpdate: (newUrl: string | null) => void;
}

const DEFAULT_GROUP_PHOTO = '/images/opheliatitle.png';

export default function GroupPhotoUpload({ 
  groupId, 
  currentPhotoUrl, 
  isAdmin,
  onPhotoUpdate 
}: GroupPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${groupId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('group-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('group-photos')
        .getPublicUrl(fileName);

      // Update group record
      const { error: updateError } = await supabase
        .from('groups')
        .update({ group_photo_url: publicUrl })
        .eq('id', groupId);

      if (updateError) throw updateError;

      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldFileName = currentPhotoUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('group-photos')
            .remove([`${groupId}/${oldFileName}`]);
        }
      }

      onPhotoUpdate(publicUrl);
    } catch (error) {
      console.error('Error uploading group photo:', error);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);
      setError(null);

      // Update group record
      const { error: updateError } = await supabase
        .from('groups')
        .update({ group_photo_url: null })
        .eq('id', groupId);

      if (updateError) throw updateError;

      // Delete photo from storage
      if (currentPhotoUrl) {
        const fileName = currentPhotoUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('group-photos')
            .remove([`${groupId}/${fileName}`]);
        }
      }

      onPhotoUpdate(null);
    } catch (error) {
      console.error('Error removing group photo:', error);
      setError('Failed to remove photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full border-2 border-[#aa0000] overflow-hidden">
          <Image
            src={currentPhotoUrl || DEFAULT_GROUP_PHOTO}
            alt="Group photo"
            fill
            className="object-cover"
            sizes="128px"
          />
          {isAdmin && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/20" />
              <label className="relative cursor-pointer p-3 rounded-full bg-white/80 hover:bg-white transition-colors z-10 shadow-md">
                <Camera className="w-6 h-6 text-[#aa0000]" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          )}
        </div>
        {isAdmin && currentPhotoUrl && (
          <button
            onClick={handleRemovePhoto}
            disabled={isUploading}
            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white hover:bg-gray-100 transition-colors z-10 shadow-md border border-[#aa0000]"
          >
            <X className="w-4 h-4 text-[#aa0000]" />
          </button>
        )}
      </div>
      {isUploading && (
        <div className="text-sm text-[#aa0000] bg-white/90 px-3 py-1 rounded-full shadow-sm">
          Uploading...
        </div>
      )}
      {error && (
        <div className="text-sm text-white bg-red-500 px-3 py-1 rounded-full shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
} 