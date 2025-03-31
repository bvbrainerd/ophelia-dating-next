// src/app/daterequests/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Coffee, MapPin, Calendar, User, Utensils, ArrowLeft, Ticket, CreditCard, Heart, Target, Users, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Map from '@/components/Map';
import { getVenueImagePath, getVenueCoordinates } from '@/utils/venues';
import { toast } from 'sonner';
import ProfileImage from '@/components/ProfileImage';
import Link from 'next/link';
import TicketView from '@/components/TicketView';
import UpcomingDateCard from '@/components/UpcomingDateCard';
import Header from '@/components/Header';
import { Prompt } from 'next/font/google';
import { prompt } from '@/app/fonts';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

interface Venue {
  id: string;
  name: string;
}

interface DateRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  proposed_time: string | null;
  venue: string | null;
  sender?: Profile;
  proposed_payment: number | null;
  split_payment: boolean;
  challenge_id: string | null;
  watcher_votes: number;
  latitude: number | null;
  longitude: number | null;
  venue_id: string | null;
  date_reservations?: Array<{ date_time: string }>;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_amount?: number;
  payment_method_id?: string;
  stripe_payment_intent_id?: string;
}

interface ValentineRequest {
  id: string;
  sender_id: string;
  recipient_email: string;
  recipient_name: string;
  is_anonymous: boolean;
  status: string;
  curated_venue?: string;
  curated_time?: string;
  sender?: {
    first_name: string;
    last_name: string;
    age: number;
    avatar_url: string;
  };
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'adventurous' | 'daredevil';
  points: number;
  type: 'date_invite' | 'date_activity';
  venue?: string;
  deadline?: string;
  proof_type?: string;
}

interface ChallengeRequest {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  challenge: Challenge;
  challenger: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  };
  deadline: string;
  proof_type: string;
  created_at: string;
}

interface DatabaseChallenge {
  id: string;
  title: string;
  description: string;
  level: string;
  points: number;
}

interface DatabaseProfile {
  id: string;
  first_name: string;
  avatar_url: string | null;
  age: number;
  bio: string | null;
}

interface DatabaseUserChallenge {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  deadline: string;
  proof_type: string;
  created_at: string;
  date_challenges: DatabaseChallenge;
  profiles: DatabaseProfile;
}

interface DatabaseChallengeResponse {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  deadline: string;
  proof_type: string;
  created_at: string;
  date_challenges: {
    id: string;
    title: string;
    description: string;
    level: 'beginner' | 'adventurous' | 'daredevil';
    points: number;
    type: 'date_invite' | 'date_activity';
  };
  challenger: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  };
}

interface RawDateResponse {
  id: string;
  venue_id: string;
  scheduled_time: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  venues: {
    id: string;
    name: string;
  };
  date_reservations: Array<{
    id: string;
    status: string;
    date_time: string;
  }> | null;
  venue_bills: Array<{
    id: string;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    status: string;
    bill_data: any;
  }> | null;
  profiles: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  } | null;
}

const stripeLinks: { [key: string]: string } = {
  'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Hockey': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
  'BC Basketball': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
  'Boston Commons': 'https://buy.stripe.com/eVaaH31ao2FDbKM3ck',
  'Kured': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'Private Helicopter Ride': 'https://buy.stripe.com/14k2ax7yM0xv6qs8wz',
  'Barcelona Wine Bar': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Capo': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Locco Fenway': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'F1 Arcade': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Lucca North End': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Lolita Back Bay': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Blue Ribbon Sushi': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Joes on Newbury': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Boston Celtics Game': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'The Clay Room': 'https://buy.stripe.com/00g8yVaKYgwt4ikaEO',
  'Lorettas Last Call': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc'
};

// Add venue coordinates
const venueCoordinates: Record<string, [number, number]> = {
  'Blue Ribbon Sushi': [-71.0594, 42.3551],
  'Barcelona Wine Bar': [-71.0761, 42.3457],
  'Cityside Tavern': [-71.1502, 42.3359],
  'Lorettas Last Call': [-71.0950, 42.3467],
  'BC Basketball': [-71.1677, 42.3357],
  'BC Hockey': [-71.1677, 42.3357],
  'Boston Bruins': [-71.0622, 42.3663],
  'Celtics': [-71.0622, 42.3663],
  'F1 Arcade': [-71.0595, 42.3501],
  'Museum of Fine Arts': [-71.0942, 42.3394],
  'Boston Commons': [-71.0670, 42.3554],
  'Kured': [-71.0712, 42.3589],
  'The Clay Room': [-71.1317, 42.3396],
  'Joes on Newbury': [-71.0793, 42.3491],
  'Lucca North End': [-71.0567, 42.3647],
  'Lolita Back Bay': [-71.0816, 42.3486],
  'Capo': [-71.0472, 42.3359]
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

const getRandomVenues = (venues: string[], count: number = 3) => {
  const shuffled = [...venues].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getDefaultVenueCoordinates = (venueName?: string | null): [number, number] => {
  // Check if we have coordinates for this venue
  if (venueName && venueCoordinates[venueName]) {
    return venueCoordinates[venueName];
  }
  // Default to Boston coordinates - Note longitude comes first for Mapbox
  return [-71.0589, 42.3601];
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Time not set';
  
  try {
    const date = new Date(dateString as string);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Time not set';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Time not set';
  }
};

const DateRequestCard = ({ request, onAccept, onDecline }: { 
  request: DateRequest; 
  onAccept: () => void; 
  onDecline: () => void; 
}) => {
  const router = useRouter();

  const handleProfileClick = () => {
    if (request.sender?.id) {
      router.push(`/profile/${request.sender.id}`);
    }
  };

  const formatRequestDate = (request: DateRequest) => {
    const dateTime = request.proposed_time || 
                    request.date_reservations?.[0]?.date_time || 
                    request.created_at;
    if (!dateTime) return 'Date not set';
    
    try {
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const coordinates = venueCoordinates[request.venue || ''] || [-71.0589, 42.3601];

  return (
    <Card className="p-6 mb-4 bg-white shadow-sm">
      {/* Profile Section */}
      <div 
        onClick={handleProfileClick}
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-6"
      >
        <div className="relative w-16 h-16">
          <Image
            src={request.sender?.avatar_url || '/images/default-avatar.png'}
            alt={`${request.sender?.first_name}'s profile`}
            fill
            className="rounded-full object-cover hover:scale-105 transition-transform"
          />
        </div>
        <div>
          <span className="text-xl font-bold text-gray-900 hover:text-[#BA2525] transition-colors">
            {request.sender?.first_name}, {request.sender?.age}
          </span>
        </div>
      </div>
      
      {/* Venue Section */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xl">📍</span>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-900">
            {request.venue || 'Venue not specified'}
          </span>
          <span className="text-sm text-gray-500">
            {formatRequestDate(request)}
          </span>
        </div>
      </div>

      {/* Map Section */}
      {request.venue && coordinates && (
        <div className="relative h-48 rounded-lg overflow-hidden shadow-lg mb-6">
          <Map 
            markers={[{
              coordinates: coordinates,
              title: request.venue
            }]}
            center={coordinates}
            zoom={15}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 bg-[#cc0000] text-white py-3 px-6 rounded-full hover:bg-[#a02020] transition-colors font-medium"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="flex-1 border-2 border-[#cc0000] text-[#cc0000] py-3 px-6 rounded-full hover:bg-red-50 transition-colors font-medium"
        >
          Decline
        </button>
      </div>
    </Card>
  );
};

const GroupInviteCard = ({ invite, onAccept, onDecline }: {
  invite: any;
  onAccept: () => void;
  onDecline: () => void;
}) => (
  <Card className="bg-white p-6 rounded-[30px] shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="relative w-20 h-20">
          <Image
            src={invite.profiles?.avatar_url || '/images/default-avatar.png'}
            alt={`${invite.profiles?.first_name}'s profile`}
            fill
            className="object-cover rounded-full border-2 border-[#cc0000] shadow-md"
          />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-[#cc0000]">
            {invite.groups.name}
          </h3>
          <p className="text-gray-600">
            Invited by {invite.profiles?.first_name}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="px-6 py-2.5 bg-[#cc0000] text-white rounded-full text-sm font-medium hover:bg-[#aa0000] transition-colors shadow-sm"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="px-6 py-2.5 border border-[#cc0000] text-[#cc0000] rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  </Card>
);

const handleGroupInvite = async (inviteId: string, accept: boolean) => {
  try {
    const { error } = await supabase
      .from('group_invites')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', inviteId);

    if (error) throw error;
    
    // Refresh the page or update state
    window.location.reload();
  } catch (error) {
    console.error('Error handling group invite:', error);
    toast.error('Failed to process group invite');
  }
};

const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}`);
      const result = await fn();
      console.log(`Attempt ${i + 1} successful`);
      return result;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default function DateRequestsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dateRequests, setDateRequests] = useState<DateRequest[]>([]);
  const [confirmedDates, setConfirmedDates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [valentineRequests, setValentineRequests] = useState<ValentineRequest[]>([]);
  const [groupInvites, setGroupInvites] = useState<any[]>([]);
  const [challengeRequests, setChallengeRequests] = useState<DatabaseUserChallenge[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'upcoming' | 'challenges' | 'groups'>('upcoming');
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [upcomingDates, setUpcomingDates] = useState<DateRequest[]>([]);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ relationship_status?: string } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('relationship_status')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);
      
      // If user is in a relationship, set active tab to upcoming
      if (profile?.relationship_status === 'in_relationship') {
        setActiveTab('upcoming');
      }
    };

    fetchUserProfile();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      console.log('Starting fetchData...');
      setIsLoading(true);
      setError(null);
      setNetworkError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        if (userError) throw userError;
        setAuthError('Not authenticated');
        router.push('/auth/login');
        return;
      }

      console.log('Current user ID:', user.id);

      // Query matching your actual database schema
      const { data: requestsData, error: requestsError } = await supabase
        .from('date_requests')
        .select(`
          *,
          profiles!date_requests_sender_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url,
            age,
            bio
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      console.log('Date requests response:', { data: requestsData, error: requestsError });

      if (requestsError) throw requestsError;

      const formattedRequests = (requestsData || []).map((request: any) => {
        console.log('Processing request:', request);
        
        // Get coordinates from your venueCoordinates mapping
        const coordinates = venueCoordinates[request.venue as keyof typeof venueCoordinates] || [-71.0589, 42.3601];
        
        return {
          id: request.id,
          sender_id: request.sender_id,
          receiver_id: request.receiver_id,
          updated_at: request.updated_at,
          status: request.status,
          created_at: request.created_at,
          proposed_time: request.proposed_time,
          venue: request.venue,
          sender: request.profiles,
          proposed_payment: request.proposed_payment,
          split_payment: request.split_payment,
          challenge_id: request.challenge_id,
          watcher_votes: request.watcher_votes,
          latitude: request.latitude,
          longitude: request.longitude,
          venue_id: request.venue_id,
          coordinates
        };
      });

      console.log('Formatted requests:', formattedRequests);
      setDateRequests(formattedRequests);

      // Similarly update the upcoming dates query
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('date_requests')
        .select(`
          *,
          profiles!date_requests_sender_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url,
            age,
            bio
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'accepted');

      if (upcomingError) throw upcomingError;

      const formattedUpcoming = (upcomingData || []).map((request: any) => {
        const coordinates = venueCoordinates[request.venue as keyof typeof venueCoordinates] || [-71.0589, 42.3601];
        
        return {
          id: request.id,
          sender_id: request.sender_id,
          receiver_id: request.receiver_id,
          updated_at: request.updated_at,
          status: request.status,
          created_at: request.created_at,
          proposed_time: request.proposed_time,
          venue: request.venue,
          sender: request.profiles,
          proposed_payment: request.proposed_payment,
          split_payment: request.split_payment,
          challenge_id: request.challenge_id,
          watcher_votes: request.watcher_votes,
          latitude: request.latitude,
          longitude: request.longitude,
          venue_id: request.venue_id,
          date_time: request.date_reservations?.[0]?.date_time || new Date().toISOString(),
          payment_status: 'paid' as const,
          payment_amount: request.proposed_payment || 50.00
        };
      });

      console.log('Formatted upcoming:', formattedUpcoming);
      setUpcomingDates(formattedUpcoming);

      // Fetch challenge requests
      const { data: challengeData, error: challengeError } = await supabase
        .from('user_challenges')
        .select(`
          id,
          status,
          deadline,
          proof_type,
          created_at,
          date_challenges!inner (
            id,
            title,
            description,
            level,
            points
          ),
          profiles!user_challenges_challenger_id_fkey!inner (
            id,
            first_name,
            avatar_url,
            age,
            bio
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (challengeError) throw challengeError;

      // Transform the data to match DatabaseUserChallenge type
      const transformedChallenges: DatabaseUserChallenge[] = (challengeData || []).map((challenge: any) => ({
        id: challenge.id,
        status: challenge.status,
        deadline: challenge.deadline,
        proof_type: challenge.proof_type,
        created_at: challenge.created_at,
        date_challenges: {
          id: challenge.date_challenges.id,
          title: challenge.date_challenges.title,
          description: challenge.date_challenges.description,
          level: challenge.date_challenges.level,
          points: challenge.date_challenges.points
        },
        profiles: {
          id: challenge.profiles.id,
          first_name: challenge.profiles.first_name,
          avatar_url: challenge.profiles.avatar_url,
          age: challenge.profiles.age,
          bio: challenge.profiles.bio
        }
      }));

      setChallengeRequests(transformedChallenges);

    } catch (error: any) {
      console.error('Error in fetchData:', error);
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('Network') ||
          error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        setNetworkError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setNetworkError(null);
      // Retry fetching data when coming back online
      fetchData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!window.navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchValentineRequests = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: requests, error } = await supabase
          .from('valentine_requests')
          .select(`
            *,
            sender:profiles!valentine_requests_sender_id_fkey (
              first_name,
              last_name,
              age,
              avatar_url
            )
          `)
          .or(`recipient_email.eq.${session.user.email},recipient_id.eq.${session.user.id}`)
          .eq('status', 'curated')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setValentineRequests(requests);
      } catch (error) {
        console.error('Error fetching valentine requests:', error);
      }
    };

    fetchValentineRequests();
  }, []);

  const handleDateResponse = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      // Get the date request details first
      const { data: request, error: requestError } = await supabase
        .from('date_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      if (!request) throw new Error('Date request not found');

      // Update the date request status
      const { error: updateError } = await supabase
        .from('date_requests')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If accepted, redirect to payment
      if (status === 'accepted') {
        // Check if there's a direct Stripe link for the venue
        const stripeLink = stripeLinks[request.venue];
        if (stripeLink) {
          window.location.href = stripeLink;
        } else {
          // Fallback to payment confirmation page
          router.push(`/dates/payment-confirmation/${requestId}`);
        }
      }

      // Update local state
      setDateRequests(prev => prev.filter(req => req.id !== requestId));

    } catch (error) {
      console.error('Error handling date response:', error);
      toast.error('Failed to process your response. Please try again.');
    }
  };

  const handleValentineResponse = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('valentine_requests')
        .update({ 
          status: accept ? 'accepted' : 'declined'
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setValentineRequests(prev => prev.filter(req => req.id !== requestId));

      // If accepted, redirect to payment
      if (accept) {
        const request = valentineRequests.find(req => req.id === requestId);
        if (request?.curated_venue) {
          const paymentLink = stripeLinks[request.curated_venue];
          if (paymentLink) {
            window.location.href = paymentLink;
          }
        }
      }
    } catch (error) {
      console.error('Error handling valentine response:', error);
    }
  };

  const sendDateRequestEmail = async (senderId: string, recipientId: string, dateDetails: DateRequest) => {
    try {
      const response = await fetch('/api/send-date-request', {
        method: 'POST',
        // ... other options ...
      });
      // Handle response
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      return false;
    }
  };

  const handleChallengeResponse = async (challengeId: string, status: 'accepted' | 'declined') => {
    try {
      const challenge = challengeRequests.find(c => c.id === challengeId);
      if (!challenge) return;

      // Update challenge status
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({ status })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      // Create notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: challenge.profiles.id,
          type: status === 'accepted' ? 'challenge_accepted' : 'challenge_declined',
          title: status === 'accepted' ? 'Challenge Accepted!' : 'Challenge Declined',
          message: status === 'accepted'
            ? `Your challenge "${challenge.date_challenges.title}" has been accepted!`
            : `Your challenge "${challenge.date_challenges.title}" was declined.`,
          data: {
            challenge_id: challengeId,
            challenge_title: challenge.date_challenges.title
          }
        });

      if (notificationError) throw notificationError;

      // Update local state
      setChallengeRequests(prev => prev.filter(c => c.id !== challengeId));

      // Show success message
      toast.success(status === 'accepted' ? 'Challenge accepted!' : 'Challenge declined');

      // If accepted, redirect to challenge details
      if (status === 'accepted') {
        router.push(`/challenges/${challengeId}`);
      }
    } catch (error) {
      console.error('Error handling challenge response:', error);
      toast.error('Failed to process your response. Please try again.');
    }
  };

  // Add retry mechanism for auth refresh
  const retryAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push('/auth/login');
        return;
      }
      window.location.reload();
    } catch (error) {
      setAuthError('Unable to refresh authentication. Please log in again.');
      router.push('/auth/login');
    }
  };

  if (networkError) {
    return (
      <div className="min-h-screen bg-[#cc0000] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-bold text-[#cc0000] mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{networkError}</p>
          <button
            onClick={() => {
              setNetworkError(null);
              fetchData();
            }}
            className="px-6 py-2 bg-[#cc0000] text-white rounded-full hover:bg-[#aa0000] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="min-h-screen bg-[#cc0000] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-bold text-[#cc0000] mb-4">You're Offline</h2>
          <p className="text-gray-600 mb-6">
            Please check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#cc0000] text-white rounded-full hover:bg-[#aa0000] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#cc0000] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-bold text-[#cc0000] mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button
            onClick={retryAuth}
            className="px-6 py-2 bg-[#cc0000] text-white rounded-full hover:bg-[#aa0000] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white ${prompt.className}`}>
      <Header variant="default" />
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="flex gap-2">
          {/* Only show date requests tab for single users */}
          {userProfile?.relationship_status !== 'in_relationship' && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-[#cc0000] text-white font-bold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className="w-4 h-4" />
              Date Requests {dateRequests.length > 0 && `(${dateRequests.length})`}
            </button>
          )}

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-[#cc0000] text-white font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Upcoming Dates {upcomingDates.length > 0 && `(${upcomingDates.length})`}
          </button>

          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'challenges'
                ? 'bg-[#cc0000] text-white font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Target className="w-4 h-4" />
            Challenges {challengeRequests.length > 0 && `(${challengeRequests.length})`}
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'groups'
                ? 'bg-[#cc0000] text-white font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Group Invites {groupInvites.length > 0 && `(${groupInvites.length})`}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-5 pb-24">
        {/* Content Sections */}
        {activeTab === 'requests' && (
          <section className="space-y-4">
            {dateRequests.length === 0 ? (
              <p className="text-gray-500">No pending date requests</p>
            ) : (
              dateRequests.map(request => (
                <DateRequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => handleDateResponse(request.id, 'accepted')}
                  onDecline={() => handleDateResponse(request.id, 'declined')}
                />
              ))
            )}
          </section>
        )}

        {activeTab === 'upcoming' && (
          <section className="space-y-4">
            {upcomingDates.length === 0 ? (
              <p className="text-gray-500">No upcoming dates</p>
            ) : (
              upcomingDates.map(date => (
                <Card className="p-6 mb-4 bg-white shadow-sm" key={date.id}>
                  {/* Profile Section */}
                  <div 
                    onClick={() => router.push(`/profile/${date.sender?.id}`)}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-6"
                  >
                    <div className="relative w-16 h-16">
                      <Image
                        src={date.sender?.avatar_url || '/images/default-avatar.png'}
                        alt={`${date.sender?.first_name}'s profile`}
                        fill
                        className="rounded-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <span className="text-xl font-bold text-gray-900 hover:text-[#BA2525] transition-colors">
                        {date.sender?.first_name}, {date.sender?.age}
                      </span>
                    </div>
                  </div>
                  
                  {/* Venue Section */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xl">📍</span>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-900">
                        {date.venue || 'Venue not specified'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(date.proposed_time)}
                      </span>
                    </div>
                  </div>

                  {/* Map Section */}
                  {date.venue && (
                    <div className="relative h-64 rounded-lg overflow-hidden shadow-lg mb-6">
                      <Map 
                        markers={[{
                          coordinates: venueCoordinates[date.venue] || [-71.0589, 42.3601],
                          title: date.venue
                        }]}
                        center={venueCoordinates[date.venue] || [-71.0589, 42.3601]}
                        zoom={15}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/dates/upcoming/${date.id}`)}
                      className="flex-1 bg-[#cc0000] text-white py-3 px-6 rounded-full hover:bg-[#a02020] transition-colors font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </Card>
              ))
            )}
          </section>
        )}

        {activeTab === 'challenges' && (
          <section className="space-y-4">
            {challengeRequests.length === 0 ? (
              <p className="text-gray-500">No pending challenges</p>
            ) : (
              challengeRequests.map(challenge => (
                <Card className="p-6 mb-4 bg-white shadow-sm" key={challenge.id}>
                  {/* Profile Section */}
                  <div 
                    onClick={() => router.push(`/challenges/${challenge.id}`)}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-6"
                  >
                    <div className="relative w-16 h-16">
                      <Image
                        src={challenge.profiles.avatar_url || '/images/default-avatar.png'}
                        alt={`${challenge.profiles.first_name}'s profile`}
                        fill
                        className="rounded-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <span className="text-xl font-bold text-gray-900 hover:text-[#BA2525] transition-colors">
                        {challenge.profiles.first_name}, {challenge.profiles.age}
                      </span>
                    </div>
                  </div>
                  
                  {/* Venue Section */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xl">📍</span>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-900">
                        {challenge.date_challenges.title}
                      </span>
                      <span className="text-sm text-gray-500">
                        {challenge.date_challenges.description}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleChallengeResponse(challenge.id, 'accepted')}
                      className="flex-1 bg-[#cc0000] text-white py-3 px-6 rounded-full hover:bg-[#a02020] transition-colors font-medium"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleChallengeResponse(challenge.id, 'declined')}
                      className="flex-1 border-2 border-[#cc0000] text-[#cc0000] py-3 px-6 rounded-full hover:bg-red-50 transition-colors font-medium"
                    >
                      Decline
                    </button>
                  </div>
                </Card>
              ))
            )}
          </section>
        )}

        {activeTab === 'groups' && (
          <section className="space-y-4">
            {groupInvites.length === 0 ? (
              <p className="text-gray-500">No group invites</p>
            ) : (
              groupInvites.map(invite => (
                <GroupInviteCard
                  key={invite.id}
                  invite={invite}
                  onAccept={() => handleGroupInvite(invite.id, true)}
                  onDecline={() => handleGroupInvite(invite.id, false)}
                />
              ))
            )}
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

