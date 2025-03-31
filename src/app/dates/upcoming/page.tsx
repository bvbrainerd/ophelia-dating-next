'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/supabase/client';
import type { FC } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { Calendar, Chrome } from 'lucide-react';
import UpcomingDateCard from '@/components/UpcomingDateCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

interface DateRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  proposed_time: string | null;
  venue: string | null;
  sender?: Profile;
  proposed_payment: number | null;
  split_payment: boolean;
  challenge_id: string | null;
  watcher_votes: number;
  latitude: number | null;
  longitude: number | null;
  venue_id: string | null;
  date_reservations?: Array<{ date_time: string }>;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_amount?: number;
  payment_method_id?: string;
  stripe_payment_intent_id?: string;
  is_couple_date?: boolean;
}

interface DateRequestUpdateData {
  status: string;
  updated_at: string;
  challenge_status?: 'completed' | 'committed' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'refunded';
}

const warningMessages = [
  "Oh you're backing out? You sure about that?",
  "Ophelia doesn't like quitters. Good luck getting your next date",
  "You backed out. Now you owe us one",
  "Be honest. Was it really about them or are you afraid of something deeper?",
  "Tell me. Do you even want to date? Or do you just like the idea of it?",
  "You keep running, but you're only running farther from yourself.",
  "I see what's happening. You want to connect, but every time it gets real, you pull away."
];

const UpcomingDatesPage: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingDates, setUpcomingDates] = useState<DateRequest[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [groupInvites, setGroupInvites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchDates = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Auth error:', sessionError);
        router.push('/auth/login');
        return;
      }

      // Fetch user profile to check if they're in a couple
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_coupled')
        .eq('id', session.user.id)
        .single();

      // Fetch all accepted dates (both single and couple dates)
      const { data: receiverDates, error: receiverError } = await supabase
        .from('date_requests')
        .select(`
          *,
          sender:profiles!date_requests_sender_id_fkey (
            id,
            first_name,
            last_name,
            age,
            avatar_url,
            bio
          )
        `)
        .eq('receiver_id', session.user.id)
        .in('status', ['accepted', 'completed']);

      if (receiverError) {
        console.error('Error fetching receiver dates:', receiverError);
        return;
      }

      const { data: senderDates, error: senderError } = await supabase
        .from('date_requests')
        .select(`
          *,
          sender:profiles!date_requests_receiver_id_fkey (
            id,
            first_name,
            last_name,
            age,
            avatar_url,
            bio
          )
        `)
        .eq('sender_id', session.user.id)
        .in('status', ['accepted', 'completed']);

      if (senderError) {
        console.error('Error fetching sender dates:', senderError);
        return;
      }

      // Fetch couple date requests if user is in a couple
      let coupleDates: DateRequest[] = [];
      if (userProfile?.is_coupled) {
        const { data: coupleRequests, error: coupleError } = await supabase
          .from('couple_date_requests')
          .select('*')
          .eq('user_id', session.user.id)
          .in('status', ['pending', 'confirmed', 'completed']);

        if (!coupleError && coupleRequests) {
          coupleDates = coupleRequests.map(request => ({
            ...request,
            is_couple_date: true,
            sender_id: session.user.id,
            receiver_id: session.user.id, // Same for couple dates
            status: request.status === 'confirmed' ? 'accepted' : request.status
          }));
        }
      }

      // Combine all dates
      const allDates = [...(receiverDates || []), ...(senderDates || []), ...coupleDates];

      // Split dates into upcoming and previous based on date
      const now = new Date();
      const upcoming = allDates.filter(date => 
        new Date(date.proposed_time || '') > now && 
        (date.status === 'accepted' || (date.is_couple_date && date.status === 'confirmed'))
      );
      const previous = allDates.filter(date => 
        new Date(date.proposed_time || '') < now || 
        date.status === 'completed'
      );

      // Sort dates by time
      setUpcomingDates(upcoming.sort((a, b) => 
        new Date(a.proposed_time || '').getTime() - new Date(b.proposed_time || '').getTime()
      ));

    } catch (error) {
      console.error('Error fetching dates:', error);
      if (error instanceof Error && error.message.includes('session')) {
        router.push('/auth/login');
      }
    }
  };

  const fetchChallenges = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const fetchGroupInvites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('group_invites')
        .select('*')
        .eq('invited_user_id', session.user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setGroupInvites(data || []);
    } catch (error) {
      console.error('Error fetching group invites:', error);
    }
  };

  const handleStartDate = async (dateId: string) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push('/auth/login');
        return;
      }
      
      router.push(`upcoming/${dateId}/messaging`);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const handleRescheduleOrCancel = async (dateId: string) => {
    const action = window.confirm(
      'Would you like to reschedule or cancel this date?\nOK = Reschedule\nCancel = Cancel Date'
    );

    if (action) {
      // Handle reschedule
      alert('Reschedule feature coming soon!');
    } else {
      // Show random warning message
      const warningMessage = warningMessages[Math.floor(Math.random() * warningMessages.length)];
      const confirmCancel = window.confirm(warningMessage + '\n\nAre you sure you want to cancel? This will affect your dating status and rating.');

      if (confirmCancel) {
        try {
          // First get the date request to check if it's a challenge
          const { data: dateRequest, error: fetchError } = await supabase
            .from('date_requests')
            .select('is_challenge, payment_status, sender_id')
            .eq('id', dateId)
            .single();

          if (fetchError) throw fetchError;

          const updateData: DateRequestUpdateData = {
            status: 'cancelled',
            updated_at: new Date().toISOString()
          };

          // If it's a challenge date, update both challenge and payment status
          if (dateRequest?.is_challenge) {
            updateData.challenge_status = 'cancelled';
            updateData.payment_status = 'refunded';
          }

          const { error } = await supabase
            .from('date_requests')
            .update(updateData)
            .eq('id', dateId);

          if (error) throw error;

          // Get user's current status and penalties
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('dating_status, rating, cancellation_count')
            .eq('id', dateRequest.sender_id)
            .single();

          if (profileError) throw profileError;

          // Show penalty message
          let penaltyMessage = 'Date cancelled. ';
          if (userProfile.dating_status === 'gold') {
            penaltyMessage += 'Your rating has decreased. Three cancellations will drop your status to Silver.';
          } else if (userProfile.dating_status === 'silver') {
            penaltyMessage += 'Warning: Your status will drop to Bronze after 5 cancellations.';
          } else if (userProfile.dating_status === 'bronze') {
            penaltyMessage += 'Final warning: Your status will drop to Penalty after 7 cancellations.';
          } else {
            penaltyMessage += 'You are now in Penalty status. Your next date will include a surprise challenge.';
          }

          setUpcomingDates((prev) => prev.filter((date) => date.id !== dateId));
          
          if (dateRequest?.is_challenge) {
            alert(penaltyMessage + '\n\nAdmin will process your refund within 24-48 hours.');
          } else {
            alert(penaltyMessage);
          }
        } catch (error) {
          console.error('Error cancelling date:', error);
          alert('Failed to cancel date. Please try again.');
        }
      }
    }
  };

  const addToCalendar = async (date: DateRequest, calendarType: 'google' | 'ical') => {
    try {
      setIsLoading(true);
      
      if (!date.proposed_time) {
        throw new Error('Date and time not set');
      }

      // Calculate end time (2 hours after start time)
      const startTime = new Date(date.proposed_time);
      const endTime = new Date(startTime.getTime() + (2 * 60 * 60 * 1000));

      // Validate dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error('Invalid date format');
      }

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Date with ${date.sender?.first_name} at ${date.venue}`,
          description: `Date with ${date.sender?.first_name} ${date.sender?.last_name} at ${date.venue}.\n\nBooked through Ophelia Dating.`,
          location: date.venue,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate calendar links');
      }

      const { googleCalendarLink, iCalLink } = await response.json();

      if (calendarType === 'google') {
        window.open(googleCalendarLink, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = iCalLink;
        link.download = `ophelia-date-${date.id}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      alert(error instanceof Error ? error.message : 'Failed to add event to calendar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchDates(), fetchChallenges(), fetchGroupInvites()])
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <Header variant="default" />
      
      {/* Ophelia Header with white fill and red text */}
      <div className="bg-white py-4 shadow-sm">
        <h1 className="text-center text-[#cc0000] text-3xl font-prompt">Ophelia</h1>
      </div>

      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex justify-center space-x-8 py-4 px-4 font-prompt">
          <Link 
            href="/dates/upcoming"
            className={`text-lg font-medium ${pathname === '/dates/upcoming' ? 'text-[#cc0000]' : 'text-gray-500'}`}
          >
            Upcoming Dates
          </Link>
          <Link 
            href="/challenges"
            className={`text-lg font-medium ${pathname === '/challenges' ? 'text-[#cc0000]' : 'text-gray-500'}`}
          >
            Challenges
          </Link>
          <Link 
            href="/group-invites"
            className={`text-lg font-medium ${pathname === '/group-invites' ? 'text-[#cc0000]' : 'text-gray-500'}`}
          >
            Group Invites
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 font-prompt">
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#cc0000]" />
            </div>
          ) : upcomingDates.length > 0 ? (
            upcomingDates.map((date) => (
              <UpcomingDateCard
                key={`${date.id}-${date.sender_id}`}
                date={date}
                onStartDate={() => handleStartDate(date.id)}
                onRescheduleOrCancel={() => handleRescheduleOrCancel(date.id)}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-10">
              No upcoming dates yet
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default UpcomingDatesPage;