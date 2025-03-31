'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
}

const VENUE_PAYMENT_LINKS: Record<string, string> = {
  'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Hockey': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
  'BC Basketball': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
  'Barcelona Wine Bar': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'The Clay Room': 'https://buy.stripe.com/00g8yVaKYgwt4ikaEO',
  'Boston Duck Tour': 'https://buy.stripe.com/14k9CZbP20xv7uw28j',
  'Boston Commons': 'https://buy.stripe.com/eVaaH31ao2FDbKM3ck',
  'Private Helicopter Ride': 'https://buy.stripe.com/14k2ax7yM0xv6qs8wz',
};

export default function PaymentPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchProfile, setMatchProfile] = useState<Profile | null>(null);

  const matchId = searchParams.matchId as string;
  const venue = searchParams.venue as string;
  const date = searchParams.date as string;
  const time = searchParams.time as string;
  const amount = searchParams.amount ? parseFloat(searchParams.amount as string) : 0;

  useEffect(() => {
    if (!matchId || !venue || !date || !time || !amount) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    const fetchMatchProfile = async () => {
      try {
        if (!matchId) {
          router.replace('/match-challenge');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, age, avatar_url')
          .eq('id', matchId)
          .single();

        if (error) throw error;
        setMatchProfile(profile);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load match profile');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchProfile();
  }, [matchId, router]);

  const handlePayment = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth/login');
        return;
      }

      // Create the date request with all required fields
      const dateRequest = {
        sender_id: session.user.id,
        receiver_id: matchId,
        venue: venue,
        proposed_time: `${date}T${time}`,
        status: 'pending',
        is_challenge: true,
        challenge_status: 'committed',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: dateRequestError } = await supabase
        .from('date_requests')
        .insert([dateRequest]);

      if (dateRequestError) {
        console.error('Date request error:', dateRequestError);
        throw dateRequestError;
      }

      // Get the venue-specific payment link
      const paymentLink = VENUE_PAYMENT_LINKS[venue || ''] || 'https://buy.stripe.com/3cscPb7yMa854ik5kk';
      
      // Redirect to Stripe payment page
      window.location.href = paymentLink;
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to process payment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-5 pb-24">
        <Header variant="logo-only" />

        <div className="space-y-6 mt-10">
          <h1 className="text-3xl font-bold text-[#BA2525] text-center">Finalize Your Date</h1>
          
          <div className="bg-[#ffeeee] p-4 rounded-lg">
            <p className="text-[#BA2525] font-medium">
              ⚠️ Final Commitment Step
            </p>
            <p className="text-gray-700 text-sm mt-2">
              By completing this payment, you are making a binding commitment to attend this date.
              No refunds or cancellations allowed.
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold text-[#BA2525]">Your Confirmed Date</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Match:</span> {matchProfile?.first_name}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Venue:</span> {venue}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Date:</span> {date}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Time:</span> {time}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold text-[#BA2525]">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Date Experience</span>
                <span className="text-gray-700">$50.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Service Fee</span>
                <span className="text-gray-700">$5.00</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-700">Total</span>
                  <span className="text-[#BA2525]">$55.00</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handlePayment}
              className="w-full p-3 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors"
            >
              Confirm & Pay
            </button>
            <p className="text-xs text-gray-500 text-center">
              By clicking "Confirm & Pay", you agree to attend this date with no possibility of cancellation.
            </p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
} 