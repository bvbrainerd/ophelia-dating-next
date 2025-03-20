import Stripe from 'stripe';
import { supabase } from '@/supabase/client';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (error?.type === 'StripeRateLimitError') {
        await wait(delay * Math.pow(2, i)); // Exponential backoff
        continue;
      }
      throw error; // Throw immediately for other types of errors
    }
  }
  
  throw lastError;
};

export class StripeService {
  private static instance: StripeService;
  private stripe: Stripe;
  private publishableKey: string;

  private constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia' as const,
      timeout: 20000, // Increase timeout to 20 seconds
    });
    this.publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
  }

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  public async createPaymentIntent(amount: number, dateId: string, userId: string): Promise<string> {
    return retryOperation(async () => {
      try {
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            dateId,
            userId
          }
        });

        // Update date request with payment intent ID
        await supabase
          .from('date_requests')
          .update({
            stripe_payment_intent_id: paymentIntent.id,
            payment_status: 'pending'
          })
          .eq('id', dateId);

        return paymentIntent.client_secret!;
      } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
      }
    });
  }

  public async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const { dateId } = paymentIntent.metadata;

      await supabase
        .from('date_requests')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', dateId);
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  public async createSetupIntent(userId: string): Promise<string> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        metadata: { userId }
      });
      return setupIntent.client_secret!;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw error;
    }
  }

  public async listPaymentMethods(userId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const { data: customer } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!customer?.stripe_customer_id) {
        return [];
      }

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customer.stripe_customer_id,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error listing payment methods:', error);
      throw error;
    }
  }

  public async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      console.error('Error detaching payment method:', error);
      throw error;
    }
  }

  public getPublishableKey(): string {
    return this.publishableKey;
  }
} 