'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

interface ReferralResponse {
  id: string;
  status: 'pending' | 'completed';
  created_at: string;
  referred_profile: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Referral {
  id: string;
  referred_profile: {
    first_name: string;
    last_name: string;
    email: string;
  };
  status: 'pending' | 'completed';
  created_at: string;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Get user's referral code
        const { data: profileData } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', session.user.id)
          .single();

        if (profileData?.referral_code) {
          setReferralCode(profileData.referral_code);
        }

        // Get user's referrals with referred user details
        const { data, error: referralsError } = await supabase
          .from('referrals')
          .select(`
            id,
            status,
            created_at,
            referred_profile:profiles!referred_id(
              first_name,
              last_name,
              email
            )
          `)
          .eq('referrer_id', session.user.id)
          .order('created_at', { ascending: false });

        if (referralsError) throw referralsError;

        // Transform the data with proper typing
        const referralsData = (data as unknown as ReferralResponse[])?.map(referral => ({
          id: referral.id,
          status: referral.status as 'pending' | 'completed',
          created_at: referral.created_at,
          referred_profile: {
            first_name: referral.referred_profile.first_name,
            last_name: referral.referred_profile.last_name,
            email: referral.referred_profile.email
          }
        })) || [];

        setReferrals(referralsData);
      } catch (err) {
        console.error('Error fetching referrals:', err);
        setError('Failed to load referrals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferrals();
  }, [router]);

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <Header variant="matching" />
      
      <div className="max-w-2xl mx-auto p-5">
        <h1 className="text-2xl font-bold text-[#BA2525] mb-6">
          Your Referrals
        </h1>

        {/* Referral Link Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Share Your Referral Link</h2>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={`${window.location.origin}/auth/signup?ref=${referralCode}`}
              readOnly
              className="flex-1 p-3 bg-gray-50 border rounded-lg font-mono text-sm"
            />
            <button
              onClick={copyReferralLink}
              className="p-3 bg-[#BA2525] text-white rounded-lg hover:bg-[#a02020] transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Your referral code: <span className="font-mono">{referralCode}</span>
          </p>
        </div>

        {/* Referrals List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#BA2525] mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            You haven't referred anyone yet. Share your referral link to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {referral.referred_profile.first_name} {referral.referred_profile.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {referral.referred_profile.email}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Referred on {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      referral.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {referral.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
} 