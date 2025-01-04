'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';

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

    // Validate email and password
    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    // Validate BC email domain
    if (!email.toLowerCase().endsWith('@bc.edu')) {
      setError('Please use your BC email address (@bc.edu)');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          setError('Invalid email or password');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.session) {
        await supabase.auth.setSession(data.session);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update the email input to enforce BC email domain
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toLowerCase();
    setEmail(value);
    if (value && !value.endsWith('@bc.edu')) {
      setError('Please use your BC email address (@bc.edu)');
    } else {
      setError(null);
    }
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your BC email address first');
      return;
    }

    if (!email.toLowerCase().endsWith('@bc.edu')) {
      setError('Please use your BC email address (@bc.edu)');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setError('Password reset link sent to your email');
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to send reset password email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-5 pt-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-[#cc0000] font-bold text-[2.75rem] leading-none mb-1">Ophelia</h1>
          <p className="text-[0.85rem] text-gray-600 italic">Oh I Feel Ya™</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            name="email"
            autoComplete="email"
            className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
            type='email'
            placeholder='BC Email (@bc.edu)'
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
          />

          <input
            name="password"
            autoComplete="current-password"
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

          <button
            onClick={handleForgotPassword}
            type="button"
            className="w-full mt-4 text-[#cc0000] text-sm hover:underline"
          >
            Forgot Password?
          </button>
        </form>

        <p className="mt-4 text-center">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-[#cc0000] hover:underline">
            Join us
          </Link>
        </p>
      </div>
    </div>
  );
}
