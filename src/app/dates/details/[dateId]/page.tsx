'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Image from 'next/image';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import QRCode from 'react-qr-code';
import { formatDate } from '@/lib/utils';
import Map from '@/components/Map';
import { getVenueCoordinates } from '@/utils/venues';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

interface DateDetails {
  id: string;
  venue: string;
  proposed_time: string;
  sender: {
    id: string;
    first_name: string;
    age: number;
    avatar_url: string | null;
  };
  payment_status?: string;
  payment_amount?: number;
}

export default function DateDetailsPage({ params }: { params: { dateId: string } }) {
  const router = useRouter();
  const [dateDetails, setDateDetails] = useState<DateDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDateDetails = async () => {
      try {
        const { data: dateData, error } = await supabase
          .from('date_requests')
          .select(`
            id,
            venue,
            proposed_time,
            payment_status,
            payment_amount,
            sender:profiles!date_requests_sender_id_fkey (
              id,
              first_name,
              age,
              avatar_url
            )
          `)
          .eq('id', params.dateId)
          .single();

        if (error) throw error;

        if (!dateData.sender) {
          throw new Error('Invalid sender data');
        }

        // Handle both array and single object responses
        const senderData = Array.isArray(dateData.sender) ? dateData.sender[0] : dateData.sender;

        if (!senderData || !senderData.id || !senderData.first_name) {
          throw new Error('Invalid sender data structure');
        }

        // Transform the data to match the DateDetails interface
        const transformedData: DateDetails = {
          id: dateData.id,
          venue: dateData.venue,
          proposed_time: dateData.proposed_time,
          payment_status: dateData.payment_status,
          payment_amount: dateData.payment_amount,
          sender: {
            id: senderData.id,
            first_name: senderData.first_name,
            age: senderData.age,
            avatar_url: senderData.avatar_url
          }
        };

        setDateDetails(transformedData);
      } catch (error) {
        console.error('Error fetching date details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDateDetails();
  }, [params.dateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header variant="default" />
        <div className="flex justify-center items-center min-h-[calc(100vh-160px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!dateDetails) {
    return (
      <div className="min-h-screen bg-white">
        <Header variant="default" />
        <div className="flex justify-center items-center min-h-[calc(100vh-160px)]">
          Date not found
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleUploadReceipt = () => {
    router.push(`/dates/post-date-payment?dateId=${dateDetails.id}`);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <Header variant="default" />
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#cc0000] hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-center flex-grow mr-6">Date Details</h1>
        </div>

        <Card className="p-6 rounded-2xl">
          {/* Profile Section */}
          <div className="flex items-center mb-8">
            <div className="relative w-20 h-20 rounded-full overflow-hidden mr-4">
              <Image
                src={dateDetails.sender.avatar_url || '/images/default-avatar.png'}
                alt={dateDetails.sender.first_name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                {dateDetails.sender.first_name}, {dateDetails.sender.age}
              </h2>
            </div>
          </div>

          {/* Date Info Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-6">Date Details</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Date & Time</div>
                  <div className="font-medium">{formatDate(dateDetails.proposed_time)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium">{dateDetails.venue}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          {dateDetails.venue && (
            <div className="mb-8">
              <div className="relative h-48 rounded-xl overflow-hidden shadow-lg">
                <Map 
                  markers={[{
                    coordinates: getVenueCoordinates(dateDetails.venue),
                    title: dateDetails.venue
                  }]}
                  center={getVenueCoordinates(dateDetails.venue)}
                  zoom={15}
                />
              </div>
            </div>
          )}

          {/* Payment Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Payment Details</h3>
              <button
                onClick={handleUploadReceipt}
                className="text-[#cc0000] font-medium hover:opacity-80 transition-opacity"
              >
                Upload Receipt
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              {dateDetails.payment_status === 'paid' ? (
                <>
                  <div className="flex justify-between mb-3">
                    <div className="text-gray-600">Date booking</div>
                    <div>${dateDetails.payment_amount?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div className="flex justify-between mb-3">
                    <div className="text-gray-600">Service fee</div>
                    <div>$3.50</div>
                  </div>
                  <div className="flex justify-between mb-3">
                    <div className="text-gray-600">Taxes</div>
                    <div>$2.85</div>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200 font-semibold">
                    <div>Total</div>
                    <div>${((dateDetails.payment_amount || 0) + 6.35).toFixed(2)}</div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Please upload your receipt to see payment details
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUploadReceipt}
              className="w-full py-3 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
            >
              Upload Receipt & Pay
            </button>
            <button
              onClick={() => {/* Add to calendar logic */}}
              className="w-full py-3 border-2 border-[#cc0000] text-[#cc0000] rounded-full font-medium hover:bg-red-50 transition-colors"
            >
              Add to Calendar
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            Cancellation available up to 24 hours before the date.
          </p>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
} 