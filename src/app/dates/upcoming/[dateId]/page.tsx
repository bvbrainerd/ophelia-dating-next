'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DateRequestDetails() {
    const params = useParams();
    const router = useRouter();
    const [dateRequest, setDateRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDateRequestDetails = async () => {
            try {
                const response = await fetch(`/api/date-requests/${params.dateId}`);
                if (!response.ok) throw new Error('Failed to fetch date request');

                const { data } = await response.json();
                setDateRequest(data);
            } catch (error) {
                console.error('Error fetching date request details:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDateRequestDetails();
    }, [params.dateId]);

    if (isLoading) {
        return (
          <div className='flex justify-center items-center min-h-screen'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]'></div>
          </div>
        );
      }
    
      return (
        <div className="max-w-md mx-auto p-5">
            <h1 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
                Date Details
            </h1>
            <div className="space-y-4">
                <button onClick={() => router.push(`/dates/upcoming/${params.dateId}/messaging`)}>
                    Go to Messaging
                </button>
                <button onClick={() => router.push(`/dates/upcoming/${params.dateId}/status`)}>
                    Date Status
                </button>
            </div>
        </div>
      )
}