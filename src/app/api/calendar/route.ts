import { NextResponse } from 'next/server';

interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
}

export async function POST(request: Request) {
  try {
    const event: CalendarEvent = await request.json();
    
    // Format date for calendar
    const formatDate = (date: string) => {
      return new Date(date).toISOString().replace(/-|:|\.\d+/g, '');
    };

    // Generate Google Calendar link
    const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&dates=${formatDate(event.startTime)}/${formatDate(event.endTime)}`;

    // Generate iCal/Apple Calendar link
    // Note: This generates a data URI that can be used to download a .ics file
    const iCalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(event.startTime)}`,
      `DTEND:${formatDate(event.endTime)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const iCalLink = `data:text/calendar;charset=utf8,${encodeURIComponent(iCalContent)}`;

    return NextResponse.json({
      googleCalendarLink,
      iCalLink
    });
  } catch (error) {
    console.error('Error generating calendar links:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar links' },
      { status: 500 }
    );
  }
} 