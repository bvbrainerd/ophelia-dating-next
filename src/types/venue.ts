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
  category?: string;
  slug?: string;
  
  // Payment Integration
  paymentSystem: {
    provider: 'stripe' | 'square' | 'clover' | 'toast' | 'custom';
    merchantId?: string;
    apiEndpoint?: string;
    publicKey?: string;
  };
  
  // Reservation Integration
  reservationSystem: {
    provider: 'direct' | 'yelp' | 'custom';
    apiEndpoint?: string;
    merchantId?: string;
    availabilityEndpoint?: string;
  };
  
  // Dynamic Pricing
  pricingModel: {
    type: 'fixed' | 'percentage' | 'hybrid';
    basePrice?: number;
    percentageRate?: number;
    minimumCharge?: number;
  };
  
  // Real-time Integration
  realTimeFeatures: {
    supportsLiveBill: boolean;
    supportsSplitPayments: boolean;
    supportsTableStatus: boolean;
    supportsOrderTracking: boolean;
  };
}

export interface VenueIntegrationConfig {
  apiVersion: string;
  webhookEndpoint: string;
  supportedFeatures: string[];
  authType: 'oauth' | 'apiKey' | 'custom';
  pollingInterval: number;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  splitBetween: string[];
  status: 'ordered' | 'preparing' | 'served' | 'paid';
  timestamp: string;
}

export interface VenueBill {
  id: string;
  venueId: string;
  dateId: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  tip?: number;
  total: number;
  splits: {
    userId: string;
    amount: number;
    status: 'pending' | 'paid';
  }[];
  status: 'open' | 'closed' | 'processing' | 'paid';
  lastUpdated: string;
} 