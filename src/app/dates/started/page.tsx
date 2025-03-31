'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/supabase/client'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { MessageCircle, Clock, CheckCircle, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import PenaltyDare from '@/components/PenaltyDare'

interface DateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: string;
  sender: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  };
  latitude: number | null;
  longitude: number | null;
}

export default function StartedDatesPage({
  params,
}: {
  params: { dateId: string }
}) {
  const router = useRouter();
  const [dateRequest, setDateRequest] = useState<DateRequest | null>(null);
  const [messages, setMessages] = useState<Array<{text: string, sent: boolean}>>([]);
  const [status, setStatus] = useState<'not_started' | 'on_way' | 'arrived' | 'meeting'>('not_started');
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [showDare, setShowDare] = useState(false);

  useEffect(() => {
    const fetchDateDetails = async () => {
      try {
        if (!params?.dateId) throw new Error('Date ID is required');

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
        
        // Transform the data to match the DateRequest interface
        const transformedDate: DateRequest = {
          id: dateData.id,
          venue: dateData.venue,
          proposed_time: dateData.proposed_time,
          status: dateData.status,
          latitude: dateData.latitude,
          longitude: dateData.longitude,
          sender: dateData.sender[0]
        };
        
        setDateRequest(transformedDate);

        // Start elapsed time counter
        const startTime = new Date()
        const updateTime = () => {
          const now = new Date()
          const elapsed = now.getTime() - startTime.getTime()
          const hours = Math.floor(elapsed / (1000 * 60 * 60))
          const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)
          setElapsedTime(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          )
        }
        const timeInterval = setInterval(updateTime, 1000)

        // Start dare check interval
        const dareInterval = setInterval(() => {
          const randomChance = Math.random()
          if (randomChance < 0.1) { // 10% chance every interval
            setShowDare(true)
            toast.message("You've received a date dare!", {
              description: "Complete it to earn extra points!",
              action: {
                label: 'View Dare',
                onClick: () => router.push(`/challenges/${dateData.id}`)
              }
            })
          }
        }, 5 * 60 * 1000) // Check every 5 minutes

        return () => {
          clearInterval(timeInterval)
          clearInterval(dareInterval)
        }
      } catch (error) {
        console.error('Error fetching date details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDateDetails()
  }, [router])

  const handleEndDate = async () => {
    try {
      if (!dateRequest) return

      const { error } = await supabase
        .from('date_requests')
        .update({ status: 'completed' })
        .eq('id', dateRequest.id)

      if (error) throw error
      router.push(`/challenges/${dateRequest.id}`)
    } catch (error) {
      console.error('Error ending date:', error)
      toast.error('Failed to end date. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="default" />
      
      <main className="max-w-2xl mx-auto p-5 pb-24">
        {dateRequest && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[#cc0000]">Active Date</h1>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="font-mono text-lg">{elapsedTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16">
                <Image
                  src={dateRequest.sender.avatar_url || '/images/default-avatar.png'}
                  alt={dateRequest.sender.first_name}
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {dateRequest.sender.first_name}, {dateRequest.sender.age}
                </h2>
                <p className="text-gray-600">{dateRequest.venue}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link
                href={`/messages/${dateRequest.sender.id}`}
                className="w-full py-3 bg-[#cc0000] text-white rounded-full flex items-center justify-center gap-2 hover:bg-[#aa0000] transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Message
              </Link>

              <button
                onClick={handleEndDate}
                className="w-full py-3 border-2 border-[#cc0000] text-[#cc0000] rounded-full flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                End Date & Review
              </button>
            </div>
          </div>
        )}

        {showDare && dateRequest && (
          <PenaltyDare
            userId={dateRequest.sender.id}
            onComplete={() => setShowDare(false)}
          />
        )}
      </main>

      <BottomNav />
    </div>
  )
}