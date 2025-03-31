'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Camera, Upload, Star } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ChallengeData {
  id: string;
  status: string;
  proof_media_url: string | null;
  date_requests: Array<{
    venue: string;
  }>;
  profiles: Array<{
    id: string;
    first_name: string;
    avatar_url: string | null;
  }>;
  date_dares: Array<{
    dare_text: string;
  }>;
}

interface Challenge {
  id: string;
  status: string;
  venue: string;
  has_posted: boolean;
  proof_media_url: string | null;
  dare: string | null;
  user: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
}

export default function ChallengePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        if (!params?.id) throw new Error('Challenge ID is required');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Get challenge details
        const { data: challengeData, error: challengeError } = await supabase
          .from('user_challenges')
          .select(`
            id,
            status,
            proof_media_url,
            date_requests (
              venue
            ),
            profiles (
              id,
              first_name,
              avatar_url
            ),
            date_dares (
              dare_text
            )
          `)
          .eq('id', params.id)
          .single();

        if (challengeError) throw challengeError;

        const typedData = challengeData as ChallengeData;

        setChallenge({
          id: typedData.id,
          status: typedData.status,
          venue: typedData.date_requests[0]?.venue || '',
          has_posted: !!typedData.proof_media_url,
          proof_media_url: typedData.proof_media_url,
          dare: typedData.date_dares[0]?.dare_text || null,
          user: {
            id: typedData.profiles[0].id,
            first_name: typedData.profiles[0].first_name,
            avatar_url: typedData.profiles[0].avatar_url
          }
        });
      } catch (error) {
        console.error('Error fetching challenge:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, [params.id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedImage(file);
  };

  const handleSubmitPost = async () => {
    try {
      setIsSubmitting(true);
      if (!selectedImage || !challenge) return;

      // Upload image to Supabase Storage
      const fileName = `${Date.now()}-${selectedImage.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, selectedImage);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First, get or create the venue
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id')
        .eq('name', challenge.venue)
        .single();

      let venueId;
      if (venueError || !venueData) {
        // Create new venue if it doesn't exist
        const { data: newVenue, error: createVenueError } = await supabase
          .from('venues')
          .insert({
            name: challenge.venue,
            description: 'Venue from challenge',
            location: '{}',
            price_range: 2,
            cuisine_type: 'Other'
          })
          .select('id')
          .single();

        if (createVenueError) throw createVenueError;
        venueId = newVenue.id;
      } else {
        venueId = venueData.id;
      }

      // Create a new date entry
      const { data: dateData, error: dateError } = await supabase
        .from('dates')
        .insert({
          user_id: user.id,
          venue_id: venueId,
          status: 'accepted',
          scheduled_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (dateError) throw dateError;

      // Create post in date_requests table with the new schema
      const { error: postError } = await supabase
        .from('date_requests')
        .insert({
          sender_id: user.id,
          venue_id: venueId,
          status: 'accepted',
          proof_media_url: publicUrl,
          watcher_votes: 0,
          scheduled_time: new Date().toISOString(),
          split_payment: true,
          challenge_id: params.id,
          date_id: dateData.id
        });

      if (postError) {
        throw postError;
      }

      // Update user_challenges status to completed
      const { error: challengeError } = await supabase
        .from('user_challenges')
        .update({ status: 'completed', proof_media_url: publicUrl })
        .eq('id', params.id);

      if (challengeError) {
        throw challengeError;
      }

      toast.success('Challenge completed successfully!');
      router.push('/challenges');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to post challenge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="default" />
      
      <main className="max-w-2xl mx-auto p-5 pb-24">
        {challenge && (
          <div className="space-y-6">
            {/* Challenge Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-[#cc0000] mb-4">
                Date Challenge
              </h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-16 h-16">
                  <Image
                    src={challenge.user.avatar_url || '/images/default-avatar.png'}
                    alt={challenge.user.first_name}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {challenge.user.first_name}
                  </h2>
                  <p className="text-gray-600">{challenge.venue}</p>
                </div>
              </div>

              {/* Date Dare */}
              {challenge.dare && (
                <div className="bg-red-50 rounded-lg p-4 mb-6 border-2 border-[#cc0000]">
                  <h3 className="font-semibold text-[#cc0000] mb-2">Today's Date Dare</h3>
                  <p className="text-gray-800">{challenge.dare}</p>
                </div>
              )}

              {/* Upload Section */}
              {!challenge.has_posted && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {previewUrl ? (
                      <div className="relative aspect-[3/4] w-full max-w-md mx-auto mb-4">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="py-8">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Upload a photo of your completed dare</p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#cc0000] text-[#cc0000] rounded-full cursor-pointer hover:bg-red-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {previewUrl ? 'Change Photo' : 'Select Photo'}
                    </label>
                  </div>

                  <button
                    onClick={handleSubmitPost}
                    disabled={!selectedImage || isSubmitting}
                    className="w-full py-3 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Challenge'}
                  </button>
                </div>
              )}

              {/* Completed Challenge */}
              {challenge.has_posted && challenge.proof_media_url && (
                <div>
                  <div className="relative aspect-[3/4] w-full max-w-md mx-auto mb-4">
                    <Image
                      src={challenge.proof_media_url}
                      alt="Challenge proof"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-center text-green-600 font-medium">
                    Challenge completed! 🎉
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
} 