'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
} from '@stripe/react-stripe-js';
import { isStripeReady } from '@/lib/stripe';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function SetupConfirmation() {
  const stripe = useStripe();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Check if Stripe is properly initialized
        if (!stripe) {
          console.log('Waiting for Stripe to initialize...');
          const ready = await isStripeReady();
          if (!ready) {
            throw new Error('Failed to initialize Stripe');
          }
          return;
        }

        setIsProcessing(true);
        setError(null);

        // Get the setup intent client secret from the URL
        const clientSecret = new URLSearchParams(window.location.search).get(
          'setup_intent_client_secret'
        );

        if (!clientSecret) {
          throw new Error('No setup intent client secret found');
        }

        // Retrieve the setup intent status
        const { setupIntent, error: setupError } = await stripe.retrieveSetupIntent(clientSecret);
        
        console.log('Setup intent status:', setupIntent?.status);

        if (setupError) {
          if (setupError.type === 'validation_error') {
            throw new Error('Please select a valid payment method and try again.');
          } else {
            throw new Error(setupError.message || 'Failed to confirm setup');
          }
        }

        if (setupIntent?.status === 'succeeded') {
          console.log('Payment method setup successful');
          router.push('/dashboard/editprofile');
        } else {
          throw new Error(`Unexpected setup intent status: ${setupIntent?.status}`);
        }
      } catch (error: any) {
        console.error('Error handling redirect:', error);
        setError(error.message || 'An unexpected error occurred');
        setTimeout(() => router.push('/dashboard/editprofile'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleRedirect();
  }, [stripe, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg text-red-700 max-w-md text-center">
          <p className="font-medium mb-2">Payment Setup Failed</p>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-4">Redirecting you back...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525] mb-4"></div>
        <p className="text-gray-600">
          {isProcessing ? 'Confirming your payment method...' : 'Initializing...'}
        </p>
      </div>
    </div>
  );
}

export default function PaymentRedirect() {
  return (
    <Elements stripe={stripePromise}>
      <SetupConfirmation />
    </Elements>
  );
} 