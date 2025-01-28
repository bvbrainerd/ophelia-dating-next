'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabase/client';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { getVenueForArchetype } from '@/utils/venues';

interface ValentineRequest {
  id: string;
  sender_id: string;
  recipient_email: string;
  recipient_name: string;
  is_anonymous: boolean;
  status: string;
  sender_archetype: string;
  recipient_archetype?: string;
  sender: {
    first_name: string;
    last_name: string;
    dater_archetype: string;
  };
}

export default function AdminValentineMatchesPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ValentineRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAndFetchRequests = async () => {
      try {
        // Check if user is admin
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (!profile?.is_admin) {
          router.push('/dashboard');
          return;
        }

        // Fetch pending valentine requests
        const { data: requests, error: requestsError } = await supabase
          .from('valentine_requests')
          .select(`
            *,
            sender:profiles!valentine_requests_sender_id_fkey (
              first_name,
              last_name,
              dater_archetype
            )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;
        setRequests(requests || []);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load requests');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndFetchRequests();
  }, [router]);

  const handleCurateDate = async (requestId: string, recipientArchetype: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Get recommended venues based on archetypes
      const senderVenues = getVenueForArchetype(request.sender.dater_archetype);
      const recipientVenues = getVenueForArchetype(recipientArchetype);

      // Find common venues between sender and recipient
      const commonVenues = senderVenues.filter(venue => recipientVenues.includes(venue));
      
      // Select a random venue from common venues
      const selectedVenue = commonVenues[Math.floor(Math.random() * commonVenues.length)];

      // Generate a date/time for next week at 7 PM
      const proposedDate = new Date();
      proposedDate.setDate(proposedDate.getDate() + 7);
      proposedDate.setHours(19, 0, 0, 0);

      // Update the valentine request
      const { error: updateError } = await supabase
        .from('valentine_requests')
        .update({
          status: 'curated',
          curated_venue: selectedVenue,
          curated_time: proposedDate.toISOString(),
          curated_by: (await supabase.auth.getSession()).data.session?.user.id,
          curated_at: new Date().toISOString(),
          recipient_archetype: recipientArchetype
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Send email notification about the curated date
      const emailData = {
        templateId: process.env.SENDGRID_DATE_NOTIFICATION_TEMPLATE_ID,
        to: request.recipient_email,
        dynamicTemplateData: {
          senderName: request.is_anonymous ? 'Someone special' : `${request.sender.first_name} ${request.sender.last_name}`,
          recipientName: request.recipient_name,
          venue: selectedVenue,
          dateTime: proposedDate.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          }),
          valentineLink: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/valentine/${request.id}`
        }
      };

      await fetch('/api/send-valentine-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      // Update local state
      setRequests(prev => prev.filter(r => r.id !== requestId));

    } catch (error) {
      console.error('Error curating date:', error);
      setError('Failed to curate date');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="default" />
        
        <h1 className="text-2xl font-bold text-[#BA2525] mb-6">Valentine Matches to Curate</h1>

        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {request.sender.first_name} → {request.recipient_name}
                  </h2>
                  <p className="text-gray-600">
                    Sender Archetype: {request.sender.dater_archetype}
                  </p>
                </div>

                <div className="flex gap-4">
                  <select
                    className="flex-1 p-2 border rounded"
                    onChange={(e) => handleCurateDate(request.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select Recipient Archetype</option>
                    <option value="hopelessRomantic">Hopeless Romantic</option>
                    <option value="cautiousDater">Cautious Dater</option>
                    <option value="serialDater">Serial Dater</option>
                    <option value="commitmentSeeker">Commitment Seeker</option>
                    <option value="friendWithBenefits">Friend with Benefits</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}

          {requests.length === 0 && (
            <p className="text-center text-gray-600">No pending valentine matches to curate</p>
          )}
        </div>
      </div>
    </div>
  );
} 