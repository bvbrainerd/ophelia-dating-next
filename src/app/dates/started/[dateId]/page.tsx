'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MessageCircle, Clock, CheckCircle, MapPin, Target } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import Map from '@/components/Map'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/supabase/client'

interface DateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: string;
  latitude: number;
  longitude: number;
  venue_id?: string;
  sender?: {
    id: string;
    first_name: string;
    avatar_url?: string;
    age?: number;
  };
}

interface MapMarker {
  coordinates: [number, number];
  title: string;
}

export default function DateStartedPage() {
  const params = useParams();
  const router = useRouter();
  const [dateRequest, setDateRequest] = useState<DateRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [showDare, setShowDare] = useState(false);
  const [currentDare, setCurrentDare] = useState<string | null>(null);

  useEffect(() => {
    const fetchDateDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Get current date request using params.dateId
        const { data: dateData, error: dateError } = await supabase
          .from('date_requests')
          .select(`
            id,
            venue,
            proposed_time,
            status,
            latitude,
            longitude,
            venue_id,
            sender:profiles!date_requests_sender_id_fkey (
              id,
              first_name,
              avatar_url,
              age
            )
          `)
          .eq('id', params.dateId)
          .single();

        if (dateError) throw dateError;
        
        if (!dateData) {
          toast.error('Date not found');
          router.push('/dates/upcoming');
          return;
        }

        // Transform the data to match the DateRequest interface
        const transformedDate: DateRequest = {
          id: dateData.id,
          venue: dateData.venue,
          proposed_time: dateData.proposed_time,
          status: dateData.status,
          latitude: dateData.latitude,
          longitude: dateData.longitude,
          venue_id: dateData.venue_id,
          sender: dateData.sender[0]
        };
        
        setDateRequest(transformedDate);

        // Start elapsed time counter
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
        const timeInterval = setInterval(updateTime, 1000);

        // Start dare check interval
        const dareInterval = setInterval(() => {
          const randomChance = Math.random();
          if (randomChance < 0.1) { // 10% chance every interval
            setShowDare(true);
            toast.message("You've received a date dare!", {
              description: "Complete it to earn extra points!",
              action: {
                label: 'View Dare',
                onClick: () => router.push(`/challenges/${dateData.id}`)
              }
            });
          }
        }, 5 * 60 * 1000); // Check every 5 minutes

        return () => {
          clearInterval(timeInterval);
          clearInterval(dareInterval);
        };
      } catch (error) {
        console.error('Error fetching date details:', error);
        toast.error('Failed to load date details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDateDetails();
  }, [params.dateId, router]);

  const handleEndDate = async () => {
    try {
      if (!dateRequest) return;

      const { error } = await supabase
        .from('date_requests')
        .update({ status: 'completed' })
        .eq('id', dateRequest.id);

      if (error) throw error;
      
      // Route to post-payment page
      router.push(`/dates/payment/${dateRequest.id}`);
    } catch (error) {
      console.error('Error ending date:', error);
      toast.error('Failed to end date. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dateRequest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Date Not Found</h1>
        <p className="text-gray-600 mb-4">This date request doesn't exist or has been cancelled.</p>
        <Button onClick={() => router.push('/dates/upcoming')}>
          View Upcoming Dates
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              {dateRequest.sender?.first_name?.[0] || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{dateRequest.sender?.first_name || 'Your Date'}</h2>
              <p className="text-sm text-gray-500">Age: {dateRequest.sender?.age || 'N/A'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Elapsed Time</p>
            <p className="text-xl font-mono">{elapsedTime}</p>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden h-64 relative">
          <Map
            markers={[{
              coordinates: [dateRequest.longitude, dateRequest.latitude],
              title: dateRequest.venue
            }]}
            center={[dateRequest.longitude, dateRequest.latitude]}
            zoom={15}
          />
        </div>

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/messages/${dateRequest.id}`)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleEndDate}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            End Date
          </Button>
        </div>

        {showDare && currentDare && (
          <div className="bg-primary/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Current Dare</h3>
            <p>{currentDare}</p>
            <Button
              variant="link"
              className="mt-2 p-0"
              onClick={() => router.push(`/challenges/${dateRequest.id}`)}
            >
              Complete Dare →
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
} 