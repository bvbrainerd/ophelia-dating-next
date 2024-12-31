'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
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

const getSignedUrl = async (filePath: string) => {
  try {
    if (!filePath || filePath.includes('default-avatar')) {
      return '/images/default-avatar.png';
    }

    // If the URL is already a signed URL or complete URL, return it as is
    if (filePath.startsWith('http')) {
      return filePath;
    }

    // Extract filename whether it's a full path or just filename
    const fileName = filePath.includes('/') 
      ? filePath.split('/').pop() 
      : filePath;

    if (!fileName) return '/images/default-avatar.png';

    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(fileName, 60 * 60);

    if (error) {
      console.log('Falling back to direct URL');
      // Try using the direct URL format
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return '/images/default-avatar.png';
  }
};

export default function UserProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          console.log('Original avatar URL:', data.avatar_url);
          
          const signedAvatarUrl = await getSignedUrl(data.avatar_url);
          console.log('Signed avatar URL:', signedAvatarUrl);
          
          setProfile({
            ...data,
            avatar_url: signedAvatarUrl
          });
        }
        
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
        localStorage.setItem('redirectAfterLogin', `/send-date-request/${id}`);
        router.push('/auth/login');
        return;
      }

      router.push(`/send-date-request/${id}`);
    } catch (error) {
      console.error('Error in handleSendDateRequest:', error);
      setError('An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-[#BA2525] py-8 bg-white min-h-screen">
        {error}
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-[#BA2525] py-8 bg-white min-h-screen">
        Profile not found.
        <BottomNav />
      </div>
    );
  }

  return (
    <>
      <main className="max-w-md mx-auto p-5 pb-24 bg-white min-h-screen">
        <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
          <Image
            src={profile.avatar_url || '/images/default-avatar.png'}
            alt={`${profile.first_name} ${profile.last_name}`}
            fill
            className="object-cover"
            onError={(e) => (e.currentTarget.src = '/images/default-avatar.png')}
          />
        </div>

        {/* Basic Info - Updated with smaller text size */}
        <h1 className="text-2xl font-extrabold text-[#BA2525] mb-6">
          {profile.first_name}, {profile.age}
        </h1>

        {/* Profile Details */}
        <div className="mb-8 space-y-1">
          {/* Dater Type */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-[#BA2525] mb-1">Dater Type</h2>
            <p className="text-gray-700">{archetypeMap[profile.dater_archetype]}</p>
          </div>

          {/* Gender */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-[#BA2525] mb-1">Gender</h2>
            <p className="text-gray-600 capitalize">{profile.gender}</p>
          </div>

          {/* School */}
          {profile.school && profile.school !== 'N/A' && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-[#BA2525] mb-1">School</h2>
              <p className="text-gray-600">{profile.school}</p>
            </div>
          )}

          {/* Bio Section - only show if there's content */}
          {profile.bio && profile.bio.trim() !== '' && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600">{profile.bio}</p>
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
            className="w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors mb-3"
          >
            Send Date Request
          </button>
          {error && (
            <div className="text-[#BA2525] text-sm mb-3">
              {error}
            </div>
          )}
          <button
            type="button"
            id="back-to-matching"
            name="back-to-matching"
            onClick={() => router.push('/matching')}
            className="w-full p-2.5 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
          >
            Back to Matching
          </button>
        </div>
      </main>
      <BottomNav />
    </>
  );
}