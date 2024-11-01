'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MatchingPage = () => {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [dateLocation, setDateLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const router = useRouter(); 

  const matches = [
    { name: 'Claudia', age: 21, image: '/images/claudia_profile.jpg', description: 'Cautious Dater, Ideal Date: Restaurant, Humor: Witty' },
    { name: 'Virginia', age: 20, image: '/images/Virginia_profile.jpg', description: 'Hopeless Romantic, Ideal Date: Concert, Favorite Genre: Alternative' },
  ];

  const venues = [
    "Red Sox @Fenway Park",
    "Kured",
    "Museum of Fine Arts",
    "Lolita Back Bay",
    "Celtics Game @TD Garden",
    "Custom"
  ];

  const handleDateRequest = () => {
    if (selectedMatch && dateLocation && dateTime) {
      console.log(`Date request sent to ${selectedMatch.name} for ${dateLocation} at ${dateTime}`);
      setSelectedMatch(null);
      setDateLocation('');
      setDateTime('');
    } else {
      alert('Please select a match, location, and time before sending a date request.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-red-600 font-bold text-2xl text-center mb-6">
        Your Matches
      </h2>

      {matches.map((match, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <img
              src={match.image}
              alt={match.name}
              className="w-24 h-24 object-cover rounded-full mr-4"
            />
            <div>
              <h3 className="text-red-600 font-semibold text-lg mb-1">
                {match.name}, {match.age}
              </h3>
              <p className="text-gray-600">
                {match.description}
              </p>
            </div>
          </div>
          <button
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            onClick={() => setSelectedMatch(match)}
          >
            Date
          </button>
        </div>
      ))}

      {selectedMatch && (
        <div className="mt-6 border border-gray-200 rounded-lg p-6">
          <h3 className="text-red-600 font-semibold text-lg mb-4">
            Set up your date with {selectedMatch.name}
          </h3>
          
          <select
            className="w-full mb-4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            value={dateLocation}
            onChange={(e) => setDateLocation(e.target.value)}
          >
            <option value="">Select a venue</option>
            {venues.map(venue => (
              <option key={venue} value={venue}>{venue}</option>
            ))}
          </select>

          {dateLocation === 'Custom' && (
            <input
              className="w-full mb-4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              type="text"
              placeholder="Enter custom venue"
              onChange={(e) => setDateLocation(e.target.value)}
            />
          )}

          <input
            className="w-full mb-4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />

          <button
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            onClick={handleDateRequest}
          >
            Send Date Request
          </button>
        </div>
      )}

      <button
        className="w-full mt-6 py-2 px-4 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors"
        onClick={()=>{router.push('/dashboard')}}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default MatchingPage;