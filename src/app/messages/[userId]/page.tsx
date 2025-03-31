'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Image from 'next/image';
import { Send, ArrowLeft, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  date_id: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  avatar_url: string | null;
  age: number;
}

interface DateStatus {
  id: string;
  date_started: boolean;
  date_ended: boolean;
  start_time: string | null;
  end_time: string | null;
  status: 'pending' | 'started' | 'completed' | 'cancelled';
}

export default function MessagesPage({
  params,
}: {
  params: { userId: string }
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateId, setDateId] = useState<string | null>(null);
  const [dateStatus, setDateStatus] = useState<DateStatus | null>(null);
  const [newMessage, setNewMessage] = useState('');

  type MessageCategory = 'Arriving' | 'Excited' | 'On the Way' | 'Leaving' | 'After' | 'Plans';
  const [activeTab, setActiveTab] = useState<MessageCategory>('Arriving');

  const quickMessages: Record<MessageCategory, string[]> = {
    'Arriving': [
      "Just got here",
      "Standing by the entrance.",
      "At the hostess/front table",
      "I see you!"
    ],
    'Excited': [
      "Can't wait to see you!",
      "Looking forward to this!",
      "Excited to finally meet!",
      "See you soon!",
      "So excited"
    ],
    'On the Way': [
      "Just left, on my way!",
      "Almost there!",
      "About 5 minutes away.",
      "Traffic is bad, but I'll be there soon!",
      "I'm a little early!"
    ],
    'Leaving': [
      "Leaving now!",
      "Leaving in 5.",
      "Leaving soon"
    ],
    'After': [
      "Just left, had a great time!",
      "Made it home safely, thanks for tonight!",
      "Hope you got home safely!",
      "Had fun—talk soon!",
      "Asshole"
    ],
    'Plans': [
      "Hey, something came up—I would love to reschedule?",
      "I won't be able to make it today, but I'd love to find another day!",
      "Let's raincheck, I want to make sure we have a good time!",
      "Second date?",
      "I want to see you again",
      "Let's do it!"
    ]
  };

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      try {
        if (!params?.userId) throw new Error('User ID is required');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch other user's profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, avatar_url, age')
          .eq('id', params.userId)
          .single();

        if (profileData) {
          setOtherUser(profileData);
        }

        // First, get the date request between these users
        const { data: dateData } = await supabase
          .from('date_requests')
          .select('id')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (dateData) {
          setDateId(dateData.id);

          // Fetch date status
          const { data: statusData } = await supabase
            .from('date_statuses')
            .select('*')
            .eq('date_id', dateData.id)
            .single();

          if (statusData) {
            setDateStatus(statusData);
          }

          // Then fetch messages for this date
          const { data: messagesData } = await supabase
            .from('messages')
            .select('*')
            .eq('date_id', dateData.id)
            .order('created_at', { ascending: true });

          if (messagesData) {
            setMessages(messagesData);
          }

          // Set up real-time subscription for this specific date's messages
          const channel = supabase
            .channel(`messages-${dateData.id}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `date_id=eq.${dateData.id}`
              },
              (payload) => {
                const newMessage = payload.new as Message;
                setMessages(prev => [...prev, newMessage]);
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndMessages();
  }, [params.userId, router]);

  const handleQuickMessage = async (message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !dateId) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          content: message,
          sender_id: user.id,
          date_id: dateId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStartDate = async () => {
    try {
      if (!dateId) return;

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('date_statuses')
        .upsert({
          date_id: dateId,
          date_started: true,
          start_time: now,
          status: 'started'
        }, {
          onConflict: 'date_id'
        })
        .select()
        .single();

      if (error) throw error;

      setDateStatus(data);
      toast.success('Date started!');
      router.push(`/dates/started/${dateId}`);
    } catch (error) {
      console.error('Error starting date:', error);
      toast.error('Failed to start date');
    }
  };

  const handleEndDate = async () => {
    try {
      if (!dateId) return;

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('date_statuses')
        .upsert({
          date_id: dateId,
          date_ended: true,
          end_time: now,
          status: 'completed'
        }, {
          onConflict: 'date_id'
        })
        .select()
        .single();

      if (error) throw error;

      setDateStatus(data);
      toast.success('Date ended!');
      router.push(`/dates/upcoming/${dateId}/review`);
    } catch (error) {
      console.error('Error ending date:', error);
      toast.error('Failed to end date');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#cc0000] pb-24">
      <Header variant="matching" />
      
      <div className="max-w-2xl mx-auto p-4">
        {/* Profile and Messages Container */}
        <div className="bg-white rounded-2xl shadow-sm mb-4">
          {/* Header with back button and user info */}
          <div className="flex items-center gap-4 p-4 bg-white">
            <Link href="/daterequests" className="text-[#cc0000] hover:text-[#aa0000]">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image
                  src={otherUser?.avatar_url || '/images/default-avatar.png'}
                  alt={`${otherUser?.first_name}'s profile`}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-[#cc0000] text-lg font-semibold">
                  {otherUser?.first_name}, {otherUser?.age}
                </h2>
              </div>
            </div>
          </div>

          {/* Messages container with fixed height and scrolling */}
          <div className="p-4 h-[calc(100vh-520px)] overflow-y-auto">
            {messages.map((message) => {
              // Get the current user's ID from params
              const currentUserId = params.userId;
              return (
                <div
                  key={message.id}
                  className={`mb-2 flex ${
                    message.sender_id === currentUserId ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-[20px] max-w-[70%] text-xs ${
                      message.sender_id === currentUserId
                        ? 'bg-white border-2 border-[#cc0000] text-[#cc0000]'
                        : 'bg-[#cc0000] text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Date Control Buttons */}
          {dateStatus && (
            <div className="px-4 pb-4 flex gap-2">
              {!dateStatus.date_started && (
                <button
                  onClick={handleStartDate}
                  className="flex-1 py-2 bg-[#cc0000] text-white rounded-full text-sm font-medium hover:bg-[#aa0000] transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Date
                </button>
              )}
              {dateStatus.date_started && !dateStatus.date_ended && (
                <button
                  onClick={handleEndDate}
                  className="flex-1 py-2 bg-[#cc0000] text-white rounded-full text-sm font-medium hover:bg-[#aa0000] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  End Date & Review
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Messages Section with Tabs */}
        <div className="bg-[#cc0000] border-2 border-white rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex bg-white">
            {Object.keys(quickMessages).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as MessageCategory)}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${
                  activeTab === tab as MessageCategory
                    ? 'bg-[#cc0000] text-white'
                    : 'bg-white text-[#cc0000] hover:bg-red-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Message Buttons */}
          <div className="p-3 grid grid-cols-2 gap-2">
            {quickMessages[activeTab].map((msg) => (
              <button
                key={msg}
                onClick={() => handleQuickMessage(msg)}
                className="min-h-[40px] px-3 bg-[#cc0000] text-white border-2 border-white rounded-full text-xs font-medium hover:bg-[#aa0000] transition-all flex items-center justify-center text-center leading-tight"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
} 