'use client';

import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { supabase } from '../../supabase/client';
import Header from '@/components/Header';
import ProfileImage from '../../components/ProfileImage';
import { Card } from '@/components/ui/card';
import Map from '@/components/Map';

interface Profile {
  id: string;
  first_name: string;
  age: number;
  avatar_url: string | null;
  bio: string;
  gender: 'male' | 'female' | 'other';
  preferred_gender: 'male' | 'female' | 'other';
  dater_archetype: 'cautiousDater' | 'hopelessRomantic' | 'serialDater' | 'commitmentSeeker' | 'friendWithBenefits';
  is_premium?: boolean;
  school?: string;
  dater_status?: 'gold' | 'silver' | 'bronze' | null;
  average_rating?: number;
  follow_through_rate?: number;
}

interface SuggestedDate {
  id: string;
  venue: string;
  proposedTime: string;
  matchedUser: Profile;
  compatibility: number;
  description: string;
}

interface DailyMatch {
  id: string;
  venue: string;
  proposed_time: string;
  compatibility: number;
  matched_user: Profile;
}

interface DatabaseMatch {
  id: string;
  venue: string;
  proposed_time: string;
  compatibility: number;
  matched_user: {
    id: string;
    first_name: string;
    age: number;
    avatar_url: string | null;
    bio: string;
    gender: 'male' | 'female' | 'other';
    preferred_gender: 'male' | 'female' | 'other';
    dater_archetype: 'cautiousDater' | 'hopelessRomantic' | 'serialDater' | 'commitmentSeeker' | 'friendWithBenefits';
    preferred_time?: 'morning' | 'afternoon' | 'evening';
    dater_status?: string;
    average_rating?: number;
    follow_through_rate?: number;
  };
}

const DEFAULT_AVATAR = '/images/default-avatar.png';
const DAILY_MATCH_LIMIT = 10;

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) {
    console.log('No avatar path provided, using default');
    return DEFAULT_AVATAR;
  }

  try {
    // If it's a static image or default avatar, return it directly
    if (avatarPath.includes('default-avatar') || avatarPath.startsWith('/images/')) {
      return avatarPath;
    }

    // Get the Supabase URL from environment variable
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('Supabase URL not found in environment');
      return DEFAULT_AVATAR;
    }

    // If it's already a full URL, clean it up
    if (avatarPath.startsWith('http')) {
      const url = new URL(avatarPath);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      return `${supabaseUrl}/storage/v1/object/public/avatars/${filename}`;
    }

    // For relative paths, clean up the filename
    const filename = avatarPath
      .replace(/^avatars\//, '')  // Remove leading avatars/
      .split('?')[0];             // Remove query parameters

    // Return the direct public URL
    return `${supabaseUrl}/storage/v1/object/public/avatars/${filename}`;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return DEFAULT_AVATAR;
  }
};

const getRandomVenueForArchetype = (archetype: string): string => {
  const venuesByArchetype: Record<string, string[]> = {
    'cautiousDater': ['Kured', 'The Clay Room', 'Joes on Newbury', 'Cityside Tavern'],
    'hopelessRomantic': ['Barcelona Wine Bar', 'Museum of Fine Arts', 'Blue Ribbon Sushi', 'Boston Commons'],
    'serialDater': ['Boston Bruins', 'BC Basketball', 'F1 Arcade', 'Lolita Back Bay'],
    'commitmentSeeker': ['BC Hockey', 'Celtics', 'Lucca North End', 'Barcelona Wine Bar'],
    'friendWithBenefits': ['Capo', 'Boston Bruins', 'F1 Arcade', 'Cityside Tavern']
  };

  const venues = venuesByArchetype[archetype] || venuesByArchetype['cautiousDater'];
  return venues[Math.floor(Math.random() * venues.length)];
};

const getTimeForPreference = (preferredTime: string, date: Date, venue: string): Date => {
  const newDate = new Date(date);
  
  // Define venue types
  const activityVenues = ['The Clay Room', 'Museum of Fine Arts', 'Boston Commons', 'Boston Duck Tour', 'F1 Arcade', 'Core Power', '[solidcore]'];
  const restaurantVenues = ['Blue Ribbon Sushi', 'Barcelona Wine Bar', 'Kured', 'Joes on Newbury', 'Lolita Back Bay', 'Lucca North End', 'Capo', "Loretta's Last Call", 'Cityside Tavern'];
  const sportsVenues = ['Boston Bruins', 'BC Basketball', 'BC Hockey', 'Celtics'];
  
  let timeRange: number[];
  
  if (activityVenues.includes(venue)) {
    // Activities: 1-3 PM
    timeRange = [13, 14, 15];
  } else if (restaurantVenues.includes(venue)) {
    // Restaurants: 6-8 PM
    timeRange = [18, 19, 20];
  } else if (sportsVenues.includes(venue)) {
    // Sports: 7-9 PM
    timeRange = [19, 20, 21];
  } else {
    // Default to afternoon
    timeRange = [13, 14, 15];
  }
  
  // Get random hour from the appropriate range
  const randomHour = timeRange[Math.floor(Math.random() * timeRange.length)];
  
  // Get random minutes (0, 15, 30, 45)
  const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  
  newDate.setHours(randomHour, minutes, 0, 0);
  return newDate;
};

type ArchetypeKey = 'Cautious Dater' | 'Hopeless Romantic' | 'Serial Dater' | 'Commitment Seeker' | 'Friend with Benefits';

type CompatibilityMatrix = {
  [K in ArchetypeKey]: {
    [L in ArchetypeKey]: number;
  };
};

const calculateArchetypeCompatibility = (userArchetype: string, matchArchetype: string): number => {
  const compatibilityMatrix: CompatibilityMatrix = {
    'Cautious Dater': {
      'Cautious Dater': 95,
      'Hopeless Romantic': 85,
      'Serial Dater': 40,
      'Commitment Seeker': 90,
      'Friend with Benefits': 30
    },
    'Hopeless Romantic': {
      'Cautious Dater': 85,
      'Hopeless Romantic': 95,
      'Serial Dater': 70,
      'Commitment Seeker': 90,
      'Friend with Benefits': 30
    },
    'Serial Dater': {
      'Cautious Dater': 40,
      'Hopeless Romantic': 70,
      'Serial Dater': 95,
      'Commitment Seeker': 80,
      'Friend with Benefits': 85
    },
    'Commitment Seeker': {
      'Cautious Dater': 90,
      'Hopeless Romantic': 90,
      'Serial Dater': 80,
      'Commitment Seeker': 95,
      'Friend with Benefits': 30
    },
    'Friend with Benefits': {
      'Cautious Dater': 30,
      'Hopeless Romantic': 30,
      'Serial Dater': 85,
      'Commitment Seeker': 30,
      'Friend with Benefits': 95
    }
  };

  // Convert database archetype format to matrix format
  const formatArchetype = (dbArchetype: string): ArchetypeKey => {
    const mapping: { [key: string]: ArchetypeKey } = {
      'cautiousDater': 'Cautious Dater',
      'hopelessRomantic': 'Hopeless Romantic',
      'serialDater': 'Serial Dater',
      'commitmentSeeker': 'Commitment Seeker',
      'friendWithBenefits': 'Friend with Benefits'
    };
    return mapping[dbArchetype] || 'Commitment Seeker';
  };

  const formattedUserArchetype = formatArchetype(userArchetype);
  const formattedMatchArchetype = formatArchetype(matchArchetype);

  return compatibilityMatrix[formattedUserArchetype]?.[formattedMatchArchetype] || 70;
};

const venueCoordinates: Record<string, [number, number]> = {
  'Blue Ribbon Sushi': [-71.0594, 42.3551],
  'Barcelona Wine Bar': [-71.0761, 42.3457],
  'Boston Commons': [-71.0670, 42.3554],
  'Museum of Fine Arts': [-71.0942, 42.3394],
  'Boston Bruins': [-71.0622, 42.3663],
  'BC Basketball': [-71.1677, 42.3357],
  'BC Hockey': [-71.1677, 42.3357],
  'Celtics': [-71.0622, 42.3663],
  'F1 Arcade': [-71.0595, 42.3501],
  'The Clay Room': [-71.1317, 42.3396],
  'Kured': [-71.0712, 42.3589],
  'Joes on Newbury': [-71.0793, 42.3491],
  'Lolita Back Bay': [-71.0816, 42.3486],
  'Lucca North End': [-71.0567, 42.3647],
  'Capo': [-71.0472, 42.3359],
  'Boston Duck Tour': [-71.0737, 42.3587],
  "Loretta's Last Call": [-71.0950, 42.3467],
  'Cityside Tavern': [-71.1502, 42.3359],
  'Core Power': [-71.1921, 42.3485],
  '[solidcore]': [-71.1561, 42.3644]
};

export default function MatchingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedDates, setSuggestedDates] = useState<SuggestedDate[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastMatchDate, setLastMatchDate] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeDown = distance < -50;
    const isSwipeUp = distance > 50;
    
    if (isSwipeUp && currentIndex < suggestedDates.length - 1) {
      navigateToDate(currentIndex + 1);
    } else if (isSwipeDown && currentIndex > 0) {
      navigateToDate(currentIndex - 1);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const navigateToDate = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found');
          return;
        }
        console.log('Current user ID:', user.id);

        // Fetch current user's profile
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userProfile) {
          console.log('Found user profile:', userProfile);
          setCurrentUser(userProfile);
        } else {
          console.log('No user profile found');
          return;
        }

        // Fetch all potential matches from profiles table
        console.log('Fetching potential matches for user:', user.id);
        let query = supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);

        // Only add gender filters if both values are set
        if (userProfile.preferred_gender && userProfile.gender) {
          query = query
            .eq('gender', userProfile.preferred_gender)
            .eq('preferred_gender', userProfile.gender);
        }

        // Only filter by school if it's set
        if (userProfile.school) {
          query = query.eq('school', userProfile.school);
        }

        const { data: potentialMatches, error: matchError } = await query;

        if (matchError) {
          console.error('Error in matches query:', matchError);
          throw matchError;
        }

        console.log('Raw potential matches:', potentialMatches);

        if (potentialMatches && potentialMatches.length > 0) {
          console.log('Processing matches...');
          // Shuffle the matches array
          const shuffledMatches = [...potentialMatches].sort(() => Math.random() - 0.5);
          
          const processedDates = shuffledMatches.map((match: Profile) => {
            // Calculate compatibility score
            const compatibility = calculateArchetypeCompatibility(userProfile.dater_archetype, match.dater_archetype);
            
            // Generate a venue based on the matched user's archetype
            const venue = getRandomVenueForArchetype(match.dater_archetype);
            console.log('Generated venue for match:', venue);
            
            // Generate time based on venue type
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() + 3); // Schedule for 3 days from now
            const proposedTime = getTimeForPreference('afternoon', baseDate, venue);
            console.log('Generated time for match:', proposedTime);

            return {
              id: crypto.randomUUID(),
              venue,
              proposedTime: proposedTime.toISOString(),
              matchedUser: {
                ...match,
                dater_status: match.dater_status || null,
                average_rating: match.average_rating || 0,
                follow_through_rate: match.follow_through_rate || 0
              } as Profile,
              compatibility,
              description: `Based on your ${compatibility}% compatibility and shared interests`
            };
          });

          console.log('Processed dates:', processedDates);
          setSuggestedDates(processedDates);
        } else {
          console.log('No potential matches found');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleAccept = async () => {
    const currentDate = suggestedDates[currentIndex];
    if (!currentDate) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // Create a date request with split_payment as a number
      const { data: dateRequest, error: dateRequestError } = await supabase
        .from('date_requests')
        .insert({
          sender_id: user.id,
          receiver_id: currentDate.matchedUser.id,
          venue: currentDate.venue,
          proposed_time: currentDate.proposedTime,
          status: 'pending',
          split_payment: 0
        })
        .select()
        .single();

      if (dateRequestError) {
        console.error('Error creating date request:', dateRequestError);
        return;
      }

      // Navigate to the dashboard after sending the request
      router.push('/dashboard');
    } catch (error) {
      console.error('Error in handleAccept:', error);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
      </div>
    );
  }

  const currentDate = suggestedDates[currentIndex];

  if (!currentDate) {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="max-w-6xl mx-auto p-5">
          <Header variant="matching" />
          <div className="text-center mt-10">
            <h2 className="text-2xl font-bold text-[#BA2525]">No More Matches Available</h2>
            <p className="text-gray-600 mt-2">Check back later for new matches!</p>
          </div>
        </div>
        <BottomNav />
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
        <div className="max-w-6xl mx-auto p-5">
          <Header variant="matching" />
          
          <h1 className="text-3xl font-bold text-[#BA2525] mt-8 mb-8 text-center">Your Curated Dates</h1>

          <div className="max-w-md mx-auto relative">
            {/* Previous Arrow */}
            <button
              onClick={() => navigateToDate(currentIndex - 1)}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-4 ${
                currentIndex > 0 ? 'text-[#BA2525] hover:opacity-80' : 'text-gray-200'
              } transition-opacity text-2xl`}
              disabled={currentIndex === 0}
              aria-label="Previous date"
            >
              ▲
            </button>

            <Card className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white w-full">
              <div className="flex flex-col items-center">
                <div 
                  className="relative w-full h-64 mb-4 cursor-pointer"
                  onClick={() => router.push(`/profile/${currentDate.matchedUser.id}`)}
                >
                  <ProfileImage
                    user={{
                      avatar_url: currentDate.matchedUser.avatar_url || DEFAULT_AVATAR,
                      first_name: currentDate.matchedUser.first_name || 'Profile'
                    }}
                    priority={true}
                  />
                </div>
                
                <h2 className="text-2xl font-semibold mb-4 text-[#BA2525]">
                  {currentDate.matchedUser.first_name}{typeof currentDate.matchedUser.age !== 'undefined' && currentDate.matchedUser.age !== null ? `, ${currentDate.matchedUser.age}` : ''}
                </h2>

                {/* Stats Grid */}
                <div 
                  className="grid grid-cols-3 gap-4 w-full mb-6 cursor-pointer"
                  onClick={() => router.push(`/profile/${currentDate.matchedUser.id}`)}
                >
                  <div className="flex flex-col items-center px-6 py-2.5 rounded-[40px] bg-red-50 hover:bg-red-100 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#BA2525] text-base">
                      <span>♔</span>
                      <span className="text-[#BA2525] font-medium capitalize">
                        {(currentDate.matchedUser.dater_status || 'bronze').charAt(0).toUpperCase() + 
                         (currentDate.matchedUser.dater_status || 'bronze').slice(1)}
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs whitespace-nowrap">
                      Dater Status
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-6 py-2.5 rounded-[40px] bg-red-50 hover:bg-red-100 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#BA2525] text-base">
                      <span>★</span>
                      <span>{(currentDate.matchedUser.average_rating || 0).toFixed(1)}</span>
                    </div>
                    <div className="text-gray-600 text-xs whitespace-nowrap">
                      Dater Rating
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-6 py-2.5 rounded-[40px] bg-red-50 hover:bg-red-100 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#BA2525] text-base">
                      <span>♥</span>
                      <span>{currentDate.matchedUser.follow_through_rate || '0'}%</span>
                    </div>
                    <div className="text-gray-600 text-xs whitespace-nowrap">
                      Follow-Through
                    </div>
                  </div>
                </div>

                {/* Venue and Time Info */}
                <div className="bg-red-50 rounded-[24px] p-4 w-full mb-6">
                  <div className="text-gray-600 text-sm space-y-2">
                    <p className="flex items-center gap-2">
                      <span className="text-[#BA2525]">📍</span>
                      <span className="text-[#BA2525] font-medium">{currentDate.venue}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[#BA2525]">🗓</span>
                      <span className="text-[#BA2525] font-medium">
                        {new Date(currentDate.proposedTime).toLocaleString('en-US', {
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

                  {/* Map Component */}
                  <div className="mt-4 h-[200px] rounded-lg overflow-hidden">
                    <Map
                      center={venueCoordinates[currentDate.venue] || [-71.0589, 42.3601]}
                      zoom={14}
                      markers={[
                        {
                          coordinates: venueCoordinates[currentDate.venue] || [-71.0589, 42.3601],
                          title: currentDate.venue
                        }
                      ]}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 w-full">
                  <button
                    className='w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors'
                    onClick={handleAccept}
                  >
                    Accept Date
                  </button>
                  <button
                    onClick={() => router.push(`/send-date-request/${currentDate.matchedUser.id}`)}
                    className='w-full p-2.5 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
                  >
                    Send Other Date Request
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${currentDate.matchedUser.id}`)}
                    className='w-full p-2.5 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </Card>

            {/* Next Arrow */}
            <button
              onClick={() => navigateToDate(currentIndex + 1)}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-4 ${
                currentIndex < suggestedDates.length - 1 ? 'text-[#BA2525] hover:opacity-80' : 'text-gray-200'
              } transition-opacity text-2xl`}
              disabled={currentIndex === suggestedDates.length - 1}
              aria-label="Next date"
            >
              ▼
            </button>

            {/* Match Count */}
            <div className="text-[#BA2525] font-medium text-center mt-6">
              {currentIndex + 1} / {suggestedDates.length}
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    </>
  );
}