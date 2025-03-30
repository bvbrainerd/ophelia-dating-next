'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import ProfileImage from '@/components/ProfileImage';
import { Card } from '@/components/ui/card';
import Map from '@/components/Map';
import { Heart, Home, Search, PlusCircle, Bell, User, MapPin, Star, Crown, Filter } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/supabase/client';
import { Heart as LucideHeart } from 'lucide-react';
import { prompt } from '@/app/fonts';
import { motion, AnimatePresence } from 'framer-motion';

interface Profile {
  id: string;
  first_name: string;
  age: number;
  avatar_url: string | null;
  bio: string;
  gender: 'male' | 'female' | 'other';
  preferred_gender: 'male' | 'female' | 'other';
  dater_archetype: 'cautiousDater' | 'hopelessRomantic' | 'serialDater' | 'commitmentSeeker' | 'friendWithBenefits';
  is_premium?: boolean;
  school?: string;
  location?: string;
  dater_status?: 'gold' | 'silver' | 'bronze' | null;
  average_rating?: number;
  follow_through_rate?: number;
  relationship_status: 'couple' | 'single' | null;
  couple_preferences?: {
    date_frequency?: string;
    preferred_activities?: string[];
    social_style?: string;
  };
  matchPercentage?: number;
  descriptors?: { category: 'Personality' | 'Interests' | 'Lifestyle'; label: string }[];
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

interface DatabaseMembership {
  groups: {
    id: string;
    name: string;
  }[];
}

interface SupabaseMembership {
  groups: {
    id: string;
    name: string;
  };
}

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

interface SuggestedDate {
  id: string;
  venue: string;
  proposedTime: string;
  matchedUser: Profile;
  compatibility: number;
  description: string;
}

interface DailyMatch {
  id: string;
  venue: string;
  proposed_time: string;
  compatibility: number;
  matched_user: Profile;
}

interface DatabaseMatch {
  id: string;
  venue: string;
  proposed_time: string;
  compatibility: number;
  matched_user: {
    id: string;
    first_name: string;
    age: number;
    avatar_url: string | null;
    bio: string;
    gender: 'male' | 'female' | 'other';
    preferred_gender: 'male' | 'female' | 'other';
    dater_archetype: 'cautiousDater' | 'hopelessRomantic' | 'serialDater' | 'commitmentSeeker' | 'friendWithBenefits';
    preferred_time?: 'morning' | 'afternoon' | 'evening';
    dater_status?: string;
    average_rating?: number;
    follow_through_rate?: number;
  };
}

interface CuratedDate {
  id: string;
  venue: string;
  proposed_time: string;
  description: string;
  price_range: string;
  date_type: string;
  availability: boolean;
  compatibility?: number;
  imageUrl?: string;
}

interface Mood {
  icon: string;
  label: string;
}

interface DateSuggestionProps {
  venue: string;
  description: string;
  compatibility: number;
  priceRange: string;
  imageUrl: string;
}

interface DateSuggestionData {
  venue: string;
  description: string;
  compatibility: number;
  priceRange: string;
  imageUrl: string;
  mood: string;
}

const DEFAULT_AVATAR = '/images/default-avatar.png';
const DAILY_MATCH_LIMIT = 10;
const DEFAULT_VENUE_IMAGE = 'https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/barcelona.jpg';

const getAvatarUrl = async (avatarPath: string | null) => {
  if (!avatarPath) {
    console.log('No avatar path provided, using default');
    return DEFAULT_AVATAR;
  }

  try {
    // If it's a static image or default avatar, return it directly
    if (avatarPath.includes('default-avatar') || avatarPath.startsWith('/images/')) {
      return avatarPath;
    }

    // Get the Supabase URL from environment variable
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('Supabase URL not found in environment');
      return DEFAULT_AVATAR;
    }

    // If it's already a full URL, clean it up
    if (avatarPath.startsWith('http')) {
      const url = new URL(avatarPath);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      return `${supabaseUrl}/storage/v1/object/public/avatars/${filename}`;
    }

    // For relative paths, clean up the filename
    const filename = avatarPath
      .replace(/^avatars\//, '')  // Remove leading avatars/
      .split('?')[0];             // Remove query parameters

    // Return the direct public URL
    return `${supabaseUrl}/storage/v1/object/public/avatars/${filename}`;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return DEFAULT_AVATAR;
  }
};

const getRandomVenueForArchetype = (archetype: string): string => {
  const venuesByArchetype: Record<string, string[]> = {
    'cautiousDater': ['Kured', 'The Clay Room', "Joe's On Newbury", 'Cityside'],
    'hopelessRomantic': ['Barcelona Wine Bar', 'Museum of Fine Arts', 'Blue Ribbon Sushi', 'Boston Common'],
    'serialDater': ['TD Garden - Bruins', 'BC Basketball', 'F1 Boston', 'Lolita Back Bay'],
    'commitmentSeeker': ['BC Hockey', 'TD Garden - Celtics', 'Lucca', 'Barcelona Wine Bar'],
    'friendWithBenefits': ['Capo', 'TD Garden - Bruins', 'F1 Boston', 'Cityside']
  };

  const venues = venuesByArchetype[archetype] || venuesByArchetype['cautiousDater'];
  return venues[Math.floor(Math.random() * venues.length)];
};

function formatDateString(date: Date): string {
  return date.toISOString();
}

function getTimeForPreference(frequency: string, baseDate: Date, venueName: string): Date {
  // Create a hash from the venue name to get consistent but random-looking times
  const hash = venueName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Set hours between 6 PM and 9 PM based on the hash
  const hours = 18 + (hash % 4); // This will give us 6 PM to 9 PM
  const minutes = hash % 60; // Random minutes based on the hash
  
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  
  return date;
}

function calculateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString());
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function calculateAvailability(date: Date): boolean {
  // Add your availability calculation logic here
  return true; // Placeholder return
}

type ArchetypeKey = 'Cautious Dater' | 'Hopeless Romantic' | 'Serial Dater' | 'Commitment Seeker' | 'Friend with Benefits';

type CompatibilityMatrix = {
  [K in ArchetypeKey]: {
    [L in ArchetypeKey]: number;
  };
};

const calculateArchetypeCompatibility = (userArchetype: string, matchArchetype: string): number => {
  const compatibilityMatrix: CompatibilityMatrix = {
    'Cautious Dater': {
      'Cautious Dater': 95,
      'Hopeless Romantic': 85,
      'Serial Dater': 40,
      'Commitment Seeker': 90,
      'Friend with Benefits': 30
    },
    'Hopeless Romantic': {
      'Cautious Dater': 85,
      'Hopeless Romantic': 95,
      'Serial Dater': 70,
      'Commitment Seeker': 90,
      'Friend with Benefits': 30
    },
    'Serial Dater': {
      'Cautious Dater': 40,
      'Hopeless Romantic': 70,
      'Serial Dater': 95,
      'Commitment Seeker': 80,
      'Friend with Benefits': 85
    },
    'Commitment Seeker': {
      'Cautious Dater': 90,
      'Hopeless Romantic': 90,
      'Serial Dater': 80,
      'Commitment Seeker': 95,
      'Friend with Benefits': 30
    },
    'Friend with Benefits': {
      'Cautious Dater': 30,
      'Hopeless Romantic': 30,
      'Serial Dater': 85,
      'Commitment Seeker': 30,
      'Friend with Benefits': 95
    }
  };

  // Convert database archetype format to matrix format
  const formatArchetype = (dbArchetype: string): ArchetypeKey => {
    const mapping: { [key: string]: ArchetypeKey } = {
      'cautiousDater': 'Cautious Dater',
      'hopelessRomantic': 'Hopeless Romantic',
      'serialDater': 'Serial Dater',
      'commitmentSeeker': 'Commitment Seeker',
      'friendWithBenefits': 'Friend with Benefits'
    };
    return mapping[dbArchetype] || 'Commitment Seeker';
  };

  const formattedUserArchetype = formatArchetype(userArchetype);
  const formattedMatchArchetype = formatArchetype(matchArchetype);

  return compatibilityMatrix[formattedUserArchetype]?.[formattedMatchArchetype] || 70;
};

const venueCoordinates: Record<string, [number, number]> = {
  'Blue Ribbon Sushi': [-71.0594, 42.3551],
  'Barcelona Wine Bar': [-71.0761, 42.3457],
  'Cityside': [-71.1502, 42.3359],
  "Loretta's Last Call": [-71.0950, 42.3467],
  'BC Basketball': [-71.1677, 42.3357],
  'BC Hockey': [-71.1677, 42.3357],
  'TD Garden - Celtics': [-71.0622, 42.3663],
  'F1 Boston': [-71.0595, 42.3501],
  'Museum of Fine Arts': [-71.0942, 42.3394],
  'Boston Common': [-71.0670, 42.3554],
  'Kured': [-71.0712, 42.3589],
  'The Clay Room': [-71.1317, 42.3396],
  "Joe's On Newbury": [-71.0793, 42.3491],
  'Lucca': [-71.0567, 42.3647],
  'Lolita Back Bay': [-71.0816, 42.3486],
  'Capo': [-71.0472, 42.3359],
  'View Boston': [-71.0478, 42.3515]
};

const stripeLinks: { [key: string]: string } = {
  'TD Garden - Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Hockey': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
  'BC Basketball': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
  'Boston Common': 'https://buy.stripe.com/eVaaH31ao2FDbKM3ck',
  'Kured': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'Barcelona Wine Bar': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Capo': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'F1 Boston': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Lucca': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Lolita Back Bay': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'Blue Ribbon Sushi': 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  "Joe's On Newbury": 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc',
  'The Clay Room': 'https://buy.stripe.com/00g8yVaKYgwt4ikaEO',
  "Loretta's Last Call": 'https://buy.stripe.com/bIYeXj06k7ZX2acfZc'
};

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#cc0000] flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
      <BottomNav />
    </div>
  );
}

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

const dateSuggestionsByMood = {
  food: [
    {
      venue: "Barcelona Wine Bar",
      description: "Tapas and wine bar with a lively atmosphere",
      imageUrl: "barcelona.jpg",
      quality: 4.8,
      priceRange: "$$$",
      mood: "food"
    },
    {
      venue: "Blue Ribbon Sushi",
      description: "High-end sushi experience with exceptional omakase",
      imageUrl: "blueribbon.jpg",
      quality: 4.7,
      priceRange: "$$$",
      mood: "food"
    },
    {
      venue: "Bartaco",
      description: "Upscale street food & craft cocktails in a vibrant atmosphere",
      imageUrl: "bartaco.jpg",
      quality: 4.5,
      priceRange: "$$",
      mood: "food"
    },
    {
      venue: "Lolita Back Bay",
      description: "Modern Mexican cuisine and cocktails",
      imageUrl: "lolita.jpg",
      quality: 4.6,
      priceRange: "$$$",
      mood: "food"
    },
    {
      venue: "Lucca",
      description: "Upscale Italian dining with handmade pasta",
      imageUrl: "lucca.jpg",
      quality: 4.7,
      priceRange: "$$$",
      mood: "food"
    },
    {
      venue: "Boston Burger Company",
      description: "Creative burgers in a casual setting",
      imageUrl: "bostonburger.jpg",
      quality: 4.3,
      priceRange: "$$",
      mood: "food"
    },
    {
      venue: "Branchline",
      description: "Modern American cuisine with rotisserie focus",
      imageUrl: "branchline.jpg",
      quality: 4.3,
      priceRange: "$$",
      mood: "food"
    },
    {
      venue: "Buttermilk & Bourbon",
      description: "Southern comfort food in an intimate atmosphere",
      imageUrl: "buttermilkandbourbon.jpg",
      quality: 4.3,
      priceRange: "$$$",
      mood: "food"
    },
    {
      venue: "Carmelina's",
      description: "Authentic Italian cuisine in the North End",
      imageUrl: "carmelinas.jpg",
      quality: 4.3,
      priceRange: "$$$",
      mood: "food"
    },
    {
      venue: "Cityside",
      description: "Classic American pub with comfort food and drinks",
      imageUrl: "cityside.jpg",
      quality: 4.3,
      priceRange: "$$",
      mood: "food"
    },
    {
      venue: "City Tap House",
      description: "Craft beer bar with elevated pub fare",
      imageUrl: "citytap.jpg",
      quality: 4.3,
      priceRange: "$$",
      mood: "food"
    },
    {
      venue: "Clerys",
      description: "Popular sports bar with classic pub fare",
      imageUrl: "clerys.jpg",
      quality: 4.3,
      priceRange: "$$",
      mood: "food"
    },
    {
      venue: "Coquette",
      description: "French-inspired coastal cuisine",
      imageUrl: "coquette.jpg",
      quality: 4.3,
      priceRange: "$$$",
      mood: "food"
    },
    {
      venue: "Tatte Bakery & Cafe",
      description: "Artisanal bakery and cafe with Mediterranean influence",
      imageUrl: "tatte.jpg",
      quality: 4.7,
      priceRange: "$$",
      mood: "food"
    },
    {
      venue: "Trident Booksellers & Cafe",
      description: "Cozy bookstore cafe with all-day breakfast",
      imageUrl: "trident.jpg",
      quality: 4.5,
      priceRange: "$$",
      mood: "food"
    },
    {
      venue: "Fuji at Ink Block",
      description: "Contemporary Japanese cuisine and sushi",
      compatibility: 4.6,
      priceRange: "$$$",
      imageUrl: "fujiatinkblock.jpg",
      mood: "dining"
    },
    {
      venue: "George Howell Coffee",
      description: "Premium coffee shop with expert baristas.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "georgehowellcoffee.jpg",
      mood: "chill"
    },
    {
      venue: "Great Scott",
      description: "Iconic live music venue.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "greateastbar.jpg",
      mood: "entertainment"
    },
    {
      venue: "The Greatest Bar",
      description: "Multi-level sports bar and entertainment venue.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "greatestbar.jpg",
      mood: "entertainment"
    },
    {
      venue: "Greystone Cafe",
      description: "Casual cafe with breakfast and lunch options.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "greystonecafe.jpg",
      mood: "chill"
    },
    {
      venue: "Grill 23",
      description: "Upscale steakhouse with elegant atmosphere.",
      compatibility: 4.3,
      priceRange: "$$$$",
      imageUrl: "grill23.jpg",
      mood: "dining"
    },
    {
      venue: "House of Blues",
      description: "Live music venue with southern-inspired cuisine.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "houseofblues.jpg",
      mood: "entertainment"
    },
    {
      venue: "Hunter's Kitchen & Bar",
      description: "Modern American cuisine with craft cocktails.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "hunters.jpg",
      mood: "dining"
    },
    {
      venue: "Joe's On Newbury",
      description: "Classic American dining with a cozy atmosphere.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "joes.jpg",
      mood: "dining"
    },
    {
      venue: "JP Licks",
      description: "Local ice cream shop with unique flavors.",
      compatibility: 4.3,
      priceRange: "$",
      imageUrl: "jplicks.jpg",
      mood: "chill"
    },
    {
      venue: "Kava Neo-Taverna",
      description: "Greek cuisine in a modern setting.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "kava.jpg",
      mood: "dining"
    },
    {
      venue: "Krasi",
      description: "Greek wine bar with Mediterranean small plates.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "krasi.jpg",
      mood: "dining"
    },
    {
      venue: "Kured",
      description: "Artisanal charcuterie and wine bar.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "kured.jpg",
      mood: "dining"
    },
    {
      venue: "Lansdowne Pub",
      description: "Irish pub with live music near Fenway.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "lansdowne.jpg",
      mood: "entertainment"
    },
    {
      venue: "Levain Bakery",
      description: "Famous cookies and fresh baked goods.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "levain.jpg",
      mood: "chill"
    },
    {
      venue: "Lincoln Tavern",
      description: "Modern American tavern with craft cocktails.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "lincoln.jpg",
      mood: "dining"
    },
    {
      venue: "Loco Taqueria",
      description: "Vibrant Mexican restaurant & tequila bar.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "loco.jpg",
      mood: "dining"
    },
    {
      venue: "Lolita Back Bay",
      description: "Trendy Mexican restaurant & bar with creative cocktails.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "lolitabackbay.jpg",
      mood: "dining"
    },
    {
      venue: "Lookout Rooftop",
      description: "Stylish rooftop bar with panoramic city views.",
      compatibility: 4.5,
      priceRange: "$$$",
      imageUrl: "lookout.jpg",
      mood: "entertainment"
    },
    {
      venue: "Loretta's Last Call",
      description: "Country music bar with live performances and dancing.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "lorettas.jpg",
      mood: "entertainment"
    },
    {
      venue: "Lucca",
      description: "Upscale Italian cuisine in historic North End.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "lucca.jpg",
      mood: "dining"
    },
    {
      venue: "Lucky's Lounge",
      description: "Retro-style lounge with live music.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "luckyslounge.jpg",
      mood: "entertainment"
    },
    {
      venue: "Madeline's Candy",
      description: "Artisanal candy shop with unique treats.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "madelinescandy.jpg",
      mood: "chill"
    },
    {
      venue: "Museum of Fine Arts",
      description: "Explore world-class art collections and special exhibitions at Boston's premier art museum.",
      compatibility: 4.5,
      priceRange: "$$$",
      imageUrl: "mfa.jpg",
      mood: "arts"
    },
    {
      venue: "Mida",
      description: "Modern Italian cuisine with a creative twist.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "mida.jpg",
      mood: "dining"
    },
    {
      venue: "Mike & Patty's",
      description: "Gourmet breakfast sandwiches.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "mikeandpattys.jpg",
      mood: "dining"
    },
    {
      venue: "Mooo....",
      description: "Sophisticated steakhouse in Beacon Hill.",
      compatibility: 4.3,
      priceRange: "$$$$",
      imageUrl: "moo.jpg",
      mood: "dining"
    },
    {
      venue: "Museum of Ice Cream",
      description: "Interactive and immersive ice cream-themed exhibits.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "museumoficecream.jpg",
      mood: "arts"
    },
    {
      venue: "Parla",
      description: "Intimate Italian restaurant & cocktail bar.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "parla.jpg",
      mood: "dining"
    },
    {
      venue: "Phin Coffee House",
      description: "Vietnamese coffee and light bites.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "phincoffeehouse.jpg",
      mood: "chill"
    },
    {
      venue: "Pop Up Bagel",
      description: "Fresh bagels and creative spreads.",
      compatibility: 4.3,
      priceRange: "$",
      imageUrl: "popupbagel.jpg",
      mood: "chill"
    },
    {
      venue: "Pressed Cafe",
      description: "Healthy bowls and fresh pressed juices.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "pressed.jpg",
      mood: "chill"
    },
    {
      venue: "Puttshack",
      description: "High-tech mini golf experience with food and drinks.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "puttshack.jpg",
      mood: "entertainment"
    },
    {
      venue: "Scholar's",
      description: "Upscale pub with classic American fare.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "scholars.jpg",
      mood: "dining"
    },
    {
      venue: "Serafina",
      description: "Italian restaurant with vibrant atmosphere.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "serafina.jpg",
      mood: "dining"
    },
    {
      venue: "[solidcore]",
      description: "Intense, full-body workout on reformer machines.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "solidcore.jpg",
      mood: "adventurous"
    },
    {
      venue: "South End Buttery",
      description: "Charming cafe and bakery.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "southendbuttery.jpg",
      mood: "chill"
    },
    {
      venue: "Stats Bar & Grille",
      description: "Sports bar with elevated pub fare.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "stats.jpg",
      mood: "entertainment"
    },
    {
      venue: "Sweetgreen",
      description: "Fresh, seasonal salads and warm bowls.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "sweetgreen.jpg",
      mood: "dining"
    },
    {
      venue: "Tatte",
      description: "Artisanal bakery & cafe with Mediterranean influence.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "tatte.jpg",
      mood: "chill"
    },
    {
      venue: "The Burren",
      description: "Irish pub with live music and traditional fare.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "theburren.jpg",
      mood: "entertainment"
    },
    {
      venue: "The Harp",
      description: "Irish pub near TD Garden.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "theharp.jpg",
      mood: "entertainment"
    },
    {
      venue: "Trattoria il Panino",
      description: "Traditional Italian dining in the North End.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "trattoriailpanino.jpg",
      mood: "dining"
    },
    {
      venue: "View Boston",
      description: "Observatory offering 360-degree views of Boston.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "viewboston.jpg",
      mood: "entertainment"
    },
    {
      venue: "West End Johnnie's",
      description: "Sports bar with American comfort food.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "westendjohnnies.jpg",
      mood: "entertainment"
    },
    {
      venue: "White Mountain Creamery",
      description: "Local ice cream shop with homemade flavors.",
      compatibility: 4.3,
      priceRange: "$",
      imageUrl: "whitemountain.jpg",
      mood: "chill"
    },
    {
      venue: "WNDR Museum",
      description: "Immersive art and technology museum experience.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "wndrmuseum.jpg",
      mood: "arts"
    },
    {
      venue: "Farmers Horse Coffee",
      description: "Cozy cafe with artisanal coffee and pastries.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "farmershorsecoffee.jpg",
      mood: "chill"
    },
    {
      venue: "Fuji at Ink Block",
      description: "Contemporary Japanese cuisine and sushi.",
      compatibility: 4.6,
      priceRange: "$$$",
      imageUrl: "fujiatinkblock.jpg",
      mood: "dining"
    },
    {
      venue: "George Howell Coffee",
      description: "Premium coffee shop with expert baristas.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "georgehowellcoffee.jpg",
      mood: "chill"
    }
  ],
  arts: [
    { venue: 'Museum of Fine Arts', description: 'Explore world-class art collections in a beautiful setting.', compatibility: 4.8, priceRange: '$$', imageUrl: 'mfa.jpg', mood: 'arts' },
    { venue: 'The Clay Room', description: 'Creative pottery painting studio perfect for dates.', compatibility: 4.4, priceRange: '$$', imageUrl: 'clayroom.jpg', mood: 'arts' },
    { venue: 'Museum of Ice Cream', description: 'Interactive ice cream-themed exhibits.', compatibility: 4.4, priceRange: '$$', imageUrl: 'museumoficecream.jpg', mood: 'arts' },
    { venue: 'WNDR Museum', description: 'Immersive art and technology museum experience.', compatibility: 4.3, priceRange: '$$', imageUrl: 'wndrmuseum.jpg', mood: 'arts' }
  ],
  entertainment: [
    { venue: 'TD Garden - Bruins', description: 'Experience the excitement of live NHL hockey.', compatibility: 4.5, priceRange: '$$$', imageUrl: 'bruins.jpg', mood: 'entertainment' },
    { venue: 'TD Garden - Celtics', description: 'Catch an NBA game in historic Boston.', compatibility: 4.6, priceRange: '$$$', imageUrl: 'celtics.jpg', mood: 'entertainment' },
    { venue: 'BC Basketball', description: 'College basketball atmosphere at its finest.', compatibility: 4.4, priceRange: '$$', imageUrl: 'bcbasketball.jpg', mood: 'entertainment' },
    { venue: 'BC Hockey', description: 'Experience collegiate hockey at its best.', compatibility: 4.5, priceRange: '$$', imageUrl: 'bchockey.jpg', mood: 'entertainment' },
    { venue: 'BC Lacrosse', description: 'Fast-paced college lacrosse matches.', compatibility: 4.3, priceRange: '$$', imageUrl: 'bclacrosse.jpg', mood: 'entertainment' },
    { venue: 'House of Blues', description: 'Live music venue with southern-inspired cuisine.', compatibility: 4.4, priceRange: '$$', imageUrl: 'houseofblues.jpg', mood: 'entertainment' },
    { venue: 'Puttshack', description: 'High-tech mini golf with food and drinks.', compatibility: 4.5, priceRange: '$$', imageUrl: 'puttshack.jpg', mood: 'entertainment' }
  ],
  adventure: [
    { venue: 'F1 Boston', description: 'High-speed indoor karting experience.', compatibility: 4.7, priceRange: '$$', imageUrl: 'f1arcade.jpg', mood: 'adventure' },
    { venue: 'Boston Duck Tours', description: 'Unique land and water tour of Boston.', compatibility: 4.5, priceRange: '$$', imageUrl: 'ducktour.jpg', mood: 'adventure' },
    { venue: 'Private Helicopter Tour', description: 'Breathtaking aerial views of Boston\'s skyline.', compatibility: 4.9, priceRange: '$$$$', imageUrl: 'helicopter.jpg', mood: 'adventure' },
    { venue: '[solidcore]', description: 'Intense, full-body workout experience.', compatibility: 4.2, priceRange: '$$', imageUrl: 'solidcore.jpg', mood: 'adventure' },
    { venue: 'Barry\'s Bootcamp', description: 'High-intensity interval training in a fun atmosphere.', compatibility: 4.3, priceRange: '$$', imageUrl: 'barrys.jpg', mood: 'adventure' },
    { venue: 'CorePower Yoga', description: 'Dynamic, fitness-focused yoga classes.', compatibility: 4.2, priceRange: '$$', imageUrl: 'corepower.jpg', mood: 'adventure' }
  ],
  chill: [
    {
      venue: "Tatte Bakery & Cafe",
      description: "Artisanal bakery and cafe with Mediterranean influence",
      imageUrl: "tatte.jpg",
      quality: 4.7,
      priceRange: "$$"
    },
    {
      venue: "Trident Booksellers & Cafe",
      description: "Cozy bookstore cafe with all-day breakfast",
      imageUrl: "trident.jpg",
      quality: 4.5,
      priceRange: "$$"
    },
    {
      venue: "Cityside",
      description: "Casual neighborhood bar with comfort food",
      imageUrl: "cityside.jpg",
      quality: 4.3,
      priceRange: "$$"
    },
    {
      venue: "Kured",
      description: "Artisanal charcuterie and wine bar.",
      compatibility: 4.5,
      priceRange: "$$",
      imageUrl: "kured.jpg",
      mood: "chill"
    },
    {
      venue: "Tatte",
      description: "Artisanal bakery & cafe with Mediterranean influence.",
      compatibility: 4.4,
      priceRange: "$$",
      imageUrl: "tatte.jpg",
      mood: "chill"
    },
    {
      venue: "Kured",
      description: "Artisanal charcuterie and wine bar.",
      compatibility: 4.5,
      priceRange: "$$",
      imageUrl: "kured.jpg",
      mood: "chill"
    }
  ]
};

const CuratedDatesView = ({ userProfile, dateSuggestions }: { userProfile: Profile; dateSuggestions: DateSuggestionData[] }) => {
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
};

const DateSuggestion = ({ venue, description, compatibility, priceRange, imageUrl }: DateSuggestionProps) => {
  const [error, setError] = useState(false);
  const DEFAULT_IMAGE = 'https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/barcelona.jpg';

  const getImageUrl = (url: string) => {
    // If URL is already a full path or starts with http, return as is
    if (url.startsWith('http')) {
      return url;
    }
    // Use Supabase storage URL for venue images
    return `https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/${url}`;
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg transition-transform hover:translate-y-[-4px]">
      <div className="relative h-48">
        <Image
          src={error ? DEFAULT_IMAGE : getImageUrl(imageUrl)}
          alt={venue}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => {
            console.error('Image failed to load:', imageUrl);
            setError(true);
          }}
        />
      </div>
      <div className="p-6">
        <div className="flex gap-2 mb-3">
          <span className="text-sm px-4 py-1 bg-gray-100 rounded-full text-gray-600">Perfect for Couples</span>
          <span className="text-sm px-4 py-1 bg-gray-100 rounded-full text-gray-600">{priceRange}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-semibold">{venue}</h3>
          <span className="text-gray-600">★ {compatibility.toFixed(1)}</span>
        </div>
        <p className="text-gray-600 mb-6 line-clamp-3">{description}</p>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Boston, MA</div>
            <div className="text-gray-700 font-medium">{priceRange}</div>
          </div>
          <button className="bg-[#cc0000] text-white px-8 py-2.5 rounded-full font-medium hover:bg-[#aa0000] transition-colors">
            Book Experience
          </button>
        </div>
      </div>
    </div>
  );
};

// Update the dater status calculation based on follow-through rate
const calculateDaterStatus = (followThroughRate: number | null | undefined): 'gold' | 'silver' | 'bronze' => {
  if (!followThroughRate) return 'bronze';
  
  const rate = followThroughRate * 100;
  if (rate >= 90) return 'gold';
  if (rate >= 75) return 'silver';
  return 'bronze';
};

const calculateMatchPercentage = (userProfile: Profile, otherProfile: Profile): number => {
  // Base compatibility on archetype matching
  const archetypeCompatibility = calculateArchetypeCompatibility(userProfile.dater_archetype, otherProfile.dater_archetype);
  
  // Additional factors
  let score = archetypeCompatibility;
  
  // School match (small bonus)
  if (userProfile.school === otherProfile.school) {
    score += 5;
  }

  // Location match (small bonus)
  if (userProfile.location === otherProfile.location) {
    score += 5;
  }

  // Cap at 100%
  return Math.min(100, Math.round(score));
};

function MatchingPageContent() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 10;
  const [dateSuggestions, setDateSuggestions] = useState<DateSuggestionData[]>([
    // Dining Venues
    {
      venue: "Barcelona Wine Bar",
      description: "Spanish tapas and extensive wine selection in an intimate setting.",
      compatibility: 4.5,
      priceRange: "$$$",
      imageUrl: "barcelona.jpg",
      mood: "dining"
    },
    {
      venue: "Barry's Bootcamp",
      description: "High-intensity interval training in a fun atmosphere.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "barrys.jpg",
      mood: "adventurous"
    },
    {
      venue: "Bartaco",
      description: "Upscale street food & craft cocktails.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "bartaco.jpg",
      mood: "dining"
    },
    {
      venue: "BC Basketball",
      description: "Exciting college basketball action.",
      compatibility: 4.4,
      priceRange: "$$",
      imageUrl: "bcbasketball.jpg",
      mood: "entertainment"
    },
    {
      venue: "BC Hockey",
      description: "Thrilling college hockey games.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "bchockey.jpg",
      mood: "entertainment"
    },
    {
      venue: "BC Lacrosse",
      description: "Fast-paced college lacrosse matches.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "bclacrosse.jpg",
      mood: "entertainment"
    },
    {
      venue: "Bell in Hand",
      description: "Historic tavern with live music.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "bellinhand.jpg",
      mood: "entertainment"
    },
    {
      venue: "Blank Street Coffee",
      description: "Modern coffee shop with quality brews.",
      compatibility: 4.3,
      priceRange: "$",
      imageUrl: "blankstreetcoffee.jpg",
      mood: "chill"
    },
    {
      venue: "Blue Ribbon Sushi",
      description: "High-end sushi restaurant with intimate atmosphere.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "blueribbon.jpg",
      mood: "dining"
    },
    {
      venue: "Boston Burger Company",
      description: "Creative burgers in a casual setting.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "bostonburger.jpg",
      mood: "dining"
    },
    {
      venue: "Branchline",
      description: "Modern American cuisine with rotisserie focus.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "branchline.jpg",
      mood: "dining"
    },
    {
      venue: "Brick Street Bagels",
      description: "Fresh bagels and coffee in a cozy atmosphere.",
      compatibility: 4.3,
      priceRange: "$",
      imageUrl: "brickstreetbagels.jpg",
      mood: "chill"
    },
    {
      venue: "TD Garden - Bruins",
      description: "Home of the Boston Bruins - exciting NHL hockey action.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "bruins.jpg",
      mood: "entertainment"
    },
    {
      venue: "Buttermilk & Bourbon",
      description: "Southern comfort food in an intimate atmosphere.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "buttermilkandbourbon.jpg",
      mood: "dining"
    },
    {
      venue: "Carmelina's",
      description: "Authentic Italian cuisine in the North End.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "carmelinas.jpg",
      mood: "dining"
    },
    {
      venue: "Cask 'n Flagon",
      description: "Iconic sports bar near Fenway Park.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "caskflagon.jpg",
      mood: "entertainment"
    },
    {
      venue: "TD Garden - Celtics",
      description: "Watch the legendary Boston Celtics play basketball.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "celtics.jpg",
      mood: "entertainment"
    },
    {
      venue: "Cityside",
      description: "Classic American pub with comfort food and drinks.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "cityside.jpg",
      mood: "dining"
    },
    {
      venue: "City Tap House",
      description: "Craft beer bar with elevated pub fare.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "citytap.jpg",
      mood: "dining"
    },
    {
      venue: "The Clay Room",
      description: "Creative pottery painting and ceramics studio.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "clayroom.jpg",
      mood: "arts"
    },
    {
      venue: "Clerys",
      description: "Popular sports bar with classic pub fare.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "clerys.jpg",
      mood: "entertainment"
    },
    {
      venue: "Boston Common",
      description: "Historic park perfect for casual strolls and picnics.",
      compatibility: 4.3,
      priceRange: "$",
      imageUrl: "commons.jpg",
      mood: "chill"
    },
    {
      venue: "Coquette",
      description: "French-inspired coastal cuisine.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "coquette.jpg",
      mood: "dining"
    },
    {
      venue: "CorePower Yoga",
      description: "Dynamic, fitness-focused yoga classes.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "corepower.jpg",
      mood: "adventurous"
    },
    {
      venue: "Boston Duck Tours",
      description: "Unique tour of Boston by land and water.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "ducktour.jpg",
      mood: "entertainment"
    },
    {
      venue: "Escape Room",
      description: "Interactive puzzle-solving adventure.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "escaperoom.jpg",
      mood: "entertainment"
    },
    {
      venue: "F1 Boston",
      description: "High-tech racing simulators and gaming experience.",
      compatibility: 4.6,
      priceRange: "$$$",
      imageUrl: "f1arcade.jpg",
      mood: "adventurous"
    },
    {
      venue: "Faneuil Hall",
      description: "Historic marketplace with shops and restaurants.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "faneuilhall.jpg",
      mood: "entertainment"
    },
    {
      venue: "Farmers Horse Coffee",
      description: "Cozy cafe with artisanal coffee and pastries.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "farmershorsecoffee.jpg",
      mood: "chill"
    },
    {
      venue: "Fuji at Ink Block",
      description: "Contemporary Japanese cuisine and sushi.",
      compatibility: 4.6,
      priceRange: "$$$",
      imageUrl: "fujiatinkblock.jpg",
      mood: "dining"
    },
    {
      venue: "George Howell Coffee",
      description: "Premium coffee shop with expert baristas.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "georgehowellcoffee.jpg",
      mood: "chill"
    },
    {
      venue: "Great Scott",
      description: "Iconic live music venue.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "greateastbar.jpg",
      mood: "entertainment"
    },
    {
      venue: "The Greatest Bar",
      description: "Multi-level sports bar and entertainment venue.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "greatestbar.jpg",
      mood: "entertainment"
    },
    {
      venue: "Greystone Cafe",
      description: "Casual cafe with breakfast and lunch options.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "greystonecafe.jpg",
      mood: "chill"
    },
    {
      venue: "Grill 23",
      description: "Upscale steakhouse with elegant atmosphere.",
      compatibility: 4.3,
      priceRange: "$$$$",
      imageUrl: "grill23.jpg",
      mood: "dining"
    },
    {
      venue: "House of Blues",
      description: "Live music venue with southern-inspired cuisine.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "houseofblues.jpg",
      mood: "entertainment"
    },
    {
      venue: "Hunter's Kitchen & Bar",
      description: "Modern American cuisine with craft cocktails.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "hunters.jpg",
      mood: "dining"
    },
    {
      venue: "Joe's On Newbury",
      description: "Classic American dining with a cozy atmosphere.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "joes.jpg",
      mood: "dining"
    },
    {
      venue: "JP Licks",
      description: "Local ice cream shop with unique flavors.",
      compatibility: 4.3,
      priceRange: "$",
      imageUrl: "jplicks.jpg",
      mood: "chill"
    },
    {
      venue: "Kava Neo-Taverna",
      description: "Greek cuisine in a modern setting.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "kava.jpg",
      mood: "dining"
    },
    {
      venue: "Krasi",
      description: "Greek wine bar with Mediterranean small plates.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "krasi.jpg",
      mood: "dining"
    },
    {
      venue: "Kured",
      description: "Artisanal charcuterie and wine bar.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "kured.jpg",
      mood: "dining"
    },
    {
      venue: "Lansdowne Pub",
      description: "Irish pub with live music near Fenway.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "lansdowne.jpg",
      mood: "entertainment"
    },
    {
      venue: "Levain Bakery",
      description: "Famous cookies and fresh baked goods.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "levain.jpg",
      mood: "chill"
    },
    {
      venue: "Lincoln Tavern",
      description: "Modern American tavern with craft cocktails.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "lincoln.jpg",
      mood: "dining"
    },
    {
      venue: "Loco Taqueria",
      description: "Vibrant Mexican restaurant & tequila bar.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "loco.jpg",
      mood: "dining"
    },
    {
      venue: "Lolita Back Bay",
      description: "Trendy Mexican restaurant & bar with creative cocktails.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "lolitabackbay.jpg",
      mood: "dining"
    },
    {
      venue: "Lookout Rooftop",
      description: "Stylish rooftop bar with panoramic city views.",
      compatibility: 4.5,
      priceRange: "$$$",
      imageUrl: "lookout.jpg",
      mood: "entertainment"
    },
    {
      venue: "Loretta's Last Call",
      description: "Country music bar with live performances and dancing.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "lorettas.jpg",
      mood: "entertainment"
    },
    {
      venue: "Lucca",
      description: "Upscale Italian cuisine in historic North End.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "lucca.jpg",
      mood: "dining"
    },
    {
      venue: "Lucky's Lounge",
      description: "Retro-style lounge with live music.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "luckyslounge.jpg",
      mood: "entertainment"
    },
    {
      venue: "Madeline's Candy",
      description: "Artisanal candy shop with unique treats.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "madelinescandy.jpg",
      mood: "chill"
    },
    {
      venue: "Museum of Fine Arts",
      description: "Explore world-class art collections and special exhibitions at Boston's premier art museum.",
      compatibility: 4.5,
      priceRange: "$$$",
      imageUrl: "mfa.jpg",
      mood: "arts"
    },
    {
      venue: "Mida",
      description: "Modern Italian cuisine with a creative twist.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "mida.jpg",
      mood: "dining"
    },
    {
      venue: "Mike & Patty's",
      description: "Gourmet breakfast sandwiches.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "mikeandpattys.jpg",
      mood: "dining"
    },
    {
      venue: "Mooo....",
      description: "Sophisticated steakhouse in Beacon Hill.",
      compatibility: 4.3,
      priceRange: "$$$$",
      imageUrl: "moo.jpg",
      mood: "dining"
    },
    {
      venue: "Museum of Ice Cream",
      description: "Interactive and immersive ice cream-themed exhibits.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "museumoficecream.jpg",
      mood: "arts"
    },
    {
      venue: "Parla",
      description: "Intimate Italian restaurant & cocktail bar.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "parla.jpg",
      mood: "dining"
    },
    {
      venue: "Phin Coffee House",
      description: "Vietnamese coffee and light bites.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "phincoffeehouse.jpg",
      mood: "chill"
    },
    {
      venue: "Pop Up Bagel",
      description: "Fresh bagels and creative spreads.",
      compatibility: 4.3,
      priceRange: "$",
      imageUrl: "popupbagel.jpg",
      mood: "chill"
    },
    {
      venue: "Pressed Cafe",
      description: "Healthy bowls and fresh pressed juices.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "pressed.jpg",
      mood: "chill"
    },
    {
      venue: "Puttshack",
      description: "High-tech mini golf experience with food and drinks.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "puttshack.jpg",
      mood: "entertainment"
    },
    {
      venue: "Scholar's",
      description: "Upscale pub with classic American fare.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "scholars.jpg",
      mood: "dining"
    },
    {
      venue: "Serafina",
      description: "Italian restaurant with vibrant atmosphere.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "serafina.jpg",
      mood: "dining"
    },
    {
      venue: "[solidcore]",
      description: "Intense, full-body workout on reformer machines.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "solidcore.jpg",
      mood: "adventurous"
    },
    {
      venue: "South End Buttery",
      description: "Charming cafe and bakery.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "southendbuttery.jpg",
      mood: "chill"
    },
    {
      venue: "Stats Bar & Grille",
      description: "Sports bar with elevated pub fare.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "stats.jpg",
      mood: "entertainment"
    },
    {
      venue: "Sweetgreen",
      description: "Fresh, seasonal salads and warm bowls.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "sweetgreen.jpg",
      mood: "dining"
    },
    {
      venue: "Tatte",
      description: "Artisanal bakery & cafe with Mediterranean influence.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "tatte.jpg",
      mood: "chill"
    },
    {
      venue: "The Burren",
      description: "Irish pub with live music and traditional fare.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "theburren.jpg",
      mood: "entertainment"
    },
    {
      venue: "The Harp",
      description: "Irish pub near TD Garden.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "theharp.jpg",
      mood: "entertainment"
    },
    {
      venue: "Trattoria il Panino",
      description: "Traditional Italian dining in the North End.",
      compatibility: 4.3,
      priceRange: "$$$",
      imageUrl: "trattoriailpanino.jpg",
      mood: "dining"
    },
    {
      venue: "View Boston",
      description: "Observatory offering 360-degree views of Boston.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "viewboston.jpg",
      mood: "entertainment"
    },
    {
      venue: "West End Johnnie's",
      description: "Sports bar with American comfort food.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "westendjohnnies.jpg",
      mood: "entertainment"
    },
    {
      venue: "White Mountain Creamery",
      description: "Local ice cream shop with homemade flavors.",
      compatibility: 4.3,
      priceRange: "$",
      imageUrl: "whitemountain.jpg",
      mood: "chill"
    },
    {
      venue: "WNDR Museum",
      description: "Immersive art and technology museum experience.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "wndrmuseum.jpg",
      mood: "arts"
    },
    {
      venue: "Farmers Horse Coffee",
      description: "Cozy cafe with artisanal coffee and pastries.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "farmershorsecoffee.jpg",
      mood: "chill"
    },
    {
      venue: "Fuji at Ink Block",
      description: "Contemporary Japanese cuisine and sushi.",
      compatibility: 4.6,
      priceRange: "$$$",
      imageUrl: "fujiatinkblock.jpg",
      mood: "dining"
    },
    {
      venue: "George Howell Coffee",
      description: "Premium coffee shop with expert baristas.",
      compatibility: 4.3,
      priceRange: "$$",
      imageUrl: "georgehowellcoffee.jpg",
      mood: "chill"
    }
  ]);
  const [filters, setFilters] = useState({
    school: '',
    minAge: '',
    maxAge: '',
    location: '',
    archetype: ''
  });

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }
      
      console.log('Current user profile:', profile);
      setUserProfile(profile);

      // If user is single, fetch potential matches
      if (profile?.relationship_status === 'single') {
        console.log('Fetching matches for single user');
        
        const { data: matches, error: matchError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .eq('relationship_status', 'single')
          .eq('gender', profile.preferred_gender)
          .eq('preferred_gender', profile.gender)
          .not('gender', 'is', null)
          .not('school', 'is', null);

      if (matchError) {
          console.error('Match fetch error:', matchError);
        throw matchError;
      }

        // Process matches for single users
        if (matches && matches.length > 0) {
          const matchesWithPercentage = matches.map(match => ({
              ...match,
            matchPercentage: calculateMatchPercentage(profile, match),
            dater_status: calculateDaterStatus(match.follow_through_rate)
          }));

          // Sort matches
          matchesWithPercentage.sort((a, b) => {
            const aHasPhoto = Boolean(a.avatar_url);
            const bHasPhoto = Boolean(b.avatar_url);
            if (aHasPhoto && !bHasPhoto) return -1;
            if (!aHasPhoto && bHasPhoto) return 1;
            return (b.matchPercentage || 0) - (a.matchPercentage || 0);
          });
          
          setProfiles(matchesWithPercentage);
        } else {
          setProfiles([]);
        }
      } else {
        // User is in a couple, no need to fetch matches
        console.log('User is not single:', profile?.relationship_status);
        setProfiles([]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error in checkUserStatus:', error);
      setError('Failed to load profiles');
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-500 mt-4">{error}</div>;
  if (!userProfile) return <div className="text-center mt-4">Please log in to view matches</div>;

  // For users in a relationship, show the curated dates view
  if (userProfile?.relationship_status === 'couple') {
    console.log('User is in a couple, showing curated dates view');
    const experienceSuggestions = [
      {
        venue: "Barcelona Wine Bar",
        description: "Intimate Spanish tapas experience with an extensive wine selection.",
        compatibility: 4.8,
        priceRange: "$$$",
        imageUrl: "barcelona.jpg",
        mood: "dining"
      },
      {
        venue: "Barry's Bootcamp",
        description: "High-intensity interval training in a fun atmosphere.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "barrys.jpg",
        mood: "adventurous"
      },
      {
        venue: "Bartaco",
        description: "Upscale street food & craft cocktails in a vibrant atmosphere.",
        compatibility: 4.5,
        priceRange: "$$",
        imageUrl: "bartaco.jpg",
        mood: "dining"
      },
      {
        venue: "BC Basketball",
        description: "Exciting college basketball action at Conte Forum.",
        compatibility: 4.4,
        priceRange: "$$",
        imageUrl: "bcbasketball.jpg",
        mood: "entertainment"
      },
      {
        venue: "BC Hockey",
        description: "Thrilling college hockey games at Conte Forum.",
        compatibility: 4.6,
        priceRange: "$$",
        imageUrl: "bchockey.jpg",
        mood: "entertainment"
      },
      {
        venue: "BC Lacrosse",
        description: "Fast-paced college lacrosse matches.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "bclacrosse.jpg",
        mood: "entertainment"
      },
      {
        venue: "Bell in Hand",
        description: "Historic tavern with live music and lively atmosphere.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "bellinhand.jpg",
        mood: "entertainment"
      },
      {
        venue: "Blank Street Coffee",
        description: "Modern coffee shop with quality brews and cozy atmosphere.",
        compatibility: 4.1,
        priceRange: "$",
        imageUrl: "blankstreetcoffee.jpg",
        mood: "chill"
      },
      {
        venue: "Blue Ribbon Sushi",
        description: "High-end sushi experience with exceptional omakase.",
        compatibility: 4.7,
        priceRange: "$$$",
        imageUrl: "blueribbon.jpg",
        mood: "dining"
      },
      {
        venue: "Boston Burger Company",
        description: "Creative burgers and shakes in a casual setting.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "bostonburger.jpg",
        mood: "dining"
      },
      {
        venue: "Branchline",
        description: "Modern American cuisine with rotisserie focus.",
        compatibility: 4.4,
        priceRange: "$$",
        imageUrl: "branchline.jpg",
        mood: "dining"
      },
      {
        venue: "Brick Street Bagels",
        description: "Fresh bagels and coffee in a cozy atmosphere.",
        compatibility: 4.0,
        priceRange: "$",
        imageUrl: "brickstreetbagels.jpg",
        mood: "chill"
      },
      {
        venue: "TD Garden - Bruins",
        description: "Exciting NHL hockey action at TD Garden.",
        compatibility: 4.6,
        priceRange: "$$$",
        imageUrl: "bruins.jpg",
        mood: "entertainment"
      },
      {
        venue: "Buttermilk & Bourbon",
        description: "Southern comfort food in an intimate setting.",
        compatibility: 4.5,
        priceRange: "$$$",
        imageUrl: "buttermilkandbourbon.jpg",
        mood: "dining"
      },
      {
        venue: "Capital Grille",
        description: "Upscale steakhouse with exceptional service.",
        compatibility: 4.8,
        priceRange: "$$$$",
        imageUrl: "capitalgrille.jpg",
        mood: "dining"
      },
      {
        venue: "Capo",
        description: "Italian cuisine and craft cocktails in South Boston.",
        compatibility: 4.5,
        priceRange: "$$$",
        imageUrl: "capo.jpg",
        mood: "dining"
      },
      {
        venue: "Carmelina's",
        description: "Authentic Italian cuisine in the North End.",
        compatibility: 4.6,
        priceRange: "$$$",
        imageUrl: "carmelinas.jpg",
        mood: "dining"
      },
      {
        venue: "Cask 'n Flagon",
        description: "Iconic sports bar near Fenway Park.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "caskflagon.jpg",
        mood: "entertainment"
      },
      {
        venue: "TD Garden - Celtics",
        description: "NBA basketball excitement at TD Garden.",
        compatibility: 4.7,
        priceRange: "$$$",
        imageUrl: "celtics.jpg",
        mood: "entertainment"
      },
      {
        venue: "Cityside",
        description: "Classic American pub with comfort food and drinks.",
        compatibility: 4.1,
        priceRange: "$$",
        imageUrl: "cityside.jpg",
        mood: "dining"
      },
      {
        venue: "City Tap House",
        description: "Craft beer bar with elevated pub fare.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "citytap.jpg",
        mood: "dining"
      },
      {
        venue: "The Clay Room",
        description: "Creative pottery painting studio perfect for dates.",
        compatibility: 4.4,
        priceRange: "$$",
        imageUrl: "clayroom.jpg",
        mood: "arts"
      },
      {
        venue: "Clerys",
        description: "Popular sports bar with classic pub atmosphere.",
        compatibility: 4.1,
        priceRange: "$$",
        imageUrl: "clerys.jpg",
        mood: "entertainment"
      },
      {
        venue: "Boston Common",
        description: "Historic park perfect for casual strolls.",
        compatibility: 4.3,
        priceRange: "$",
        imageUrl: "commons.jpg",
        mood: "romantic"
      },
      {
        venue: "Coquette",
        description: "French-inspired coastal cuisine in a chic setting.",
        compatibility: 4.7,
        priceRange: "$$$",
        imageUrl: "coquette.jpg",
        mood: "dining"
      },
      {
        venue: "CorePower Yoga",
        description: "Dynamic, fitness-focused yoga classes.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "corepower.jpg",
        mood: "adventurous"
      },
      {
        venue: "Boston Duck Tours",
        description: "Unique tour of Boston by land and water.",
        compatibility: 4.4,
        priceRange: "$$",
        imageUrl: "ducktour.jpg",
        mood: "entertainment"
      },
      {
        venue: "Escape Room",
        description: "Interactive puzzle-solving adventure.",
        compatibility: 4.5,
        priceRange: "$$",
        imageUrl: "escaperoom.jpg",
        mood: "entertainment"
      },
      {
        venue: "F1 Boston",
        description: "High-tech racing simulators and gaming.",
        compatibility: 4.6,
        priceRange: "$$$",
        imageUrl: "f1arcade.jpg",
        mood: "adventurous"
      },
      {
        venue: "Faneuil Hall",
        description: "Historic marketplace with shops and restaurants.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "faneuilhall.jpg",
        mood: "entertainment"
      },
      {
        venue: "Farmers Horse Coffee",
        description: "Artisanal coffee and pastries in a cozy setting.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "farmershorsecoffee.jpg",
        mood: "chill"
      },
      {
        venue: "Fuji at Ink Block",
        description: "Contemporary Japanese cuisine and sushi.",
        compatibility: 4.6,
        priceRange: "$$$",
        imageUrl: "fujiatinkblock.jpg",
        mood: "dining"
      },
      {
        venue: "George Howell Coffee",
        description: "Premium coffee shop with expert baristas.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "georgehowellcoffee.jpg",
        mood: "chill"
      },
      {
        venue: "Great Scott",
        description: "Iconic live music venue.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "greateastbar.jpg",
        mood: "entertainment"
      },
      {
        venue: "Greystone Cafe",
        description: "Casual cafe with breakfast and lunch options.",
        compatibility: 4.0,
        priceRange: "$$",
        imageUrl: "greystonecafe.jpg",
        mood: "chill"
      },
      {
        venue: "Grill 23",
        description: "Upscale steakhouse with elegant atmosphere.",
        compatibility: 4.8,
        priceRange: "$$$$",
        imageUrl: "grill23.jpg",
        mood: "dining"
      },
      {
        venue: "Private Helicopter Tour",
        description: "Breathtaking aerial views of Boston's skyline.",
        compatibility: 4.9,
        priceRange: "$$$$",
        imageUrl: "helicopter.jpg",
        mood: "adventurous"
      },
      {
        venue: "House of Blues",
        description: "Live music venue with southern-inspired cuisine.",
        compatibility: 4.4,
        priceRange: "$$",
        imageUrl: "houseofblues.jpg",
        mood: "entertainment"
      },
      {
        venue: "Hunter's Kitchen & Bar",
        description: "Modern American cuisine with craft cocktails.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "hunters.jpg",
        mood: "dining"
      },
      {
        venue: "Joe's On Newbury",
        description: "Classic American dining with cozy atmosphere.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "joes.jpg",
        mood: "dining"
      },
      {
        venue: "JP Licks",
        description: "Local ice cream shop with unique flavors.",
        compatibility: 4.1,
        priceRange: "$",
        imageUrl: "jplicks.jpg",
        mood: "chill"
      },
      {
        venue: "Kava Neo-Taverna",
        description: "Greek cuisine in a modern setting.",
        compatibility: 4.5,
        priceRange: "$$$",
        imageUrl: "kava.jpg",
        mood: "dining"
      },
      {
        venue: "Krasi",
        description: "Greek wine bar with Mediterranean small plates.",
        compatibility: 4.6,
        priceRange: "$$$",
        imageUrl: "krasi.jpg",
        mood: "dining"
      },
      {
        venue: "Kured",
        description: "Artisanal charcuterie and wine bar.",
        compatibility: 4.4,
        priceRange: "$$",
        imageUrl: "kured.jpg",
        mood: "dining"
      },
      {
        venue: "Lansdowne Pub",
        description: "Irish pub with live music near Fenway.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "lansdowne.jpg",
        mood: "entertainment"
      },
      {
        venue: "Levain Bakery",
        description: "Famous cookies and fresh baked goods.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "levain.jpg",
        mood: "chill"
      },
      {
        venue: "Lincoln Tavern",
        description: "Modern American tavern with craft cocktails.",
        compatibility: 4.4,
        priceRange: "$$",
        imageUrl: "lincoln.jpg",
        mood: "dining"
      },
      {
        venue: "Loco Taqueria",
        description: "Vibrant Mexican restaurant & tequila bar.",
        compatibility: 4.5,
        priceRange: "$$",
        imageUrl: "loco.jpg",
        mood: "dining"
      },
      {
        venue: "Lola 42",
        description: "Global cuisine with waterfront views.",
        compatibility: 4.6,
        priceRange: "$$$",
        imageUrl: "lola42.jpg",
        mood: "dining"
      },
      {
        venue: "Lolita Back Bay",
        description: "Trendy Mexican restaurant with creative cocktails.",
        compatibility: 4.5,
        priceRange: "$$$",
        imageUrl: "lolitabackbay.jpg",
        mood: "dining"
      },
      {
        venue: "Long Bar",
        description: "Sophisticated cocktail bar with city views.",
        compatibility: 4.4,
        priceRange: "$$$",
        imageUrl: "longbar.jpg",
        mood: "romantic"
      },
      {
        venue: "Lookout Rooftop",
        description: "Stylish rooftop bar with panoramic views.",
        compatibility: 4.7,
        priceRange: "$$$",
        imageUrl: "lookout.jpg",
        mood: "romantic"
      },
      {
        venue: "Loretta's Last Call",
        description: "Country music bar with live performances.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "lorettas.jpg",
        mood: "entertainment"
      },
      {
        venue: "Lucca",
        description: "Upscale Italian dining in the North End.",
        compatibility: 4.7,
        priceRange: "$$$",
        imageUrl: "lucca.jpg",
        mood: "dining"
      },
      {
        venue: "Lucky's Lounge",
        description: "Retro-style lounge with live music.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "luckyslounge.jpg",
        mood: "entertainment"
      },
      {
        venue: "Madeline's Candy",
        description: "Artisanal candy shop with unique treats.",
        compatibility: 4.1,
        priceRange: "$$",
        imageUrl: "madelinescandy.jpg",
        mood: "chill"
      },
      {
        venue: "Museum of Fine Arts",
        description: "World-class art collections and exhibitions.",
        compatibility: 4.8,
        priceRange: "$$",
        imageUrl: "mfa.jpg",
        mood: "arts"
      },
      {
        venue: "Mida",
        description: "Modern Italian cuisine with creative twist.",
        compatibility: 4.6,
        priceRange: "$$$",
        imageUrl: "mida.jpg",
        mood: "dining"
      },
      {
        venue: "Mike & Patty's",
        description: "Gourmet breakfast sandwiches.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "mikeandpattys.jpg",
        mood: "dining"
      },
      {
        venue: "Mooo....",
        description: "Sophisticated steakhouse in Beacon Hill.",
        compatibility: 4.8,
        priceRange: "$$$$",
        imageUrl: "moo.jpg",
        mood: "dining"
      },
      {
        venue: "Museum of Ice Cream",
        description: "Interactive ice cream-themed exhibits.",
        compatibility: 4.4,
        priceRange: "$$",
        imageUrl: "museumoficecream.jpg",
        mood: "arts"
      },
      {
        venue: "Parla",
        description: "Intimate Italian restaurant & cocktail bar.",
        compatibility: 4.5,
        priceRange: "$$$",
        imageUrl: "parla.jpg",
        mood: "dining"
      },
      {
        venue: "Phin Coffee House",
        description: "Vietnamese coffee and light bites.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "phincoffeehouse.jpg",
        mood: "chill"
      },
      {
        venue: "Pop Up Bagel",
        description: "Fresh bagels and creative spreads.",
        compatibility: 4.1,
        priceRange: "$",
        imageUrl: "popupbagel.jpg",
        mood: "chill"
      },
      {
        venue: "Pressed Cafe",
        description: "Healthy bowls and fresh pressed juices.",
        compatibility: 4.0,
        priceRange: "$$",
        imageUrl: "pressed.jpg",
        mood: "chill"
      },
      {
        venue: "Puttshack",
        description: "High-tech mini golf with food and drinks.",
        compatibility: 4.5,
        priceRange: "$$",
        imageUrl: "puttshack.jpg",
        mood: "entertainment"
      },
      {
        venue: "Scholar's",
        description: "Upscale pub with classic American fare.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "scholars.jpg",
        mood: "dining"
      },
      {
        venue: "Serafina",
        description: "Italian restaurant with vibrant atmosphere.",
        compatibility: 4.4,
        priceRange: "$$$",
        imageUrl: "serafina.jpg",
        mood: "dining"
      },
      {
        venue: "[solidcore]",
        description: "Intense, full-body workout experience.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "solidcore.jpg",
        mood: "adventurous"
      },
      {
        venue: "South End Buttery",
        description: "Charming cafe and bakery.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "southendbuttery.jpg",
        mood: "chill"
      },
      {
        venue: "Stats Bar & Grille",
        description: "Sports bar with elevated pub fare.",
        compatibility: 4.1,
        priceRange: "$$",
        imageUrl: "stats.jpg",
        mood: "entertainment"
      },
      {
        venue: "Sweetgreen",
        description: "Fresh, seasonal salads and warm bowls.",
        compatibility: 4.0,
        priceRange: "$$",
        imageUrl: "sweetgreen.jpg",
        mood: "dining"
      },
      {
        venue: "Tatte",
        description: "Artisanal bakery & cafe with Mediterranean influence.",
        compatibility: 4.4,
        priceRange: "$$",
        imageUrl: "tatte.jpg",
        mood: "chill"
      },
      {
        venue: "The Burren",
        description: "Irish pub with live music and traditional fare.",
        compatibility: 4.3,
        priceRange: "$$",
        imageUrl: "theburren.jpg",
        mood: "entertainment"
      },
      {
        venue: "The Harp",
        description: "Irish pub near TD Garden.",
        compatibility: 4.2,
        priceRange: "$$",
        imageUrl: "theharp.jpg",
        mood: "entertainment"
      },
      {
        venue: "Trattoria il Panino",
        description: "Traditional Italian dining in North End.",
        compatibility: 4.5,
        priceRange: "$$$",
        imageUrl: "trattoriailpanino.jpg",
        mood: "dining"
      },
      {
        venue: "View Boston",
        description: "Observatory with 360-degree city views.",
        compatibility: 4.6,
        priceRange: "$$",
        imageUrl: "viewboston.jpg",
        mood: "romantic"
      },
      {
        venue: "West End Johnnie's",
        description: "Sports bar with American comfort food.",
        compatibility: 4.1,
        priceRange: "$$",
        imageUrl: "westendjohnnies.jpg",
        mood: "entertainment"
      },
      {
        venue: "White Mountain Creamery",
        description: "Local ice cream shop with homemade flavors.",
        compatibility: 4.2,
        priceRange: "$",
        imageUrl: "whitemountain.jpg",
        mood: "chill"
      },
      {
        venue: "WNDR Museum",
        description: "Immersive art and technology museum.",
        compatibility: 4.5,
        priceRange: "$$",
        imageUrl: "wndrmuseum.jpg",
        mood: "arts"
      },
      {
        venue: "Fuji at Ink Block",
        description: "Contemporary Japanese cuisine and sushi.",
        compatibility: 4.6,
        priceRange: "$$$",
        imageUrl: "fujiatinkblock.jpg",
        mood: "food"
      },
      {
        venue: "Farmers Horse Coffee",
        description: "Cozy cafe with artisanal coffee and pastries",
        imageUrl: "farmershorsecoffee.jpg",
        compatibility: 4.3,
        priceRange: "$$",
        mood: "food"
      },
      {
        venue: "Fuji at Ink Block",
        description: "Contemporary Japanese cuisine and sushi",
        imageUrl: "fujiatinkblock.jpg",
        compatibility: 4.6,
        priceRange: "$$$",
        mood: "food"
      },
      {
        venue: "George Howell Coffee",
        description: "Premium coffee shop with expert baristas",
        imageUrl: "georgehowellcoffee.jpg",
        compatibility: 4.3,
        priceRange: "$$",
        mood: "food"
      }
    ];

    return <CuratedDatesView userProfile={userProfile} dateSuggestions={experienceSuggestions} />;
  }

  // Filter and paginate profiles for single users
  const filteredProfiles = profiles.filter(profile => {
    if (filters.school && profile.school !== filters.school) return false;
    if (filters.minAge && profile.age < parseInt(filters.minAge)) return false;
    if (filters.maxAge && profile.age > parseInt(filters.maxAge)) return false;
    if (filters.location && profile.location !== filters.location) return false;
    if (filters.archetype && profile.dater_archetype !== filters.archetype) return false;
    if (searchQuery && !profile.first_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProfiles.length / profilesPerPage);
  const startIndex = (currentPage - 1) * profilesPerPage;
  const paginatedProfiles = filteredProfiles.slice(startIndex, startIndex + profilesPerPage);

    return (
    <div className="min-h-screen bg-[#cc0000]">
        {/* Header */}
      <Header variant="matching" />
      
      {/* Filters */}
      <div className="sticky top-0 z-10 bg-[#cc0000] shadow-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
                <input
                  type="text"
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-2 rounded-full border-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
                    <button
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-6 h-6 text-white" />
                    </button>
                </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm mb-1 block">Age Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-1.5 rounded-lg text-sm"
                      value={filters.minAge}
                      onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-1.5 rounded-lg text-sm"
                      value={filters.maxAge}
                      onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                    />
                  </div>
            </div>

                <div>
                  <label className="text-white text-sm mb-1 block">School</label>
              <select
                    className="w-full px-3 py-1.5 rounded-lg text-sm"
                    value={filters.school}
                    onChange={(e) => setFilters({ ...filters, school: e.target.value })}
                  >
                    <option value="">All Schools</option>
                    <option value="Boston College">Boston College</option>
                    <option value="Harvard">Harvard</option>
                    <option value="MIT">MIT</option>
                    <option value="Northeastern">Northeastern</option>
              </select>
            </div>

                <div>
                  <label className="text-white text-sm mb-1 block">Location</label>
              <select
                    className="w-full px-3 py-1.5 rounded-lg text-sm"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  >
                    <option value="">All Locations</option>
                    <option value="Boston">Boston</option>
                    <option value="Cambridge">Cambridge</option>
                    <option value="Brookline">Brookline</option>
                    <option value="Newton">Newton</option>
              </select>
            </div>

                <div>
                  <label className="text-white text-sm mb-1 block">Archetype</label>
              <select
                    className="w-full px-3 py-1.5 rounded-lg text-sm"
                    value={filters.archetype}
                    onChange={(e) => setFilters({ ...filters, archetype: e.target.value })}
                  >
                    <option value="">All Types</option>
                    <option value="hopelessRomantic">Hopeless Romantic</option>
                    <option value="cautiousDater">Cautious Dater</option>
                    <option value="serialDater">Serial Dater</option>
                    <option value="commitmentSeeker">Commitment Seeker</option>
                    <option value="friendWithBenefits">Friend with Benefits</option>
              </select>
            </div>
            </div>
            </div>
          )}
          </div>
        </div>

        {/* Profile Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
        </div>
      ) : error ? (
        <div className="text-center text-white py-8">{error}</div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center text-white py-8">No profiles found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-8 max-w-4xl mx-auto">
            {paginatedProfiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-2xl shadow-xl overflow-hidden relative isolate">
                {/* Clickable Profile Image */}
                <div 
                  onClick={() => router.push(`/profile/${profile.id}`)}
                  className="relative aspect-[4/3] cursor-pointer"
                >
                    <ProfileImage
                    user={profile}
                    className="w-full h-full"
                    priority
                  />
                  <div className="absolute top-4 left-4 z-[1] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-[#cc0000] flex items-center gap-2 shadow-lg">
                    <Heart className="w-4 h-4" fill="#cc0000" stroke="#cc0000" />
                    <span className="font-bold">{profile.matchPercentage}%</span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Basic Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{profile.first_name}, {profile.age}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      {profile.school && (
                        <p className="text-gray-600 text-sm flex items-center gap-1">
                          <span>🎓</span>
                          {profile.school}
                        </p>
                      )}
                      {profile.location && (
                        <p className="text-gray-600 text-sm flex items-center gap-1">
                          <MapPin size={14} className="text-gray-600" />
                          {profile.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio Section */}
                  {profile.bio && (
                    <div className="mb-4">
                      <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                        {profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Status Badges */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {/* Dater Status */}
                    <div className="bg-gray-100 rounded-full py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Crown className="w-4 h-4 text-[#cc0000] stroke-[3]" />
                        <div className="text-gray-900 text-sm font-medium">
                          {profile.dater_status ? profile.dater_status.charAt(0).toUpperCase() + profile.dater_status.slice(1) : 'Bronze'}
                  </div>
                  </div>
                    </div>

                    {/* Rating */}
                    <div className="bg-gray-100 rounded-full py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Star className="w-4 h-4 text-[#cc0000] stroke-[3]" />
                        <div className="text-gray-900 text-sm font-medium">
                          {profile.average_rating ? profile.average_rating.toFixed(1) : '0.0'}
                        </div>
                  </div>
                </div>

                    {/* Follow-Through */}
                    <div className="bg-gray-100 rounded-full py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Heart className="w-4 h-4 text-[#cc0000] stroke-[3]" />
                        <div className="text-gray-900 text-sm font-medium">
                          100%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descriptors */}
                  {profile.descriptors && profile.descriptors.length > 0 && (
                    <div className="mb-8">
                      <div className="flex flex-wrap gap-1.5">
                        {profile.descriptors.map(descriptor => (
                          <span
                            key={descriptor.label}
                            className="inline-block px-2.5 py-1 bg-[#cc0000] text-white rounded-full text-xs"
                          >
                            {descriptor.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto">
                    <button
                      onClick={() => router.push(`/send-date-request/${profile.id}`)}
                      className="w-full py-2.5 px-6 bg-[#cc0000] text-white text-base font-medium rounded-full hover:bg-[#aa0000] transition-colors shadow-sm"
                    >
                      Send Date Request
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>

          {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pb-20 pt-4">
            <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
                className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Previous
            </button>
              <span className="text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-white/20 transition-colors"
            >
              Next
            </button>
          </div>
        )}
        </>
      )}
      <BottomNav />
    </div>
  );
}

export default function MatchingPage() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please try again later.</div>}>
      <Suspense fallback={<LoadingSpinner />}>
        <MatchingPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}