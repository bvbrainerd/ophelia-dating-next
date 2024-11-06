//dashboard

'use client'

import { useState } from 'react'

interface DashboardProps {
  onMatch: () => void
  onMessage: () => void
  onEditProfile: () => void
  onUpcomingDates: () => void
  onLogout: () => void
}

export default function Dashboard({ 
  onMatch, 
  onMessage, 
  onEditProfile, 
  onUpcomingDates, 
  onLogout 
}: DashboardProps) {
  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-4xl mb-8">
        Ophelia
      </h1>
      
      <h2 className="text-[#cc0000] text-center text-lg font-medium mb-6 mt-2.5">
        It All Starts with the First Date...
      </h2>
      
      <button 
        className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onMatch}
      >
        Start Dating
      </button>
      
      <button 
        className="w-full p-2.5 mt-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onMessage}
      >
        Date Requests
      </button>
      
      <button 
        className="w-full p-2.5 mt-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onUpcomingDates}
      >
        Upcoming Dates
      </button>
      
      <button 
        className="w-full p-2.5 mt-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onEditProfile}
      >
        Edit Profile
      </button>
      
      <button 
        className="w-full p-2.5 mt-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  )
}