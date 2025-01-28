'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabase/client';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';

interface ValentineRequest {
  id: string;
  sender_id: string;
  recipient_email: string;
  recipient_name: string;
  is_anonymous: boolean;
  status: string;
  curated_venue?: string;
  curated_time?: string;
  sender: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

export default function ValentineResponsePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [request, setRequest] = useState<ValentineRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkUserAndFetchRequest = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Store the valentine ID in local storage for after login
          localStorage.setItem('pendingValentineId', params.id);
          router.push(`/auth/signup?valentine=${params.id}`);
          return;
        }

        // Get user's email
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);

        // Fetch valentine request
        const { data: request, error: requestError } = await supabase
          .from('valentine_requests')
          .select(`
            *,
            sender:profiles!valentine_requests_sender_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('id', params.id)
          .single();

        if (requestError) throw requestError;

        // Verify this valentine is for the current user
        if (request.recipient_email.toLowerCase() !== user?.email?.toLowerCase()) {
          throw new Error('This valentine was sent to a different email address');
        }

        setRequest(request);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load valentine');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndFetchRequest();
  }, [params.id, router]);

  const handleResponse = async (accept: boolean) => {
    try {
      if (!request) return;

      const { error: updateError } = await supabase
        .from('valentine_requests')
        .update({
          status: accept ? 'accepted' : 'declined',
          recipient_id: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update valentine');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto p-5">
          <Header variant="default" />
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold text-[#BA2525] mb-4">Oops!</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-[#BA2525] text-white rounded-full"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto p-5">
          <Header variant="default" />
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold text-[#BA2525] mb-4">Valentine Not Found</h1>
            <p className="text-gray-600 mb-4">This valentine request doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-[#BA2525] text-white rounded-full"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="default" />
        
        <div className="mt-8 text-center">
          <h1 className="text-4xl font-bold text-[#BA2525] mb-4">You've Received a Valentine!</h1>
          
          <Card className="p-8 mt-8">
            <div className="space-y-6">
              <p className="text-xl text-gray-800">
                {request.is_anonymous ? 'Someone special' : request.sender.first_name} has sent you a valentine!
              </p>

              {request.curated_venue && request.curated_time ? (
                <div className="bg-red-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold text-[#BA2525] mb-4">Your Curated Date</h2>
                  <p className="text-gray-800 mb-2">
                    <span className="font-medium">Venue:</span> {request.curated_venue}
                  </p>
                  <p className="text-gray-800">
                    <span className="font-medium">Time:</span> {new Date(request.curated_time).toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">
                  Our matchmakers are working on curating the perfect date for you both!
                </p>
              )}

              {request.status === 'pending' && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleResponse(true)}
                    className="px-8 py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#a02020] transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleResponse(false)}
                    className="px-8 py-2 border-2 border-[#BA2525] text-[#BA2525] rounded-full hover:bg-red-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}

              {request.status === 'accepted' && (
                <p className="text-green-600 font-medium">You've accepted this valentine!</p>
              )}

              {request.status === 'declined' && (
                <p className="text-gray-600 font-medium">You've declined this valentine.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 