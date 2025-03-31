export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' as const
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Get user from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    console.log('Fetching payment methods for user:', user.id);

    // Get Stripe customer ID from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile?.stripe_customer_id) {
      console.log('No Stripe customer ID found for user');
      return NextResponse.json({ paymentMethods: [] });
    }

    console.log('Found Stripe customer ID:', profile.stripe_customer_id);

    // List payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card'
    });

    console.log('Successfully fetched payment methods');

    // Format payment methods
    const formattedMethods = paymentMethods.data.map(method => ({
      id: method.id,
      last4: method.card?.last4 || '',
      brand: method.card?.brand || '',
      expMonth: method.card?.exp_month || 0,
      expYear: method.card?.exp_year || 0
    }));

    return NextResponse.json({ paymentMethods: formattedMethods });
  } catch (error) {
    console.error('Error listing payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to list payment methods' },
      { status: 500 }
    );
  }
} 