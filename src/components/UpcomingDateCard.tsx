import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Coffee, Calendar, ArrowLeft, Ticket, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Map from '@/components/Map';
import TicketView from '@/components/TicketView';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

interface Profile {
  id: string;
  first_name: string;
  age: number;
  avatar_url: string | null;
}

interface DateRequest {
  id: string;
  sender_id: string;
  venue: string | null;
  proposed_time: string | null;
  created_at: string;
  sender?: Profile;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_amount?: number;
  coordinates?: [number, number];
}

interface UpcomingDateCardProps {
  date: DateRequest;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const UpcomingDateCard: React.FC<UpcomingDateCardProps> = ({ date }) => {
  const router = useRouter();
  const [showTicket, setShowTicket] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProfileClick = () => {
    if (date.sender?.id) {
      router.push(`/profile/${date.sender.id}`);
    }
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateId: date.id,
          amount: date.payment_amount || 50.00 // Default amount if not specified
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(clientSecret);
      if (error) {
        throw error;
      }

      // Payment successful
      toast.success('Payment successful!');
      router.refresh();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatUpcomingDate = (request: DateRequest) => {
    const dateTime = request.proposed_time || request.created_at;
    if (!dateTime) return 'Date not set';
    
    try {
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <Card className="p-6 mb-4 bg-white shadow-sm">
      {showTicket ? (
        <div>
          <button
            onClick={() => setShowTicket(false)}
            className="mb-4 text-[#BA2525] hover:underline flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Date Details
          </button>
          <TicketView
            date={{
              id: date.id,
              venue: date.venue || 'Venue TBD',
              proposed_time: date.proposed_time || date.created_at,
              otherPerson: {
                first_name: date.sender?.first_name || 'Date',
                age: date.sender?.age || 0,
                avatar_url: date.sender?.avatar_url || null
              }
            }}
          />
        </div>
      ) : (
        <>
          {/* Profile Section */}
          <div 
            onClick={handleProfileClick}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-6"
          >
            <div className="relative w-16 h-16">
              <Image
                src={date.sender?.avatar_url || '/images/default-avatar.png'}
                alt={`${date.sender?.first_name}'s profile`}
                fill
                className="rounded-full object-cover hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <span className="text-xl font-medium hover:text-[#BA2525] transition-colors">
                {date.sender?.first_name}, {date.sender?.age}
              </span>
            </div>
          </div>
          
          {/* Venue Section */}
          <div className="flex items-center gap-3 text-gray-700 mb-6">
            <Calendar className="w-6 h-6 text-[#cc0000]" />
            <div className="flex flex-col">
              <span className="text-lg font-medium">
                {date.venue || 'No venue selected'}
              </span>
              <span className="text-sm text-gray-500">
                {formatUpcomingDate(date)}
              </span>
            </div>
          </div>

          {/* Map Section */}
          {date.venue && date.coordinates && (
            <div className="relative h-48 rounded-lg overflow-hidden shadow-lg mb-6">
              <Map 
                markers={[{
                  coordinates: date.coordinates,
                  title: date.venue
                }]}
                center={date.coordinates}
                zoom={15}
              />
            </div>
          )}

          {/* Payment Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Payment Status</span>
            </div>
            <div>
              {date.payment_status === 'paid' ? (
                <span className="text-green-600 font-medium">Paid</span>
              ) : date.payment_status === 'pending' ? (
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="px-4 py-1 bg-[#BA2525] text-white rounded-full text-sm hover:bg-[#a01f1f] transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Pay Now'}
                </button>
              ) : (
                <span className="text-gray-600">{date.payment_status}</span>
              )}
            </div>
          </div>

          {/* View Ticket Button */}
          <button
            onClick={() => setShowTicket(true)}
            disabled={date.payment_status !== 'paid'}
            className="w-full p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a01f1f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Ticket className="w-5 h-5" />
            {date.payment_status === 'paid' ? 'View Ticket' : 'Pay to Access Ticket'}
          </button>
        </>
      )}
    </Card>
  );
};

export default UpcomingDateCard; 