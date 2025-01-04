'use client';

import { MapPin, Wine, Bike, Palette, Book, Coffee, Trophy } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Map from './Map';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'sports', label: 'Sports' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'activities', label: 'Activities' }
];

interface DateSpot {
  id: string;
  name: string;
  category: string;
  location: string;
  distance: string;
  imageUrl: string;
  coordinates: [number, number];
  description?: string;
}

const sampleDateSpots: DateSpot[] = [
  {
    id: '1',
    name: 'Boston Bruins',
    category: 'sports',
    location: 'TD Garden',
    distance: '0.7 mi',
    imageUrl: '/images/venues/bruins.jpg',
    coordinates: [-71.0622, 42.3663]
  },
  {
    id: '2',
    name: 'Barcelona Wine Bar',
    category: 'restaurants',
    location: 'Boston, MA',
    distance: '0.5 mi',
    imageUrl: '/images/venues/barcelona.jpg',
    coordinates: [-71.0622, 42.3663]
  },
  {
    id: '3',
    name: 'Museum of Fine Arts',
    category: 'activities',
    location: 'Boston, MA',
    distance: '1.2 mi',
    imageUrl: '/images/venues/museum.jpg',
    coordinates: [-71.0622, 42.3663]
  },
  {
    id: '4',
    name: 'The Clay Room',
    category: 'activities',
    location: 'Boston, MA',
    distance: '0.8 mi',
    imageUrl: '/images/venues/clayroom.jpg',
    coordinates: [-71.0622, 42.3663]
  }
];

export default function DateRecommendations() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateSpots, setDateSpots] = useState<DateSpot[]>(sampleDateSpots);

  const filteredSpots = selectedCategory === 'all' 
    ? dateSpots 
    : dateSpots.filter(spot => spot.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto p-5 mb-24">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2 text-[#BA2525]">Top Rated Date Locations Near You</h2>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border 
              ${selectedCategory === category.id 
                ? 'bg-[#BA2525] text-white border-[#BA2525]' 
                : 'bg-white text-[#BA2525] border-[#BA2525] hover:bg-[#ffeeee] transition-colors'}`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Map and Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Map Section */}
        <div className="bg-white rounded-[30px] h-[400px] lg:sticky lg:top-4 shadow-sm overflow-hidden">
          <Map 
            markers={filteredSpots.map(spot => ({
              coordinates: spot.coordinates,
              title: spot.name
            }))}
          />
        </div>

        {/* Listings Section - Back to original format */}
        <div className="pb-16">
          <div className="space-y-4">
            {filteredSpots.map(spot => (
              <Link href={`/date-spot/${spot.id}`} key={spot.id}>
                <div className="bg-white rounded-[30px] p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={spot.imageUrl}
                        alt={spot.name}
                        fill
                        sizes="(max-width: 768px) 96px,
                               (max-width: 1200px) 96px,
                               96px"
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{spot.name}</h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        {spot.location} • {spot.distance}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Add Start Dating Button */}
      <div className="flex justify-center mt-8 mb-4">
        <Link
          href="/matching"
          className="px-6 py-3 bg-white text-[#BA2525] border-2 border-[#BA2525] rounded-full font-medium hover:bg-[#ffeeee] transition-colors"
        >
          View Matches →
        </Link>
      </div>
    </div>
  );
} 