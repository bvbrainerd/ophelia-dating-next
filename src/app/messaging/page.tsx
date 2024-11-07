'use client';

import { useState, useEffect } from 'react';
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
    }
  };

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

export default MessagingPage;
