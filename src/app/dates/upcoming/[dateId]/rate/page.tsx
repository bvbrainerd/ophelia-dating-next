'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';

interface Profile {
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
}

interface DateRequestResponse {
  profiles: Profile;
}

export default function RatePage() {
  const params = useParams();
  const router = useRouter();
  const [personRating, setPersonRating] = useState<number>(0);
  const [dateRating, setDateRating] = useState<number>(0);
  const [hoverPerson, setHoverPerson] = useState<number>(0);
  const [hoverDate, setHoverDate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const getCleanAvatarUrl = (url: string | null) => {
    if (!url) return '/images/default-avatar.png';
    
    // If it's a full Supabase URL, clean it
    if (url.includes('supabase.co')) {
      // Extract the path after 'avatars/'
      const match = url.match(/avatars\/(.+?)(?:\?|$)/);
      if (match) {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${match[1]}`;
      }
    }
    
    // If it's a relative path, clean and construct URL
    const cleanPath = url.replace(/^avatars\/+/, '');
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${cleanPath}`;
  };

  useEffect(() => {
    const fetchDateDetails = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // First get the date request to determine if user is sender or receiver
      const { data: dateRequest } = await supabase
        .from('date_requests')
        .select('sender_id, receiver_id')
        .eq('id', params.dateId)
        .single();

      if (!dateRequest) return;

      // Determine which profile to fetch based on user's role
      const isUserSender = dateRequest.sender_id === session.user.id;
      const otherPersonId = isUserSender ? dateRequest.receiver_id : dateRequest.sender_id;

      // Fetch the other person's profile
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, age, avatar_url')
        .eq('id', otherPersonId)
        .single();

      if (otherProfile) {
        setProfile(otherProfile);
      }
    };

    fetchDateDetails();
  }, [params.dateId, router]);

  const handleSubmitRating = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Get the date request to identify the person being rated
      const { data: dateRequest, error: dateRequestError } = await supabase
        .from('date_requests')
        .select('sender_id, receiver_id')
        .eq('id', params.dateId)
        .single();

      if (dateRequestError) {
        console.error('Error fetching date request:', dateRequestError);
        throw dateRequestError;
      }

      if (!dateRequest) throw new Error('Date request not found');

      // Determine which user is being rated
      const isUserSender = dateRequest.sender_id === session.user.id;
      const ratedUserId = isUserSender ? dateRequest.receiver_id : dateRequest.sender_id;

      // Start a transaction by getting the current profile data
      const { data: currentProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('average_rating, total_rating')
        .eq('id', ratedUserId)
        .single();

      if (profileFetchError) {
        console.error('Error fetching profile:', profileFetchError);
        throw profileFetchError;
      }

      if (!currentProfile) throw new Error('Profile not found');

      // Calculate new average rating
      const currentTotal = currentProfile.total_rating || 0;
      const currentAverage = currentProfile.average_rating || 0;
      const newTotal = currentTotal + 1;
      const newAverage = ((currentAverage * currentTotal) + personRating) / newTotal;

      // Update the profile with new rating data
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          average_rating: newAverage,
          total_rating: newTotal
        })
        .eq('id', ratedUserId);

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError);
        throw profileUpdateError;
      }

      // Insert the rating record
      const { error: ratingError } = await supabase
        .from('date_ratings')
        .insert({
          date_request_id: params.dateId,
          rater_id: session.user.id,
          rated_user_id: ratedUserId,
          person_rating: personRating,
          date_rating: dateRating,
        });

      if (ratingError) {
        console.error('Error inserting rating:', ratingError);
        throw ratingError;
      }

      // Update date_requests status to rated
      const { error: statusUpdateError } = await supabase
        .from('date_requests')
        .update({ status: 'rated' })
        .eq('id', params.dateId);

      if (statusUpdateError) {
        console.error('Error updating date request status:', statusUpdateError);
        throw statusUpdateError;
      }

      router.push('/dates/upcoming');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const StarRating = ({ 
    rating, 
    hover, 
    setRating, 
    setHover 
  }: { 
    rating: number; 
    hover: number; 
    setRating: (rating: number) => void; 
    setHover: (hover: number) => void; 
  }) => {
    return (
      <div className="flex justify-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`text-4xl focus:outline-none ${
              star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(rating)}
            type="button"
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-2xl mx-auto p-5">
        <Header variant="matching" />
        
        <div className="flex flex-col items-center">
          <Image
            src="/images/ophelia-logo.png"
            alt="Ophelia Logo"
            width={150}
            height={50}
            className="mb-4"
          />
          
          <h1 className="text-[#BA2525] text-3xl font-bold mb-8">
            Rate Your Date
          </h1>

          {profile && (
            <div className="w-full max-w-md mx-auto">
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-32 h-32 mb-4">
                  <Image
                    src={profile.avatar_url || '/images/default-avatar.png'}
                    alt={`${profile.first_name}'s profile`}
                    fill
                    className="rounded-full object-cover"
                    sizes="(max-width: 128px) 100vw, 128px"
                  />
                </div>
                <h2 className="text-2xl font-semibold">
                  {profile.first_name} {profile.last_name}, {profile.age}
                </h2>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-center mb-4">
                    How was your date partner?
                  </h3>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setPersonRating(star)}
                        className={`text-4xl ${
                          star <= personRating ? 'text-[#BA2525]' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-center mb-4">
                    How was the overall date experience?
                  </h3>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setDateRating(star)}
                        className={`text-4xl ${
                          star <= dateRating ? 'text-[#BA2525]' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmitRating}
                  disabled={isLoading || !personRating || !dateRating}
                  className="w-full p-3 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : 'Submit Rating'}
                </button>

                <button
                  onClick={() => router.push('/dates/upcoming')}
                  className="w-full p-3 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
                >
                  Back to Upcoming Dates
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
} 