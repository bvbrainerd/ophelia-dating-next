// app/payment-success/page.tsx
'use client'

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';

export default function PaymentSuccessHandler() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const dateId = localStorage.getItem('pendingDateId');
        const returnTime = localStorage.getItem('paymentReturnTime');
        
        if (!dateId || !returnTime) {
          throw new Error('Missing payment information');
        }

        // Clear the stored data immediately to prevent double-processing
        localStorage.removeItem('pendingDateId');
        localStorage.removeItem('paymentReturnTime');

        // Update the date request status and payment info
        const { error: updateError } = await supabase
          .from('date_requests')
          .update({
            status: 'accepted',
            payment_completed: true,
            payment_completed_at: returnTime
          })
          .eq('id', dateId);

        if (updateError) throw updateError;

        setIsProcessing(false);
        
        // Redirect after success
        setTimeout(() => {
          router.push('/dates/upcoming');
        }, 2000);

      } catch (err) {
        console.error('Error processing payment success:', err);
        setError(err instanceof Error ? err.message : 'Failed to confirm payment');
        setIsProcessing(false);
        
        // Redirect after error
        setTimeout(() => {
          router.push('/daterequests');
        }, 3000);
      }
    };

    handlePaymentSuccess();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        {isProcessing ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000] mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your payment...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold mb-1">Error</p>
              <p>{error}</p>
            </div>
            <p className="text-gray-600 mt-4">Redirecting to date requests...</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-[#cc0000] font-bold text-3xl mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">Your date has been confirmed.</p>
            <p className="text-gray-500">Redirecting to date requests...</p>
          </div>
        )}
      </div>
    </div>
  );
}