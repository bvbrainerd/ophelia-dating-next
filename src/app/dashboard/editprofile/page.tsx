'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import BottomNav from '@/components/BottomNav';

// Create supabase client with session persistence
const supabase = createClientComponentClient();

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

export default function EditProfilePage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  // Wrap fetchProfile in useCallback
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First check for active session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.replace('/auth/login');
        return;
      }

      // Use session.user instead of separate getUser call
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      if (data) {
        setProfileData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          age: data.age || null,
          gender: data.gender || '',
          preferred_gender: data.preferred_gender || '',
          bio: data.bio || '',
          dater_archetype: data.dater_archetype || '',
          school: data.school || '',
          avatar_url: data.avatar_url || null,
        });
        if (data.avatar_url) {
          setPreviewUrl(data.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile. Please try again.');
      router.replace('/auth/login');
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

    // File size validation (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAvatarFile(file);
    setError(null);
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : null) : value,
    }));
    setError(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      // Upload new image if exists
      let avatarUrl = profileData.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadImage(user.id);
      }

      // Update profile with new data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          age: profileData.age,
          gender: profileData.gender,
          preferred_gender: profileData.preferred_gender,
          bio: profileData.bio,
          dater_archetype: profileData.dater_archetype,
          school: profileData.school,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(updateError.message);
      }

      // Success - redirect to dashboard
      router.push('/dashboard');

    } catch (error) {
      console.error('Error updating profile:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to update profile. Please try again.'
      );
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

  return (
    <>
      <div className="max-w-md mx-auto p-5 pb-24">
        <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
          Edit Your Profile
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          {/* Profile Picture Upload */}
          <div className="flex items-center justify-center w-full mb-6">
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={previewUrl}
                    alt="Profile preview"
                    fill
                    className="object-cover rounded-full"
                    sizes="(max-width: 768px) 100vw, 128px"
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