'use client';

<<<<<<< HEAD
import React, { type ChangeEvent } from 'react'

interface EditProfilePageProps {
  onSave: () => void
  onBack: () => void
  onPreviousDates: () => void
}

export default function EditProfilePage({ onSave, onBack, onPreviousDates }: EditProfilePageProps) {
  const [name, setName] = React.useState('')
  const [age, setAge] = React.useState('')
  const [daterArchetype, setDaterArchetype] = React.useState('')
  const [school, setSchool] = React.useState('')

  const schools = [
    "Boston College",
    "Harvard",
    "MIT",
    "Northeastern",
    "BU",
    "N/A"
  ] as const

  const archetypes = [
    { value: "hopelessRomantic", label: "Hopeless Romantic" },
    { value: "cautiousDater", label: "Cautious Dater" },
    { value: "adventurous", label: "Commitment Seeker" },
    { value: "traditional", label: "Serial Dater" },
    { value: "independent", label: "Friends with Benefits" }
  ] as const

  const handleSave = (): void => {
    console.log('Saving profile:', { name, age, daterArchetype, school })
    onSave()
  }
=======
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

interface ProfileData {
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  bio: string;
  dater_archetype: string;
  school: string;
  avatar_url: string | null;
}

export default function EditProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    age: null,
    gender: '',
    bio: '',
    dater_archetype: '',
    school: '',
    avatar_url: null,
  });

  const router = useRouter();

  const schools = [
    'Boston College',
    'Harvard',
    'MIT',
    'Northeastern',
    'BU',
    'N/A',
  ];

  const archetypes = [
    { value: 'hopelessRomantic', label: 'Hopeless Romantic' },
    { value: 'cautiousDater', label: 'Cautious Dater' },
    { value: 'adventurous', label: 'Commitment Seeker' },
    { value: 'traditional', label: 'Serial Dater' },
    { value: 'independent', label: 'Friends with Benefits' },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfileData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          age: data.age || null,
          gender: data.gender || '',
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
      alert('Error fetching profile. Please try again.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAvatarFile(file);
  };

  const uploadImage = async (userId: string) => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : null) : value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload new image if exists
      let avatarUrl = profileData.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadImage(user.id);
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          age: profileData.age,
          gender: profileData.gender,
          bio: profileData.bio,
          dater_archetype: profileData.dater_archetype,
          school: profileData.school,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      alert('Profile updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value)
  }

  const handleAgeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setAge(e.target.value)
  }

  const handleArchetypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setDaterArchetype(e.target.value)
  }

  const handleSchoolChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setSchool(e.target.value)
  }

  return (
    <div className='max-w-md mx-auto p-5'>
      <h2 className='text-center text-[#cc0000] font-bold text-3xl mb-6'>
        Edit Your Profile
      </h2>

      <input
<<<<<<< HEAD
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={handleNameChange}
      />

      <input
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        type="number"
        placeholder="Your Age"
        value={age}
        onChange={handleAgeChange}
      />

      <select
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        value={daterArchetype}
        onChange={handleArchetypeChange}
=======
        className='w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='text'
        name='first_name'
        placeholder='First Name'
        value={profileData.first_name}
        onChange={handleChange}
      />

      <input
        className='w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='text'
        name='last_name'
        placeholder='Last Name'
        value={profileData.last_name}
        onChange={handleChange}
      />

      <input
        className='w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='number'
        name='age'
        placeholder='Your Age'
        value={profileData.age || ''}
        onChange={handleChange}
      />

      <select
        className='w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        name='gender'
        value={profileData.gender}
        onChange={handleChange}
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34
      >
        <option value=''>Select Gender</option>
        <option value='male'>Male</option>
        <option value='female'>Female</option>
        <option value='other'>Other</option>
      </select>

      <textarea
        className='w-full p-2.5 mb-4 border border-gray-200 rounded-lg outline-none focus:border-[#cc0000] transition-colors min-h-[100px]'
        name='bio'
        placeholder='Tell us about yourself...'
        value={profileData.bio}
        onChange={handleChange}
      />

      <select
        className='w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        name='dater_archetype'
        value={profileData.dater_archetype}
        onChange={handleChange}
      >
        <option value=''>Select Dater Archetype</option>
        {archetypes.map((archetype) => (
          <option key={archetype.value} value={archetype.value}>
            {archetype.label}
          </option>
        ))}
      </select>

      <select
<<<<<<< HEAD
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        value={school}
        onChange={handleSchoolChange}
=======
        className='w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        name='school'
        value={profileData.school}
        onChange={handleChange}
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34
      >
        <option value=''>Select School</option>
        {schools.map((schoolOption) => (
          <option key={schoolOption} value={schoolOption}>
            {schoolOption}
          </option>
        ))}
      </select>

      <div className='mb-4'>
        <div className='flex items-center justify-center w-full'>
          <label className='flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'>
            {previewUrl ? (
              <div className='relative w-full h-full'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt='Preview'
                  className='object-cover w-full h-full rounded-lg'
                />
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                <svg
                  className='w-8 h-8 mb-4 text-gray-500'
                  aria-hidden='true'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 20 16'
                >
                  <path
                    stroke='currentColor'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
                  />
                </svg>
                <p className='mb-2 text-sm text-gray-500'>
                  <span className='font-semibold'>Click to upload</span> or drag
                  and drop
                </p>
                <p className='text-xs text-gray-500'>
                  PNG, JPG (MAX. 800x400px)
                </p>
              </div>
            )}
            <input
              type='file'
              className='hidden'
              accept='image/*'
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </div>

<<<<<<< HEAD
      <button 
        className="w-full p-2.5 mb-4 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onPreviousDates}
=======
      <button
        className='w-full p-2.5 mb-4 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        onClick={() => router.push('/previous-dates')}
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34
      >
        Previous Dates
      </button>

<<<<<<< HEAD
      <button 
        className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
=======
      <button
        className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34
        onClick={handleSave}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Profile'}
      </button>

      <button
        className='w-full p-2.5 mt-3 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
        onClick={() => router.push('/dashboard')}
      >
        Back to Dashboard
      </button>
    </div>
<<<<<<< HEAD
  )
}
=======
  );
}
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34
