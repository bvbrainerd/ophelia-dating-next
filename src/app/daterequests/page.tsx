// src/app/daterequests/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { Coffee } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

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

const VENUE_PAYMENT_LINKS: Record<string, string> = {
  'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Hockey': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
  'BC Basketball': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
  'Boston Commons': 'https://buy.stripe.com/eVaaH31ao2FDbKM3ck',
  'Kured': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'Private Helicopter Ride': 'https://buy.stripe.com/14k2ax7yM0xv6qs8wz',
  'Barcelona Wine Bar': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Capo': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Locco Fenway': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'F1 Arcade': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Lucca North End': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Lolita Back Bay': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Blue Ribbon Sushi': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Joes on Newbury': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Snowport @Seaport': 'https://buy.stripe.com/aEUaH39GUcgd6qs009',
  'Boston Celtics Game': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'The Clay Room': 'https://buy.stripe.com/00g8yVaKYgwt4ikaEO',
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
          const paymentLink = VENUE_PAYMENT_LINKS[request.venue];
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
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-5">
          <Header variant="matching" />
          
          <Link href="/daterequests">
            <h2 className="text-3xl font-bold text-[#BA2525] mt-0 mb-8 text-center hover:opacity-80 transition-opacity cursor-pointer">
              Your Date Requests
            </h2>
          </Link>

          <div className="grid grid-cols-1 gap-4">
            {dateRequests.map((request, index) => (
              <div key={request.id} className="mb-3">
                <Card className="bg-white p-4 rounded-[30px] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <Link href={`/profile/${request.sender?.id}`} className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-16 h-16">
                          <Image
                            src={request.sender?.avatar_url || '/images/default-avatar.png'}
                            alt={`${request.sender?.first_name}'s profile`}
                            fill
                            className="object-cover rounded-full"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-[#BA2525]">
                            {request.sender?.first_name}, {request.sender?.age}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {request.venue} • {
                              request.proposed_time 
                                ? new Date(request.proposed_time).toLocaleString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })
                                : 'No date specified'
                            }
                            {request.split_payment && ' • Split payment requested'}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleDateResponse(request.id, 'accepted')}
                        className="px-4 py-1.5 bg-[#BA2525] text-white rounded-full text-sm hover:bg-[#a02020] transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleDateResponse(request.id, 'declined')}
                        className="px-4 py-1.5 border border-[#BA2525] text-[#BA2525] rounded-full text-sm hover:bg-[#ffeeee] transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <Link
              href="/matching"
              className="px-6 py-3 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
            >
              View More Matches →
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    </>
  );
}

