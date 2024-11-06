'use client'

import { useState } from 'react'
import Image from 'next/image'

interface MatchingPageProps {
  onBack: () => void
}

interface Match {
  name: string
  age: number
  image: string
  description: string
}

export default function MatchingPage({ onBack }: MatchingPageProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [dateLocation, setDateLocation] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [remainingMatches, setRemainingMatches] = useState<Match[]>([
    { 
      name: 'Claudia', 
      age: 21, 
      image: '/images/claudia_profile.jpg', 
      description: 'Cautious Dater, Ideal Date: Restaurant, Humor: Witty' 
    },
    { 
      name: 'Virginia', 
      age: 20, 
      image: '/images/Virginia_profile.jpg', 
      description: 'Hopeless Romantic, Ideal Date: Concert, Favorite Genre: Alternative' 
    },
  ])

  const venues = [
    "Red Sox @Fenway Park",
    "Kured",
    "Museum of Fine Arts",
    "Lolita Back Bay",
    "Celtics Game @TD Garden",
    "Custom"
  ]

  // Define available dates and times for specific venues
  const venueTimeSlots: { [key: string]: string[] } = {
    "Celtics Game @TD Garden": ["2024-11-10T19:30", "2024-11-15T20:00"], // Format: YYYY-MM-DDTHH:MM
    "Red Sox @Fenway Park": ["2024-04-05T13:30", "2024-04-06T18:00"],
  };

  const handleDateRequest = () => {
    if (selectedMatch && dateLocation && dateTime) {
      console.log(`Date request sent to ${selectedMatch.name} for ${dateLocation} at ${dateTime}`)
      
      setRemainingMatches(prevMatches => prevMatches.filter(match => match !== selectedMatch))
      
      setSelectedMatch(null)
      setDateLocation('')
      setDateTime('')
    } else {
      alert('Please select a match, location, and time before sending a date request.')
    }
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Your Matches
      </h2>
      
      {remainingMatches.map((match, index) => (
        <div 
          key={index} 
          className="border border-gray-200 rounded-lg p-5 mb-5 shadow-sm"
        >
          <div className="flex items-center mb-4">
            <div className="relative w-24 h-24 mr-4">
              <Image 
                src={match.image}
                alt={match.name}
                fill
                className="object-cover rounded-full"
                priority
              />
            </div>
            <div>
              <h3 className="text-[#cc0000] text-xl font-medium mb-1">
                {match.name}, {match.age}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {match.description}
              </p>
            </div>
          </div>
          <button 
            className="px-6 py-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
            onClick={() => setSelectedMatch(match)}
          >
            Date
          </button>
        </div>
      ))}

      {selectedMatch && (
        <div className="border border-gray-200 rounded-lg p-5 mt-5 shadow-sm">
          <h3 className="text-[#cc0000] text-xl font-medium mb-4">
            Set up your date with {selectedMatch.name}
          </h3>
          <select
            className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
            value={dateLocation}
            onChange={(e) => setDateLocation(e.target.value)}
          >
            <option value="">Select a venue</option>
            {venues.map(venue => (
              <option key={venue} value={venue}>{venue}</option>
            ))}
          </select>
          
          {/* Conditional rendering of time slots based on the venue */}
          {dateLocation in venueTimeSlots ? (
            <select
              className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            >
              <option value="">Select a time</option>
              {venueTimeSlots[dateLocation].map((slot) => (
                <option key={slot} value={slot}>
                  {new Date(slot).toLocaleString()} {/* Formats date & time nicely */}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          )}

          <button 
            className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
            onClick={handleDateRequest}
          >
            Send Date Request
          </button>
        </div>
      )}

      <button 
        className="w-full p-2.5 mt-5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={onBack}
      >
        Back to Dashboard
      </button>
    </div>
  )
}
