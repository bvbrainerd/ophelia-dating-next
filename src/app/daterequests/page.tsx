// src/app/daterequests/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { Coffee } from 'lucide-react';

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
  sender: Profile;
  venue: string;
  proposed_time: string;
  status: 'pending' | 'accepted' | 'declined';
  proposed_payment: number;
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
            proposed_payment,
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

        const formattedRequests = requests?.map(request => ({
          ...request,
          sender: request.sender as unknown as Profile
        })) || [];

        setDateRequests(formattedRequests);
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
      const { error } = await supabase
        .from('date_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      setDateRequests(prev =>
        prev.filter(request => request.id !== requestId)
      );
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
      <main className="max-w-2xl mx-auto p-5 pt-8 pb-24">
        <Header />
        <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
          Your Date Requests
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {dateRequests.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            No pending date requests
          </div>
        ) : (
          <div className="space-y-5">
            {dateRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="relative w-32 h-32 border-2 border-gray-200 rounded-full overflow-hidden">
                      <Image
                        src={request.sender?.avatar_url || '/images/default-avatar.png'}
                        alt={request.sender ? `${request.sender.first_name}'s profile` : 'Profile'}
                        fill
                        priority={true}
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 128px"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/default-avatar.png';
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">
                      {request.sender 
                        ? `${request.sender.first_name}, ${request.sender.age}`
                        : 'Unknown User'
                      }
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
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {request.sender?.bio || 'No bio available'}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {request.status === 'pending' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        className="p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
                        onClick={() => handleDateResponse(request.id, 'accepted')}
                      >
                        Accept
                      </button>
                      <button
                        className="p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
                        onClick={() => handleDateResponse(request.id, 'declined')}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className={`text-center font-medium ${
                        request.status === 'accepted' ? 'text-green-600' : 'text-[#cc0000]'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}

