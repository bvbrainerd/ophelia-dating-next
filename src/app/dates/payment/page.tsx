'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Updated map of venues to their Stripe payment links
const VENUE_PAYMENT_LINKS: Record<string, string> = {
  'Boston Celtics': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Lacrosse': 'https://buy.stripe.com/fZeg1nbP2gwtaGI14l',
  'BC Basketball': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
  'Boston Commons': 'https://buy.stripe.com/eVaaH31ao2FDbKM3ck',
  'Kured': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'Private Helicopter Ride': 'https://buy.stripe.com/14k2ax7yM0xv6qs8wz',
  'Barcelona Wine Bar': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg',
  'Capo': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg',
  'Locco Fenway': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg',
  'F1 Arcade': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg',
  'Lucca North End': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg',
  'Lolita Back Bay': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg',
  'Blue Ribbon Sushi': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg',
  'Joes on Newbury': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg',
  'Snowport @Seaport': 'https://buy.stripe.com/00gcPb6uIdkh5mofZg'
} as const;

interface DateType {
  id: number;
  name: string;
  price: number;
  venue: string;
  date: string;
  time: string;
}

// Update the props type
export default function PaymentPage() {
  const searchParams = useSearchParams();
  
  const selectedDate: DateType = {
    id: 0,
    name: '',
    price: 0,
    venue: '',
    date: '',
    time: ''
  };

  const onConfirm = () => { /* define onConfirm function */ };
  const onCancel = () => { /* define onCancel function */ };

  return <PaymentPageContent selectedDate={selectedDate} onConfirm={onConfirm} onCancel={onCancel} />;
}

// Add this interface above PaymentPageContent
interface PaymentPageContentProps {
  selectedDate: DateType;
  onConfirm: () => void;
  onCancel: () => void;
}

function PaymentPageContent({ selectedDate, onConfirm, onCancel }: PaymentPageContentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Cleanup function for localStorage on component unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('pendingDateId');
      localStorage.removeItem('paymentReturnTime');
    };
  }, []);

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      setError('');

      const paymentLink = VENUE_PAYMENT_LINKS[selectedDate.venue];

      if (!paymentLink) {
        throw new Error(`No payment link found for venue: ${selectedDate.venue}`);
      }

      // Store date information in localStorage
      const paymentInfo = {
        dateId: selectedDate.id,
        startTime: new Date().toISOString(),
        venue: selectedDate.venue,
        price: selectedDate.price
      };

      localStorage.setItem('paymentInfo', JSON.stringify(paymentInfo));

      // Construct return URL with date ID as query parameter
      const returnUrl = new URL(`${window.location.origin}/payment-success`);
      returnUrl.searchParams.set('dateId', selectedDate.id.toString());

      // Redirect to Stripe
      const finalPaymentLink = `${paymentLink}?redirect=${encodeURIComponent(returnUrl.toString())}`;
      window.location.href = finalPaymentLink;

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  if (!selectedDate) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
          Error
        </h2>
        <p className="text-gray-600">Date details are missing. Please go back and select a date.</p>
        <button
          onClick={() => router.back()}
          className="w-full py-4 px-6 bg-[#cc0000] text-white rounded-full font-medium mt-6"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Confirm Your Date
      </h2>

      <div className="bg-gray-50 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-[#cc0000] text-xl font-medium mb-4">
          Date Details
        </h3>
        <div className="space-y-3">
          <p className="flex justify-between">
            <span className="font-medium">With:</span>
            <span>{selectedDate.name}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-medium">When:</span>
            <span>{selectedDate.date}, {selectedDate.time}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-medium">Where:</span>
            <span>{selectedDate.venue}</span>
          </p>
          <div className="border-t border-gray-200 mt-4 pt-4">
            <p className="flex justify-between text-xl font-medium">
              <span>Total:</span>
              <span>${selectedDate.price}</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleCheckout}
          disabled={isProcessing}
          className={`w-full py-4 px-6 bg-[#cc0000] text-white rounded-full font-medium transition-colors
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#aa0000] active:bg-[#990000]'}
            focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:ring-offset-2`}
        >
          {isProcessing ? 'Processing...' : `Pay $${selectedDate.price}`}
        </button>

        <button
          onClick={onCancel}
          disabled={isProcessing}
          className={`w-full py-4 px-6 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium
            transition-colors hover:bg-[#ffeeee] active:bg-[#ffdddd]
            focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:ring-offset-2
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}