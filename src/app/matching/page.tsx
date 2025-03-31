'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import ProfileImage from '@/components/ProfileImage';
import { Card } from '@/components/ui/card';
import Map from '@/components/Map';
import { Heart, Home, Search, PlusCircle, Bell, User, MapPin, Star, Crown, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Heart as LucideHeart } from 'lucide-react';
import { prompt } from '@/app/fonts';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import CuratedDatesView from './curated';
import { Profile } from '@/types/profile';

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
  compatibility?: number;
  priceRange: string;
  imageUrl: string;
  mood: string;
}

interface FilterState {
  minAge: number;
  maxAge: number;
  school: string;
  city: string;
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
    if (avatarPath.startsWith('/images/')) {
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
  const currentDate = new Date(startDate);

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

const venuesByMood = {
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
  let score = 75;
  if (userProfile.school === otherProfile.school) {
    score += 10;
  }
  if (userProfile.location && otherProfile.location && userProfile.location === otherProfile.location) {
    score += 10;
  }
  return Math.min(100, Math.round(score));
};

const DEFAULT_DATE_SUGGESTIONS: DateSuggestionData[] = [
  // Food
  {
    venue: "Barcelona Wine Bar",
    description: "Intimate Spanish tapas restaurant with an extensive wine list",
    priceRange: "$$$",
    imageUrl: "barcelona.jpg",
    mood: "food"
  },
  {
    venue: "Bartaco",
    description: "Upscale street food with coastal vibes",
    priceRange: "$$",
    imageUrl: "bartaco.jpg",
    mood: "food"
  },
  {
    venue: "Blue Ribbon Sushi",
    description: "Premium sushi experience in an elegant atmosphere",
    priceRange: "$$$",
    imageUrl: "blueribbon.jpg",
    mood: "food"
  },
  {
    venue: "Boston Burger",
    description: "Creative burgers in a casual setting",
    priceRange: "$$",
    imageUrl: "bostonburger.jpg",
    mood: "food"
  },
  {
    venue: "Branchline",
    description: "Rotisserie-focused New American cuisine",
    priceRange: "$$",
    imageUrl: "branchline.jpg",
    mood: "food"
  },
  {
    venue: "Buttermilk & Bourbon",
    description: "Southern comfort food in an intimate setting",
    priceRange: "$$$",
    imageUrl: "buttermilkandbourbon.jpg",
    mood: "food"
  },
  {
    venue: "Capital Grille",
    description: "Classic steakhouse experience",
    priceRange: "$$$$",
    imageUrl: "capitalgrille.jpg",
    mood: "food"
  },
  {
    venue: "Capo",
    description: "Upscale Italian dining with a lively atmosphere",
    priceRange: "$$$",
    imageUrl: "capo.jpg",
    mood: "food"
  },
  {
    venue: "Carmelina's",
    description: "Authentic North End Italian cuisine",
    priceRange: "$$$",
    imageUrl: "carmelinas.jpg",
    mood: "food"
  },
  {
    venue: "Coquette",
    description: "French coastal cuisine with flair",
    priceRange: "$$$",
    imageUrl: "coquette.jpg",
    mood: "food"
  },
  {
    venue: "Fuji at Ink Block",
    description: "Contemporary Japanese cuisine",
    priceRange: "$$$",
    imageUrl: "fujiatinkblock.jpg",
    mood: "food"
  },
  {
    venue: "Grill 23",
    description: "Sophisticated steakhouse in historic setting",
    priceRange: "$$$$",
    imageUrl: "grill23.jpg",
    mood: "food"
  },
  {
    venue: "Joe's On Newbury",
    description: "American cuisine on iconic Newbury Street",
    priceRange: "$$",
    imageUrl: "joes.jpg",
    mood: "food"
  },
  {
    venue: "Krasi",
    description: "Greek wine bar with mezedes",
    priceRange: "$$$",
    imageUrl: "krasi.jpg",
    mood: "food"
  },
  {
    venue: "Kured",
    description: "Artisanal charcuterie and wine bar",
    priceRange: "$$",
    imageUrl: "kured.jpg",
    mood: "food"
  },
  {
    venue: "Loco Taqueria",
    description: "Vibrant taco spot with creative cocktails",
    priceRange: "$$",
    imageUrl: "loco.jpg",
    mood: "food"
  },
  {
    venue: "Lola 42",
    description: "Global cuisine with waterfront views",
    priceRange: "$$$",
    imageUrl: "lola42.jpg",
    mood: "food"
  },
  {
    venue: "Lolita Back Bay",
    description: "Vibrant Mexican cuisine and cocktails",
    priceRange: "$$",
    imageUrl: "lolitabackbay.jpg",
    mood: "food"
  },
  {
    venue: "Lucca",
    description: "Refined Italian dining in the North End",
    priceRange: "$$$",
    imageUrl: "lucca.jpg",
    mood: "food"
  },
  {
    venue: "Mida",
    description: "Modern Italian cuisine in the South End",
    priceRange: "$$$",
    imageUrl: "mida.jpg",
    mood: "food"
  },
  {
    venue: "Mike & Patty's",
    description: "Gourmet breakfast sandwiches",
    priceRange: "$$",
    imageUrl: "mikeandpattys.jpg",
    mood: "food"
  },
  {
    venue: "Mooo....",
    description: "Modern steakhouse in Beacon Hill",
    priceRange: "$$$$",
    imageUrl: "moo.jpg",
    mood: "food"
  },
  {
    venue: "Parla",
    description: "Intimate Italian speakeasy",
    priceRange: "$$$",
    imageUrl: "parla.jpg",
    mood: "food"
  },
  {
    venue: "Serafina",
    description: "Chic Italian restaurant with vibrant atmosphere",
    priceRange: "$$$",
    imageUrl: "serafina.jpg",
    mood: "food"
  },
  {
    venue: "Sweet Green",
    description: "Healthy salads and grain bowls",
    priceRange: "$$",
    imageUrl: "sweetgreen.jpg",
    mood: "food"
  },
  {
    venue: "Trattoria Il Panino",
    description: "Classic North End Italian dining",
    priceRange: "$$",
    imageUrl: "trattoriailpanino.jpg",
    mood: "food"
  },

  // Adventurous
  {
    venue: "Barry's Bootcamp",
    description: "High-intensity interval training workouts",
    priceRange: "$$",
    imageUrl: "barrys.jpg",
    mood: "adventurous"
  },
  {
    venue: "CorePower Yoga",
    description: "Intense yoga workouts in heated studios",
    priceRange: "$$",
    imageUrl: "corepower.jpg",
    mood: "adventurous"
  },
  {
    venue: "Duck Tour",
    description: "Land and water tour of Boston",
    priceRange: "$$",
    imageUrl: "ducktour.jpg",
    mood: "adventurous"
  },
  {
    venue: "Escape Room",
    description: "Interactive puzzle-solving adventure",
    priceRange: "$$",
    imageUrl: "escaperoom.jpg",
    mood: "adventurous"
  },
  {
    venue: "F1 Boston",
    description: "High-speed indoor karting",
    priceRange: "$$",
    imageUrl: "f1arcade.jpg",
    mood: "adventurous"
  },
  {
    venue: "Private Helicopter Ride",
    description: "Scenic helicopter tour over Boston",
    priceRange: "$$$$",
    imageUrl: "helicopter.jpg",
    mood: "adventurous"
  },
  {
    venue: "Puttshack",
    description: "High-tech mini golf experience",
    priceRange: "$$",
    imageUrl: "puttshack.jpg",
    mood: "adventurous"
  },
  {
    venue: "Solid Core",
    description: "Intense full-body workout",
    priceRange: "$$",
    imageUrl: "solidcore.jpg",
    mood: "adventurous"
  },
  {
    venue: "View Boston",
    description: "Observation deck with city views",
    priceRange: "$$",
    imageUrl: "viewboston.jpg",
    mood: "adventurous"
  },

  // Arts
  {
    venue: "Museum of Fine Arts",
    description: "World-class art collections",
    priceRange: "$$",
    imageUrl: "mfa.jpg",
    mood: "arts"
  },
  {
    venue: "The Clay Room",
    description: "Pottery painting studio",
    priceRange: "$$",
    imageUrl: "clayroom.jpg",
    mood: "arts"
  },
  {
    venue: "Museum of Ice Cream",
    description: "Interactive ice cream-themed museum",
    priceRange: "$$",
    imageUrl: "museumoficecream.jpg",
    mood: "arts"
  },
  {
    venue: "WNDR Museum",
    description: "Interactive art installations",
    priceRange: "$$",
    imageUrl: "wndrmuseum.jpg",
    mood: "arts"
  },

  // Entertainment
  {
    venue: "BC Basketball",
    description: "College basketball at Conte Forum",
    priceRange: "$$",
    imageUrl: "bcbasketball.jpg",
    mood: "entertainment"
  },
  {
    venue: "BC Hockey",
    description: "College hockey at Conte Forum",
    priceRange: "$$",
    imageUrl: "bchockey.jpg",
    mood: "entertainment"
  },
  {
    venue: "BC Lacrosse",
    description: "College lacrosse games",
    priceRange: "$$",
    imageUrl: "bclacrosse.jpg",
    mood: "entertainment"
  },
  {
    venue: "Boston Bruins",
    description: "NHL hockey at TD Garden",
    priceRange: "$$$",
    imageUrl: "bruins.jpg",
    mood: "entertainment"
  },
  {
    venue: "Boston Celtics",
    description: "NBA basketball at TD Garden",
    priceRange: "$$$",
    imageUrl: "celtics.jpg",
    mood: "entertainment"
  },
  {
    venue: "House of Blues",
    description: "Live music venue",
    priceRange: "$$",
    imageUrl: "houseofblues.jpg",
    mood: "entertainment"
  },

  // Chill
  {
    venue: "Bell In Hand",
    description: "Historic tavern with casual atmosphere",
    priceRange: "$$",
    imageUrl: "bellinhand.jpg",
    mood: "chill"
  },
  {
    venue: "Blank Street Coffee",
    description: "Modern coffee shop",
    priceRange: "$",
    imageUrl: "blankstreetcoffee.jpg",
    mood: "chill"
  },
  {
    venue: "Brick Street Bagels",
    description: "Artisanal bagels and coffee",
    priceRange: "$",
    imageUrl: "brickstreetbagels.jpg",
    mood: "chill"
  },
  {
    venue: "Boston Common",
    description: "America's oldest public park",
    priceRange: "$",
    imageUrl: "commons.jpg",
    mood: "chill"
  },
  {
    venue: "Farmers Horse Coffee",
    description: "Cozy neighborhood coffee shop",
    priceRange: "$",
    imageUrl: "farmershorsecoffee.jpg",
    mood: "chill"
  },
  {
    venue: "George Howell Coffee",
    description: "Premium coffee experience",
    priceRange: "$$",
    imageUrl: "georgehowellcoffee.jpg",
    mood: "chill"
  },
  {
    venue: "Greystone Cafe",
    description: "Casual cafe with outdoor seating",
    priceRange: "$$",
    imageUrl: "greystonecafe.jpg",
    mood: "chill"
  },
  {
    venue: "JP Licks",
    description: "Local ice cream shop",
    priceRange: "$",
    imageUrl: "jplicks.jpg",
    mood: "chill"
  },
  {
    venue: "Kava Neo-Taverna",
    description: "Relaxed Greek dining",
    priceRange: "$$",
    imageUrl: "kava.jpg",
    mood: "chill"
  },
  {
    venue: "Levain Bakery",
    description: "Famous cookies and baked goods",
    priceRange: "$$",
    imageUrl: "levain.jpg",
    mood: "chill"
  },
  {
    venue: "Madeline's Candy",
    description: "Artisanal candy shop",
    priceRange: "$$",
    imageUrl: "madelinescandy.jpg",
    mood: "chill"
  },
  {
    venue: "Phin Coffee House",
    description: "Vietnamese coffee and treats",
    priceRange: "$",
    imageUrl: "phincoffeehouse.jpg",
    mood: "chill"
  },
  {
    venue: "Pop Up Bagel",
    description: "Fresh bagels and coffee",
    priceRange: "$",
    imageUrl: "popupbagel.jpg",
    mood: "chill"
  },
  {
    venue: "Pressed",
    description: "Healthy juices and smoothies",
    priceRange: "$$",
    imageUrl: "pressed.jpg",
    mood: "chill"
  },
  {
    venue: "South End Buttery",
    description: "Charming cafe and bakery",
    priceRange: "$$",
    imageUrl: "southendbuttery.jpg",
    mood: "chill"
  },
  {
    venue: "Tatte",
    description: "Beloved local bakery and cafe",
    priceRange: "$$",
    imageUrl: "tatte.jpg",
    mood: "chill"
  },
  {
    venue: "White Mountain Creamery",
    description: "Local ice cream shop",
    priceRange: "$",
    imageUrl: "whitemountain.jpg",
    mood: "chill"
  }
];

const MatchingPageContent = ({ currentUser }: { currentUser: Profile }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  
  const [filters, setFilters] = useState({
    school: '',
    minAge: '',
    maxAge: '',
    location: '',
    archetype: ''
  });
  const profilesPerPage = 10;

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      console.log('Fetching profiles...', currentUser);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id)
        .eq('gender', currentUser.preferred_gender)
        .eq('preferred_gender', currentUser.gender)
        .or('relationship_status.eq.single,relationship_status.is.null')
        .limit(50);

      console.log('Query results:', { profilesData, profilesError });

      if (profilesError) throw profilesError;

      // Sort profiles: those with avatar_url first, then by matchPercentage
      const sortedProfiles = (profilesData || []).sort((a, b) => {
        // First prioritize profiles with avatar_url
        if (a.avatar_url && !b.avatar_url) return -1;
        if (!a.avatar_url && b.avatar_url) return 1;
        
        // If both have or don't have avatar_url, sort by match percentage
        const matchA = calculateMatchPercentage(currentUser, a);
        const matchB = calculateMatchPercentage(currentUser, b);
        return matchB - matchA;
      });

      const profilesWithMatches = sortedProfiles.map(profile => ({
        ...profile,
        matchPercentage: calculateMatchPercentage(currentUser, profile)
      }));

      console.log('Processed profiles:', profilesWithMatches);
      setProfiles(profilesWithMatches);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to load profiles');
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    if (filters.school && profile.school !== filters.school) return false;
    if (filters.minAge && profile.age < parseInt(filters.minAge)) return false;
    if (filters.maxAge && profile.age > parseInt(filters.maxAge)) return false;
    if (filters.location && profile.location !== filters.location) return false;
    if (filters.archetype && profile.dater_archetype !== filters.archetype) return false;
    if (searchQuery && !profile.first_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Calculate pagination values
  const totalPages = Math.ceil(profiles.length / profilesPerPage);
  const indexOfLastProfile = currentPage * profilesPerPage;
  const indexOfFirstProfile = indexOfLastProfile - profilesPerPage;
  const currentProfiles = filteredProfiles.slice(indexOfFirstProfile, indexOfLastProfile);
  console.log('profile #', filteredProfiles.length)

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

    return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
                    <button
              onClick={fetchProfiles}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
              Retry
                    </button>
                </div>
              )}

        {!loading && !error && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-8">
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
                className="p-2 rounded-full bg-red-700 hover:bg-red-700/80 transition-colors"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="bg-[#aa0000] rounded-xl p-4 mb-8 shadow-lg border border-white/10">
                <div className="space-y-4">
                  <div className="filter-group">
                    <h3 className="text-base font-medium mb-2 text-white/90">Age Range</h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-3 py-1.5 rounded-lg text-sm shadow-sm"
                        value={filters.minAge}
                        onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-3 py-1.5 rounded-lg text-sm shadow-sm"
                        value={filters.maxAge}
                        onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="filter-group">
                    <h3 className="text-base font-medium mb-2 text-white/90">Location</h3>
                    <select
                      className="w-full px-3 py-1.5 rounded-lg text-sm shadow-sm"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    >
                      <option value="">All Locations</option>
                      <option value="Boston">Boston</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <h3 className="text-base font-medium mb-2 text-white/90">School</h3>
                    <select
                      className="w-full px-3 py-1.5 rounded-lg text-sm shadow-sm"
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

                  <div className="filter-group">
                    <h3 className="text-base font-medium mb-2 text-white/90">Archetype</h3>
                    <select
                      className="w-full px-3 py-1.5 rounded-lg text-sm shadow-sm"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {currentProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden max-w-sm mx-auto w-full"
                >
                  <div 
                    className="relative w-full h-[400px] cursor-pointer" 
                    onClick={() => router.push(`/profile/${profile.id}`)}
                  >
                    <ProfileImage
                      user={profile}
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-[#cc0000]">
                      {profile.matchPercentage}% Match
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold mb-1">
                        {profile.first_name}, {profile.age}
                      </h3>
                      <div className="space-y-1">
                        {profile.school && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <span>🎓</span>
                            {profile.school}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-[#cc0000]" />
                          {profile.location || 'Location not set'}
                        </p>
                        {profile.bio && (
                          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                            {profile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <div className="bg-gray-50 rounded-full px-3 py-1 text-center flex items-center gap-1">
                        <Crown className="h-3.5 w-3.5 text-[#cc0000]" />
                        <span className="text-xs font-medium">
                          {(profile.dater_status || 'bronze').charAt(0).toUpperCase() + (profile.dater_status || 'bronze').slice(1)}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-full px-3 py-1 text-center flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-[#cc0000]" />
                        <span className="text-xs font-medium">
                          {profile.matchPercentage}%
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-full px-3 py-1 text-center flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-[#cc0000]" />
                        <span className="text-xs font-medium">
                          {profile.average_rating ? profile.average_rating.toFixed(1) : 'New'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/send-date-request/${profile.id}`);
                      }}
                      className="w-full px-4 py-2 bg-[#cc0000] text-white text-sm font-bold rounded-full hover:bg-[#aa0000] transition-colors"
                    >
                      Send Date Request
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 mb-24">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => paginate(index + 1)}
                    className={`w-8 h-8 rounded-full text-sm font-medium ${
                      currentPage === index + 1
                      ? 'bg-[#cc0000] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

const MatchingPage = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setCurrentUser(profile);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return null;
  }

  if (currentUser.relationship_status === 'couple') {
    return <CuratedDatesView userProfile={currentUser} dateSuggestions={DEFAULT_DATE_SUGGESTIONS} />;
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please try again later.</div>}>
      <Suspense fallback={<LoadingSpinner />}>
        <MatchingPageContent currentUser={currentUser} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default MatchingPage;