'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

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
  { value: 'hopelessRomantic', label: 'Hopeless Romantic' },
  { value: 'cautiousDater', label: 'Cautious Dater' },
  { value: 'adventurous', label: 'Commitment Seeker' },
  { value: 'traditional', label: 'Serial Dater' },
  { value: 'independent', label: 'Friends with Benefits' },
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
  });
  const [imageKey, setImageKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Add this function to get a signed URL for an existing file
  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
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
        // If there's an avatar_url, get a signed URL
        let signedAvatarUrl = data.avatar_url;
        if (signedAvatarUrl && !signedAvatarUrl.includes('default-avatar')) {
          const fileName = signedAvatarUrl.split('/').pop();
          signedAvatarUrl = await getSignedUrl(fileName);
        }

        setProfileData({
          ...data,
          avatar_url: signedAvatarUrl || '/images/default-avatar.png'
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

      // Get signed URL immediately after upload
      const { data: signedData, error: signedError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(fileName, 60 * 60); // 1 hour expiry

      if (signedError) throw signedError;

      return signedData.signedUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to:`, value);
    
    setProfileData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : null) : value,
    }));
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      let newAvatarUrl = profileData.avatar_url;
      console.log('Starting avatar URL:', newAvatarUrl);

      if (avatarFile) {
        newAvatarUrl = await uploadImage(user.id);
        console.log('After upload, new avatar URL:', newAvatarUrl);
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
        avatar_url: newAvatarUrl,
        profile_completed: true
      };

      console.log('Saving with updates:', updates);

      const { data, error: updateError } = await supabase
        .from('profiles')
        .upsert([updates])
        .select();

      if (updateError) throw updateError;

      setProfileData(prev => ({
        ...prev,
        avatar_url: newAvatarUrl
      }));
      
      setImageKey(prev => prev + 1);
      setImageError(false);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setAvatarFile(null);

      console.log('Final profile data:', data);

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

  return (
    <>
      <div className="max-w-2xl mx-auto p-5 pt-12 pb-24">
        {/* Ophelia Header */}
        <div className="flex items-center mb-10 relative">
          <div className="absolute left-0 right-0 text-center">
            <Link href="/dashboard">
              <h1 className="text-4xl font-bold text-[#cc0000] cursor-pointer hover:opacity-80 transition-opacity">
                Ophelia
              </h1>
            </Link>
          </div>
        </div>

        <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
          Edit Your Profile
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Profile Picture Upload */}
          <div className="flex items-center justify-center w-full mb-6">
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
              {(previewUrl || profileData.avatar_url) && !imageError ? (
                <div className="relative w-full h-full">
                  <Image
                    key={imageKey}
                    src={previewUrl || (profileData.avatar_url || '/images/default-avatar.png')}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('Image load error for:', profileData.avatar_url);
                      setImageError(true);
                      setProfileData(prev => ({
                        ...prev,
                        avatar_url: '/images/default-avatar.png'
                      }));
                    }}
                    unoptimized
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
                    Click to upload
                  </p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          <input
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
            type="text"
            name="first_name"
            placeholder="First Name"
            value={profileData.first_name}
            onChange={handleChange}
            required
          />

          <input
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={profileData.last_name}
            onChange={handleChange}
            required
          />

          <input
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
            type="number"
            name="age"
            placeholder="Your Age"
            value={profileData.age || ''}
            onChange={handleChange}
            min="18"
            max="100"
          />

          <select
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
            name="gender"
            value={profileData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <select
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
            name="preferred_gender"
            value={profileData.preferred_gender}
            onChange={handleChange}
            required
          >
            <option value="">I'm interested in dating...</option>
            <option value="male">Men</option>
            <option value="female">Women</option>
            <option value="both">Both</option>
          </select>

          <textarea
            className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#cc0000] transition-colors min-h-[100px]"
            name="bio"
            placeholder="Tell us about yourself..."
            value={profileData.bio}
            onChange={handleChange}
          />

          <select
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
            name="dater_archetype"
            value={profileData.dater_archetype}
            onChange={handleChange}
          >
            <option value="">Select Dater Archetype</option>
            {ARCHETYPES.map((archetype) => (
              <option key={archetype.value} value={archetype.value}>
                {archetype.label}
              </option>
            ))}
          </select>

          <select
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
            name="school"
            value={profileData.school}
            onChange={handleChange}
          >
            <option value="">Select School</option>
            {SCHOOLS.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>

          <div className="space-y-3 pt-4">
            <button
              type="submit"
              className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
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
      <BottomNav />
    </>
  );
}