'use client';

import { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ImageCropper from '@/components/ImageCropper';

interface UserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  school: string;
  avatar_url: string | null;
  preferred_gender: string;
  dater_archetype: string | null;
}

interface AuthError {
  message: string;
  status?: number;
}

interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  school: string;
  avatar_url: string | null;
  preferred_gender: string; 
  created_at: string;
}

export default function ProfileSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    age: null,
    gender: '',
    school: 'Boston College',
    avatar_url: null,
    preferred_gender: '',
    dater_archetype: null
  });
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to File
    const croppedFile = new File([croppedBlob], selectedFile?.name || 'profile.jpg', {
      type: 'image/jpeg'
    });

    setAvatarFile(croppedFile);
    const url = URL.createObjectURL(croppedBlob);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(url);
    setShowCropper(false);
    setSelectedFile(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data?.publicUrl || null;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const validateBCEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith('@bc.edu');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : null) : value,
    }));
    setError(null);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!validateBCEmail(userData.email)) {
        setError('Please use your BC email address (@bc.edu)');
        return;
      }

      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email.toLowerCase().trim(),
        password: userData.password.trim(),
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No user data returned');

      // Upload avatar if exists
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadImage(authData.user.id);
      }

      const profileData = {
        id: authData.user.id,
        email: userData.email.toLowerCase().trim(),
        first_name: userData.first_name.trim(),
        last_name: userData.last_name.trim(),
        age: userData.age,
        gender: userData.gender,
        preferred_gender: userData.preferred_gender,
        bio: '',
        school: 'Boston College',
        avatar_url: avatarUrl,
        dater_archetype: userData.dater_archetype
      };

      console.log('Updating profile with data:', profileData);

      // Use upsert instead of insert
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Redirect to quiz page after successful signup
      router.push('/quiz');

    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto p-5'>
      <h2 className='text-center text-[#cc0000] font-bold text-3xl mb-6'>
        Create Your Account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
          {error.includes('already exists') && (
            <div className="mt-2">
              <Link 
                href="/auth/login" 
                className="text-[#cc0000] hover:underline"
              >
                Click here to log in
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        {/* Profile Picture */}
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

        {/* Form Fields */}
        <input
          className='w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          type='email'
          name='email'
          placeholder='BC Email'
          value={userData.email}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <input
          className='w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          type='password'
          name='password'
          placeholder='Password'
          value={userData.password}
          onChange={handleChange}
          disabled={isLoading}
          required
          minLength={6}
        />

        <input
          className='w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          type='text'
          name='first_name'
          placeholder='First Name'
          value={userData.first_name}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <input
          className='w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          type='text'
          name='last_name'
          placeholder='Last Name'
          value={userData.last_name}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <input
          className='w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          type='number'
          name='age'
          placeholder='Age'
          value={userData.age || ''}
          onChange={handleChange}
          disabled={isLoading}
          required
          min="18"
          max="100"
        />

        <select
          className='w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          name='gender'
          value={userData.gender}
          onChange={handleChange}
          disabled={isLoading}
          required
        >
          <option value=''>Select Your Gender</option>
          <option value='male'>Male</option>
          <option value='female'>Female</option>
          <option value='other'>Other</option>
        </select>

        <select
          className='w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          name='preferred_gender'
          value={userData.preferred_gender}
          onChange={handleChange}
          disabled={isLoading}
          required
        >
          <option value=''>Select Partner's Preferred Gender</option>
          <option value='male'>Male</option>
          <option value='female'>Female</option>
          <option value='other'>Other</option>
        </select>

        <select
          className='w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          name='school'
          value={userData.school}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value='Boston College'>Boston College</option>
        </select>

        <button
          type='submit'
          className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

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