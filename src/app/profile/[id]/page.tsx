'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '../../../supabase/client';
import BottomNav from '@/components/BottomNav';
import { Crown, Star, Heart } from 'lucide-react';
import Header from '@/components/Header';
import ProfileImageGallery from '@/components/ProfileImageGallery';
import Map from '@/components/Map';

interface ProfileImage {
  id: number;
  image_url: string;
  is_main: boolean;
}

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
  average_rating: number | null;
  total_ratings: number | null;
  dater_status: 'gold' | 'silver' | 'bronze' | null;
  follow_through_rate: number | null;
  profile_images?: ProfileImage[];
  descriptors: { category: 'Personality' | 'Interests' | 'Lifestyle'; label: string }[];
}

type DaterArchetype = 'hopelessRomantic' | 'cautiousDater' | 'commitmentSeeker' | 'serialDater' | 'friendWithBenefits';

type CompatibilityMap = {
  [K in DaterArchetype]: {
    [L in DaterArchetype]: number;
  };
};

const archetypeMap = {
  hopelessRomantic: 'Hopeless Romantic',
  cautiousDater: 'Cautious Dater',
  adventurous: 'Adventurous',
  traditional: 'Traditional',
  independent: 'Independent',
};

const getSignedUrl = async (filePath: string) => {
  try {
    // If no filePath or it's the default avatar, return default image
    if (!filePath || filePath.includes('default-avatar')) {
      return '/images/default-avatar.png';
    }

    // If it's already a full URL, return it as is
    if (filePath.includes('supabase.co')) {
      return filePath;
    }

    // Clean the path by removing any prefixes
    const cleanPath = filePath
      .replace(/^\/+/, '')  // Remove leading slashes
      .replace(/^avatars\/avatars\//, '') // Remove double avatars prefix
      .replace(/^avatars\//, '') // Remove single avatars prefix
      .split('?')[0];  // Remove query parameters

    console.log('Cleaned path:', cleanPath);

    // Try to get a public URL first
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(cleanPath);

    if (publicUrlData?.publicUrl) {
      console.log('Generated public URL:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }

    // Fallback to signed URL if public URL fails
    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(cleanPath, 3600); // 1 hour expiry

    if (error || !data) {
      console.error('Error getting signed URL:', error);
      return '/images/default-avatar.png';
    }

    console.log('Generated signed URL:', data.signedUrl);
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting URL:', error);
    return '/images/default-avatar.png';
  }
};

const calculateCompatibility = (userArchetype: DaterArchetype, matchArchetype: DaterArchetype): number => {
  const compatibilityMap: CompatibilityMap = {
    'hopelessRomantic': {
      'hopelessRomantic': 95,
      'cautiousDater': 85,
      'commitmentSeeker': 90,
      'serialDater': 60,
      'friendWithBenefits': 40
    },
    'cautiousDater': {
      'cautiousDater': 90,
      'hopelessRomantic': 85,
      'commitmentSeeker': 80,
      'serialDater': 50,
      'friendWithBenefits': 30
    },
    'commitmentSeeker': {
      'commitmentSeeker': 95,
      'hopelessRomantic': 90,
      'serialDater': 70,
      'cautiousDater': 80,
      'friendWithBenefits': 30
    },
    'serialDater': {
      'serialDater': 90,
      'commitmentSeeker': 70,
      'hopelessRomantic': 60,
      'cautiousDater': 50,
      'friendWithBenefits': 75
    },
    'friendWithBenefits': {
      'friendWithBenefits': 95,
      'serialDater': 75,
      'hopelessRomantic': 40,
      'cautiousDater': 30,
      'commitmentSeeker': 30
    }
  };

  return compatibilityMap[userArchetype]?.[matchArchetype] || 0;
};

export default function UserProfile() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = searchParams.get('context');
  const dateId = searchParams.get('dateId');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [venueCoordinates, setVenueCoordinates] = useState<Record<string, [number, number]>>({});
  const [compatibility, setCompatibility] = useState<number | null>(null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get current user's session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          
          // Fetch current user's archetype
          const { data: currentUserData } = await supabase
            .from('profiles')
            .select('dater_archetype')
            .eq('id', session.user.id)
            .single();

          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

          if (profileError) throw profileError;

          // Calculate compatibility if both archetypes are available
          if (currentUserData?.dater_archetype && profileData?.dater_archetype) {
            const score = calculateCompatibility(
              currentUserData.dater_archetype,
              profileData.dater_archetype
            );
            setCompatibility(score);
          }

          // Fetch profile images
          const { data: imageData, error: imageError } = await supabase
            .from('profile_images')
            .select('*')
            .eq('profile_id', id)
            .order('is_main', { ascending: false });

          if (imageError) throw imageError;

          // Process image URLs
          let images = [];
          if (imageData?.length > 0) {
            images = await Promise.all(imageData.map(async img => ({
              ...img,
              image_url: await getSignedUrl(img.image_url)
            })));
          } else if (profileData.avatar_url) {
            // If no profile images but has avatar_url, process it
            const signedUrl = await getSignedUrl(profileData.avatar_url);
            images = [{
              id: 0,
              image_url: signedUrl,
              is_main: true
            }];
          } else {
            // If no images, use default avatar
            images = [{
              id: 0,
              image_url: '/images/default-avatar.png',
              is_main: true
            }];
          }

          setProfile({
            ...profileData,
            profile_images: images
          });
          
          setError(null);
        }
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

  const handleBackButton = () => {
    if (context === 'second-date' && dateId) {
      router.push(`/dates/upcoming/${dateId}/second-date`);
    } else {
      router.push('/matching');
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
        <Header variant="logo-only" />
        
        {/* Profile Image with Compatibility Score */}
        <div className="w-full max-w-lg mx-auto mb-6 relative">
          <ProfileImageGallery
            images={profile.profile_images || []}
            mode="view"
            className="rounded-lg shadow-md"
          />
          {typeof compatibility === 'number' && (
            <div className="absolute top-2 right-2 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center">
              <span className="text-[#BA2525] font-bold text-sm">{compatibility}%</span>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <h1 className="text-2xl font-bold text-[#BA2525] mb-6">
          {profile.first_name}, {profile.age}
        </h1>

        {/* Rankings Section */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Dater Status */}
          <div className="bg-white rounded-full border-2 border-[#BA2525] p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-[#BA2525] fill-[#BA2525]" />
              <span className="text-[#BA2525] font-medium capitalize">
                {profile.dater_status || 'Bronze'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Dater Status</div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-full border-2 border-[#BA2525] p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-[#BA2525] fill-[#BA2525]" />
              <span className="text-[#BA2525] font-medium">
                {profile.average_rating ? profile.average_rating.toFixed(1) : '0.0'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Dater Rating</div>
          </div>

          {/* Follow-Through */}
          <div className="bg-white rounded-full border-2 border-[#BA2525] p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-[#BA2525] fill-[#BA2525]" />
              <span className="text-[#BA2525] font-medium">
                {profile.follow_through_rate ? `${profile.follow_through_rate}%` : '0%'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Follow-Through</div>
          </div>
        </div>

        {/* Bio Section with Descriptors */}
        {(profile.bio || (profile.descriptors && profile.descriptors.length > 0)) && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-[#BA2525] mb-2">Bio</h2>
            {profile.bio && (
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{profile.bio}</p>
            )}
            {profile.descriptors && profile.descriptors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.descriptors.map(descriptor => (
                  <span
                    key={descriptor.label}
                    className="inline-block px-3 py-1 bg-[#BA2525] text-white rounded-full text-sm"
                  >
                    {descriptor.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Details */}
        <div className="mb-8 space-y-4">
          {/* Dater Type */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-[#BA2525] mb-1">Dater Type</h2>
            <p className="text-gray-700">{archetypeMap[profile.dater_archetype]}</p>
          </div>

          {/* Gender */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-[#BA2525] mb-1">Gender</h2>
            <p className="text-gray-700 capitalize">{profile.gender}</p>
          </div>

          {/* School */}
          {profile.school && profile.school !== 'N/A' && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-[#BA2525] mb-1">School</h2>
              <p className="text-gray-700">{profile.school}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div>
          {error && (
            <div className="text-[#BA2525] text-sm mb-3">
              {error}
            </div>
          )}
          <button
            onClick={() => router.push(`/send-date-request/${id}`)}
            className="w-full p-2.5 bg-[#BA2525] text-white border-2 border-white rounded-full font-medium hover:bg-[#a02020] transition-colors mb-2"
          >
            Send Date Request
          </button>
          <button
            onClick={handleBackButton}
            className="w-full p-2.5 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
          >
            {context === 'second-date' ? 'Back to Second Date' : 'Back to Matching'}
          </button>
        </div>
      </main>
      <BottomNav />
    </>
  );
}