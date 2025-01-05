'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import Header from '@/components/Header';
import EmailUpdateSection from '@/components/EmailUpdateSection';

// Types
interface ProfileData {
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

const DEFAULT_AVATAR = '/images/default-avatar.png';

export default function EditProfilePage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
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

  // Add this function to get a signed URL for an existing file
  const getSignedUrl = async (filePath: string) => {
    if (!filePath || filePath.includes('default-avatar')) {
      return '/images/default-avatar.png';
    }

    try {
      // Extract just the filename from the full URL or path
      const matches = filePath.match(/\/avatars\/([^?]+)/);
      if (!matches || !matches[1]) {
        return '/images/default-avatar.png';
      }

      const fileName = matches[1];

      const { data, error } = await supabase
        .storage
        .from('avatars')
        .createSignedUrl(fileName, 3600);

      if (error) throw error;
      return data?.signedUrl || '/images/default-avatar.png';
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return '/images/default-avatar.png';
    }
  };

  // Wrap fetchProfile in useCallback
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        router.replace('/auth/login');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      if (data) {
        // Get signed URL for avatar if it exists
        const avatarUrl = data.avatar_url ? await getSignedUrl(data.avatar_url) : '/images/default-avatar.png';
        
        setProfileData({
          ...data,
          avatar_url: avatarUrl
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create new preview URL
    const url = URL.createObjectURL(file);
    setAvatarFile(file);
    setPreviewUrl(url);
    setImageError(false);
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

      // Just return the filename
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      let avatarFileName = profileData.avatar_url;

      if (avatarFile) {
        avatarFileName = await uploadImage(user.id);
      }

      const updates = {
        id: user.id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        age: profileData.age,
        gender: profileData.gender,
        preferred_gender: profileData.preferred_gender,
        bio: profileData.bio,
        dater_archetype: profileData.dater_archetype,
        school: profileData.school,
        avatar_url: avatarFileName,
        profile_completed: true
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert([updates]);

      if (updateError) throw updateError;

      // Get the signed URL for display
      const signedUrl = await getSignedUrl(avatarFileName || '');
      
      setProfileData(prev => ({
        ...prev,
        avatar_url: signedUrl
      }));

      setImageKey(prev => prev + 1);
      setImageError(false);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setAvatarFile(null);

      alert('Profile updated successfully!');
      router.push('/matching');

    } catch (error) {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save profile');
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
      if (profileData.avatar_url) {
        // Force browser to reload the image
        setImageKey(prev => prev + 1);
        
        // Verify the image exists
        try {
          const response = await fetch(profileData.avatar_url);
          if (!response.ok) {
            setImageError(true);
            setProfileData(prev => ({
              ...prev,
              avatar_url: '/images/default-avatar.png'
            }));
          }
        } catch (error) {
          console.error('Error verifying image:', error);
          setImageError(true);
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
            {/* Profile Image Upload */}
            <div className="flex items-center justify-center w-full mb-6">
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
                {profileData.avatar_url ? (
                  <div className="relative w-full h-full">
                    <Image
                      key={imageKey}
                      src={profileData.avatar_url}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                      sizes="128px"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <p className="mb-2 text-xs text-gray-500 text-center">
                      Add Photo
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isLoading}
                />
              </label>
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
    </div>
  );
}