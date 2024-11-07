'use client';
import { useState } from 'react';
import { supabase } from '@/supabase/client';
import DatingTypeQuiz from '@/components/DatingTypeQuiz';

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
  const [showQuiz, setShowQuiz] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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

  const handleQuizComplete = async (datingStyle: string) => {
    if (!userId) {
      console.error('No user ID found');
      return;
    }
    
    try {
      console.log('Updating profile with dating style:', datingStyle);
      // Update the profile with the dating style
      const { error } = await supabase
        .from('profiles')
        .update({ dating_style: datingStyle })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      // Complete the setup process
      onComplete();
    } catch (error) {
      console.error('Error updating dating style:', error);
      alert('Error saving quiz results. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    
    if (!validateBCEmail(userData.email)) {
      alert('Please use a valid BC email address');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating auth account...');
      // First create the auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data returned');

      console.log('Auth account created, creating profile...');
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

      console.log('Profile created, showing quiz...');
      // Store the user ID and show the quiz
      setUserId(authData.user.id);
      setShowQuiz(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Error creating account. Please try again.');
      setIsLoading(false);
    }
  };

  if (showQuiz) {
    console.log('Rendering quiz component');
    return (
      <div className="max-w-md mx-auto p-5">
        <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
          Let's Find Your Dating Style
        </h2>
        <DatingTypeQuiz onComplete={handleQuizComplete} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='max-w-md mx-auto p-5'>
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
        required
      />
      <input
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='password'
        name='password'
        placeholder='Password'
        value={userData.password}
        onChange={handleChange}
        required
      />
      <input
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='text'
        name='first_name'
        placeholder='First Name'
        value={userData.first_name}
        onChange={handleChange}
        required
      />
      <input
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='text'
        name='last_name'
        placeholder='Last Name'
        value={userData.last_name}
        onChange={handleChange}
        required
      />
      <input
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        type='number'
        name='age'
        placeholder='Age'
        value={userData.age || ''}
        onChange={handleChange}
        required
      />
      <select
        className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
        name='gender'
        value={userData.gender}
        onChange={handleChange}
        required
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
        required
      >
        <option value='Boston College'>Boston College</option>
      </select>
      <button
        type="submit"
        className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}