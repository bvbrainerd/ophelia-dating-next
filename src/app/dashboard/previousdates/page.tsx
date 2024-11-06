//previousdates

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import EditProfilePage from '../editprofile/page'

export default function ParentComponent() {
  const router = useRouter()

  const navigateToPreviousDates = () => {
    router.push('/previous-dates') // Ensure this path matches your actual Previous Dates route
  }

  return (
    <EditProfilePage
      onSave={() => console.log('Save profile')}
      onBack={() => router.back()}
      // Pass the navigation function here
    />
  )
}


interface UpcomingDate {
  id: number
  name: string
  age: number
  image: string
  venue: string
  date: string
  time: string
  status: 'pending' | 'confirmed'
  price: number
  description: string
}

interface PreviousDate extends UpcomingDate {
  rating: number
}

interface UpcomingDatesPageProps {
  onBack: () => void
}

// export default function UpcomingDatesPage({ onBack }: UpcomingDatesPageProps) {
//   const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([
//     {
//       id: 1,
//       name: 'Adelaide',
//       age: 19,
//       image: '/images/adelaide_profile.jpg',
//       venue: 'Fenway Park',
//       date: '02',
//       time: '20:00',
//       status: 'confirmed',
//       price: 50,
//       description: 'Hopeless Romantic'
//     },
//     {
//       id: 2,
//       name: 'Emelia',
//       age: 21,
//       image: '/images/emelia_profile.jpg',
//       venue: 'Kured',
//       date: '01',
//       time: '13:00',
//       status: 'confirmed',
//       price: 30,
//       description: 'Cautious Dater'
//     }
//   ])

//   const [previousDates, setPreviousDates] = useState<PreviousDate[]>([])

//   const handleStartDate = (dateId: number) => {
//     const date = upcomingDates.find(d => d.id === dateId)
//     if (!date) return

//     // Prompt for a rating after the date is completed
//     const rating = parseInt(prompt(`Rate your date with ${date.name} from 1 to 5:`) || "0", 10)
//     if (isNaN(rating) || rating < 1 || rating > 5) {
//       alert("Please enter a valid rating between 1 and 5.")
//       return
//     }

//     // Move date to previous dates with the rating
//     setPreviousDates(prev => [...prev, { ...date, rating }])
//     setUpcomingDates(upcomingDates.filter(d => d.id !== dateId))
//   }

//   const handleRescheduleOrCancel = (dateId: number) => {
//     const action = window.confirm('Would you like to reschedule or cancel this date?\nOK = Reschedule\nCancel = Cancel Date')
    
//     if (action) {
//       alert('Reschedule feature coming soon!')
//     } else {
//       if (window.confirm('Are you sure you want to cancel this date?')) {
//         setUpcomingDates(upcomingDates.filter(d => d.id !== dateId))
//         alert('Date cancelled')
//       }
//     }
//   }

//   return (
//     <div className="max-w-md mx-auto p-5">
//       <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
//         Your Upcoming Dates
//       </h2>

//       {upcomingDates.length === 0 ? (
//         <p className="text-center mb-5 text-gray-600">
//           No upcoming dates scheduled yet.
//         </p>
//       ) : (
//         upcomingDates.map(date => (
//           <div 
//             key={date.id} 
//             className="border border-gray-200 rounded-lg p-5 mb-5 shadow-sm"
//           >
//             <div className="flex items-center mb-4">
//               <div className="relative w-24 h-24 mr-4">
//                 <Image 
//                   src={date.image}
//                   alt={date.name}
//                   fill
//                   className="object-cover rounded-full"
//                   priority
//                 />
//               </div>
//               <div>
//                 <h3 className="text-[#cc0000] text-xl font-medium mb-1">
//                   {date.name}, {date.age}
//                 </h3>
//                 <p className="text-gray-600 mb-1">{date.description}</p>
//                 <p className="mb-1 font-medium">
//                   When: {date.date}, {date.time}
//                 </p>
//                 <p className="font-medium">
//                   Where: {date.venue}
//                 </p>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <button
//                 onClick={() => handleStartDate(date.id)}
//                 className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
//               >
//                 Start Date
//               </button>
//               <button
//                 onClick={() => handleRescheduleOrCancel(date.id)}
//                 className="w-full p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
//               >
//                 Reschedule or Cancel Date
//               </button>
//             </div>
//           </div>
//         ))
//       )}

//       <h2 className="text-center text-[#cc0000] font-bold text-3xl mt-8 mb-6">
//         Your Previous Dates
//       </h2>

//       {previousDates.length === 0 ? (
//         <p className="text-center mb-5 text-gray-600">
//           No previous dates yet.
//         </p>
//       ) : (
//         previousDates.map(date => (
//           <div 
//             key={date.id} 
//             className="border border-gray-200 rounded-lg p-5 mb-5 shadow-sm"
//           >
//             <div className="flex items-center mb-4">
//               <div className="relative w-24 h-24 mr-4">
//                 <Image 
//                   src={date.image}
//                   alt={date.name}
//                   fill
//                   className="object-cover rounded-full"
//                   priority
//                 />
//               </div>
//               <div>
//                 <h3 className="text-[#cc0000] text-xl font-medium mb-1">
//                   {date.name}, {date.age}
//                 </h3>
//                 <p className="text-gray-600 mb-1">{date.description}</p>
//                 <p className="mb-1 font-medium">
//                   When: {date.date}, {date.time}
//                 </p>
//                 <p className="font-medium">
//                   Where: {date.venue}
//                 </p>
//                 <p className="font-medium">
//                   Rating: {date.rating} / 5
//                 </p>
//               </div>
//             </div>
//           </div>
//         ))
//       )}

//       <button 
//         className="w-full p-2.5 mt-5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
//         onClick={onBack}
//       >
//         Back to Dashboard
//       </button>
//     </div>
//   )
// }
