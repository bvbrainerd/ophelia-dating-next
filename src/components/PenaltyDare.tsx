import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { getDailyDare } from '@/utils/dailyDares';

interface PenaltyDareProps {
  userId: string;
  onComplete: () => void;
}

interface Profile {
  id: string;
  dating_status: string;
  current_penalty_dare: string | null;
  next_date_challenge: string | null;
}

export default function PenaltyDare({ userId, onComplete }: PenaltyDareProps) {
  const [dare, setDare] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChallenge, setHasChallenge] = useState(false);

  useEffect(() => {
    const fetchUserPenalties = async () => {
      try {
        // Get user's current penalties and status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('dating_status, current_penalty_dare, next_date_challenge')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        if (profile.current_penalty_dare) {
          setDare(profile.current_penalty_dare);
        } else if (profile.dating_status === 'penalty') {
          // Get the daily dare based on user's relationship status
          const userStatus = profile.dating_status === 'single' ? 'single' : 'couple';
          const dailyDare = await getDailyDare(userStatus);
          
          // Assign the daily dare
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ current_penalty_dare: dailyDare.dare })
            .eq('id', userId);

          if (updateError) throw updateError;
          setDare(dailyDare.dare);
        }

        // Check if user needs a surprise challenge
        if (profile.next_date_challenge) {
          setHasChallenge(true);
        } else if (profile.dating_status === 'penalty') {
          // Get another daily dare for the challenge
          const userStatus = profile.dating_status === 'single' ? 'single' : 'couple';
          const dailyChallenge = await getDailyDare(userStatus);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ next_date_challenge: dailyChallenge.dare })
            .eq('id', userId);

          if (updateError) throw updateError;
          setHasChallenge(true);
        }

      } catch (error) {
        console.error('Error fetching penalties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPenalties();
  }, [userId]);

  const handleCompleteDare = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          current_penalty_dare: null,
          dating_status: 'bronze' // Reset to bronze after completing dare
        })
        .eq('id', userId);

      if (error) throw error;

      // Create a record in date_penalties
      await supabase
        .from('date_penalties')
        .insert({
          user_id: userId,
          penalty_type: 'dare',
          penalty_details: { dare },
          status: 'completed'
        });

      onComplete();
    } catch (error) {
      console.error('Error completing dare:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (!dare && !hasChallenge) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {dare && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#cc0000] mb-4">
            Your Daily Dare 😈
          </h2>
          <p className="text-gray-800 text-lg mb-4">
            {dare}
          </p>
          <button
            onClick={handleCompleteDare}
            className="w-full p-3 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
          >
            I've Completed This Dare
          </button>
        </div>
      )}

      {hasChallenge && (
        <div>
          <h2 className="text-xl font-bold text-[#cc0000] mb-4">
            Your Next Date Has a Surprise Challenge! 🎯
          </h2>
          <p className="text-gray-600">
            The challenge will be revealed when your date begins. Get ready for something exciting!
          </p>
        </div>
      )}
    </div>
  );
} 