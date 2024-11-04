'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/client';
import { useState } from 'react';
import { useUser } from '../../context/UserContext';

export default function Home() {
  const [userInfo, setUserInfo] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const { setUser } = useUser();
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const onLogin = async () => {
    try {
      // Check if user exists in profiles table
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userInfo.email)
        .eq('password', userInfo.password) // Note: storing plain passwords isn't secure
        .single();

      if (error) {
        throw error;
      }

      if (user) {
        // Set global user state
        setUser(user);
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid login credentials');
    }
  };

  const onSignup = () => {
    router.push('/onboarding');
  };

  return (
    <div className='max-w-md mx-auto p-5 font-sans'>
      <h1 className='text-2xl font-bold mb-6'>Ophelia</h1>

      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      <div className='space-y-4'>
        <input
          className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
          type='email'
          name='email'
          value={userInfo.email}
          onChange={handleChange}
          placeholder='BC Email'
        />

        <input
          className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
          type='password'
          name='password'
          value={userInfo.password}
          onChange={handleChange}
          placeholder='Password'
        />

        <button
          className='w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors'
          onClick={onLogin}
        >
          Log In
        </button>

        <button
          className='w-full bg-white text-red-600 py-2 rounded-lg border-2 border-red-600 hover:bg-red-50 transition-colors'
          onClick={onSignup}
        >
          Sign Up with BC Email
        </button>
      </div>
    </div>
  );
}
