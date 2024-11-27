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

export default function DateMessaging() {
  const router = useRouter();
  const params = useParams();
  const { dateId } = params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  // Fetch messages from the database
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('date_id', dateId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else if (data) {
      setMessages(data.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp).getTime(),
        date_id: String(message.date_id),
      })));
    }
  };

  // Fetch current status from the database
  const fetchCurrentStatus = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('status')
      .eq('date_id', dateId)
      .single();

    if (error) {
      console.error('Error fetching current status:', error);
    } else if (data) {
      setCurrentStatus(data.status);  // Set the current status
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchCurrentStatus();
  }, [dateId]);

  const sendMessage = async () => {
    if (newMessage.trim() !== '') {
      const messageToSend = {
        content: newMessage,
        sender: 'user',
        timestamp: new Date().toISOString(),
        date_id: dateId,
        read: false,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageToSend]);

      if (error) {
        console.error('Error sending message:', error);
      } else if (data && data[0]) {
        const insertedMessage = data[0] as Message;

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            ...insertedMessage,
            timestamp: new Date(insertedMessage.timestamp).getTime(),
          },
        ]);

        setNewMessage('');
      }
    }
  };

  // Update status
  const updateStatus = async (status: string) => {
    try {
      // Update the status in the database
      const { data, error } = await supabase
        .from('messages')
        .upsert({
          date_id: dateId, 
          status,
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating status:', error);
      } else {
        setCurrentStatus(status);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Messaging for Your Date
      </h1>

      <div className="status-buttons space-x-3 mb-5 flex justify-center">
        <button 
          className="p-2 bg-[#cc0000] text-white rounded text-xs"
          onClick={() => updateStatus("I'm on my way")}
        >
          I'm on my way
        </button>
        <button 
          className="p-2 bg-[#cc0000] text-white rounded text-xs"
          onClick={() => updateStatus("I'm here")}
        >
          I'm here
        </button>
        <button 
          className="p-2 bg-[#cc0000] text-white rounded text-xs"
          onClick={() => updateStatus("We're both here")}
        >
          We're both here
        </button>
      </div>

      {currentStatus && (
        <div className="mt-4 text-center">
          <p>Current Status: {currentStatus}</p>
        </div>
      )}

      <div className="message-area flex flex-col h-[400px] overflow-y-auto mb-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 p-2 rounded max-w-[75%] ${
              message.sender === 'user' 
                ? 'bg-red-500 text-white ml-auto'  // User's message on the right
                : 'bg-white text-red-500'          // Other person's message on the left
            }`}
          >
            <p>{message.content}</p>
            <p className="text-sm text-gray-500">{new Date(message.timestamp).toLocaleString()}</p>
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
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-[#cc0000] text-white rounded"
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