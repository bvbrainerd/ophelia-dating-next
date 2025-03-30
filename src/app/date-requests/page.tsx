'use client';

import { NextPage } from 'next';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/client';
import { Coffee, Calendar, MapPin } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';
import Map from '@/components/Map';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

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
  }[] | null;
}

const DateRequestsPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [previousDates, setPreviousDates] = useState<DateRequest[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPreviousDates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dateData, error } = await supabase
          .from('date_requests')
          .select(`
            id,
            venue,
            proposed_time,
            status,
            sender:profiles!date_requests_sender_id_fkey (
              id,
              first_name,
              avatar_url,
              age
            )
          `)
          .eq('status', 'completed')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('proposed_time', { ascending: false });

        if (error) throw error;
        
        // Transform the data to match the DateRequest type
        const transformedData = (dateData || []).map(date => ({
          id: date.id,
          venue: date.venue,
          proposed_time: date.proposed_time,
          status: date.status,
          sender: date.sender
        }));

        setPreviousDates(transformedData);
      } catch (error) {
        console.error('Error fetching previous dates:', error);
      }
    };

    if (activeTab === 'previous') {
      fetchPreviousDates();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Header variant="default" />
      
      {/* Tab Navigation */}
      <div className="bg-white px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'requests' 
                ? 'bg-[#b82525] text-white' 
                : 'text-gray-600'
            }`}
          >
            Date Requests (1)
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'upcoming' 
                ? 'bg-[#b82525] text-white' 
                : 'text-gray-600'
            }`}
          >
            Upcoming Dates (1)
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'previous' 
                ? 'bg-[#b82525] text-white' 
                : 'text-gray-600'
            }`}
          >
            Previous Dates
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'groups' 
                ? 'bg-[#b82525] text-white' 
                : 'text-gray-600'
            }`}
          >
            Group Invites
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {activeTab === 'previous' && (
          <>
            {previousDates.map((date) => (
              <div key={date.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20">
                    <ProfileImage
                      user={{
                        avatar_url: date.sender?.[0]?.avatar_url || null,
                        first_name: date.sender?.[0]?.first_name || "User"
                      }}
                      className="rounded-full w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {date.sender?.[0]?.first_name}, {date.sender?.[0]?.age}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {new Date(date.proposed_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-[#f9f9f9] rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-bold text-gray-900">{date.venue}</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {new Date(date.proposed_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <button 
                  onClick={() => router.push(`/dates/upcoming/${date.id}/review`)}
                  className="w-full py-3 px-6 bg-[#b82525] text-white rounded-full font-bold hover:bg-[#a02020] transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
            {previousDates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No previous dates found
              </div>
            )}
          </>
        )}
        
        {/* Existing content for other tabs */}
        {activeTab === 'requests' && (
          <>
            {/* Individual Date Request */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Profile Info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-20 h-20">
                  <ProfileImage
                    user={{
                      avatar_url: null,
                      first_name: "User"
                    }}
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Barry, 21</h3>
                  <p className="text-gray-600 text-sm">2 mutual interests • 1.2 miles away</p>
                </div>
              </div>

              {/* Bio Section */}
              <div className="bg-[#f9f9f9] rounded-xl p-4 mb-4">
                <p className="text-gray-600 text-sm">
                  Photography enthusiast and coffee lover. Looking forward to meeting new people in the city!
                </p>
              </div>

              {/* Date Details */}
              <div className="bg-[#f9f9f9] rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-bold text-gray-900">Capo</h4>
                  <span className="text-gray-600 text-sm">Restaurant • Italian</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Sat, Mar 22, 2025, 5:00 PM
                </p>
              </div>

              {/* Map */}
              <div className="h-36 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                <Map
                  markers={[{
                    coordinates: [-71.0589, 42.3601],
                    title: "Capo"
                  }]}
                  center={[-71.0589, 42.3601]}
                  zoom={15}
                />
              </div>

              {/* Suggested Message */}
              <div className="bg-[#f9f9f9] rounded-xl p-4 mb-4">
                <p className="text-gray-600 text-sm italic">
                  "I've heard their pasta is amazing. Looking forward to it!"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-3">
                <button className="flex-1 py-3 px-6 border-2 border-[#b82525] text-[#b82525] rounded-full font-bold hover:bg-red-50 transition-colors">
                  Message
                </button>
                <button className="flex-1 py-3 px-6 bg-[#b82525] text-white rounded-full font-bold hover:bg-[#a02020] transition-colors">
                  Accept
                </button>
              </div>
              
              <button className="w-full py-3 px-6 border-2 border-gray-200 text-gray-600 rounded-full font-bold hover:bg-gray-50 transition-colors">
                Suggest Alternative
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DateRequestsPage; 