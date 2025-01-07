'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import Image from 'next/image';

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
    <div className="max-w-md mx-auto p-5 pt-8">
      <Header variant="matching" />
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Rate Your Date
      </h1>

      {profile && (
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <Image
              src={getCleanAvatarUrl(profile.avatar_url)}
              alt={`${profile.first_name}'s profile`}
              fill
              className="object-cover rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/default-avatar.png';
              }}
            />
          </div>
          <h2 className="text-xl font-medium">
            {profile.first_name} {profile.last_name}, {profile.age}
          </h2>
        </div>
      )}

      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-4">How was your date partner?</h3>
          <StarRating
            rating={personRating}
            hover={hoverPerson}
            setRating={setPersonRating}
            setHover={setHoverPerson}
          />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-medium mb-4">How was the overall date experience?</h3>
          <StarRating
            rating={dateRating}
            hover={hoverDate}
            setRating={setDateRating}
            setHover={setHoverDate}
          />
        </div>

        <button
          onClick={handleSubmitRating}
          disabled={isLoading || !personRating || !dateRating}
          className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Submitting...' : 'Submit Rating'}
        </button>

        <button 
          className="w-full p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
          onClick={() => router.push('/dates/upcoming')}
        >
          Back to Upcoming Dates
        </button>
      </div>
    </div>
  );
} 