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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DateRecommendations from '@/components/DateRecommendations';
import { checkAndRefreshSession } from '@/lib/auth';

const MAX_PREVIEW_MATCHES = 6;

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
  school?: string;
  gender: 'male' | 'female' | 'other';
  preferred_gender: 'male' | 'female' | 'other';
  dater_archetype: 'hopelessRomantic' | 'cautiousDater' | 'adventurous' | 'traditional' | 'independent';
  dating_style?: string;
  rating?: string;
  dater_status?: 'gold' | 'silver' | 'bronze' | null;
  follow_through_rate?: number;
  average_rating?: number;
}

interface DateRequestResponse {
  id: string;
  status: string;
  venue: string;
  proposed_time: string;
  dating_style: string;
  created_at: string;
  sender_name: string;
  sender_age: number;
  sender_avatar_url: string | null;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    avatar_url: string | null;
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

const VENUE_PAYMENT_LINKS: Record<string, string> = {
  'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Hockey': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
  'Barcelona Wine Bar': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'The Clay Room': 'https://buy.stripe.com/00g8yVaKYgwt4ikaEO',
  // ... add other venue payment links
};

const VENUES: Record<string, Venue[]> = {
  sports: [
    { 
      name: "Boston Bruins",
      location: "TD Garden",
      type: "Sports",
      category: "Sports & Entertainment",
      rating: 4.7,
      price: "$$$",
      imageUrl: "/images/venues/bruins.jpg",
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
      imageUrl: "/images/venues/celtics.jpg",
      stripeLink: "https://buy.stripe.com/5kA8yVf1e0xvg12eV0",
      coordinates: [-71.0622, 42.3663],
      distance: "5.8 mi",
      slug: "celtics"
    },
    { 
      name: "BC Hockey",
      location: "Conte Forum",
      type: "Sports",
      category: "Sports & Entertainment",
      rating: 4.5,
      price: "$$",
      imageUrl: "/images/venues/bchockey.jpg",
      stripeLink: "https://buy.stripe.com/bIYcPb3iw6VT5mobIN",
      coordinates: [-71.1677, 42.3357],
      distance: "0.1 mi",
      slug: "bc-hockey"
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
      imageUrl: "/images/venues/barcelona.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
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
      imageUrl: "/images/venues/branchline.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.1407, 42.3523],
      distance: "1.5 mi",
      slug: "branchline"
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
      imageUrl: "/images/venues/museum.jpg",
      stripeLink: "https://buy.stripe.com/aEU8yV7yM5RP8yA3ce",
      coordinates: [-71.0995, 42.3394],
      distance: "3.6 mi",
      slug: "museum-of-fine-arts"
    },
    { 
      name: "Private Helicopter Ride",
      location: "Boston, MA",
      type: "Adventure",
      category: "Adventure & Outdoors",
      price: "$$$$",
      rating: 4.9,
      imageUrl: "/images/venues/helicopter.jpg",
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
      imageUrl: "/images/venues/clayroom.jpg",
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

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) return '/images/default-avatar.png';
  
  try {
    // If it's already a public URL or default image, return it directly
    if (avatarPath.startsWith('http') || avatarPath.startsWith('/images/')) {
      return avatarPath;
    }

    // Extract just the filename from the path
    const filename = avatarPath
      .split('/')                                // Split by /
      .filter(part => part !== 'avatars')        // Remove all 'avatars' parts
      .join('/')                                 // Join remaining parts
      .split('?')[0];                            // Remove query parameters

    // Get a public URL that doesn't expire
    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filename);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Could not generate public URL');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return '/images/default-avatar.png';
  }
};

const ProfileImage = ({ 
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

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dateRequests, setDateRequests] = useState<DateRequestResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [imageKey, setImageKey] = useState(Date.now());
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [profileAvatarUrls, setProfileAvatarUrls] = useState<Record<string, string>>({});
  const [storageError, setStorageError] = useState<string | null>(null);

  const fetchDateRequests = useCallback(async () => {
    try {
      const session = await checkAndRefreshSession(supabase);
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Simplified query with proper error handling
      const { data: requests, error: requestsError } = await supabase
        .from('date_requests')
        .select(`
          *,
          sender:profiles!date_requests_sender_id_fkey (
            id,
            first_name,
            last_name,
            age,
            avatar_url
          )
        `)
        .eq('receiver_id', session.user.id)
        .eq('status', 'pending');

      if (requestsError) {
        console.error('Error fetching date requests:', requestsError);
        throw requestsError;
      }

      const processedRequests = await Promise.all((requests || []).map(async (request) => {
        try {
          const avatarUrl = request.sender?.avatar_url ? 
            await getAvatarUrl(request.sender.avatar_url) : 
            '/images/default-avatar.png';

          return {
            ...request,
            sender: request.sender ? {
              ...request.sender,
              avatar_url: avatarUrl
            } : null
          };
        } catch (error) {
          console.error('Error processing request:', error);
          return request;
        }
      }));

      setDateRequests(processedRequests);
    } catch (error) {
      console.error('Error in fetchDateRequests:', error);
      setError('Failed to load date requests');
    }
  }, [router]);

  const fetchMatches = async (userId: string) => {
    try {
      // Check if we have a valid userId
      if (!userId) {
        console.log('No user ID provided');
        return;
      }

      // Get user's preferred gender
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('preferred_gender')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found');
      }

      const { data: matches } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId) // Exclude current user
        .eq('gender', userProfile.preferred_gender) // Filter by preferred gender
        .limit(MAX_PREVIEW_MATCHES);

      return matches || [];
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          console.log('Session refresh failed, redirecting to login');
          router.push('/auth/login');
          return false;
        }
        return true;
      }
      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      router.push('/auth/login');
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const isSessionValid = await checkSession();
        if (!isSessionValid) return;

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.replace('/auth/login');
          return;
        }

        // Fetch profile with all fields
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            dater_archetype,
            dating_style
          `)
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }

        if (!profile) {
          console.log('No profile found, redirecting to quiz');
          router.replace('/quiz');
          return;
        }

        console.log('Fetched profile:', profile);
        setCurrentUser(profile);
        
      } catch (error) {
        console.error('Error in fetchData:', error);
        if (error instanceof Error && error.message.includes('Invalid Refresh Token')) {
          router.replace('/auth/login');
        } else {
          setError(error instanceof Error ? error.message : 'Failed to load data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        router.replace('/auth/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (currentUser?.avatar_url) {
      setAvatarKey(Date.now());
    }
  }, [currentUser?.avatar_url]);

  useEffect(() => {
    if (currentUser?.avatar_url) {
      setImageKey(Date.now());
    }
  }, [currentUser?.avatar_url]);

  const handleDateRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      // Find the specific date request
      const request = dateRequests.find(req => req.id === requestId);
      if (!request) {
        console.error('Date request not found');
        return;
      }

      // Update the status in the database
      const { error } = await supabase
        .from('date_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      // If accepted, redirect to payment link
      if (status === 'accepted') {
        const paymentLink = VENUE_PAYMENT_LINKS[request.venue];
        if (paymentLink) {
          window.location.href = paymentLink;
        } else {
          console.error('No payment link found for venue:', request.venue);
          // Optionally show an error message to the user
          setError(`Payment link not found for venue: ${request.venue}`);
        }
      }

      // Update local state
      setDateRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId
            ? { ...req, status }
            : req
        )
      );

    } catch (error) {
      console.error('Error handling date request:', error);
      setError(error instanceof Error ? error.message : 'Failed to handle date request');
    }
  };

  useEffect(() => {
    const loadMatches = async () => {
      if (currentUser?.id) {
        const matchedProfiles = await fetchMatches(currentUser.id);
        setProfiles(matchedProfiles || []);
      }
    };

    loadMatches();
  }, [currentUser?.id]);

  useEffect(() => {
    const initializePage = async () => {
      if (currentUser?.id) {
        await fetchMatches(currentUser.id);
        await fetchDateRequests();
      }
    };

    initializePage();
  }, [currentUser?.id, fetchMatches, fetchDateRequests]);

  const DateRequestCard = ({ request }: { request: DateRequestResponse }) => (
    <Card 
      key={request.id} 
      className="mb-3 bg-white p-4 rounded-[30px] shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative w-16 h-16">
            <Image
              src={request.sender?.avatar_url || '/images/default-avatar.png'}
              alt={`${request.sender?.first_name || 'User'}'s profile`}
              fill
              sizes="(max-width: 640px) 64px, 
                     (max-width: 768px) 64px,
                     96px"
              className="object-cover rounded-full"
              priority={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/default-avatar.png';
              }}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#BA2525]">
              {request.sender?.first_name}, {request.sender?.age}
            </h3>
            <p className="text-gray-500 text-sm">
              {request.venue} • {formatDate(request.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => handleDateRequest(request.id, 'accepted')}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-[#BA2525] text-white rounded-full text-base hover:bg-[#a02020] transition-colors"
          >
            Accept
          </button>
          <button 
            onClick={() => handleDateRequest(request.id, 'declined')}
            className="flex-1 sm:flex-none px-6 py-2.5 border border-[#BA2525] text-[#BA2525] rounded-full text-base hover:bg-[#ffeeee] transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </Card>
  );

  if (!currentUser) {
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
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-5 pb-32">
          <Header variant="matching" />
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Crown, value: currentUser.dater_status || 'Bronze', label: 'Dater Status' },
              { 
                icon: null,
                value: (
                  <div className="flex items-center">
                    {Array(5).fill(0).map((_, i) => (
                      <span key={i} className="text-[#BA2525] text-base">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </span>
                    ))}
                  </div>
                ), 
                label: 'Your Rating' 
              },
              { icon: Heart, value: currentUser.follow_through_rate ? `${currentUser.follow_through_rate}%` : '0%', label: 'Date Follow-Through' }
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="overflow-hidden">
                <Link href={`/profile/${currentUser.id}`}>
                  <Card className="col-span-1 bg-white border-2 border-[#BA2525] !rounded-[50px] h-14 shadow-sm overflow-hidden hover:bg-[#ffeeee] transition-colors cursor-pointer">
                    <CardContent className="p-0 h-full">
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-0">
                        <div className="flex items-center justify-center gap-1.5">
                          {Icon && <Icon className="text-[#BA2525]" size={15} />}
                          {typeof value === 'string' ? (
                            <div className="text-base font-medium text-[#BA2525]">{value}</div>
                          ) : (
                            value
                          )}
                        </div>
                        <div className="text-[9px] text-[#BA2525]/80 -mt-0.5 px-1 whitespace-nowrap leading-tight">{label}</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>

          {/* Make Your First Move section */}
          <div>
            <Link href="/matching">
              <h2 className="text-2xl font-bold text-[#BA2525] mb-8 text-center hover:opacity-80 transition-opacity cursor-pointer">
                Make Your First Move...
              </h2>
            </Link>
            
            {profiles.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {profiles.slice(0, 6).map((profile) => (
                    <Link key={profile.id} href={`/profile/${profile.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden rounded-lg bg-white/90 border border-gray-200">
                        <CardContent className="p-0">
                          <div className="relative aspect-[4/3] w-full">
                            <ProfileImage 
                              src={profile.avatar_url}
                              alt={`${profile.first_name}'s profile`}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="text-lg font-semibold text-[#BA2525] mb-0.5">
                              {profile.first_name}, {profile.age}
                            </h3>
                            <p className="text-gray-600 text-xs line-clamp-2">
                              {profile.bio}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                <div className="flex justify-center mb-2">
                  <Link
                    href="/matching"
                    className="px-6 py-3 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
                  >
                    View More Matches →
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-600">
                No matches available yet
                <div className="flex justify-center mb-4">
                  <Link
                    href="/matching"
                    className="px-6 py-3 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
                  >
                    View More Matches →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Date Requests section */}
          <div className="mt-12">
            <Link href="/daterequests">
              <h2 className="text-2xl font-bold text-[#BA2525] mb-6 text-center hover:opacity-80 transition-opacity cursor-pointer">
                Your Story Starts Here...
              </h2>
            </Link>
            {dateRequests.map((request) => (
              <DateRequestCard key={request.id} request={request} />
            ))}
            
            <div className="flex justify-center mt-6 mb-8">
              <Link
                href="/daterequests"
                className="px-6 py-3 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
              >
                View More Date Requests →
              </Link>
            </div>
          </div>

          {/* Move DateRecommendations here, before the bottom nav */}
          <DateRecommendations />

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
            <div className="max-w-2xl mx-auto flex justify-around">
              {[
                { icon: <Home size={24} />, label: 'Home', href: '/dashboard' },
                { icon: <Users size={24} />, label: 'Matches', href: '/matching' },
                { icon: <Heart size={24} />, label: 'Dates', href: '/daterequests' },
                { icon: <Calendar size={24} />, label: 'Upcoming', href: '/dates/upcoming' },
                { icon: <UserCircle size={24} />, label: 'Profile', href: '/dashboard/editprofile' }
              ].map(({ icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center text-[#BA2525] cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {icon}
                  <span className="text-xs mt-1">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}