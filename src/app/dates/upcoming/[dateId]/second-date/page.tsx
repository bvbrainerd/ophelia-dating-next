'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import VenueSelector from '@/components/VenueSelector';
import { Venue } from '@/types/venue';
import Link from 'next/link';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

const VENUES: Record<string, Venue[]> = {
  sports: [
    { 
      id: "boston-bruins",
      name: "Boston Bruins",
      location: "TD Garden",
      type: "Sports",
      rating: 4.7,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/bruins.jpg`,
      stripeLink: "https://buy.stripe.com/00gg1ng5i1BzeWY6os",
      coordinates: [-71.0622, 42.3663],
      distance: "5.8 mi"
    },
    { 
      id: "celtics",
      name: "Celtics",
      location: "TD Garden",
      type: "Sports",
      rating: 4.7,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/celtics.jpg`,
      stripeLink: "https://buy.stripe.com/5kA8yVf1e0xvg12eV0",
      coordinates: [-71.0622, 42.3663],
      distance: "5.8 mi"
    }
  ],
  restaurants: [
    { 
      id: "barcelona-wine-bar",
      name: "Barcelona Wine Bar",
      location: "Boston, MA",
      type: "Spanish",
      price: "$$$",
      rating: 4.6,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/barcelona.jpg`,
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0761, 42.3457],
      distance: "4.9 mi"
    },
    { 
      id: "capo",
      name: "Capo",
      location: "South Boston",
      type: "Italian",
      price: "$$$",
      rating: 4.5,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/capo.jpg`,
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0424, 42.3363],
      distance: "6.7 mi"
    }
  ],
  activities: [
    { 
      id: "museum-of-fine-arts",
      name: "Museum of Fine Arts",
      location: "Boston, MA",
      type: "Culture",
      rating: 4.8,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/museum.jpg`,
      stripeLink: "https://buy.stripe.com/aEU8yV7yM5RP8yA3ce",
      coordinates: [-71.0995, 42.3394],
      distance: "3.6 mi"
    },
    {
      id: "boston-commons",
      name: "Boston Commons",
      location: "Boston, MA",
      type: "Park",
      rating: 4.7,
      price: "$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/commons.jpg`,
      stripeLink: "https://buy.stripe.com/eVaaH31ao2FDbKM3ck",
      coordinates: [-71.0670, 42.3554],
      distance: "5.5 mi"
    }
  ]
};

export default function SecondDateProposal() {
  const params = useParams();
  const router = useRouter();
  const [venue, setVenue] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      try {
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
          .select('*')
          .eq('id', otherPersonId)
          .single();

        if (otherProfile) {
          setProfile(otherProfile);
        }
      } catch (error) {
        console.error('Error fetching date details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDateDetails();
  }, [params.dateId, router]);

  const proposeSecondDate = async () => {
    try {
      if (!venue || !proposedTime) {
        alert('Please select a venue and time for the date');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Create a new date request for the second date
      const { error } = await supabase
        .from('date_requests')
        .insert({
          sender_id: session.user.id,
          receiver_id: profile?.id,
          venue: venue,
          proposed_time: proposedTime,
          status: 'pending',
          is_second_date: true,
          original_date_id: params.dateId
        });

      if (error) throw error;

      alert('Second date proposed successfully!');
      router.push('/dates/upcoming');
    } catch (error) {
      console.error('Error proposing second date:', error);
      alert('Failed to propose second date. Please try again.');
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
    <div className="max-w-md mx-auto p-5 pt-8">
      <Header variant="matching" />
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Propose Second Date
      </h1>

      {profile && (
        <Link 
          href={`/profile/${profile.id}?context=second-date&dateId=${params.dateId}`}
          className="flex items-center gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="relative w-24 h-24">
            <Image
              src={getCleanAvatarUrl(profile.avatar_url)}
              alt={`${profile.first_name}'s profile`}
              fill
              className="rounded-full object-cover"
              sizes="(max-width: 96px) 100vw, 96px"
              priority
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#cc0000]">
              {profile.first_name} {profile.last_name}, {profile.age}
            </h2>
            <p className="text-gray-600 text-sm mt-1">{profile.bio}</p>
          </div>
        </Link>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Date Location</h2>
          <VenueSelector 
            venues={VENUES}
            onVenueSelect={setVenue}
            selectedVenue={venue}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Date</h2>
            <input 
              type="date"
              value={proposedTime.split('T')[0] || ''}
              onChange={(e) => {
                const newDate = e.target.value;
                const currentTime = proposedTime.split('T')[1] || '00:00';
                setProposedTime(`${newDate}T${currentTime}`);
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Time</h2>
            <input 
              type="time"
              value={proposedTime.split('T')[1] || ''}
              onChange={(e) => {
                const currentDate = proposedTime.split('T')[0] || new Date().toISOString().split('T')[0];
                setProposedTime(`${currentDate}T${e.target.value}`);
              }}
              className="w-full p-3 border rounded-lg text-sm"
              required
              step="1800"
            />
          </div>
        </div>

        <button 
          className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
          onClick={proposeSecondDate}
          disabled={!venue || !proposedTime}
        >
          Propose Second Date
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