'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, useStripe } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { stripePromise } from '@/lib/stripe';

function SetupConfirmation() {
  const stripe = useStripe();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        if (!stripe) {
          // console.log('Waiting for Stripe to initialize...');
          return; // Will retry on next effect run when stripe is available
        }

        setIsProcessing(true);
        setError(null);

        const clientSecret = new URLSearchParams(window.location.search).get(
          'setup_intent_client_secret'
        );

        if (!clientSecret) {
          throw new Error('No setup intent client secret found');
        }

        const { setupIntent, error: setupError } = await stripe.retrieveSetupIntent(clientSecret);
        
        if (setupError) {
          throw new Error(setupError.message || 'Failed to confirm setup');
        }

        if (setupIntent?.status === 'succeeded') {
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
  const [isStripeLoading, setIsStripeLoading] = useState(true);
  const [stripeLoadError, setStripeLoadError] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        const stripe = await stripePromise();
        if (!stripe) {
          setStripeLoadError('Failed to initialize payment system');
        }
        setStripeInstance(stripe);
      } catch (error) {
        console.error('Stripe initialization error:', error);
        setStripeLoadError('Failed to initialize payment system');
      } finally {
        setIsStripeLoading(false);
      }
    };

    initStripe();
  }, []);

  if (stripeLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg text-red-700 max-w-md text-center">
          <p className="font-medium mb-2">Payment System Error</p>
          <p className="text-sm">{stripeLoadError}</p>
        </div>
      </div>
    );
  }

  if (isStripeLoading || !stripeInstance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise()}>
      <SetupConfirmation />
    </Elements>
  );
} 