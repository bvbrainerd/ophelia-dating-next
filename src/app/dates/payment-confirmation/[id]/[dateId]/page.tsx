'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Stripe payment links for each venue
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

export default function PaymentConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const dateId = params.id as string;
  const [dateDetails, setDateDetails] = useState<any>(null);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDateDetails = async () => {
      try {
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
          .maybeSingle(); // Use maybeSingle instead of single to handle null case

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
      } catch (error: any) {
        console.error('Error fetching date details:', error);
        setError(error.message || 'Failed to load date details');
      } finally {
        setIsLoading(false);
      }
    };

    if (dateId) {
      fetchDateDetails();
    }
  }, [dateId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (error || !dateDetails) {
    return (
      <div className="min-h-screen bg-white">
        <Header variant="default" />
        <div className="max-w-md mx-auto mt-8 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#cc0000] mb-4">Error</h1>
            <p className="text-gray-600 mb-8">{error || 'Date not found'}</p>
            <Link 
              href="/daterequests"
              className="inline-block px-6 py-3 bg-[#cc0000] text-white rounded-full hover:bg-[#a02020] transition-colors"
            >
              Back to Date Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white pb-20">
        <Header variant="default" />
        <div className="max-w-md mx-auto mt-8 p-6">
          <h1 className="text-2xl font-bold text-[#cc0000] mb-6">Payment Confirmation</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16">
                <Image
                  src={dateDetails.sender?.avatar_url || '/images/default-avatar.png'}
                  alt={`${dateDetails.sender?.first_name}'s profile`}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {dateDetails.sender?.first_name}, {dateDetails.sender?.age}
                </h2>
                <p className="text-gray-600">{dateDetails.venue}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">
                  {new Date(dateDetails.proposed_time).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-medium">
                  {new Date(dateDetails.proposed_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium capitalize">{dateDetails.status}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href={`/payment-redirect?url=${encodeURIComponent(stripeLinks[dateDetails.venue] || '')}`}
              className="block w-full py-3 bg-[#cc0000] text-white text-center rounded-full font-medium hover:bg-[#a02020] transition-colors"
            >
              Proceed to Payment
            </Link>
            
            <Link
              href="/daterequests"
              className="block w-full py-3 text-[#cc0000] text-center border-2 border-[#cc0000] rounded-full font-medium hover:bg-red-50 transition-colors"
            >
              Back to Date Requests
            </Link>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
} 