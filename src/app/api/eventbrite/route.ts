import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY;
  
  try {
    console.log('Fetching organizations from Eventbrite...');
    
    // First, get the user's organizations
    const orgsResponse = await fetch('https://www.eventbriteapi.com/v3/users/me/organizations/', {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!orgsResponse.ok) {
      const errorText = await orgsResponse.text();
      console.error('Failed to fetch organizations:', errorText);
      return NextResponse.json(
        { error: `Failed to fetch organizations: ${errorText}` },
        { status: orgsResponse.status }
      );
    }
    
    const orgsData = await orgsResponse.json();
    console.log('Available organizations:', orgsData);
    
    if (!orgsData.organizations || orgsData.organizations.length === 0) {
      return NextResponse.json(
        { error: 'No organizations found for this user' },
        { status: 404 }
      );
    }
    
    // Use the first organization
    const organizationId = orgsData.organizations[0].id;
    
    // Now fetch events for this organization
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events?` + 
      new URLSearchParams({
        'status': 'live',
        'expand': 'venue,ticket_availability,logo',
        'order_by': 'start_asc',
        'time_filter': 'current_future'
      }), {
        headers: {
          'Authorization': `Bearer ${EVENTBRITE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Eventbrite API error:', errorText);
      return NextResponse.json(
        { error: `Failed to fetch events: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Successfully fetched events from Eventbrite');
    
    if (!data.events) {
      return NextResponse.json(
        { error: 'No events data in Eventbrite response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: data.events });
    
  } catch (error) {
    console.error('Error in Eventbrite API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}