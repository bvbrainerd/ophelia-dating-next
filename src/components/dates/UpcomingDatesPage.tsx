'use client'

import React, { useState } from 'react'
import DateStartedPage from './DateStartedPage'

interface UpcomingDate {
  id: number
  name: string
  age: number
  image: string
  venue: string
  date: string
  time: string
  status: 'confirmed'
  price: number
  description: string
}

interface UpcomingDatesPageProps {
  onBack: () => void
}

const UpcomingDatesPage: React.FC<UpcomingDatesPageProps> = ({ onBack }) => {
  const [selectedDate, setSelectedDate] = useState<UpcomingDate | null>(null)
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([
    {
      id: 1,
      name: 'Adelaide',
      age: 19,
      image: '/images/adelaide_profile.jpg',
      venue: 'Fenway Park',
      date: '02',
      time: '20:00',
      status: 'confirmed',
      price: 50,
      description: 'Hopeless Romantic'
    },
    {
      id: 2,
      name: 'Emelia',
      age: 21,
      image: '/images/emelia_profile.jpg',
      venue: 'Kured',
      date: '01',
      time: '13:00',
      status: 'confirmed',
      price: 30,
      description: 'Cautious Dater'
    }
  ])

  const handleStartDate = (date: UpcomingDate) => {
    setSelectedDate(date)
  }

  const handleRescheduleOrCancel = (dateId: number) => {
    const action = window.confirm('Would you like to reschedule or cancel this date?\nOK = Reschedule\nCancel = Cancel Date')
    
    if (action) {
      alert('Reschedule feature coming soon!')
    } else {
      if (window.confirm('Are you sure you want to cancel this date?')) {
        setUpcomingDates(dates => dates.filter(date => date.id !== dateId))
      }
    }
  }

  if (selectedDate) {
    return (
      <DateStartedPage 
        date={selectedDate}
        onBack={() => setSelectedDate(null)}
      />
    )
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-center text-[#cc0000] font-bold text-4xl mb-8">
        Your Upcoming Dates
      </h2>

      {upcomingDates.length === 0 ? (
        <p className="text-center mb-5 text-gray-600">
          No upcoming dates scheduled yet.
        </p>
      ) : (
        upcomingDates.map(date => (
          <div 
            key={date.id} 
            className="border border-gray-200 rounded-lg p-5 mb-5 shadow-sm"
          >
            <div className="flex items-center mb-4">
              <img 
                src={date.image}
                alt={date.name} 
                className="w-24 h-24 object-cover rounded-full mr-4"
              />
              <div>
                <h3 className="text-[#cc0000] text-2xl font-medium mb-1">
                  {date.name}, {date.age}
                </h3>
                <p className="text-gray-600 mb-1">{date.description}</p>
                <p className="mb-1 text-lg">
                  <span className="font-semibold">When:</span> {date.date}, {date.time}
                </p>
                <p className="text-lg">
                  <span className="font-semibold">Where:</span> {date.venue}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleStartDate(date)}
                className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
              >
                Start Date
              </button>
              <button
                onClick={() => handleRescheduleOrCancel(date.id)}
                className="w-full p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
              >
                Reschedule or Cancel Date
              </button>
            </div>
          </div>
        ))
      )}

      <button 
        className="w-full p-3 mt-5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full cursor-pointer font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={onBack}
      >
        Back to Dashboard
      </button>
    </div>
  )
}

export default UpcomingDatesPage