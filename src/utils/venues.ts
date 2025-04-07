import { Venue } from '@/types/venue';

const defaultPaymentSystem = {
  provider: 'stripe' as const,
  merchantId: 'default',
  apiEndpoint: 'https://api.stripe.com/v1',
  publicKey: process.env.NEXT_PUBLIC_STRIPE_KEY
};

const defaultReservationSystem = {
  provider: 'direct' as const,
  apiEndpoint: 'https://api.ophelia.dating/reservations',
  merchantId: 'default',
  availabilityEndpoint: 'https://api.ophelia.dating/availability'
};

const defaultPricingModel = {
  type: 'fixed' as const,
  basePrice: 0,
  percentageRate: 0,
  minimumCharge: 0
};

const defaultRealTimeFeatures = {
  supportsLiveBill: false,
  supportsSplitPayments: false,
  supportsTableStatus: false,
  supportsOrderTracking: false
};

type BaseVenue = Omit<Venue, 'paymentSystem' | 'reservationSystem' | 'pricingModel' | 'realTimeFeatures'>;

const createVenue = (venue: BaseVenue): Venue => ({
  ...venue,
  paymentSystem: defaultPaymentSystem,
  reservationSystem: defaultReservationSystem,
  pricingModel: defaultPricingModel,
  realTimeFeatures: defaultRealTimeFeatures
});

export const VENUES: Record<string, Venue[]> = {
  sports: [
    { 
      id: "bc-lacrosse",
      name: "BC Lacrosse",
      location: "Chestnut Hill, MA",
      type: "Sports",
      rating: 4.7,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/bclacrosse.jpg",
      stripeLink: "https://buy.stripe.com/fZeg1nbP2gwtaGI14l",
      coordinates: [-71.1677, 42.3357] as [number, number],
      distance: "4.2 mi"
    },
    { 
      id: "boston-bruins",
      name: "Boston Bruins",
      location: "TD Garden",
      type: "Sports",
      rating: 4.7,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/bruins.jpg",
      stripeLink: "https://buy.stripe.com/00gg1ng5i1BzeWY6os",
      coordinates: [-71.0622, 42.3663] as [number, number],
      distance: "5.8 mi"
    },
    {
      id: "bc-basketball",
      name: "BC Basketball",
      location: "Conte Forum, Chestnut Hill",
      type: "Sports",
      rating: 4.6,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/bcbasketball.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.1677, 42.3357] as [number, number],
      distance: "4.2 mi"
    },
    {
      id: "celtics",
      name: "Celtics",
      location: "TD Garden",
      type: "Sports",
      rating: 4.8,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/celtics.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0622, 42.3663] as [number, number],
      distance: "5.8 mi"
    }
  ].map(createVenue),
  cafes: [
    {
      id: "south-end-buttery",
      name: "South End Buttery",
      location: "314 Shawmut Ave, Boston, MA 02118",
      type: "Cafe/Restaurant",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/southendbuttery.jpg",
      coordinates: [-71.0724, 42.3434] as [number, number],
      distance: "1.5 mi",
      payAtVenue: true
    },
    {
      id: "blank-street-coffee",
      name: "Blank Street Coffee",
      location: "97 Charles St, Boston, MA 02114",
      type: "Cafe",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/blankstreetcoffee.jpg",
      coordinates: [-71.0705, 42.3564] as [number, number],
      distance: "0.8 mi",
      payAtVenue: true
    },
    {
      id: "phin-coffee-house",
      name: "Phin Coffee House",
      location: "10 High St, Boston, MA 02110",
      type: "Cafe",
      rating: 4.6,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/phincoffeehouse.jpg",
      coordinates: [-71.0534, 42.3557] as [number, number],
      distance: "1.2 mi",
      payAtVenue: true
    },
    {
      id: "george-howell-coffee",
      name: "George Howell Coffee",
      location: "505 Washington St, Boston, MA 02111",
      type: "Cafe",
      rating: 4.7,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/georgehowellcoffee.jpg",
      coordinates: [-71.0589, 42.3575] as [number, number],
      distance: "1.0 mi",
      payAtVenue: true
    },
    {
      id: "brickstreet-bagels",
      name: "Brickstreet Bagels",
      location: "312 Shawmut Ave, Boston, MA 02118",
      type: "Cafe",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/brickstreetbagels.jpg",
      coordinates: [-71.0724, 42.3434] as [number, number],
      distance: "1.5 mi",
      payAtVenue: true
    },
    {
      id: "farmers-horse-coffee",
      name: "Farmers Horse Coffee",
      location: "374 Massachusetts Ave, Boston, MA 02115",
      type: "Cafe",
      rating: 4.6,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/farmershorsecoffee.jpg",
      coordinates: [-71.0849, 42.3419] as [number, number],
      distance: "0.9 mi",
      payAtVenue: true
    },
    {
      id: "greystone-cafe",
      name: "Greystone Cafe",
      location: "123 Appleton St, Boston, MA 02116",
      type: "Cafe",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/greystonecafe.jpg",
      coordinates: [-71.0724, 42.3467] as [number, number],
      distance: "1.1 mi",
      payAtVenue: true
    },
    {
      id: "mike-and-mattys",
      name: "Mike & Matty's",
      location: "12 Church St, Boston, MA 02116",
      type: "Cafe/Restaurant",
      rating: 4.7,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/mikeandpattys.jpg",
      coordinates: [-71.0669, 42.3489] as [number, number],
      distance: "1.3 mi",
      payAtVenue: true
    }
  ].map(createVenue),
  restaurants: [
    createVenue({
      id: "buttermilk-and-bourbon",
      name: "Buttermilk & Bourbon",
      location: "160 Commonwealth Ave, Boston, MA 02116",
      type: "Restaurant",
      rating: 4.7,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/buttermilkandbourbon.jpg",
      coordinates: [-71.0754, 42.3520] as [number, number],
      distance: "1.2 mi",
      payAtVenue: true
    }),
    {
      id: "barcelona-wine-bar",
      name: "Barcelona Wine Bar",
      location: "525 Tremont St, Boston, MA 02116",
      type: "Restaurant/Bar",
      rating: 4.8,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/barcelona.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0761, 42.3457] as [number, number],
      distance: "1.8 mi"
    },
    {
      id: "capo",
      name: "Capo",
      location: "443 W Broadway, Boston, MA 02127",
      type: "Restaurant/Bar",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/capo.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0472, 42.3359] as [number, number],
      distance: "2.5 mi"
    },
    {
      id: "blue-ribbon-sushi",
      name: "Blue Ribbon Sushi",
      location: "Kenmore Square",
      type: "restaurant",
      rating: 4.7,
      price: "$$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/blueribbon.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0594, 42.3551] as [number, number],
      distance: "1.9 mi"
    },
    {
      id: "lolita-back-bay",
      name: "Lolita Back Bay",
      location: "271 Dartmouth St, Boston, MA 02116",
      type: "Restaurant/Bar",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/lolitabackbay.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0816, 42.3486] as [number, number],
      distance: "1.5 mi"
    },
    {
      id: "joes-on-newbury",
      name: "Joe's on Newbury",
      location: "181 Newbury St, Boston, MA 02116",
      type: "Restaurant",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/joes.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0793, 42.3491] as [number, number],
      distance: "1.2 mi"
    },
    {
      id: "lucca-north-end",
      name: "Lucca North End",
      location: "226 Hanover St, Boston, MA 02113",
      type: "Restaurant",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/lucca.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0567, 42.3647] as [number, number],
      distance: "1.5 mi"
    },
    {
      id: "kava",
      name: "Kava",
      location: "315 Shawmut Ave, Boston, MA 02118",
      type: "Restaurant",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/kava.jpg",
      coordinates: [-71.0724, 42.3434] as [number, number],
      distance: "1.5 mi",
      payAtVenue: true
    },
    {
      id: "moo",
      name: "Moo",
      location: "49 Melcher St, Boston, MA 02210",
      type: "Restaurant",
      rating: 4.8,
      price: "$$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/moo.jpg",
      coordinates: [-71.0519, 42.3512] as [number, number],
      distance: "2.0 mi",
      payAtVenue: true
    },
    {
      id: "carmelinas",
      name: "Carmelina's",
      location: "307 Hanover St, Boston, MA 02113",
      type: "Restaurant",
      rating: 4.7,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/carmelinas.jpg",
      coordinates: [-71.0534, 42.3637] as [number, number],
      distance: "1.8 mi",
      payAtVenue: true
    },
    {
      id: "trattoria-il-panino",
      name: "Trattoria Il Panino",
      location: "280 Hanover St, Boston, MA 02113",
      type: "Restaurant",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/trattoriailpanino.jpg",
      coordinates: [-71.0534, 42.3637] as [number, number],
      distance: "1.8 mi",
      payAtVenue: true
    },
    {
      id: "krasi",
      name: "Krasi",
      location: "48 Gloucester Street, Boston, MA 02115",
      type: "Restaurant",
      rating: 4.7,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/krasi.jpg",
      coordinates: [-71.0824, 42.3489] as [number, number],
      distance: "1.4 mi",
      payAtVenue: true
    },
    {
      id: "mida",
      name: "Mida",
      location: "1391 Boylston St, Boston, MA 02215",
      type: "Restaurant",
      rating: 4.7,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/mida.jpg",
      coordinates: [-71.0994, 42.3434] as [number, number],
      distance: "2.2 mi",
      payAtVenue: true
    },
    {
      id: "coquette",
      name: "Coquette",
      location: "450 Summer St, Boston, MA 02210",
      type: "Restaurant",
      rating: 4.7,
      price: "$$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/coquette.jpg",
      coordinates: [-71.0434, 42.3489] as [number, number],
      distance: "2.5 mi",
      payAtVenue: true
    },
    {
      id: "boston-burger",
      name: "Boston Burger",
      location: "1100 Boylston St, Boston, MA 02215",
      type: "Restaurant",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/bostonburger.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0947, 42.3474] as [number, number],
      distance: "1.9 mi"
    },
    {
      id: "branchline",
      name: "Branch Line",
      location: "321 Arsenal St, Watertown, MA 02472",
      type: "Restaurant",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/branchline.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.1639, 42.3643] as [number, number],
      distance: "4.5 mi"
    },
    {
      id: "capital-grille",
      name: "Capital Grille",
      location: "900 Boylston St, Boston, MA 02115",
      type: "Restaurant",
      rating: 4.7,
      price: "$$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/capitalgrille.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0827, 42.3482] as [number, number],
      distance: "1.6 mi"
    },
    {
      id: "grill-23",
      name: "Grill 23",
      location: "161 Berkeley St, Boston, MA 02116",
      type: "Restaurant",
      rating: 4.7,
      price: "$$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/grill23.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0734, 42.3489] as [number, number],
      distance: "1.2 mi"
    },
    {
      id: "serafina",
      name: "Serafina",
      location: "237 Newbury St, Boston, MA 02116",
      type: "Restaurant",
      rating: 4.5,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/serafina.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0824, 42.3489] as [number, number],
      distance: "1.4 mi"
    },
    {
      id: "fuji-at-ink-block",
      name: "Fuji at Ink Block",
      location: "300 Harrison Ave, Boston, MA 02118",
      type: "Restaurant",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/fujiatinkblock.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0724, 42.3434] as [number, number],
      distance: "1.5 mi"
    },
    {
      id: "loco-taqueria",
      name: "Loco Taqueria",
      location: "412 W Broadway, Boston, MA 02127",
      type: "Restaurant/Bar",
      rating: 4.6,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/loco.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0472, 42.3359] as [number, number],
      distance: "2.5 mi"
    },
    {
      id: "lola-42",
      name: "Lola 42",
      location: "22 Liberty Dr, Boston, MA 02210",
      type: "Restaurant",
      rating: 4.5,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/lola42.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0472, 42.3512] as [number, number],
      distance: "2.5 mi"
    },
    {
      id: "parla",
      name: "Parla",
      location: "230 Hanover St, Boston, MA 02113",
      type: "Restaurant/Bar",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/parla.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0534, 42.3637] as [number, number],
      distance: "1.8 mi"
    },
    {
      id: "levain-bakery",
      name: "Levain Bakery",
      location: "180 Newbury St, Boston, MA 02116",
      type: "Cafe/Restaurant",
      rating: 4.8,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/levain.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0793, 42.3491] as [number, number],
      distance: "1.2 mi"
    },
    {
      id: "lincoln-tavern",
      name: "Lincoln Tavern",
      location: "425 W Broadway, Boston, MA 02127",
      type: "Restaurant/Bar",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/lincoln.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0472, 42.3359] as [number, number],
      distance: "2.5 mi"
    },
    {
      id: "white-mountain-creamery",
      name: "White Mountain Creamery",
      location: "19 Commonwealth Ave, Chestnut Hill, MA 02467",
      type: "Cafe",
      rating: 4.7,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/whitemountain.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.1677, 42.3357] as [number, number],
      distance: "4.2 mi"
    },
    {
      id: "tatte",
      name: "Tatte Bakery & Cafe",
      location: "399 Boylston St, Boston, MA 02116",
      type: "Cafe/Restaurant",
      rating: 4.6,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/tatte.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.1923, 42.3278] as [number, number],
      distance: "5.2 mi"
    },
    {
      id: "sweetgreen",
      name: "Sweetgreen",
      location: "659 Boylston St, Boston, MA 02116",
      type: "Restaurant",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/sweetgreen.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0827, 42.3482] as [number, number],
      distance: "1.6 mi"
    },
    {
      id: "jp-licks",
      name: "JP Licks",
      location: "150 Charles St, Boston, MA 02114",
      type: "Cafe",
      rating: 4.7,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/jplicks.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0705, 42.3564] as [number, number],
      distance: "0.8 mi"
    },
    {
      id: "kured",
      name: "Kured",
      location: "83 Charles St, Boston, MA 02114",
      type: "Restaurant",
      rating: 4.7,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/kured.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0712, 42.3589] as [number, number],
      distance: "0.8 mi"
    }
  ].map(createVenue),
  bars: [
    createVenue({
      id: "cityside-tavern",
      name: "Cityside Tavern",
      location: "1960 Beacon St, Brighton, MA 02135",
      type: "Bar",
      rating: 4.4,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/cityside.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.1502, 42.3359] as [number, number],
      distance: "4.2 mi"
    }),
    {
      id: "lorettas-last-call",
      name: "Loretta's Last Call",
      location: "1 Lansdowne St, Boston, MA 02215",
      type: "Bar",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/lorettas.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0950, 42.3467] as [number, number],
      distance: "2.8 mi"
    },
    {
      id: "bell-in-hand",
      name: "Bell in Hand",
      location: "45 Union St, Boston, MA 02108",
      type: "Bar",
      rating: 4.4,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/bellinhand.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0576, 42.3614] as [number, number],
      distance: "1.8 mi"
    },
    {
      id: "bartaco",
      name: "Bartaco",
      location: "25 Thomson Pl, Boston, MA 02210",
      type: "Restaurant/Bar",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/bartaco.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0472, 42.3512] as [number, number],
      distance: "2.2 mi"
    },
    {
      id: "city-tap",
      name: "City Tap",
      location: "374 Congress St, Boston, MA 02210",
      type: "Bar",
      rating: 4.4,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/citytap.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0472, 42.3512] as [number, number],
      distance: "2.5 mi"
    },
    {
      id: "clerys",
      name: "Clerys",
      location: "113 Dartmouth St, Boston, MA 02116",
      type: "Bar",
      rating: 4.3,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/clerys.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0752, 42.3467] as [number, number],
      distance: "1.2 mi"
    },
    {
      id: "cask-n-flagon",
      name: "Cask 'n Flagon",
      location: "62 Brookline Ave, Boston, MA 02215",
      type: "Bar",
      rating: 4.4,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/caskflagon.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0950, 42.3467] as [number, number],
      distance: "2.8 mi"
    },
    {
      id: "the-harp",
      name: "The Harp",
      location: "85 Causeway St, Boston, MA 02114",
      type: "Bar",
      rating: 4.4,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/theharp.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0614, 42.3651] as [number, number],
      distance: "1.9 mi"
    },
    {
      id: "west-end-johnnies",
      name: "West End Johnnie's",
      location: "138 Portland St, Boston, MA 02114",
      type: "Bar",
      rating: 4.3,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/westendjohnnies.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0614, 42.3651] as [number, number],
      distance: "1.9 mi"
    },
    {
      id: "scholars",
      name: "Scholars",
      location: "25 School St, Boston, MA 02108",
      type: "Bar",
      rating: 4.4,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/scholars.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0589, 42.3574] as [number, number],
      distance: "1.5 mi"
    },
    {
      id: "the-burren",
      name: "The Burren",
      location: "247 Elm St, Somerville, MA 02144",
      type: "Bar",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/theburren.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.1223, 42.3947] as [number, number],
      distance: "3.5 mi"
    },
    {
      id: "stats-bar",
      name: "Stats Bar & Grille",
      location: "77 Dorchester St, Boston, MA 02127",
      type: "Bar",
      rating: 4.4,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/stats.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0472, 42.3359] as [number, number],
      distance: "2.5 mi"
    },
    {
      id: "lucky-lounge",
      name: "Lucky's Lounge",
      location: "355 Congress St, Boston, MA 02210",
      type: "Bar",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/luckyslounge.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0497, 42.3512] as [number, number],
      distance: "2.2 mi"
    },
    {
      id: "lansdowne-pub",
      name: "Lansdowne Pub",
      location: "9 Lansdowne St, Boston, MA 02215",
      type: "Bar",
      rating: 4.3,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/lansdowne.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0947, 42.3474] as [number, number],
      distance: "2.8 mi"
    },
    {
      id: "hunters-kitchen-bar",
      name: "Hunter's Kitchen & Bar",
      location: "110 Dorchester St, Boston, MA 02127",
      type: "Bar",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/hunters.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0472, 42.3359] as [number, number],
      distance: "2.5 mi"
    },
    {
      id: "greatest-bar",
      name: "Greatest Bar",
      location: "49 Melcher St, Boston, MA 02210",
      type: "Bar",
      rating: 4.5,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/greateastbar.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0519, 42.3512] as [number, number],
      distance: "2.0 mi"
    }
  ].map(createVenue),
  activities: [
    createVenue({ 
      id: "museum-of-fine-arts",
      name: "Museum of Fine Arts",
      location: "Boston, MA",
      type: "Culture",
      rating: 4.8,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/mfa.jpg",
      stripeLink: "https://buy.stripe.com/aEU8yV7yM5RP8yA3ce",
      coordinates: [-71.0942, 42.3394] as [number, number],
      distance: "3.6 mi"
    }),
    {
      id: "museum-of-ice-cream",
      name: "Museum of Ice Cream",
      location: "121 Seaport Blvd, Boston, MA 02210",
      type: "Museum/Activity",
      rating: 4.7,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/museumoficecream.jpg",
      stripeLink: "https://buy.stripe.com/dR602pg5idkhaGI4gG",
      coordinates: [-71.0436, 42.3512] as [number, number],
      distance: "2.8 mi",
      restrictions: "Only available Friday-Sunday 10-11:30 AM, must book a week in advance"
    },
    {
      id: "wndr-museum",
      name: "WNDR Museum",
      location: "500 Washington St, Boston, MA 02111",
      type: "Museum/Activity",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/wndrmuseum.jpg",
      stripeLink: "https://buy.stripe.com/5kA02p2es9419CEeVl",
      coordinates: [-71.0589, 42.3574] as [number, number],
      distance: "1.9 mi",
      restrictions: "Only available Friday-Sunday 10-11:30 AM, must book a week in advance"
    },
    {
      id: "madelines-candy-shop",
      name: "Madeline's Candy Shop",
      location: "1 South Market Street, Boston, MA 02109",
      type: "Activity",
      rating: 4.6,
      price: "$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/madelinescandy.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0734, 42.3476] as [number, number],
      distance: "1.2 mi",
      restrictions: "Closed on Mondays"
    },
    {
      id: "private-helicopter-ride",
      name: "Private Helicopter Ride",
      location: "150 Marginal St, East Boston, MA 02128",
      type: "Activity",
      rating: 4.9,
      price: "$$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/helicopter.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0217, 42.3656] as [number, number],
      distance: "2.8 mi"
    },
    {
      id: "boston-duck-tour",
      name: "Boston Duck Tour",
      location: "4 Copley Place, Boston, MA 02116",
      type: "Activity",
      rating: 4.7,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/ducktour.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0737, 42.3587] as [number, number],
      distance: "1.0 mi"
    },
    {
      id: "f1-arcade",
      name: "F1 Arcade",
      location: "1 Hamilton Place, Boston, MA 02108",
      type: "Activity",
      rating: 4.6,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/f1arcade.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0595, 42.3501] as [number, number],
      distance: "1.5 mi"
    },
    {
      id: "solidcore",
      name: "Solidcore",
      location: "283 Summer St, Boston, MA 02210",
      type: "Fitness",
      rating: 4.7,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/solidcore.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0497, 42.3512] as [number, number],
      distance: "2.2 mi"
    },
    {
      id: "corepower",
      name: "CorePower Yoga",
      location: "36 Arlington St, Boston, MA 02116",
      type: "Fitness",
      rating: 4.6,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/corepower.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0704, 42.3521] as [number, number],
      distance: "1.1 mi"
    },
    {
      id: "puttshack",
      name: "Puttshack",
      location: "58 Seaport Blvd Suite 300, Boston, MA 02210",
      type: "Activity",
      rating: 4.6,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/puttshack.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0472, 42.3512] as [number, number],
      distance: "2.5 mi"
    },
    {
      id: "escape-room",
      name: "Escape Room",
      location: "33 West St, Boston, MA 02111",
      type: "Activity",
      rating: 4.7,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/escaperoom.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0612, 42.3548] as [number, number],
      distance: "1.3 mi"
    },
    {
      id: "view-boston",
      name: "View Boston",
      location: "800 Boylston St, Boston, MA 02199",
      type: "Activity",
      rating: 4.8,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/viewboston.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0817, 42.3486] as [number, number],
      distance: "1.5 mi"
    },
    {
      id: "clay-room",
      name: "The Clay Room",
      location: "1408 Beacon St, Brookline, MA 02446",
      type: "Activity",
      rating: 4.8,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/clayroom.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.1317, 42.3396] as [number, number],
      distance: "3.5 mi"
    },
    {
      id: "barrys",
      name: "Barry's",
      location: "30 Gloucester St, Boston, MA 02115",
      type: "Fitness",
      rating: 4.8,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/barrys.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0824, 42.3489] as [number, number],
      distance: "1.4 mi"
    },
    {
      id: "house-of-blues",
      name: "House of Blues",
      location: "15 Lansdowne St, Boston, MA 02215",
      type: "Entertainment",
      rating: 4.5,
      price: "$$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/houseofblues.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0947, 42.3474] as [number, number],
      distance: "2.8 mi"
    },
    {
      id: "faneuil-hall",
      name: "Faneuil Hall",
      location: "4 South Market Street, Boston, MA 02109",
      type: "Activity",
      rating: 4.6,
      price: "$$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/faneuilhall.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0556, 42.3601] as [number, number],
      distance: "1.7 mi"
    },
    {
      id: "boston-commons",
      name: "Boston Commons",
      location: "139 Tremont St, Boston, MA 02111",
      type: "Activity",
      rating: 4.8,
      price: "$",
      imageUrl: "https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/commons.jpg",
      stripeLink: "https://buy.stripe.com/bIYeXj06k7ZX2acfZc",
      coordinates: [-71.0670, 42.3554] as [number, number],
      distance: "1.0 mi"
    }
  ].map(createVenue)
};

interface VenueMap {
  hopelessRomantic: string[];
  cautiousDater: string[];
  serialDater: string[];
  commitmentSeeker: string[];
  friendWithBenefits: string[];
}

const venues: VenueMap = {
  hopelessRomantic: ['Barcelona Wine Bar', 'Museum of Fine Arts', 'Blue Ribbon Sushi', 'Boston Common', "Madeline's Candy Shop"],
  cautiousDater: ['Cityside', 'Kured', "Joe's On Newbury", 'The Clay Room', 'Tatte'],
  serialDater: ['TD Garden - Bruins', 'BC Basketball', 'F1 Boston', 'Lolita Back Bay', 'Tatte'],
  commitmentSeeker: ['TD Garden - Celtics', 'Lucca', 'Barcelona Wine Bar', "Madeline's Candy Shop"],
  friendWithBenefits: ['Capo', 'TD Garden - Bruins', 'F1 Boston', 'Cityside', 'Tatte']
};

export const getVenueForArchetype = (archetype: string): string[] => {
  // For sports enthusiasts, mix in sports venues
  if (archetype === 'serialDater' || archetype === 'commitmentSeeker' || archetype === 'friendWithBenefits') {
    const sportsVenues = ['TD Garden - Celtics'];
    const baseVenues = venues[archetype as keyof VenueMap] || venues.commitmentSeeker;
    return Array.from(new Set([...baseVenues, ...sportsVenues.slice(0, 2)]));
  }
  
  // For casual daters, mix in casual dining options
  if (archetype === 'cautiousDater' || archetype === 'hopelessRomantic') {
    const casualVenues = ['Cityside', 'Barcelona Wine Bar', 'Capo'];
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
  'Cityside': [-71.1502, 42.3359],
  "Loretta's Last Call": [-71.0950, 42.3467],
  'BC Basketball': [-71.1677, 42.3357],
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
  'Private Helicopter Ride': [-71.0217, 42.3656],
  'Boston Duck Tours': [-71.0737, 42.3587],
  "Madeline's Candy Shop": [-71.0734, 42.3476],
  'Tatte': [-71.1923, 42.3278],
  'The Greatest Bar': [-71.0519, 42.3512]
};

export const getVenueCoordinates = (venueName: string): [number, number] => {
  return venueCoordinates[venueName] || [-71.0589, 42.3601]; // Default to Boston center
}; 

export const getVenueCategory = (venueName: string): string | null => {
  // Try to find the venue by exact match on ID first
  // for (const [category, venues] of Object.entries(VENUES)) {
  //   const found = venues.find(venue => venue.id === venueName);
  //   if (found) {
  //     return category;
  //   }
  // }
  
  // Then try to find by name (case insensitive)
  const searchName = venueName.toLowerCase();
  for (const [category, venues] of Object.entries(VENUES)) {
    const found = venues.find(venue => venue.name.toLowerCase() === searchName);
    if (found) {
      return category;
    }
  }
  
  return 'default'; // Return null if venue not found in any category
}