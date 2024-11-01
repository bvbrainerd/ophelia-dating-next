'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MessagingPage = () => {
  const router = useRouter();
  const [dateRequests, setDateRequests] = useState([
    {
      id: 1,
      name: 'Adelaide',
      age: 19,
      image: '/images/adelaide_profile.jpg',
      description: 'Hopeless Romantic',
      venue: 'Fenway Park',
      date: '11/2',
      time: '8:00 p.m',
      status: 'pending',
      price: 50
    },
    {
      id: 2,
      name: 'Emelia',
      age: 21,
      image: '/images/emelia_profile.jpg',
      description: 'Cautious Dater',
      venue: 'Kured',
      date: '11/1',
      time: '1:00 p.m',
      status: 'pending',
      price: 30
    }
  ]);

  const handleDateResponse = (id, response) => {
    setDateRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === id ? { ...request, status: response } : request
      )
    );
    if (response === 'accepted') {
      onDateAccepted(dateRequests.find(request => request.id === id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-red-600 font-bold text-2xl text-center mb-6">
        Your Date Requests
      </h2>
      
      {dateRequests.map(request => (
        <div key={request.id} className="border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <img
              src={request.image}
              alt={request.name}
              className="w-24 h-24 object-cover rounded-full mr-4"
            />
            <div>
              <h3 className="text-red-600 font-semibold text-lg mb-1">
                {request.name}, {request.age}
              </h3>
              <p className="text-gray-600 mb-1">
                {request.description}, {request.venue} {request.date} @{request.time}
              </p>
              <p className="text-gray-600">Price: ${request.price}</p>
            </div>
          </div>
          
          {request.status === 'pending' ? (
            <div className="flex justify-between gap-4">
              <button
                className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={() => handleDateResponse(request.id, 'accepted')}
              >
                Accept
              </button>
              <button
                className="w-full py-2 px-4 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                onClick={() => handleDateResponse(request.id, 'declined')}
              >
                Decline
              </button>
            </div>
          ) : (
            <p className={`text-center font-bold ${
              request.status === 'accepted' ? 'text-green-600' : 'text-red-600'
            }`}>
              {request.status === 'accepted' ? 'Accepted' : 'Declined'}
            </p>
          )}
        </div>
      ))}
      
      <button
        className="w-full mt-6 py-2 px-4 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors"
        onClick={()=>{router.push('/dashboard')}}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default MessagingPage;