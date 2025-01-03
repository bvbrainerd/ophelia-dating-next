'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Search, Star, Users } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

interface Venue {
  name: string;
  location: string;
  type: string;
  price?: string;
  rating: number;
  imageUrl: string;
  stripeLink: string;
}

interface DateRequestForm {
  venue: string;
  proposed_time: string;
  split_payment: number | null;
}

const VENUES: Record<string, Venue[]> = {
  sports: [
    { 
      name: "Boston Bruins",
      location: "TD Garden",
      type: "Sports",
      rating: 4.7,
      imageUrl: "/images/venues/bruins.jpg",
      stripeLink: "https://buy.stripe.com/00gg1ng5i1BzeWY6os"
    },
    { 
      name: "Celtics",
      location: "TD Garden",
      type: "Sports",
      rating: 4.7,
      imageUrl: "/images/venues/celtics.jpg",
      stripeLink: "https://buy.stripe.com/5kA8yVf1e0xvg12eV0"
    },
    { 
      name: "BC Hockey",
      location: "Conte Forum",
      type: "Sports",
      rating: 4.5,
      imageUrl: "/images/venues/bchockey.jpg",
      stripeLink: "https://buy.stripe.com/bIYcPb3iw6VT5mobIN"
    },
    { 
      name: "BC Basketball",
      location: "Conte Forum",
      type: "Sports",
      rating: 4.5,
      imageUrl: "/images/venues/bcbasketball.jpg",
      stripeLink: "https://buy.stripe.com/fZebL7bP24NL9CE9AB"
    }
  ],
  restaurants: [
    { 
      name: "Barcelona Wine Bar",
      location: "Boston, MA",
      type: "Spanish",
      price: "$$$",
      rating: 4.6,
      imageUrl: "/images/venues/barcelona.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk"
    },
    { 
      name: "Capo",
      location: "South Boston",
      type: "Italian",
      price: "$$$",
      rating: 4.5,
      imageUrl: "/images/venues/capo.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk"
    },
    { 
      name: "Lolita Back Bay",
      location: "Back Bay",
      type: "Mexican",
      price: "$$",
      rating: 4.5,
      imageUrl: "/images/venues/lolita.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk"
    },
    { 
      name: "Blue Ribbon Sushi",
      location: "Boston, MA",
      type: "Japanese",
      price: "$$$$",
      rating: 4.7,
      imageUrl: "/images/venues/blueribbon.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk"
    },
    { 
      name: "Lucca North End",
      location: "North End",
      type: "Italian",
      price: "$$$",
      rating: 4.6,
      imageUrl: "/images/venues/lucca.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk"
    },
    { 
      name: "Joes on Newbury",
      location: "Back Bay",
      type: "American",
      price: "$$",
      rating: 4.4,
      imageUrl: "/images/venues/joes.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk"
    },
    { 
      name: "Kured",
      location: "Beacon Hill",
      type: "Charcuterie",
      price: "$$",
      rating: 4.5,
      imageUrl: "/images/venues/kured.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk"
    },
    { 
      name: "Branchline",
      location: "Brookline, MA",
      type: "American",
      price: "$$",
      rating: 4.6,
      imageUrl: "/images/venues/branchline.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk"
    }
  ],
  activities: [
    { 
      name: "Museum of Fine Arts",
      location: "Boston, MA",
      type: "Culture",
      rating: 4.8,
      imageUrl: "/images/venues/museum.jpg",
      stripeLink: "https://buy.stripe.com/aEU8yV7yM5RP8yA3ce"
    },
    { 
      name: "Private Helicopter Ride",
      location: "Boston, MA",
      type: "Adventure",
      price: "$$$$",
      rating: 4.9,
      imageUrl: "/images/venues/helicopter.jpg",
      stripeLink: "https://buy.stripe.com/14k2ax7yM0xv6qs8wz"
    },
    { 
      name: "F1 Arcade",
      location: "Boston, MA",
      type: "Entertainment",
      price: "$$",
      rating: 4.4,
      imageUrl: "/images/venues/f1arcade.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk"
    },
    { 
      name: "The Clay Room",
      location: "Boston, MA",
      type: "Creative",
      rating: 4.6,
      imageUrl: "/images/venues/clayroom.jpg",
      stripeLink: "https://buy.stripe.com/00g8yVaKYgwt4ikaEO"
    },
    { 
      name: "Boston Duck Tour",
      location: "Downtown Boston",
      type: "Tour",
      price: "$$$",
      rating: 4.7,
      imageUrl: "/images/venues/ducktour.jpg",
      stripeLink: "https://buy.stripe.com/14k9CZbP20xv7uw28j"
    }
  ],
  outdoors: [
    { 
      name: "Boston Commons",
      location: "Boston, MA",
      type: "Park",
      rating: 4.7,
      imageUrl: "/images/venues/commons.jpg",
      stripeLink: "https://buy.stripe.com/eVaaH31ao2FDbKM3ck"
    }
  ]
};

const DEFAULT_AVATAR = '/images/default-avatar.png';

export default function DateRequestPage() {
  const params = useParams();
  const profileId = params.id as string;
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVenueList, setShowVenueList] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<DateRequestForm>({
    venue: '',
    proposed_time: '',
    split_payment: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.replace('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (error) throw error;
        if (data) setProfile(data);
        
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [profileId, router]);

  const isRestaurantVenue = (venueName: string) => {
    return VENUES.restaurants.some(venue => venue.name === venueName);
  };

  const handleVenueSelect = (venueName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      venue: venueName,
      split_payment: isRestaurantVenue(venueName) ? prev.split_payment : 0
    }));
    setShowVenueList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        setError('Your session has expired. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      const { error: insertError } = await supabase
        .from('date_requests')
        .insert({
          sender_id: session.user.id,
          receiver_id: profileId,
          venue: formData.venue,
          proposed_time: new Date(formData.proposed_time).toISOString(),
          split_payment: formData.split_payment,
          status: 'pending'
        });

      if (insertError) throw insertError;

      router.push('/daterequests');
    } catch (err) {
      setError('Failed to send date request');
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto p-5">
        <div className="text-center text-red-600">Profile not found</div>
      </div>
    );
  }

  const filteredVenues = Object.entries(VENUES).flatMap(([category, venues]) => {
    if (selectedCategory !== 'all' && selectedCategory !== category) return [];
    return venues.filter(venue => 
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <Header variant="matching" />
      
      <div className="p-4 pb-24 max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-[#cc0000] mb-6">Send Date Request</h1>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="relative w-16 h-16">
            <Image
              src={profile.avatar_url || DEFAULT_AVATAR}
              alt={`${profile.first_name}'s avatar`}
              fill
              className="rounded-full object-cover"
              sizes="64px"
              priority
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-gray-600">Age: {profile.age}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-lg font-semibold mb-2 block">Venue</label>
            <button 
              type="button"
              onClick={() => setShowVenueList(true)}
              className="w-full p-4 border rounded-lg flex items-center justify-between"
            >
              <span className="text-gray-600">
                {formData.venue || 'Select a venue'}
              </span>
              <MapPin className="text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-lg font-semibold mb-2 block">Date</label>
              <input 
                type="date"
                value={formData.proposed_time.split('T')[0]}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const currentTime = formData.proposed_time.split('T')[1] || '00:00';
                  setFormData(prev => ({
                    ...prev,
                    proposed_time: `${newDate}T${currentTime}`
                  }));
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-4 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-lg font-semibold mb-2 block">Time</label>
              <input 
                type="time"
                value={formData.proposed_time.split('T')[1] || ''}
                onChange={(e) => {
                  const currentDate = formData.proposed_time.split('T')[0] || 
                    new Date().toISOString().split('T')[0];
                  setFormData(prev => ({
                    ...prev,
                    proposed_time: `${currentDate}T${e.target.value}`
                  }));
                }}
                className="w-full p-4 border rounded-lg"
                required
                step="1800"
              />
            </div>
          </div>

          <div>
            {isRestaurantVenue(formData.venue) ? (
              <>
                <label className="text-lg font-semibold mb-2 block">
                  Payment Preference
                </label>
                <select
                  value={formData.split_payment?.toString() || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    split_payment: e.target.value ? parseFloat(e.target.value) : null
                  }))}
                  className="w-full p-4 border rounded-lg"
                >
                  <option value="">Select payment option</option>
                  <option value="0">Pre-Pay</option>
                  <option value="50">Pay In-Person</option>
                </select>
              </>
            ) : formData.venue && (
              <div className="text-gray-600">
                <label className="text-lg font-semibold mb-2 block">
                  Payment Preference
                </label>
                <div className="w-full p-4 border rounded-lg bg-gray-50">
                  Pre-Pay (Required for this venue)
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#cc0000] text-white p-4 rounded-full text-lg font-semibold
              hover:bg-[#aa0000] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Date Request'}
          </button>
        </form>
      </div>

      {showVenueList && (
        <div className="fixed inset-0 bg-white z-10">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setShowVenueList(false)}
                className="text-[#cc0000] font-semibold"
              >
                ← Back
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search venues in Boston"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {['All', 'Events', 'Restaurants', 'Activities'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat.toLowerCase())}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap 
                    ${selectedCategory === cat.toLowerCase() 
                      ? 'bg-[#cc0000] text-white' 
                      : 'bg-gray-100 text-gray-600'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y overflow-y-auto h-[calc(100vh-180px)]">
            {filteredVenues.map((venue) => (
              <div 
                key={venue.name}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleVenueSelect(venue.name)}
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                    <Image
                      src={venue.imageUrl}
                      alt={venue.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{venue.name}</h3>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>{venue.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">Available</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          {venue.rating}
                        </div>
                        {venue.price && (
                          <>
                            <span>•</span>
                            <span>{venue.price}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}