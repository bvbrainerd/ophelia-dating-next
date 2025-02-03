import { Venue } from '@/types/venue';

export const VENUES: Record<string, Venue[]> = {
  sports: [
    { 
      id: "bc-lacrosse",
      name: "BC Lacrosse",
      location: "Chestnut Hill, MA",
      type: "Sports",
      rating: 4.7,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/bclacrosse.jpg`,
      stripeLink: "https://buy.stripe.com/fZeg1nbP2gwtaGI14l",
      coordinates: [-71.1677, 42.3357],
      distance: "4.2 mi"
    },
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
      coordinates: [-71.0942, 42.3394],
      distance: "3.6 mi"
    },
    {
      id: "madelines-candy-shop",
      name: "Madeline's Candy Shop",
      location: "47 Clarendon St, Boston, MA 02116",
      type: "Activity",
      rating: 4.6,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/madelinescandy.jpg`,
      stripeLink: "https://buy.stripe.com/cN25mJ9GU4NL2accNb",
      coordinates: [-71.0734, 42.3476],
      distance: "2.1 mi",
      restrictions: "Closed on Mondays"
    }
  ],
  restaurants: [
    {
      id: "tatte-bakery-newton",
      name: "Tatte Bakery & Cafe",
      location: "1241 Centre St, Newton, MA 02459",
      type: "Restaurant",
      rating: 4.7,
      price: "$$",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/tatte.jpg`,
      stripeLink: "", // Add the Stripe link when available
      coordinates: [-71.1923, 42.3278],
      distance: "6.8 mi"
    }
  ]
};

interface VenueMap {
  hopelessRomantic: string[];
  cautiousDater: string[];
  serialDater: string[];
  commitmentSeeker: string[];
  friendWithBenefits: string[];
}

const venues: VenueMap = {
  hopelessRomantic: ['Barcelona Wine Bar', 'Museum of Fine Arts', 'Blue Ribbon Sushi', 'Boston Commons', 'Madeline\'s Candy Shop'],
  cautiousDater: ['Cityside Tavern', 'Kured', 'Joes on Newbury', 'The Clay Room', 'Tatte Bakery & Cafe'],
  serialDater: ['Boston Bruins', 'BC Basketball', 'F1 Arcade', 'Lolita Back Bay', 'Tatte Bakery & Cafe'],
  commitmentSeeker: ['BC Hockey', 'Celtics', 'Lucca North End', 'Barcelona Wine Bar', 'Madeline\'s Candy Shop'],
  friendWithBenefits: ['Capo', 'Boston Bruins', 'F1 Arcade', 'Cityside Tavern', 'Tatte Bakery & Cafe']
};

export const getVenueForArchetype = (archetype: string): string[] => {
  // For sports enthusiasts, mix in sports venues
  if (archetype === 'serialDater' || archetype === 'commitmentSeeker' || archetype === 'friendWithBenefits') {
    const sportsVenues = ['BC Hockey', 'BC Basketball', 'Boston Bruins', 'Celtics'];
    const baseVenues = venues[archetype as keyof VenueMap] || venues.commitmentSeeker;
    return Array.from(new Set([...baseVenues, ...sportsVenues.slice(0, 2)]));
  }
  
  // For casual daters, mix in casual dining options
  if (archetype === 'cautiousDater' || archetype === 'hopelessRomantic') {
    const casualVenues = ['Cityside Tavern', 'Barcelona Wine Bar', 'Capo'];
    const baseVenues = venues[archetype as keyof VenueMap] || venues.commitmentSeeker;
    return Array.from(new Set([...baseVenues, ...casualVenues.slice(0, 2)]));
  }
  
  return venues[archetype as keyof VenueMap] || venues.commitmentSeeker;
};

export const getVenueImagePath = (venueName: string): string => {
  // Remove spaces, hyphens, apostrophes, and special characters, convert to lowercase
  const formattedName = venueName
    .toLowerCase()
    .replace(/[\s'-]+/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venues/${formattedName}.jpg`;
};

export const venueCoordinates: Record<string, [number, number]> = {
  'Blue Ribbon Sushi': [-71.0594, 42.3551],
  'Barcelona Wine Bar': [-71.0761, 42.3457],
  'Cityside Tavern': [-71.1502, 42.3359],
  'Lorettas Last Call': [-71.0950, 42.3467],
  'BC Basketball': [-71.1677, 42.3357],
  'BC Hockey': [-71.1677, 42.3357],
  'Boston Bruins': [-71.0622, 42.3663],
  'Celtics': [-71.0622, 42.3663],
  'F1 Arcade': [-71.0595, 42.3501],
  'Museum of Fine Arts': [-71.0942, 42.3394],
  'Boston Commons': [-71.0670, 42.3554],
  'Kured': [-71.0712, 42.3589],
  'The Clay Room': [-71.1317, 42.3396],
  'Joes on Newbury': [-71.0793, 42.3491],
  'Lucca North End': [-71.0567, 42.3647],
  'Lolita Back Bay': [-71.0816, 42.3486],
  'Capo': [-71.0472, 42.3359],
  'Private Helicopter Ride': [-71.0217, 42.3656],
  'Boston Duck Tour': [-71.0737, 42.3587],
  'Madeline\'s Candy Shop': [-71.0734, 42.3476],
  'Tatte Bakery & Cafe': [-71.1923, 42.3278]
};

export const getVenueCoordinates = (venueName: string): [number, number] => {
  return venueCoordinates[venueName] || [-71.0589, 42.3601]; // Default to Boston center
}; 