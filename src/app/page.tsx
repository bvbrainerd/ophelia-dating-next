'use client'
<<<<<<< HEAD
import { useState, useEffect } from 'react'
import LoginSignup from '../components/auth/LoginSignup'
import ProfileSetup from '../components/auth/ProfileSetup'
import DatingTypeQuiz from '../components/DatingTypeQuiz'
import ResultScreen from './dashboard/resultsscreen/ResultsPage'
import Dashboard from './dashboard/Dashboard'
import MatchingPage from './matching/page'
import MessagingPage from './daterequests/page'
import PaymentPage from './dates/dates/payment/PaymentPage'
import EditProfilePage from './dashboard/editprofile/page'
import UpcomingDatesPage from './dates/dates/upcoming/page'

import React, { FC } from 'react';

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
=======

import { useEffect } from 'react'
import { supabase } from '@/supabase/client'
import { useRouter } from 'next/navigation'
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
      } else {
          router.push('/dashboard')
        }
      }
    
    checkUser(); 
  }, [])

  // Show loading state while checking auth
  return (
<<<<<<< HEAD
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
          onPreviousDates={() => navigateTo('upcomingDates')}
        />
      )}

      {currentPage === 'upcomingDates' && (
        <UpcomingDatesPage 
          onBack={() => navigateTo('dashboard')}
        />
      )}
=======
    <main className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
>>>>>>> 2edcb43e39caf412ea71253ab4f339a618c7da34
    </main>
  )
}