'use client';

import React from 'react';
import { supabase } from '@/supabase/client';
import { useState } from 'react';


interface LoginSignupProps {
  onLogin: () => void;
  onSignup: () => void;
}

const LoginSignup: React.FC<LoginSignupProps> = ({ onLogin, onSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateBCEmail = (email: string) => {
    return email.endsWith('@bc.edu');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateBCEmail(email)) {
      setError('Please use a valid BC email address');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        throw signInError;
      }

      if (data?.user) {
        onLogin();
      }
    } catch (err: any) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className='max-w-md mx-auto p-5'>
      <h1 className='text-center text-[#cc0000] font-bold text-4xl mb-8'>
        Ophelia
      </h1>


      <form onSubmit={handleLogin}>
        <input
          className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000]'
          type='email'
          placeholder='BC Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000]'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button
          type='submit'
          className='w-full p-2.5 bg-[#cc0000] text-white rounded-full cursor-pointer font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50'
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Log In'}
        </button>
      </form>

      <button
        className='w-full p-2.5 mt-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full cursor-pointer font-medium hover:bg-[#ffeeee] transition-colors disabled:opacity-50'
        onClick={onSignup}
        disabled={loading}
      >
        Sign Up with BC Email
      </button>
    </div>
  );
};

export default LoginSignup;
