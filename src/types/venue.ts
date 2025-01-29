export interface Venue {
  id: string;
  name: string;
  location: string;
  type: string;
  rating: number;
  price: string;
  imageUrl: string;
  coordinates: [number, number];
  distance: string;
  stripeLink?: string;
  requiresWebsiteRegistration?: boolean;
  websiteUrl?: string;
  payAtVenue?: boolean;
  restrictions?: string;
} 