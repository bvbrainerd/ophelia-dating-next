'use client';

<<<<<<< HEAD:src/app/daterequests/page.tsx
import React, { useState, useEffect } from 'react'
=======
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34:src/app/messaging/page.tsx

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

<<<<<<< HEAD:src/app/daterequests/page.tsx
interface DateRequestsPageProps {
  onBack: () => void
  onDateAccepted: (date: DateType) => void
}

// Map venues to their corresponding Stripe payment links
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
  'Boston Celtics Game': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0', // Added mapping for Boston Celtics Game
} as const

const DateRequestsPage: React.FC<DateRequestsPageProps> = ({ onBack, onDateAccepted }) => {
  const [dateRequests, setDateRequests] = useState<DateType[]>([
    {
      id: 1,
      name: 'Adelaide',
      age: 19,
      image: '/images/adelaide_profile.jpg',
      description: 'Hopeless Romantic',
      venue: 'Boston Celtics Game',
      date: '2024-11-02',
      time: '8:00 PM',
      status: 'pending',
      price: 150 // Updated to match Celtics price
    },
    {
      id: 2,
      name: 'Emelia',
      age: 21,
      image: '/images/emelia_profile.jpg',
      description: 'Cautious Dater',
      venue: 'Kured',
      date: '2024-11-01',
      time: '1:00 PM',
      status: 'pending',
      price: 10 // Updated to match Kured price
    }
  ])

  useEffect(() => {
    const handlePaymentReturn = async () => {
      const pendingDateId = localStorage.getItem('pendingDateId')
      if (pendingDateId) {
        // Clear the pending payment data
        localStorage.removeItem('pendingDateId')
        localStorage.removeItem('paymentReturnTime')
        
        // Update the date status
        const dateId = parseInt(pendingDateId)
        setDateRequests(prev => prev.map(request =>
          request.id === dateId 
            ? { ...request, status: 'accepted' }
            : request
        ))
      }
    }

    handlePaymentReturn()
  }, [])

  const handleDateResponse = async (id: number, newStatus: DateStatus) => {
    if (newStatus === 'accepted') {
      const acceptedDate = dateRequests.find(request => request.id === id)
      if (acceptedDate) {
        // Store the date ID before redirecting
        localStorage.setItem('pendingDateId', id.toString())
        localStorage.setItem('paymentReturnTime', new Date().toISOString())

        // Notify parent component
        onDateAccepted(acceptedDate)

        // Get payment link and redirect
        const paymentLink = VENUE_PAYMENT_LINKS[acceptedDate.venue]
        if (paymentLink) {
          // Add return URL to payment link
          const returnUrl = `${window.location.origin}/payment-success`
          const finalPaymentLink = `${paymentLink}?redirect=${encodeURIComponent(returnUrl)}`
          window.location.href = finalPaymentLink
        } else {
          console.error(`No payment link found for venue: ${acceptedDate.venue}`)
        }
      }
    } else {
      // Handle decline
      setDateRequests(prev => prev.map(request =>
        request.id === id ? { ...request, status: newStatus } : request
      ))
=======
interface DateRequest {
  id: string;
  sender: Profile;
  venue: string;
  proposed_time: string;
  status: 'pending' | 'accepted' | 'declined';
  proposed_payment: number;
}

// Type for raw Supabase response
interface RawDateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: 'pending' | 'accepted' | 'declined';
  proposed_payment: number;
  profiles: Profile;
}

const MessagingPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRequests, setDateRequests] = useState<DateRequest[]>([]);

  const fetchDateRequests = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get pending date requests
      const { data, error: requestError } = await supabase
        .from('date_requests')
        .select(
          `
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
        `,
        )
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .returns<RawDateRequest[]>();

      if (requestError) throw requestError;

      if (data) {
        // Format the requests with correct typing
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
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34:src/app/messaging/page.tsx
    }
  };

<<<<<<< HEAD:src/app/daterequests/page.tsx
  const getStatusColor = (status: DateStatus): string => {
=======
  const handleDateResponse = async (
    requestId: string,
    newStatus: 'accepted' | 'declined',
  ) => {
    try {
      const { error } = await supabase
        .from('date_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setDateRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? { ...request, status: newStatus }
            : request,
        ),
      );
    } catch (error) {
      console.error('Error updating date request:', error);
      alert('Failed to update date request. Please try again.');
    }
  };

  useEffect(() => {
    fetchDateRequests();
  }, []);

  const getStatusColor = (status: string) => {
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34:src/app/messaging/page.tsx
    switch (status) {
      case 'accepted':
        return 'text-green-600';
      case 'declined':
        return 'text-[#cc0000]';
      default:
        return 'text-gray-600';
    }
  };

<<<<<<< HEAD:src/app/daterequests/page.tsx
  const getStatusText = (status: DateStatus): string => {
    switch (status) {
      case 'accepted':
        return 'Accepted'
      case 'declined':
        return 'Declined'
      default:
        return 'Pending'
    }
=======
  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
      </div>
    );
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34:src/app/messaging/page.tsx
  }

  return (
    <div className='max-w-md mx-auto p-5'>
      <h2 className='text-center text-[#cc0000] font-bold text-3xl mb-6'>
        Your Date Requests
      </h2>
<<<<<<< HEAD:src/app/daterequests/page.tsx
      
      {dateRequests.map(request => (
        <div key={request.id} className="border border-gray-200 rounded-lg p-5 mb-5 shadow-sm">
          <div className="flex items-center mb-4">
            <img 
              src={request.image}
              alt={request.name} 
              className="w-24 h-24 object-cover rounded-full mr-4"
            />
            <div>
              <h3 className="text-[#cc0000] text-xl font-medium mb-1">
                {request.name}, {request.age}
              </h3>
              <p className="text-gray-600 mb-1">{request.description}</p>
              <p className="mb-1">
                {request.venue} on {request.date} @ {request.time}
              </p>
              <p className="font-medium">Price: ${request.price}</p>
            </div>
          </div>
          
          {request.status === 'pending' ? (
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
                onClick={() => handleDateResponse(request.id, 'accepted')}
              >
                Accept & Pay
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
              <p className={`text-center font-medium ${getStatusColor(request.status)}`}>
                {getStatusText(request.status)}
              </p>
            </div>
          )}
        </div>
      ))}
=======
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34:src/app/messaging/page.tsx

      {dateRequests.length === 0 ? (
        <div className='text-center text-gray-600 py-8'>
          No pending date requests
        </div>
      ) : (
        dateRequests.map((request) => (
          <div
            key={request.id}
            className='border border-gray-200 rounded-lg p-5 mb-5 shadow-sm'
          >
            <div className='flex items-center mb-4'>
              <div className='relative w-24 h-24 mr-4'>
                <Image
                  src={request.sender.avatar_url || '/default-avatar.png'}
                  alt={`${request.sender.first_name} ${request.sender.last_name}`}
                  fill
                  className='object-cover rounded-full'
                  priority
                />
              </div>
              <div>
                <h3 className='text-[#cc0000] text-xl font-medium mb-1'>
                  {request.sender.first_name} {request.sender.last_name},{' '}
                  {request.sender.age}
                </h3>
                <p className='text-gray-600 mb-1'>{request.sender.bio}</p>
                <p className='mb-1'>
                  {request.venue} on{' '}
                  {new Date(request.proposed_time).toLocaleDateString()} @{' '}
                  {new Date(request.proposed_time).toLocaleTimeString()}
                </p>
                {request.proposed_payment > 0 && (
                  <p className='font-medium'>
                    Proposed Payment: ${request.proposed_payment}
                  </p>
                )}
              </div>
            </div>

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
                <p
                  className={`text-center font-medium ${getStatusColor(
                    request.status,
                  )}`}
                >
                  {request.status.charAt(0).toUpperCase() +
                    request.status.slice(1)}
                </p>
              </div>
            )}
          </div>
        ))
      )}

      <button
        className='w-full p-3 mt-4 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
        onClick={() => router.push('/dashboard')}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

<<<<<<< HEAD:src/app/daterequests/page.tsx
export default DateRequestsPage
=======
export default MessagingPage;
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34:src/app/messaging/page.tsx
