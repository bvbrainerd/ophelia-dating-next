'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import Map from '@/components/Map';
import ProfileImage from '@/components/ProfileImage';
import { Card } from '@/components/ui/card';
import { getVenueForArchetype } from '../../../utils/venues';
import BottomNav from '@/components/BottomNav';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
  is_premium?: boolean;
  dater_archetype: string;
}

interface SuggestedDate {
  id: string;
  venue: string;
  proposedTime: string;
  matchedUser: Profile;
  compatibility: number;
  description: string;
  status?: 'denied' | 'accepted' | null;
}

const VENUE_COORDINATES: { [key: string]: [number, number] } = {
  'Boston Bruins': [-71.0622, 42.3663],
  'Celtics': [-71.0622, 42.3663],
  'BC Hockey': [-71.1677, 42.3357],
  'BC Basketball': [-71.1677, 42.3357],
  'Museum of Fine Arts': [-71.0995, 42.3394],
  'Barcelona Wine Bar': [-71.0761, 42.3457],
  'Boston Commons': [-71.0640, 42.3554],
  'Kured': [-71.0712, 42.3589],
  'The Clay Room': [-71.1317, 42.3396],
  'Joes on Newbury': [-71.0793, 42.3491],
  'Private Helicopter Ride': [-71.0217, 42.3656],
  'Boston Duck Tour': [-71.0737, 42.3587],
  'F1 Arcade': [-71.0595, 42.3501],
  'Lucca North End': [-71.0547, 42.3645],
  'Blue Ribbon Sushi': [-71.0712, 42.3589],
  'Lolita Back Bay': [-71.0695, 42.3475],
  'Capo': [-71.0471, 42.3355],
  'Lorettas Last Call': [-71.0953, 42.3467],
  'Cityside Tavern': [-71.1502, 42.3359]
};

// Add compatibility calculation
function calculateArchetypeCompatibility(userArchetype: string, matchedArchetype: string): number {
  // Same archetype = highest compatibility
  if (userArchetype === matchedArchetype) {
    return Math.floor(Math.random() * 6 + 90); // 90-95%
  }

  // Define compatible pairs
  const compatibilityPairs: { [key: string]: string[] } = {
    'cautiousDater': ['hopelessRomantic', 'commitmentSeeker'],
    'hopelessRomantic': ['cautiousDater', 'commitmentSeeker', 'serialDater'],
    'serialDater': ['commitmentSeeker', 'hopelessRomantic', 'serialDater'],
    'commitmentSeeker': ['cautiousDater', 'hopelessRomantic', 'commitmentSeeker'],
    'friendWithBenefits': ['serialDater', 'friendWithBenefits']
  };

  // Check if archetypes are compatible
  if (compatibilityPairs[userArchetype]?.includes(matchedArchetype)) {
    return Math.floor(Math.random() * 6 + 80); // 80-85%
  }

  // Not directly compatible
  return Math.floor(Math.random() * 11 + 60); // 60-70%
}

export default function DateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [suggestedDate, setSuggestedDate] = useState<SuggestedDate | null>(null);
  const [venueCoordinates, setVenueCoordinates] = useState<[number, number] | null>(null);
  const [deniesRemaining, setDeniesRemaining] = useState(5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allDates, setAllDates] = useState<SuggestedDate[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeDown = distance < -50;
    const isSwipeUp = distance > 50;
    
    if (isSwipeUp && currentIndex < allDates.length - 1) {
      navigateToDate(currentIndex + 1);
    } else if (isSwipeDown && currentIndex > 0) {
      navigateToDate(currentIndex - 1);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle keyboard events for navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        navigateToDate(currentIndex - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < allDates.length - 1) {
        navigateToDate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, allDates.length]);

  const navigateToDate = (index: number) => {
    setCurrentIndex(index);
    const date = allDates[index];
    if (date) {
      setSuggestedDate(date);
      // Update URL without full page reload
      window.history.pushState({}, '', `/date-details/${date.id}`);
    }
  };

  const fetchDateDetails = async () => {
    try {
      setIsLoading(true);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth/login');
        return;
      }

      // Get current user profile
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (currentUserError) {
        console.error('Error fetching current user:', currentUserError);
        return;
      }

      setCurrentUser(currentUserData);

      // Get current match ID from params and remove any timestamp
      const fullId = params.id as string;
      const baseId = fullId.split('-1')[0]; // Remove timestamp if present
      console.log('Attempting to fetch match with ID:', baseId);

      // First try to get the match from localStorage
      const storedMatches = localStorage.getItem('todayMatches');
      let matchFromStorage = null;
      
      if (storedMatches) {
        const parsedMatches = JSON.parse(storedMatches);
        matchFromStorage = parsedMatches.find((match: any) => match.id === baseId);
        console.log('Found match in storage:', matchFromStorage);
      }

      // If we found it in storage, use that
      if (matchFromStorage) {
        console.log('Using match from storage:', matchFromStorage);
        setSuggestedDate(matchFromStorage);
        setVenueCoordinates(VENUE_COORDINATES[matchFromStorage.venue] || [-71.0589, 42.3601]);
        const parsedMatches = JSON.parse(storedMatches || '[]');
        setAllDates(parsedMatches);
        setCurrentIndex(parsedMatches.findIndex((match: any) => match.id === baseId));
        setIsLoading(false);
        return;
      }

      // If not in storage, try to get from database
      const { data: specificMatch, error: specificError } = await supabase
        .from('daily_matches')
        .select(`
          *,
          matched_user:profiles!daily_matches_matched_user_id_fkey(*)
        `)
        .eq('id', baseId)
        .maybeSingle();

      console.log('Specific match query:', {
        match: specificMatch,
        error: specificError,
        baseId,
        userId: session.user.id
      });

      if (specificError || !specificMatch) {
        console.error('Error fetching match:', specificError || 'Match not found');
        
        // Try to find any match that involves this user
        const { data: userMatches, error: userMatchesError } = await supabase
          .from('daily_matches')
          .select(`
            *,
            matched_user:profiles!daily_matches_matched_user_id_fkey(*)
          `)
          .or(`user_id.eq.${session.user.id},matched_user_id.eq.${session.user.id}`);

        console.log('User matches query:', {
          matches: userMatches,
          error: userMatchesError,
          userId: session.user.id
        });

        if (userMatchesError) {
          console.error('Error fetching user matches:', userMatchesError);
          router.push('/matching');
          return;
        }

        // Try to find the match in user's matches
        const matchFromAll = userMatches?.find(match => match.id === baseId);
        if (!matchFromAll) {
          console.log('Match not found in any results:', {
            baseId,
            matchCount: userMatches?.length || 0,
            userIdFromSession: session.user.id,
            availableIds: userMatches?.map(m => m.id),
            allMatches: userMatches
          });
          router.push('/matching');
          return;
        }

        matchFromStorage = matchFromAll;
      } else {
        matchFromStorage = specificMatch;
      }

      // Process the found match
      const currentMatch = {
        id: matchFromStorage.id,
        venue: matchFromStorage.venue,
        proposedTime: matchFromStorage.proposed_time,
        matchedUser: matchFromStorage.matched_user,
        compatibility: matchFromStorage.compatibility,
        description: `Based on your compatibility and shared interests`,
        status: matchFromStorage.status
      };

      setSuggestedDate(currentMatch);
      setVenueCoordinates(VENUE_COORDINATES[currentMatch.venue] || [-71.0589, 42.3601]);

      // Get all matches for navigation
      const { data: allMatches, error: allMatchesError } = await supabase
        .from('daily_matches')
        .select(`
          *,
          matched_user:profiles!daily_matches_matched_user_id_fkey(*)
        `)
        .or(`user_id.eq.${session.user.id},matched_user_id.eq.${session.user.id}`);

      if (allMatchesError) {
        console.error('Error fetching all matches:', allMatchesError);
        // We can still show the current match
        setAllDates([currentMatch]);
        setCurrentIndex(0);
        setIsLoading(false);
        return;
      }

      if (allMatches && allMatches.length > 0) {
        const processedDates = allMatches.map(match => ({
          id: match.id,
          venue: match.venue,
          proposedTime: match.proposed_time,
          matchedUser: match.matched_user,
          compatibility: match.compatibility,
          description: `Based on your compatibility and shared interests`,
          status: match.status
        }));

        setAllDates(processedDates);
        setCurrentIndex(processedDates.findIndex(date => date.id === matchFromStorage.id));
      } else {
        setAllDates([currentMatch]);
        setCurrentIndex(0);
      }

      setIsLoading(false);

    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
      router.push('/matching');
    }
  };

  useEffect(() => {
    fetchDateDetails();
  }, [params.id, router]);

  // Update venue coordinates when navigating between dates
  useEffect(() => {
    if (suggestedDate) {
      setVenueCoordinates(VENUE_COORDINATES[suggestedDate.venue] || [-71.0589, 42.3601]);
    }
  }, [suggestedDate]);

  const handleAcceptDate = async () => {
    if (!suggestedDate) return;

    // Update UI state first
    const updatedDates = allDates.map(date => 
      date.id === suggestedDate.id ? { ...date, status: 'accepted' as const } : date
    );
    setAllDates(updatedDates);

    // Get the base ID without timestamp
    const baseId = suggestedDate.id.split('-1')[0];
    console.log('Updating match status for ID:', baseId);

    // Update the status in the database
    try {
      const { error: updateError } = await supabase
        .from('daily_matches')
        .update({ status: 'accepted' })
        .eq('id', baseId);

      if (updateError) {
        console.error('Error updating match status:', updateError);
        return;
      }

      // After successful database update, redirect to payment
      const stripeLinks: { [key: string]: string } = {
        'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
        'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
        'BC Hockey': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
        'BC Basketball': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
        'Museum of Fine Arts': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
        'Barcelona Wine Bar': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
        'Boston Commons': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
        'Kured': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
        'The Clay Room': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
        'Joes on Newbury': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
        'Private Helicopter Ride': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
        'Boston Duck Tour': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
        'F1 Arcade': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
        'Lucca North End': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
        'Blue Ribbon Sushi': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
        'Lolita Back Bay': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
        'Capo': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
        'Lorettas Last Call': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc'
      };

      const stripeLink = stripeLinks[suggestedDate.venue] || stripeLinks['BC Basketball'];
      
      // Open payment page in new tab and go back to matches
      window.open(stripeLink, '_blank', 'noopener,noreferrer');
      router.push('/matching');
    } catch (error) {
      console.error('Error updating match status:', error);
    }
  };

  const handleDenyDate = () => {
    if (deniesRemaining > 0 && suggestedDate) {
      setDeniesRemaining(prev => prev - 1);
      
      // Update date status
      const updatedDates = allDates.map(date => 
        date.id === suggestedDate.id ? { ...date, status: 'denied' as const } : date
      );
      setAllDates(updatedDates);

      // Move to next date if available
      if (currentIndex < allDates.length - 1) {
        navigateToDate(currentIndex + 1);
      } else {
        router.push('/matching');
      }
    }
  };

  if (isLoading || !suggestedDate) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="min-h-screen bg-white pb-24"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-4xl mx-auto p-5">
          {deniesRemaining === 0 && (
            <div className="bg-[#ffeeee] p-4 rounded-lg mb-6">
              <p className="text-[#BA2525] font-medium text-center">
                You've used all your denies (5/10). You can only accept the remaining dates!
              </p>
            </div>
          )}

          <Card className="p-6 mb-6">
            <div className="flex items-center gap-6 mb-6">
              <div 
                onClick={() => router.push(`/profile/${suggestedDate.matchedUser.id.split('-1')[0]}`)}
                className="relative w-32 h-32 flex-shrink-0 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="absolute inset-0">
                  <ProfileImage 
                    user={{
                      ...suggestedDate.matchedUser,
                      first_name: suggestedDate.matchedUser.first_name || '',
                      avatar_url: suggestedDate.matchedUser.avatar_url || null
                    }}
                    className="w-full h-full object-cover"
                    priority={true}
                  />
                </div>
              </div>
              <div 
                onClick={() => router.push(`/profile/${suggestedDate.matchedUser.id.split('-1')[0]}`)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-[#BA2525]">
                    {suggestedDate.matchedUser.first_name}, {suggestedDate.matchedUser.age}
                  </h1>
                  <div className="bg-[#BA2525] text-white px-3 py-1 rounded-full text-sm">
                    {suggestedDate.compatibility}% Match
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="flex flex-col items-center px-6 py-2 rounded-full bg-red-50 text-center">
                    <div className="flex items-center gap-2 text-[#BA2525]">
                      <span>♔</span>
                      <span>Bronze</span>
                    </div>
                    <div className="text-xs text-gray-500">Dater Status</div>
                  </div>
                  <div className="flex flex-col items-center px-6 py-2 rounded-full bg-red-50 text-center">
                    <div className="flex items-center gap-2 text-[#BA2525]">
                      <span>★</span>
                      <span>0.0</span>
                    </div>
                    <div className="text-xs text-gray-500">Dater Rating</div>
                  </div>
                  <div className="flex flex-col items-center px-6 py-2 rounded-full bg-red-50 text-center">
                    <div className="flex items-center gap-2 text-[#BA2525]">
                      <span>♥</span>
                      <span>0%</span>
                    </div>
                    <div className="text-xs text-gray-500">Follow-Through</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Date Details</h2>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  📍 <span className="font-medium">{suggestedDate.venue}</span>
                </p>
                <p className="flex items-center gap-2">
                  🗓 <span className="font-medium">
                    {new Date(suggestedDate.proposedTime).toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </p>
              </div>
            </div>

            {venueCoordinates && (
              <div className="mb-6 h-[300px] rounded-lg overflow-hidden">
                <Map center={venueCoordinates} zoom={15} markers={[{ coordinates: venueCoordinates, title: suggestedDate.venue }]} />
              </div>
            )}

            <div className="flex gap-4 flex-col">
              <button
                onClick={handleAcceptDate}
                className="w-full p-3 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors"
              >
                Accept Date
              </button>
              <button
                onClick={() => router.push(`/send-date-request/${suggestedDate.matchedUser.id.split('-1')[0]}`)}
                className="w-full p-3 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
              >
                Send Other Date Request
              </button>
              {deniesRemaining > 0 && (
                <button
                  onClick={handleDenyDate}
                  className="w-full p-3 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
                >
                  Deny Date ({deniesRemaining} left)
                </button>
              )}
            </div>

            <div className="mt-4 flex justify-center gap-4 items-center">
              <button
                onClick={() => currentIndex > 0 && navigateToDate(currentIndex - 1)}
                className={`p-2 ${currentIndex > 0 ? 'text-[#BA2525]' : 'text-gray-300'} text-xl`}
                aria-label="Previous date"
              >
                ▲
              </button>
              <span className="text-[#BA2525]">
                {currentIndex + 1} / {allDates.length}
              </span>
              <button
                onClick={() => currentIndex < allDates.length - 1 && navigateToDate(currentIndex + 1)}
                className={`p-2 ${currentIndex < allDates.length - 1 ? 'text-[#BA2525]' : 'text-gray-300'} text-xl`}
                aria-label="Next date"
              >
                ▼
              </button>
            </div>
          </Card>
        </div>
      </div>
      <BottomNav />
    </>
  );
} 