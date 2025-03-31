'use client';

import { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Filter } from 'lucide-react';
import { Profile } from '@/types/profile';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { toast } from 'react-hot-toast';
import Map from '@/components/Map';

const DEFAULT_VENUE_IMAGE = 'https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/default-venue.jpg';

const getImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/${imageUrl}`;
};

interface DateSuggestionData {
  venue: string;
  description: string;
  compatibility?: number;
  priceRange: string;
  imageUrl: string;
  mood: string;
}

interface CoupleDateRequest {
  id: string;
  user_id: string;
  venue: string;
  proposed_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

interface DateBookingModalProps {
  venue: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, time: string) => void;
}

const VENUE_COORDINATES: { [key: string]: [number, number] } = {
  'Boston Bruins': [-71.0622, 42.3663],
  'Celtics': [-71.0622, 42.3663],
  'BC Hockey': [-71.1677, 42.3357],
  'BC Basketball': [-71.1677, 42.3357],
  'Museum of Fine Arts': [-71.0995, 42.3394],
  'Barcelona Wine Bar': [-71.0761, 42.3457],
  'Boston Commons': [-71.0640, 42.3554],
  'Kured': [-71.0712, 42.3589],
  'The Clay Room': [-71.1317, 42.3396],
  'Joes on Newbury': [-71.0793, 42.3491],
  'Private Helicopter Ride': [-71.0217, 42.3656],
  'Boston Duck Tour': [-71.0737, 42.3587],
  'F1 Arcade': [-71.0595, 42.3501],
  'Lucca North End': [-71.0547, 42.3645],
  'Blue Ribbon Sushi': [-71.0712, 42.3589],
  'Lolita Back Bay': [-71.0695, 42.3475],
  'Capo': [-71.0471, 42.3355],
  'Lorettas Last Call': [-71.0953, 42.3467],
  'Cityside Tavern': [-71.1502, 42.3359]
};

const DateBookingModal = ({ venue, isOpen, onClose, onSubmit }: DateBookingModalProps) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const coordinates = VENUE_COORDINATES[venue] || [-71.0589, 42.3601];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onSubmit(selectedDate, selectedTime);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4">Book {venue}</h3>

        {/* Map Component */}
        <div className="h-48 rounded-xl overflow-hidden mb-6">
          <Map
            center={coordinates}
            zoom={15}
            markers={[{ coordinates, title: venue }]}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border rounded-xl"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Select Time</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-3 border rounded-xl"
              required
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-[#cc0000] text-white rounded-xl hover:bg-[#bb0000] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MoodSelector = ({ onMoodSelect, selectedMood }: { onMoodSelect: (mood: string | null) => void; selectedMood: string | null }) => {
  const moods = [
    { label: 'All Experiences', value: null },
    { label: 'Food', value: 'food' },
    { label: 'Adventurous', value: 'adventurous' },
    { label: 'Arts', value: 'arts' },
    { label: 'Entertainment', value: 'entertainment' },
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
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const router = useRouter();
  
  const handleBookNow = async (venue: string) => {
    setSelectedVenue(venue);
    setIsBookingModalOpen(true);
  };

  const handleDateBooking = async (date: string, time: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const proposedTime = `${date}T${time}`;

      // Create a new couple date request
      const { data, error } = await supabase
        .from('couple_date_requests')
        .insert({
          user_id: session.user.id,
          venue: selectedVenue,
          proposed_time: proposedTime,
          status: 'confirmed',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Also create a date_requests entry for the upcoming dates view
      const { error: dateRequestError } = await supabase
        .from('date_requests')
        .insert({
          sender_id: session.user.id,
          receiver_id: session.user.id, // Same ID for couples
          venue: selectedVenue,
          proposed_time: proposedTime,
          status: 'accepted',
          is_couple_date: true
        });

      if (dateRequestError) throw dateRequestError;

      toast.success('Date booked successfully!');
      router.push('/dates/upcoming');
    } catch (error) {
      console.error('Error booking date:', error);
      toast.error('Failed to book date. Please try again.');
    }
  };

  // Get all venues without filtering by mood initially
  const allVenues = dateSuggestions;
  const filteredSuggestions = selectedMood
    ? dateSuggestions.filter(suggestion => 
        suggestion.mood === selectedMood ||
        // Include dining venues in food category
        (selectedMood === 'food' && suggestion.mood === 'dining')
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
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col transform transition-transform hover:scale-[1.02]">
                <div className="relative h-48">
                  <Image
                    src={getImageUrl(suggestion.imageUrl)}
                    alt={suggestion.venue}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', suggestion.imageUrl);
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_VENUE_IMAGE;
                    }}
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="bg-gray-100 text-gray-900 px-3 py-1 rounded-full text-xs font-medium">
                        {suggestion.mood === 'food' ? 'Food & Dining' :
                         suggestion.mood === 'adventurous' ? 'Adventurous' :
                         suggestion.mood === 'arts' ? 'Arts' :
                         suggestion.mood === 'entertainment' ? 'Entertainment' :
                         'Chill'}
                      </div>
                      <div className="bg-gray-100 text-gray-900 px-3 py-1 rounded-full text-xs font-medium">
                        {suggestion.priceRange}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{suggestion.venue}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{suggestion.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm text-gray-500">Boston, MA</span>
                    <button 
                      onClick={() => handleBookNow(suggestion.venue)}
                      className="px-6 py-2 bg-[#cc0000] text-white text-sm font-medium rounded-full hover:bg-[#aa0000] transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">
            <p className="text-xl mb-4">No experiences found for this category.</p>
            <p>Try selecting a different category to discover more date options!</p>
          </div>
        )}
      </div>
      
      <DateBookingModal
        venue={selectedVenue}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleDateBooking}
      />
      
      <BottomNav />
    </div>
  );
} 