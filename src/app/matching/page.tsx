'use client';

import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

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

interface RawDateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: 'pending' | 'accepted' | 'declined';
  proposed_payment: number;
  profiles: Profile;
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
} as const;

export default function MatchingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRequests, setDateRequests] = useState<DateRequest[]>([]);

  const fetchDateRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error: requestError } = await supabase
        .from('date_requests')
        .select(`
          id,
          venue,
          proposed_time,
          status,
          proposed_payment,
          profiles!date_requests_sender_id_fkey (
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
        .returns<RawDateRequest[]>();

      if (requestError) throw requestError;

      if (data) {
        const formattedRequests: DateRequest[] = data.map((request) => ({
          id: request.id,
          sender: request.profiles,
          venue: request.venue,
          proposed_time: request.proposed_time,
          status: request.status,
          proposed_payment: request.proposed_payment || 0,
        }));

        setDateRequests(formattedRequests);
      }
    } catch (error) {
      console.error('Error fetching date requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentReturn = async () => {
    const pendingDateId = localStorage.getItem('pendingDateId');
    if (pendingDateId) {
      localStorage.removeItem('pendingDateId');
      localStorage.removeItem('paymentReturnTime');
      
      setDateRequests(prev => prev.map(request =>
        request.id === pendingDateId 
          ? { ...request, status: 'accepted' }
          : request
      ));
    }
  };

  const handleDateResponse = async (requestId: string, newStatus: 'accepted' | 'declined') => {
    try {
      if (newStatus === 'accepted') {
        const acceptedDate = dateRequests.find(request => request.id === requestId);
        if (acceptedDate) {
          localStorage.setItem('pendingDateId', requestId);
          localStorage.setItem('paymentReturnTime', new Date().toISOString());

          const paymentLink = VENUE_PAYMENT_LINKS[acceptedDate.venue];
          if (paymentLink) {
            const returnUrl = `${window.location.origin}/payment-success`;
            const finalPaymentLink = `${paymentLink}?redirect=${encodeURIComponent(returnUrl)}`;
            window.location.href = finalPaymentLink;
            return;
          } else {
            console.error(`No payment link found for venue: ${acceptedDate.venue}`);
          }
        }
      }

      const { error } = await supabase
        .from('date_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      setDateRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? { ...request, status: newStatus }
            : request
        )
      );
    } catch (error) {
      console.error('Error updating date request:', error);
      alert('Failed to update date request. Please try again.');
    }
  };

  useEffect(() => {
    fetchDateRequests();
  }, []);

  useEffect(() => {
    handlePaymentReturn();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600';
      case 'declined':
        return 'text-[#cc0000]';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto p-5'>
      <h2 className='text-center text-[#cc0000] font-bold text-3xl mb-6'>
        Your Date Requests
      </h2>

      {dateRequests.length === 0 ? (
        <div className='text-center text-gray-600 py-8'>
          No pending date requests
        </div>
      ) : (
        <div className="space-y-5">
          {dateRequests.map((request) => (
            <div
              key={request.id}
              className='border border-gray-200 rounded-lg p-5 shadow-sm'
            >
              <div className='flex items-start space-x-4'>
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 border-2 border-gray-200 rounded-full overflow-hidden">
                    <Image
                      src={request.sender.avatar_url || '/default-avatar.png'}
                      alt={`${request.sender.first_name} ${request.sender.last_name}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 128px"
                      priority
                    />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className='text-[#cc0000] text-xl font-medium mb-1 truncate'>
                    {request.sender.first_name} {request.sender.last_name},{' '}
                    {request.sender.age}
                  </h3>
                  <p className='text-gray-600 text-sm mb-2 line-clamp-2'>{request.sender.bio}</p>
                  <p className='text-sm mb-2'>
                    <span className="font-medium">Venue:</span> {request.venue}
                  </p>
                  <p className='text-sm mb-2'>
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(request.proposed_time).toLocaleDateString()}
                  </p>
                  <p className='text-sm mb-2'>
                    <span className="font-medium">Time:</span>{' '}
                    {new Date(request.proposed_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {request.proposed_payment > 0 && (
                    <p className='text-sm font-medium'>
                      Proposed Payment: ${request.proposed_payment}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                {request.status === 'pending' ? (
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      className='p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors'
                      onClick={() => handleDateResponse(request.id, 'accepted')}
                    >
                      Accept
                    </button>
                    <button
                      className='p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
                      onClick={() => handleDateResponse(request.id, 'declined')}
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className='bg-gray-50 p-3 rounded-lg'>
                    <p className={`text-center font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className='w-full p-3 mt-6 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
        onClick={() => router.push('/dashboard')}
      >
        Back to Dashboard
      </button>
    </div>
  );
}