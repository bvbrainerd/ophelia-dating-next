'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Profile {
  id: string;
  first_name: string;
  avatar_url: string | null;
  age: number;
  average_rating: number | null;
}

interface DateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  sender: Profile;
}

interface SupabaseDateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  sender: Profile;
}

interface ReviewAnswers {
  personRating: number;
  venueRating: number;
  connection: string;
  standout: string;
  anotherDate: string;
  setting: string;
  recommend: string;
  improvement: string;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [dateRequest, setDateRequest] = useState<DateRequest | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<ReviewAnswers>({
    personRating: 0,
    venueRating: 0,
    connection: '',
    standout: '',
    anotherDate: '',
    setting: '',
    recommend: '',
    improvement: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = {
    connection: {
      text: "How would you describe the connection?",
      options: ["Effortless", "Fun", "Interesting", "Eh okay", "Not a match"]
    },
    standout: {
      text: "What stood out the most about them?",
      options: ["Their humor", "Hot/Beautiful", "The way they listened", "Their confidence", "Our shared interests", "Their energy", "Comfortable"]
    },
    anotherDate: {
      text: "Would you go on another date with them?",
      options: ["Absolutely", "Maybe", "Probably not", "No"]
    },
    setting: {
      text: "Did the setting enhance the date?",
      options: ["Yes, it set the mood", "It was fine but not ideal", "No, it didn't match the vibe"]
    },
    recommend: {
      text: "Would you recommend this venue for a date?",
      options: ["Yes of course", "No", "Depends on the person/couple"]
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch current user's profile
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, first_name, avatar_url, age, average_rating')
          .eq('id', user.id)
          .single();

        if (userData) {
          setCurrentUser(userData);
        }

        // Fetch date request details
        const { data, error } = await supabase
          .from('date_requests')
          .select(`
            id,
            venue,
            proposed_time,
            sender:profiles!date_requests_sender_id_fkey (
              id,
              first_name,
              avatar_url,
              age,
              average_rating
            )
          `)
          .eq('id', params.dateId)
          .single() as { data: SupabaseDateRequest | null; error: any };

        if (error) throw error;
        
        if (!data || !data.sender) {
          throw new Error('Invalid date request data');
        }

        // Transform the data to match the DateRequest interface
        const transformedData: DateRequest = {
          id: data.id,
          venue: data.venue,
          proposed_time: data.proposed_time,
          sender: data.sender
        };
        
        setDateRequest(transformedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load review details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.dateId, router]);

  const handleSubmitReview = async () => {
    if (!dateRequest || !currentUser) return;
    
    try {
      setIsSubmitting(true);

      // Insert review data
      const { error: ratingError } = await supabase
        .from('date_ratings')
        .insert({
          date_request_id: dateRequest.id,
          rater_id: currentUser.id,
          rated_user_id: dateRequest.sender.id,
          person_rating: answers.personRating,
          venue_rating: answers.venueRating,
          connection_rating: answers.connection,
          standout_feature: answers.standout,
          would_date_again: answers.anotherDate,
          venue_rating_detail: answers.setting,
          venue_recommend: answers.recommend,
          improvement_feedback: answers.improvement
        });

      if (ratingError) throw ratingError;

      // Update the user's average rating
      const { data: existingRatings } = await supabase
        .from('date_ratings')
        .select('person_rating')
        .eq('rated_user_id', dateRequest.sender.id);

      if (existingRatings) {
        const ratings = existingRatings.map(r => r.person_rating);
        const newRating = [...ratings, answers.personRating];
        const averageRating = newRating.reduce((a, b) => a + b, 0) / newRating.length;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ average_rating: averageRating })
          .eq('id', dateRequest.sender.id);

        if (updateError) throw updateError;
      }

      // Update date request status
      const { error: statusError } = await supabase
        .from('date_requests')
        .update({ status: 'rated' })
        .eq('id', dateRequest.id);

      if (statusError) throw statusError;

      toast.success('Review submitted successfully!');
      router.push('/dates/upcoming');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add function to get avatar URL
  const getAvatarUrl = async (avatarPath: string | null) => {
    if (!avatarPath) return '/images/default-avatar.png';
    
    try {
      if (avatarPath.startsWith('http') || avatarPath.startsWith('/')) {
        return avatarPath;
      }

      const cleanPath = avatarPath.split('?')[0];
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(cleanPath);

      return data?.publicUrl || '/images/default-avatar.png';
    } catch (error) {
      console.error('Error getting avatar URL:', error);
      return '/images/default-avatar.png';
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
    <div className="min-h-screen bg-[#f8f8f8]">
      <Header variant="default" />
      
      <div className="max-w-[480px] mx-auto pt-5 pb-32">
        {dateRequest && (
          <>
            <Link href={`/profile/${dateRequest.sender.id}`} className="block mx-5">
              <div className="p-6 flex items-center bg-white rounded-[32px] shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-16 h-16 shrink-0">
                  <Image
                    src={dateRequest.sender.avatar_url || '/images/default-avatar.png'}
                    alt={dateRequest.sender.first_name}
                    fill
                    className="rounded-full object-cover border-2 border-white shadow-sm"
                    unoptimized
                  />
                </div>
                <div className="ml-4">
                  <h2 className="text-[22px] font-bold text-[#333] mb-1">
                    {dateRequest.sender.first_name}, {dateRequest.sender.age}
                  </h2>
                  <p className="text-[#777] text-base">{dateRequest.venue}</p>
                </div>
              </div>
            </Link>

            <div className="px-5 mt-8">
              {/* Star Rating for Person */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm mb-6">
                <h4 className="text-[20px] font-semibold text-[#333] mb-4">
                  Rate {dateRequest.sender.first_name}
                </h4>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`person-${star}`}
                      onClick={() => setAnswers(prev => ({ ...prev, personRating: star }))}
                      className={`text-4xl transition-transform hover:scale-110 ${
                        star <= answers.personRating ? 'text-[#cc0000]' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating for Venue */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm mb-8">
                <h4 className="text-[20px] font-semibold text-[#333] mb-4">
                  Rate your date location: {dateRequest.venue}
                </h4>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`venue-${star}`}
                      onClick={() => setAnswers(prev => ({ ...prev, venueRating: star }))}
                      className={`text-4xl transition-transform hover:scale-110 ${
                        star <= answers.venueRating ? 'text-[#cc0000]' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions */}
              {Object.entries(questions).map(([key, question]) => (
                <div key={key} className="mb-8">
                  <h4 className="text-[18px] font-semibold text-[#333] mb-4">
                    {question.text}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setAnswers(prev => ({ ...prev, [key]: option }))}
                        className={`px-4 py-3.5 rounded-[32px] text-[13px] transition-all ${
                          answers[key as keyof ReviewAnswers] === option
                            ? 'bg-[#cc0000] text-white font-medium shadow-sm'
                            : 'bg-white border-2 border-[#cc0000] text-[#cc0000] hover:bg-[#fff8f8]'
                        } ${option.includes('/') ? 'leading-tight' : ''}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Feedback Section */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm mb-20">
                <h4 className="text-[20px] font-semibold text-[#333] mb-4">
                  What would have made the experience better?
                </h4>
                <textarea
                  value={answers.improvement}
                  onChange={(e) => setAnswers(prev => ({ ...prev, improvement: e.target.value }))}
                  placeholder="Better service? Different atmosphere? Share your thoughts..."
                  className="w-full min-h-[120px] border border-[#e5e5e5] rounded-[24px] p-4 text-[15px] resize-none outline-none transition-colors focus:border-[#cc0000] placeholder:text-[#999]"
                />
              </div>
            </div>

            {/* Submit Button Container */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#eee] z-50 pb-[72px]">
              <div className="max-w-[480px] mx-auto px-5 py-4">
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !answers.personRating || !answers.venueRating || !answers.connection || !answers.anotherDate}
                  className="w-full py-4 bg-[#cc0000] text-white rounded-[32px] text-lg font-semibold transition-all hover:bg-[#bb0000] disabled:opacity-50 disabled:hover:bg-[#cc0000] shadow-sm"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
} 