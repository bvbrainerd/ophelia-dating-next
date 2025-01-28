// src/app/daterequests/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { Coffee, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Map from '@/components/Map';
import { getVenueImagePath, getVenueCoordinates } from '@/utils/venues';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

interface DateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: 'pending' | 'accepted' | 'declined';
  split_payment: boolean;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    avatar_url: string;
    bio: string;
  };
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

export default function DateRequestsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRequests, setDateRequests] = useState<DateRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [valentineRequests, setValentineRequests] = useState<ValentineRequest[]>([]);

  useEffect(() => {
    const fetchDateRequests = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          router.replace('/auth/login');
          return;
        }

        const { data: requests, error: requestsError } = await supabase
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
          .eq('receiver_id', user.id)
          .eq('status', 'pending')
          .order('proposed_time', { ascending: true });

        if (requestsError) {
          console.error('Error fetching requests:', requestsError);
          setError('Failed to load date requests');
          return;
        }

        const processedRequests: DateRequest[] = await Promise.all((requests || []).map(async (request: any) => {
          try {
            const avatarUrl = request.sender?.avatar_url ? 
              await getAvatarUrl(request.sender.avatar_url) : 
              '/images/default-avatar.png';

            return {
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
                avatar_url: avatarUrl,
                bio: request.sender.bio
              } : null
            };
          } catch (error) {
            console.error('Error processing request:', error);
            return request;
          }
        }));

        setDateRequests(processedRequests);
      } catch (error) {
        console.error('Error:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDateRequests();
  }, [router]);

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
      if (status === 'declined') {
        // Directly decline the date request
        const { error } = await supabase
          .from('date_requests')
          .update({ status: 'declined' })
          .eq('id', requestId);

        if (error) throw error;
        
        setDateRequests(prev =>
          prev.filter(request => request.id !== requestId)
        );
      } else if (status === 'accepted') {
        // For acceptance, store the request ID in localStorage and redirect to payment
        const request = dateRequests.find(req => req.id === requestId);
        if (request && request.venue) {
          const paymentLink = stripeLinks[request.venue];
          if (paymentLink) {
            // Store the pending date request ID
            localStorage.setItem('pendingDateId', requestId);
            localStorage.setItem('paymentReturnTime', new Date().toISOString());
            
            // Redirect to payment
            window.location.href = paymentLink;
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error updating date request:', error);
      setError('Failed to update date request');
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="default" />
        
        <h1 className="text-3xl font-bold text-[#BA2525] text-center mt-12 mb-8">
          Date Requests
        </h1>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Valentine Requests */}
          {valentineRequests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-16 h-16 relative">
                  <Image
                    src={request.sender?.avatar_url}
                    alt={`${request.sender?.first_name}'s profile`}
                    fill
                    className="rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#BA2525]">
                    {request.is_anonymous ? 'Someone Special' : `${request.sender?.first_name}, ${request.sender?.age}`}
                  </h3>
                  <p className="text-gray-600">sent you a Valentine!</p>
                </div>
              </div>

              {request.curated_venue && request.curated_time && (
                <div className="bg-red-50 p-4 rounded-lg mb-6">
                  <div className="text-[#BA2525] font-medium mb-2">
                    📍 {request.curated_venue}
                  </div>
                  <div className="text-[#BA2525] font-medium">
                    📅 {new Date(request.curated_time).toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              )}

              {request.curated_venue && (
                <div className="h-40 rounded-lg overflow-hidden mb-6">
                  <Map
                    markers={[{
                      coordinates: getVenueCoordinates(request.curated_venue),
                      title: request.curated_venue
                    }]}
                    center={getVenueCoordinates(request.curated_venue)}
                    zoom={14}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleValentineResponse(request.id, true)}
                  className="p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleValentineResponse(request.id, false)}
                  className="p-2.5 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
                >
                  Decline
                </button>
              </div>
            </Card>
          ))}

          {/* Regular Date Requests */}
          {dateRequests.map((request, index) => (
            <Card key={request.id} className="bg-white p-6 rounded-[30px] shadow-sm hover:shadow-md transition-shadow">
              {/* Profile and Basic Info */}
              <div className="flex items-start justify-between mb-6">
                <Link href={`/profile/${request.sender?.id}`} className="flex items-center space-x-4">
                  <div className="relative w-20 h-20">
                    <Image
                      src={request.sender?.avatar_url || '/images/default-avatar.png'}
                      alt={`${request.sender?.first_name}'s profile`}
                      fill
                      className="object-cover rounded-full border-2 border-white shadow-md"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-[#BA2525]">
                      {request.sender?.first_name}, {request.sender?.age}
                    </h3>
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDateResponse(request.id, 'accepted')}
                    className="px-6 py-2.5 bg-[#BA2525] text-white rounded-full text-sm font-medium hover:bg-[#a02020] transition-colors shadow-sm"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleDateResponse(request.id, 'declined')}
                    className="px-6 py-2.5 border-2 border-[#BA2525] text-[#BA2525] rounded-full text-sm font-medium hover:bg-[#ffeeee] transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>

              {/* Venue Image and Details */}
              <div className="bg-red-50 rounded-[24px] p-4">
                <div className="flex items-center gap-2 text-[#BA2525] font-medium mb-4">
                  <span className="text-xl">📍</span>
                  {request.venue}
                </div>

                <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                  <Map 
                    markers={[{
                      coordinates: getVenueCoordinates(request.venue),
                      title: request.venue
                    }]}
                    center={getVenueCoordinates(request.venue)}
                    zoom={15}
                  />
                </div>

                <div className="flex items-center gap-2 text-[#BA2525] font-medium">
                  <span className="text-xl">📅</span>
                  {new Date(request.proposed_time).toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                  <span className="text-xl ml-4">⏰</span>
                  {new Date(request.proposed_time).toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
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

