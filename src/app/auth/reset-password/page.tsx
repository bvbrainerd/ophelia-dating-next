'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      router.push('/dashboard');
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen pt-32 px-5'>
      <div className='max-w-md mx-auto'>
        <h1 className='text-center text-[#cc0000] font-bold text-4xl mb-8'>
          Reset Password
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors'
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50'
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
} 