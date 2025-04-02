// src/app/api/book-reservation/route.ts
import { NextResponse } from 'next/server';
import { bookReservation } from '@/lib/reservationCrawler';

export async function POST(request: Request) {

    try {
        // Expecting JSON data with restaurantQuery and reservationTime
        const { restaurantQuery, reservationTime } = await request.json();

        if (!restaurantQuery || !reservationTime) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Run the Playwright automation to book a reservation
        const { confirmationUrl } = await bookReservation(restaurantQuery, reservationTime);

        // Optionally: update your database with the reservation details here
        // e.g., await updateReservationStatus(dateRequestId, { confirmationUrl });
        
        return NextResponse.json({ success: true, confirmationUrl });
    } catch (error) {
        console.error('Error in book-reservation API:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}