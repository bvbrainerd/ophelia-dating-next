'use client';
import { useState } from 'react';
import { supabase } from '@/supabase/client';

interface ProfileSetupProps {
  onComplete: () => void;
}

interface UserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  school: string;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    age: null,
    gender: '',
    school: '',
  });

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
      // First create the auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data returned');

      // Then insert the profile data
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          age: userData.age,
          gender: userData.gender,
          school: userData.school,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      onComplete();
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
      <button
        className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        onClick={handleSubmit}
        disabled={
          isLoading ||
           
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
