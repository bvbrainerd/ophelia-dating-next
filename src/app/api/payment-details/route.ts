export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia'
});

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return NextResponse.json({
            paymentId: session.payment_intent,
            amountPaid: session.amount_total ? session.amount_total / 100 : null,
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        return NextResponse.json({ error: 'Error fetching payment details' }, { status: 500 });
    }
}
    