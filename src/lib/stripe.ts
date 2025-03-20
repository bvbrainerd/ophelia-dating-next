import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Stripe publishable key is missing');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Export a function to check if Stripe is ready
export const isStripeReady = async () => {
  try {
    const stripe = await getStripe();
    return !!stripe;
  } catch (error) {
    console.error('Stripe ready check failed:', error);
    return false;
  }
};

export { getStripe as stripePromise }; 