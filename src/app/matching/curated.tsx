'use client';

import { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Filter } from 'lucide-react';
import { Profile } from '@/types/profile';

interface DateSuggestionData {
  venue: string;
  description: string;
  compatibility?: number;
  priceRange: string;
  imageUrl: string;
  mood: string;
}

const DEFAULT_VENUE_IMAGE = 'https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/barcelona.jpg';

const MoodSelector = ({ onMoodSelect, selectedMood }: { onMoodSelect: (mood: string | null) => void; selectedMood: string | null }) => {
  const moods = [
    { label: 'All Experiences', value: null },
    { label: 'Food', value: 'food' },
    { label: 'Arts', value: 'arts' },
    { label: 'Entertainment', value: 'entertainment' },
    { label: 'Adventure', value: 'adventure' },
    { label: 'Chill', value: 'chill' }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Browse by Experience Type</h2>
      <div className="flex flex-wrap gap-2">
        {moods.map((mood) => (
          <button
            key={mood.label}
            onClick={() => onMoodSelect(mood.value)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              (selectedMood === mood.value || (selectedMood === null && mood.value === null))
              ? 'bg-[#cc0000] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mood.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function CuratedDatesView({ userProfile, dateSuggestions }: { userProfile: Profile; dateSuggestions: DateSuggestionData[] }) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  
  // Get all venues without filtering by mood initially
  const allVenues = dateSuggestions;
  const filteredSuggestions = selectedMood
    ? dateSuggestions.filter(suggestion => 
        (suggestion.mood || '').toLowerCase() === selectedMood.toLowerCase() ||
        // Include dining venues in food category
        (selectedMood.toLowerCase() === 'food' && suggestion.mood === 'dining')
      )
    : allVenues;

  return (
    <div className="min-h-screen bg-white">
      <Header variant="matching" />
      <div className="container mx-auto px-4 py-8 pb-32">
        <MoodSelector onMoodSelect={setSelectedMood} selectedMood={selectedMood} />

        {filteredSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="relative h-48">
                  <Image
                    src={`https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/${suggestion.imageUrl}`}
                    alt={suggestion.venue}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', suggestion.imageUrl);
                      e.currentTarget.src = DEFAULT_VENUE_IMAGE;
                    }}
                  />
                </div>
                <div className="p-3 flex flex-col flex-grow">
                  <div className="mb-2">
                    <div className="flex gap-2 mb-1">
                      <div className="bg-gray-100 text-gray-900 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Recommended
                      </div>
                      <div className="bg-gray-100 text-gray-900 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {suggestion.priceRange}
                      </div>
                    </div>
                    <h3 className="text-base font-bold">{suggestion.venue}</h3>
                  </div>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{suggestion.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-gray-500">Boston, MA</span>
                    <button className="px-4 py-1.5 bg-[#cc0000] text-white text-sm font-medium rounded-full hover:bg-[#aa0000] transition-colors">
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">
            <p className="text-xl mb-4">No experiences found for this mood.</p>
            <p>Try selecting a different category to discover more date options!</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
} 