'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
  gender: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
  gender: string;
}

const useMatches = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  const fetchMatches = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('No profile found');
      setCurrentUser(userProfile);

      // Get existing date requests to exclude
      const { data: dateRequests } = await supabase
        .from('date_requests')
        .select('receiver_id')
        .eq('sender_id', user.id);

      const excludedIds = dateRequests?.map(r => r.receiver_id) || [];

      // Get new potential matches
      const { data: potentialMatches, error: matchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', userProfile.gender === 'male' ? 'female' : 'male')
        .neq('id', user.id);

      if (matchError) throw matchError;

      if (potentialMatches) {
        // Filter out users who already have date requests
        const availableMatches = potentialMatches.filter(
          match => !excludedIds.includes(match.id)
        );

        // Take first 5 matches
        const matchesToShow = availableMatches.slice(0, 5);
        setMatches(matchesToShow);

        // Store in match_feed
        const matchInserts = matchesToShow.map(match => ({
          user_id: user.id,
          potential_match_id: match.id
        }));

        await supabase.from('match_feed').insert(matchInserts);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRequest = async (matchId: string, venue: string, time: string) => {
    if (!currentUser) return false;

    try {
      // Create date request
      const { error: requestError } = await supabase
        .from('date_requests')
        .insert({
          sender_id: currentUser.id,
          receiver_id: matchId,
          venue: venue,
          proposed_time: new Date(time).toISOString(),
          status: 'pending'
        });

      if (requestError) throw requestError;

      // Remove match from local state
      setMatches(prev => prev.filter(match => match.id !== matchId));

      // If running low on matches, fetch more
      if (matches.length <= 2) {
        fetchMatches();
      }

      return true;
    } catch (error) {
      console.error('Error creating date request:', error);
      return false;
    }
  };

  return {
    isLoading,
    matches,
    currentUser,
    fetchMatches,
    handleDateRequest,
  };
};

// Rest of the component remains the same...
export default function MatchingPage() {
  const router = useRouter();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [dateLocation, setDateLocation] = useState('');
  const [dateTime, setDateTime] = useState('');

  const {
    isLoading,
    matches,
    currentUser,
    fetchMatches,
    handleDateRequest,
  } = useMatches();

  useEffect(() => {
    fetchMatches();
  }, []);

  const venues = [
    'Red Sox @Fenway Park',
    'Kured',
    'Museum of Fine Arts',
    'Lolita Back Bay',
    'Celtics Game @TD Garden',
    'Custom',
  ];

  const venueTimeSlots: { [key: string]: string[] } = {
    'Celtics Game @TD Garden': ['2024-11-10T19:30', '2024-11-15T20:00'],
    'Red Sox @Fenway Park': ['2024-04-05T13:30', '2024-04-06T18:00'],
  };

  const handleDateSubmit = async () => {
    if (!selectedMatch || !dateLocation || !dateTime) {
      alert('Please select a match, location, and time before sending a date request.');
      return;
    }

    const success = await handleDateRequest(selectedMatch.id, dateLocation, dateTime);

    if (success) {
      setSelectedMatch(null);
      setDateLocation('');
      setDateTime('');
      alert('Date request sent successfully!');
    } else {
      alert('Error sending date request. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Please sign in to see your matches</p>
        <button
          className="px-6 py-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
          onClick={() => router.push('/login')}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Your Matches
      </h2>

      {matches.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No matches available at the moment
          <button
            onClick={fetchMatches}
            className="mt-4 px-6 py-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
          >
            Find New Matches
          </button>
        </div>
      ) : (
        matches.map((match) => (
          <div
            key={match.id}
            className="border border-gray-200 rounded-lg p-5 mb-5 shadow-sm"
          >
            <div className="flex items-center mb-4">
              <div className="relative w-24 h-24 mr-4">
                <Image
                  src={match.avatar_url || '/default-avatar.png'}
                  alt={`${match.first_name} ${match.last_name}`}
                  fill
                  className="object-cover rounded-full"
                  priority
                />
              </div>
              <div>
                <h3 className="text-[#cc0000] text-xl font-medium mb-1">
                  {match.first_name} {match.last_name}, {match.age}
                </h3>
                <p className="text-gray-600 leading-relaxed">{match.bio}</p>
              </div>
            </div>
            <button
              className="px-6 py-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
              onClick={() => setSelectedMatch(match)}
            >
              Date
            </button>
          </div>
        ))
      )}

      {selectedMatch && (
        <div className="border border-gray-200 rounded-lg p-5 mt-5 shadow-sm">
          <h3 className="text-[#cc0000] text-xl font-medium mb-4">
            Set up your date with {selectedMatch.first_name}
          </h3>
          <select
            className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none focus:border-[#cc0000]"
            value={dateLocation}
            onChange={(e) => setDateLocation(e.target.value)}
          >
            <option value="">Select a venue</option>
            {venues.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>

          {dateLocation in venueTimeSlots ? (
            <select
              className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none focus:border-[#cc0000]"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            >
              <option value="">Select a time</option>
              {venueTimeSlots[dateLocation].map((slot) => (
                <option key={slot} value={slot}>
                  {new Date(slot).toLocaleString()}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none focus:border-[#cc0000]"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          )}

          <button
            className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
            onClick={handleDateSubmit}
          >
            Send Date Request
          </button>
        </div>
      )}

      <button
        className="w-full p-2.5 mt-5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={() => router.push('/dashboard')}
      >
        Back to Dashboard
      </button>
    </div>
  );
}