// app/payment-success/page.tsx
'use client'

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccessHandler() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePaymentReturn = async () => {
      const dateId = localStorage.getItem('pendingDateId');
      const returnTime = localStorage.getItem('paymentReturnTime');
      
      if (dateId && returnTime) {
        // Clear the stored data
        localStorage.removeItem('pendingDateId');
        localStorage.removeItem('paymentReturnTime');

        try {
          const response = await fetch(`/api/date-requests/${dateId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'accepted',
              paymentCompleted: true,
              paymentTime: returnTime
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update date status');
          }

          // Redirect back to date requests page after short delay
          setTimeout(() => {
            router.push('/date-requests');
          }, 2000);

        } catch (err) {
          console.error('Error updating date status:', err);
          setError('Failed to confirm payment. Please contact support.');
        }
      } else {
        router.push('/date-requests');
      }
    };

    handlePaymentReturn();
  }, [router]);

  return (
    <div className="max-w-md mx-auto p-5 text-center">
      <h2 className="text-[#cc0000] font-bold text-3xl mb-4">
        Payment Successful!
      </h2>
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <>
          <p className="mb-4">Your date has been confirmed.</p>
          <p>Redirecting you back to your date requests...</p>
        </>
      )}
    </div>
  );
}