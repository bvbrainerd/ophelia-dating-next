import { loadStripe } from '@stripe/stripe-js';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

// Initialize Stripe with better error handling
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  .then(stripe => {
    if (!stripe) {
      console.error('Failed to initialize Stripe - stripe object is null');
      throw new Error('Failed to initialize Stripe');
    }
    console.log('Stripe initialized successfully');
    return stripe;
  })
  .catch(error => {
    console.error('Stripe initialization error:', error);
    throw error;
  });

// Export a function to check if Stripe is ready
export const isStripeReady = async () => {
  try {
    const stripe = await stripePromise;
    return !!stripe;
  } catch (error) {
    console.error('Stripe ready check failed:', error);
    return false;
  }
}; 