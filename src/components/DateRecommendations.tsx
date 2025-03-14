'use client';

import { MapPin, Wine, Bike, Palette, Book, Coffee, Trophy } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Map from './Map';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'sports', label: 'Sports' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'bars', label: 'Bars' },
  { id: 'cafes', label: 'Cafes' },
  { id: 'activities', label: 'Activities' },
  { id: 'events', label: 'Events' }
];

interface DateSpot {
  id: string;
  name: string;
  category?: string;
  type?: string;
  location: string;
  distance: string;
  imageUrl: string;
  coordinates: [number, number];
  description?: string;
  rating?: number;
  price: string;
  slug: string;
}

const sampleDateSpots: DateSpot[] = [
  {
    id: '1',
    name: 'Boston Bruins',
    category: 'sports',
    location: 'TD Garden',
    distance: '5.8 mi',
    imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/bruins.jpg",
    coordinates: [-71.0622, 42.3663],
    rating: 4.7,
    price: '$$$',
    slug: 'boston-bruins'
  },
  {
    id: '2',
    name: 'Barcelona Wine Bar',
    category: 'restaurant/bar',
    location: 'South End, Boston',
    distance: '4.9 mi',
    imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/barcelona.jpg",
    coordinates: [-71.0761, 42.3457],
    rating: 4.6,
    price: '$$$',
    slug: 'barcelona-wine-bar'
  },
  {
    id: '3',
    name: 'Museum of Fine Arts',
    category: 'activities',
    location: 'Boston, MA',
    distance: '3.6 mi',
    imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/museum.jpg",
    coordinates: [-71.0995, 42.3394],
    rating: 4.8,
    price: '$$',
    slug: 'museum-of-fine-arts'
  },
  {
    id: '4',
    name: 'The Clay Room',
    category: 'activities',
    location: 'Brookline, MA',
    distance: '1.9 mi',
    imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/clayroom.jpg",
    coordinates: [-71.1317, 42.3396],
    rating: 4.6,
    price: '$$',
    slug: 'the-clay-room'
  },
  {
    id: '5',
    name: 'Boston Celtics Game',
    category: 'sports',
    location: 'TD Garden',
    distance: '5.8 mi',
    imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/celtics.jpg",
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
    category: ["restaurant", "bar"],
    description: "Trendy Mexican restaurant & bar",
    image: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/lolitabackbay.jpg"
  },
  {
    name: "Parla",
    category: ["restaurant", "bar"],
    description: "Intimate Italian restaurant & cocktail bar",
    image: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/parla.jpg"
  },
  {
    name: "Bartaco",
    category: ["restaurant", "bar"],
    description: "Upscale street food & craft cocktails",
    image: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/bartaco.jpg"
  },
  {
    name: "Loco Taqueria",
    category: ["restaurant", "bar"],
    description: "Vibrant Mexican restaurant & tequila bar",
    image: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/loco.jpg"
  },
  {
    name: "Boston Commons",
    category: ["activities"],
    description: "Historic public park",
    image: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/commons.jpg"
  },
  {
    name: "Museum of Fine Arts",
    category: ["activities"],
    description: "World-class art museum",
    image: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/museum.jpg"
  },
  {
    name: "Greatest Bar",
    category: ["bar"],
    description: "Popular sports bar near TD Garden",
    image: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/greatestbar.jpg"
  }
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

  const filteredSpots = selectedCategory === 'all' 
    ? sampleDateSpots 
    : selectedCategory === 'recommended'
    ? sampleDateSpots.filter(spot => (spot.rating ?? 0) >= 4.6)
    : selectedCategory === 'sports'
    ? sampleDateSpots.filter(spot => spot.category === 'sports')
    : selectedCategory === 'restaurants'
    ? sampleDateSpots.filter(spot => {
        const category = spot.category?.toLowerCase() || '';
        const type = spot.type?.toLowerCase() || '';
        return (category.includes('restaurant') && !category.includes('bar')) || 
               (type.includes('restaurant') && !type.includes('bar')) ||
               category === 'restaurant/bar' ||
               type === 'restaurant/bar' ||
               category === 'bar/restaurant' ||
               type === 'bar/restaurant';
      })
    : selectedCategory === 'bars'
    ? sampleDateSpots.filter(spot => {
        const category = spot.category?.toLowerCase() || '';
        const type = spot.type?.toLowerCase() || '';
        return category === 'bar' ||
               type === 'bar' ||
               category.includes('bar') ||
               type.includes('bar');
      })
    : selectedCategory === 'cafes'
    ? sampleDateSpots.filter(spot => {
        const category = spot.category?.toLowerCase() || '';
        const type = spot.type?.toLowerCase() || '';
        return category.includes('cafe') || type.includes('cafe');
      })
    : selectedCategory === 'activities'
    ? sampleDateSpots.filter(spot => spot.category === 'activities')
    : sampleDateSpots.filter(spot => spot.category === 'events');

  const searchFilteredSpots = useMemo(() => {
    if (!searchQuery) return filteredSpots;
    
    return filteredSpots.filter((spot: DateSpot) => 
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredSpots, searchQuery]);

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
            markers={searchFilteredSpots.map((spot: DateSpot) => ({
              coordinates: spot.coordinates,
              title: spot.name
            }))}
            center={searchFilteredSpots.length > 0 
              ? searchFilteredSpots[0].coordinates 
              : [-71.0589, 42.3601] // Boston coordinates as default
            }
            zoom={13}
          />
        </div>

        {/* Listings Section */}
        <div className="max-h-[500px] overflow-y-auto">
          <div className="space-y-4">
            {searchFilteredSpots.map((spot: DateSpot) => (
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