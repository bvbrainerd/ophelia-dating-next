'use client';

import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { supabase } from '../../supabase/client';
import Header from '@/components/Header';
import ProfileImage from '@/components/ProfileImage';
import { Card } from '@/components/ui/card';
import Map from '@/components/Map';
import { Heart } from 'lucide-react';
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react';

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

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

interface DatabaseMembership {
  groups: {
    id: string;
    name: string;
  }[];
}

interface SupabaseMembership {
  groups: {
    id: string;
    name: string;
  };
}

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
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

interface CuratedDate {
  id: string;
  venue: string;
  proposed_time: string;
  description: string;
  price_range: string;
  date_type: string;
  availability: boolean;
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
  const barVenues = ['Lolita Back Bay', 'Capo', "Loretta's Last Call", 'Cityside Tavern', 'Bell in Hand', 'Cask n Flagon'];
  
  let timeRange: number[];
  let minuteOptions: number[] = [0, 30]; // Default to on the hour or half hour
  
  if (barVenues.includes(venue)) {
    // Bars: 5-10 PM
    timeRange = [17, 18, 19, 20, 21, 22];
    minuteOptions = [0, 30]; // Only on the hour or half hour for bars
  } else if (activityVenues.includes(venue)) {
    // Activities: 1-3 PM
    timeRange = [13, 14, 15];
    minuteOptions = [0, 15, 30, 45];
  } else if (restaurantVenues.includes(venue)) {
    // Restaurants: 6-8 PM
    timeRange = [18, 19, 20];
    minuteOptions = [0, 15, 30, 45];
  } else if (sportsVenues.includes(venue)) {
    // Sports: 7-9 PM
    timeRange = [19, 20, 21];
    minuteOptions = [0, 30];
  } else {
    // Default to afternoon
    timeRange = [13, 14, 15];
    minuteOptions = [0, 15, 30, 45];
  }
  
  // Get random hour from the appropriate range
  const randomHour = timeRange[Math.floor(Math.random() * timeRange.length)];
  
  // Get random minutes from the appropriate options
  const minutes = minuteOptions[Math.floor(Math.random() * minuteOptions.length)];
  
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
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    archetype: '',
    school: '',
    minAge: '',
    maxAge: '',
    searchQuery: '',
    selectedGroup: ''
  });
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [curatedDates, setCuratedDates] = useState<CuratedDate[]>([]);
  const [error, setError] = useState('');
  const [userStatus, setUserStatus] = useState<'single' | 'in_relationship' | null>(null);
  
  const PROFILES_PER_PAGE = 10;
  const archetypeOptions = [
    { value: 'cautiousDater', label: 'Cautious Dater' },
    { value: 'hopelessRomantic', label: 'Hopeless Romantic' },
    { value: 'serialDater', label: 'Serial Dater' },
    { value: 'commitmentSeeker', label: 'Commitment Seeker' },
    { value: 'friendWithBenefits', label: 'Friend with Benefits' }
  ];

  const schoolOptions = [
    { value: 'Boston College', label: 'Boston College' },
    { value: 'Harvard', label: 'Harvard' },
    { value: 'MIT', label: 'MIT' },
    { value: 'Northeastern', label: 'Northeastern' },
    { value: 'Boston University', label: 'Boston University' }
  ];

  const filteredProfiles = suggestedDates.filter(profile => {
    // Filter by search query first
    if (filters.searchQuery && !profile.matchedUser.first_name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
    // Then apply other filters
    if (filters.archetype && profile.matchedUser.dater_archetype !== filters.archetype) return false;
    if (filters.school && profile.matchedUser.school !== filters.school) return false;
    if (filters.minAge && profile.matchedUser.age < parseInt(filters.minAge)) return false;
    if (filters.maxAge && profile.matchedUser.age > parseInt(filters.maxAge)) return false;
    return true;
  }).sort((a, b) => {
    // Sort profiles with avatar_url first
    if (a.matchedUser.avatar_url && !b.matchedUser.avatar_url) return -1;
    if (!a.matchedUser.avatar_url && b.matchedUser.avatar_url) return 1;
    return 0;
  });

  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * PROFILES_PER_PAGE,
    currentPage * PROFILES_PER_PAGE
  );

  const totalPages = Math.ceil(filteredProfiles.length / PROFILES_PER_PAGE);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('couple_status')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserStatus(profile.couple_status);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, []);

  useEffect(() => {
    if (userStatus === 'in_relationship') {
      fetchCuratedDates();
    } else if (userStatus === 'single') {
      fetchMatches();
    }
  }, [userStatus]);

  const fetchCuratedDates = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: dates, error: datesError } = await supabase
        .from('curated_dates')
        .select(`
          id,
          venue,
          proposed_time,
          description,
          price_range,
          date_type,
          availability
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (datesError) throw datesError;

      setCuratedDates(dates || []);
    } catch (error) {
      console.error('Error fetching curated dates:', error);
      setError('Failed to load curated dates');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        // Clear any stale session data
        await supabase.auth.signOut();
        router.push('/auth/login');
        return;
      }

      if (!session?.user) {
        console.log('No active session found');
        router.push('/auth/login');
        return;
      }

      // Verify the session is still valid with a token refresh attempt
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        await supabase.auth.signOut();
        router.push('/auth/login');
        return;
      }

      // Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) throw profileError;

      // Fetch all potential matches from profiles table
      console.log('Fetching potential matches for user:', session.user.id);
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', session.user.id);

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
        const processedMatches = potentialMatches.map((match: Profile) => {
          const venue = getRandomVenueForArchetype(match.dater_archetype);
          return {
            id: crypto.randomUUID(),
            venue,
            proposedTime: getTimeForPreference('afternoon', new Date(), venue).toISOString(),
            matchedUser: {
              ...match,
              dater_status: match.dater_status || 'bronze',
              average_rating: match.average_rating || 0,
              follow_through_rate: match.follow_through_rate || 0
            },
            compatibility: calculateArchetypeCompatibility(userProfile.dater_archetype, match.dater_archetype),
            description: `Based on your compatibility and shared interests`
          };
        });

        setSuggestedDates(processedMatches);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberships, error: membershipError } = await supabase
          .from('group_members')
          .select(`
            groups!inner (
              id,
              name
            )
          `)
          .eq('user_id', user.id) as SupabaseResponse<SupabaseMembership[]>;

        if (membershipError) throw membershipError;

        if (memberships) {
          const groups = memberships.map(m => ({
            id: m.groups.id,
            name: m.groups.name,
            memberCount: 0
          }));
          setUserGroups(groups);
        }
      } catch (error) {
        console.error('Error fetching user groups:', error);
      }
    };

    fetchUserGroups();
  }, []);

  const handleSearch = async (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(8);

      if (error) throw error;
      
      // Update search results for dropdown
      setSearchResults(data || []);
      
      // Update suggestedDates for the main grid
      if (data && data.length > 0) {
        const processedMatches = data.map((match: Profile) => {
          const venue = getRandomVenueForArchetype(match.dater_archetype);
          return {
            id: crypto.randomUUID(),
            venue,
            proposedTime: getTimeForPreference('afternoon', new Date(), venue).toISOString(),
            matchedUser: {
              ...match,
              dater_status: match.dater_status || 'bronze',
              average_rating: match.average_rating || 0,
              follow_through_rate: match.follow_through_rate || 0
            },
            compatibility: calculateArchetypeCompatibility(currentUser?.dater_archetype || 'commitmentSeeker', match.dater_archetype),
            description: `Based on your compatibility and shared interests`
          };
        });
        setSuggestedDates(processedMatches);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendDateRequest = async (userId: string, groupId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      router.push(`/send-date-request/${userId}${groupId ? `?groupId=${groupId}` : ''}`);
    } catch (error) {
      console.error('Error sending date request:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (userStatus === 'in_relationship') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-8">Curated Date Experiences</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {curatedDates.map((date) => (
            <div key={date.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{date.venue}</h2>
                <p className="text-gray-600 mb-4">{date.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[#BA2525]">{date.price_range}</span>
                  <span className="text-gray-500">{new Date(date.proposed_time).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => router.push(`/dates/book/${date.id}`)}
                  className="w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors"
                >
                  Book This Date
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#cc0000] text-white pb-24">
      <div className="max-w-4xl mx-auto p-4 mb-16">
        {/* Header */}
        <div className="mb-8">
          <Header variant="default" />
        </div>

        {/* Filters Section */}
        <div className="bg-[#aa0000] rounded-lg p-3 mb-8">
          <div className="flex flex-wrap gap-2">
            {/* User Search */}
            <div className="flex-1 min-w-[300px] relative">
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users by name..."
                  className="w-full p-2 pl-4 pr-10 bg-[#cc0000] text-white border border-white/20 rounded-full text-sm"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        handleSendDateRequest(user.id);
                        setSearchResults([]); // Clear dropdown after selection
                      }}
                      className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <ProfileImage user={user} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#BA2525]">{user.first_name}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.age && `${user.age} • `}
                          {user.school}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Group Filter */}
            <div className="flex-1 min-w-[140px]">
              <select
                className="w-full p-2 bg-[#cc0000] text-white border border-white/20 rounded-full text-sm"
                value={filters.selectedGroup}
                onChange={(e) => setFilters(prev => ({ ...prev, selectedGroup: e.target.value }))}
              >
                <option value="">All Groups</option>
                {userGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            {/* Existing Filters */}
            <div className="flex-1 min-w-[140px]">
              <select
                className="w-full p-2 bg-[#cc0000] text-white border border-white/20 rounded-full text-sm"
                value={filters.archetype}
                onChange={(e) => handleFilterChange('archetype', e.target.value)}
              >
                <option value="">All Archetypes</option>
                {archetypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* School Filter */}
            <div className="flex-1 min-w-[140px]">
              <select
                className="w-full p-2 bg-[#cc0000] text-white border border-white/20 rounded-full text-sm"
                value={filters.school}
                onChange={(e) => handleFilterChange('school', e.target.value)}
              >
                <option value="">All Schools</option>
                {schoolOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Age Range Filters */}
            <div className="flex gap-2 flex-1 min-w-[140px]">
              <input
                type="number"
                className="w-full p-2 bg-[#cc0000] text-white border border-white/20 rounded-full text-sm"
                value={filters.minAge}
                onChange={(e) => handleFilterChange('minAge', e.target.value)}
                min="18"
                max="100"
                placeholder="Min Age"
              />
              <input
                type="number"
                className="w-full p-2 bg-[#cc0000] text-white border border-white/20 rounded-full text-sm"
                value={filters.maxAge}
                onChange={(e) => handleFilterChange('maxAge', e.target.value)}
                min="18"
                max="100"
                placeholder="Max Age"
              />
            </div>
          </div>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {paginatedProfiles.map((profile, index) => (
            <div key={profile.id} className="bg-white rounded-lg overflow-hidden p-4 shadow-md border border-gray-100">
              <div className="flex flex-col">
                <div 
                  className="relative w-full aspect-[4/3] mb-4 cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                  onClick={() => router.push(`/profile/${profile.matchedUser.id}`)}
                >
                  {profile.compatibility && (
                    <div className="absolute top-3 right-3 z-20 bg-white/90 px-3 py-1.5 rounded-full text-sm text-[#BA2525] flex items-center gap-1.5 shadow-md">
                      <Heart size={14} fill="#BA2525" stroke="#BA2525" />
                      <span className="font-medium">{profile.compatibility}%</span>
                    </div>
                  )}
                  <div className="absolute inset-0">
                    <ProfileImage
                      user={{
                        avatar_url: profile.matchedUser.avatar_url || DEFAULT_AVATAR,
                        first_name: profile.matchedUser.first_name
                      }}
                      priority={index < 4}
                      className="!absolute inset-0"
                    />
                  </div>
                </div>

                <h2 className="text-xl font-semibold mb-3 text-[#BA2525] text-center">
                  {profile.matchedUser.first_name}
                  {profile.matchedUser.age ? `, ${profile.matchedUser.age}` : ''}
                </h2>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="flex flex-col items-center p-2 rounded-[40px] bg-[#BA2525] text-white">
                    <div className="text-white text-sm">♔ {profile.matchedUser.dater_status ? profile.matchedUser.dater_status.charAt(0).toUpperCase() + profile.matchedUser.dater_status.slice(1) : 'Bronze'}</div>
                    <div className="text-white text-[10px]">Status</div>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-[40px] bg-[#BA2525] text-white">
                    <div className="text-white text-sm">★ {(profile.matchedUser.average_rating || 0).toFixed(1)}</div>
                    <div className="text-white text-[10px]">Rating</div>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-[40px] bg-[#BA2525] text-white">
                    <div className="text-white text-sm">♥ {profile.matchedUser.follow_through_rate}%</div>
                    <div className="text-white text-[10px]">Follow-Through</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/profile/${profile.matchedUser.id}`)}
                    className='w-full p-2.5 bg-white text-[#BA2525] rounded-full font-medium hover:bg-[#BA2525] hover:text-white transition-colors text-sm border-2 border-[#BA2525] mb-2'
                  >
                    View Profile
                  </button>
                  {filters.selectedGroup ? (
                    <button
                      onClick={() => handleSendDateRequest(profile.matchedUser.id, filters.selectedGroup)}
                      className='w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors text-sm'
                    >
                      Send Group Date Request
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendDateRequest(profile.matchedUser.id)}
                      className='w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors text-sm'
                    >
                      Send Date Request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-full ${
                currentPage === 1 
                  ? 'bg-[#aa0000] text-white/50' 
                  : 'bg-[#aa0000] text-white hover:bg-[#990000]'
              } transition-colors`}
            >
              Previous
            </button>
            <span className="px-4 py-2 text-white font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-full ${
                currentPage === totalPages 
                  ? 'bg-[#aa0000] text-white/50' 
                  : 'bg-[#aa0000] text-white hover:bg-[#990000]'
              } transition-colors`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Replace the inline navigation with the BottomNav component */}
      <BottomNav />
    </div>
  );
}