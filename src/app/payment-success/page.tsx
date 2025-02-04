// app/payment-success/page.tsx
'use client'

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/client';

export default function PaymentSuccessHandler() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const dateId = localStorage.getItem('pendingDateId');
        const returnTime = localStorage.getItem('paymentReturnTime');
        
        if (!dateId || !returnTime) {
          throw new Error('Missing payment information');
        }

        // Clear stored data
        localStorage.removeItem('pendingDateId');
        localStorage.removeItem('paymentReturnTime');

        // Update date request status with new enum values
        const { data: dateRequest, error: updateError } = await supabase
          .from('date_requests')
          .update({
            status: 'accepted',
            payment_status: 'paid',
            challenge_status: 'committed',
            updated_at: new Date().toISOString()
          })
          .eq('id', dateId)
          .select(`
            *,
            profiles!date_requests_receiver_id_fkey (
              id,
              first_name,
              email
            )
          `)
          .single();

        if (updateError) throw updateError;

        // Add debug logs
        console.log('Sending confirmation email with data:', {
          recipientEmail: dateRequest.profiles.email,
          recipientName: dateRequest.profiles.first_name,
          venueName: dateRequest.venue,
          dateTime: dateRequest.proposed_time,
          dateDetails: dateRequest.date_details
        });

        // Send confirmation email
        const emailResponse = await fetch('/api/send-date-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientEmail: dateRequest.profiles.email,
            recipientName: dateRequest.profiles.first_name,
            venueName: dateRequest.venue,
            dateTime: dateRequest.proposed_time,
            dateDetails: dateRequest.date_details
          }),
        });

        const emailResult = await emailResponse.json();
        console.log('Email send result:', emailResult);

        setIsProcessing(false);
        
        // Redirect after success
        setTimeout(() => {
          router.push('/dates/upcoming');
        }, 2000);

        // After successful payment, send confirmation emails to both users
        const sendDateConfirmationEmails = async (dateId: string) => {
          try {
            // Get date details from Supabase
            const { data: dateRequest, error: dateError } = await supabase
              .from('date_requests')
              .select(`
                *,
                sender:profiles!date_requests_sender_id_fkey(id, email, first_name, last_name),
                receiver:profiles!date_requests_receiver_id_fkey(id, email, first_name, last_name)
              `)
              .eq('id', dateId)
              .single();

            if (dateError) throw dateError;

            // Prepare date details for email template
            const dateDetails = {
              date_time: dateRequest.proposed_time,
              venue: dateRequest.venue,
              sender_name: `${dateRequest.sender.first_name} ${dateRequest.sender.last_name}`,
              receiver_name: `${dateRequest.receiver.first_name} ${dateRequest.receiver.last_name}`,
              venue_address: dateRequest.venue_address || '',
              payment_amount: dateRequest.proposed_payment || '',
              date_id: dateRequest.id
            };

            // Send confirmation emails to both participants
            await Promise.all([
              fetch('/api/send-date-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: dateRequest.sender.email,
                  dateDetails: {
                    ...dateDetails,
                    recipient_name: dateRequest.sender.first_name,
                    partner_name: dateRequest.receiver.first_name
                  }
                })
              }),
              fetch('/api/send-date-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: dateRequest.receiver.email,
                  dateDetails: {
                    ...dateDetails,
                    recipient_name: dateRequest.receiver.first_name,
                    partner_name: dateRequest.sender.first_name
                  }
                })
              })
            ]);

            console.log('Date confirmation emails sent successfully');
          } catch (error) {
            console.error('Error sending confirmation emails:', error);
          }
        };

        // Call the function to send emails after payment success
        await sendDateConfirmationEmails(dateId);

      } catch (err) {
        console.error('Error processing payment success:', err);
        setError(err instanceof Error ? err.message : 'Failed to confirm payment');
        setIsProcessing(false);
        
        setTimeout(() => {
          router.push('/daterequests');
        }, 3000);
      }
    };

    handlePaymentSuccess();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        {isProcessing ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000] mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your payment...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold mb-1">Error</p>
              <p>{error}</p>
            </div>
            <p className="text-gray-600 mt-4">Redirecting to date requests...</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-[#cc0000] font-bold text-3xl mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">Your date has been confirmed.</p>
            <p className="text-gray-500">Redirecting to upcoming dates...</p>
          </div>
        )}
      </div>
    </div>
  );
}