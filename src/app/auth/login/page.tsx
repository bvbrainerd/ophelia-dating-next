'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { Prompt } from 'next/font/google';

const prompt = Prompt({
  weight: ['400', '700'],
  subsets: ['latin']
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password.trim()
      });

      console.log('data: ', data);
      if (error) {
        setError(error.message);
      } else if (data?.user) {
        console.log('User:', data.user);
        router.push('/highlight-reel');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the email input to enforce BC email domain
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toLowerCase();
    setEmail(value);
    if (value && !value.endsWith('.edu')) {
      setError('Please enter a valid email address');
    } else {
      setError(null);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }

    if (!email.toLowerCase().endsWith('.edu')) {
      setError('Please enter a valid email address');
      return;
    }

    window.location.replace(`/auth/reset-password?email=${encodeURIComponent(email)}`);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/background.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        {/* Red-tinted overlay for better theme matching */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#cc0000]/30 to-black/50 mix-blend-multiply" />
      </div>

      <div className="relative z-10">
        <div className="pt-6 pb-2">
          <Header variant="logo-only" />
        </div>

        <div className="container mx-auto px-4 flex items-start min-h-[calc(100vh-140px)] pt-8">
          <div className="w-full max-w-[380px] mx-auto">
            <div className="bg-black/30 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
              <div className="relative">
                <h2 className="text-2xl font-bold text-center mb-6 text-white tracking-tight">Welcome Back</h2>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Email"
                      className="w-full p-3.5 bg-white/10 border border-white/20 rounded-full outline-none focus:border-[#cc0000] text-white placeholder-white/60 transition-all text-sm"
                      required
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full p-3.5 bg-white/10 border border-white/20 rounded-full outline-none focus:border-[#cc0000] text-white placeholder-white/60 transition-all text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full p-3.5 bg-[#cc0000] text-white rounded-full font-bold hover:bg-[#aa0000] transition-all transform hover:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Log In'}
                  </button>
                </form>

                <div className="text-center mt-4 space-y-2">
                  <button
                    onClick={handleForgotPassword}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    Forgot Password?
                  </button>
                  <p className="text-white/60 text-sm">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-white hover:text-white/80 transition-colors">
                      Sign Up
                    </Link>
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 text-white text-sm bg-transparent">OR CONTINUE WITH</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors"
                  >
                    <Image src="/google.svg" alt="Google" width={20} height={20} />
                    <span>Sign in with Google</span>
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-2.5 bg-red-500/10 text-red-400 text-xs text-center rounded-full border border-red-500/20">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
