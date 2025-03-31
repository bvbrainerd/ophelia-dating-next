'use client';

import React, { useState } from 'react';
import { supabase } from '../../supabase/client';
import Link from 'next/link';
import { prompt } from '@/app/fonts';
import Image from 'next/image';

export default function LoginSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleIconError, setGoogleIconError] = useState(false);

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
      window.location.href = '/highlight-reel';
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
          redirectTo: `${window.location.origin}/highlight-reel`,
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

    window.location.replace(`/auth/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className={`container mx-auto px-4 flex items-start min-h-[calc(100vh-140px)] pt-8 ${prompt.className}`}>
      <div className="w-full max-w-[340px] mx-auto">
        <div className="bg-[#cc0000]/20 backdrop-blur-lg rounded-2xl p-5 shadow-2xl border border-white/20">
          <div className="relative">
            <h2 className="text-2xl font-bold text-center mb-5 text-white tracking-tight">Welcome Back</h2>
            <div className="max-w-[280px] mx-auto">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full p-2.5 mb-4 bg-white/90 text-gray-700 rounded-full font-medium border border-white/20 hover:bg-white transition-colors flex items-center justify-center gap-3 shadow-sm text-sm"
              >
                {!googleIconError ? (
                  <div className="w-[18px] h-[18px] relative flex-shrink-0">
                    <Image 
                      src="/images/google.svg" 
                      alt="Google" 
                      width={18}
                      height={18}
                      className="object-contain"
                      onError={() => setGoogleIconError(true)}
                      priority
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-[18px] h-[18px] bg-[#4285F4] rounded-full flex-shrink-0" />
                )}
                <span>{isLoading ? 'Processing...' : 'Continue with Google'}</span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-white/80">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                {error && (
                  <div className="p-2.5 text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full p-2.5 bg-white/90 border border-white/20 rounded-full outline-none focus:border-[#cc0000] transition-colors text-sm"
                  required
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full p-2.5 bg-white/90 border border-white/20 rounded-full outline-none focus:border-[#cc0000] transition-colors text-sm"
                  required
                />

                <div className="text-center mb-2">
                  <button
                    onClick={handleForgotPassword}
                    type="button"
                    className="text-xs text-white hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Log In'}
                </button>

                <div className="text-center mt-3">
                  <Link
                    href="/auth/signup"
                    className="text-white hover:opacity-80 text-xs"
                  >
                    Don't have an account? <span className="underline font-bold">Sign Up</span> with Email
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}