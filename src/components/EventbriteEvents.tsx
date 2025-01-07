'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Event {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description?: {
    text: string;
    html: string;
  };
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  url: string;
  venue: {
    name: string;
    address: {
      address_1: string;
      city: string;
      region: string;
      postal_code: string;
      country: string;
    };
  };
  logo?: {
    url: string;
  };
  ticket_availability: {
    has_available_tickets: boolean;
    minimum_ticket_price?: {
      value: number;
      currency: string;
    };
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
          cache: 'no-store'
        });

        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          // If we got organization data in the error response, log it
          if (data.organizations) {
            console.log('Available organizations:', data.organizations);
          }
          throw new Error(data.error || `Failed to fetch events: ${response.status}`);
        }

        if (!data.events) {
          throw new Error('No events data received');
        }

        console.log('Successfully fetched events:', data.events.length);
        setEvents(data.events);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <div className="text-center py-8">Loading events...</div>;
  if (error) return <div className="text-center text-red-600 py-8">Error: {error}</div>;
  if (events.length === 0) return <div className="text-center py-8">No events found</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <div key={event.id} className="border rounded-lg overflow-hidden shadow-lg">
          {event.logo?.url && (
            <div className="relative h-48">
              <Image
                src={event.logo.url}
                alt={event.name.text}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{event.name.text}</h3>
            {event.venue?.name && (
              <p className="text-gray-600 mb-2">{event.venue.name}</p>
            )}
            <p className="text-gray-500 text-sm mb-4">
              {new Date(event.start.local).toLocaleDateString()} at{' '}
              {new Date(event.start.local).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {event.ticket_availability?.minimum_ticket_price && (
              <p className="text-gray-600 mb-4">
                From {event.ticket_availability.minimum_ticket_price.currency}{' '}
                {event.ticket_availability.minimum_ticket_price.value}
              </p>
            )}
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