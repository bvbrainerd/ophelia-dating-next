'use client'

import React, { useState, type ButtonHTMLAttributes } from 'react'
import Image from 'next/image'
import type { DetailedHTMLProps, ChangeEvent } from 'react'

interface MatchingPageProps {
  onBack: () => void
}

interface Match {
  name: string
  age: number
  image: string
  description: string
}

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
type SelectProps = DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>
type InputProps = DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

export default function MatchingPage({ onBack }: MatchingPageProps): React.JSX.Element {
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
    "Boston Bruins Game",
    "Boston Celtics Game",
    "BC Hockey Game",
    "BC Basketball Game",
    "Barcelona Wine Bar", 
    "Kured",
    "Capo",
    "Locco Fenway",
    "Blue Ribbon",
    "Lolita Back Bay",
    "F1 Arcade",
    "Joe's on Newbury",
    "Lucca North End",
    "Museum of Fine Arts",
    "Snowport @Seaport",
    "Boston Commons @BeaconHill",
    "Private Helicopter Ride"
  ]

  // Fixed sports events object with proper key-value pairs
  const sportsEvents: { [key: string]: string } = {
    "Boston Bruins Game": "2024-04-13T19:00",
    "Boston Celtics Game": "2024-04-09T19:30",
    "BC Hockey Game": "2024-04-12T19:00",
    "BC Basketball Game": "2024-04-08T20:00"
  }

  const handleDateRequest = (): void => {
    if (selectedMatch && dateLocation) {
      // For sports events, use the predefined time
      const finalDateTime = sportsEvents[dateLocation] || dateTime
      
      if (!finalDateTime && !dateTime) {
        alert('Please select a time for your date.')
        return
      }

      console.log(`Date request sent to ${selectedMatch.name} for ${dateLocation} at ${finalDateTime || dateTime}`)
      
      setRemainingMatches(prevMatches => prevMatches.filter(match => match !== selectedMatch))
      
      setSelectedMatch(null)
      setDateLocation('')
      setDateTime('')
    } else {
      alert('Please select a match and location before sending a date request.')
    }
  }

  const handleLocationChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const selectedVenue = e.target.value
    setDateLocation(selectedVenue)
    
    // Clear the dateTime if it's not a sports event
    if (!sportsEvents[selectedVenue]) {
      setDateTime('')
    }
  }

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDateTime(e.target.value)
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
                alt={`${match.name}'s profile picture`}
                fill
                className="object-cover rounded-full"
                priority
                sizes="(max-width: 96px) 96px, 96px"
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
            type="button"
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
            onChange={handleLocationChange}
          >
            <option value="">Select a venue</option>
            {venues.map(venue => (
              <option key={venue} value={venue}>{venue}</option>
            ))}
          </select>
          
          {/* Only show datetime input for non-sports venues */}
          {dateLocation && !sportsEvents[dateLocation] && (
            <input
              className="w-full p-2.5 mb-4 border border-gray-200 rounded-full outline-none"
              type="datetime-local"
              value={dateTime}
              onChange={handleTimeChange}
            />
          )}

          <button 
            className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
            onClick={handleDateRequest}
            type="button"
          >
            Send Date Request
          </button>
        </div>
      )}

      <button 
        className="w-full p-2.5 mt-5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={onBack}
        type="button"
      >
        Back to Dashboard
      </button>
    </div>
  )
}