'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';


interface Message {
  id: string;
  content: string;
  sender: 'user' | 'other';
  timestamp: number;
}

export default function DateMessaging() {
  const router = useRouter();
  const params = useParams();
  const { dateId } = params;
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: 'Hi there!', sender: 'other', timestamp: Date.now() },
    { id: '2', content: 'Hey, how are you?', sender: 'user', timestamp: Date.now() },
    { id: '3', content: 'I\'m doing great, thanks for asking!', sender: 'other', timestamp: Date.now() },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = async () => {
    if (newMessage.trim() !== '') {
      const newMessageItem: Message = {
        id: `${messages.length + 1}`,
        content: newMessage,
        sender: 'user',
        timestamp: Date.now(),
      };
      setMessages([...messages, newMessageItem]);
      setNewMessage('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Messaging for Your Date
      </h1>

      <div className="message-area flex flex-col h-[400px] overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 p-2 rounded max-w-[75%] ${
              message.sender === 'user'
                ? 'bg-[#cc0000] text-white self-end'
                : 'bg-gray-200 self-start'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="message-input flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow p-2 border rounded"
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} className="p-2 bg-[#cc0000] text-white rounded">
          Send
        </button>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className='w-full p-2.5 mt-5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors'
        type="button"
      >
        Back to Dashboard
      </button>
    </div>

    
  );
}