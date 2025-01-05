'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/client';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: 'Email is required', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      if (newPassword !== confirmPassword) {
        setMessage({ text: 'Passwords do not match', type: 'error' });
        return;
      }

      const response = await fetch('/api/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset password');
      }

      setMessage({ 
        text: 'Password successfully updated! Redirecting to login...', 
        type: 'success' 
      });

      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'Failed to update password. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 sm:px-5">
      <div className="max-w-md mx-auto pt-8 sm:pt-12">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-[#cc0000] font-bold text-[2.25rem] sm:text-[2.75rem] leading-none mb-1">Ophelia</h1>
          <p className="text-[0.8rem] sm:text-[0.85rem] text-gray-600 italic">Oh I Feel Ya™</p>
        </div>

        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#BA2525]">Set New Password</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-3 sm:space-y-4">
          <div className="space-y-3 sm:space-y-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors text-base"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors text-base"
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

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full py-2.5 px-4 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={() => window.location.href = isAuthenticated ? '/dashboard' : '/auth/login'}
              className="w-full py-2.5 px-4 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors text-base"
            >
              {isAuthenticated ? 'Return to Dashboard' : 'Return to Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 