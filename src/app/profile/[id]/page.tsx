'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
  gender: 'male' | 'female' | 'other';
  dater_archetype: 'hopelessRomantic' | 'cautiousDater' | 'adventurous' | 'traditional' | 'independent';
}

const archetypeMap = {
  hopelessRomantic: "Hopeless Romantic",
  cautiousDater: "Cautious Dater", 
  adventurous: "Adventurous",
  traditional: "Traditional",
  independent: "Independent"
};

export default function UserProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [error, setError] = useState<string | null>(null);

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

if (error) {
  return <div className="text-center text-gray-600 py-8">{error}</div>;
}


  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const handleSendDateRequest = () => {
    router.push(`/send-date-request/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-600 py-8">
        Profile not found.
      </div>
    );
  }

  return (
    <main className="max-w-md mx-auto p-5">
      <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
        <Image
          src={profile.avatar_url || '/images/default-avatar.png'}
          alt={`${profile.first_name} ${profile.last_name}`}
          fill
          className="object-cover"
          onError={(e) => (e.currentTarget.src = '/images/default-avatar.png')}
        />

      </div>
      <h1 className="text-3xl font-bold text-[#cc0000] mb-2">
        {profile.first_name} {profile.last_name}, {profile.age}
      </h1>
      <h6>{archetypeMap[profile.dater_archetype]}</h6>
      <p className="text-gray-600 text-sm mb-4">{profile.bio}</p>

      <button
        onClick={handleSendDateRequest}
        className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors mb-3"
      >
        Send Date Request
      </button>
      <button
        onClick={() => router.push('/matching')}
        className="w-full p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
      >
        Back to Matching
      </button>
    </main>
  );
}
