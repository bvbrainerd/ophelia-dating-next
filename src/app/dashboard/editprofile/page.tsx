'use client'

import React, { type ChangeEvent } from 'react'

interface EditProfilePageProps {
  onSave: () => void
  onBack: () => void
  onPreviousDates: () => void
}

export default function EditProfilePage({ onSave, onBack, onPreviousDates }: EditProfilePageProps) {
  const [name, setName] = React.useState('')
  const [age, setAge] = React.useState('')
  const [daterArchetype, setDaterArchetype] = React.useState('')
  const [school, setSchool] = React.useState('')

  const schools = [
    "Boston College",
    "Harvard",
    "MIT",
    "Northeastern",
    "BU",
    "N/A"
  ] as const

  const archetypes = [
    { value: "hopelessRomantic", label: "Hopeless Romantic" },
    { value: "cautiousDater", label: "Cautious Dater" },
    { value: "adventurous", label: "Commitment Seeker" },
    { value: "traditional", label: "Serial Dater" },
    { value: "independent", label: "Friends with Benefits" }
  ] as const

  const handleSave = (): void => {
    console.log('Saving profile:', { name, age, daterArchetype, school })
    onSave()
  }

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value)
  }

  const handleAgeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setAge(e.target.value)
  }

  const handleArchetypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setDaterArchetype(e.target.value)
  }

  const handleSchoolChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setSchool(e.target.value)
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
        onChange={handleNameChange}
      />

      <input
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        type="number"
        placeholder="Your Age"
        value={age}
        onChange={handleAgeChange}
      />

      <select
        className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
        value={daterArchetype}
        onChange={handleArchetypeChange}
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
        onChange={handleSchoolChange}
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

      <button 
        className="w-full p-2.5 mb-4 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onPreviousDates}
      >
        Previous Dates
      </button>

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