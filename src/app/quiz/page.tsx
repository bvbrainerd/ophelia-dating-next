// app/payment-success/page.tsx
'use client'

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResultScreen from '../dashboard/resultsscreen/ResultsPage';
import DatingTypeQuiz from '@/components/DatingTypeQuiz';

export default function PaymentSuccessHandler() {
  const router = useRouter();
  const [result, setResult] = useState("");

  return (
    result ? <ResultScreen datingStyle={result} onContinue={() => router.push("dashboard")} /> : 
    <DatingTypeQuiz onComplete={(result) => setResult(result)}/>
  );
}