// profile set up
// need to grab the name, gender, email
// once it is validated and completed, you are re-directed to your dating quiz

// ProfileSetup Component
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  const handleComplete = () => {
    // Handle form completion
    router.push('/onboarding/dating_quiz')
  };

  return (
    <div>
      <h2>Set Up Your Profile</h2>
      <input type='text' placeholder='Full Name' />
      <input type='number' placeholder='Age' />
      <select>
        <option value=''>Select Gender</option>
        <option value='male'>Male</option>
        <option value='female'>Female</option>
        <option value='other'>Other</option>
      </select>
      <select>
        <option value=''>Select School</option>
        <option value='Boston College'>Boston College</option>
        <option value='Harvard'>Harvard</option>
        <option value='MIT'>MIT</option>
        <option value='Northeastern'>Northeastern</option>
        <option value='BU'>BU</option>
        <option value='N/A'>N/A</option>
      </select>
      <button onClick={handleComplete}>Continue</button>
    </div>
  );
}
