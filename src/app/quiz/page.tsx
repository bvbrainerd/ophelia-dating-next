// app/payment-success/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { ChevronRight, Globe, Layers, Zap, Compass } from 'lucide-react';
import { prompt } from '@/app/fonts';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

const DatingQuizApp = () => {
  const router = useRouter();
  const [quizType, setQuizType] = useState<'single' | 'couple' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUserProfile(profile);
        if (profile?.relationship_status) {
          setQuizType(profile.relationship_status === 'in_relationship' ? 'couple' : 'single');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const singleQuestions = [
    {
      id: 'ideal-date',
      title: "What's Your Ideal Date?",
      subtitle: 'Choose your perfect date scenario',
      icon: <Compass className="w-8 h-8 text-[#cc0000]" />,
      options: [
        { text: 'Dinner or Bar', value: 'dinner-bar' },
        { text: 'Sports Game', value: 'sports' },
        { text: 'Concert/Activity', value: 'concert-activity' },
        { text: 'A fun group activity with friends', value: 'group-activity' }
      ]
    },
    {
      id: 'communication',
      title: 'How do you prefer to communicate?',
      subtitle: 'Select your communication style',
      icon: <Zap className="w-8 h-8 text-[#cc0000]" />,
      options: [
        { text: 'Texting throughout the day', value: 'texting' },
        { text: 'Regular phone calls', value: 'calls' },
        { text: 'Face-to-face conversations', value: 'in-person' },
        { text: 'Mix of everything', value: 'mixed' }
      ]
    },
    {
      id: 'date-preference',
      title: 'When do you prefer to date?',
      subtitle: 'Select your preferred date times',
      icon: <Globe className="w-8 h-8 text-[#cc0000]" />,
      multiple: true,
      options: [
        { text: 'Weekend Evenings', value: 'weekend-evening' },
        { text: 'Weekend Afternoons', value: 'weekend-afternoon' },
        { text: 'Weekday Evenings', value: 'weekday-evening' },
        { text: 'Weekday Afternoons', value: 'weekday-afternoon' }
      ]
    },
    {
      id: 'relationship-goals',
      title: 'What are you looking for?',
      subtitle: 'Choose your relationship goals',
      icon: <Layers className="w-8 h-8 text-[#cc0000]" />,
      options: [
        { text: 'Long-term relationship', value: 'long-term' },
        { text: 'Casual dating', value: 'casual' },
        { text: 'Making new friends', value: 'friends' },
        { text: 'Open to anything', value: 'open' }
      ]
    }
  ];

  const coupleQuestions = [
    {
      id: 'date-night',
      title: 'Date Night Frequency',
      subtitle: 'How often do you want dedicated date nights?',
      icon: <Compass className="w-8 h-8 text-[#cc0000]" />,
      options: [
        { text: 'Weekly', value: 'weekly' },
        { text: 'Bi-weekly', value: 'biweekly' },
        { text: 'Monthly', value: 'monthly' },
        { text: 'Spontaneous', value: 'spontaneous' }
      ]
    },
    {
      id: 'activities',
      title: 'Preferred Activities',
      subtitle: 'What kind of dates do you enjoy together?',
      icon: <Layers className="w-8 h-8 text-[#cc0000]" />,
      multiple: true,
      options: [
        { text: 'Active & Outdoors', value: 'active' },
        { text: 'Food & Drinks', value: 'food' },
        { text: 'Entertainment', value: 'entertainment' },
        { text: 'Wellness & Self-Care', value: 'wellness' },
        { text: 'Relaxing at Home', value: 'home' },
        { text: 'Group Activities', value: 'group' }
      ]
    },
    {
      id: 'social-style',
      title: 'Social Preferences',
      subtitle: 'How do you like to socialize as a couple?',
      icon: <Globe className="w-8 h-8 text-[#cc0000]" />,
      options: [
        { text: 'Double Dates', value: 'double-dates' },
        { text: 'Group Settings', value: 'group' },
        { text: 'Just Us Two', value: 'private' },
        { text: 'Mix of Everything', value: 'mixed' }
      ]
    }
  ];

  const handleAnswerSelect = async (value: string) => {
    const currentQuestions = quizType === 'single' ? singleQuestions : coupleQuestions;
    const currentQuestionData = currentQuestions[currentQuestion];

    setSelectedAnswers(prev => {
      if (currentQuestionData.multiple) {
        const currentAnswers = prev[currentQuestionData.id] || [];
        return {
          ...prev,
          [currentQuestionData.id]: currentAnswers.includes(value)
            ? currentAnswers.filter((ans: string) => ans !== value)
            : [...currentAnswers, value]
        };
      }
      return { ...prev, [currentQuestionData.id]: value };
    });

    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const quizResults = {
          user_id: user.id,
          quiz_type: quizType,
          answers: selectedAnswers,
          completed_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('quiz_results')
          .insert([quizResults]);

        if (error) throw error;

        // For singles, calculate and update dater archetype
        if (quizType === 'single') {
          // Calculate archetype based on answers
          const archetype = calculateDaterArchetype(selectedAnswers);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              dater_archetype: archetype,
              quiz_completed: true 
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating profile with archetype:', updateError);
            throw updateError;
          }
        } else {
          // For couples, update couple preferences and quiz completion status
          const couplePreferences = {
            date_frequency: selectedAnswers['date-night'],
            preferred_activities: selectedAnswers['activities'] || [],
            social_style: selectedAnswers['social-style']
          };

          // First update couple preferences
          const { error: preferencesError } = await supabase
            .from('profiles')
            .update({ couple_preferences: couplePreferences })
            .eq('id', user.id);

          if (preferencesError) {
            console.error('Error updating couple preferences:', preferencesError);
            throw preferencesError;
          }

          // Then update quiz completion status
          const { error: completionError } = await supabase
            .from('profiles')
            .update({ couple_quiz_completed: true })
            .eq('id', user.id);

          if (completionError) {
            console.error('Error updating quiz completion status:', completionError);
            throw completionError;
          }
        }

        // Redirect based on quiz type
        if (quizType === 'single') {
          router.push('/highlight-reel');
        } else {
          router.push('/dashboard');
        }
      } catch (error: any) {
        console.error('Error saving quiz results:', error);
        setError(error?.message || 'Failed to save quiz results. Please try again.');
        return;
      }
    }
  };

  const calculateDaterArchetype = (answers: Record<string, any>) => {
    // Logic to determine archetype based on answers
    const idealDate = answers['ideal-date'];
    const communication = answers['communication'];
    const datePreference = answers['date-preference'];
    const relationshipGoals = answers['relationship-goals'];

    // Simple scoring system
    if (relationshipGoals === 'long-term' && communication === 'in-person') {
      return 'commitmentSeeker';
    } else if (relationshipGoals === 'casual' && idealDate === 'group-activity') {
      return 'serialDater';
    } else if (relationshipGoals === 'open' && communication === 'mixed') {
      return 'hopelessRomantic';
    } else if (relationshipGoals === 'friends' && idealDate === 'concert-activity') {
      return 'friendWithBenefits';
    } else {
      return 'cautiousDater';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#cc0000] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  const currentQuestions = quizType === 'single' ? singleQuestions : coupleQuestions;
  const currentQuestionData = currentQuestions[currentQuestion];
  const isMultipleChoice = currentQuestionData?.multiple;
  const selectedAnswersForCurrentQuestion = selectedAnswers[currentQuestionData?.id] || [];

  return (
    <div className="min-h-screen bg-[#cc0000] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold mb-4 ${prompt.className}`}>
              {quizType === 'single' ? 'Dating Style Quiz' : 'Couple Preferences Quiz'}
            </h1>
            <p className="text-white/80">
              {quizType === 'single' 
                ? "Let's understand your dating style"
                : "Let's understand your preferences as a couple"}
            </p>
            {error && (
              <p className="mt-4 text-red-300 bg-red-900/50 p-3 rounded-lg">
                {error}
              </p>
            )}
          </div>

          {currentQuestionData && (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                {currentQuestionData.icon}
                <div>
                  <h2 className={`text-2xl font-bold ${prompt.className}`}>{currentQuestionData.title}</h2>
                  <p className="text-white/80">{currentQuestionData.subtitle}</p>
                </div>
              </div>

              <div className="space-y-3">
                {currentQuestionData.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswerSelect(option.value)}
                    className={`w-full p-4 rounded-xl border-2 border-white/20 hover:bg-white/20 transition-colors text-left flex items-center justify-between ${
                      isMultipleChoice
                        ? selectedAnswersForCurrentQuestion.includes(option.value)
                          ? 'bg-white/20'
                          : ''
                        : selectedAnswers[currentQuestionData.id] === option.value
                        ? 'bg-white/20'
                        : ''
                    }`}
                  >
                    <span className={prompt.className}>{option.text}</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ))}
              </div>

              <div className="mt-6 text-center text-white/60">
                Question {currentQuestion + 1} of {currentQuestions.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatingQuizApp;