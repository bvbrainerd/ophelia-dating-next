'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';

export default function DateStatus() {
  const params = useParams();
  const [currentStatus, setCurrentStatus] = useState('');

  const updateStatus = async (status: string) => {
    try {
      // Send status update to backend
      setCurrentStatus(status);
      console.log(`Updated status to: ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Date Status
      </h1>

      <div className="status-buttons space-y-4">
        <button 
          className="w-full p-3 bg-[#cc0000] text-white rounded"
          onClick={() => updateStatus("I'm on my way")}
        >
          I'm on my way
        </button>
        <button 
          className="w-full p-3 bg-[#cc0000] text-white rounded"
          onClick={() => updateStatus("I'm here")}
        >
          I'm here
        </button>
        <button 
          className="w-full p-3 bg-[#cc0000] text-white rounded"
          onClick={() => updateStatus("We're both here")}
        >
          We're both here
        </button>
      </div>

      {currentStatus && (
        <div className="mt-4 text-center">
          <p>Current Status: {currentStatus}</p>
        </div>
      )}
    </div>
  );
}