'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ProfileImage from '@/components/ProfileImage';
import { Card } from '@/components/ui/card';
import { ThumbsUp, MessageCircle, Send } from 'lucide-react';

interface Comment {
  id: string;
  watcher_id: string;
  comment: string;
  created_at: string;
  user: {
    first_name: string;
    avatar_url: string | null;
  };
}

interface ChallengeDetails {
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
  proof_media_url: string | null;
}

interface SupabaseChallenge {
  id: string;
  status: string;
  watcher_votes: number;
  proof_media_url: string | null;
  date_requests: {
    venue: string;
    proposed_time: string;
  };
  profiles: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
  date_challenges: {
    title: string;
    description: string;
    level: string;
    points: number;
  };
}

interface SupabaseComment {
  id: string;
  watcher_id: string;
  comment: string;
  created_at: string;
  profiles: {
    first_name: string;
    avatar_url: string | null;
  };
}

interface ProfileImageProps {
  user: {
    first_name?: string;
    avatar_url: string | null;
  };
  className?: string;
}

export default function ChallengePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        if (!params?.id) throw new Error('Challenge ID is required');

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user.id);
        }

        // Fetch challenge details
        const { data: challengeData, error: challengeError } = await supabase
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
          .eq('id', params.id)
          .single() as { data: SupabaseChallenge | null, error: any };

        if (challengeError) throw challengeError;
        if (!challengeData) throw new Error('Challenge not found');

        setChallenge({
          id: challengeData.id,
          user: {
            id: challengeData.profiles.id,
            first_name: challengeData.profiles.first_name,
            avatar_url: challengeData.profiles.avatar_url
          },
          challenge: {
            title: challengeData.date_challenges.title,
            description: challengeData.date_challenges.description,
            level: challengeData.date_challenges.level,
            points: challengeData.date_challenges.points
          },
          venue: challengeData.date_requests.venue,
          date_time: challengeData.date_requests.proposed_time,
          watcher_votes: challengeData.watcher_votes,
          status: challengeData.status,
          proof_media_url: challengeData.proof_media_url || null
        });

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('challenge_watchers')
          .select(`
            id,
            watcher_id,
            comment,
            created_at,
            profiles!challenge_watchers_watcher_id_fkey(
              first_name,
              avatar_url
            )
          `)
          .eq('user_challenge_id', params.id)
          .order('created_at', { ascending: false }) as { data: SupabaseComment[] | null, error: any };

        if (commentsError) throw commentsError;
        if (!commentsData) throw new Error('Comments not found');

        const formattedComments: Comment[] = commentsData.map((c) => ({
          id: c.id,
          watcher_id: c.watcher_id,
          comment: c.comment,
          created_at: c.created_at,
          user: {
            first_name: c.profiles.first_name,
            avatar_url: c.profiles.avatar_url
          }
        }));

        setComments(formattedComments);
      } catch (error) {
        console.error('Error fetching challenge data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallengeData();
  }, [params.id]);

  const handleVote = async () => {
    if (!challenge || !currentUser) return;

    try {
      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('challenge_watchers')
        .select('id')
        .eq('user_challenge_id', challenge.id)
        .eq('watcher_id', currentUser)
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
            user_challenge_id: challenge.id,
            watcher_id: currentUser,
            vote_type: 'upvote'
          });
      }

      // Refresh challenge votes
      const { data: updatedChallenge } = await supabase
        .from('user_challenges')
        .select('watcher_votes')
        .eq('id', challenge.id)
        .single();

      if (updatedChallenge) {
        setChallenge(prev => prev ? {
          ...prev,
          watcher_votes: updatedChallenge.watcher_votes
        } : null);
      }
    } catch (error) {
      console.error('Error handling vote:', error);
    }
  };

  const handleComment = async () => {
    if (!challenge || !currentUser || !newComment.trim()) return;

    try {
      const { data: comment, error } = await supabase
        .from('challenge_watchers')
        .insert({
          user_challenge_id: challenge.id,
          watcher_id: currentUser,
          comment: newComment.trim(),
          vote_type: 'comment'
        })
        .select(`
          id,
          watcher_id,
          comment,
          created_at,
          profiles!challenge_watchers_watcher_id_fkey(
            first_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [{
        id: comment.id,
        watcher_id: comment.watcher_id,
        comment: comment.comment,
        created_at: comment.created_at,
        user: {
          first_name: comment.profiles.length > 0 ? comment.profiles[0].first_name : 'Unknown',
          avatar_url: comment.profiles.length > 0 ? comment.profiles[0].avatar_url : null
        }
      }, ...prev]);

      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  if (isLoading || !challenge) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="default" />
        
        <Card className="p-4 mt-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <ProfileImage
                user={challenge.user}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-medium">{challenge.user.first_name}</span>
              <div className="text-sm text-gray-500">
                {new Date(challenge.date_time).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-[#BA2525]">{challenge.challenge.title || 'Mystery Date'}</h3>
              <span className="bg-[#ffeeee] text-[#BA2525] px-2 py-1 rounded-full text-sm capitalize">
                {challenge.challenge.level}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{challenge.challenge.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              📍 {challenge.venue}
            </div>
          </div>

          {challenge.proof_media_url && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={challenge.proof_media_url}
                alt="Challenge proof"
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVote}
                className="flex items-center gap-1 text-gray-600 hover:text-[#BA2525]"
              >
                <ThumbsUp className="w-5 h-5" />
                <span>{challenge.watcher_votes}</span>
              </button>
              <div className="flex items-center gap-1 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length}</span>
              </div>
            </div>
            <div className="text-sm">
              <span className={`px-2 py-1 rounded-full ${
                challenge.status === 'completed'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                {challenge.status === 'completed' ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>

          {/* Comment Input */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-grow p-2 border rounded-full focus:outline-none focus:border-[#BA2525]"
            />
            <button
              onClick={handleComment}
              disabled={!newComment.trim()}
              className="p-2 bg-[#BA2525] text-white rounded-full disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <ProfileImage
                    user={comment.user}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{comment.user.first_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{comment.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
} 