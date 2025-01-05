export interface Venue {
  name: string;
  location: string;
  type: string;
  rating: number;
  imageUrl: string;
  coordinates: [number, number];
  distance?: string;
  price?: string;
  stripeLink?: string;
} 