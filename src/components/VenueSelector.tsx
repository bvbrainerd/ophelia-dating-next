'use client';

import { useState, useRef } from 'react';
import { MapPin, Search, Star, ArrowLeft } from 'lucide-react';
import Map from './Map';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Image from 'next/image';
import { Venue } from '@/types/venue';

interface VenueSelectorProps {
  venues: Record<string, Venue[]>;
  onVenueSelect: (venue: string) => void;
  selectedVenue: string;
}

const categories = [
  { id: 'all', label: 'All' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'sports', label: 'Sports' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'activities', label: 'Activities' }
];

export default function VenueSelector({ venues, onVenueSelect, selectedVenue }: VenueSelectorProps) {
  const [showVenueList, setShowVenueList] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVenues = Object.entries(venues).flatMap(([category, venueList]) => {
    // For recommended category
    if (selectedCategory === 'recommended') {
      return venueList.filter(venue => 
        venue.type.toLowerCase() === 'sports' || 
        venue.type.toLowerCase() === 'restaurant'
      );
    }
    
    // For other categories
    if (selectedCategory !== 'all' && selectedCategory !== category) return [];
    
    return venueList.filter(venue => 
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div>
      {!showVenueList ? (
        <button
          onClick={() => setShowVenueList(true)}
          className="w-full p-3 text-left border rounded-lg flex items-center justify-between hover:border-[#cc0000] transition-colors"
        >
          <span className="text-black">
            {selectedVenue || 'Select venue'}
          </span>
          <MapPin className="text-[#cc0000]" />
        </button>
      ) : (
        <div className="fixed inset-0 bg-white z-50">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center p-4">
              <button
                onClick={() => setShowVenueList(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft />
              </button>
              <h2 className="text-2xl font-bold ml-2 text-[#BA2525]">Select Venue</h2>
            </div>

            {/* Search and Categories */}
            <div className="px-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-full text-sm"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${
                      selectedCategory === category.id
                        ? 'bg-[#BA2525] text-white border-[#BA2525]'
                        : 'bg-white text-[#BA2525] border-[#BA2525] hover:bg-[#ffeeee]'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map and List Container */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
              {/* Map */}
              <div className="bg-white rounded-[30px] h-[400px] lg:sticky lg:top-4 shadow-sm overflow-hidden">
                <Map 
                  markers={filteredVenues.map(venue => ({
                    coordinates: venue.coordinates,
                    title: venue.name
                  }))}
                />
              </div>

              {/* Venue List */}
              <div className="max-h-[500px] overflow-y-auto">
                <div className="space-y-4">
                  {filteredVenues.map((venue) => (
                    <button
                      key={venue.name}
                      onClick={() => {
                        onVenueSelect(venue.name);
                        setShowVenueList(false);
                      }}
                      className="w-full bg-white hover:bg-gray-100 p-4 flex items-start gap-4 transition-colors duration-200"
                    >
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image 
                          src={venue.imageUrl} 
                          alt={venue.name}
                          fill
                          sizes="(max-width: 768px) 96px, 96px"
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold mb-1">{venue.name}</h3>
                        <p className="text-gray-500 text-left">
                          {venue.location}
                          {venue.distance && (
                            <>
                              <span className="mx-2">•</span>
                              {venue.distance}
                            </>
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 