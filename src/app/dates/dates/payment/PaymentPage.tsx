'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Updated map of venues to their Stripe payment links
const VENUE_PAYMENT_LINKS: Record<string, string> = {
  'Boston Celtics': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os', // Using Bruins price for example
  'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Hockey': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
  'BC Basketball': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
  'Boston Commons': 'https://buy.stripe.com/eVaaH31ao2FDbKM3ck',
  'Kured': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'Private Helicopter Ride': 'https://buy.stripe.com/14k2ax7yM0xv6qs8wz',
  'Barcelona Wine Bar': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Capo': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Locco Fenway': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'F1 Arcade': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Lucca North End': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Lolita Back Bay': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Blue Ribbon Sushi': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Joes on Newbury': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Snowport @Seaport': 'https://buy.stripe.com/aEUaH39GUcgd6qs009'
} as const;

interface DateType {
  id: number;
  name: string;
  price: number;
  venue: string;
  date: string;
  time: string;
}

interface PaymentPageProps {
  selectedDate: DateType;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PaymentPage({ selectedDate, onConfirm, onCancel }: PaymentPageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      setError('');

      // Get the payment link for the venue
      const paymentLink = VENUE_PAYMENT_LINKS[selectedDate.venue];
      
      if (!paymentLink) {
        console.error(`Venue not found: ${selectedDate.venue}`);
        console.error('Available venues:', Object.keys(VENUE_PAYMENT_LINKS));
        throw new Error(`No payment link found for venue: ${selectedDate.venue}`);
      }

      // Store the date ID in localStorage before redirecting
      localStorage.setItem('pendingDateId', selectedDate.id.toString());
      localStorage.setItem('paymentReturnTime', new Date().toISOString());

      // Redirect to the Stripe payment link with return URL
      const returnUrl = `${window.location.origin}/payment-success`;
      const finalPaymentLink = `${paymentLink}?redirect=${encodeURIComponent(returnUrl)}`;
      window.location.href = finalPaymentLink;

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Confirm Your Date
      </h2>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-[#cc0000] text-xl font-medium mb-2">
          Date Details
        </h3>
        <p className="mb-1">
          <strong>With:</strong> {selectedDate.name}
        </p>
        <p className="mb-1">
          <strong>When:</strong> {selectedDate.date}, {selectedDate.time}
        </p>
        <p className="mb-1">
          <strong>Where:</strong> {selectedDate.venue}
        </p>
        <p className="text-xl font-medium mt-3">
          Total: ${selectedDate.price}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      <button 
        onClick={handleCheckout}
        disabled={isProcessing}
        className={`w-full p-3 bg-[#cc0000] text-white rounded-full font-medium transition-colors
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#aa0000]'}`}
      >
        {isProcessing ? 'Processing...' : `Pay $${selectedDate.price}`}
      </button>

      <button 
        className="w-full p-3 mt-4 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={onCancel}
        disabled={isProcessing}
      >
        Cancel
      </button>
    </div>
  );
}