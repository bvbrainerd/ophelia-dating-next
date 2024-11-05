'use client'

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditProfilePageProps {
  onSave: () => void
  onBack: () => void
}

const EditProfilePage = ({ onSave, onBack }: EditProfilePageProps) => {
  const [name, setName] = React.useState('')
  const [age, setAge] = React.useState('')
  const [profilePicture, setProfilePicture] = React.useState<File | null>(null)
  const [daterArchetype, setDaterArchetype] = React.useState('')
  const [school, setSchool] = React.useState('')

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
    console.log('Saving profile:', { name, age, profilePicture, daterArchetype, school })
    onSave()
  }

  return (
    <div className="p-4">
      <div className="w-full max-w-xl mx-auto bg-white rounded-lg border shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-center text-2xl font-bold text-red-600">
            Edit Your Profile
          </h3>
        </div>
        <div className="p-6 pt-0 space-y-4">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            
            <Input
              type="number"
              placeholder="Your Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            
            <div className="relative">
              <select
                value={daterArchetype}
                onChange={(e) => setDaterArchetype(e.target.value)}
                className="w-full h-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              >
                <option value="">Select Dater Archetype</option>
                {archetypes.map((archetype) => (
                  <option key={archetype.value} value={archetype.value}>
                    {archetype.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full h-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              >
                <option value="">Select School</option>
                {schools.map((schoolOption) => (
                  <option key={schoolOption} value={schoolOption}>
                    {schoolOption}
                  </option>
                ))}
              </select>
            </div>
            
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  setProfilePicture(files[0])
                }
              }}
            />
          </div>
          
          <div className="space-y-2 pt-4">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleSave}
            >
              Save Profile
            </Button>
            
            <Button 
              className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50"
              onClick={onBack}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditProfilePage