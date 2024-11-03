'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabase/client';
import { useState } from 'react';

export default function Page() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '', 
    email: '',
    age: '',
    gender: '',
    school: '',
    password: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleComplete = async () => {
    // Just create the profile
    const { error } = await supabase.from('profiles').insert([
      {
        first_name: userInfo.firstName,
        last_name: userInfo.lastName, 
        email: userInfo.email,
        age: userInfo.age,
        gender: userInfo.gender,
        school: userInfo.school,
      },
    ]);

    if (error) {
      console.error('Error creating profile:', error);
      return;
    }

    router.push('/onboarding/dating_quiz');
  };

  // creating a profile and a user once we handle complete

  return (
    <div>
      <h2>Set Up Your Profile</h2>
      {/* Added missing name attributes and fixed typo in 'email' */}
      <input
        type='text'
        placeholder='First Name'
        name='firstName'
        value={userInfo.firstName}
        onChange={handleChange}
      />
      <input
        type='text'
        placeholder='Last Name'
        name='lastName'
        value={userInfo.lastName}
        onChange={handleChange}
      />
      <input
        type='email'
        placeholder='School Email'
        name='email'
        value={userInfo.email}
        onChange={handleChange}
      />
      <input
        type='password'
        placeholder='Password'
        name='password'
        value={userInfo.password}
        onChange={handleChange}
      />
      <input
        type='number'
        placeholder='Age'
        name='age'
        value={userInfo.age}
        onChange={handleChange}
      />
      <select name='gender' value={userInfo.gender} onChange={handleChange}>
        <option value=''>Select Gender</option>
        <option value='male'>Male</option>
        <option value='female'>Female</option>
        <option value='other'>Other</option>
      </select>
      <select name='school' value={userInfo.school} onChange={handleChange}>
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
