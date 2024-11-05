'use client'

import React, { useState } from 'react'

interface MatchingPageProps {
  onBack: () => void
}

interface Match {
  name: string
  age: number
  description: string
}

const MatchingPage = ({ onBack }: MatchingPageProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [dateLocation, setDateLocation] = useState('')
  const [dateTime, setDateTime] = useState('')

  const matches: Match[] = [
    { 
      name: 'Claudia', 
      age: 21,
      description: 'Cautious Dater, Ideal Date: Restaurant, Humor: Witty' 
    },
    { 
      name: 'Virginia', 
      age: 20,
      description: 'Hopeless Romantic, Ideal Date: Concert, Favorite Genre: Alternative' 
    },
  ]

  const venues = [
    "Red Sox @Fenway Park",
    "Kured",
    "Museum of Fine Arts",
    "Lolita Back Bay",
    "Celtics Game @TD Garden",
    "Custom"
  ]

  const handleDateRequest = () => {
    if (selectedMatch && dateLocation && dateTime) {
      console.log(`Date request sent to ${selectedMatch.name} for ${dateLocation} at ${dateTime}`)
      setSelectedMatch(null)
      setDateLocation('')
      setDateTime('')
    } else {
      alert('Please select a match, location, and time before sending a date request.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-red-600 text-center mb-6">
        Your Matches
      </h2>
      
      {matches.map((match, index) => (
        <div key={index} className="mb-6 bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl text-gray-500">{match.name[0]}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-red-600">
                {match.name}, {match.age}
              </h3>
              <p className="text-gray-600 mb-3">{match.description}</p>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                onClick={() => setSelectedMatch(match)}
              >
                Date
              </button>
            </div>
          </div>
        </div>
      ))}

      {selectedMatch && (
        <div className="mt-6 bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-red-600 mb-4">
            Set up your date with {selectedMatch.name}
          </h3>
          
          <div className="space-y-4">
            <select
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              value={dateLocation}
              onChange={(e) => setDateLocation(e.target.value)}
            >
              <option value="">Select a venue</option>
              {venues.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </select>

            {dateLocation === 'Custom' && (
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
                placeholder="Enter custom venue"
                onChange={(e) => setDateLocation(e.target.value)}
              />
            )}

            <input
              type="datetime-local"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />

            <button 
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              onClick={handleDateRequest}
            >
              Send Date Request
            </button>
          </div>
        </div>
      )}

      <button 
        className="w-full mt-6 px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
        onClick={onBack}
      >
        Back to Dashboard
      </button>
    </div>
  )
}

export default MatchingPage