'use client'

import { useState } from 'react'

interface EditProfilePageProps {
  onSave: () => void
  onBack: () => void
  onPreviousDates: () => void // New prop for navigating to previous dates
}

export default function EditProfilePage({ onSave, onBack, onPreviousDates }: EditProfilePageProps) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [daterArchetype, setDaterArchetype] = useState('')
  const [school, setSchool] = useState('')

  const schools = [
    "Boston College",
    "Harvard",
    "MIT",
    "Northeastern",
    "BU",
    "N/A"
  ]

  const archetypes = [
    { value: "hopelessRomantic", label: "Hopeless Romantic" },
    { value: "cautiousDater", label: "Cautious Dater" },
    { value: "adventurous", label: "Commitment Seeker" },
    { value: "traditional", label: "Serial Dater" },
    { value: "independent", label: "Friends with Benefits" }
  ]

  const handleSave = () => {
    console.log('Saving profile:', { name, age, daterArchetype, school })
    onSave()
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Edit Your Profile
      </h2>

      <input
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        type="number"
        placeholder="Your Age"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      />

      <select
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        value={daterArchetype}
        onChange={(e) => setDaterArchetype(e.target.value)}
      >
        <option value="">Select Dater Archetype</option>
        {archetypes.map((archetype) => (
          <option key={archetype.value} value={archetype.value}>
            {archetype.label}
          </option>
        ))}
      </select>

      <select
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        value={school}
        onChange={(e) => setSchool(e.target.value)}
      >
        <option value="">Select School</option>
        {schools.map((schoolOption) => (
          <option key={schoolOption} value={schoolOption}>
            {schoolOption}
          </option>
        ))}
      </select>

      <div className="mb-6">
        <label className="block mb-2 font-medium">Profile Picture</label>
        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none"
          type="file"
          accept="image/*"
        />
      </div>

      {/* Previous Dates Button */}
      <button 
        className="w-full p-2.5 mb-4 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onPreviousDates} // New button to navigate to Previous Dates
      >
        Previous Dates
      </button>

      {/* Save Profile Button */}
      <button 
        className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={handleSave}
      >
        Save Profile
      </button>

      <button 
        className="w-full p-2.5 mt-3 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={onBack}
      >
        Back to Dashboard
      </button>
    </div>
  )
}
