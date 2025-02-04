'use client';

import { NextPage } from 'next';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/client';
import { Coffee, Calendar } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';
import Map from '@/components/Map';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const DateRequestsPage: NextPage = () => {
  return (
    <>
      <main className="max-w-md mx-auto p-5 pb-24 bg-white min-h-screen">
        <Header variant="logo-only" />
        
        {/* Date Requests List */}
        <div className="space-y-4">
          {/* Individual Date Request */}
          <div className="bg-white border-2 border-[#BA2525] rounded-[24px] p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16">
                <ProfileImage
                  user={{
                    avatar_url: null,
                    first_name: "User"
                  }}
                  className="rounded-full"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#BA2525]">Name, Age</h3>
                <p className="text-gray-600">Date Request</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-[#BA2525] text-white py-2 px-4 rounded-full hover:bg-[#a02020] transition-colors">
                Accept
              </button>
              <button className="flex-1 bg-white text-[#BA2525] border-2 border-[#BA2525] py-2 px-4 rounded-full hover:bg-[#BA2525] hover:text-white transition-colors">
                Decline
              </button>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
};

export default DateRequestsPage; 