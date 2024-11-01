'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const UpcomingDatesPage = () => {
  const router = useRouter();
  const [upcomingDates] = useState([
    {
      id: 1,
      name: 'Adelaide',
      age: 19,
      image: '/images/adelaide_profile.jpg',
      venue: 'Fenway Park',
      date: '2024-11-02',
      time: '20:00',
      status: 'confirmed',
      price: 50,
      description: 'Hopeless Romantic',
    },
    {
      id: 2,
      name: 'Emelia',
      age: 21,
      image: '/images/emelia_profile.jpg',
      venue: 'Kured',
      date: '2024-11-01',
      time: '13:00',
      status: 'confirmed',
      price: 30,
      description: 'Cautious Dater',
    },
  ]);

  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h2 className='text-red-600 font-bold text-2xl text-center mb-6'>
        Your Upcoming Dates
      </h2>

      {upcomingDates.length === 0 ? (
        <p className='text-center mb-6'>No upcoming dates scheduled yet.</p>
      ) : (
        upcomingDates.map((date) => (
          <div
            key={date.id}
            className='border border-gray-200 rounded-lg p-6 mb-6'
          >
            <div className='flex items-center mb-4'>
              <img
                src={date.image}
                alt={date.name}
                className='w-24 h-24 object-cover rounded-full mr-4'
              />
              <div>
                <h3 className='text-red-600 font-semibold text-lg mb-1'>
                  {date.name}, {date.age}
                </h3>
                <p className='text-gray-600 mb-1'>{date.description}</p>
                <p className='text-gray-600 mb-1'>
                  <span className='font-semibold'>When:</span>{' '}
                  {formatDateTime(date.date, date.time)}
                </p>
                <p className='text-gray-600'>
                  <span className='font-semibold'>Where:</span> {date.venue}
                </p>
              </div>
            </div>

            <div className='bg-gray-50 p-3 rounded mt-4'>
              <p className='text-red-600 text-center m-0'>Paid & Confirmed ✓</p>
            </div>
          </div>
        ))
      )}

      <button
        className='w-full mt-6 py-2 px-4 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors'
        onClick={() => {
          router.push('/dashboard');
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default UpcomingDatesPage;
