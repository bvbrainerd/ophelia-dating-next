'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ProfileImage from '@/components/ProfileImage';

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

interface ChallengeQuestions {
  availability: string[];
  preferredTime: string;
  activityPreference: string;
  budget: string;
  spontaneityLevel: string;
  challengeLevel: 'beginner' | 'adventurous' | 'daredevil';
  allowWatchers: boolean;
  allowStreaming: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'adventurous' | 'daredevil';
  points: number;
}

export default function MatchChallengePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'intro' | 'questions' | 'challenges' | 'match' | 'confirmation'>('intro');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [answers, setAnswers] = useState<ChallengeQuestions>({
    availability: [],
    preferredTime: '',
    activityPreference: '',
    budget: '',
    spontaneityLevel: '',
    challengeLevel: 'beginner',
    allowWatchers: true,
    allowStreaming: false
  });
  const [suggestedDate, setSuggestedDate] = useState<{
    venue: string;
    time: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/auth/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setCurrentUser(profile);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchProfile();
  }, [router]);

  const findCompatibleMatch = async () => {
    if (!currentUser) return;

    try {
      const { data: matches, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', currentUser.preferred_gender)
        .eq('preferred_gender', currentUser.gender)
        .eq('school', currentUser.school)
        .neq('id', currentUser.id)
        .limit(1);

      if (error) throw error;
      if (matches && matches.length > 0) {
        setMatchedProfile(matches[0]);
        // Generate suggested date based on answers
        const suggestedDateTime = generateSuggestedDateTime(answers.availability, answers.preferredTime);
        const suggestedVenue = generateSuggestedVenue(answers.activityPreference, answers.budget);
        
        setSuggestedDate({
          venue: suggestedVenue,
          time: suggestedDateTime.time,
          date: suggestedDateTime.date,
        });
      }
    } catch (error) {
      console.error('Error finding match:', error);
    }
  };

  const generateSuggestedDateTime = (availability: string[], preferredTime: string) => {
    // Logic to generate a date and time based on availability and preferences
    const date = new Date();
    date.setDate(date.getDate() + 3); // Example: Set date to 3 days from now
    
    return {
      date: date.toISOString().split('T')[0],
      time: preferredTime,
    };
  };

  const generateSuggestedVenue = (activityPreference: string, budget: string) => {
    type VenueOptions = {
      dining: Record<string, string[]>;
      sports: Record<string, string[]>;
      cultural: Record<string, string[]>;
      outdoor: Record<string, string[]>;
    };

    // Define venue options based on activity type and budget
    const venueOptions: VenueOptions = {
      dining: {
        '$': ['Kured'],
        '$$': ['Joes on Newbury', 'Branchline'],
        '$$$': ['Barcelona Wine Bar', 'Capo', 'Lolita Back Bay', 'Lucca North End'],
        '$$$$': ['Blue Ribbon Sushi']
      },
      sports: {
        '$$': ['BC Hockey', 'BC Basketball'],
        '$$$': ['Boston Bruins', 'Celtics']
      },
      cultural: {
        '$$': ['Museum of Fine Arts', 'The Clay Room'],
        '$$$': ['Boston Duck Tour']
      },
      outdoor: {
        '$': ['Boston Commons'],
        '$$$$': ['Private Helicopter Ride']
      }
    };

    // Map activity preference to venue category
    const category = activityPreference === 'dining' ? 'dining'
      : activityPreference === 'sports' ? 'sports'
      : activityPreference === 'cultural' ? 'cultural'
      : 'outdoor';

    // Get venues matching the budget
    const venues = venueOptions[category as keyof VenueOptions]?.[budget] || [];
    
    // If no exact matches, try to find closest match
    if (venues.length === 0) {
      const allVenues = Object.values(venueOptions[category as keyof VenueOptions] || {}).flat();
      return allVenues[Math.floor(Math.random() * allVenues.length)] || "Barcelona Wine Bar";
    }

    // Return a random venue from the matching options
    return venues[Math.floor(Math.random() * venues.length)];
  };

  const fetchChallenges = async () => {
    try {
      const { data: challenges, error } = await supabase
        .from('date_challenges')
        .select('*')
        .eq('level', answers.challengeLevel);

      if (error) throw error;
      setAvailableChallenges(challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const handleQuestionSubmit = async () => {
    await fetchChallenges();
    setCurrentStep('challenges');
  };

  const handleChallengeSelect = async (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    await findCompatibleMatch();
    setCurrentStep('match');
  };

  const handleAcceptChallenge = async () => {
    if (!matchedProfile || !selectedChallenge) return;
    
    try {
      // Create user challenge
      const { data: userChallenge, error: challengeError } = await supabase
        .from('user_challenges')
        .insert({
          user_id: currentUser?.id,
          challenge_id: selectedChallenge.id,
          status: 'committed',
          points_earned: 0
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Create date request with challenge
      const { data: dateRequest, error: dateError } = await supabase
        .from('date_requests')
        .insert({
          sender_id: currentUser?.id,
          receiver_id: matchedProfile.id,
          venue: suggestedDate?.venue,
          proposed_time: suggestedDate?.time,
          is_challenge: true,
          challenge_id: selectedChallenge.id,
          challenge_status: 'committed'
        })
        .select()
        .single();

      if (dateError) throw dateError;

      // Update user challenge with date request
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({ date_request_id: dateRequest.id })
        .eq('id', userChallenge.id);

      if (updateError) throw updateError;

      // Redirect to payment
      router.push(`/match-challenge/payment?matchId=${matchedProfile.id}&venue=${suggestedDate?.venue}&date=${suggestedDate?.date}&time=${suggestedDate?.time}&challengeId=${selectedChallenge.id}`);
    } catch (error) {
      console.error('Error creating challenge:', error);
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
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-5 pb-24">
        <Header variant="matching" />

        {currentStep === 'intro' && (
          <div className="text-center space-y-6 mt-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-[#BA2525]">Dare to Date</h1>
              <p className="text-lg text-[#BA2525] opacity-80">The Ultimate Date Challenge</p>
            </div>
            <div className="bg-[#ffeeee] p-4 rounded-lg mb-6">
              <p className="text-[#BA2525] font-medium">
                ⚠️ Warning: This is a binding challenge!
              </p>
              <p className="text-gray-700 text-sm mt-2">
                By starting this challenge, you agree to go on the date we arrange for you.
                There's no backing out once you start - are you brave enough?
              </p>
            </div>
            <p className="text-gray-600">
              Ready to level up your dating game? Choose your challenge level, complete daring dates,
              earn points, and climb the leaderboard. Let your friends watch and vote on your progress.
              Are you ready to become a dating legend?
            </p>
            <button
              onClick={() => setCurrentStep('questions')}
              className="w-full p-3 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors"
            >
              Take the Leap
            </button>
          </div>
        )}

        {currentStep === 'questions' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#BA2525] mb-4">Take the Leap: Your Answers, Your Match, Your Date</h2>
              <p className="text-sm text-gray-600 mb-8">
                ⚠️ Remember: Once you submit these answers, you're committed to the date we arrange!
              </p>
            </div>
            
            {/* Availability */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700">
                When are you available this week?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <button
                    key={day}
                    onClick={() => setAnswers(prev => ({
                      ...prev,
                      availability: prev.availability.includes(day)
                        ? prev.availability.filter(d => d !== day)
                        : [...prev.availability, day]
                    }))}
                    className={`p-2 rounded-full border-2 ${
                      answers.availability.includes(day)
                        ? 'border-[#BA2525] bg-[#BA2525] text-white'
                        : 'border-gray-300 text-gray-700 hover:border-[#BA2525]'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Time */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700">
                Preferred time of day?
              </label>
              <select
                value={answers.preferredTime}
                onChange={(e) => setAnswers(prev => ({ ...prev, preferredTime: e.target.value }))}
                className="w-full p-3 border rounded-full"
              >
                <option value="">Select time</option>
                <option value="morning">Morning (9AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 5PM)</option>
                <option value="evening">Evening (5PM - 9PM)</option>
              </select>
            </div>

            {/* Activity Preference */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700">
                What is your "Ideal Date"?
              </label>
              <select
                value={answers.activityPreference}
                onChange={(e) => setAnswers(prev => ({ ...prev, activityPreference: e.target.value }))}
                className="w-full p-3 border rounded-full"
              >
                <option value="">Select activity</option>
                <option value="dining">Going Out to Eat</option>
                <option value="sports">Sports Event</option>
                <option value="cultural">Experiences</option>
                <option value="outdoor">Outdoor Activity</option>
              </select>
            </div>

            {/* Budget */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700">
                What's your budget comfort level?
              </label>
              <select
                value={answers.budget}
                onChange={(e) => setAnswers(prev => ({ ...prev, budget: e.target.value }))}
                className="w-full p-3 border rounded-full"
              >
                <option value="">Select budget</option>
                <option value="$">$ (Under $50)</option>
                <option value="$$">$$ ($50-$100)</option>
                <option value="$$$">$$$ ($100-$200)</option>
                <option value="$$$$">$$$$ ($200+)</option>
              </select>
            </div>

            {/* Spontaneity Level */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700">
                How spontaneous are you feeling?
              </label>
              <select
                value={answers.spontaneityLevel}
                onChange={(e) => setAnswers(prev => ({ ...prev, spontaneityLevel: e.target.value }))}
                className="w-full p-3 border rounded-full"
              >
                <option value="">Select level</option>
                <option value="very">Very - I'm up for anything!</option>
                <option value="somewhat">Somewhat - Within reason</option>
                <option value="little">Little - I prefer planning</option>
              </select>
            </div>

            {/* Challenge Level */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700">
                Choose your challenge level
              </label>
              <div className="grid grid-cols-1 gap-3">
                {['beginner', 'adventurous', 'daredevil'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setAnswers(prev => ({ ...prev, challengeLevel: level as any }))}
                    className={`p-4 rounded-lg border-2 text-left ${
                      answers.challengeLevel === level
                        ? 'border-[#BA2525] bg-[#ffeeee]'
                        : 'border-gray-200 hover:border-[#BA2525]'
                    }`}
                  >
                    <div className="font-medium text-[#BA2525] capitalize">{level}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {level === 'beginner' 
                        ? 'Perfect for first-time challengers. Fun and easy dares.'
                        : level === 'adventurous'
                        ? 'For those seeking excitement. More challenging dares.'
                        : 'For the fearless. Extreme and unforgettable dares.'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Social Features */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700">
                Social Features
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={answers.allowWatchers}
                    onChange={(e) => setAnswers(prev => ({ ...prev, allowWatchers: e.target.checked }))}
                    className="rounded border-gray-300 text-[#BA2525] focus:ring-[#BA2525]"
                  />
                  <span className="text-gray-700">Allow friends to watch and vote on my challenge</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={answers.allowStreaming}
                    onChange={(e) => setAnswers(prev => ({ ...prev, allowStreaming: e.target.checked }))}
                    className="rounded border-gray-300 text-[#BA2525] focus:ring-[#BA2525]"
                  />
                  <span className="text-gray-700">Allow live date streaming and reactions</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleQuestionSubmit}
              disabled={!answers.availability.length || !answers.preferredTime || !answers.activityPreference || !answers.budget || !answers.spontaneityLevel}
              className="w-full p-3 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Available Challenges
            </button>
          </div>
        )}

        {currentStep === 'challenges' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#BA2525] mb-6">Choose Your Challenge</h2>
            
            <div className="space-y-4">
              {availableChallenges.map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => handleChallengeSelect(challenge)}
                  className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-[#BA2525] text-left transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[#BA2525]">{challenge.title}</h3>
                    <span className="bg-[#ffeeee] text-[#BA2525] px-2 py-1 rounded-full text-sm">
                      {challenge.points} pts
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{challenge.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'match' && matchedProfile && suggestedDate && selectedChallenge && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#BA2525] mb-6">Your Challenge Match!</h2>
            
            <div className="relative aspect-square w-full mb-4 rounded-lg overflow-hidden">
              <ProfileImage 
                user={matchedProfile}
                className="w-full h-full"
              />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-[#BA2525]">
                {matchedProfile.first_name}, {matchedProfile.age}
              </h3>
              <p className="text-gray-600 mt-2">{matchedProfile.bio}</p>
            </div>

            <div className="bg-[#ffeeee] p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-[#BA2525]">Your Challenge</h4>
              <p className="text-gray-700">{selectedChallenge.title}</p>
              <p className="text-gray-600 text-sm">{selectedChallenge.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[#BA2525] font-medium capitalize">{selectedChallenge.level}</span>
                <span className="bg-white text-[#BA2525] px-3 py-1 rounded-full text-sm">
                  {selectedChallenge.points} points
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-[#BA2525]">Date Details</h4>
              <p className="text-gray-700">Venue: {suggestedDate.venue}</p>
              <p className="text-gray-700">Date: {suggestedDate.date}</p>
              <p className="text-gray-700">Time: {suggestedDate.time}</p>
            </div>

            {answers.allowWatchers && (
              <div className="bg-white border-2 border-[#BA2525] p-4 rounded-lg">
                <p className="text-[#BA2525] text-sm">
                  👥 Your friends will be able to watch your progress and vote on this challenge!
                </p>
              </div>
            )}

            {answers.allowStreaming && (
              <div className="bg-white border-2 border-[#BA2525] p-4 rounded-lg">
                <p className="text-[#BA2525] text-sm">
                  📱 Live date streaming enabled - share your experience in real-time!
                </p>
              </div>
            )}

            <div className="bg-[#ffeeee] p-4 rounded-lg">
              <p className="text-[#BA2525] text-sm font-medium">
                Ready to commit to this challenge? Complete the payment to lock in your date and start earning points!
              </p>
            </div>

            <button
              onClick={handleAcceptChallenge}
              className="w-full p-3 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors"
            >
              Accept Challenge & Proceed to Payment
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
} 