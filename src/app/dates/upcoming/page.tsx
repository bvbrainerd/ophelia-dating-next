'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import type { FC } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

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
  proposed_payment: number;
  isSender: boolean;
}

// Types for Supabase responses
interface ReceiverDateResponse {
  id: string;
  venue: string;
  proposed_time: string;
  status: string;
  proposed_payment: number;
  profiles: Profile;
}

interface SenderDateResponse {
  id: string;
  venue: string;
  proposed_time: string;
  status: string;
  proposed_payment: number;
  profiles: Profile;
}

const UpcomingDatesPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [previousDates, setPreviousDates] = useState<UpcomingDate[]>([]);

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
          proposed_payment,
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
          proposed_payment,
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
          proposed_payment: date.proposed_payment || 0,
          isSender: false,
        })),
        ...(senderDates || []).map(date => ({
          id: date.id,
          otherPerson: date.profiles,
          venue: date.venue,
          proposed_time: date.proposed_time,
          status: date.status,
          proposed_payment: date.proposed_payment || 0,
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
      'Would you like to reschedule or cancel this date?\nOK = Reschedule\nCancel = Cancel Date',
    );

    if (action) {
      alert('Reschedule feature coming soon!');
    } else {
      if (window.confirm('Are you sure you want to cancel this date?')) {
        try {
          const { error } = await supabase
            .from('date_requests')
            .update({ status: 'cancelled' })
            .eq('id', dateId);

          if (error) throw error;

          setUpcomingDates((prev) => prev.filter((date) => date.id !== dateId));
          alert('Date cancelled successfully');
        } catch (error) {
          console.error('Error cancelling date:', error);
          alert('Failed to cancel date. Please try again.');
        }
      }
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
      <Header />
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
                  {date.proposed_payment > 0 && (
                    <p className='font-medium text-green-600'>
                      {date.isSender ? 'Offered: ' : 'Payment: '}${date.proposed_payment}
                    </p>
                  )}
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
                {date.proposed_payment > 0 && (
                  <p className='font-medium text-green-600'>
                    {date.isSender ? 'Offered: ' : 'Payment: '}${date.proposed_payment}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      <BottomNav />
    </div>
  );
};

export default UpcomingDatesPage;