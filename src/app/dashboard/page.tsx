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
  if (!avatarPath) {
    return '/images/default-avatar.png';
  }

  try {
    // If it's already a full URL, we'll use it directly
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')  // Matches the bucket name exactly
      .getPublicUrl(avatarPath);

    return publicUrlData.publicUrl;

  } catch (error) {
    console.error('Error processing avatar URL:', error);
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
}: { 
  src: string | null, 
  alt: string, 
  className?: string,
  style?: React.CSSProperties,
  priority?: boolean,
  width?: number,
  height?: number
}) => {
  const [imageUrl, setImageUrl] = useState<string>('/images/default-avatar.png');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      console.log('ProfileImage - Initial src:', src); // Debug log

      if (!src) {
        console.log('No src provided, using default'); // Debug log
        setImageUrl('/images/default-avatar.png');
        return;
      }

      try {
        // If it's already a complete URL, use it directly
        if (src.startsWith('http') || src.startsWith('/images/')) {
          console.log('Using direct URL:', src); // Debug log
          setImageUrl(src);
          return;
        }

        // For Supabase storage paths
        const { data: publicUrlData } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(src);

        console.log('Supabase public URL result:', publicUrlData); // Debug log

        if (publicUrlData?.publicUrl) {
          console.log('Setting image URL to:', publicUrlData.publicUrl); // Debug log
          setImageUrl(publicUrlData.publicUrl);
          setIsError(false);
        } else {
          console.log('No public URL found, using default'); // Debug log
          setImageUrl('/images/default-avatar.png');
          setIsError(true);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setImageUrl('/images/default-avatar.png');
        setIsError(true);
      }
    };

    loadImage();
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
      <img
        src={imageUrl}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover rounded-lg"
        onError={(e) => {
          console.log('Image load error:', imageUrl); // Debug log
          setImageUrl('/images/default-avatar.png');
          setIsError(true);
        }}
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

  const fetchMatches = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (currentUserError) throw currentUserError;

      const { data: matchData, error: matchError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('school', currentUser.school)
        .in('gender', [currentUser.preferred_gender, 'both'])
        .or(`preferred_gender.eq.${currentUser.gender},preferred_gender.eq.both`)
        .limit(6);

      if (matchError) {
        console.error('Match error:', matchError);
        setProfiles([]);
        return;
      }

      if (matchData) {
        const processedProfiles = await Promise.all(
          matchData.map(async (profile) => {
            console.log(`Profile ${profile.first_name}'s avatar_url:`, profile.avatar_url);
            const avatarUrl = await getAvatarUrl(profile.avatar_url);
            console.log(`Processed URL for ${profile.first_name}:`, avatarUrl);
            return {
              ...profile,
              avatar_url: avatarUrl
            };
          })
        );
        
        setProfiles(processedProfiles);
      }
    } catch (error) {
      console.error('Error in fetchMatches:', error);
      setProfiles([]);
    }
  }, [router]);

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
    fetchMatches();
    fetchDateRequests();
  }, [fetchMatches, fetchDateRequests]);

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
      <div className="max-w-6xl mx-auto p-5 pb-24">
        <Header />
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { icon: Crown, value: 'Gold', label: 'Dater Status' },
            { icon: Trophy, value: '1/1', label: 'Your Dater Rating' },
            { icon: Heart, value: '0%', label: 'Your Date Follow-Through' }
          ].map(({ icon: Icon, value, label }) => (
            <Card key={label} className="col-span-1 border-2 border-[#BA2525]/20">
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
          <h2 className="text-2xl font-bold text-[#cc0000] mb-6">
            Make Your First Move...
          </h2>
          
          {profiles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                {profiles.slice(0, MAX_PREVIEW_MATCHES).map((profile, index) => (
                  <Link key={profile.id} href={`/profile/${profile.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden rounded-lg border border-gray-200">
                      <CardContent className="p-0">
                        <div className="relative w-full" style={{ height: '300px' }}>
                          <ProfileImage
                            src={profile.avatar_url}
                            alt={`${profile.first_name}'s profile`}
                            className="rounded-t-lg"
                          />
                        </div>
                        <div className="p-5">
                          <div className="text-lg font-medium text-[#cc0000] mb-1">
                            {profile.first_name}, {profile.age}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {profile.bio}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              {profiles.length > MAX_PREVIEW_MATCHES && (
                <div className="flex justify-center mt-6">
                  <Link
                    href="/matching"
                    className="px-6 py-3 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
                  >
                    View More Matches
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No matches available yet
            </div>
          )}
        </div>

        {/* Date Requests section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#cc0000] mb-6">
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
          
          <div className="flex justify-center mt-6">
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
      <BottomNav />
    </>
  );
}