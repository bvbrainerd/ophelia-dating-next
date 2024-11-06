'use client'
import { useState, useEffect } from 'react'
import LoginSignup from '../components/auth/LoginSignup'
import ProfileSetup from '../components/auth/ProfileSetup'
import DatingTypeQuiz from '../components/DatingTypeQuiz'
import ResultScreen from './dashboard/resultsscreen/ResultsPage'
import Dashboard from './dashboard/Dashboard'
import MatchingPage from './matching/page'
import MessagingPage from './messaging/page'
import PaymentPage from './dates/dates/payment/PaymentPage'
import EditProfilePage from './dashboard/editprofile/page'
import UpcomingDatesPage from './dates/dates/upcoming/page'

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

export default function Home() {
  const [currentPage, setCurrentPage] = useState('login')
  const [selectedDate, setSelectedDate] = useState<DateType | null>(null)
  const [userDatingStyle, setUserDatingStyle] = useState<string | null>(null)

  const navigateTo = (page: string) => setCurrentPage(page)

  const handleQuizComplete = (datingStyle: string) => {
    setUserDatingStyle(datingStyle)
    navigateTo('result')
  }

  const handleDateAccepted = (date: DateType) => {
    setSelectedDate(date)
    navigateTo('payment')
  }

  const handlePaymentConfirmed = () => {
    alert('Payment successful! Your date has been confirmed.')
    setSelectedDate(null)
    navigateTo('dashboard')
  }

  return (
    <main className="min-h-screen">
      {currentPage === 'login' && (
        <LoginSignup 
          onLogin={() => navigateTo('dashboard')} 
          onSignup={() => navigateTo('profile')} 
        />
      )}
      
      {currentPage === 'profile' && (
        <ProfileSetup 
          onComplete={() => navigateTo('quiz')} 
        />
      )}
      
      {currentPage === 'quiz' && (
        <DatingTypeQuiz 
          onComplete={handleQuizComplete} 
        />
      )}
      
      {currentPage === 'result' && userDatingStyle && (
        <ResultScreen 
          datingStyle={userDatingStyle} 
          onContinue={() => navigateTo('dashboard')} 
        />
      )}
      
      {currentPage === 'dashboard' && (
        <Dashboard 
          onMatch={() => navigateTo('matching')}
          onMessage={() => navigateTo('dateRequests')}
          onEditProfile={() => navigateTo('editProfile')}
          onUpcomingDates={() => navigateTo('upcomingDates')}
          onLogout={() => navigateTo('login')}
        />
      )}
      
      {currentPage === 'matching' && (
        <MatchingPage 
          onBack={() => navigateTo('dashboard')} 
        />
      )}
      
      {currentPage === 'dateRequests' && (
        <MessagingPage 
          onBack={() => navigateTo('dashboard')} 
          onDateAccepted={handleDateAccepted}
        />
      )}
      
      {currentPage === 'payment' && selectedDate && (
        <PaymentPage 
          selectedDate={selectedDate}
          onConfirm={handlePaymentConfirmed}
          onCancel={() => {
            setSelectedDate(null)
            navigateTo('dateRequests')
          }}
        />
      )}
      
      {currentPage === 'editProfile' && (
        <EditProfilePage 
          onSave={() => navigateTo('dashboard')}
          onBack={() => navigateTo('dashboard')}
        />
      )}

      {currentPage === 'upcomingDates' && (
        <UpcomingDatesPage 
          onBack={() => navigateTo('dashboard')}
        />
      )}
    </main>
  )
}