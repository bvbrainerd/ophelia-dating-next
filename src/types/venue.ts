export interface Venue {
  name: string;
  location: string;
  type: string;
  rating: number;
  price: string;
  imageUrl: string;
  coordinates: [number, number];
  distance: string;
  stripeLink?: string;
} 