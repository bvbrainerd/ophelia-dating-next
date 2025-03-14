import { NextResponse } from 'next/server';
import { StripeService } from '@/services/StripeService';
import { supabase } from '@/supabase/client';

export async function POST(request: Request) {
  try {
    const { dateId, amount } = await request.json();

    // Validate request
    if (!dateId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create payment intent
    const stripeService = StripeService.getInstance();
    const clientSecret = await stripeService.createPaymentIntent(
      amount,
      dateId,
      session.user.id
    );

    return NextResponse.json({ clientSecret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 