'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { MessageCircle, Clock, Target, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getDailyDare } from '@/utils/dailyDares';
import Map from '@/components/Map';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DateSession {
  id: string;
  date_request_id: string;
  started_at: string;
  completed_at: string | null;
  dare_assigned_at: string | null;
  dare_completed_at: string | null;
  dare_id: string | null;
  status: 'active' | 'completed' | 'cancelled';
}

interface DateRequest {
  id: string;
  venue: string;
  sender: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  };
  receiver: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  };
  proposed_time: string;
  latitude: number | null;
  longitude: number | null;
}

export default function DateSessionPage({ params }: { params: { dateId: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<DateSession | null>(null);
  const [dateRequest, setDateRequest] = useState<DateRequest | null>(null);
  const [currentDare, setCurrentDare] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');

  useEffect(() => {
    const fetchDateSession = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Get or create date session
        let { data: existingSession } = await supabase
          .from('date_sessions')
          .select('*')
          .eq('date_request_id', params.dateId)
          .single();

        if (!existingSession) {
          const { data: newSession, error: createError } = await supabase
            .from('date_sessions')
            .insert({
              date_request_id: params.dateId,
              status: 'active'
            })
            .select()
            .single();

          if (createError) throw createError;
          existingSession = newSession;
        }

        setSession(existingSession);

        // Get date request details
        const { data: dateRequestData, error: dateError } = await supabase
          .from('date_requests')
          .select(`
            id,
            venue,
            proposed_time,
            latitude,
            longitude,
            sender:profiles!date_requests_sender_id_fkey (
              id,
              first_name,
              avatar_url,
              age
            ),
            receiver:profiles!date_requests_receiver_id_fkey (
              id,
              first_name,
              avatar_url,
              age
            )
          `)
          .eq('id', params.dateId)
          .single();

        if (dateError) throw dateError;

        // Transform the data to match the DateRequest interface
        const transformedDateRequest: DateRequest = {
          id: dateRequestData.id,
          venue: dateRequestData.venue,
          proposed_time: dateRequestData.proposed_time,
          latitude: dateRequestData.latitude,
          longitude: dateRequestData.longitude,
          sender: {
            id: dateRequestData.sender[0].id,
            first_name: dateRequestData.sender[0].first_name,
            avatar_url: dateRequestData.sender[0].avatar_url,
            age: dateRequestData.sender[0].age
          },
          receiver: {
            id: dateRequestData.receiver[0].id,
            first_name: dateRequestData.receiver[0].first_name,
            avatar_url: dateRequestData.receiver[0].avatar_url,
            age: dateRequestData.receiver[0].age
          }
        };

        setDateRequest(transformedDateRequest);

        // Check if we need to assign a dare
        if (!existingSession.dare_assigned_at) {
          const userStatus = 'couple'; // Since this is an active date
          const dailyDare = await getDailyDare(userStatus);
          
          const { error: updateError } = await supabase
            .from('date_sessions')
            .update({
              dare_assigned_at: new Date().toISOString()
            })
            .eq('id', existingSession.id);

          if (updateError) throw updateError;
          setCurrentDare(dailyDare.dare);
        }

      } catch (error) {
        console.error('Error fetching date session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDateSession();
  }, [params.dateId, router]);

  useEffect(() => {
    if (!session?.started_at) return;

    const updateElapsedTime = () => {
      const start = new Date(session.started_at).getTime();
      const now = new Date().getTime();
      const elapsed = now - start;

      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, [session?.started_at]);

  const handleEndDate = async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('date_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;
      router.push('/dashboard');
    } catch (error) {
      console.error('Error ending date:', error);
    }
  };

  const handleCompleteDare = async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('date_sessions')
        .update({
          dare_completed_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;
      setCurrentDare(null);
    } catch (error) {
      console.error('Error completing dare:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (!dateRequest) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#cc0000] mb-4">Date Not Found</h1>
          <p className="text-gray-600">This date session could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#cc0000]">Active Date</h1>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="font-mono text-lg">{elapsedTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-16 h-16">
              <Image
                src={dateRequest.sender.avatar_url || '/images/default-avatar.png'}
                alt={dateRequest.sender.first_name}
                fill
                className="object-cover rounded-full"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {dateRequest.sender.first_name}, {dateRequest.sender.age}
              </h2>
              <p className="text-gray-600">{dateRequest.venue}</p>
            </div>
          </div>

          {/* Map */}
          {dateRequest.latitude && dateRequest.longitude && (
            <div className="h-48 rounded-lg overflow-hidden mb-6">
              <Map
                markers={[{
                  coordinates: [dateRequest.longitude, dateRequest.latitude],
                  title: dateRequest.venue
                }]}
                center={[dateRequest.longitude, dateRequest.latitude]}
                zoom={15}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link
              href={`/messages/${dateRequest.sender.id}`}
              className="flex-1 bg-[#cc0000] text-white py-3 px-6 rounded-full flex items-center justify-center gap-2 hover:bg-[#aa0000] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Message
            </Link>
            <button
              onClick={handleEndDate}
              className="flex-1 border-2 border-[#cc0000] text-[#cc0000] py-3 px-6 rounded-full hover:bg-red-50 transition-colors"
            >
              End Date
            </button>
          </div>
        </div>

        {/* Daily Dare Section */}
        {currentDare && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-[#cc0000]" />
              <h2 className="text-xl font-bold text-[#cc0000]">Daily Dare</h2>
            </div>
            <p className="text-gray-800 text-lg mb-6">{currentDare}</p>
            <button
              onClick={handleCompleteDare}
              className="w-full bg-[#cc0000] text-white py-3 rounded-full flex items-center justify-center gap-2 hover:bg-[#aa0000] transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Complete Dare
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 