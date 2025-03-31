'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import PenaltyDare from '@/components/PenaltyDare';

export default function PenaltyDarePreview() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          // Set user to penalty status for testing
          await supabase
            .from('profiles')
            .update({ dating_status: 'penalty' })
            .eq('id', user.id);
          
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#cc0000] mb-4">Please Log In</h1>
          <p className="text-gray-600">You need to be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#cc0000] mb-8 text-center">
          Penalty Dare Preview
        </h1>
        <PenaltyDare 
          userId={userId} 
          onComplete={() => alert('Dare completed!')} 
        />
      </div>
    </div>
  );
} 