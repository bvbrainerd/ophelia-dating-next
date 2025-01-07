'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Search, Star, Users } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import VenueSelector from '@/components/VenueSelector';
import { Venue } from '@/types/venue';
import EventbriteEvents from '@/components/EventbriteEvents';
import Link from 'next/link';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

interface DateRequestForm {
  venue: string;
  proposed_time: string;
  split_payment: number | null;
}

interface QuizAnswers {
  idealDate: string;
}

const VENUES: Record<string, Venue[]> = {
  sports: [
    { 
      id: "boston-bruins",
      name: "Boston Bruins",
      location: "TD Garden",
      type: "Sports",
      rating: 4.7,
      price: "$$$",
      imageUrl: "/images/venues/bruins.jpg",
      stripeLink: "https://buy.stripe.com/00gg1ng5i1BzeWY6os",
      coordinates: [-71.0622, 42.3663],
      distance: "5.8 mi"
    },
    { 
      id: "celtics",
      name: "Celtics",
      location: "TD Garden",
      type: "Sports",
      rating: 4.7,
      price: "$$$",
      imageUrl: "/images/venues/celtics.jpg",
      stripeLink: "https://buy.stripe.com/5kA8yVf1e0xvg12eV0",
      coordinates: [-71.0622, 42.3663],
      distance: "5.8 mi"
    },
    { 
      id: "bc-hockey",
      name: "BC Hockey",
      location: "Conte Forum",
      type: "Sports",
      rating: 4.5,
      price: "$$",
      imageUrl: "/images/venues/bchockey.jpg",
      stripeLink: "https://buy.stripe.com/bIYcPb3iw6VT5mobIN",
      coordinates: [-71.1677, 42.3357],
      distance: "0.1 mi"
    },
    { 
      id: "bc-basketball",
      name: "BC Basketball",
      location: "Conte Forum",
      type: "Sports",
      rating: 4.5,
      price: "$$",
      imageUrl: "/images/venues/bcbasketball.jpg",
      stripeLink: "https://buy.stripe.com/fZebL7bP24NL9CE9AB",
      coordinates: [-71.1677, 42.3357],
      distance: "0.1 mi"
    }
  ],
  restaurants: [
    { 
      id: "barcelona-wine-bar",
      name: "Barcelona Wine Bar",
      location: "Boston, MA",
      type: "Spanish",
      price: "$$$",
      rating: 4.6,
      imageUrl: "/images/venues/barcelona.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0761, 42.3457],
      distance: "4.9 mi"
    },
    { 
      id: "capo",
      name: "Capo",
      location: "South Boston",
      type: "Italian",
      price: "$$$",
      rating: 4.5,
      imageUrl: "/images/venues/capo.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0424, 42.3363],
      distance: "6.7 mi"
    },
    { 
      id: "lolita-back-bay",
      name: "Lolita Back Bay",
      location: "Back Bay",
      type: "Mexican",
      price: "$$",
      rating: 4.5,
      imageUrl: "/images/venues/lolita.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0751, 42.3483],
      distance: "4.8 mi"
    },
    { 
      id: "blue-ribbon-sushi",
      name: "Blue Ribbon Sushi",
      location: "Boston, MA",
      type: "Japanese",
      price: "$$$$",
      rating: 4.7,
      imageUrl: "/images/venues/blueribbon.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0594, 42.3551],
      distance: "5.7 mi"
    },
    { 
      id: "lucca-north-end",
      name: "Lucca North End",
      location: "North End",
      type: "Italian",
      price: "$$$",
      rating: 4.6,
      imageUrl: "/images/venues/lucca.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0547, 42.3645],
      distance: "6.0 mi"
    },
    { 
      id: "joes-on-newbury",
      name: "Joes on Newbury",
      location: "Back Bay",
      type: "American",
      price: "$$",
      rating: 4.4,
      imageUrl: "/images/venues/joes.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0793, 42.3491],
      distance: "4.7 mi"
    },
    { 
      id: "kured",
      name: "Kured",
      location: "Beacon Hill",
      type: "Charcuterie",
      price: "$$",
      rating: 4.5,
      imageUrl: "/images/venues/kured.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0712, 42.3589],
      distance: "5.2 mi"
    },
    { 
      id: "branchline",
      name: "Branchline",
      location: "Brookline, MA",
      type: "American",
      price: "$$",
      rating: 4.6,
      imageUrl: "/images/venues/branchline.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.1407, 42.3523],
      distance: "1.5 mi"
    }
  ],
  activities: [
    { 
      id: "museum-of-fine-arts",
      name: "Museum of Fine Arts",
      location: "Boston, MA",
      type: "Culture",
      rating: 4.8,
      price: "$$",
      imageUrl: "/images/venues/museum.jpg",
      stripeLink: "https://buy.stripe.com/aEU8yV7yM5RP8yA3ce",
      coordinates: [-71.0995, 42.3394],
      distance: "3.6 mi"
    },
    { 
      id: "private-helicopter-ride",
      name: "Private Helicopter Ride",
      location: "Boston, MA",
      type: "Adventure",
      price: "$$$$",
      rating: 4.9,
      imageUrl: "/images/venues/helicopter.jpg",
      stripeLink: "https://buy.stripe.com/14k2ax7yM0xv6qs8wz",
      coordinates: [-71.0217, 42.3656],
      distance: "7.8 mi"
    },
    { 
      id: "f1-arcade",
      name: "F1 Arcade",
      location: "Boston, MA",
      type: "Entertainment",
      price: "$$",
      rating: 4.4,
      imageUrl: "/images/venues/f1arcade.jpg",
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.0595, 42.3501],
      distance: "5.7 mi"
    },
    { 
      id: "clay-room",
      name: "The Clay Room",
      location: "Boston, MA",
      type: "Creative",
      rating: 4.6,
      price: "$$",
      imageUrl: "/images/venues/clayroom.jpg",
      stripeLink: "https://buy.stripe.com/00g8yVaKYgwt4ikaEO",
      coordinates: [-71.1317, 42.3396],
      distance: "1.9 mi"
    },
    { 
      id: "boston-duck-tour",
      name: "Boston Duck Tour",
      location: "Downtown Boston",
      type: "Tour",
      price: "$$$",
      rating: 4.7,
      imageUrl: "/images/venues/ducktour.jpg",
      stripeLink: "https://buy.stripe.com/14k9CZbP20xv7uw28j",
      coordinates: [-71.0737, 42.3587],
      distance: "5.0 mi"
    }
  ],
  outdoors: [
    { 
      id: "boston-commons",
      name: "Boston Commons",
      location: "Boston, MA",
      type: "Park",
      rating: 4.7,
      price: "$",
      imageUrl: "/images/venues/commons.jpg",
      stripeLink: "https://buy.stripe.com/eVaaH31ao2FDbKM3ck",
      coordinates: [-71.0640, 42.3554],
      distance: "5.5 mi"
    }
  ]
};

const DEFAULT_AVATAR = '/images/default-avatar.png';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'sports', label: 'Sports' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'activities', label: 'Activities' },
  { id: 'events', label: 'Events' }
];

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
  const [userQuizAnswers, setUserQuizAnswers] = useState<QuizAnswers | null>(null);

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

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('dater_archetype')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserQuizAnswers({
            idealDate: profile.dater_archetype === 'Hopeless Romantic' ? 'Concert/Activity' :
                      profile.dater_archetype === 'Cautious Dater' ? 'Dinner or Bar' :
                      profile.dater_archetype === 'Serial Dater' ? 'Sports Game' :
                      'A fun group activity with friends'
          });
        }
      }
    };

    fetchUserProfile();
  }, []);

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

      const sendDateRequestNotification = async (receiverEmail: string, requestDetails: any) => {
        try {
          await fetch('/api/send-date-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: receiverEmail,
              requestDetails: {
                sender_name: requestDetails.sender_name,
                venue: requestDetails.venue,
                proposed_time: requestDetails.proposed_time,
                // Add any other details needed for the email template
              }
            })
          });
        } catch (error) {
          console.error('Error sending date request notification:', error);
        }
      };

      const requestDetails = {
        sender_name: session.user.email,
        venue: formData.venue,
        proposed_time: formData.proposed_time,
        receiver_email: profileId // Assuming profileId is the receiver's email
      };

      await sendDateRequestNotification(requestDetails.receiver_email, requestDetails);
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-5 pb-24">
        <Header variant="matching" />
        
        <div className="max-w-md mx-auto">
          <div 
            className="flex items-center gap-4 mb-8 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
            onClick={() => router.push(`/profile/${profileId}`)}
          >
            <div className="relative w-16 h-16">
              <Image
                src={profile.avatar_url || DEFAULT_AVATAR}
                alt={`${profile.first_name}'s avatar`}
                fill
                className="rounded-full object-cover"
                sizes="(max-width: 64px) 100vw, 64px"
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

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Date Location</h2>
              <VenueSelector 
                venues={VENUES}
                onVenueSelect={(venue) => setFormData({ ...formData, venue })}
                selectedVenue={formData.venue}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Date</h2>
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
                  className="w-full p-3 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Time</h2>
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
                  className="w-full p-3 border rounded-lg text-sm"
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

            <div className="space-y-2 mt-20">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#BA2525] text-white p-3 rounded-full text-base font-medium
                  hover:bg-[#a02020] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Date Request'}
              </button>

              <Link
                href="/matching"
                className="w-full block text-center bg-white text-[#BA2525] p-3 rounded-full text-base font-medium border-2 border-[#BA2525] hover:bg-[#ffeeee] transition-colors"
              >
                Back to Matches
              </Link>
            </div>
          </form>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}