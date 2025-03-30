'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { Prompt } from 'next/font/google';
import LoginSignup from '@/components/auth/LoginSignup';

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
      console.log('Attempting to connect to Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password.trim()
      });

      if (error) {
        console.error('Supabase auth error:', error);
        setError(error.message);
      } else if (data?.user) {
        router.push('/highlight-reel');
      }
    } catch (error: any) {
      console.error('Login error:', error);
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
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/background2.jpg)' }}>
      <Header variant="transparent-red" />
      <div className="container mx-auto px-4 py-8">
        <LoginSignup />
      </div>
    </div>
  );
}
