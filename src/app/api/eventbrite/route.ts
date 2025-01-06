import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Use edge runtime for better performance

export async function GET() {
  const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY;
  
  if (!EVENTBRITE_API_KEY) {
    console.error('Eventbrite API key not found');
    return NextResponse.json(
      { error: 'Configuration error' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      'https://www.eventbriteapi.com/v3/organizations/256701476701/events?' + 
      new URLSearchParams({
        'status': 'live',
        'expand': 'venue,ticket_availability'
      }), {
        headers: {
          'Authorization': `Bearer ${EVENTBRITE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Eventbrite API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch events from Eventbrite' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ events: data.events });
    
  } catch (error) {
    console.error('Error in Eventbrite API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}