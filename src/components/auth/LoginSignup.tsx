'use client';

import React, { useState } from 'react';
import { supabase } from '../../supabase/client';
import Link from 'next/link';

export default function LoginSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to log in with Google');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    if (!email.toLowerCase().endsWith('.edu')) {
      setError('Please use your .edu email address');
      return;
    }

    // Use a form submission to avoid any JavaScript interception
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = `/auth/reset-password`;

    const emailInput = document.createElement('input');
    emailInput.type = 'hidden';
    emailInput.name = 'email';
    emailInput.value = email;
    form.appendChild(emailInput);

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full p-2.5 mb-4 bg-white text-gray-700 rounded-full font-medium border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <img src="/images/google.svg" alt="Google" className="w-5 h-5" />
        {isLoading ? 'Processing...' : 'Continue with Google'}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
          required
        />

        <div className="text-right">
          <button
            onClick={handleForgotPassword}
            type="button"
            className="text-sm text-[#BA2525] hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Log In'}
        </button>

        <div className="text-center mt-4">
          <Link
            href="/auth/signup"
            className="text-[#BA2525] hover:underline"
          >
            Don't have an account? Sign Up with Email
          </Link>
        </div>
      </form>
    </div>
  );
}