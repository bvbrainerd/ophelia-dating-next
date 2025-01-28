'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Check } from 'lucide-react';

const SUBSCRIPTION_PLANS = [
  {
    name: 'Monthly',
    price: '$19.99',
    period: 'month',
    features: [
      'Send unlimited date requests to anyone',
      'Priority profile visibility',
      'See who liked your profile',
      'Advanced matching algorithms',
      'Premium customer support',
      'Early access to new features'
    ],
    stripeLink: 'https://buy.stripe.com/3cscPb7yMa854ik5kk'
  },
  {
    name: 'Annual',
    price: '$149.99',
    period: 'year',
    savings: '$89.89',
    features: [
      'All Monthly features',
      'Two months free',
      'Exclusive events access',
      'Premium badge on profile',
      'Advanced analytics',
      'Priority support'
    ],
    stripeLink: 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
    recommended: true
  }
];

export default function SubscriptionPage() {
  const router = useRouter();

  const handleSubscribe = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Store subscription intent
      const { error: subscriptionError } = await supabase
        .from('subscription_intents')
        .insert({
          user_id: session.user.id,
          plan_name: plan.name,
          status: 'pending'
        });

      if (subscriptionError) throw subscriptionError;

      // Redirect to Stripe checkout
      window.location.href = plan.stripeLink;
    } catch (error) {
      console.error('Error initiating subscription:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-5 pb-24">
        <Header />

        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold text-[#BA2525] mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-gray-600">
            Unlock exclusive features and increase your chances of finding meaningful connections
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div 
              key={plan.name}
              className={`relative rounded-2xl p-6 ${
                plan.recommended 
                  ? 'border-2 border-[#BA2525] bg-[#ffeeee]' 
                  : 'border border-gray-200 bg-white'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#BA2525] text-white px-4 py-1 rounded-full text-sm">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-[#BA2525] mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                {plan.savings && (
                  <p className="text-green-600 text-sm mt-1">
                    Save {plan.savings} annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="text-[#BA2525] w-5 h-5 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                className={`w-full p-3 rounded-full font-medium transition-colors ${
                  plan.recommended
                    ? 'bg-[#BA2525] text-white hover:bg-[#a02020]'
                    : 'bg-white text-[#BA2525] border-2 border-[#BA2525] hover:bg-[#ffeeee]'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-sm text-gray-500">
          <p>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Cancel anytime.
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
} 