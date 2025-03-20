import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { TicketVendorService, TicketDetails } from '@/services/TicketVendorService';
import { supabase } from '@/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

interface TicketViewProps {
  date: {
    id: string;
    venue: string;
    proposed_time: string;
    otherPerson: {
      first_name: string;
      age: number;
      avatar_url: string | null;
    };
  };
}

const TicketView: React.FC<TicketViewProps> = ({ date }) => {
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        let details: TicketDetails | null = null;

        try {
          // Try to get ticket from date_tickets table with proper headers
          const { data: ticketData, error: ticketError } = await supabase
            .from('date_tickets')
            .select('vendor_ticket_id, vendor_name, ticket_details')
            .eq('date_id', date.id)
            .maybeSingle();

          if (ticketError) {
            console.log('Database error:', ticketError);
            // Continue to vendor service
          } else if (ticketData?.ticket_details) {
            details = ticketData.ticket_details as TicketDetails;
          }
        } catch (dbError) {
          console.log('Database error:', dbError);
          // Continue to vendor service
        }

        // If no ticket found in database or error occurred, try vendor service
        if (!details) {
          const ticketService = TicketVendorService.getInstance();
          details = await ticketService.getTicketDetailsForDate(date.id);
          
          // Only try to store if we have details
          if (details) {
            try {
              await supabase
                .from('date_tickets')
                .upsert({
                  date_id: date.id,
                  vendor_ticket_id: details.vendorTicketId,
                  vendor_name: details.vendorName,
                  ticket_details: details
                })
                .throwOnError();
            } catch (insertError) {
              console.log('Failed to store ticket:', insertError);
              // Continue since we already have the details
            }
          }
        }

        setTicketDetails(details);
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchTicketDetails:', err);
        setError('Unable to load ticket details at this time');
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [date.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-black">
            {ticketDetails?.venueName || date.venue}
          </h3>
          <p className="text-gray-600">
            {ticketDetails?.eventDate ? formatDate(ticketDetails.eventDate) : formatDate(date.proposed_time)}
          </p>
          {ticketDetails?.eventName && (
            <p className="text-sm text-gray-500 mt-1">{ticketDetails.eventName}</p>
          )}
        </div>
        <div className="relative w-12 h-12">
          <Image
            src={date.otherPerson.avatar_url || '/images/default-avatar.png'}
            alt={`${date.otherPerson.first_name}'s profile`}
            fill
            className="rounded-full object-cover"
          />
        </div>
      </div>

      <div className="border-t border-b border-gray-200 py-4 my-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Date With</span>
          <span className="font-medium">{date.otherPerson.first_name}, {date.otherPerson.age}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Ticket ID</span>
          <span className="font-medium">
            {ticketDetails?.vendorTicketId || date.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        {ticketDetails?.seatInfo && (
          <div className="flex justify-between mt-2">
            <span className="text-gray-600">Seat Info</span>
            <span className="font-medium">{ticketDetails.seatInfo}</span>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-6">
        <QRCodeSVG
          value={ticketDetails?.qrCodeData || `https://opheliadating.io/tickets/${date.id}`}
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>

      <div className="mt-6 space-y-3">
        {ticketDetails?.ticketUrl && (
          <a
            href={ticketDetails.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#cc0000] text-white px-6 py-2 rounded-full hover:bg-[#aa0000] transition-colors"
          >
            View Original Ticket
          </a>
        )}
        <button 
          onClick={() => window.open(`/api/tickets/${date.id}/download`, '_blank')}
          className="w-full bg-[#cc0000] text-white px-6 py-2 rounded-full hover:bg-[#aa0000] transition-colors"
        >
          Add to Apple Wallet
        </button>
      </div>

      {ticketDetails?.price && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Ticket Price: {ticketDetails.price} {ticketDetails.currency}
        </div>
      )}
    </div>
  );
};

export default TicketView; 