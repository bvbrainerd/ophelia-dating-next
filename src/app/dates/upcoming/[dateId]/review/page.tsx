'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';

export default function DateReview() {
  const params = useParams();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const submitReview = async () => {
    try {
      // Send review to backend
      console.log('Submitted review', { rating, review });
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Review Your Date
      </h1>

      <div className="star-rating flex justify-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-3xl ${
              rating >= star ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Tell us about your date..."
        className="w-full p-2 border rounded mb-4"
        rows={4}
      />

      <button 
        className="w-full p-3 bg-[#cc0000] text-white rounded"
        onClick={submitReview}
      >
        Submit Review
      </button>
    </div>
  );
}