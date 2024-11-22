'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

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

export default function SendDateRequestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<DateRequestForm>({
    venue: '',
    proposed_time: '',
    proposed_payment: null, // Initialize as null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };

    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchProfile();
    };

    checkAuthAndFetch();
  }, [params.id, router]);

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
    
    if (!validateDateTime(formData.proposed_time)) {
      setError('Please select a future date and time');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/send-date-request/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          proposed_time: new Date(formData.proposed_time).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send date request');
      }

      router.push('/matching');
    } catch (err) {
      console.error('Error sending date request:', err);
      setError(err instanceof Error ? err.message : 'Failed to send date request');
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
    <div className="max-w-md mx-auto p-5">
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
            src={profile.avatar_url || '/default-avatar.png'}
            alt={`${profile.first_name}'s avatar`}
            fill
            className="rounded-full object-cover"
            sizes="96px"
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Venue
          </label>
          <select
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
          <label className="block text-sm font-medium mb-1">
            Proposed Time
          </label>
          <input
            type="datetime-local"
            name="proposed_time"
            value={formData.proposed_time}
            onChange={handleChange}
            required
            min={new Date().toISOString().slice(0, 16)} // Set minimum to current time
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-[#cc0000] focus:border-[#cc0000]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Proposed Payment ($) - Optional
          </label>
          <input
            type="number"
            name="proposed_payment"
            value={formData.proposed_payment ?? ''} // Use nullish coalescing for empty field
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Enter amount (optional)"
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-[#cc0000] focus:border-[#cc0000]"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full p-2.5 bg-[#cc0000] text-white rounded-lg font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Sending...' : 'Send Date Request'}
        </button>
      </form>

      <button
        onClick={() => router.back()}
        className="w-full p-2.5 mt-4 border-2 border-[#cc0000] text-[#cc0000] rounded-lg font-medium hover:bg-[#ffeeee] transition-colors"
      >
        Back
      </button>
    </div>
  );
}