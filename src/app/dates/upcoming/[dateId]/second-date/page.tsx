'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';

export default function SecondDateProposal() {
  const params = useParams();
  const [venue, setVenue] = useState('');
  const [proposedTime, setProposedTime] = useState('');

  const proposeSecondDate = async () => {
    try {
      // Send second date proposal to backend
      console.log('Proposed second date', { venue, proposedTime });
    } catch (error) {
      console.error('Error proposing second date:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Propose Second Date
      </h1>

      <div className="space-y-4">
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="Venue"
          className="w-full p-2 border rounded"
        />

        <input
          type="datetime-local"
          value={proposedTime}
          onChange={(e) => setProposedTime(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <button 
          className="w-full p-3 bg-[#cc0000] text-white rounded"
          onClick={proposeSecondDate}
        >
          Propose Second Date
        </button>
      </div>
    </div>
  );
}