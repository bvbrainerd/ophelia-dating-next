'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { MapPin, CalendarDays, Clock3 } from 'lucide-react';
import Link from 'next/link';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
}

export default function SecondDatePage() {
  const params = useParams();
  const router = useRouter();
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchDateDetails = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: dateRequest } = await supabase
        .from('date_requests')
        .select('sender_id, receiver_id')
        .eq('id', params?.dateId)
        .single();

      if (!dateRequest) return;

      const isUserSender = dateRequest.sender_id === session.user.id;
      const otherPersonId = isUserSender ? dateRequest.receiver_id : dateRequest.sender_id;

      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, age, avatar_url')
        .eq('id', otherPersonId)
        .single();

      if (otherProfile) {
        setProfile(otherProfile);
      }
    };

    fetchDateDetails();
  }, [params?.dateId, router]);

  const handleSubmit = async () => {
    if (!venue || !date || !time) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { error } = await supabase
        .from('date_requests')
        .insert({
          sender_id: session.user.id,
          receiver_id: profile?.id,
          venue,
          proposed_time: `${date} ${time}`,
          status: 'pending',
          is_second_date: true,
          previous_date_id: params?.dateId
        });

      if (error) throw error;

      router.push('/dates/upcoming');
    } catch (error) {
      console.error('Error submitting second date request:', error);
      alert('Failed to submit second date request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-2">
        <Header variant="matching" />
        
        <div className="flex flex-col items-center">
          <h1 className="text-[#BA2525] text-2xl font-bold mb-8">
            Propose Second Date
          </h1>

          {profile && (
            <div className="w-full max-w-md">
              <Link 
                href={`/profile/${profile.id}`} 
                className="block w-full mb-8 rounded-lg hover:bg-[#F8F9FB] transition-colors"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="relative w-[52px] h-[52px] flex-shrink-0">
                    <Image
                      src={profile.avatar_url || '/images/default-avatar.png'}
                      alt={`${profile.first_name}'s profile`}
                      fill
                      className="rounded-full object-cover"
                      sizes="52px"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[#1E1E1E] text-lg font-bold">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <p className="text-[#6B7280] text-sm">
                      Age: {profile.age}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[#1E1E1E] text-lg font-bold mb-3">
                    Date Location
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Select venue"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg pr-10 text-base placeholder:text-[#A0AEC0]"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h3 className="text-[#1E1E1E] text-lg font-bold mb-3">
                      Date
                    </h3>
                    <div className="relative">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg pr-10 text-base text-[#1E1E1E]"
                        placeholder="mm/dd/yyyy"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[#1E1E1E] text-lg font-bold mb-3">
                      Time
                    </h3>
                    <div className="relative">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg pr-10 text-base text-[#1E1E1E]"
                        placeholder="--:-- --"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !venue || !date || !time}
                    className="w-full py-2.5 bg-[#E17777] text-white rounded-full font-medium text-base hover:bg-[#BA2525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                  >
                    {isLoading ? 'Sending...' : 'Propose Second Date'}
                  </button>

                  <button
                    onClick={() => router.push('/dates/upcoming')}
                    className="w-full py-2.5 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium text-base hover:bg-[#ffeeee] transition-colors"
                  >
                    Back to Upcoming Dates
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}