import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/supabase/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    // Verify the event came from Stripe
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    /**
     * Handle different types of Stripe events
     */
    switch (event.type) {
      /**
       *   Case 1: Handling One-Time Payments
       * - This event fires when a customer successfully completes a one-time payment.
       * - We check if the session mode is "payment" and if the payment was successful.
       * - The payment is then recorded in Supabase.
       */

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("✅ Payment successful for session:", session.id);

        // Handle One-Time Payments (Store in Supabase)
        // TODO: Figure out if table is called payments or payment_intents or something else
        if (session.mode === "payment" && session.payment_status === "paid") {
          const { error } = await supabase
          .from('payments')
          .insert({
            user_id: session.client_reference_id,
            stripe_payment_id: session.payment_intent,
            amount_paid: session.amount_total ? session.amount_total / 100 : null, // Convert cents to dollars
            currency: session.currency,
            status: "completed",
            created_at: new Date(),
          });

          if (error) {
            console.error('❌ Error storing payment:', error);
            return NextResponse.json({ error: 'Failed to store payment' }, { status: 500 });
          }
        }

        // Handle Subscription Payments (Only if session contains a subscription ID)
        if (session.subscription) {
          // Update subscription intent status
          const { error: intentError } = await supabase
            .from('subscription_intents')
            .update({ 
              status: 'completed',
              stripe_session_id: session.id
            })
            .eq('user_id', session.client_reference_id);

          if (intentError) {
            console.error('Error updating subscription intent:', intentError);
            return NextResponse.json(
              { error: 'Failed to update subscription intent' },
              { status: 500 }
            );
          }

          // Create a new subscription record in Supabase
          const { error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: session.client_reference_id,
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              status: 'active',
              current_period_start: new Date(session.created * 1000),
              current_period_end: new Date(session.expires_at! * 1000)
            });

          if (subscriptionError) {
            console.error('Error creating user subscription:', subscriptionError);
            return NextResponse.json(
              { error: 'Failed to create user subscription' },
              { status: 500 }
            )
          };
        }

        break;
      }

      /**
       * Case 2: Handling Subscription Updates
       * - This event fires when a customer's subscription status changes (e.g., renewal, payment failure, etc.).
       * - We update the subscription record in Supabase accordingly.
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log("🔄 Subscription updated for customer:", subscription.customer);

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        break;
      }

      /**
         * ✅ Case 3: Handling Subscription Cancellations
         * - This event fires when a customer cancels their subscription.
         * - We update the Supabase record to reflect that the subscription is canceled.
         */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log("🚫 Subscription canceled for customer:", subscription.customer);
        
        const { error: deleteError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false
          })
          .eq('stripe_subscription_id', subscription.id);

        if (deleteError) {
          console.error('Error updating subscription:', deleteError);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        break;
      }

      /**
        * Default Case: Ignore Other Events
        * - If Stripe sends an event we don't need to handle, we log it.
        */
      default:
          console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a success response to Stripe
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 