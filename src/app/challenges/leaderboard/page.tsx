'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ProfileImage from '@/components/ProfileImage';
import { Card } from '@/components/ui/card';
import { Trophy, Star, Flame, Heart, ThumbsUp, MessageCircle } from 'lucide-react';
import ShameBoard from '@/components/ShameBoard';

interface LeaderboardUser {
  id: string;
  first_name: string;
  avatar_url: string | null;
  challenge_points: number;
  challenge_rank: string;
  challenge_streak: number;
  total_challenges_completed: number;
}

interface ActiveChallenge {
  id: string;
  user: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
  challenge: {
    title: string;
    description: string;
    level: string;
    points: number;
  };
  venue: string;
  date_time: string;
  watcher_votes: number;
  status: string;
  proof_media_url?: string;
}

export default function ChallengeLeaderboardPage() {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leaderboard data
        const { data: leaderboardUsers, error: leaderboardError } = await supabase
          .from('profiles')
          .select('id, first_name, avatar_url, challenge_points, challenge_rank, challenge_streak, total_challenges_completed')
          .order('challenge_points', { ascending: false })
          .limit(10);

        if (leaderboardError) throw leaderboardError;
        setLeaderboardData(leaderboardUsers || []);

        // Fetch active challenges
        const { data: challenges, error: challengesError } = await supabase
          .from('user_challenges')
          .select(`
            id,
            status,
            watcher_votes,
            proof_media_url,
            date_requests!inner(venue, proposed_time),
            profiles!user_challenges_user_id_fkey(id, first_name, avatar_url),
            date_challenges!inner(title, description, level, points)
          `)
          .in('status', ['committed', 'completed'])
          .order('created_at', { ascending: false })
          .limit(5);

        if (challengesError) throw challengesError;

        const processedChallenges = challenges.map((c: any) => ({
          id: c.id,
          user: {
            id: c.profiles.id,
            first_name: c.profiles.first_name,
            avatar_url: c.profiles.avatar_url
          },
          challenge: {
            title: c.date_challenges.title,
            description: c.date_challenges.description,
            level: c.date_challenges.level,
            points: c.date_challenges.points
          },
          venue: c.date_requests.venue,
          date_time: c.date_requests.proposed_time,
          watcher_votes: c.watcher_votes,
          status: c.status,
          proof_media_url: c.proof_media_url
        }));

        setActiveChallenges(processedChallenges);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleVote = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('challenge_watchers')
        .select('id')
        .eq('user_challenge_id', challengeId)
        .eq('watcher_id', user.id)
        .single();

      if (existingVote) {
        // Remove vote
        await supabase
          .from('challenge_watchers')
          .delete()
          .eq('id', existingVote.id);
      } else {
        // Add vote
        await supabase
          .from('challenge_watchers')
          .insert({
            user_challenge_id: challengeId,
            watcher_id: user.id,
            vote_type: 'upvote'
          });
      }

      // Refresh active challenges
      const { data: updatedChallenge } = await supabase
        .from('user_challenges')
        .select('watcher_votes')
        .eq('id', challengeId)
        .single();

      if (updatedChallenge) {
        setActiveChallenges(prev => 
          prev.map(c => 
            c.id === challengeId 
              ? { ...c, watcher_votes: updatedChallenge.watcher_votes }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Error handling vote:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#aa0000] pb-24">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="default" />
        
        <div className="mt-8 space-y-8">
          {/* Leaderboard Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-[#cc0000] mb-6">
              Challenge Leaderboard 🏆
            </h2>
            <div className="space-y-4">
              {leaderboardData.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-[#cc0000] w-8">
                      #{index + 1}
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <ProfileImage user={user} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {user.first_name}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {user.total_challenges_completed} challenges completed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#cc0000]">
                      {user.challenge_points}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.challenge_streak} day streak
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shame Board Section */}
          <ShameBoard />

          {/* Active Challenges Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-[#cc0000] mb-6">
              Active Challenges 🔥
            </h2>
            <div className="space-y-4">
              {activeChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-4 bg-gray-50 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <ProfileImage user={challenge.user} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {challenge.user.first_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {challenge.venue}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#cc0000] font-bold">
                        {challenge.challenge.points} pts
                      </div>
                      <div className="text-sm text-gray-500">
                        {challenge.watcher_votes} votes
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {challenge.challenge.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {challenge.challenge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
} 