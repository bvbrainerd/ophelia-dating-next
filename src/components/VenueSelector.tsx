'use client';

import { useState, useRef } from 'react';
import { MapPin, Search, Star, ArrowLeft } from 'lucide-react';
import Map from './Map';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Venue {
  name: string;
  location: string;
  type: string;
  rating: number;
  imageUrl: string;
  stripeLink: string;
  coordinates: [number, number];
  price?: string;
  description?: string;
}

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
  const [showFullSelector, setShowFullSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const filteredVenues = Object.entries(venues).flatMap(([category, venueList]) => {
    if (selectedCategory !== 'all' && selectedCategory !== category) return [];
    return venueList;
  });

  const handleVenueSelect = (venue: string) => {
    onVenueSelect(venue);
    setShowFullSelector(false);
  };

  // Regular venue selector button
  if (!showFullSelector) {
    return (
      <button 
        onClick={() => setShowFullSelector(true)}
        className="w-full p-4 border rounded-lg flex items-center justify-between"
      >
        <span className="text-gray-600">
          {selectedVenue || 'Select a venue'}
        </span>
        <MapPin className="text-gray-400" />
      </button>
    );
  }

  // Full-page venue selector with map
  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="h-full overflow-auto">
        <div className="max-w-6xl mx-auto p-4">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <button
              onClick={() => setShowFullSelector(false)}
              className="self-start text-[#BA2525] font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h2 className="text-2xl font-semibold text-[#BA2525]">Select a Venue</h2>
          </div>

          {/* Search and Categories */}
          <div className="mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search venues in Boston"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 p-2 border rounded-lg"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border 
                    ${selectedCategory === cat.id 
                      ? 'bg-[#BA2525] text-white border-[#BA2525]' 
                      : 'bg-white text-[#BA2525] border-[#BA2525] hover:bg-[#ffeeee] transition-colors'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Map and Venue List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map Section */}
            <div className="bg-white rounded-xl h-[600px] lg:sticky lg:top-4">
              <Map 
                markers={filteredVenues.map(venue => ({
                  coordinates: venue.coordinates,
                  title: venue.name
                }))}
                center={[-71.0589, 42.3601]}
                zoom={13}
                onMapLoad={(map) => { mapRef.current = map; }}
              />
            </div>

            {/* Venue List Section */}
            <div className="space-y-4">
              <div className="space-y-4">
                {filteredVenues.map((venue) => (
                  <div 
                    key={venue.name}
                    onClick={() => {
                      handleVenueSelect(venue.name);
                      if (mapRef.current) {
                        // Remove existing markers
                        const markers = document.getElementsByClassName('marker');
                        while (markers.length > 0) {
                          markers[0].remove();
                        }

                        // Add new marker at exact coordinates
                        const el = document.createElement('div');
                        el.className = 'marker';
                        
                        new mapboxgl.Marker({
                          element: el,
                          color: '#BA2525'
                        })
                          .setLngLat(venue.coordinates)
                          .setPopup(
                            new mapboxgl.Popup({ offset: 25 })
                              .setHTML(`<h3 class="font-semibold text-[#BA2525]">${venue.name}</h3>`)
                          )
                          .addTo(mapRef.current);

                        // Center map on coordinates
                        mapRef.current.flyTo({
                          center: venue.coordinates,
                          zoom: 15,
                          essential: true
                        });
                      }
                    }}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <img
                          src={venue.imageUrl}
                          alt={venue.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{venue.name}</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                          {venue.location} • {venue.rating} ★
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 