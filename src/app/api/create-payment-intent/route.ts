import { NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia'
});

export async function POST(req: Request) {
  try {
    const { dateDetails } = await req.json();

    // Log the incoming request data
    console.log('Creating checkout session for:', dateDetails);

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_BASE_URL environment variable');
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(dateDetails.price * 100), // Convert to cents
            product_data: {
              name: `Date with ${dateDetails.name}`,
              description: `${dateDetails.date} at ${dateDetails.time}, ${dateDetails.venue}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    // Log the created session ID
    console.log('Created session:', session.id);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}