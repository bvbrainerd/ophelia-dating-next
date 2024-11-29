'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'other';
  timestamp: number;
  read: boolean;
  date_id: string | string[];
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

type DateStatus = 'Not Started' | "I'm on my way" | "I'm here" | "We're both here";

export default function DateMessaging() {
  const router = useRouter();
  const params = useParams();
  const { dateId } = params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserStatus, setCurrentUserStatus] = useState<DateStatus>('Not Started');
  const [otherUserStatus, setOtherUserStatus] = useState<DateStatus>('Not Started');
  const [otherUserProfile, setOtherUserProfile] = useState<Profile | null>(null);

  const fetchOtherUserProfile = async () => {
    try {
      const { data: dateRequestData, error: dateRequestError } = await supabase
        .from('date_requests')
        .select('sender_id, receiver_id')
        .eq('id', dateId)
        .single();

      if (dateRequestError) throw dateRequestError;

      const otherUserId = dateRequestData.sender_id === process.env.NEXT_PUBLIC_CURRENT_USER_ID! 
        ? dateRequestData.receiver_id 
        : dateRequestData.sender_id;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', otherUserId)
        .single();

      if (profileError) throw profileError;

      setOtherUserProfile(profileData);
    } catch (error) {
      console.error('Error fetching other user profile:', error);
    }
  };

  const fetchMessagesAndStatuses = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('date_id', dateId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (data) {
      // Process messages
      const processedMessages = data.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp).getTime(),
        date_id: String(message.date_id),
      }));
      setMessages(processedMessages);

      // Extract current user and other user statuses
      const currentUserMessages = data.filter(
        msg => msg.sender === 'user' && 
               msg.user_id === process.env.NEXT_PUBLIC_CURRENT_USER_ID!
      );
      const otherUserMessages = data.filter(
        msg => msg.sender === 'other'
      );

      // Set most recent statuses
      if (currentUserMessages.length > 0) {
        const latestCurrentUserStatus = currentUserMessages[currentUserMessages.length - 1].status;
        setCurrentUserStatus(latestCurrentUserStatus as DateStatus);
      }

      if (otherUserMessages.length > 0) {
        const latestOtherUserStatus = otherUserMessages[otherUserMessages.length - 1].status;
        setOtherUserStatus(latestOtherUserStatus as DateStatus);
      }
    }
  };

  useEffect(() => {
    fetchMessagesAndStatuses();
    fetchOtherUserProfile();
  }, [dateId]);

  const updateCurrentUserStatus = async (status: DateStatus) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          date_id: dateId,
          status,
          sender: 'user',
          user_id: process.env.NEXT_PUBLIC_CURRENT_USER_ID!,
          timestamp: new Date().toISOString(),
        });
  
      if (error) {
        console.error('Error updating status:', error);
      } else {
        // Update the local state to trigger a re-render
        setCurrentUserStatus(status);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  

  const sendMessage = async () => {
    if (currentUserStatus !== "We're both here" || otherUserStatus !== "We're both here") {
      alert("You can only send messages after both users confirm they are here.");
      return;
    }

    if (newMessage.trim() !== '') {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender: 'user',
          user_id: process.env.NEXT_PUBLIC_CURRENT_USER_ID!,
          timestamp: new Date().toISOString(),
          date_id: dateId,
          read: false,
        });

      if (error) {
        console.error('Error sending message:', error);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: newMessage,
          sender: 'user',
          timestamp: Date.now(),
          read: false,
          date_id: dateId as string,
        }]);
        setNewMessage('');
      }
    }
  };

  const getStatusButtonClass = (buttonStatus: DateStatus, isCurrentUserButton: boolean) => {
    const status = isCurrentUserButton ? currentUserStatus : otherUserStatus;
    return buttonStatus === status
      ? 'bg-[#cc0000] text-white'
      : 'border-2 border-[#cc0000] text-[#cc0000] bg-transparent';
  };  

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Messaging for Your Date
      </h1>

      {/* Current User Status Buttons */}
      <div className="mb-3">
        <p className="text-center mb-2 font-semibold">Your Status</p>
        <div className="status-buttons space-x-3 mb-5 flex justify-center">
          <button 
            className={`p-2 rounded text-xs ${getStatusButtonClass("I'm on my way", true)}`}
            onClick={() => updateCurrentUserStatus("I'm on my way")}
            disabled={currentUserStatus !== 'Not Started'}
          >
            I'm on my way
          </button>
          <button 
            className={`p-2 rounded text-xs ${getStatusButtonClass("I'm here", true)}`}
            onClick={() => updateCurrentUserStatus("I'm here")}
            disabled={currentUserStatus !== "I'm on my way"}
          >
            I'm here
          </button>
          <button 
            className={`p-2 rounded text-xs ${getStatusButtonClass("We're both here", true)}`}
            onClick={() => updateCurrentUserStatus("We're both here")}
            disabled={currentUserStatus !== "I'm here" || otherUserStatus !== "I'm here"}
          >
            We're both here
          </button>
        </div>
      </div>

      {/* Other User Status Display */}
      <div className="mb-3">
        <p className="text-center mb-2 font-semibold">
          {otherUserProfile?.first_name || 'Other User'}'s Status
        </p>
        <div className="status-buttons space-x-3 mb-5 flex justify-center">
          <button 
            className={`p-2 rounded text-xs ${getStatusButtonClass("I'm on my way", false)}`}
            disabled
          >
            I'm on my way
          </button>
          <button 
            className={`p-2 rounded text-xs ${getStatusButtonClass("I'm here", false)}`}
            disabled
          >
            I'm here
          </button>
          <button 
            className={`p-2 rounded text-xs ${getStatusButtonClass("We're both here", false)}`}
            disabled
          >
            We're both here
          </button>
        </div>
      </div>

      <div className="message-area flex flex-col h-[400px] overflow-y-auto mb-5">
        {messages.map((message) => (
          <div
          key={`${message.id}-${message.timestamp}`}
              className={`mb-2 mt-6 p-2 rounded max-w-[75%] ${
              message.sender === 'user' 
                ? 'bg-[#cc0000] text-white ml-auto'
                : 'bg-white text-red-500'
            }`}
          >
            <p>{message.content}</p>
            <p className="text-xs">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        ))}
      </div>

      <div className="input-area flex items-center space-x-3 mb-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow p-2 border rounded"
          placeholder="Type a message"
          disabled={currentUserStatus !== "We're both here" || otherUserStatus !== "We're both here"}
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-[#cc0000] text-white rounded"
          disabled={currentUserStatus !== "We're both here" || otherUserStatus !== "We're both here"}
        >
          Send
        </button>
      </div>

      <div className="text-center mt-5">
        <button
          onClick={() => router.back()}
          className="w-full p-2.5 mt-4 border-2 border-[#cc0000] text-[#cc0000] rounded-lg font-medium hover:bg-[#ffeeee] transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}