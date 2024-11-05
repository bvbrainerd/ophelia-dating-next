'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import components with relative paths
const LoginSignup = dynamic(() => import('../components/LoginSignup'), {
  ssr: false
});
const ProfileSetup = dynamic(() => import('../components/ProfileSetup'), {
  ssr: false
});
const DatingTypeQuiz = dynamic(() => import('../components/DatingTypeQuiz'), {
  ssr: false
});
const ResultScreen = dynamic(() => import('../components/ResultScreen'), {
  ssr: false
});
const Dashboard = dynamic(() => import('../components/Dashboard'), {
  ssr: false
});
const MatchingPage = dynamic(() => import('../components/MatchingPage'), {
  ssr: false
});
const MessagingPage = dynamic(() => import('../components/MessagingPage'), {
  ssr: false
});
const PaymentPage = dynamic(() => import('../components/PaymentPage'), {
  ssr: false
});
const EditProfilePage = dynamic(() => import('../components/EditProfilePage'), {
  ssr: false
});
const UpcomingDatesPage = dynamic(() => import('../components/UpcomingDatesPage'), {
  ssr: false
});

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-[#cc0000] text-xl">Loading...</div>
  </div>
);

// Types and interface definitions
type DateStatus = 'pending' | 'accepted' | 'declined';

interface DateType {
  id: number;
  name: string;
  age: number;
  image: string;
  venue: string;
  date: string;
  time: string;
  status: DateStatus;
  price: number;
  description: string;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [selectedDate, setSelectedDate] = useState<DateType | null>(null);
  const [userDatingStyle, setUserDatingStyle] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Loading />;
  }

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleQuizComplete = (datingStyle: string) => {
    setUserDatingStyle(datingStyle);
    navigateTo('result');
  };

  const handleDateAccepted = (date: DateType) => {
    setSelectedDate(date);
    navigateTo('payment');
  };

  const handlePaymentConfirmed = () => {
    alert('Payment successful! Your date has been confirmed.');
    setSelectedDate(null);
    navigateTo('dashboard');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {currentPage === 'login' && (
        <LoginSignup
          onLogin={() => navigateTo('dashboard')}
          onSignup={() => navigateTo('profile')}
        />
      )}
      
      {currentPage === 'profile' && (
        <ProfileSetup onComplete={() => navigateTo('quiz')} />
      )}
      
      {currentPage === 'quiz' && (
        <DatingTypeQuiz onComplete={handleQuizComplete} />
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
        <MatchingPage onBack={() => navigateTo('dashboard')} />
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
            setSelectedDate(null);
            navigateTo('dateRequests');
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
        <UpcomingDatesPage onBack={() => navigateTo('dashboard')} />
      )}
    </main>
  );
}
