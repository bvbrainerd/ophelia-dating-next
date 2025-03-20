'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import type { FC } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { Calendar, Chrome } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

interface UpcomingDate {
  id: string;
  otherPerson: Profile;
  venue: string;
  proposed_time: string;
  status: string;
  isSender: boolean;
}

// Types for Supabase responses
interface ReceiverDateResponse {
  id: string;
  venue: string;
  proposed_time: string;
  status: string;
  profiles: Profile;
}

interface SenderDateResponse {
  id: string;
  venue: string;
  proposed_time: string;
  status: string;
  profiles: Profile;
}

interface DateRequest {
  id: string;
  is_challenge: boolean;
  payment_status: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [previousDates, setPreviousDates] = useState<UpcomingDate[]>([]);
  const [calendarLoading, setCalendarLoading] = useState<string | null>(null);

  const fetchDates = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Auth error:', sessionError);
        router.push('/auth/login');
        return;
      }

      // Fetch all accepted dates
      const { data: receiverDates, error: receiverError } = await supabase
        .from('date_requests')
        .select(`
          id,
          venue,
          proposed_time,
          status,
          profiles!date_requests_sender_id_fkey (
            id,
            first_name,
            last_name,
            age,
            avatar_url,
            bio
          )
        `)
        .eq('receiver_id', session.user.id)
        .in('status', ['accepted', 'completed'])
        .returns<ReceiverDateResponse[]>();

      if (receiverError) {
        console.error('Error fetching receiver dates:', receiverError);
        return;
      }

      const { data: senderDates, error: senderError } = await supabase
        .from('date_requests')
        .select(`
          id,
          venue,
          proposed_time,
          status,
          profiles!date_requests_receiver_id_fkey (
            id,
            first_name,
            last_name,
            age,
            avatar_url,
            bio
          )
        `)
        .eq('sender_id', session.user.id)
        .in('status', ['accepted', 'completed'])
        .returns<SenderDateResponse[]>();

      if (senderError) {
        console.error('Error fetching sender dates:', senderError);
        return;
      }

      // Format and combine all dates
      const formattedDates = [
        ...(receiverDates || []).map(date => ({
          id: date.id,
          otherPerson: date.profiles,
          venue: date.venue,
          proposed_time: date.proposed_time,
          status: date.status,
          isSender: false,
        })),
        ...(senderDates || []).map(date => ({
          id: date.id,
          otherPerson: date.profiles,
          venue: date.venue,
          proposed_time: date.proposed_time,
          status: date.status,
          isSender: true,
        }))
      ];

      // Split dates into upcoming and previous based on date
      const now = new Date();
      const upcoming = formattedDates.filter(date => new Date(date.proposed_time) > now && date.status === 'accepted');
      const previous = formattedDates.filter(date => new Date(date.proposed_time) < now || date.status === 'completed');

      // Sort dates by time
      setUpcomingDates(upcoming.sort((a, b) => new Date(a.proposed_time).getTime() - new Date(b.proposed_time).getTime()));
      setPreviousDates(previous.sort((a, b) => new Date(b.proposed_time).getTime() - new Date(a.proposed_time).getTime()));

    } catch (error) {
      console.error('Error fetching dates:', error);
      if (error instanceof Error && error.message.includes('session')) {
        router.push('/auth/login');
      }
    } finally {
      setIsLoading(false);
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

  const addToCalendar = async (date: UpcomingDate, calendarType: 'google' | 'ical') => {
    try {
      setCalendarLoading(`${date.id}-${calendarType}`);
      
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
          title: `Date with ${date.otherPerson.first_name} at ${date.venue}`,
          description: `Date with ${date.otherPerson.first_name} ${date.otherPerson.last_name} at ${date.venue}.\n\nBooked through Ophelia Dating.`,
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
      setCalendarLoading(null);
    }
  };

  useEffect(() => {
    fetchDates();
  }, [router]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
      </div>
    );
  }

  return (
    <div className='max-w-2xl mx-auto p-5 pt-8 pb-24'>
      <Header variant="matching" />
      {/* Upcoming Dates Section */}
      <h2 className='text-center text-[#cc0000] font-bold text-3xl mb-6'>
        Your Upcoming Dates
      </h2>

      {upcomingDates.length === 0 ? (
        <p className='text-center mb-8 text-gray-600'>
          No upcoming dates scheduled yet.
        </p>
      ) : (
        <div className="mb-12">
          {upcomingDates.map((date) => (
            <div
              key={date.id}
              className='border border-gray-200 rounded-lg p-5 mb-5 shadow-sm'
            >
              <div className='flex items-center mb-4'>
                <div className='relative w-24 h-24 mr-4'>
                  <Image
                    src={date.otherPerson.avatar_url || '/images/default-avatar.png'}
                    alt={`${date.otherPerson.first_name}'s profile`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 96px, 96px"
                    className="object-cover rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/default-avatar.png';
                    }}
                  />
                </div>
                <div>
                  <h3 className='text-[#cc0000] text-xl font-medium mb-1'>
                    {date.otherPerson.first_name} {date.otherPerson.last_name}, {date.otherPerson.age}
                  </h3>
                  <p className='text-gray-600 mb-1'>{date.otherPerson.bio}</p>
                  <p className='mb-1 font-medium'>
                    When: {new Date(date.proposed_time).toLocaleDateString()}, {new Date(date.proposed_time).toLocaleTimeString()}
                  </p>
                  <p className='font-medium'>Where: {date.venue}</p>
                </div>
              </div>

              <div className='space-y-2'>
                <button
                  onClick={() => handleStartDate(date.id)}
                  className='w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors'
                  type="button"
                >
                  Start Date
                </button>
                <button
                  onClick={() => router.push(`/dates/upcoming/${date.id}/messaging`)}
                  className='w-full p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
                  type="button"
                >
                  Go to Messages
                </button>
                <button
                  onClick={() => handleRescheduleOrCancel(date.id)}
                  className='w-full p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
                  type="button"
                >
                  Reschedule or Cancel Date
                </button>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => addToCalendar(date, 'google')}
                    disabled={calendarLoading === `${date.id}-google`}
                    className='flex-1 p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
                    type="button"
                  >
                    {calendarLoading === `${date.id}-google` ? (
                      <div className="w-5 h-5 border-2 border-[#cc0000] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M21.56 10.738l-9.002-8.002c-.47-.47-1.234-.47-1.704 0l-9.002 8.002c-.47.47-.47 1.234 0 1.704l9.002 8.002c.47.47 1.234.47 1.704 0l9.002-8.002c.47-.47.47-1.234 0-1.704zM12 19.684L3.316 12 12 4.316 20.684 12 12 19.684z"/>
                      </svg>
                    )}
                    Add to Google Calendar
                  </button>
                  <button
                    onClick={() => addToCalendar(date, 'ical')}
                    disabled={calendarLoading === `${date.id}-ical`}
                    className='flex-1 p-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
                    type="button"
                  >
                    {calendarLoading === `${date.id}-ical` ? (
                      <div className="w-5 h-5 border-2 border-[#cc0000] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Calendar className="w-5 h-5" />
                    )}
                    Add to Apple Calendar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Previous Dates Section */}
      <h2 className='text-center text-[#cc0000] font-bold text-3xl mb-6'>
        Previous Dates
      </h2>

      {previousDates.length === 0 ? (
        <p className='text-center mb-5 text-gray-600'>
          No previous dates yet.
        </p>
      ) : (
        previousDates.map((date) => (
          <div
            key={date.id}
            className='border border-gray-200 rounded-lg p-5 mb-5 shadow-sm'
          >
            <div className='flex items-center mb-4'>
              <div className='relative w-24 h-24 mr-4'>
                <Image
                  src={date.otherPerson.avatar_url || '/images/default-avatar.png'}
                  alt={`${date.otherPerson.first_name}'s profile`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 96px, 96px"
                  className="object-cover rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/default-avatar.png';
                  }}
                />
              </div>
              <div>
                <h3 className='text-[#cc0000] text-xl font-medium mb-1'>
                  {date.otherPerson.first_name} {date.otherPerson.last_name}, {date.otherPerson.age}
                </h3>
                <p className='text-gray-600 mb-1'>{date.otherPerson.bio}</p>
                <p className='mb-1 font-medium'>
                  When: {new Date(date.proposed_time).toLocaleDateString()}, {new Date(date.proposed_time).toLocaleTimeString()}
                </p>
                <p className='font-medium'>Where: {date.venue}</p>
              </div>
            </div>
            <div className='space-y-2 mt-4'>
              <button
                onClick={() => router.push(`/dates/upcoming/${date.id}/second-date`)}
                className='w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors'
                type="button"
              >
                Second Date
              </button>
              <button
                onClick={() => router.push(`/dates/upcoming/${date.id}/rate`)}
                className='w-full p-2.5 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
                type="button"
              >
                Rate
              </button>
            </div>
          </div>
        ))
      )}

      <BottomNav />
    </div>
  );
};

export default UpcomingDatesPage;