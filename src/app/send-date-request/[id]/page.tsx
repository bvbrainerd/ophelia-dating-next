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
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/bruins.jpg`,
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
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/celtics.jpg`,
      stripeLink: "https://buy.stripe.com/5kA8yVf1e0xvg12eV0",
      coordinates: [-71.0622, 42.3663],
      distance: "5.8 mi"
    },
    { 
      id: "bc-lacrosse",
      name: "BC Lacrosse",
      location: "Conte Forum",
      type: "Sports",
      rating: 4.5,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/bclacrosse.jpg`,
      stripeLink: "https://buy.stripe.com/fZeg1nbP2gwtaGI14l",
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
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/bcbasketball.jpg`,
      stripeLink: "https://buy.stripe.com/fZebL7bP24NL9CE9AB",
      coordinates: [-71.1677, 42.3357],
      distance: "0.1 mi"
    }
  ],
  restaurants: [
    { 
      id: "barcelona-wine-bar",
      name: "Barcelona Wine Bar",
      location: "Back Bay",
      type: "Restaurant",
      rating: 4.6,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/barcelona.jpg`,
      stripeLink: "https://buy.stripe.com/00gcPb6uIdkh5mofZg",
      coordinates: [-71.0761, 42.3457],
      distance: "4.8 mi"
    },
    { 
      id: "capo",
      name: "Capo",
      location: "South Boston",
      type: "Restaurant",
      rating: 4.5,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/capo.jpg`,
      stripeLink: "https://buy.stripe.com/00gcPb6uIdkh5mofZg",
      coordinates: [-71.0472, 42.3352],
      distance: "6.2 mi"
    },
    { 
      id: "lucca-north-end",
      name: "Lucca North End",
      location: "North End",
      type: "Restaurant",
      rating: 4.7,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/lucca.jpg`,
      stripeLink: "https://buy.stripe.com/00gcPb6uIdkh5mofZg",
      coordinates: [-71.0543, 42.3649],
      distance: "5.9 mi"
    },
    { 
      id: "blue-ribbon-sushi",
      name: "Blue Ribbon Sushi",
      location: "Back Bay",
      type: "Restaurant",
      rating: 4.6,
      price: "$$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/blueribbon.jpg`,
      stripeLink: "https://buy.stripe.com/00gcPb6uIdkh5mofZg",
      coordinates: [-71.0816, 42.3486],
      distance: "4.5 mi"
    },
    { 
      id: "lolita-back-bay",
      name: "Lolita Back Bay",
      location: "Back Bay",
      type: "Restaurant",
      rating: 4.5,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/lolitabackbay.jpg`,
      stripeLink: "https://buy.stripe.com/00gcPb6uIdkh5mofZg",
      coordinates: [-71.0816, 42.3486],
      distance: "4.5 mi"
    },
    { 
      id: "cityside-tavern",
      name: "Cityside Tavern",
      location: "Brighton, MA",
      type: "American",
      price: "$$",
      rating: 4.5,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/cityside.jpg`,
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.1502, 42.3359],
      distance: "0.2 mi"
    },
    { 
      id: "joes-on-newbury",
      name: "Joes on Newbury",
      location: "Back Bay",
      type: "American",
      price: "$$",
      rating: 4.4,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/joes.jpg`,
      stripeLink: "https://buy.stripe.com/9AQg1n1ao6VTeWY28l",
      coordinates: [-71.0793, 42.3491],
      distance: "4.7 mi"
    },
    { 
      id: "lorettas-last-call",
      name: "Loretta's Last Call",
      location: "Fenway",
      type: "American",
      price: "$$",
      rating: 4.5,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/lorettas.jpg`,
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0950, 42.3467],
      distance: "3.8 mi"
    },
    { 
      id: "kured",
      name: "Kured",
      location: "Beacon Hill",
      type: "Charcuterie",
      price: "$$",
      rating: 4.5,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/kured.jpg`,
      stripeLink: "https://buy.stripe.com/9AQg1n1ao6VTeWY28l",
      coordinates: [-71.0712, 42.3589],
      distance: "5.2 mi",
      restrictions: "Available 11 AM - 4 PM"
    },
    { 
      id: "branchline",
      name: "Branchline",
      location: "Brookline, MA",
      type: "American",
      price: "$$",
      rating: 4.6,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/branchline.jpg`,
      stripeLink: "https://buy.stripe.com/3cscPb7yMa854ik5kk",
      coordinates: [-71.1407, 42.3523],
      distance: "1.5 mi"
    },
    { 
      id: "capital-grille",
      name: "Capital Grille",
      location: "Back Bay",
      type: "Restaurant",
      rating: 4.7,
      price: "$$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/capitalgrille.jpg`,
      coordinates: [-71.0827, 42.3486],
      distance: "4.3 mi",
      payAtVenue: true
    },
    { 
      id: "parla",
      name: "Parla",
      location: "North End",
      type: "Restaurant & Bar",
      rating: 4.6,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/parla.jpg`,
      coordinates: [-71.0553, 42.3636],
      distance: "5.8 mi",
      payAtVenue: true
    },
    { 
      id: "grill23",
      name: "Grill 23",
      location: "Back Bay",
      type: "Restaurant",
      rating: 4.8,
      price: "$$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/grill23.jpg`,
      coordinates: [-71.0726, 42.3500],
      distance: "4.9 mi",
      payAtVenue: true
    },
    { 
      id: "sweetgreen",
      name: "SweetGreen",
      location: "Watertown, MA",
      type: "Restaurant",
      rating: 4.5,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/sweetgreen.jpg`,
      coordinates: [-71.1573, 42.3647],
      distance: "1.6 mi",
      payAtVenue: true
    },
    { 
      id: "long-bar",
      name: "Long Bar & Terrace",
      location: "Boston, MA",
      type: "Restaurant & Bar",
      rating: 4.6,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/longbar.jpg`,
      coordinates: [-71.0766, 42.3489],
      distance: "4.7 mi",
      payAtVenue: true,
      restrictions: "21+ only, Available after 8 PM"
    },
    { 
      id: "pressed-cafe",
      name: "Pressed Cafe Newbury",
      location: "Boston, MA",
      type: "Restaurant",
      rating: 4.4,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/pressed.jpg`,
      coordinates: [-71.0817, 42.3474],
      distance: "4.5 mi",
      payAtVenue: true
    },
    { 
      id: "popup-bagel",
      name: "Popup Bagel",
      location: "Seaport, Boston",
      type: "Restaurant",
      rating: 4.5,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/popupbagel.jpg`,
      coordinates: [-71.0434, 42.3519],
      distance: "6.3 mi",
      payAtVenue: true
    },
    { 
      id: "serafina",
      name: "Serafina Seaport",
      location: "Seaport, Boston",
      type: "Restaurant",
      rating: 4.4,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/serafina.jpg`,
      coordinates: [-71.0434, 42.3534],
      distance: "6.3 mi",
      payAtVenue: true
    },
    { 
      id: "white-mountain",
      name: "White Mountain",
      location: "Chestnut Hill, MA",
      type: "Restaurant",
      rating: 4.6,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/whitemountain.jpg`,
      coordinates: [-71.1654, 42.3279],
      distance: "0.3 mi",
      payAtVenue: true
    },
    { 
      id: "boston-burger",
      name: "Boston Burger Company",
      location: "Boston, MA",
      type: "Restaurant",
      rating: 4.5,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/bostonburger.jpg`,
      coordinates: [-71.0945, 42.3474],
      distance: "3.7 mi",
      payAtVenue: true
    },
    { 
      id: "lola-42",
      name: "Lola 42",
      location: "Seaport, Boston",
      type: "Restaurant",
      rating: 4.6,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/lola42.jpg`,
      coordinates: [-71.0434, 42.3534],
      distance: "6.3 mi",
      payAtVenue: true
    },
    { 
      id: "bartaco",
      name: "Bartaco Fenway",
      location: "Fenway, Boston",
      type: "Restaurant & Bar",
      rating: 4.5,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/bartaco.jpg`,
      coordinates: [-71.0945, 42.3474],
      distance: "3.7 mi",
      payAtVenue: true
    },
    { 
      id: "jp-licks",
      name: "J.P. Licks Newbury",
      location: "Back Bay, Boston",
      type: "Restaurant",
      rating: 4.7,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/jplicks.jpg`,
      coordinates: [-71.0784, 42.3489],
      distance: "4.7 mi",
      payAtVenue: true
    },
    { 
      id: "fuji-ink-block",
      name: "Fuji at Ink Block",
      location: "South End, Boston",
      type: "Restaurant",
      rating: 4.5,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/fuji.jpg`,
      coordinates: [-71.0614, 42.3445],
      distance: "5.1 mi",
      payAtVenue: true
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
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/museum.jpg`,
      stripeLink: "https://buy.stripe.com/aEU8yV7yM5RP8yA3ce",
      coordinates: [-71.0995, 42.3394],
      distance: "3.6 mi"
    },
    { 
      id: "boston-commons",
      name: "Boston Commons",
      location: "Boston, MA",
      type: "Park",
      rating: 4.7,
      price: "$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/commons.jpg`,
      stripeLink: "https://buy.stripe.com/28o6qN3iwfsp3eg4gz",
      coordinates: [-71.0640, 42.3554],
      distance: "5.5 mi"
    },
    { 
      id: "house-of-blues",
      name: "House of Blues",
      location: "Boston, MA",
      type: "Music Venue",
      rating: 4.6,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/houseofblues.jpg`,
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0945, 42.3474],
      distance: "3.7 mi"
    },
    { 
      id: "core-power",
      name: "Core Power",
      location: "Newton, MA",
      type: "Fitness",
      price: "$$",
      rating: 4.7,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/corepower.jpg`,
      stripeLink: "https://buy.stripe.com/bIY16tcT6a85g1214k",
      coordinates: [-71.1921, 42.3485],
      distance: "2.8 mi",
      requiresWebsiteRegistration: true,
      websiteUrl: "https://www.corepoweryoga.com/yoga-studios/massachusetts/newton/305-centre-street"
    },
    { 
      id: "solidcore",
      name: "[solidcore]",
      location: "Watertown, MA",
      type: "Fitness",
      price: "$$",
      rating: 4.8,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/solidcore.jpg`,
      stripeLink: "https://buy.stripe.com/aEUeXj5qE7ZXbKM9AP",
      coordinates: [-71.1561, 42.3644],
      distance: "1.5 mi",
      requiresWebsiteRegistration: true,
      websiteUrl: "https://www.solidcore.co/location/watertown"
    },
    { 
      id: "private-helicopter-ride",
      name: "Private Helicopter Ride",
      location: "Boston, MA",
      type: "Adventure",
      price: "$$$$",
      rating: 4.9,
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/helicopter.jpg`,
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
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/f1arcade.jpg`,
      stripeLink: "https://buy.stripe.com/9AQg1n1ao6VTeWY28l",
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
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/clayroom.jpg`,
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
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/ducktour.jpg`,
      stripeLink: "https://buy.stripe.com/14k9CZbP20xv7uw28j",
      coordinates: [-71.0737, 42.3587],
      distance: "5.0 mi"
    },
    { 
      id: "faneuil-hall",
      name: "Faneuil Hall",
      location: "Boston, MA",
      type: "Shopping & Entertainment",
      rating: 4.6,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/faneuilhall.jpg`,
      stripeLink: "https://buy.stripe.com/9AQ8yV06kcgd3eg9AU",
      coordinates: [-71.0556, 42.3601],
      distance: "5.7 mi"
    },
    { 
      id: "escape-room",
      name: "Escape Room",
      location: "Boston, MA",
      type: "Entertainment",
      rating: 4.7,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/escaperoom.jpg`,
      stripeLink: "https://buy.stripe.com/dR602pf1e4NLcOQ7sN",
      coordinates: [-71.0639, 42.3524],
      distance: "5.4 mi"
    },
    { 
      id: "barrys-bootcamp",
      name: "Barry's Bootcamp",
      location: "Chestnut Hill, MA",
      type: "Fitness",
      rating: 4.8,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/barrys.jpg`,
      stripeLink: "https://buy.stripe.com/00g7uR1ao941dSUfZm",
      coordinates: [-71.1654, 42.3279],
      distance: "0.3 mi"
    },
    { 
      id: "puttshack",
      name: "Puttshack Seaport",
      location: "Seaport, Boston",
      type: "Entertainment",
      rating: 4.6,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/puttshack.jpg`,
      stripeLink: "https://buy.stripe.com/fZe8yV6uI5RPcOQcN9",
      coordinates: [-71.0434, 42.3519],
      distance: "6.3 mi"
    },
    { 
      id: "view-boston",
      name: "View Boston",
      location: "Back Bay, Boston",
      type: "Entertainment",
      rating: 4.7,
      price: "$$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/viewboston.jpg`,
      stripeLink: "https://buy.stripe.com/14k8yV1ao1Bz7uwcN8",
      coordinates: [-71.0817, 42.3474],
      distance: "4.5 mi"
    }
  ],
  outdoors: []
};

const DEFAULT_AVATAR = '/images/default-avatar.png';

const getCleanAvatarUrl = (url: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  
  // If it's a full Supabase URL, clean it
  if (url.includes('supabase.co')) {
    // Extract the path after 'avatars/'
    const match = url.match(/avatars\/(.+?)(?:\?|$)/);
    if (match) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${match[1]}`;
    }
  }
  
  // If it's a relative path, clean and construct URL
  const cleanPath = url.replace(/^avatars\/+/, '');
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${cleanPath}`;
};

const categories = [
  { id: 'all', label: 'All' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'sports', label: 'Sports' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'activities', label: 'Activities' },
  { id: 'events', label: 'Events' }
];

const dateOptions = [
  {
    id: 1,
    title: "Boston Bruins",
    description: "Watch the Bruins take on their rivals at TD Garden",
    stripeLink: "https://buy.stripe.com/00gg1ng5i1BzeWY6os",
  },
  {
    id: 2,
    title: "Celtics",
    description: "Experience the excitement of NBA basketball at TD Garden",
    stripeLink: "https://buy.stripe.com/5kA8yVf1e0xvg12eV0",
  },
  {
    id: 3,
    title: "BC Hockey",
    description: "Cheer on the Eagles at Conte Forum",
    stripeLink: "https://buy.stripe.com/bIYcPb3iw6VT5mobIN",
  },
  {
    id: 4,
    title: "BC Basketball",
    description: "Support BC Basketball at Conte Forum",
    stripeLink: "https://buy.stripe.com/fZebL7bP24NL9CE9AB",
  },
  {
    id: 5,
    title: "Barcelona Wine Bar",
    description: "Share tapas and wine in a cozy atmosphere",
    stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
  },
  {
    id: 6,
    title: "Capo",
    description: "Enjoy upscale Italian dining in South Boston",
    stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
  },
  {
    id: 7,
    title: "Lucca North End",
    description: "Experience fine Italian dining in the North End",
    stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
  },
  {
    id: 8,
    title: "Blue Ribbon Sushi",
    description: "Savor premium sushi in a modern setting",
    stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
  },
  {
    id: 9,
    title: "Lolita Back Bay",
    description: "Modern Mexican cuisine in a vibrant atmosphere",
    stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
  },
  {
    id: 10,
    title: "Joes on Newbury",
    description: "Classic American dining on iconic Newbury Street",
    stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
  },
  {
    id: 11,
    title: "Kured",
    description: "Artisanal charcuterie and wine experience. Note: Available 11 AM - 4 PM",
    stripeLink: "https://buy.stripe.com/9AQg1n1ao6VTeWY28l"
  },
  {
    id: 12,
    title: "F1 Arcade",
    description: "Racing simulation and arcade games",
    stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
  },
  {
    id: 13,
    title: "Museum of Fine Arts",
    description: "Explore world-class art collections",
    stripeLink: "https://buy.stripe.com/aEU8yV7yM5RP8yA3ce",
  },
  {
    id: 14,
    title: "Private Helicopter Ride",
    description: "See Boston from above on a private tour",
    stripeLink: "https://buy.stripe.com/14k2ax7yM0xv6qs8wz",
  },
  {
    id: 15,
    title: "Boston Commons",
    description: "Picnic and activities in America's oldest park",
    stripeLink: "https://buy.stripe.com/28o6qN3iwfsp3eg4gz",
  },
  {
    id: 16,
    title: "The Clay Room",
    description: "Get creative with pottery painting",
    stripeLink: "https://buy.stripe.com/00g8yVaKYgwt4ikaEO",
  },
  {
    id: 17,
    title: "Boston Duck Tour",
    description: "Tour Boston by land and water",
    stripeLink: "https://buy.stripe.com/14k9CZbP20xv7uw28j",
  },
  {
    id: 18,
    title: "Loretta's Last Call",
    description: "Country music bar with live bands and Southern comfort food",
    stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
  },
  {
    id: 19,
    title: "Cityside Tavern",
    description: "Casual American dining with sports viewing in Brighton",
    stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
  },
  {
    id: 20,
    title: "Core Power",
    description: "High-intensity yoga classes in a modern studio setting. Note: Class registration required through Core Power website.",
    stripeLink: "https://buy.stripe.com/bIY16tcT6a85g1214k",
    requiresWebsiteRegistration: true,
    websiteUrl: "https://www.corepoweryoga.com/yoga-studios/massachusetts/newton/305-centre-street"
  },
  {
    id: 21,
    title: "[solidcore]",
    description: "High-intensity, low-impact strength training workouts. Note: Class registration required through [solidcore] website.",
    stripeLink: "https://buy.stripe.com/aEUeXj5qE7ZXbKM9AP",
    requiresWebsiteRegistration: true,
    websiteUrl: "https://www.solidcore.co/location/watertown"
  },
  {
    id: 22,
    title: "Barry's Bootcamp",
    description: "High-intensity interval training in a high-energy atmosphere",
    stripeLink: "https://buy.stripe.com/00g7uR1ao941dSUfZm"
  },
  {
    id: 23,
    title: "Puttshack Seaport",
    description: "High-tech mini golf experience with food and drinks",
    stripeLink: "https://buy.stripe.com/fZe8yV6uI5RPcOQcN9"
  },
  {
    id: 24,
    title: "View Boston",
    description: "360-degree views of Boston from the Prudential Center observation deck",
    stripeLink: "https://buy.stripe.com/14k8yV1ao1Bz7uwcN8"
  },
  {
    id: 25,
    title: "Long Bar & Terrace",
    description: "Sophisticated bar and lounge with craft cocktails and small plates. Note: 21+ only, available after 8 PM",
    payAtVenue: true
  },
  {
    id: 26,
    title: "SweetGreen",
    description: "Fresh, seasonal salads and grain bowls in a modern setting",
    payAtVenue: true
  },
  {
    id: 27,
    title: "Pressed Cafe",
    description: "Fresh sandwiches, smoothies, and coffee in a casual atmosphere",
    payAtVenue: true
  },
  {
    id: 28,
    title: "Popup Bagel",
    description: "Artisanal bagels and creative spreads in the Seaport",
    payAtVenue: true
  },
  {
    id: 29,
    title: "Serafina Seaport",
    description: "Upscale Italian dining with waterfront views",
    payAtVenue: true
  },
  {
    id: 30,
    title: "White Mountain",
    description: "Classic creamery serving homemade ice cream and comfort food",
    payAtVenue: true
  },
  {
    id: 31,
    title: "Boston Burger Company",
    description: "Creative burgers and shakes in a casual setting",
    payAtVenue: true
  },
  {
    id: 32,
    title: "Lola 42",
    description: "Global cuisine with Japanese influence in a sleek setting",
    payAtVenue: true
  },
  {
    id: 33,
    title: "Bartaco Fenway",
    description: "Upscale street food and craft cocktails in a coastal atmosphere",
    payAtVenue: true
  },
  {
    id: 34,
    title: "J.P. Licks Newbury",
    description: "Homemade ice cream and coffee in a charming Back Bay location",
    payAtVenue: true
  },
  {
    id: 35,
    title: "Fuji at Ink Block",
    description: "Contemporary Japanese cuisine and sushi in a stylish South End setting",
    payAtVenue: true
  }
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
        if (data) {
          // Process the avatar URL before setting the profile
          setProfile({
            ...data,
            avatar_url: getCleanAvatarUrl(data.avatar_url)
          });
        }
        
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
                src={profile.avatar_url}
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