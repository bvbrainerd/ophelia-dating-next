'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
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

interface DateRequestForm {
  venue: string;
  proposed_time: string;
  proposed_payment: number | null; // Changed to allow null
}

const VENUES = [
  'Boston Bruins',
  'Celtics',
  'BC Hockey',
  'BC Basketball',
  'Boston Commons',
  'Kured',
  'Museum of Fine Arts',
  'Private Helicopter Ride',
  'Barcelona Wine Bar',
  'Capo',
  'Locco Fenway',
  'F1 Arcade',
  'Lucca North End',
  'Lolita Back Bay',
  'Blue Ribbon Sushi',
  'Joes on Newbury',
  'Snowport @Seaport',
  'Boston Celtics Game',
  'The Clay Room',
];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 1; hour <= 12; hour++) {
    for (const minute of ['00', '30']) {
      // AM slots
      slots.push({
        display: `${hour}:${minute} AM`,
        value: `${hour === 12 ? '00' : hour.toString().padStart(2, '0')}:${minute}`
      });
    }
  }
  for (let hour = 1; hour <= 12; hour++) {
    for (const minute of ['00', '30']) {
      // PM slots
      slots.push({
        display: `${hour}:${minute} PM`,
        value: `${(hour === 12 ? 12 : hour + 12).toString().padStart(2, '0')}:${minute}`
      });
    }
  }
  return slots;
};

const DEFAULT_AVATAR = 'https://opheliadating.com/default-avatar.png'; // Replace with your actual default avatar URL

export default function SendDateRequestPage() {
  const params = useParams();
  const profileId = params.id as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<DateRequestForm>({
    venue: '',
    proposed_time: '',
    proposed_payment: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.replace('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (error) throw error;
        if (data) setProfile(data);
        
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [profileId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'proposed_payment' 
        ? value ? parseFloat(value) : null // Allow empty payment field
        : value,
    }));
  };

  const validateDateTime = (dateTime: string): boolean => {
    const proposedDate = new Date(dateTime);
    const now = new Date();
    return proposedDate > now;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        setError('Your session has expired. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      // First insert the date request
      const { data: dateRequest, error: insertError } = await supabase
        .from('date_requests')
        .insert({
          sender_id: session.user.id,
          receiver_id: profileId,
          venue: formData.venue,
          proposed_time: new Date(formData.proposed_time).toISOString(),
          proposed_payment: formData.proposed_payment,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send email notification with correct endpoint
      try {
        const response = await fetch(`/api/send-date-request/${profileId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            sender_id: session.user.id,
            venue: formData.venue,
            proposed_time: formData.proposed_time,
            proposed_payment: formData.proposed_payment,
            requestId: dateRequest.id
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send email notification');
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Continue with the flow even if email fails
      }

      router.push('/daterequests');
    } catch (error) {
      setError('Failed to send date request');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto p-5">
        <div className="text-center text-red-600">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-5 pb-24">
      <Header />
      <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Send Date Request
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6 flex items-center space-x-4">
        <div className="relative w-24 h-24">
          <Image
            src={profile.avatar_url || '/images/default-avatar.png'}
            alt={`${profile.first_name}'s avatar`}
            fill
            className="rounded-full object-cover"
            sizes="(max-width: 768px) 96px, 96px"
            priority
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-gray-600">Age: {profile.age}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" id="date-request-form">
        <div>
          <label htmlFor="venue" className="block text-sm font-medium mb-1">
            Venue
          </label>
          <select
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            required
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-[#cc0000] focus:border-[#cc0000]"
          >
            <option value="">Select a venue</option>
            {VENUES.map(venue => (
              <option key={venue} value={venue}>{venue}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="proposed_time" className="block text-sm font-medium mb-1">
            Proposed Time
          </label>
          <div className="flex space-x-2">
            <input
              id="proposed_date"
              type="date"
              name="proposed_date"
              value={formData.proposed_time.split('T')[0]}
              onChange={(e) => {
                const newDate = e.target.value;
                const currentTime = formData.proposed_time.split('T')[1] || '00:00';
                setFormData(prev => ({
                  ...prev,
                  proposed_time: `${newDate}T${currentTime}`
                }));
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-1/2 p-2.5 border border-gray-200 rounded-lg focus:ring-[#cc0000] focus:border-[#cc0000]"
              required
            />
            <div className="relative w-1/2">
              <input
                id="proposed_time"
                type="time"
                name="proposed_time"
                value={formData.proposed_time.split('T')[1] || ''}
                onChange={(e) => {
                  const currentDate = formData.proposed_time.split('T')[0] || new Date().toISOString().split('T')[0];
                  setFormData(prev => ({
                    ...prev,
                    proposed_time: `${currentDate}T${e.target.value}`
                  }));
                }}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-[#cc0000] focus:border-[#cc0000]"
                required
                step="1800"
              />
              <datalist id="time-suggestions">
                {generateTimeSlots().map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.display}
                  </option>
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="proposed_payment" className="block text-sm font-medium mb-1">
            Proposed Payment ($) - Optional
          </label>
          <input
            id="proposed_payment"
            type="number"
            name="proposed_payment"
            value={formData.proposed_payment ?? ''}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Enter amount (optional)"
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-[#cc0000] focus:border-[#cc0000]"
          />
        </div>

        <button
          id="submit-date-request"
          name="submit-date-request"
          type="submit"
          disabled={isSubmitting}
          className="w-full p-2.5 bg-[#cc0000] text-white rounded-lg font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Sending...' : 'Send Date Request'}
        </button>
      </form>
      <BottomNav />
    </div>
  );
}