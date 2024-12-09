'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BottomNav from '@/components/BottomNav';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
  gender: 'male' | 'female' | 'other';
  dater_archetype: 'hopelessRomantic' | 'cautiousDater' | 'adventurous' | 'traditional' | 'independent';
  preferred_gender: 'male' | 'female' | 'other';
  school: string;
}

const archetypeMap = {
  hopelessRomantic: 'Hopeless Romantic',
  cautiousDater: 'Cautious Dater',
  adventurous: 'Adventurous',
  traditional: 'Traditional',
  independent: 'Independent',
};

export default function UserProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Create Supabase client once
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setProfile(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  const handleSendDateRequest = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Store the intended destination
        localStorage.setItem('redirectAfterLogin', `/send-date-request/${id}`);
        router.push('/auth/login');
        return;
      }

      // If user is authenticated, navigate directly to send date request page
      router.push(`/send-date-request/${id}`);
      
    } catch (error) {
      console.error('Error in handleSendDateRequest:', error);
      setError('An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-gray-600 py-8">
        {error}
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-600 py-8">
        Profile not found.
        <BottomNav />
      </div>
    );
  }

  return (
    <>
      <main className="max-w-md mx-auto p-5 pb-24">
        <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
          <Image
            src={profile.avatar_url || '/images/default-avatar.png'}
            alt={`${profile.first_name} ${profile.last_name}`}
            fill
            className="object-cover"
            onError={(e) => (e.currentTarget.src = '/images/default-avatar.png')}
          />
        </div>

        {/* Basic Info */}
        <h1 className="text-3xl font-bold text-[#cc0000] mb-2">
          {profile.first_name} {profile.last_name}, {profile.age}
        </h1>

        {/* Profile Details */}
        <div className="mb-8">
          {/* Dater Archetype */}
          <div className="bg-[#ffeeee] p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-[#cc0000] mb-1">Dater Type</h2>
            <p className="text-gray-700">{archetypeMap[profile.dater_archetype]}</p>
          </div>

          {/* Bio Section - only show if there's content */}
          {profile.bio && profile.bio.trim() !== '' && (
            <div className="bg-gray-50 p-4 rounded-lg mt-[1px]">
              <p className="text-gray-600">{profile.bio}</p>
            </div>
          )}

          {/* Gender */}
          <div className="bg-gray-50 p-4 rounded-lg mt-[1px]">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Gender</h2>
            <p className="text-gray-600 capitalize">{profile.gender}</p>
          </div>

          {/* School */}
          {profile.school && profile.school !== 'N/A' && (
            <div className="bg-gray-50 p-4 rounded-lg mt-[1px]">
              <h2 className="text-sm font-semibold text-gray-700 mb-1">School</h2>
              <p className="text-gray-600">{profile.school}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div>
          <button
            type="button"
            id="send-date-request"
            name="send-date-request"
            onClick={handleSendDateRequest}
            className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors mb-3"
          >
            Send Date Request
          </button>
          {error && (
            <div className="text-red-600 text-sm mb-3">
              {error}
            </div>
          )}
          <button
            type="button"
            id="back-to-matching"
            name="back-to-matching"
            onClick={() => router.push('/matching')}
            className="w-full p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
          >
            Back to Matching
          </button>
        </div>
      </main>
      <BottomNav />
    </>
  );
}