// app/payment-success/page.tsx
'use client'

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/client';
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
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      // Update only the dater_archetype
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ dater_archetype: datingStyle })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
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

      router.push('/dashboard');
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