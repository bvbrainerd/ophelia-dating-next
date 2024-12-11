// app/payment-success/page.tsx
'use client'

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import ResultScreen from '../dashboard/resultsscreen/ResultsPage';
import DatingTypeQuiz from '@/components/DatingTypeQuiz';

export default function QuizPage() {
  const router = useRouter();
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuizComplete = async (datingStyle: string) => {
    try {
      setIsLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get existing profile first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, age, gender')
        .eq('id', user.id)
        .maybeSingle();

      // Prepare profile data using existing data or defaults
      const profileData = {
        id: user.id,
        first_name: existingProfile?.first_name || 'Anonymous',
        last_name: existingProfile?.last_name || 'User',
        age: existingProfile?.age || 18,
        gender: existingProfile?.gender || 'other',
        school: 'Boston College',
        dater_archetype: datingStyle,
        profile_completed: true,
        bio: '',
        preferred_gender: 'other',
        avatar_url: null,
        created_at: new Date().toISOString()
      };

      // Use upsert to either create or update the profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        throw upsertError;
      }

      setResult(datingStyle);
      
    } catch (error: any) {
      console.error('Operation error:', {
        message: error?.message,
        details: error?.details,
        code: error?.code,
        hint: error?.hint
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check profile completion
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile check error:', profileError);
        return;
      }

      if (profile?.profile_completed) {
        router.push('/dashboard');
      } else {
        console.error('Profile not completed:', profile);
      }
    } catch (error) {
      console.error('Navigation error:', error);
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
    result ? 
      <ResultScreen 
        datingStyle={result} 
        onContinue={handleContinue} 
      /> : 
      <DatingTypeQuiz 
        onComplete={handleQuizComplete}
      />
  );
}