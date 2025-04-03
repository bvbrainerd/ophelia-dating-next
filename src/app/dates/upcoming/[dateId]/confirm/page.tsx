'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

export default function ConfirmDate() {
  const params = useParams();
  const router = useRouter();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const confirmDate = async () => {
    try {
      // Send confirmation to backend
      setIsConfirmed(true);
      // Optionally redirect
      router.push(`/upcoming-dates/${params?.id}`);
    } catch (error) {
      console.error('Error confirming date:', error);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto p-5 pb-24">
        <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
          Confirm Date
        </h1>

        {!isConfirmed ? (
          <button 
            className="w-full p-3 bg-[#cc0000] text-white rounded"
            onClick={confirmDate}
          >
            Confirm Date
          </button>
        ) : (
          <p className="text-center text-green-600">
            Date Confirmed!
          </p>
        )}
      </div>
      <BottomNav />
    </>
  );
}