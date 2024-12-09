'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client'

export default function LoginSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState('');

  const validateBCEmail = (email: string) => {
    return email.toLowerCase().endsWith('@bc.edu');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBCEmail(email)) {
      setError('Please use a valid BC email address');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.session) {
        router.push('/dashboard');
      } else {
        setError('Failed to establish session');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };
  return (
    <div className='max-w-md mx-auto p-5'>
      <h1 className='text-center text-[#cc0000] font-bold text-4xl mb-8'>
        Ophelia
      </h1>
      <form onSubmit={handleLogin}>
        <input
          className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          type='email'
          placeholder='BC Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />

        <input
          className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />

        <button
          type="submit"
          className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isLoading || !email || !password}
        >
          {isLoading ? 'Loading...' : 'Log In'}
        </button>

        <button
          className='w-full p-2.5 mt-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          onClick={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Sign Up with BC Email'}
        </button>
      </form>
    </div>
  );
}
