'use client';
import { useState } from 'react';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

interface UserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  school: string;
  avatar_url: string | null;
}

export default function ProfileSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    age: null,
    gender: '',
    school: '',
    avatar_url: null,
  });

  const router = useRouter();

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

  const validateBCEmail = (email: string) => {
    return email.toLowerCase().endsWith('@bc.edu');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : null) : value,
    }));
  };

  const handleSubmit = async () => {
    if (!validateBCEmail(userData.email)) {
      alert('Please use a valid BC email address');
      return;
    }

    setIsLoading(true);
    try {
      // First sign up the user with Supabase Auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
        });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('No user data returned');

      // Upload image if exists
      const avatarUrl = await uploadImage(signUpData.user.id);

      // Then insert the profile data
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: signUpData.user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          age: userData.age,
          gender: userData.gender,
          school: userData.school,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });

      if (signInError) throw signInError;

      router.refresh();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Error creating account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto p-5'>
      <h2 className='text-center text-[#cc0000] font-bold text-3xl mb-6'>
        Create Your Account
      </h2>
      <input
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='email'
        name='email'
        placeholder='BC Email'
        value={userData.email}
        onChange={handleChange}
      />
      <input
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='password'
        name='password'
        placeholder='Password'
        value={userData.password}
        onChange={handleChange}
      />
      <input
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='text'
        name='first_name'
        placeholder='First Name'
        value={userData.first_name}
        onChange={handleChange}
      />
      <input
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='text'
        name='last_name'
        placeholder='Last Name'
        value={userData.last_name}
        onChange={handleChange}
      />
      <input
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='number'
        name='age'
        placeholder='Age'
        value={userData.age || ''}
        onChange={handleChange}
      />
      <select
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        name='gender'
        value={userData.gender}
        onChange={handleChange}
      >
        <option value=''>Select Gender</option>
        <option value='male'>Male</option>
        <option value='female'>Female</option>
        <option value='other'>Other</option>
      </select>
      <select
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        name='school'
        value={userData.school}
        onChange={handleChange}
        defaultValue='Boston College'
      >
        <option value='Boston College'>Boston College</option>
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
      <button
        className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        onClick={handleSubmit}
        disabled={
          isLoading ||
          !validateBCEmail(userData.email) ||
          !userData.password ||
          !userData.first_name ||
          !userData.last_name ||
          !userData.age ||
          !userData.gender
        }
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </div>
  );
}
