'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Camera, Star, MapPin } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  status: string;
  venue: string;
  has_posted: boolean;
  proof_media_url: string | null;
  venue_review: string | null;
  date_review: string | null;
  venue_rating: number | null;
  date_rating: number | null;
  user: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
}

export default function ChallengePage() {
  const router = useRouter();
  const params = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPostReminder, setShowPostReminder] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [review, setReview] = useState({
    venue_review: '',
    date_review: '',
    venue_rating: 0,
    date_rating: 0
  });

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const { data, error } = await supabase
          .from('user_challenges')
          .select(`
            id,
            status,
            venue,
            has_posted,
            proof_media_url,
            venue_review,
            date_review,
            venue_rating,
            date_rating,
            profiles!user_challenges_user_id_fkey (
              id,
              first_name,
              avatar_url
            )
          `)
          .eq('id', params.id)
          .single();

        if (error) throw error;

        setChallenge({
          ...data,
          user: data.profiles[0]
        });

        // Start notification check interval if challenge is active
        if (data.status === 'in_progress' && !data.has_posted) {
          const interval = setInterval(checkForNotification, 5 * 60 * 1000); // Check every 5 minutes
          return () => clearInterval(interval);
        }
      } catch (error) {
        console.error('Error fetching challenge:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, [params.id]);

  const checkForNotification = async () => {
    try {
      const response = await fetch('/api/date-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_challenge_id: params.id })
      });

      const data = await response.json();
      
      if (data.type === 'date_reminder' && !challenge?.has_posted) {
        setShowPostReminder(true);
        toast.message('Time to capture a moment!', {
          description: 'Take a photo to remember your date.',
          action: {
            label: 'Take Photo',
            onClick: () => document.getElementById('photo-upload')?.click()
          }
        });
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setShowPostReminder(false);
  };

  const handleSubmitPost = async () => {
    if (!selectedImage || !challenge) return;

    try {
      setIsLoading(true);

      // Upload image
      const { data: imageData, error: imageError } = await supabase.storage
        .from('date-photos')
        .upload(`${challenge.id}/${Date.now()}.jpg`, selectedImage);

      if (imageError) throw imageError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('date-photos')
        .getPublicUrl(imageData.path);

      // Update challenge
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({
          has_posted: true,
          proof_media_url: publicUrl,
          venue_review: review.venue_review,
          date_review: review.date_review,
          venue_rating: review.venue_rating,
          date_rating: review.date_rating
        })
        .eq('id', challenge.id);

      if (updateError) throw updateError;

      // Add location data
      const { error: locationError } = await supabase
        .from('date_locations')
        .insert({
          user_challenge_id: challenge.id,
          user_id: challenge.user.id,
          venue_name: challenge.venue,
          latitude: 42.3601, // Replace with actual coordinates
          longitude: -71.0589
        });

      if (locationError) throw locationError;

      toast.success('Successfully posted your date memory!');
      router.refresh();
    } catch (error) {
      console.error('Error submitting post:', error);
      toast.error('Failed to post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="default" />
        
        {challenge && (
          <Card className="mt-8 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <ProfileImage user={challenge.user} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-medium">{challenge.user.first_name}</h3>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4" />
                  {challenge.venue}
                </div>
              </div>
            </div>

            {!challenge.has_posted && challenge.status === 'in_progress' && (
              <div className="mb-6">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center gap-2 hover:border-[#BA2525] transition-colors"
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-600">Capture a moment from your date</span>
                </button>
              </div>
            )}

            {selectedImage && (
              <div className="space-y-4 mb-6">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected"
                  className="w-full h-64 object-cover rounded-lg"
                />
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setReview(prev => ({ ...prev, venue_rating: rating }))}
                          className={`p-2 ${review.venue_rating >= rating ? 'text-[#BA2525]' : 'text-gray-300'}`}
                        >
                          <Star className="w-6 h-6" fill={review.venue_rating >= rating ? '#BA2525' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Review
                    </label>
                    <textarea
                      value={review.venue_review}
                      onChange={(e) => setReview(prev => ({ ...prev, venue_review: e.target.value }))}
                      className="w-full p-2 border rounded-lg"
                      rows={3}
                      placeholder="How was the venue?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setReview(prev => ({ ...prev, date_rating: rating }))}
                          className={`p-2 ${review.date_rating >= rating ? 'text-[#BA2525]' : 'text-gray-300'}`}
                        >
                          <Star className="w-6 h-6" fill={review.date_rating >= rating ? '#BA2525' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Review
                    </label>
                    <textarea
                      value={review.date_review}
                      onChange={(e) => setReview(prev => ({ ...prev, date_review: e.target.value }))}
                      className="w-full p-2 border rounded-lg"
                      rows={3}
                      placeholder="How was your date?"
                    />
                  </div>

                  <button
                    onClick={handleSubmitPost}
                    disabled={isLoading}
                    className="w-full py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#990000] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Posting...' : 'Post Memory'}
                  </button>
                </div>
              </div>
            )}

            {challenge.has_posted && challenge.proof_media_url && (
              <div className="space-y-4">
                <img
                  src={challenge.proof_media_url}
                  alt="Date memory"
                  className="w-full h-64 object-cover rounded-lg"
                />
                
                {challenge.venue_review && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-[#BA2525]" />
                      <span className="text-sm">Venue Rating: {challenge.venue_rating}/5</span>
                    </div>
                    <p className="text-gray-600">{challenge.venue_review}</p>
                  </div>
                )}

                {challenge.date_review && (
                  <div className="mt-4">
                    <p className="text-gray-600">{challenge.date_review}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
      <BottomNav />
    </div>
  );
} 