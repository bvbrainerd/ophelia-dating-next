'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, Calendar, MessageCircle, UserCircle, Trophy, Crown, Users, Coffee, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
  rating?: string;
}

interface DateRequestResponse {
  id: string;
  status: string;
  venue: string;
  proposed_time: string;
  dating_style: string;
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

const VENUE_PAYMENT_LINKS: Record<string, string> = {
  'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Hockey': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
  'BC Basketball': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
  'Boston Commons': 'https://buy.stripe.com/eVaaH31ao2FDbKM3ck',
  'Kured': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'Private Helicopter Ride': 'https://buy.stripe.com/14k2ax7yM0xv6qs8wz',
  'Barcelona Wine Bar': 'https://buy.stripe.com/00g4iF1ao9414ik4gi',
  'Capo': 'https://buy.stripe.com/7sI6qNcT65RPeWY9AE',
  'Locco Fenway': 'https://buy.stripe.com/28o15p1ao0xv8yA6or',
  'F1 Arcade': 'https://buy.stripe.com/4gwcPb9GU2FD6qs5km',
  'Lucca North End': 'https://buy.stripe.com/28o8yV3iw1Bz5mo7sv',
  'Lolita Back Bay': 'https://buy.stripe.com/4gw15p9GU6VTg126os',
  'Blue Ribbon Sushi': 'https://buy.stripe.com/28o15pcT61Bz8yA4gh',
  'Joes on Newbury': 'https://buy.stripe.com/6oE15p5qE0xvg125ko',
  'Snowport @Seaport': 'https://buy.stripe.com/3cs15p9GU2FD8yA7st',
  'Boston Celtics Game': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'The Clay Room': 'https://buy.stripe.com/28o15p1ao0xv8yA6or',
};

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) return '/images/default-avatar.png';
  
  try {
    // If it's already a public URL or default image, return it directly
    if (avatarPath.startsWith('http') || avatarPath.startsWith('/images/')) {
      return avatarPath;
    }

    // Clean up the path - remove any duplicate avatars/ prefixes and query parameters
    const cleanPath = avatarPath
      .replace(/^avatars\/avatars\//, 'avatars/') // Remove duplicate avatars/
      .replace(/^avatars\//, '')                  // Remove single avatars/
      .split('?')[0];                            // Remove query parameters

    // Get a public URL that doesn't expire
    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(cleanPath);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        router.push('/auth/login');
        return;
      }

      // Step 2: Basic query first with status filter
      const { data: requests, error: requestsError } = await supabase
        .from('date_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (requestsError) {
        console.log('Basic query error:', requestsError);
        throw requestsError;
      }

      console.log('Basic requests found:', requests);

      // Step 3: Get sender details separately
      const processedRequests = await Promise.all((requests || []).map(async (request) => {
        const { data: senderData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, age, avatar_url')
          .eq('id', request.sender_id)
          .single();

        const avatarUrl = await getAvatarUrl(senderData?.avatar_url);
        return {
          id: request.id,
          status: request.status,
          venue: request.venue,
          proposed_time: request.proposed_time,
          dating_style: request.dating_style,
          sender: senderData ? {
            ...senderData,
            avatar_url: avatarUrl
          } : null
        };
      }));

      setDateRequests(processedRequests);

    } catch (err) {
      if (err instanceof Error) {
        console.error('Detailed error:', {
          name: err.name,
          message: err.message,
          details: err
        });
      } else {
        console.error('Unknown error:', err);
      }
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

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          console.log('No profile found, redirecting to quiz');
          router.replace('/quiz');
          return;
        }

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
      <div className="min-h-screen bg-[#BA2525]">
        <div className="max-w-6xl mx-auto p-5 pb-24">
          <Header />
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { icon: Crown, value: 'Gold', label: 'Dater Status' },
              { icon: Trophy, value: '1/1', label: 'Your Dater Rating' },
              { icon: Heart, value: '0%', label: 'Your Date Follow-Through' }
            ].map(({ icon: Icon, value, label }) => (
              <Card key={label} className="col-span-1 bg-white/90 border-none">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Icon className="text-[#BA2525] mb-2" size={24} />
                    <div className="text-2xl font-bold text-[#BA2525]">{value}</div>
                    <div className="text-sm text-gray-600">{label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Make Your First Move section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Make Your First Move...
            </h2>
            
            {profiles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {profiles.map((profile, index) => (
                    <Link key={profile.id} href={`/profile/${profile.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden rounded-lg bg-white/90 border-none">
                        <CardContent className="p-0">
                          <div className="relative aspect-[4/3] w-full">
                            <ProfileImage 
                              src={profile.avatar_url}
                              alt={`${profile.first_name}'s profile`}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-xl font-bold text-[#BA2525] mb-1">
                              {profile.first_name}, {profile.age}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {profile.bio}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                <div className="flex justify-center mt-12">
                  <Link
                    href="/matching"
                    className="px-6 py-3 bg-white text-[#cc0000] rounded-full font-medium hover:bg-white/90 transition-colors"
                  >
                    View More Matches →
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-white">
                No matches available yet
                <div className="flex justify-center mt-12">
                  <Link
                    href="/matching"
                    className="px-6 py-3 bg-white text-[#cc0000] rounded-full font-medium hover:bg-white/90 transition-colors"
                  >
                    View More Matches →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Date Requests section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Your Story Starts Here...
            </h2>
            {dateRequests.map((request, index) => (
              <Card key={request.id} className="mb-3">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16">
                      <ProfileImage
                        src={request.sender?.avatar_url || null}
                        alt={`${request.sender?.first_name || 'User'}'s profile`}
                        width={64}
                        height={64}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">
                        {request.sender?.first_name}, {request.sender?.age}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 mb-2">
                        <Coffee size={14} />
                        <span className="text-sm">
                          {request.venue} • {
                            request.proposed_time 
                              ? new Date(request.proposed_time).toLocaleString('en-US', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })
                              : 'No date specified'
                          }
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDateRequest(request.id, 'accepted')}
                          className="px-4 py-1.5 bg-[#BA2525] text-white rounded-lg text-sm hover:bg-[#a02020] transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleDateRequest(request.id, 'declined')}
                          className="px-4 py-1.5 border border-[#BA2525] text-[#BA2525] rounded-lg text-sm hover:bg-[#ffeeee] transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="flex justify-center mt-12">
              <Link
                href="/daterequests"
                className="px-6 py-3 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
              >
                View More Date Requests →
              </Link>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
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