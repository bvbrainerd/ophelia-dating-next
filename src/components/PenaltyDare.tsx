import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

interface PenaltyDareProps {
  userId: string;
  onComplete: () => void;
}

const penaltyDares = [
  "Post a video confessing your biggest dating fear",
  "Go live and share your most embarrassing date story",
  "Post a public apology for being a date bailer",
  "Share a video explaining why you keep running from real connections",
  "Record yourself doing a silly dance in a public place",
  "Post a video singing a love song dedicated to your future date"
];

const surpriseChallenges = [
  "Kiss your date by the end of the night",
  "Ask your date to dance in public",
  "Share your deepest fear with your date",
  "Tell your date something you've never told anyone else",
  "Propose a spontaneous adventure during the date",
  "Give your date a thoughtful compliment every 30 minutes"
];

export default function PenaltyDare({ userId, onComplete }: PenaltyDareProps) {
  const [dare, setDare] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChallenge, setHasChallenge] = useState(false);

  useEffect(() => {
    const fetchUserPenalties = async () => {
      try {
        // Get user's current penalties
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('dating_status, current_penalty_dare, next_date_challenge')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        if (profile.current_penalty_dare) {
          setDare(profile.current_penalty_dare);
        } else if (profile.dating_status === 'penalty') {
          // Assign a new penalty dare
          const newDare = penaltyDares[Math.floor(Math.random() * penaltyDares.length)];
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ current_penalty_dare: newDare })
            .eq('id', userId);

          if (updateError) throw updateError;
          setDare(newDare);
        }

        // Check if user needs a surprise challenge
        if (profile.next_date_challenge) {
          setHasChallenge(true);
        } else if (profile.dating_status === 'penalty') {
          // Assign a new surprise challenge
          const newChallenge = surpriseChallenges[Math.floor(Math.random() * surpriseChallenges.length)];
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ next_date_challenge: newChallenge })
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
            Your Penalty Dare 😈
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