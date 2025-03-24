'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

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

interface DateRequest {
  sender_id: string;
  receiver_id: string;
  is_challenge: boolean;
}

interface DateRequestUpdateData {
  status: string;
  updated_at: string;
  challenge_status?: 'completed' | 'committed' | 'cancelled';
}

export default function DateMessaging() {
  const router = useRouter();
  const params = useParams();
  const { dateId } = params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserStatus, setCurrentUserStatus] = useState<DateStatus>('Not Started');
  const [otherUserStatus, setOtherUserStatus] = useState<DateStatus>('Not Started');
  const [otherUserProfile, setOtherUserProfile] = useState<Profile | null>(null);

  const supabase = createClientComponentClient();

  const fetchCurrentUserId = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching current user:', error);
        router.push('/auth/signin');
        return null;
      }
      
      if (!user) {
        router.push('/auth/signin');
        return null;
      }
      
      return user.id;
    } catch (error) {
      console.error('Error in fetchCurrentUserId:', error);
      router.push('/auth/signin');
      return null;
    }
  };

  
  const fetchOtherUserProfile = async () => {
    const currentUserId = await fetchCurrentUserId();
    if (!currentUserId) return;
  
    try {
      const { data: dateRequestData, error: dateRequestError } = await supabase
        .from('date_requests')
        .select('sender_id, receiver_id')
        .eq('id', dateId)
        .single();
  
      if (dateRequestError) throw dateRequestError;
  
      const otherUserId =
        dateRequestData.sender_id === currentUserId
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
    const currentUserId = await fetchCurrentUserId();
    if (!currentUserId) return []; // Return an empty array if user ID is not found

    const { data, error } = await supabase
      .from('messages')
      .select('id, content, sender, timestamp, read, status, date_id') // Explicitly select only required columns
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
        (msg) => msg.sender === 'user' && msg.id === currentUserId
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
    // Initial fetch of messages
    fetchMessagesAndStatuses();
    fetchOtherUserProfile();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`date_messages_${dateId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `date_id=eq.${dateId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add the message if it's from the other user
          if (newMessage.sender !== 'user') {
            setMessages(prevMessages => [...prevMessages, {
              ...newMessage,
              timestamp: new Date(newMessage.timestamp).getTime(),
              date_id: String(newMessage.date_id)
            }]);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateId]);

  const updateCurrentUserStatus = async (status: DateStatus) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
        content: newMessage,
        sender: 'user',
        status: currentUserStatus, // If needed, include status explicitly
        timestamp: new Date().toISOString(),
        date_id: dateId,
        read: false,
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
    if (!newMessage.trim()) return;

    try {
      // Step 1: Get current user ID with error logging
      const currentUserId = await fetchCurrentUserId();
      console.log('Current user ID:', currentUserId);
      
      if (!currentUserId) {
        console.log('No current user ID found');
        return;
      }

      // Step 2: Prepare message data
      const messageData = {
        content: newMessage,
        sender: 'user' as const,
        timestamp: new Date().toISOString(),
        date_id: dateId,
        read: false
      };
      
      console.log('Attempting to send message with data:', messageData);

      // Step 3: Send to Supabase with detailed error handling
      const { data, error, status } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.log('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: status
        });
        throw error;
      }

      console.log('Message sent successfully:', data);

      // Step 4: Update local state
      setMessages(prev => [...prev, {
        id: data.id,
        ...messageData,
        sender: 'user' as const,
        timestamp: Date.now(),
        date_id: dateId as string,
      }]);
      
      setNewMessage('');

    } catch (error) {
      // Detailed error logging
      console.log('Full error details:', {
        error,
        errorType: error instanceof Error ? 'Error' : typeof error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        dateId,
        timestamp: new Date().toISOString()
      });
      
      alert('Failed to send message. Please try again.');
    }
  };

  // Update the pre-written message buttons to send immediately
  const sendPreWrittenMessage = async (messageContent: string) => {
    try {
      const currentUserId = await fetchCurrentUserId();
      if (!currentUserId) return;

      // Create the message object
      const messageData = {
        content: messageContent,
        sender: 'user',
        timestamp: new Date().toISOString(),
        date_id: dateId,
        read: false,
        user_id: currentUserId
      };

      // Send the message to Supabase
      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('Error sending pre-written message:', error);
        return;
      }

      // Update local messages state (optimistic update)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        ...messageData,
        sender: 'user' as const,
        timestamp: Date.now(),
        date_id: dateId as string,
      }]);

    } catch (error) {
      console.error('Error in sendPreWrittenMessage:', error);
    }
  };

  const getStatusButtonClass = (buttonStatus: DateStatus, isCurrentUserButton: boolean) => {
    const status = isCurrentUserButton ? currentUserStatus : otherUserStatus;
    return `px-4 py-1.5 rounded-full text-sm ${
      buttonStatus === status
        ? 'bg-[#BA2525] text-white hover:bg-[#a02020]'
        : 'border border-[#BA2525] text-[#BA2525] hover:bg-[#ffeeee]'
    } transition-colors`;
  };  

  const confirmDateComplete = async () => {
    try {
      const currentUserId = await fetchCurrentUserId();
      if (!currentUserId) return;

      // Get the date request details first
      const { data: dateRequest, error: dateRequestError } = await supabase
        .from('date_requests')
        .select('sender_id, receiver_id, is_challenge')
        .eq('id', dateId)
        .single();

      if (dateRequestError) {
        console.log('Error fetching date request:', dateRequestError);
        throw dateRequestError;
      }

      // Insert into confirmed_dates
      const { data, error: confirmError } = await supabase
        .from('confirmed_dates')
        .insert({
          date_request_id: dateId,
          confirmed_in_person: true,
          user1_id: currentUserId,
          user2_id: dateRequest.sender_id === currentUserId 
            ? dateRequest.receiver_id 
            : dateRequest.sender_id
        })
        .select()
        .single();

      if (confirmError) {
        console.log('Error confirming date:', confirmError);
        throw confirmError;
      }

      // Update original date_request status
      const updateData: DateRequestUpdateData = {
        status: 'completed',
        updated_at: new Date().toISOString()
      };

      // If this was a challenge date, update the challenge status
      if (dateRequest.is_challenge) {
        updateData.challenge_status = 'completed';
      }

      const { error: updateError } = await supabase
        .from('date_requests')
        .update(updateData)
        .eq('id', dateId);

      if (updateError) {
        console.log('Error updating date request:', updateError);
        throw updateError;
      }

      router.push('/dates/upcoming');

    } catch (error) {
      console.error('Error confirming date completion:', error);
      // Handle error appropriately
    }
  };

  return (
    <div className="max-w-md mx-auto p-5 pt-8 pb-24">
      <Header />
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Messaging for Your Date
      </h1>

      <div className="message-area flex flex-col h-[400px] overflow-y-auto mb-5">
        {messages.map((message) => (
          <div key={`${message.id}-${message.timestamp}`} className="mb-4">
            {/* Message Bubble */}
            <div className={`p-2.5 rounded-full max-w-[75%] ${
              message.sender === 'user' 
                ? 'bg-[#BA2525] text-white ml-auto'
                : 'bg-white text-[#BA2525] border border-[#BA2525]'
            }`}>
              <p className="text-sm">
                {message.content}
              </p>
            </div>
            {/* Timestamp below bubble */}
            <p className={`text-[10px] mt-1 text-gray-500 ${
              message.sender === 'user' 
                ? 'text-right'
                : 'text-left'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        ))}
      </div>

      {/* Pre-written Message Options */}
      <div className="mb-4 flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setNewMessage("Looking forward to our date!")}
          className="px-4 py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#a02020] transition-colors text-sm"
        >
          Looking forward to our date!
        </button>
        <button
          onClick={() => setNewMessage("I'm on my way!")}
          className="px-4 py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#a02020] transition-colors text-sm"
        >
          I'm on my way!
        </button>
        <button
          onClick={() => setNewMessage("Running a little late")}
          className="px-4 py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#a02020] transition-colors text-sm"
        >
          Running a little late
        </button>
        <button
          onClick={() => setNewMessage("I'll be there soon!")}
          className="px-4 py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#a02020] transition-colors text-sm"
        >
          I'll be there soon!
        </button>
        <button
          onClick={() => setNewMessage("I'm here")}
          className="px-4 py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#a02020] transition-colors text-sm"
        >
          I'm here
        </button>
      </div>

      <div className="input-area flex items-center space-x-3 mb-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow p-2 border rounded-full"
          placeholder="Type a message"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#a02020] transition-colors"
        >
          Send
        </button>
      </div>

      <div className="text-center mt-5">
        <button
          onClick={confirmDateComplete}
          className="w-full p-2.5 mt-4 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors"
        >
          We're both here
        </button>
      </div>

      <BottomNav />
    </div>
  );
}