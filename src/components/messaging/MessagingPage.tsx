'use client'

import React, { useState } from 'react'

type DateStatus = 'pending' | 'accepted' | 'declined'

interface DateType {
  id: number
  name: string
  age: number
  image: string
  venue: string
  date: string
  time: string
  status: DateStatus
  price: number
  description: string
}

interface MessagingPageProps {
  onBack: () => void
  onDateAccepted: (date: DateType) => void
}

const MessagingPage: React.FC<MessagingPageProps> = ({ onBack, onDateAccepted }) => {
  const [dateRequests, setDateRequests] = useState<DateType[]>([
    {
      id: 1,
      name: 'Adelaide',
      age: 19,
      image: '/images/adelaide_profile.jpg',
      description: 'Hopeless Romantic',
      venue: 'Fenway Park',
      date: '2024-11-02',
      time: '8:00 PM',
      status: 'pending',
      price: 50
    },
    {
      id: 2,
      name: 'Emelia',
      age: 21,
      image: '/images/emelia_profile.jpg',
      description: 'Cautious Dater',
      venue: 'Kured',
      date: '2024-11-01',
      time: '1:00 PM',
      status: 'pending',
      price: 30
    }
  ])

  const handleDateResponse = (id: number, newStatus: DateStatus) => {
    const updatedRequests = dateRequests.map(request =>
      request.id === id ? { ...request, status: newStatus } : request
    )
    setDateRequests(updatedRequests)

    if (newStatus === 'accepted') {
      const acceptedDate = dateRequests.find(request => request.id === id)
      if (acceptedDate) {
        onDateAccepted(acceptedDate)
      }
    }
  }

  const getStatusColor = (status: DateStatus) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600'
      case 'declined':
        return 'text-[#cc0000]'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: DateStatus) => {
    switch (status) {
      case 'accepted':
        return 'Accepted'
      case 'declined':
        return 'Declined'
      default:
        return 'Pending'
    }
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Your Date Requests
      </h2>
      
      {dateRequests.map(request => (
        <div key={request.id} className="border border-gray-200 rounded-lg p-5 mb-5 shadow-sm">
          <div className="flex items-center mb-4">
            <img 
              src={request.image}
              alt={request.name} 
              className="w-24 h-24 object-cover rounded-full mr-4"
            />
            <div>
              <h3 className="text-[#cc0000] text-xl font-medium mb-1">
                {request.name}, {request.age}
              </h3>
              <p className="text-gray-600 mb-1">{request.description}</p>
              <p className="mb-1">
                {request.venue} on {request.date} @ {request.time}
              </p>
              <p className="font-medium">Price: ${request.price}</p>
            </div>
          </div>
          
          {request.status === 'pending' ? (
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
                onClick={() => handleDateResponse(request.id, 'accepted')}
              >
                Accept
              </button>
              <button 
                className="p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
                onClick={() => handleDateResponse(request.id, 'declined')}
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className={`text-center font-medium ${getStatusColor(request.status)}`}>
                {getStatusText(request.status)}
              </p>
            </div>
          )}
        </div>
      ))}

      <button 
        className="w-full p-3 mt-4 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={onBack}
      >
        Back to Dashboard
      </button>
    </div>
  )
}

export default MessagingPage