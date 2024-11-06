'use client'

import React, { useState } from 'react'

const DateStartedPage = () => {
  const [messages, setMessages] = useState<Array<{text: string, sent: boolean}>>([])
  const [status, setStatus] = useState<'not_started' | 'on_way' | 'arrived' | 'meeting'>('not_started')

  // console.log('Current status:', status) // Debug log

  // const sendOnWayNotification = () => {
  //   setMessages(prev => [...prev, { text: "I'm on my way!", sent: true }])
  //   setStatus('on_way')
  // }

  // const sendArrivedNotification = () => {
  //   setMessages(prev => [...prev, { text: "I've arrived at " + date.venue + "!", sent: true }])
  //   setStatus('arrived')
  // }

  // const sendMeetingConfirmation = () => {
  //   setMessages(prev => [...prev, { text: "We're here and our date has started! 🎉", sent: true }])
  //   setStatus('meeting')
  // }

  return (
    <div></div>
    // <div className="max-w-md mx-auto p-5">
    //   {/* Header */}
    //   <div className="flex items-center border-b pb-4 mb-4">
    //     <img 
    //       src={date.image}
    //       alt={date.name} 
    //       className="w-16 h-16 object-cover rounded-full mr-4"
    //     />
    //     <div>
    //       <h3 className="text-[#cc0000] text-xl font-medium">
    //         {date.name}, {date.age}
    //       </h3>
    //       <p className="text-gray-600">{date.venue}</p>
    //     </div>
    //   </div>

    //   {/* Messages */}
    //   <div className="bg-gray-50 rounded-lg p-4 mb-6 min-h-[400px] flex flex-col">
    //     {messages.map((message, index) => (
    //       <div
    //         key={index}
    //         className={`mb-2 p-3 rounded-lg max-w-[80%] ${
    //           message.sent
    //             ? 'bg-[#cc0000] text-white self-end rounded-br-none'
    //             : 'bg-white border border-gray-200 self-start rounded-bl-none'
    //         }`}
    //       >
    //         {message.text}
    //       </div>
    //     ))}
    //   </div>

    //   {/* Buttons */}
    //   <div className="space-y-3">
    //     {status === 'not_started' && (
    //       <button
    //         onClick={sendOnWayNotification}
    //         className="w-full p-3 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
    //       >
    //         Send "On My Way" Notification
    //       </button>
    //     )}
        
    //     {status === 'on_way' && (
    //       <button
    //         onClick={sendArrivedNotification}
    //         className="w-full p-3 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
    //       >
    //         Send "I've Arrived" Notification
    //       </button>
    //     )}

    //     {status === 'arrived' && (
    //       <button
    //         onClick={sendMeetingConfirmation}
    //         className="w-full p-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
    //       >
    //         We're Here!
    //       </button>
    //     )}

    //     <button 
    //       className="w-full p-3 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
    //     >
    //       Back to Upcoming Dates
    //     </button>
    //   </div>

    //   {/* Debug info */}
    //   <div className="mt-4 text-gray-400 text-sm">
    //     Current status: {status}
    //   </div>
  )
}

export default DateStartedPage