'use client';

import React, { useState, ChangeEvent } from 'react';
import { supabase } from '@/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ImageUploadPreview from '../ImageUploadPreview';

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

interface ProfileData {
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  bio: string;
  dater_archetype: string;
  school: string;
}

const ProfileSetup = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    age: null,
    gender: '',
    bio: '',
    dater_archetype: '',
    school: 'Boston College',
  });

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAvatarFile(file);
    setError('');
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : null) : value,
    }));
    setError('');
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      return `https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/avatars/${fileName}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadImage(user.id);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            ...profileData,
            avatar_url: avatarUrl,
          },
        ]);

      if (updateError) throw updateError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-4xl mb-8">
        Set Up Your Profile
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-center w-full mb-6">
          <ImageUploadPreview 
            previewUrl={previewUrl}
            onImageUpload={handleImageUpload}
          />
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
          required
        />

        <select
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
          name="gender"
          value={profileData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <textarea
          className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#cc0000] transition-colors min-h-[100px]"
          name="bio"
          placeholder="Tell us about yourself..."
          value={profileData.bio}
          onChange={handleChange}
          required
        />

        <select
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
          name="dater_archetype"
          value={profileData.dater_archetype}
          onChange={handleChange}
          required
        >
          <option value="">Select Dater Archetype</option>
          {ARCHETYPES.map((archetype) => (
            <option key={archetype.value} value={archetype.value}>
              {archetype.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Creating Profile...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileSetup;