'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '../../../supabase/client';
import BottomNav from '@/components/BottomNav';
import { Crown, Star, Heart } from 'lucide-react';
import Header from '@/components/Header';
import ProfileImageGallery from '@/components/ProfileImageGallery';

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
    // If no filePath or it's the default avatar, return default image
    if (!filePath || filePath.includes('default-avatar')) {
      return '/images/default-avatar.png';
    }

    // If it's already a full URL, return it
    if (filePath.startsWith('http')) {
      return filePath;
    }

    // Clean up the path - remove any leading/trailing slashes and avatars/ prefix
    const cleanPath = filePath
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/\/+$/, '') // Remove trailing slashes
      .replace(/^avatars\/?/g, ''); // Remove any avatars/ prefix and optional slash
    
    // Get the public URL - Supabase will handle the bucket prefix
    const { data } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(cleanPath);

    if (!data?.publicUrl) {
      console.error('Could not generate public URL for:', cleanPath);
      return '/images/default-avatar.png';
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return '/images/default-avatar.png';
  }
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
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get current user's session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;

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
          images = await Promise.all(imageData.map(async (img) => {
            const publicUrl = await getSignedUrl(img.image_url);
            return {
              ...img,
              image_url: publicUrl
            };
          }));
        } else if (profileData.avatar_url) {
          // If no profile images but has avatar_url, just use it directly without creating a new entry
          const publicUrl = await getSignedUrl(profileData.avatar_url);
          if (publicUrl && publicUrl !== '/images/default-avatar.png') {
            images = [{
              id: 0,
              image_url: publicUrl,
              is_main: true
            }];
          }
        }

        // If still no images, use default avatar
        if (images.length === 0) {
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
        
        {/* Profile Image */}
        <div className="w-full max-w-lg mx-auto mb-6">
          <ProfileImageGallery
            images={profile.profile_images || []}
            mode="view"
            className="rounded-lg shadow-md"
          />
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
              <Crown className="w-5 h-5 text-[#BA2525]" />
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

          {/* Bio Section - only show if there's content */}
          {profile.bio && profile.bio.trim() !== '' && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div>
          {context !== 'second-date' && currentUserId !== id && (
            <button
              type="button"
              id="send-date-request"
              name="send-date-request"
              onClick={handleSendDateRequest}
              className="w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors mb-3"
            >
              Send Date Request
            </button>
          )}
          {error && (
            <div className="text-[#BA2525] text-sm mb-3">
              {error}
            </div>
          )}
          <button
            type="button"
            id="back-button"
            name="back-button"
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