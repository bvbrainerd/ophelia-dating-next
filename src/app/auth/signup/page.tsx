'use client'

import { useState } from 'react'

interface ProfileSetupProps {
  onComplete: () => void
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Set Up Your Profile
      </h2>
      
      <input 
        className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none"
        type="text"
        placeholder="Full Name"
      />
      
      <input 
        className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none"
        type="number"
        placeholder="Age"
      />
      
      <select className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none">
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      
      <select className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none">
        <option value="">Select School</option>
        <option value="Boston College">Boston College</option>
        <option value="Harvard">Harvard</option>
        <option value="MIT">MIT</option>
        <option value="Northeastern">Northeastern</option>
        <option value="BU">BU</option>
        <option value="N/A">N/A</option>
      </select>
      
      <button 
        className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onComplete}
      >
        Continue
      </button>
    </div>
  )
}