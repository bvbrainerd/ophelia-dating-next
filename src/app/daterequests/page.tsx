'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';

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

// Define the shape of raw data from Supabase
interface RawDateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: 'pending' | 'accepted' | 'declined';
  proposed_payment: number;
  profiles: Profile; // This matches the joined profiles table
}

// Venue payment links mapping
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
};


export default function DateRequests() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRequests, setDateRequests] = useState<DateRequest[]>([]);

  const fetchDateRequests = async () => {
    try {
      const response = await fetch('/api/date-requests');
      if (!response.ok) throw new Error('Failed to fetch date requests');
      
      const { data } = await response.json();
      if (data) {
        const formattedRequests: DateRequest[] = data.map((request: RawDateRequest) => ({
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

  const handleDateResponse = async (requestId: string, newStatus: 'accepted' | 'declined') => {
    try {
      if (newStatus === 'accepted') {
        const acceptedDate = dateRequests.find(request => request.id === requestId);
        if (acceptedDate?.venue && VENUE_PAYMENT_LINKS[acceptedDate.venue]) {
          // Store date info before redirect
          sessionStorage.setItem('pendingDateId', requestId);
          sessionStorage.setItem('paymentReturnTime', new Date().toISOString());
          
          const returnUrl = new URL('/payment-success', window.location.origin).toString();
          const finalPaymentLink = `${VENUE_PAYMENT_LINKS[acceptedDate.venue]}?redirect=${encodeURIComponent(returnUrl)}`;
          window.location.href = finalPaymentLink;
          return;
        }
      }

      const response = await fetch('/api/date-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: requestId, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update date request');

      setDateRequests(prev =>
        prev.map(request =>
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
    const handlePaymentReturn = async () => {
      const pendingDateId = sessionStorage.getItem('pendingDateId');
      if (pendingDateId) {
        sessionStorage.removeItem('pendingDateId');
        sessionStorage.removeItem('paymentReturnTime');
        
        await handleDateResponse(pendingDateId, 'accepted');
      }
    };

    // Check if we're returning from payment
    if (window.location.pathname === '/payment-success') {
      handlePaymentReturn();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  return (
    <main className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Your Date Requests
      </h1>

      {dateRequests.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No pending date requests
        </div>
      ) : (
        <div className="space-y-5">
          {dateRequests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-5 shadow-sm"
            >
              <div className="flex items-center mb-4">
                <div className="relative w-24 h-24 mr-4">
                  <Image
                    src={request.sender.avatar_url || '/default-avatar.png'}
                    alt={`${request.sender.first_name} ${request.sender.last_name}`}
                    fill
                    className="object-cover rounded-full"
                    priority
                  />
                </div>
                <div>
                  <h2 className="text-[#cc0000] text-xl font-medium mb-1">
                    {request.sender.first_name} {request.sender.last_name}, {request.sender.age}
                  </h2>
                  <p className="text-gray-600 mb-1">{request.sender.bio}</p>
                  <p className="mb-1">
                    {request.venue} on {new Date(request.proposed_time).toLocaleDateString()} @{' '}
                    {new Date(request.proposed_time).toLocaleTimeString()}
                  </p>
                  {request.proposed_payment > 0 && (
                    <p className="font-medium">
                      Proposed Payment: ${request.proposed_payment}
                    </p>
                  )}
                </div>
              </div>

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
          ))}
        </div>
      )}

      <button
        className="w-full p-3 mt-4 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={() => router.push('/daterequests')}
      >
        Back to Dashboard
      </button>
    </main>
  );
}