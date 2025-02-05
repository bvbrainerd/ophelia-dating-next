'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, Calendar, MessageCircle, UserCircle, Trophy, Crown, Users, Coffee, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/client';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import Image from 'next/image';
import DateRecommendations from '@/components/DateRecommendations';
import { checkAndRefreshSession } from '@/lib/auth';
import Map from '@/components/Map';
import ProfileImage from '@/components/ProfileImage';
import DaterStatus from '@/components/DaterStatus';
import { DESCRIPTORS, Descriptor } from '@/components/DescriptorBubbles';

const MAX_PREVIEW_MATCHES = 6;

// Venue coordinates mapping
const venueCoordinates: { [key: string]: [number, number] } = {
  'Blue Ribbon Sushi': [-71.0622, 42.3663],
  'Barcelona Wine Bar': [-71.0761, 42.3457],
  'Boston Commons': [-71.0712, 42.3551],
  'Museum of Fine Arts': [-71.0942, 42.3390],
  'Cityside Tavern': [-71.1502, 42.3359],
  'Kured': [-71.0770, 42.3578],
  'The Clay Room': [-71.1012, 42.3467],
  'Joes on Newbury': [-71.0812, 42.3489],
  'Private Helicopter Ride': [-71.0095, 42.3656],
  'Boston Duck Tour': [-71.0686, 42.3518],
  'F1 Arcade': [-71.0622, 42.3663],
  'Lucca North End': [-71.0567, 42.3647],
  'BC Basketball': [-71.1677, 42.3357],
  'BC Lacrosse': [-71.1677, 42.3357],
  'Boston Bruins': [-71.0622, 42.3663],
  'Lolita Back Bay': [-71.0842, 42.3467],
  'Capo': [-71.0471, 42.3359],
  'Lorettas Last Call': [-71.0950, 42.3467]
};

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string | null;
  bio: string;
  school?: string;
  gender: 'male' | 'female' | 'other';
  preferred_gender: 'male' | 'female' | 'other';
  descriptors?: string[];
  dater_status?: 'gold' | 'silver' | 'bronze' | null;
  follow_through_rate?: number;
  average_rating?: number;
  venue?: string;
  proposed_time?: string;
  description?: string;
  dater_archetype?: DaterArchetype;
  compatibility?: number | null;
}

interface DatabaseProfile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string | null;
  bio: string;
}

interface RawDateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: string;
  split_payment: boolean;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    avatar_url: string | null;
    bio: string;
  } | null;
}

interface DateRequestResponse {
  id: string;
  venue: string;
  proposed_time: string;
  status: string;
  split_payment: boolean;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    avatar_url: string | null;
    bio: string;
  } | null;
}

interface ImageProps {
  src: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
}

interface Venue {
  name: string;
  location: string;
  type: string;
  category: string;
  rating: number;
  imageUrl: string;
  stripeLink: string;
  coordinates: [number, number];
  price?: string;
  distance: string;
  slug: string;
}

const VENUE_PAYMENT_LINKS: { [key: string]: string } = {
  'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Lacrosse': 'https://buy.stripe.com/fZeg1nbP2gwtaGI14l',
  'Barcelona Wine Bar': 'https://buy.stripe.com/9AQg1n1ao6VTeWY28l',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'The Clay Room': 'https://buy.stripe.com/00g8yVaKYgwt4ikaEO'
};

const VENUES: Record<string, Venue[]> = {
  sports: [
    { 
      name: "BC Lacrosse",
      location: "Chestnut Hill, MA",
      type: "Sports",
      category: "Sports",
      rating: 4.7,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/bclacrosse.jpg`,
      stripeLink: "https://buy.stripe.com/fZeg1nbP2gwtaGI14l",
      coordinates: [-71.1677, 42.3357],
      distance: "4.2 mi",
      slug: "bc-lacrosse"
    },
    { 
      name: "Boston Bruins",
      location: "TD Garden",
      type: "Sports",
      category: "Sports & Entertainment",
      rating: 4.7,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/bruins.jpg`,
      stripeLink: "https://buy.stripe.com/00gg1ng5i1BzeWY6os",
      coordinates: [-71.0622, 42.3663],
      distance: "5.8 mi",
      slug: "boston-bruins"
    },
    { 
      name: "Celtics",
      location: "TD Garden",
      type: "Sports",
      category: "Sports & Entertainment",
      rating: 4.7,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/celtics.jpg`,
      stripeLink: "https://buy.stripe.com/5kA8yVf1e0xvg12eV0",
      coordinates: [-71.0622, 42.3663],
      distance: "5.8 mi",
      slug: "celtics"
    }
  ],
  restaurants: [
    { 
      name: "Barcelona Wine Bar",
      location: "South End, Boston",
      type: "Spanish",
      category: "Food & Drinks",
      price: "$$$",
      rating: 4.6,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/barcelona.jpg`,
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0761, 42.3457],
      distance: "4.9 mi",
      slug: "barcelona-wine-bar"
    },
    { 
      name: "Branchline",
      location: "Brookline, MA",
      type: "American",
      category: "Food & Drinks",
      price: "$$",
      rating: 4.5,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/branchline.jpg`,
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.1407, 42.3523],
      distance: "1.5 mi",
      slug: "branchline"
    },
    { 
      name: "Lorettas Last Call",
      location: "Fenway, Boston",
      type: "American",
      category: "Food & Drinks",
      price: "$$",
      rating: 4.5,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/lorettas.jpg`,
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0953, 42.3467],
      distance: "3.2 mi",
      slug: "lorettas-last-call"
    }
  ],
  activities: [
    { 
      name: "Museum of Fine Arts",
      location: "Boston, MA",
      type: "Culture",
      category: "Arts & Culture",
      rating: 4.8,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/museum.jpg`,
      stripeLink: "https://buy.stripe.com/aEU8yV7yM5RP8yA3ce",
      coordinates: [-71.0995, 42.3394],
      distance: "3.6 mi",
      slug: "museum-of-fine-arts"
    },
    { 
      name: "Boston Commons",
      location: "Boston, MA",
      type: "Park",
      category: "Outdoors",
      rating: 4.7,
      price: "$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/commons.jpg`,
      stripeLink: "https://buy.stripe.com/eVaaH31ao2FDbKM3ck",
      coordinates: [-71.0670, 42.3554],
      distance: "5.5 mi",
      slug: "boston-commons"
    },
    { 
      name: "Private Helicopter Ride",
      location: "Boston, MA",
      type: "Adventure",
      category: "Adventure & Outdoors",
      price: "$$$$",
      rating: 4.9,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/helicopter.jpg`,
      stripeLink: "https://buy.stripe.com/14k2ax7yM0xv6qs8wz",
      coordinates: [-71.0217, 42.3656],
      distance: "7.8 mi",
      slug: "private-helicopter-ride"
    },
    { 
      name: "The Clay Room",
      location: "Brookline, MA",
      type: "Creative",
      category: "Arts & Culture",
      rating: 4.6,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/clayroom.jpg`,
      stripeLink: "https://buy.stripe.com/00g8yVaKYgwt4ikaEO",
      coordinates: [-71.1317, 42.3396],
      distance: "1.9 mi",
      slug: "the-clay-room"
    }
  ],
  events: [
    { 
      name: "Boston Celtics Game",
      location: "TD Garden",
      type: "Sports",
      category: "Events",
      rating: 4.8,
      price: "$$$",
      imageUrl: "/images/venues/celtics.jpg",
      stripeLink: "https://buy.stripe.com/5kA8yVf1e0xvg12eV0",
      coordinates: [-71.0622, 42.3663],
      distance: "5.8 mi",
      slug: "boston-celtics-game"
    }
  ]
};

const DEFAULT_AVATAR = '/images/default-avatar.png';

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) {
    console.log('No avatar path provided');
    return DEFAULT_AVATAR;
  }

  // If it's the default avatar or starts with /images/, return it directly
  if (avatarPath.includes('default-avatar') || avatarPath.startsWith('/images/')) {
    console.log('Using default or static image:', avatarPath);
    return avatarPath;
  }

  // If it's already a full URL, return it
  if (avatarPath.startsWith('http')) {
    console.log('Using existing URL:', avatarPath);
    return avatarPath;
  }

  console.log('Original avatar path:', avatarPath);
  
  // Clean up path by removing query parameters and getting just the filename
  const cleanPath = avatarPath
    .replace(/^\/+/, '')  // Remove leading slashes
    .replace(/^avatars\/avatars\//, '') // Remove double avatars prefix
    .replace(/^avatars\//, '') // Remove single avatars prefix
    .split('?')[0];  // Remove query parameters
  
  if (!cleanPath) {
    console.log('No valid path found:', avatarPath);
    return DEFAULT_AVATAR;
  }

  console.log('Cleaned path:', cleanPath);

  try {
    // Get public URL instead of signed URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(cleanPath);

    if (!data?.publicUrl) {
      console.error('No public URL generated');
      return DEFAULT_AVATAR;
    }

    console.log('Generated public URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in getAvatarUrl:', error);
    return DEFAULT_AVATAR;
  }
};

const LocalProfileImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {},
  priority = false,
  width,
  height 
}: ImageProps) => {
  const [imageUrl, setImageUrl] = useState<string>('/images/default-avatar.png');

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        const url = await getAvatarUrl(src);
        if (mounted) {
          setImageUrl(url);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        if (mounted) {
          setImageUrl('/images/default-avatar.png');
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [src]);

  return (
    <div 
      className={`relative ${className}`} 
      style={{ 
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        ...style
      }}
    >
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 
               (max-width: 1024px) 50vw,
               33vw"
        priority={priority}
        className="object-cover rounded-lg"
        unoptimized={imageUrl.startsWith('http')} // Skip optimization for external URLs
      />
    </div>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

type DaterArchetype = 'hopelessRomantic' | 'cautiousDater' | 'commitmentSeeker' | 'serialDater' | 'friendWithBenefits';

type CompatibilityMap = {
  [K in DaterArchetype]: {
    [L in DaterArchetype]: number;
  };
};

const calculateCompatibility = (userArchetype: DaterArchetype, matchArchetype: DaterArchetype): number => {
  const compatibilityMap: CompatibilityMap = {
    'hopelessRomantic': {
      'hopelessRomantic': 95,
      'cautiousDater': 85,
      'commitmentSeeker': 90,
      'serialDater': 60,
      'friendWithBenefits': 40
    },
    'cautiousDater': {
      'cautiousDater': 90,
      'hopelessRomantic': 85,
      'commitmentSeeker': 80,
      'serialDater': 50,
      'friendWithBenefits': 30
    },
    'commitmentSeeker': {
      'commitmentSeeker': 95,
      'hopelessRomantic': 90,
      'serialDater': 70,
      'cautiousDater': 80,
      'friendWithBenefits': 30
    },
    'serialDater': {
      'serialDater': 90,
      'commitmentSeeker': 70,
      'hopelessRomantic': 60,
      'cautiousDater': 50,
      'friendWithBenefits': 75
    },
    'friendWithBenefits': {
      'friendWithBenefits': 95,
      'serialDater': 75,
      'hopelessRomantic': 40,
      'cautiousDater': 30,
      'commitmentSeeker': 30
    }
  };

  return compatibilityMap[userArchetype]?.[matchArchetype] || 0;
};

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [dateRequests, setDateRequests] = useState<DateRequestResponse[]>([]);
  const [userArchetype, setUserArchetype] = useState<DaterArchetype | null>(null);

  const fetchMatches = async (userId: string) => {
    try {
      // First get the current user's profile including gender preferences
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('dater_archetype, gender, preferred_gender')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      const currentUserArchetype = userData?.dater_archetype as DaterArchetype;
      setUserArchetype(currentUserArchetype);

      console.log('Current user data:', userData);

      // Fetch matches with gender preference filtering
      const { data: matchesData, error: matchesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          age,
          avatar_url,
          bio,
          school,
          gender,
          preferred_gender,
          descriptors,
          dater_status,
          follow_through_rate,
          average_rating,
          dater_archetype
        `)
        .neq('id', userId)
        .eq('school', 'Boston College')
        // Filter by gender preferences
        .eq('gender', userData.preferred_gender)
        .eq('preferred_gender', userData.gender);

      if (matchesError) throw matchesError;

      // Process matches with compatibility scores
      const matches = await Promise.all((matchesData || []).map(async (m) => {
        const avatarUrl = m.avatar_url ? await getAvatarUrl(m.avatar_url) : null;
        let compatibility = null;
        
        if (currentUserArchetype && m.dater_archetype) {
          compatibility = calculateCompatibility(
            currentUserArchetype,
            m.dater_archetype as DaterArchetype
          );
          console.log(`Calculating compatibility for ${m.first_name}:`, {
            userArchetype: currentUserArchetype,
            matchArchetype: m.dater_archetype,
            score: compatibility
          });
        }

        return {
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          age: m.age,
          avatar_url: avatarUrl,
          bio: m.bio,
          school: m.school,
          gender: m.gender,
          preferred_gender: m.preferred_gender,
          descriptors: m.descriptors,
          dater_status: m.dater_status,
          follow_through_rate: m.follow_through_rate,
          average_rating: m.average_rating,
          dater_archetype: m.dater_archetype,
          compatibility
        } as Profile;
      }));

      console.log('Processed matches with compatibility:', matches);
      setProfiles(matches);
      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDateRequests = async () => {
    try {
      if (!userId) return;

      const { data: requests, error } = await supabase
        .from('date_requests')
        .select(`
          id,
          venue,
          proposed_time,
          status,
          split_payment,
          sender:profiles!date_requests_sender_id_fkey (
            id,
            first_name,
            last_name,
            age,
            avatar_url,
            bio
          )
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the requests to ensure correct typing
      const processedRequests: DateRequestResponse[] = (requests as unknown as RawDateRequest[]).map(request => ({
        id: request.id,
        venue: request.venue,
        proposed_time: request.proposed_time,
        status: request.status,
        split_payment: request.split_payment,
        sender: request.sender ? {
          id: request.sender.id,
          first_name: request.sender.first_name,
          last_name: request.sender.last_name,
          age: request.sender.age,
          avatar_url: request.sender.avatar_url || '/images/default-avatar.png',
          bio: request.sender.bio
        } : null
      })) || [];

      setDateRequests(processedRequests);
    } catch (error) {
      console.error('Error fetching date requests:', error);
    }
  };

  useEffect(() => {
    const checkAuthAndInitialize = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          // Clear any stale data
          setUserId(null);
          setProfiles([]);
          setDateRequests([]);
          // Redirect to login
          router.replace('/auth/login');
          return;
        }

        setUserId(session.user.id);
        
        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!session) {
            // Clear data and redirect on session end
            setUserId(null);
            setProfiles([]);
            setDateRequests([]);
            router.replace('/auth/login');
          } else {
            setUserId(session.user.id);
          }
        });

        // Fetch initial data
        const matches = await fetchMatches(session.user.id);
        setProfiles(matches);
        await fetchDateRequests();

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth error:', error);
        setError('Authentication failed. Please log in again.');
        router.replace('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndInitialize();
  }, [router]);

  const handleDateRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const { error: updateError } = await supabase
        .from('date_requests')
        .update({ status })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update local state
      setDateRequests(prevRequests => 
        prevRequests.filter(request => request.id !== requestId)
      );
    } catch (error) {
      console.error('Error updating date request:', error);
      setError('Failed to update date request');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading profile...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-[#cc0000] text-white rounded-full"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-6xl mx-auto p-5">
        <Header variant="default" />
        
        {/* Dater Status Section */}
        {userId && (
          <div className="mt-8 mb-4">
            <DaterStatus userId={userId} />
          </div>
        )}
        
        {/* Valentine's Day Section */}
        <div className="bg-[#BA2525] rounded-lg p-12 min-h-[200px] flex flex-col items-center justify-center space-y-6">
          <h2 className="text-xl text-white font-medium">Ditch love at first swipe, for love at first sight.</h2>
          <Link
            href="/send-valentine"
            className="bg-white text-[#BA2525] px-5 py-1.5 rounded-full font-medium hover:bg-gray-100 transition-colors text-sm"
          >
            Send Valentine
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[#BA2525] text-center mt-12 mb-8">
          Make Your Move
        </h1>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {profiles.map((profile) => (
            <Card key={profile.id} className="border-2 border-[#BA2525] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-[#BA2525]">
              <div className="flex flex-col items-center">
                <div 
                  className="relative w-full h-72 mb-4 cursor-pointer overflow-hidden rounded-lg border-4 border-white"
                  onClick={() => router.push(`/profile/${profile.id}`)}
                >
                  {profile.compatibility !== null && (
                    <div className="absolute top-2 right-2 z-10 bg-white/90 px-2 py-1 rounded-full text-sm text-[#BA2525] flex items-center gap-1">
                      <Heart size={12} fill="#BA2525" stroke="#BA2525" />
                      {profile.compatibility}%
                    </div>
                  )}
                  <LocalProfileImage
                    src={profile.avatar_url}
                    alt={`${profile.first_name}'s profile`}
                    priority={true}
                    className="object-cover object-[50%_35%]"
                  />
                </div>
                
                <h2 className="text-xl font-semibold mb-4 text-white">
                  {profile.first_name}{typeof profile.age !== 'undefined' && profile.age !== null ? `, ${profile.age}` : ''}
                </h2>

                {/* Descriptor Bubbles */}
                {profile.descriptors && profile.descriptors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {profile.descriptors.map((descriptor: any, index: number) => {
                      // Handle both string and object descriptors
                      const descriptorLabel = typeof descriptor === 'string' ? descriptor : descriptor.label;
                      return (
                        <span key={index} className="bg-[#BA2525] text-white border-2 border-white px-3 py-1 rounded-full text-sm">
                          {descriptorLabel}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 w-full">
                  <button
                    onClick={() => router.push(`/send-date-request/${profile.id}`)}
                    className='w-full p-2 bg-white text-[#BA2525] rounded-full font-medium hover:bg-gray-100 transition-colors'
                  >
                    Send Date Request
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${profile.id}`)}
                    className='w-full p-2 bg-transparent text-white border-2 border-white rounded-full font-medium hover:bg-[#a02020] transition-colors'
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}