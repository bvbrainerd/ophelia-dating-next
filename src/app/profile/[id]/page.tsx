'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '../../../supabase/client';
import BottomNav from '@/components/BottomNav';
import { Crown, Star, Heart, MapPin } from 'lucide-react';
import Header from '@/components/Header';
import ProfileImageGallery from '@/components/ProfileImageGallery';
import Map from '@/components/Map';
import Image from 'next/image';

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
  location?: string;
  average_rating: number | null;
  total_ratings: number | null;
  dater_status: 'gold' | 'silver' | 'bronze' | null;
  follow_through_rate: number | null;
  profile_images?: ProfileImage[];
  descriptors: { category: 'Personality' | 'Interests' | 'Lifestyle'; label: string }[];
  previous_dates?: PreviousDate[];
  relationship_status: 'single' | 'in_relationship' | 'complicated' | 'engaged' | 'married' | 'divorced' | 'widowed' | null;
}

interface DateRequestResponse {
  id: string;
  venue: string;
  proposed_time: string;
  sender: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  };
  date_ratings: Array<{
    person_rating: number;
  }> | null;
}

interface PreviousDate {
  id: string;
  venue: string;
  date: string;
  partner: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  };
  rating?: number;
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
  const [previousDates, setPreviousDates] = useState<PreviousDate[]>([]);
  
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

  useEffect(() => {
    const fetchPreviousDates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dateData, error } = await supabase
          .from('date_requests')
          .select(`
            id,
            venue,
            proposed_time,
            sender:profiles!date_requests_sender_id_fkey (
              id,
              first_name,
              avatar_url,
              age
            ),
            date_ratings (
              person_rating
            )
          `)
          .eq('status', 'rated')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('proposed_time', { ascending: false });

        if (error) throw error;

        if (dateData) {
          const transformedDates = (dateData as unknown as DateRequestResponse[]).map(date => ({
            id: date.id,
            venue: date.venue,
            date: date.proposed_time,
            partner: {
              id: date.sender.id,
              first_name: date.sender.first_name,
              avatar_url: date.sender.avatar_url,
              age: date.sender.age
            },
            rating: date.date_ratings?.[0]?.person_rating
          }));
          setPreviousDates(transformedDates);
        }
      } catch (error) {
        console.error('Error fetching previous dates:', error);
      }
    };

    fetchPreviousDates();
  }, []);

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
    if (profile?.relationship_status === 'in_relationship') {
      router.push('/matching'); // This will show curated dates view for couples
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
    <div className="min-h-screen bg-[#cc0000] pb-20">
      <main className="bg-[#cc0000] min-h-screen relative">
        <div className="absolute top-0 left-0 right-0 z-10">
          <Header variant="default" />
        </div>
        
        <div className="pt-20">
          {/* Profile Image with Compatibility Score */}
          <div className="relative w-full max-w-3xl mx-auto">
            <div className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden">
              <ProfileImageGallery
                images={profile.profile_images || []}
                mode="view"
                className="w-full h-full object-cover object-center"
              />
              {typeof compatibility === 'number' && (
                <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-[#cc0000] flex items-center gap-2 shadow-lg">
                  <Heart className="w-4 h-4" fill="#cc0000" stroke="#cc0000" />
                  <span className="font-bold">{compatibility}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Content Container */}
          <div className="px-5 mt-4 relative z-10">
            <div className="bg-white rounded-2xl px-6 pt-6 pb-24 max-w-2xl mx-auto shadow-lg">
              {/* Basic Info */}
              <div className="flex items-start gap-6 mb-6">
                <div className="w-1/2">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {profile.first_name}, {profile.age}
                  </h1>
                  <div className="flex flex-col gap-1 mt-2">
                    {profile.school && (
                      <p className="text-gray-600 text-sm flex items-center gap-1">
                        <span>🎓</span>
                        {profile.school}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm flex items-center gap-1">
                      <MapPin size={14} className="text-gray-600" />
                      Boston, MA
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {profile.bio && (
                <div className="mb-8">
                  <h3 className="text-gray-900 font-bold text-lg mb-3">About me</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Rankings Section */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {/* Dater Status */}
                <div className="bg-gray-100 rounded-full py-2 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Crown className="w-4 h-4 text-[#cc0000] stroke-[3]" />
                    <div className="text-gray-900 text-sm font-medium">
                      {profile.dater_status ? profile.dater_status.charAt(0).toUpperCase() + profile.dater_status.slice(1) : 'Bronze'}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="bg-gray-100 rounded-full py-2 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Star className="w-4 h-4 text-[#cc0000] stroke-[3]" />
                    <div className="text-gray-900 text-sm font-medium">
                      {profile.average_rating ? profile.average_rating.toFixed(1) : '0.0'}
                    </div>
                  </div>
                </div>

                {/* Follow-Through */}
                <div className="bg-gray-100 rounded-full py-2 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#cc0000] stroke-[3]" />
                    <div className="text-gray-900 text-sm font-medium">
                      {profile.follow_through_rate ? `${profile.follow_through_rate}%` : '0%'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Descriptors */}
              {profile.descriptors && profile.descriptors.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {profile.descriptors.map(descriptor => (
                      <span
                        key={descriptor.label}
                        className="inline-block px-3 py-1 bg-[#cc0000] text-white rounded-full text-sm"
                      >
                        {descriptor.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile Details */}
              <div className="mb-8 space-y-4">
                {/* Dater Type */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-[#cc0000] mb-1">Dater Type</h2>
                  <p className="text-gray-700">{archetypeMap[profile.dater_archetype]}</p>
                </div>

                {/* Gender */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-[#cc0000] mb-1">Gender</h2>
                  <p className="text-gray-700 capitalize">{profile.gender}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="max-w-lg mx-auto">
                {error && (
                  <div className="text-[#cc0000] text-sm mb-3">
                    {error}
                  </div>
                )}
                <button
                  onClick={() => router.push(`/send-date-request/${id}`)}
                  className="w-full py-3 px-6 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors mb-3"
                >
                  Send Date Request
                </button>
                <button
                  onClick={handleBackButton}
                  className="w-full py-3 px-6 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
                >
                  {profile?.relationship_status === 'in_relationship' ? 'Back to Dates' : 'Back to Matching'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}