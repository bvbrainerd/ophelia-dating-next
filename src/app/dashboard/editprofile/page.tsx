'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../../supabase/client';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import Header from '@/components/Header';
import EmailUpdateSection from '@/components/EmailUpdateSection';
import ImageCropper from '@/components/ImageCropper';
import ProfileImageGallery from '@/components/ProfileImageGallery';

const DEFAULT_AVATAR = '/images/default-avatar.png';

// Types
interface ProfileImage {
  id: number;
  image_url: string;
  is_main: boolean;
}

// Update ProfileData interface
interface ProfileData {
  id?: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  preferred_gender: string;
  bio: string;
  dater_archetype: string;
  school: string;
  avatar_url: string | null;
  email: string;
  profile_images?: ProfileImage[];
}

// Constants
const SCHOOLS = [
  'Boston College',
  'Harvard',
  'MIT',
  'Northeastern',
  'BU',
  'N/A',
] as const;

const ARCHETYPES = [
  { value: 'Hopeless Romantic', label: 'Hopeless Romantic' },
  { value: 'Cautious Dater', label: 'Cautious Dater' },
  { value: 'Commitment Seeker', label: 'Commitment Seeker' },
  { value: 'Serial Dater', label: 'Serial Dater' },
  { value: 'Friends with Benefits', label: 'Friends with Benefits' },
] as const;

export default function EditProfilePage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    age: null,
    gender: '',
    preferred_gender: '',
    bio: '',
    dater_archetype: '',
    school: '',
    avatar_url: null,
    email: '',
  });
  const [imageKey, setImageKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profileImages, setProfileImages] = useState<ProfileImage[]>([]);

  // Update fetchProfile to get profile images
  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      console.log('Raw profile data from edit profile:', profileData);

      // Fetch profile images
      const { data: imagesData, error: imagesError } = await supabase
        .from('profile_images')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      console.log('Raw images data:', imagesData);

      // Process image URLs
      const processedImages = await Promise.all(imagesData.map(async (img) => {
        if (!img.image_url || img.image_url.startsWith('/images/')) {
          return { ...img, image_url: img.image_url || DEFAULT_AVATAR };
        }

        try {
          // First, check if the file exists
          const { data: existsData, error: existsError } = await supabase.storage
            .from('avatars')
            .list('', {
              limit: 1,
              search: img.image_url.split('/').pop()?.split('?')[0]
            });

          if (existsError || !existsData?.length) {
            console.log('Image file not found:', img.image_url);
            return { ...img, image_url: DEFAULT_AVATAR };
          }

          // Get a fresh signed URL
          const { data, error } = await supabase.storage
            .from('avatars')
            .createSignedUrl(existsData[0].name, 365 * 24 * 60 * 60); // 1 year expiry

          if (error || !data?.signedUrl) {
            throw error || new Error('Failed to generate signed URL');
          }

          console.log('Generated signed URL for gallery image:', data.signedUrl);
          return { ...img, image_url: data.signedUrl };
        } catch (error) {
          console.error('Error processing image URL:', error);
          return { ...img, image_url: DEFAULT_AVATAR };
        }
      }));

      // Handle avatar URL
      let avatarUrl = profileData.avatar_url;
      console.log('Initial avatar URL:', avatarUrl);

      if (!avatarUrl || avatarUrl.startsWith('/images/')) {
        console.log('Using default or static avatar path:', avatarUrl || DEFAULT_AVATAR);
        avatarUrl = avatarUrl || DEFAULT_AVATAR;
      } else {
        try {
          // Check if the file exists
          const { data: existsData, error: existsError } = await supabase.storage
            .from('avatars')
            .list('', {
              limit: 1,
              search: avatarUrl.split('/').pop()?.split('?')[0]
            });

          if (existsError || !existsData?.length) {
            console.log('Avatar file not found:', avatarUrl);
            avatarUrl = DEFAULT_AVATAR;
          } else {
            // Get a fresh signed URL
            const { data, error } = await supabase.storage
              .from('avatars')
              .createSignedUrl(existsData[0].name, 365 * 24 * 60 * 60); // 1 year expiry

            if (error || !data?.signedUrl) {
              throw error || new Error('Failed to generate signed URL');
            }

            console.log('Generated signed URL for avatar:', data.signedUrl);
            avatarUrl = data.signedUrl;
          }
        } catch (error) {
          console.error('Error processing avatar URL:', error);
          avatarUrl = DEFAULT_AVATAR;
        }
      }

      console.log('Final profile data:', {
        ...profileData,
        avatar_url: avatarUrl
      });

      setProfileData({
        ...profileData,
        avatar_url: avatarUrl
      });
      setProfileImages(processedImages);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch profile');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Show the image cropper instead of uploading directly
    setSelectedFile(file);
    setShowCropper(true);
  };

  const extractFilenameFromUrl = (url: string) => {
    // Extract filename from signed URL
    const match = url.match(/\/avatars\/([^?]+)/);
    return match ? match[1] : null;
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Convert blob to File
      const croppedFile = new File([croppedBlob], selectedFile?.name || 'profile.jpg', {
        type: 'image/jpeg'
      });

      const fileExt = 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      console.log('Starting image upload process');
      console.log('Generated filename:', fileName);

      // Upload image to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get the signed URL for the uploaded file
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(fileName, 365 * 24 * 60 * 60); // 1 year expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Error getting signed URL:', signedUrlError);
        throw new Error('Failed to generate signed URL');
      }

      console.log('Generated signed URL:', signedUrlData.signedUrl);

      // Store the signed URL in the database
      const { data: imageData, error: imageError } = await supabase
        .from('profile_images')
        .insert([{
          profile_id: user.id,
          image_url: signedUrlData.signedUrl,
          is_main: profileImages.length === 0
        }])
        .select()
        .single();

      if (imageError) {
        console.error('Error creating profile image entry:', imageError);
        throw imageError;
      }

      // Only update the profile's avatar_url if this is the first image
      if (profileImages.length === 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: signedUrlData.signedUrl
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
      }

      // Add the new image to state with the signed URL
      const newImage = {
        ...imageData,
        image_url: signedUrlData.signedUrl
      };

      setProfileImages(prev => [...prev, newImage]);

      // Reset states
      setShowCropper(false);
      setSelectedFile(null);
      setError(null);

      // Refresh the profile to ensure everything is in sync
      await fetchProfile();
    } catch (error) {
      console.error('Error in handleCropComplete:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Find the image we want to set as main
      const targetImage = profileImages.find(img => img.id === imageId);
      if (!targetImage) throw new Error('Image not found');

      // Get the public URL for the image
      let publicUrl = targetImage.image_url;
      if (!publicUrl.startsWith('http')) {
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(publicUrl.replace(/^avatars\//, ''));
        
        if (!data?.publicUrl) {
          throw new Error('Failed to generate public URL');
        }
        publicUrl = data.publicUrl;
      }

      // Update all images to not be main
      await supabase
        .from('profile_images')
        .update({ is_main: false })
        .eq('profile_id', user.id);

      // Set the selected image as main
      const { error } = await supabase
        .from('profile_images')
        .update({ is_main: true })
        .eq('id', imageId);

      if (error) throw error;

      // Update avatar_url in profiles table with the public URL
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      // Refresh profile to get updated URLs
      await fetchProfile();
    } catch (error) {
      console.error('Error setting main image:', error);
      setError('Failed to set main image');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const image = profileImages.find(img => img.id === imageId);
      if (!image) return;

      // Delete from storage if it's not the default avatar
      if (!image.image_url.includes('default-avatar')) {
        let storagePath = image.image_url;
        if (storagePath.startsWith('http')) {
          // Extract the path from the URL
          const urlParts = storagePath.split('/avatars/');
          if (urlParts.length > 1) {
            storagePath = `avatars/${urlParts[1].split('?')[0]}`;
          }
        }

        await supabase.storage
          .from('avatars')
          .remove([storagePath]);
      }

      // Delete from profile_images table
      const { error } = await supabase
        .from('profile_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // If we deleted the main image, update the avatar_url to null or the next available image
      if (image.is_main) {
        const remainingImages = profileImages.filter(img => img.id !== imageId);
        const newMainImage = remainingImages[0];
        
        await supabase
          .from('profiles')
          .update({ 
            avatar_url: newMainImage ? newMainImage.image_url : null 
          })
          .eq('id', user.id);
      }

      // Refresh the profile to get updated state
      await fetchProfile();
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '0',
          upsert: true
        });

      if (uploadError) throw uploadError;

      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleChange = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Clean up avatar_url - remove any duplicate avatars/ prefix
      let cleanAvatarUrl = profileData.avatar_url;
      if (cleanAvatarUrl && !cleanAvatarUrl.startsWith('/images/')) {
        if (cleanAvatarUrl.startsWith('http')) {
          // Extract filename from URL
          const match = cleanAvatarUrl.match(/\/avatars\/([^?]+)/);
          if (match) {
            cleanAvatarUrl = match[1];
          }
        } else {
          cleanAvatarUrl = cleanAvatarUrl.replace(/^avatars\//, '');
        }
      }

      // Explicitly specify the fields we want to update
      const updates = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        age: profileData.age,
        gender: profileData.gender,
        preferred_gender: profileData.preferred_gender,
        bio: profileData.bio,
        dater_archetype: profileData.dater_archetype,
        school: profileData.school,
        avatar_url: cleanAvatarUrl,
        profile_completed: true
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh profile to get updated state with correct URLs
      await fetchProfile();
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const refreshImage = async () => {
      if (profileData.avatar_url && !profileData.avatar_url.startsWith('/images/')) {
        try {
          // If it's already a full URL, keep using it
          if (profileData.avatar_url.startsWith('http')) {
            return;
          }

          // Clean up the path - remove any duplicate avatars/ prefix
          const cleanPath = profileData.avatar_url.replace(/^avatars\//, '');

          // Get the public URL that doesn't expire
          const { data } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(cleanPath);

          if (data?.publicUrl) {
            setProfileData(prev => ({
              ...prev,
              avatar_url: data.publicUrl
            }));
          } else {
            setImageError(true);
            setProfileData(prev => ({
              ...prev,
              avatar_url: DEFAULT_AVATAR
            }));
          }
        } catch (error) {
          console.error('Error refreshing image:', error);
          setImageError(true);
          setProfileData(prev => ({
            ...prev,
            avatar_url: DEFAULT_AVATAR
          }));
        }
      }
    };

    refreshImage();
  }, [profileData.avatar_url]);

  const handleResetPassword = () => {
    try {
      setIsLoading(true);
      // Just redirect to reset password page
      window.location.replace('/auth/reset-password');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to initiate password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-5 pb-24">
        <Header variant="matching" />
        
        <div className="max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center gap-4 mb-6">
              {/* Main Profile Image */}
              <div className="relative w-32 h-32">
                <Image
                  src={profileData.avatar_url || DEFAULT_AVATAR}
                  alt="Profile"
                  fill
                  className="rounded-full object-cover"
                  unoptimized={true}
                  priority={true}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('Error loading profile image:', profileData.avatar_url);
                    setImageError(true);
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_AVATAR;
                  }}
                />
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </label>
              </div>

              {/* Profile Image Gallery */}
              <div className="w-full max-w-sm mt-4">
                <ProfileImageGallery
                  images={profileImages}
                  onSetMain={handleSetMainImage}
                  onDelete={handleDeleteImage}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={profileData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={profileData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                required
              />
            </div>

            {/* Age Field */}
            <input
              type="number"
              placeholder="Age"
              value={profileData.age || ''}
              onChange={(e) => handleChange('age', e.target.value ? parseInt(e.target.value) : 0)}
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
              required
              min="18"
              max="100"
            />

            {/* Gender Fields */}
            <select
              value={profileData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <select
              value={profileData.preferred_gender}
              onChange={(e) => handleChange('preferred_gender', e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
              required
            >
              <option value="">Preferred Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="both">Both</option>
            </select>

            {/* Bio Field */}
            <textarea
              placeholder="Bio"
              value={profileData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#cc0000] transition-colors min-h-[100px]"
              required
            />

            {/* Dater Archetype */}
            <select
              value={profileData.dater_archetype}
              onChange={(e) => handleChange('dater_archetype', e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
              required
            >
              <option value="">Select Dater Archetype</option>
              {ARCHETYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {/* School Selection */}
            <select
              value={profileData.school}
              onChange={(e) => handleChange('school', e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
              required
            >
              <option value="">Select School</option>
              {SCHOOLS.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>

            <EmailUpdateSection 
              onEmailChange={(email) => handleChange('email', email)} 
            />

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                type="submit"
                className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </button>

              <button
                onClick={handleResetPassword}
                type="button"
                className="w-full p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Reset Password
              </button>
              
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full p-2.5 bg-white text-[#cc0000] border border-[#cc0000] rounded-full font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <BottomNav />
      
      {showCropper && selectedFile && (
        <ImageCropper
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </div>
  );
}