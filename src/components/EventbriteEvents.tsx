'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Event {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  url: string;
  venue: {
    name?: string;
    address?: string;
  };
  image?: string;
  ticket_availability?: {
    status?: string;
    remaining?: number;
  };
}

export default function EventbriteEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log('Fetching events...');
        const response = await fetch('/api/eventbrite', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch events');
        }

        const data = await response.json();
        console.log('Fetched data:', data);
        setEvents(data.events || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <div key={event.id} className="border rounded-lg overflow-hidden shadow-lg">
          {event.image && (
            <div className="relative h-48">
              <Image
                src={event.image}
                alt={event.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{event.name}</h3>
            <p className="text-gray-600 mb-2">{event.venue.name}</p>
            <p className="text-gray-500 text-sm mb-4">
              {new Date(event.start_date).toLocaleDateString()}
            </p>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#d1410c] text-white px-4 py-2 rounded-md inline-block hover:bg-[#b23209]"
            >
              Get Tickets
            </a>
          </div>
        </div>
      ))}
    </div>
  );
} 