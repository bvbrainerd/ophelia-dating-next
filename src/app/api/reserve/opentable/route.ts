import { NextResponse } from 'next/server';
// import { chromium } from 'playwright';

// List of user agents to rotate through
// const userAgents = [
//   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
//   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
//   'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
// ];

// function getRandomUserAgent() {
//   return userAgents[Math.floor(Math.random() * userAgents.length)];
// }

export async function GET(request: Request) {
  // Mock response for now
  return NextResponse.json({ 
    success: true, 
    message: 'Reservation endpoint is temporarily disabled',
    url: 'https://www.opentable.com/'
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantName, reservationTime, reservationDate } = body;

    if (!restaurantName || !reservationTime || !reservationDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Return a mock success response
    return NextResponse.json({
      success: true,
      message: 'Reservation request received',
      details: {
        restaurant: restaurantName,
        time: reservationTime,
        date: reservationDate,
        url: `https://www.opentable.com/search?text=${encodeURIComponent(restaurantName)}`
      }
    });
  } catch (error) {
    console.error('Error in OpenTable reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process reservation request' },
      { status: 500 }
    );
  }
}