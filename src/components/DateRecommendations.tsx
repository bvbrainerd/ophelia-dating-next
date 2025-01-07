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
  { id: 'activities', label: 'Activities' },
  { id: 'events', label: 'Events' }
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
  rating?: number;
  price?: string;
  slug: string;
}

const sampleDateSpots: DateSpot[] = [
  {
    id: '1',
    name: 'Boston Bruins',
    category: 'Sports & Entertainment',
    location: 'TD Garden',
    distance: '5.8 mi',
    imageUrl: '/images/venues/bruins.jpg',
    coordinates: [-71.0622, 42.3663],
    rating: 4.7,
    price: '$$$',
    slug: 'boston-bruins'
  },
  {
    id: '2',
    name: 'Barcelona Wine Bar',
    category: 'Food & Drinks',
    location: 'South End, Boston',
    distance: '4.9 mi',
    imageUrl: '/images/venues/barcelona.jpg',
    coordinates: [-71.0761, 42.3457],
    rating: 4.6,
    price: '$$$',
    slug: 'barcelona-wine-bar'
  },
  {
    id: '3',
    name: 'Museum of Fine Arts',
    category: 'Arts & Culture',
    location: 'Boston, MA',
    distance: '3.6 mi',
    imageUrl: '/images/venues/museum.jpg',
    coordinates: [-71.0995, 42.3394],
    rating: 4.8,
    price: '$$',
    slug: 'museum-of-fine-arts'
  },
  {
    id: '4',
    name: 'The Clay Room',
    category: 'Arts & Culture',
    location: 'Brookline, MA',
    distance: '1.9 mi',
    imageUrl: '/images/venues/clayroom.jpg',
    coordinates: [-71.1317, 42.3396],
    rating: 4.6,
    price: '$$',
    slug: 'the-clay-room'
  },
  {
    id: '5',
    name: 'Boston Celtics Game',
    category: 'Events',
    location: 'TD Garden',
    distance: '5.8 mi',
    imageUrl: '/images/venues/celtics.jpg',
    coordinates: [-71.0622, 42.3663],
    rating: 4.8,
    price: '$$$',
    slug: 'boston-celtics-game'
  }
];

interface Venue {
  name: string;
  category: string[];  // e.g. ['bar', 'restaurant', 'sports', 'activity']
  description: string;
  image: string;
}

const venues: Venue[] = [
  {
    name: "Lolita Back Bay",
    category: ["bar", "restaurant", "dinner"],
    description: "Trendy Mexican restaurant & bar",
    image: "/venues/lolita.jpg"
  },
  {
    name: "Fenway Park",
    category: ["sports", "activity", "group"],
    description: "Historic baseball stadium",
    image: "/venues/fenway.jpg"
  },
  {
    name: "House of Blues",
    category: ["concert", "activity", "entertainment"],
    description: "Live music venue",
    image: "/venues/hob.jpg"
  },
  // Add more venues with categories
];

const getRecommendedVenues = (quizAnswers: any) => {
  // Map quiz answers to venue categories
  const preferredCategories: string[] = [];
  
  // Check first date preference from quiz
  if (quizAnswers.idealDate === "Dinner or Bar") {
    preferredCategories.push("bar", "restaurant", "dinner");
  } else if (quizAnswers.idealDate === "Sports Game") {
    preferredCategories.push("sports", "activity");
  } else if (quizAnswers.idealDate === "Concert/Activity") {
    preferredCategories.push("concert", "activity", "entertainment");
  } else if (quizAnswers.idealDate === "A fun group activity with friends") {
    preferredCategories.push("group", "activity");
  }

  // Filter venues that match preferred categories
  return venues.filter(venue => 
    venue.category.some(cat => preferredCategories.includes(cat))
  );
};

export default function DateRecommendations() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateSpots, setDateSpots] = useState<DateSpot[]>(sampleDateSpots);

  const filteredSpots = selectedCategory === 'all' 
    ? dateSpots 
    : selectedCategory === 'recommended'
    ? dateSpots.filter(spot => (spot.rating ?? 0) >= 4.6)
    : selectedCategory === 'restaurants'
    ? dateSpots.filter(spot => spot.category === 'Food & Drinks')
    : selectedCategory === 'sports'
    ? dateSpots.filter(spot => spot.category === 'Sports & Entertainment')
    : selectedCategory === 'activities'
    ? dateSpots.filter(spot => spot.category === 'Arts & Culture' || spot.category === 'Adventure & Outdoors')
    : dateSpots.filter(spot => spot.category === 'Events');

  return (
    <div className="max-w-6xl mx-auto p-5">
      <div className="mt-4 mb-8">
        <h2 className="text-2xl font-bold text-[#BA2525] mb-8 text-center">
          Top Rated Date Locations Near You
        </h2>
      </div>
      
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap
              ${selectedCategory === category.id 
                ? 'bg-[#BA2525] text-white border border-[#BA2525]' 
                : 'bg-white text-[#BA2525] border border-[#BA2525] hover:bg-[#ffeeee]'} 
              transition-colors`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search venues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 pl-12 rounded-full border border-gray-200 focus:outline-none focus:border-[#BA2525]"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Map and Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
        {/* Map Section */}
        <div className="bg-white rounded-[30px] h-[400px] lg:sticky lg:top-4 shadow-sm overflow-hidden">
          <Map 
            markers={filteredSpots.map(spot => ({
              coordinates: spot.coordinates,
              title: spot.name
            }))}
          />
        </div>

        {/* Listings Section */}
        <div className="max-h-[500px] overflow-y-auto">
          <div className="space-y-4">
            {filteredSpots
              .filter(spot => 
                spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                spot.location.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(spot => (
                <Link href="/matching" key={spot.id}>
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
                        <h3 className="font-semibold text-lg text-[#BA2525]">{spot.name}</h3>
                        <p className="text-gray-500 text-sm">
                          {spot.location} • {spot.distance}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {spot.price}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 