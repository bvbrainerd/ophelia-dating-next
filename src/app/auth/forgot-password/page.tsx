'use client';

import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate BC email
      if (!email.toLowerCase().endsWith('@bc.edu')) {
        setMessage({ text: 'Please enter a valid BC email address', type: 'error' });
        return;
      }

      // Send reset password request to Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`,
      });
      
      if (error) throw error;

      // Redirect to reset password page
      router.push('/auth/reset-password');
      
    } catch (error) {
      console.error('Error:', error);
      setMessage({ 
        text: 'Failed to process reset request. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#BA2525]">Reset Password</h2>
          <p className="mt-2 text-gray-600">
            Enter your BC email to reset your password
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="BC Email"
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
              disabled={isLoading}
              required
            />
          </div>

          {message && (
            <p className={`text-sm text-center ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {message.text}
            </p>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </button>

            <Link 
              href="/auth/login"
              className="block text-center text-sm text-[#BA2525] hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 