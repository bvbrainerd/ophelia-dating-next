'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, Calendar, MessageCircle, UserCircle, Trophy, Crown, Users, Coffee, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';

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
  };
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

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dateRequests, setDateRequests] = useState<DateRequestResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const fetchDateRequests = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: requests, error: requestsError } = await supabase
        .from('date_requests')
        .select(`
          *,
          sender:profiles!sender_id(
            id,
            first_name,
            last_name,
            age,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('proposed_time', { ascending: true });

      if (requestsError) throw requestsError;

      setDateRequests(requests || []);
    } catch (error) {
      console.error('Error in fetchDateRequests:', error);
    }
  }, [router]);

  const fetchMatches = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setCurrentUser(currentUserProfile);

      const { data: matchData, error: matchError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          age,
          avatar_url,
          bio,
          gender,
          preferred_gender,
          dater_archetype
        `)
        .neq('id', user.id)
        .eq('gender', currentUserProfile.preferred_gender);

      if (matchError) throw matchError;

      setProfiles(matchData || []);
    } catch (error) {
      console.error('Error in fetchMatches:', error);
    }
  }, [router]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        
        if (!refreshedSession) {
          console.log('No valid session found, redirecting to login');
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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.replace('/auth/login');
          return;
        }

        // Fetch current user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setCurrentUser(userProfile);

        // Fetch potential matches based on gender preferences
        const matchQuery = supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);

        // Handle gender preference filtering
        if (userProfile.preferred_gender === 'both') {
          // If user prefers both, no additional gender filter needed
        } else {
          matchQuery.eq('gender', userProfile.preferred_gender);
        }

        const { data: matchData, error: matchError } = await matchQuery
          .limit(MAX_PREVIEW_MATCHES);

        if (matchError) throw matchError;
        setProfiles(matchData || []);

        // Fetch date requests
        await fetchDateRequests();

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchDateRequests]);

  useEffect(() => {
    if (currentUser?.avatar_url) {
      setAvatarKey(Date.now());
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-5 pb-24 pt-8">
        {/* Header */}
        <div className="flex items-center mb-12 relative">
          <div className="absolute left-0 right-0 text-center">
            <Link href="/dashboard">
              <h1 className="text-4xl font-bold text-[#BA2525] cursor-pointer hover:opacity-80 transition-opacity">
                Ophelia
              </h1>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3 z-10">
            <div className="text-sm font-medium text-[#BA2525]">
              Welcome back, {currentUser?.first_name}
            </div>
            <Link href="/dashboard/editprofile">
              <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full cursor-pointer overflow-hidden">
                {currentUser?.avatar_url ? (
                  <div className="relative w-10 h-10">
                    <Image
                      key={avatarKey}
                      src={currentUser?.avatar_url || '/images/default-avatar.png'}
                      alt="Profile"
                      fill
                      sizes="40px"
                      className="object-cover rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-avatar.png';
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-50 rounded-full">
                    <UserCircle className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>

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
                {profiles.slice(0, MAX_PREVIEW_MATCHES).map((profile) => (
                  <Link key={profile.id} href={`/profile/${profile.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden rounded-lg border border-gray-200">
                      <CardContent className="p-0">
                        <div className="relative w-full rounded-t-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                          <Image
                            src={profile.avatar_url || '/images/default-avatar.png'}
                            alt={`${profile.first_name}'s profile`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover rounded-t-lg"
                            priority
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/default-avatar.png';
                            }}
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
                    View More Matches →
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
          {dateRequests.map((request) => (
            <Card key={request.id} className="mb-3">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden">
                    <Image
                      src={request.sender?.avatar_url || '/images/default-avatar.png'}
                      alt={`${request.sender?.first_name || 'User'}'s profile`}
                      width={64}
                      height={64}
                      className="object-cover w-16 h-16"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-avatar.png';
                      }}
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