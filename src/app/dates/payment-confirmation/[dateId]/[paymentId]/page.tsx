'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { UUID_REGEX } from '@/utils/constants';

interface Profile {
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
}

interface DateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  sender: Profile;
  date_reservations: any[];
}

export default function PaymentConfirmationPage({
  params,
}: {
  params: { dateId: string; paymentId: string }
}) {
  const router = useRouter();
  const dateId = params.dateId;
  const paymentId = params.paymentId;
  const [dateDetails, setDateDetails] = useState<DateRequest | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDateDetails = async () => {
      try {
        if (!dateId || !paymentId) throw new Error('Date ID and Payment ID are required');

        // Validate UUID format
        if (!UUID_REGEX.test(dateId)) {
          setError('Invalid date ID format');
          setIsLoading(false);
          return;
        }

        // Get current user's session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // First check if the date request exists
        const { data: dateRequest, error: dateError } = await supabase
          .from('date_requests')
          .select(`
            *,
            sender:profiles!date_requests_sender_id_fkey (
              first_name,
              avatar_url,
              age
            ),
            date_reservations (*)
          `)
          .eq('id', dateId)
          .maybeSingle();

        if (dateError) {
          console.error('Error fetching date request:', dateError);
          setError('Failed to load date details');
          return;
        }

        if (!dateRequest) {
          setError('Date request not found');
          return;
        }
        
        // Verify user has access to this date request
        if (dateRequest.sender_id !== session.user.id && dateRequest.receiver_id !== session.user.id) {
          setError('You do not have permission to view this date');
          return;
        }

        setDateDetails(dateRequest);
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError('An unexpected error occurred');
        setIsLoading(false);
      }
    };

    if (dateId) {
      fetchDateDetails();
    }
  }, [dateId, paymentId, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!dateDetails) {
    return <div>No date details found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Payment Confirmation</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Date Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Venue</p>
            <p className="font-medium">{dateDetails.venue}</p>
          </div>
          <div>
            <p className="text-gray-600">Date & Time</p>
            <p className="font-medium">
              {new Date(dateDetails.proposed_time).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">With</p>
            <div className="flex items-center">
              <img
                src={dateDetails.sender.avatar_url || '/default-avatar.png'}
                alt={`${dateDetails.sender.first_name}'s avatar`}
                className="w-8 h-8 rounded-full mr-2"
              />
              <p className="font-medium">
                {dateDetails.sender.first_name}, {dateDetails.sender.age}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <svg
            className="w-6 h-6 text-green-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-green-800">
            Payment Successful!
          </h2>
        </div>
        <p className="text-green-700 mb-4">
          Your payment has been processed successfully. You're all set for your date!
        </p>
        <button
          onClick={() => router.push('/dates/upcoming')}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          View Your Upcoming Dates
        </button>
      </div>
    </div>
  );
} 