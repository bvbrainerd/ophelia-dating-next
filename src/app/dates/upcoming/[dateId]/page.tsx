'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { MessageCircle, Clock, CheckCircle, MapPin, ArrowLeft, Calendar, CreditCard } from 'lucide-react';
import Map from '@/components/Map';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface DateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: string;
  payment_status?: string;
  payment_amount?: number;
  sender: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
    bio?: string;
  };
  latitude: number | null;
  longitude: number | null;
}

export default function DateRequestDetails() {
  const params = useParams();
  const router = useRouter();
  const [dateRequest, setDateRequest] = useState<DateRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [dateStarted, setDateStarted] = useState(false);

  useEffect(() => {
    const fetchDateRequestDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('date_requests')
          .select(`
            *,
            sender:profiles!date_requests_sender_id_fkey (
              id,
              first_name,
              avatar_url,
              age,
              bio
            )
          `)
          .eq('id', params.dateId)
          .single();

        if (error) throw error;
        setDateRequest(data);
      } catch (error) {
        console.error('Error fetching date request details:', error);
        toast.error('Failed to load date details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDateRequestDetails();
  }, [params.dateId, router]);

  const handleStartDate = async () => {
    if (!dateRequest) return;
    setDateStarted(true);
    const startTime = new Date();
    
    const updateTime = () => {
      const now = new Date();
      const elapsed = now.getTime() - startTime.getTime();
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    setInterval(updateTime, 1000);
  };

  const handleEndDate = async () => {
    if (!dateRequest) return;

    try {
      const { error } = await supabase
        .from('date_requests')
        .update({ status: 'completed' })
        .eq('id', dateRequest.id);

      if (error) throw error;
      router.push(`/dates/upcoming/${dateRequest.id}/review`);
    } catch (error) {
      console.error('Error ending date:', error);
      toast.error('Failed to end date. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
      </div>
    );
  }

  if (!dateRequest) {
    return (
      <div className="min-h-screen bg-[#f5f7fa]">
        <Header variant="default" />
        <div className="max-w-4xl mx-auto p-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#cc0000] mb-4">Date Not Found</h1>
            <p className="text-gray-600 mb-6">This date request doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/daterequests')}
              className="bg-[#cc0000] text-white px-6 py-2 rounded-full hover:bg-[#a02020] transition-colors"
            >
              Back to Date Requests
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header variant="default" />
      
      <div className="container max-w-[600px] mx-auto p-5">
        <div className="header flex items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="text-2xl font-bold text-[#cc0000] hover:opacity-80"
          >
            ←
          </button>
          <div className="title text-xl font-semibold text-center flex-grow mr-8">
            Date Details
          </div>
        </div>

        <div className="card bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div 
            className="profile-section flex items-center mb-6 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push(`/profile/${dateRequest.sender.id}`)}
          >
            <div className="relative w-20 h-20">
              <Image
                src={dateRequest.sender.avatar_url || '/images/default-avatar.png'}
                alt={dateRequest.sender.first_name}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div className="ml-5">
              <h2 className="text-2xl font-semibold mb-1">
                {dateRequest.sender.first_name}, {dateRequest.sender.age}
              </h2>
              <p className="text-gray-600">
                {dateRequest.sender.bio?.split(' ').slice(0, 3).join(' ') || 'Ophelia Member'}
              </p>
            </div>
          </div>

          <div className="ticket-section bg-[#f8f9ff] rounded-xl p-5 mb-6">
            <div className="ticket-header flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Date Ticket</h3>
              <div className="ticket-qr">
                <QRCodeSVG
                  value={`https://opheliadating.io/tickets/${dateRequest.id}`}
                  size={60}
                  level="H"
                />
              </div>
            </div>

            <div className="ticket-details grid grid-cols-2 gap-4">
              <div className="detail-item">
                <div className="text-sm text-gray-500 mb-1">Date & Time</div>
                <div className="font-medium">{formatDate(dateRequest.proposed_time)}</div>
              </div>

              <div className="detail-item">
                <div className="text-sm text-gray-500 mb-1">Duration</div>
                <div className="font-medium">2 hours</div>
              </div>

              <div className="detail-item">
                <div className="text-sm text-gray-500 mb-1">Location</div>
                <div className="font-medium">{dateRequest.venue}</div>
              </div>

              {dateRequest.latitude && dateRequest.longitude && (
                <div className="detail-item col-span-2">
                  <div className="h-40 rounded-lg overflow-hidden mt-2">
                    <Map
                      markers={[{
                        coordinates: [dateRequest.longitude, dateRequest.latitude],
                        title: dateRequest.venue
                      }]}
                      center={[dateRequest.longitude, dateRequest.latitude]}
                      zoom={15}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="payment-section mb-6">
            <div className="payment-header flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Payment Details</h3>
              <button className="text-[#4169e1] font-medium text-sm">View Receipt</button>
            </div>

            <div className="payment-details border-t border-gray-100 pt-4">
              <div className="payment-row flex justify-between mb-3">
                <div className="text-gray-600">Date booking</div>
                <div>${dateRequest.payment_amount || '25.00'}</div>
              </div>

              <div className="payment-row flex justify-between mb-3">
                <div className="text-gray-600">Service fee</div>
                <div>$3.50</div>
              </div>

              <div className="payment-row flex justify-between mb-3">
                <div className="text-gray-600">Taxes</div>
                <div>$2.85</div>
              </div>

              <div className="payment-row total flex justify-between pt-3 border-t border-gray-100 font-semibold">
                <div>Total paid</div>
                <div>${((dateRequest.payment_amount || 25) + 6.35).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="action-buttons space-y-3">
            {!dateStarted ? (
              <button
                onClick={handleStartDate}
                className="w-full py-3.5 bg-[#cc0000] text-white rounded-full flex items-center justify-center gap-2 hover:bg-[#aa0000] transition-colors font-bold"
              >
                <Clock className="w-5 h-5" />
                Start Date
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/messages/${dateRequest.sender.id}`)}
                  className="w-full py-3.5 bg-[#cc0000] text-white rounded-full flex items-center justify-center gap-2 hover:bg-[#aa0000] transition-colors font-bold"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message {dateRequest.sender.first_name}
                </button>

                <button
                  onClick={handleEndDate}
                  className="w-full py-3.5 bg-[#cc0000] text-white rounded-full flex items-center justify-center gap-2 hover:bg-[#aa0000] transition-colors font-bold"
                >
                  <CheckCircle className="w-5 h-5" />
                  End Date & Review
                </button>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500 text-center mt-4">
            Cancellation available up to 24 hours before the date.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}