'use client';
import { useState } from 'react';
import { supabase } from '../../supabase/client';
import DatingTypeQuiz from '@/components/DatingTypeQuiz';
import { useRouter } from 'next/navigation';
import DescriptorBubbles, { Descriptor } from '@/components/DescriptorBubbles';

interface ProfileSetupProps {
  onComplete: () => void;
}

interface UserData {
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  school: string;
  descriptors: Descriptor[];
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData>({
    first_name: '',
    last_name: '',
    age: null,
    gender: '',
    school: 'Boston College',
    descriptors: [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : null) : value,
    }));
  };

  const handleDescriptorSelect = (descriptor: Descriptor) => {
    setUserData(prev => ({
      ...prev,
      descriptors: prev.descriptors.some(d => d.label === descriptor.label)
        ? prev.descriptors.filter(d => d.label !== descriptor.label)
        : [...prev.descriptors, descriptor]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      // Create initial profile with minimal data
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          age: userData.age,
          gender: userData.gender,
          school: 'Boston College',
          bio: '',
          preferred_gender: '',
          avatar_url: null,
          descriptors: userData.descriptors
        });

      if (updateError) throw updateError;

      // Set userId for quiz completion
      setUserId(user.id);
      
      // Show the quiz instead of redirecting
      setShowQuiz(true);

    } catch (error: any) {
      console.error('Profile setup error:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
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
        <DatingTypeQuiz onComplete={onComplete} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='max-w-md mx-auto p-5'>
      <h2 className='text-center text-[#cc0000] font-bold text-3xl mb-6'>
        Complete Your Profile
      </h2>
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

      <div className="mt-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tell us about yourself</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select descriptors that best match your personality, interests, and lifestyle.
        </p>
        <DescriptorBubbles
          selectedDescriptors={userData.descriptors}
          onSelectDescriptor={handleDescriptorSelect}
          maxSelections={10}
        />
      </div>

      <button
        type="submit"
        className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        disabled={isLoading}
      >
        {isLoading ? 'Saving Profile...' : 'Save Profile'}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
    </form>
  );
}